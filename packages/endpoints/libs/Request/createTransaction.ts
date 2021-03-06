import { INotionEndpoints, IOperation } from '@nishans/types';
import { v4 } from 'uuid';

/**
 * Create a transaction object suitable to be sent to the saveTransaction endpoint
 * @param shardId The shard id of the workspace
 * @param spaceId The id of the workspace
 * @param operations The operations array to be added to the transaction
 */
export function createTransaction (shardId: number, spaceId: string, operations: IOperation[]) {
	return {
		requestId: v4(),
		transactions: [
			{
				id: v4(),
				shardId,
				spaceId,
				operations
			}
		]
	} as INotionEndpoints['saveTransaction']['payload'];
}