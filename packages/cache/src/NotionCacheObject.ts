import {
	ICollection,
	ISpace,
	ISpaceView,
	IUserRoot,
	RecordMap,
	SyncRecordValues,
	TBlock,
	TDataType
} from '@nishans/types';
import { ICache } from '../src';
import { NotionRequestConfigs, Queries, UpdateCacheManuallyParam } from '@nishans/endpoints';

export const NotionCacheObject = {
	/**
 * Save all the items of a recordMap in internal cache
 * @param recordMap The recordMap to save to cache
 */
	saveToCache (recordMap: Partial<RecordMap>, cache: ICache) {
		// Loop through each of the cache keys
		// Store all the values of that particular key thats present in the recordMap in the cache
		([
			'block',
			'collection',
			'space',
			'collection_view',
			'notion_user',
			'space_view',
			'user_root',
			'user_settings'
		] as (keyof ICache)[]).forEach((key) => {
			if (recordMap[key])
				Object.entries(recordMap[key] as Record<any, any>).forEach(([ record_id, record_value ]) => {
					cache[key].set(record_id, record_value.value);
				});
		});
	},

	/**
   * Returns the id and data_type tuple passed that is not present in the cache
   * @param update_cache_param Array of tuple of id and data_type to look for in the cache
   * @returns
   */
	returnNonCachedData (update_cache_param: UpdateCacheManuallyParam, cache: ICache): UpdateCacheManuallyParam {
		return update_cache_param.filter((info) => !Boolean(cache[info[1]].get(info[0])));
	},

	constructSyncRecordsParams: async (args: UpdateCacheManuallyParam, configs: NotionRequestConfigs, cache: ICache) => {
		const sync_record_values: SyncRecordValues[] = [];
		// Iterate through the passed array argument and construct sync_record argument
		args.forEach((arg) => {
			sync_record_values.push({ id: arg[0], table: arg[1], version: 0 });
		});

		// fetch and save notion data to cache
		if (sync_record_values.length) {
			const { recordMap } = await Queries.syncRecordValues({ requests: sync_record_values }, configs);
			NotionCacheObject.saveToCache(recordMap, cache);
		}
	},

	/**
 * Initialize the cache by sending a post request to the `getSpaces` endpoint 
 */
	initializeNotionCache: async function (configs: NotionRequestConfigs, cache: ICache) {
		const data = await Queries.getSpaces(configs);
		// Contains a set of external notion user that has access to the space
		const external_notion_users: Set<string> = new Set();

		// Going through each recordMap and storing them in cache
		Object.values(data).forEach((recordMap) => {
			// Getting the user_root id
			const user_root_id = Object.keys(recordMap.user_root)[0];
			// In the space's permission check if external user has any access to the space,
			// if it does and its not the user_root it needs to be added to the set created earlier
			Object.values(recordMap.space).forEach((space) =>
				space.value.permissions.forEach(
					(permission) =>
						permission.user_id && permission.user_id !== user_root_id && external_notion_users.add(permission.user_id)
				)
			);
			NotionCacheObject.saveToCache(recordMap, cache);
		});

		// If the number of external_notion_users in not zero continue
		if (external_notion_users.size !== 0) {
			// Send a api request to syncRecordValues endpoint to fetch the external notion users
			const { recordMap } = await Queries.syncRecordValues(
				{
					requests: Array.from(external_notion_users.values()).map((external_notion_user) => ({
						table: 'notion_user',
						id: external_notion_user,
						version: -1
					}))
				},
				configs
			);
			// Save the fetched external notion user to cache
			NotionCacheObject.saveToCache(recordMap, cache);
		}
	},

	/**
 * Initialize cache of specific type of data
 * @param id The id of the data
 * @param type The type of data
 */
	initializeCacheForSpecificData: async function (
		id: string,
		type: TDataType,
		configs: NotionRequestConfigs,
		cache: ICache
	) {
		const container: UpdateCacheManuallyParam = [];
		if (type === 'block') {
			const data = cache[type].get(id) as TBlock;
			// If the type is block and page, fetch its content
			if (data.type === 'page') data.content.forEach((id) => container.push([ id, 'block' ]));
			// If the type is block and cvp or cv, fetch its views and collection
			if (data.type === 'collection_view' || data.type === 'collection_view_page') {
				data.view_ids.map((view_id) => container.push([ view_id, 'collection_view' ]));
				container.push([ data.collection_id, 'collection' ]);
			}
		} else if (type === 'space') {
			// If the type is space, fetch its pages and notion_user
			const data = cache[type].get(id) as ISpace;
			data.pages.forEach((id) => container.push([ id, 'block' ]));
			data.permissions.forEach((permission) => container.push([ permission.user_id, 'notion_user' ]));
		} else if (type === 'user_root') {
			// If the type is user_root, fetch its space_view
			const data = cache[type].get(id) as IUserRoot;
			data.space_views.map((space_view) => container.push([ space_view, 'space_view' ]));
		} else if (type === 'collection') {
			// If the type is collection, fetch its template_pages and all of its row_pages
			const data = cache[type].get(id) as ICollection;
			if (data.template_pages) data.template_pages.forEach((id) => container.push([ id, 'block' ]));
			// Fetching the row_pages of collection
			const { recordMap } = await Queries.queryCollection(
				{
					collectionId: id,
					collectionViewId: '',
					query: {},
					loader: {
						type: 'table',
						loadContentCover: true
					}
				},
				configs
			);
			NotionCacheObject.saveToCache(recordMap, cache);
		} else if (type === 'space_view') {
			// If the type is space_view, fetch its bookmarked_pages
			const data = cache[type].get(id) as ISpaceView;
			if (data.bookmarked_pages) data.bookmarked_pages.forEach((id) => container.push([ id, 'block' ]));
		} else throw new Error(`${type} data is not supported`);

		// Filters data that doesnt exist in the cache
		const non_cached = NotionCacheObject.returnNonCachedData(container, cache);

		await NotionCacheObject.updateCacheManually(non_cached, configs, cache);

		// If the block is a page, for all the collection block contents, fetch the collection attached with it as well
		if (type === 'block') {
			const data = cache[type].get(id) as TBlock;
			if (data.type === 'page') {
				const collection_blocks_ids: UpdateCacheManuallyParam = [];
				for (let index = 0; index < data.content.length; index++) {
					const content_id = data.content[index],
						content = cache.block.get(content_id);
					if (content && (content.type === 'collection_view_page' || content.type === 'collection_view'))
						collection_blocks_ids.push([ content.collection_id, 'collection' ]);
				}
				await NotionCacheObject.updateCacheManually(
					NotionCacheObject.returnNonCachedData(collection_blocks_ids, cache),
					configs,
					cache
				);
			}
		}
	},

	/**
 * Fetches data from notions server and store within the cache
 * @param args The array of id and data_type tuple to fetch and store
 */
	updateCacheManually: async function (args: UpdateCacheManuallyParam, configs: NotionRequestConfigs, cache: ICache) {
		await NotionCacheObject.constructSyncRecordsParams(args, configs, cache);
	},

	/**
 * Fetches notion data only if it doesnt exist in the cache
 * @param arg Array of id and data_type tuple to fetch from notion and store
 */
	updateCacheIfNotPresent: async function (
		args: UpdateCacheManuallyParam,
		configs: NotionRequestConfigs,
		cache: ICache
	) {
		await NotionCacheObject.constructSyncRecordsParams(
			args.filter((arg) => !cache[arg[1]].get(arg[0])),
			configs,
			cache
		);
	},
	validateCache: function (cache: ICache) {
		const cache_keys: (keyof ICache)[] = [
			'block',
			'collection',
			'space',
			'collection_view',
			'notion_user',
			'space_view',
			'user_root',
			'user_settings'
		];

		// Throw error if the required items are not present in the cache
		const passed_cache_keys = Object.keys(cache);
		cache_keys.forEach((cache_key) => {
			if (!passed_cache_keys.includes(cache_key)) throw new Error(`${cache_key} must be present in Cache argument`);
		});

		passed_cache_keys.forEach((cache_key) => {
			// Throw error if an unknown key is used in the cache
			const cache_item = cache_key as keyof ICache;
			if (!cache_keys.includes(cache_item)) throw new Error(`Unknown key ${cache_key} passed`);
			const is_map = cache[cache_item] instanceof Map;
			// Throw error if the stored value is not an instance of a Map
			if (!is_map) throw new Error(`${cache_item} is not an instance of Map`);
		});
		return cache;
	}
};