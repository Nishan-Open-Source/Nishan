import { TDataType, IOperation, ICollection, IPage, IColumnList, IColumn, ICollectionBlock, ICollectionViewPage, IFactory, ICollectionView } from "@nishans/types";
import { TBlockCreateInput, UpdateCacheManuallyParam, ITBlock, NishanArg } from "../types";
import { generateId, createViews, createBlockMap, createCollection, createBlockClass, Operation } from "../utils";
import { v4 as uuidv4 } from 'uuid';

export async function nestedContentPopulate(contents: TBlockCreateInput[], parent_id: string, parent_table: TDataType, props: Omit<NishanArg,"id">, this_id: string) {
  const ops: IOperation[] = [], sync_records: UpdateCacheManuallyParam = [], block_map = createBlockMap();

  const CollectionView = require("../api/CollectionView").default;
  const CollectionViewPage = require('../api/CollectionViewPage').default;
  const Block = require('../api/Block').default;

  const metadata = {
    created_time: Date.now(),
    created_by_id: props.user_id,
    created_by_table: 'notion_user',
    last_edited_time: Date.now(), 
    last_edited_by_table: "notion_user", 
    last_edited_by_id: props.user_id,
    space_id: props.space_id,
    shard_id: props.shard_id,
    version: 0
  } as const;

  const traverse = async (contents: TBlockCreateInput[], parent_id: string, parent_table: TDataType, parent_content_id?: string) => {
    parent_content_id = parent_content_id ?? parent_id;
    for (let index = 0; index < contents.length; index++) {
      const content = contents[index], block_id = generateId(content.id);
      sync_records.push(block_id);
      content.type = content.type ?? 'page';

      /* if (content.type.match(/gist|codepen|tweet|maps|figma/)) {
        content.format = (await this.getGenericEmbedBlockData({
          pageWidth: 500,
          source: (content.properties as any).source[0][0] as string,
          type: content.type as TGenericEmbedBlockType
        })).format;
      }; */

      const {
        format = {},
        properties,
        type,
      } = content;

      /* if (type === "bookmark") {
        bookmarks.push({
          blockId: block_id,
          url: (properties as WebBookmarkProps).link[0][0]
        })
        await this.setBookmarkMetadata({
          blockId: block_id,
          url: (properties as WebBookmarkProps).link[0][0]
        });
      } */

      /* else if (type === "drive") {
        const {
          accounts
        } = await this.getGoogleDriveAccounts();
        await this.initializeGoogleDriveBlock({
          blockId: block_id,
          fileId: (content as IDriveInput).file_id as string,
          token: accounts[0].token
        });
      } */

      if (content.type === "collection_view_page" || content.type === "collection_view") {
        const [collection_id, create_view_ops, view_ids, , view_records] = createCollection(content, block_id, props);
        const args: ICollectionBlock = {
          id: block_id,
          type: content.type,
          collection_id,
          view_ids,
          properties: content.properties,
          parent_id,
          parent_table: "block",
          alive: true,
          ...metadata
        };

        if (content.type === "collection_view_page") (args as ICollectionViewPage).permissions = [{ type: content.isPrivate ? 'user_permission' : 'space_permission', role: 'editor', user_id: props.user_id }];

        ops.push(Operation.block.update(block_id, [], args),...create_view_ops)
        props.cache.block.set(block_id, args as any)

        const collectionblock = type === "collection_view" ? new CollectionView({
          ...props,
          id: block_id
        }) : new CollectionViewPage({
          ...props,
          id: block_id
        });

        sync_records.push([collection_id, "collection"], ...view_records)
        block_map[type].push(collectionblock);
        if (content.rows)
          await traverse(content.rows as any, collection_id, "collection")
      } else if (content.type === "factory") {
        // ! FIX:1:H Nested content for factory children is not populated, ie if a page is passed as a children, its nested content will not be populated 
        const factory_contents_map = createBlockMap(), content_ids: string[] = [], content_blocks_ops = (content.contents.map(content => ({
          ...content,
          block_id: generateId(content.id)
        }))).map(content => {
          factory_contents_map[content.type].push(createBlockClass(content.type, content.block_id, props))
          sync_records.push(content.block_id)
          content_ids.push(content.block_id);
          const content_data: any = {
            ...content, parent_id: block_id, parent_table: "block", ...metadata
          };
          props.cache.block.set(content.block_id, content_data)
          return Operation.block.update(content.block_id, [], content_data)
        });
        const factory_data: IFactory = {
          id: block_id,
          properties: content.properties,
          format: content.format,
          type: content.type,
          parent_id,
          parent_table: "block",
          alive: true,
          contents: content_ids,
          ...metadata
        }
        ops.push(
          Operation.block.update(block_id, [], factory_data),
          ...content_blocks_ops
        );
        props.cache.block.set(block_id, factory_data)
        block_map.factory.push({
          block: new Block({
            id: block_id,
            ...props
          }), contents: factory_contents_map
        })
      }
      else if (content.type === "linked_db") {
        const { collection_id, views } = content,
          collection = props.cache.collection.get(collection_id) as ICollection,
          [created_view_ops, view_ids, , view_records] = createViews(collection.schema, views, collection.id, block_id, props),
          collection_view_data: ICollectionView = {
            id: block_id,
            type: 'collection_view',
            collection_id,
            view_ids,
            parent_id,
            parent_table: "block",
            alive: true,
            ...metadata
          }

        ops.push(Operation.block.set(block_id, [], collection_view_data),
          ...created_view_ops);
        props.cache.block.set(block_id, collection_view_data);
        sync_records.push([collection_id, "collection"], ...view_records);
        block_map[content.type].push(new CollectionView({
          ...props,
          id: block_id
        }))
      }
      else if (content.type === "page") {
        if (content.contents)
          await traverse(content.contents, block_id, "block");
        const page_data: IPage = {
          content: [],
          is_template: (content as any).is_template && parent_table === "collection",
          id: block_id,
          properties: content.properties,
          format: content.format,
          type: content.type,
          parent_id,
          parent_table: parent_table as any,
          alive: true,
          permissions: [{ type: content.isPrivate ? 'user_permission' : 'space_permission', role: 'editor', user_id: props.user_id }],
          ...metadata
        }
        ops.push(Operation.block.update(block_id, [], page_data));
        props.cache.block.set(block_id, page_data)
        block_map[type].push(createBlockClass(content.type, block_id, props));
      }
      else if (content.type === "column_list") {
        const { contents } = content;
        const column_list_data: IColumnList = {
          id: block_id,
          parent_id,
          parent_table: "block",
          alive: true,
          type: "column_list",
          content: [],
          ...metadata
        };
        ops.push(Operation.block.set(block_id, [], column_list_data));
        props.cache.block.set(block_id, column_list_data)

        for (let index = 0; index < contents.length; index++) {
          const column_id = uuidv4(), column_data: IColumn = {
            id: column_id,
            parent_id: block_id,
            parent_table: "block",
            alive: true,
            type: "column",
            format: {
              column_ratio: 1 / contents.length
            },
            ...metadata,
            content: []
          };
          ops.push(Operation.block.set(column_id, [], column_data), Operation.block.listAfter(block_id, ['content'], { after: '', id: column_id }));
          props.cache.block.set(column_id, column_data);
          column_list_data.content.push(column_id);
          sync_records.push(column_id);
          await traverse([contents[index]], this_id, "block", column_id)
        }
      }
      else if (content.type !== "link_to_page") {
        const block_data: any = {
          id: block_id,
          properties,
          format,
          type,
          parent_id,
          parent_table,
          alive: true,
          ...metadata
        };
        ops.push(Operation.block.update(block_id, [], block_data));
        props.cache.block.set(block_id, block_data)
        block_map[type].push(createBlockClass(content.type, block_id, props));
      }

      const content_id = content.type === "link_to_page" ? content.page_id : block_id;

      if (parent_table === "block"){
        ops.push(Operation.block.listAfter(parent_content_id, ['content'], { after: '', id: content_id }))
        const parent = props.cache.block.get(parent_content_id);
        if(parent){
          if(!(parent as IPage)['content']) (parent as IPage)['content'] = [];
          (parent as IPage)['content'].push(content_id)
        }
      }
      else if (parent_table === "space"){
        ops.push(Operation.space.listAfter(parent_content_id, ['pages'], { after: '', id: content_id }))
        const parent = props.cache.space.get(parent_content_id);
        if(parent){
          if(!parent['pages']) parent['pages'] = []
          parent['pages'].push(content_id)
        }
      }
      else if (parent_table === "collection" && (content as any).is_template){
        ops.push(Operation.collection.listAfter(parent_content_id, ['template_pages'], { after: '', id: content_id }))
        const parent = props.cache.collection.get(parent_content_id);
        if(parent){
          if(!parent['template_pages']) parent['template_pages'] = []
          parent['template_pages'].push(content_id)
        }
      }
    }
  }

  await traverse(contents, parent_id, parent_table);
  return [ops, sync_records, block_map] as [IOperation[], UpdateCacheManuallyParam, ITBlock]
}