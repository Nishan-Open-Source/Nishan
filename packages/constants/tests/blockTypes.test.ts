import { TBlockType } from '@nishans/types';
import { NotionConstants } from '../libs';

it('NotionConstants.blockTypes', () => {
	const block_types = NotionConstants.blockTypes();
	const block_types_map: Map<TBlockType, true> = new Map();
	block_types.forEach((block_type) => block_types_map.set(block_type, true));

	const expected_block_types: TBlockType[] = [
		'embed',
		'abstract',
		'invision',
		'framer',
		'whimsical',
		'miro',
		'loom',
		'pdf',
		'typeform',
		'video',
		'audio',
		'image',
		'bookmark',
		'code',
		'file',
		'tweet',
		'gist',
		'codepen',
		'maps',
		'figma',
		'drive',
		'text',
		'table_of_contents',
		'equation',
		'breadcrumb',
		'factory',
		'page',
		'to_do',
		'header',
		'sub_header',
		'sub_sub_header',
		'bulleted_list',
		'numbered_list',
		'toggle',
		'quote',
		'divider',
		'callout',
		'collection_view',
		'collection_view_page',
		'linked_db',
		'column_list',
		'column'
	];
	expect(block_types.length === expected_block_types.length).toBe(true);
	expected_block_types.forEach((expected_block_type) => expect(block_types_map.get(expected_block_type)).toBe(true));
});
