import type { API } from 'homebridge';

import Platform from './platform.ts';
import { PLATFORM_NAME } from './settings.ts';


export default (homebridge: API) => homebridge.registerPlatform(PLATFORM_NAME, Platform);
