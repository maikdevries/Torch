import type { API } from 'homebridge';

import Platform from './platform.js';
import { PLATFORM_NAME } from './settings.js';

export default (homebridge: API) => {
	return homebridge.registerPlatform(PLATFORM_NAME, Platform);
};
