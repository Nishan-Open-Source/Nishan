import Collection from './Collection';
import Permissions from './Permissions';
import { TableView, GalleryView, ListView, BoardView, TimelineView, CalendarView } from './View';

import { NishanArg, IOperation, TView, FilterTypes, FilterType, ICollection, TSearchManipViewParam, ICollectionViewPage, TViewUpdateInput, UpdateTypes } from '../types';
import { Operation } from '../utils';

const view_class = {
  board: BoardView,
  gallery: GalleryView,
  list: ListView,
  timeline: TimelineView,
  table: TableView,
  calendar: CalendarView,
}

/**
 * A class to represent collectionblock type in Notion
 * @noInheritDoc
 */
class CollectionBlock extends Permissions<ICollectionViewPage> {
  constructor(arg: NishanArg & { type: "block" }) {
    super({ ...arg });
  }

  /**
   * Fetch the corresponding collection of the collection block using the collection_id
   * @returns The corresponding collection object
   */
  async getCollection() {
    await this.initializeCache();
    const data = this.getCachedData();
    return new Collection({
      ...this.getProps(),
      id: data.collection_id,
    });
  }

  // ? FEAT:1:M Create View Map in createViewsUtils method
  async createViews(params: TSearchManipViewParam[], execute?: boolean) {
    const ops: IOperation[] = [], data = this.getCachedData(), collection = this.cache.collection.get(data.collection_id) as ICollection, [created_view_ops, view_infos] = this.createViewsUtils(collection.schema, params, collection.id, this.id), view_map = this.createViewMap();
    ops.push(...created_view_ops, Operation.block.update(data.id, [], { view_ids: [...data.view_ids, ...view_infos.map(view_info => view_info[0])] }));
    await this.executeUtil(ops, view_infos.map(view_info => [view_info[0], "collection_view"]), execute)
    view_infos.map(view_info => view_map[view_info[1]].push(new view_class[view_info[1]]({ id: view_info[0], ...this.getProps() }) as any));
    return view_map;
  }

  /**
   * Get all the views associated with the collection block
   * @returns An array of view objects of the collectionblock
   */
  async getViews(args?: FilterTypes<TView>, multiple?: boolean) {
    const view_map = this.createViewMap();
    await this.getIterate<TView>(args, { multiple, child_ids: this.getCachedData().view_ids, subject_type: "View" }, (view_id) => this.cache.collection_view.get(view_id) as TView, (view_id, view) => {
      view_map[view.type].push(new view_class[view.type]({
        id: view_id,
        ...this.getProps()
      }) as any)
    })
    return view_map;
  }

  async updateViews(args: UpdateTypes<TView, TViewUpdateInput>, execute?: boolean, multiple?: boolean) {
    const view_map = this.createViewMap();
    await this.updateIterate<TView, TViewUpdateInput>(args, { multiple, execute, child_ids: this.getCachedData().view_ids, subject_type: "View", child_type: "collection_view" }, (view_id) => this.cache.collection_view.get(view_id), (id, { type }) => {
      view_map[type].push(new view_class[type]({ ...this.getProps(), id }) as any)
    });
    return view_map;
  }

  /**
   * Delete a single root page from the space
   * @param arg Criteria to filter the page to be deleted
   */
  async deleteView(arg?: FilterType<TView>, execute?: boolean) {
    return await this.deleteViews(typeof arg === "string" ? [arg] : arg, execute, false);
  }

  /**
   * Delete multiple root_pages or root_collection_view_pages
   * @param arg Criteria to filter the pages to be deleted
   * @param multiple whether or not multiple root pages should be deleted
   */
  async deleteViews(args?: FilterTypes<TView>, execute?: boolean, multiple?: boolean) {
    await this.deleteIterate<TView>(args, {
      child_path: "view_ids",
      child_type: "collection_view",
      multiple,
      execute,
      subject_type: "View",
      child_ids: this.getCachedData().view_ids
    }, (view_id) => this.cache.collection_view.get(view_id))
  }

  // ? FEAT:1:H Create updateView(s) methods, take help from view.updateView method
}

export default CollectionBlock;
