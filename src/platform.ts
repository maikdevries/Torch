import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, Service } from 'homebridge';
import type { Config, Context } from './types.js';

import Lightbulb from './accessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';


export default class Platform implements DynamicPlatformPlugin {
	public readonly Service: typeof Service;
	public readonly Characteristic: typeof Characteristic;

	public readonly accessories: PlatformAccessory<Context>[] = [];

	constructor (public readonly log: Logging, public readonly config: Config, public readonly api: API) {
		this.Service = this.api.hap.Service;
		this.Characteristic = this.api.hap.Characteristic;

		this.log.debug('Finished initialisation of platform:', this.config.name);

		this.api.on('didFinishLaunching', () => this.discoverDevices());
	}

	configureAccessory (accessory: PlatformAccessory<Context>): void {
		this.log.info('Configuring accessory:', accessory.displayName);

		new Lightbulb(this, accessory);
		this.accessories.push(accessory);
	}

	private discoverDevices (): void {
		for (const lightbulb of this.config.lightbulbs) {
			const uuid = this.api.hap.uuid.generate(`${this.config.name} - ${lightbulb.name}`);

			const existingAccessory = this.accessories.find((x) => x.UUID === uuid);

			if (existingAccessory) {
				this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

				existingAccessory.context.device = lightbulb;
				this.api.updatePlatformAccessories([existingAccessory]);
			} else {
				this.log.info('Creating new accessory:', lightbulb.name);

				const accessory = new this.api.platformAccessory<Context>(lightbulb.name, uuid);
				accessory.context.device = lightbulb;

				this.configureAccessory(accessory);
				this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
			}
		}
	}
}
