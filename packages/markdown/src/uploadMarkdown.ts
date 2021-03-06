import { IOperation, ISpace } from '@nishans/types';
import {
	uploadToNotion,
	getNotionData,
	mdast2NotionBlocks,
	parseFile,
	generateNotionBlockOperations,
	parseContent
} from '../utils';
import { ASTNode, NotionOperationData } from './types';

type UploadMarkdownFileParams = {
	content?: string;
	filepath?: string;
	token: string;
	getSpace?: (space: ISpace) => any;
};

type UploadMarkdownFilesParams = {
	contents?: string[];
	filepaths?: string[];
	token: UploadMarkdownFileParams['token'];
	getSpace?: UploadMarkdownFileParams['getSpace'];
};

async function generateNotionBlockOperationsFromMarkdown (content: ASTNode, notion_data: NotionOperationData) {
	const { blocks, config } = await mdast2NotionBlocks(content);
	return await generateNotionBlockOperations(notion_data, blocks, config);
}

export async function uploadMarkdownFile (params: UploadMarkdownFileParams) {
	if (!params.filepath && !params.content) throw new Error('Neither content nor filepath were provided');
	else {
		const operations: IOperation[] = [];
		const notion_data = await getNotionData(params.token, params.getSpace);
		if (params.filepath)
			operations.push(
				...(await generateNotionBlockOperationsFromMarkdown((await parseFile(params.filepath)) as ASTNode, notion_data))
			);
		if (params.content)
			operations.push(
				...(await generateNotionBlockOperationsFromMarkdown(parseContent(params.content) as ASTNode, notion_data))
			);

		// console.log(notion_data, JSON.stringify(operations, null, 2));
		await uploadToNotion(notion_data, operations);
	}
}

export async function uploadMarkdownFiles (params: UploadMarkdownFilesParams) {
	if (!params.filepaths && !params.contents) throw new Error('Neither contents nor filepaths were provided');
	else {
		const operations: IOperation[] = [];
		const notion_data = await getNotionData(params.token, params.getSpace);
		if (params.contents) {
			for (let index = 0; index < params.contents.length; index++) {
				operations.push(
					...(await generateNotionBlockOperationsFromMarkdown(
						parseContent(params.contents[index]) as ASTNode,
						notion_data
					))
				);
			}
		} else if (params.filepaths) {
			for (let index = 0; index < params.filepaths.length; index++) {
				operations.push(
					...(await generateNotionBlockOperationsFromMarkdown(
						(await parseFile(params.filepaths[index])) as ASTNode,
						notion_data
					))
				);
			}
		}
		await uploadToNotion(notion_data, operations);
	}
}
