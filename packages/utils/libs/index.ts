export * from './types';

import { createDefaultRecordMap } from './createDefaultRecordMap';
import { deepMerge } from './deepMerge';
import { extractInlineBlockContent } from './extractInlineBlockContent';
import { getSchemaMapUnit } from './getSchemaMapUnit';
import { getSchemaUnit } from './getSchemaUnit';
import { setDefault } from './setDefault';

export const NotionUtils = {
	getSchemaMapUnit,
	deepMerge,
	getSchemaUnit,
	setDefault,
	extractInlineBlockContent,
	createDefaultRecordMap
};