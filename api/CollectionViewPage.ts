import { v4 as uuidv4 } from 'uuid';
import axios from "axios";

import CollectionBlock from './CollectionBlock';

import { error, warn } from "../utils/logs";
import { IPage, Space, ICollectionViewPage, NishanArg } from '../types';

class CollectionViewPage extends CollectionBlock {
  constructor(arg: NishanArg & {
    parent_id: string,
    block_data: ICollectionViewPage,
  }) {
    super(arg);
    if (arg.block_data.type !== 'collection_view_page')
      throw new Error(error(`Cannot create collection_view_page block from ${arg.block_data.type} block`));
  }
}

export default CollectionViewPage;
