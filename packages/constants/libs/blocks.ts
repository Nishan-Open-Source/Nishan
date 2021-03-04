import { TBlockType } from '@nishans/types';

export const createBlockTypesArray = () => {
	return [
		'linked_db',
		'collection_view_page',
		'embed',
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
		'link_to_page',
		'column_list',
		'column'
	] as TBlockType[];
};
