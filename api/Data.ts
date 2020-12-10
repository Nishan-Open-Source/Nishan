import { v4 as uuidv4 } from 'uuid';
import { Schema, NishanArg, TDataType, TData, IOperation, Args, RepositionParams, TBlock, TParentType, ICollection, ISpace, ISpaceView, IUserRoot, UpdateCacheManuallyParam, FilterTypes, TViewFilters, ViewAggregations, ViewFormatProperties, ViewSorts, ISchemaUnit, ICollectionBlockInput, TSearchManipViewParam, TableSearchManipViewParam, ITableViewFormat, BoardSearchManipViewParam, IBoardViewFormat, GallerySearchManipViewParam, IGalleryViewFormat, CalendarSearchManipViewParam, ICalendarViewQuery2, ITimelineViewFormat, TimelineSearchManipViewParam, TViewType, ITBlock, ITView, ITSchemaUnit, TOperationTable } from "../types";
import { Operation, error } from "../utils";
import Mutations from "./Mutations";

/**
 * A class to update and control data specific stuffs
 * @noInheritDoc
 */

export default class Data<T extends TData> extends Mutations {
  id: string;
  type: TDataType;
  protected listBeforeOp: (path: string[], args: Args) => IOperation;
  protected listAfterOp: (path: string[], args: Args) => IOperation;
  protected updateOp: (path: string[], args: Args) => IOperation;
  protected setOp: (path: string[], args: Args) => IOperation;
  protected listRemoveOp: (path: string[], args: Args) => IOperation;
  protected child_path: keyof T = "" as any;
  protected child_type: TDataType = "block" as any;
  #init_cache: boolean = false;
  #init_child_data: boolean;

  constructor(arg: NishanArg & { type: TDataType }) {
    super(arg);
    this.type = arg.type;
    this.id = arg.id;
    this.listBeforeOp = Operation[arg.type].listBefore.bind(this, this.id);
    this.listAfterOp = Operation[arg.type].listAfter.bind(this, this.id);
    this.updateOp = Operation[arg.type].update.bind(this, this.id)
    this.setOp = Operation[arg.type].set.bind(this, this.id)
    this.listRemoveOp = Operation[arg.type].listRemove.bind(this, this.id);
    this.#init_cache = false;
    this.#init_child_data = false;
  }

  #detectChildData = (type: TDataType, id: string) => {
    let child_type: TDataType = 'block', child_path: string = '';
    const data = this.cache[type].get(id) as TBlock;
    if (type === "block") {
      if (data.type === "page")
        child_path = "content" as any
      else if (data.type === "collection_view" || data.type === "collection_view_page") {
        child_path = "view_ids" as any
        child_type = "collection_view"
      }
    } else if (type === "space")
      child_path = "pages" as any;
    else if (type === "user_root") {
      child_path = "space_views" as any;
      child_type = "space_view"
    }
    else if (type === "collection")
      child_path = "template_pages" as any;
    else if (type === "space_view")
      child_path = "bookmarked_pages" as any;

    return [child_path, child_type] as [string, TDataType]
  }

  protected initializeChildData() {
    if (!this.#init_child_data) {
      const [child_path, child_type] = this.#detectChildData(this.type, this.id);
      this.child_path = child_path as any;
      this.child_type = child_type as any;
      this.#init_child_data = true;
    }
  }

  /**
   * Get the parent of the current data
   */
  protected getParent() {
    const data = this.getCachedData() as TBlock;
    if (this.type.match(/(space|block|collection)/) && data?.parent_id) {
      const parent = this.cache.block.get(data.parent_id) as TParentType;
      if (!parent) throw new Error(error(`Block with id ${data.id} doesnot have a parent`));
      return parent;
    } else
      throw new Error(error(`Block with id ${data.id} doesnot have a parent`));
  }

  /**
   * Get the cached data using the current data id
   */
  getCachedData<Q extends TData = T>(arg?: string, type?: TDataType) {
    type = type ? type : "block";
    let id = this.id;
    if (typeof arg === "string") id = arg;
    const data = this.cache[arg ? type : this.type].get(id) as Q;
    if (data) return data;
    else if ((data as any).alive === false)
      throw new Error(error("Data has been deleted"));
    else
      throw new Error(error("Data not available in cache"))
  }

  /**
   * Delete the cached data using the id
   */
  protected deleteCachedData() {
    this.cache[this.type].delete(this.id);
  }

  /**
   * Adds the passed block id in the child container array of parent
   * @param $block_id id of the block to add
   * @param arg
   * @returns created Operation and a function to update the cache and the class data
   */
  protected addToChildArray(child_id: string, position: RepositionParams) {
    const data = this.getCachedData();
    this.initializeChildData();

    if (!data[this.child_path]) data[this.child_path] = [] as any;

    const container: string[] = data[this.child_path] as any;

    return this.#addToChildArrayUtil({ child_id, position, container, child_path: this.child_path as string, parent_id: this.id, parent_type: this.type })
  }

  #addToChildArrayUtil = (arg: { child_id: string, position: RepositionParams, container: string[], child_path: string, parent_type: TOperationTable, parent_id: string }) => {
    const { child_id, position, container, child_path, parent_type, parent_id } = arg;
    if (position !== undefined) {
      let where: "before" | "after" = "before", id: string = '';
      if (typeof position === "number") {
        id = container?.[position] ?? '';
        where = container.indexOf(child_id) > position ? "before" : "after";
        container.splice(position, 0, child_id);
      } else {
        where = position.position, id = position.id;
        container.splice(container.indexOf(position.id) + (position.position === "before" ? -1 : 1), 0, child_id);
      }

      return (Operation[parent_type] as any)[`list${where.charAt(0).toUpperCase() + where.substr(1)}`](parent_id, [child_path], {
        [where]: id,
        id: child_id
      }) as IOperation
    } else {
      container.push(child_id);
      return Operation[parent_type].listAfter(parent_id, [child_path], {
        after: '',
        id: child_id
      }) as IOperation;
    }
  }

  protected addToParentChildArray(child_id: string, position: RepositionParams) {
    const data = this.getCachedData() as any, parent = (this.cache as any)[data.parent_table].get(data.parent_id),
      child_path = this.#detectChildData(data.parent_table, parent.id)[0], container: string[] = parent[child_path] as any;

    return this.#addToChildArrayUtil({ child_id, position, container, child_path, parent_id: data.parent_id, parent_type: data.parent_table })
  }

  /**
   * Update the cache of the data using only the passed keys
   * @param arg
   * @param keys
   */
  protected updateCacheLocally(arg: Partial<T>, keys: (keyof T)[]) {
    const _this = this;
    const parent_data = this.getCachedData();
    const data = arg as T;

    keys.forEach(key => {
      data[key] = arg[key] ?? (_this as any).data[key]
    });

    (data as any).last_edited_time = Date.now();

    return [this.updateOp(this.type === "user_settings" ? ["settings"] : [], data), function () {
      keys.forEach(key => {
        parent_data[key] = data[key];
        (_this as any).data[key] = data[key];
      })
    }] as [IOperation, (() => void)];
  }

  protected async initializeCache() {
    if (!this.#init_cache) {
      let container: UpdateCacheManuallyParam = []
      if (this.type === "block") {
        const data = this.getCachedData() as TBlock;
        if (data.type === "page")
          container = data.content ?? [];
        if (data.type === "collection_view" || data.type === "collection_view_page") {
          container = data.view_ids.map((view_id) => [view_id, "collection_view"]) ?? []
          container.push([data.collection_id, "collection"])
        }
      } else if (this.type === "space") {
        container = (this.getCachedData() as ISpace).pages ?? [];
      } else if (this.type === "user_root")
        container = (this.getCachedData() as IUserRoot).space_views.map((space_view => [space_view, "space_view"])) ?? []
      else if (this.type === "collection") {
        container = (this.getCachedData() as ICollection).template_pages ?? []
        await this.queryCollection({
          collectionId: this.id,
          collectionViewId: "",
          query: {},
          loader: {
            type: "table",
            loadContentCover: true
          }
        })
      }
      else if (this.type === "space_view")
        container = (this.getCachedData() as ISpaceView).bookmarked_pages ?? []

      const non_cached: UpdateCacheManuallyParam = container.filter(info =>
        !Boolean(Array.isArray(info) ? this.cache[info[1]].get(info[0]) : this.cache.block.get(info))
      );

      if (non_cached.length !== 0)
        await this.updateCacheManually(non_cached);

      this.#init_cache = true;
    }
  }

  protected async traverseChildren<Q extends TData>(arg: FilterTypes<Q>, multiple: boolean = true, cb: (block: Q, should_add: boolean) => Promise<void>, condition?: (Q: Q) => boolean) {
    await this.initializeCache();
    this.initializeChildData();

    const matched: Q[] = [];
    const data = this.getCachedData(), container: string[] = data[this.child_path] as any ?? [];

    if (Array.isArray(arg)) {
      for (let index = 0; index < arg.length; index++) {
        const block_id = arg[index], block = this.cache[this.child_type].get(block_id) as Q;
        const should_add = block && container.includes(block_id);
        if (should_add) {
          matched.push(block)
          await cb(block, should_add);
        }
        if (!multiple && matched.length === 1) break;
      }
    } else if (typeof arg === "function" || arg === undefined) {
      for (let index = 0; index < container.length; index++) {
        const block_id = container[index], block = this.cache[this.child_type].get(block_id) as Q;
        const should_add = block && (condition ? condition(block) : true) && (typeof arg === "function" ? await arg(block, index) : true);
        if (should_add) {
          matched.push(block)
          await cb(block, should_add);
        }
        if (!multiple && matched.length === 1) break;
      }
    }
    return matched;
  }

  protected async getItems<Q extends TData>(arg: FilterTypes<Q>, multiple: boolean = true, cb: (Q: Q) => Promise<any>, condition?: (Q: Q) => boolean) {
    const blocks: any[] = [];
    await this.traverseChildren<Q>(arg, multiple, async function (block, matched) {
      if (matched) blocks.push(await cb(block))
    }, condition ?? (() => true))
    return blocks;
  }

  protected async deleteItems<Q extends TData>(arg: FilterTypes<Q>, multiple: boolean = true,) {
    const ops: IOperation[] = [], current_time = Date.now(), _this = this;
    const blocks = await this.traverseChildren(arg, multiple, async function (block, matched) {
      if (matched) {
        ops.push(Operation[_this.child_type as TDataType].update(block.id, [], {
          alive: false,
          last_edited_time: current_time
        }),
          _this.listRemoveOp([_this.child_path as string], { id: block.id })
        )
      }
    })
    if (ops.length !== 0) {
      ops.push(this.setOp(["last_edited_time"], current_time));
      await this.saveTransactions(ops);
      blocks.forEach(blocks => this.cache.block.delete(blocks.id));
    }
  }

  protected createViewsUtils(schema: Schema, views: TSearchManipViewParam[], collection_id: string, parent_id: string) {
    const name_map: Map<string, { key: string } & ISchemaUnit> = new Map(), created_view_ops: IOperation[] = [], view_infos: [string, TViewType][] = [];

    Object.entries(schema).forEach(([key, schema]) => name_map.set(schema.name, { key, ...schema }));

    for (let index = 0; index < views.length; index++) {
      const { name, type, view, filter_operator = "and" } = views[index],
        sorts = [] as ViewSorts[], filters = [] as TViewFilters[], aggregations = [] as ViewAggregations[], properties = [] as ViewFormatProperties[],
        view_id = uuidv4(), included_units: string[] = [], query2 = {
          sort: sorts,
          filter: {
            operator: filter_operator,
            filters
          },
          aggregations
        } as any, format = {
          [`${type}_properties`]: properties
        } as any;

      view_infos.push([view_id, type]);

      switch (type) {
        case "table":
          const table_view = views[index] as TableSearchManipViewParam, table_format = format as ITableViewFormat;
          table_format.table_wrap = table_view.table_wrap ?? true;
          break;
        case "board":
          const board_view = views[index] as BoardSearchManipViewParam, board_format = format as IBoardViewFormat;
          board_format.board_cover = board_view.board_cover ?? { type: "page_cover" };
          board_format.board_cover_aspect = board_view.board_cover_aspect;
          board_format.board_cover_size = board_view.board_cover_size;
          board_format.board_groups2 = board_view.board_groups2 as any;
          break;
        case "gallery":
          const gallery_view = views[index] as GallerySearchManipViewParam, gallery_format = format as IGalleryViewFormat;
          if (gallery_view.gallery_cover?.type === "property") gallery_format.gallery_cover = { ...gallery_view.gallery_cover, property: name_map.get(gallery_view.gallery_cover.property)?.key as string }
          else gallery_format.gallery_cover = gallery_view.gallery_cover
          gallery_format.gallery_cover_aspect = gallery_view.gallery_cover_aspect
          gallery_format.gallery_cover_size = gallery_view.gallery_cover_size
          break;
        case "calendar":
          const calender_view = views[index] as CalendarSearchManipViewParam, calendar_query2 = query2 as ICalendarViewQuery2;
          calendar_query2.calendar_by = calender_view.calendar_by;
          break;
        case "timeline":
          const timeline_view = views[index] as TimelineSearchManipViewParam, timeline_format = format as ITimelineViewFormat;
          timeline_format.timeline_preference = timeline_view.timeline_preference ?? { centerTimestamp: 1, zoomLevel: "month" }
          timeline_format.timeline_show_table = timeline_view.timeline_show_table ?? true;
          break;
      }

      view.forEach(info => {
        const { format, sort, aggregation, filter, name } = info, property_info = name_map.get(name);
        if (property_info) {
          const { key } = property_info,
            property: ViewFormatProperties = {
              property: key,
              visible: true,
              width: 250
            };
          included_units.push(key);
          if (typeof format === "boolean") property.visible = format;
          else if (typeof format === "number") property.width = format;
          else if (Array.isArray(format)) {
            property.width = format?.[1] ?? 250
            property.visible = format?.[0] ?? true;
          }
          if (sort) {
            if (Array.isArray(sort))
              sorts.splice(sort[1], 0, {
                property: key,
                direction: sort[0]
              })
            else sorts.push({
              property: key,
              direction: sort
            })
          }

          if (aggregation) aggregations.push({
            property: key,
            aggregator: aggregation
          })

          if (filter) {
            filter.forEach(([operator, type, value, position]: any) => {
              const filter_value = {
                property: key,
                filter: {
                  operator,
                  value: {
                    type,
                    value
                  }
                } as any
              }
              if (position) filters.splice(position, 0, filter_value)
              else filters.push(filter_value)
            })
          }
          properties.push(property)
        } else
          throw new Error(error(`Collection:${collection_id} does not contain SchemeUnit.name:${name}`))
      })

      const non_included_units = Object.keys(schema).filter(key => !included_units.includes(key));

      non_included_units.forEach(property => {
        properties.push({
          property,
          visible: false
        })
      })

      created_view_ops.push(Operation.collection_view.set(view_id, [], {
        id: view_id,
        version: 0,
        type,
        name,
        page_sort: [],
        parent_id,
        parent_table: 'block',
        alive: true,
        format,
        query2,
      }))
    }

    return [created_view_ops, view_infos] as [IOperation[], [string, TViewType][]];
  }

  protected createCollection(param: ICollectionBlockInput, parent_id: string) {
    const schema: Schema = {}, collection_id = uuidv4();

    param.schema.forEach(opt => {
      schema[(opt.name === "title" ? "Title" : opt.name).toLowerCase().replace(/\s/g, '_')] = opt
    });

    const [created_view_ops, view_infos] = this.createViewsUtils(schema, param.views, collection_id, parent_id);
    created_view_ops.unshift(Operation.collection.update(collection_id, [], {
      id: collection_id,
      schema,
      format: {
        collection_page_properties: []
      },
      icon: param?.format?.page_icon ?? "",
      parent_id,
      parent_table: 'block',
      alive: true,
      name: param.properties.title
    }));

    return [collection_id, created_view_ops, view_infos] as [string, IOperation[], [string, TViewType][]]
  }

  protected createBlockMap = () => {
    return {
      linked_db: [],
      collection_view_page: [],
      embed: [],
      video: [],
      audio: [],
      image: [],
      bookmark: [],
      code: [],
      file: [],
      tweet: [],
      gist: [],
      codepen: [],
      maps: [],
      figma: [],
      drive: [],
      text: [],
      table_of_contents: [],
      equation: [],
      breadcrumb: [],
      factory: [],
      page: [],
      to_do: [],
      header: [],
      sub_header: [],
      sub_sub_header: [],
      bulleted_list: [],
      numbered_list: [],
      toggle: [],
      quote: [],
      divider: [],
      callout: [],
      collection_view: [],
      link_to_page: []
    } as ITBlock
  }

  protected createViewMap() {
    return {
      board: [],
      gallery: [],
      list: [],
      timeline: [],
      table: [],
      calendar: [],
    } as ITView;
  }

  protected createSchemaUnitMap() {
    return {
      text: [],
      number: [],
      select: [],
      multi_select: [],
      title: [],
      date: [],
      person: [],
      file: [],
      checkbox: [],
      url: [],
      email: [],
      phone_number: [],
      formula: [],
      relation: [],
      rollup: [],
      created_time: [],
      created_by: [],
      last_edited_time: [],
      last_edited_by: []
    } as ITSchemaUnit
  }

}