import { ICollection, TSchemaUnit } from '@nishans/types';
import { populateSchemaMap } from '../../../libs';
import { createSchema } from '../../../libs/CreateData/schema';
import { ISchemaMapValue, TSchemaUnitInput } from '../../../types';
import { createDefaultCache } from '../../createDefaultCache';

afterEach(() => {
	jest.restoreAllMocks();
});

describe('createSchema', () => {
	describe('Work correctly', () => {
		it(`createSchema should work correctly (collection exists in cache)`, async () => {
			const input_schema_units: TSchemaUnitInput[] = [
				{
					type: 'title',
					name: 'Title'
				},
				{
					type: 'number',
					name: 'Number'
				},
				{
					type: 'formula',
					name: 'Formula',
					formula: [ 'now()', 'string' ]
				},
				{
					type: 'relation',
					collection_id: 'child_collection_id',
					name: 'Parent Relation Column'
				},
				{
					type: 'rollup',
					collection_id: 'target_collection_id',
					name: 'Rollup',
					relation_property: 'Parent Relation Column',
					target_property: 'Title'
				}
			];

			const child_collection: ICollection = {
					schema: {
						title: {
							type: 'title',
							name: 'Title'
						}
					},
					name: 'Child',
					id: 'child_collection_id'
				} as any,
				target_collection: ICollection = {
					schema: {
						title: {
							type: 'title',
							name: 'Title'
						}
					},
					name: 'Target Collection',
					id: 'target_collection_id'
				} as any,
				cache = {
					...createDefaultCache(),
					collection: new Map([
						[ 'child_collection_id', child_collection ],
						[ 'target_collection_id', target_collection ]
					])
				};

			const [ schema, schema_map, schema_unit_map ] = await createSchema(input_schema_units, {
				parent_collection_id: 'parent_collection_id',
				name: [ [ 'Parent' ] ],
				token: 'token',
				cache,
				stack: [],
				interval: 0,
				shard_id: 123,
				space_id: 'space_1',
				user_id: 'user_1',
				current_schema: {}
			});

			const child_relation_schema_unit_id = (populateSchemaMap(child_collection.schema).get(
				'Related to Parent (Parent Relation Column)'
			) as ISchemaMapValue).schema_id;
			const parent_relation_schema_unit_id = (populateSchemaMap(schema).get(
				'Parent Relation Column'
			) as ISchemaMapValue).schema_id;

			const output_schema_units = [
				{
					type: 'title',
					name: 'Title'
				},
				{
					type: 'number',
					name: 'Number'
				},
				{
					type: 'formula',
					name: 'Formula',
					formula: {
						result_type: 'date',
						name: 'now',
						type: 'function'
					}
				},
				{
					type: 'relation',
					collection_id: 'child_collection_id',
					name: 'Parent Relation Column',
					property: child_relation_schema_unit_id
				},
				{
					type: 'rollup',
					collection_id: 'target_collection_id',
					name: 'Rollup',
					relation_property: parent_relation_schema_unit_id,
					target_property: 'title',
					target_property_type: 'title',
					aggregation: undefined
				}
			] as TSchemaUnit[];

			expect(output_schema_units).toStrictEqual(Object.values(schema));

			expect(Array.from(schema_map.keys())).toStrictEqual([
				'Title',
				'Number',
				'Formula',
				'Parent Relation Column',
				'Rollup'
			]);
			expect(schema_unit_map.title.get('Title')).not.toBeUndefined();
		});
	});

	describe('Throws error', () => {
		it(`Should throw error for duplicate property name`, () => {
			expect(() =>
				createSchema(
					[
						{
							type: 'title',
							name: 'Title'
						},
						{
							type: 'title',
							name: 'Title'
						}
					],
					{
						parent_collection_id: 'parent_collection_id',
						name: [ [ 'Parent' ] ],
						token: 'token',
						stack: [],
						cache: createDefaultCache(),
						interval: 0,
						shard_id: 123,
						space_id: 'space_1',
						user_id: 'user_1'
					}
				)
			).rejects.toThrow(`Duplicate property Title`);
		});

		it(`Should throw error if title type property not present in schema`, () => {
			expect(() =>
				createSchema(
					[
						{
							type: 'number',
							name: 'Number'
						}
					],
					{
						parent_collection_id: 'parent_collection_id',
						name: [ [ 'Parent' ] ],
						token: 'token',
						stack: [],
						cache: createDefaultCache(),
						interval: 0,
						shard_id: 123,
						space_id: 'space_1',
						user_id: 'user_1'
					}
				)
			).rejects.toThrow(`Schema must contain title type property`);
		});
	});
});
