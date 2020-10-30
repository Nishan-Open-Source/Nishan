import Data from './Data';

import { NishanArg } from '../types/types';
import { IUserSettings } from '../types/api';
import { UpdatableUserSettingsParam } from '../types/function';

/**
 * A class to represent user settings of Notion
 * @noInheritDoc
 */
class UserSettings extends Data<IUserSettings> {
  constructor(arg: NishanArg) {
    super(arg);
  }

  /**
   * Update the current user settings
   * @param opt Options to update the User settings
   */
  async update(
    opt: UpdatableUserSettingsParam
  ) {
    const [op, update] = this.updateCache(opt, ['start_day_of_week',
      'time_zone',
      'locale',
      'preferred_locale',
      'preferred_locale_origin']);

    await this.saveTransactions([
      op
    ]);

    update();
  }
}

export default UserSettings;
