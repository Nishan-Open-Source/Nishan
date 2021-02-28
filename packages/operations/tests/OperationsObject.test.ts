import { NotionMutations } from '@nishans/endpoints';
import { IOperation } from '@nishans/types';
import { NotionOperationsObject, NotionOperationsPlugin } from '../libs';

const operation: IOperation = {
	args: {},
	command: 'update',
	pointer: {
		table: 'block',
		id: '123'
	},
	path: []
};

describe('executeOperations', () => {
	it(`print to console if the stack is empty`, async () => {
		const consoleLogMock = jest.spyOn(console, 'log');
		await NotionOperationsObject.executeOperations([], [], { token: 'token' }, { shard_id: 123, space_id: 'space_1' });
		expect(consoleLogMock).toHaveBeenCalledWith(`The operation stack is empty`);
	});

	it(`executes operations`, async () => {
		const saveTransactionsMock = jest
			.spyOn(NotionMutations, 'saveTransactions')
			.mockImplementationOnce(async () => ({}));
		const stack: IOperation[] = [ operation ];
		await NotionOperationsObject.executeOperations(
			stack,
			[],
			{ token: 'token' },
			{ shard_id: 123, space_id: 'space_1' }
		);

		expect(saveTransactionsMock).toHaveBeenCalledWith(
			{
				requestId: expect.any(String),
				transactions: [
					{
						id: expect.any(String),
						shardId: 123,
						spaceId: 'space_1',
						operations: stack
					}
				]
			},
			{
				token: 'token'
			}
		);
		expect(stack).toHaveLength(0);
	});
});

it(`applyPluginsToOperationsStack`, () => {
	const stack: IOperation[] = [
		operation,
		{
			args: {
				last_edited_time: Date.now(),
				last_edited_by_id: 'id',
				last_edited_by_table: 'notion_user',
				other_data: 'other data'
			},
			command: 'update',
			path: [],
			pointer: {
				id: 'id',
				table: 'block'
			}
		},
		{
			args: {
				last_edited_time: Date.now(),
				last_edited_by_id: 'id',
				last_edited_by_table: 'notion_user'
			},
			command: 'update',
			path: [],
			pointer: {
				id: 'id',
				table: 'block'
			}
		}
	];

	const updated_operations = NotionOperationsObject.applyPluginsToOperationsStack(stack, [
		NotionOperationsPlugin.removeLastEditedProps(),
		NotionOperationsPlugin.removeEmptyOperations()
	]);

	expect(updated_operations).toStrictEqual([
		{
			args: {
				other_data: 'other data'
			},
			command: 'update',
			path: [],
			pointer: {
				id: 'id',
				table: 'block'
			}
		}
	]);
});
