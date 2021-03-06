import { IPage } from '@nishans/types';
import { PageExtracted } from './types';

export const extractPagesData = (row_pages: (IPage | PageExtracted)[]) =>
	row_pages.map((page) => ({
    is_template: page.is_template ?? false,
		properties: page.properties,
		format: page.format
	}));
