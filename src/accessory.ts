import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import type Platform from './platform.js';
import type { Context, LightbulbConfig, State } from './types.js';
import type { FetchError } from './utils.js';

import { FIRMWARE_REVISION, MANUFACTURER, MODEL, SERIAL_NUMBER } from './settings.js';
import { BRIGHTNESS_UNIT, COLOUR_MODE, HUE_UNIT, MODE, SATURATION_UNIT, TEMPERATURE_UNIT } from './types.js';
import { fetchJSON, handleFetchError } from './utils.js';


export default class Lightbulb {
	private service: Service;

	private readonly config: LightbulbConfig;

	// [TODO]
	private state: State = {
		'power': false,
		'brightness': NaN,
		'temperature': NaN,
		'hue': NaN,
		'saturation': NaN,
	}

	constructor (private readonly platform: Platform, private readonly accessory: PlatformAccessory<Context>) {
		this.config = this.accessory.context.device;

		this.accessory.getService(this.platform.Service.AccessoryInformation)!
			// .setCharacteristic(this.platform.Characteristic.Identify, undefined)
			.setCharacteristic(this.platform.Characteristic.Manufacturer, MANUFACTURER)
			.setCharacteristic(this.platform.Characteristic.Model, MODEL)
			// .setCharacteristic(this.platform.Characteristic.Name, undefined)
			.setCharacteristic(this.platform.Characteristic.SerialNumber, SERIAL_NUMBER)
			.setCharacteristic(this.platform.Characteristic.FirmwareRevision, FIRMWARE_REVISION);

		// [NOTE] Either get existing Lightbulb service or create a new Lightbulb service
		this.service = this.accessory.getService(this.platform.Service.Lightbulb)
			?? this.accessory.addService(this.platform.Service.Lightbulb);

		// [NOTE] Set the default Lightbulb name shown in the Home app to the configured name
		this.service.setCharacteristic(this.platform.Characteristic.Name, this.config.name);

		this.service.getCharacteristic(this.platform.Characteristic.On)
			.onGet(this.getPower.bind(this))
			.onSet(this.setPower.bind(this));

		if (this.config.brightness.mode === MODE.ENABLED) {
			this.service.getCharacteristic(this.platform.Characteristic.Brightness)
				.onGet(this.getBrightness.bind(this))
				.onSet(this.setBrightness.bind(this));
		}

		if (this.config.colour.mode !== COLOUR_MODE.DISABLED) {
			this.service.getCharacteristic(this.platform.Characteristic.Hue)
				.onGet(this.getHue.bind(this))
				.onSet(this.setHue.bind(this));

			this.service.getCharacteristic(this.platform.Characteristic.Saturation)
				.onGet(this.getSaturation.bind(this))
				.onSet(this.setSaturation.bind(this));
		}

		if (this.config.temperature.mode === MODE.ENABLED) {
			this.service.getCharacteristic(this.platform.Characteristic.ColorTemperature)
				.onGet(this.getTemperature.bind(this))
				.onSet(this.setTemperature.bind(this));
		}
	}

	// [TODO]
	async identify (): Promise<void> {
		this.platform.log.debug('Attempting to identify lightbulb:', this.accessory.displayName);
	}

	async getPower (): Promise<CharacteristicValue> {
		try {
			const data = await fetchJSON(
				this.config.power.status.method,
				new URL(this.config.power.status.url),
			);

			this.platform.log.debug('Retrieved the power state as:', data.power);

			this.state.power = data.power as boolean;
			return this.state.power;
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async setPower (value: CharacteristicValue): Promise<void> {
		const power = value as boolean;

		if (this.state.power === power) return this.platform.log.debug('The power state remains:', this.state.power);

		try {
			await fetchJSON(
				this.config.power.update.method,
				new URL(this.config.power.update.url),
				{ 'power': power },
			);

			this.state.power = value as boolean;
			this.platform.log.debug('Changed the power state to:', this.state.power);
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async getBrightness (): Promise<CharacteristicValue> {
		if (!Number.isNaN(this.state.brightness)) return this.state.brightness;

		try {
			const data = await fetchJSON(
				this.config.brightness.status.method,
				new URL(this.config.brightness.status.url),
			);

			this.platform.log.debug('Retrieved the brightness as:', data.brightness);

			// [NOTE] Convert retrieved RGB brightness value in range [0 - 254] to percentage value in range [0 - 100]
			if (this.config.brightness.unit === BRIGHTNESS_UNIT.RGB) {
				data.brightness = Math.round((data.brightness as number) / 254 * 100);
				this.platform.log.debug('Converted the retrieved brightness to:', data.brightness);
			}

			// [NOTE] Clamp brightness value to expected range [0 - 100]
			data.brightness = Math.max(0, Math.min(100, (data.brightness as number)));

			this.state.brightness = data.brightness;
			return this.state.brightness;
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async setBrightness (value: CharacteristicValue): Promise<void> {
		let brightness = value as number;

		if (this.state.brightness === brightness) return this.platform.log.debug('The brightness remains:', this.state.brightness);

		// [NOTE] Convert requested percentage brightness value in range [0 - 100] to RGB value in range [0 - 254]
		if (this.config.brightness.unit === BRIGHTNESS_UNIT.RGB) {
			brightness = Math.round(brightness * 254 / 100);
			this.platform.log.debug('Converted the requested brightness to:', brightness);
		}

		try {
			await fetchJSON(
				this.config.brightness.update.method,
				new URL(this.config.brightness.update.url),
				{ 'brightness': brightness },
			);

			this.state.brightness = value as number;
			this.platform.log.debug('Changed the brightness to:', this.state.brightness);
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async getHue (): Promise<CharacteristicValue> {
		if (!Number.isNaN(this.state.hue)) return this.state.hue;

		try {
			const data = await fetchJSON(
				this.config.colour.hue.status.method,
				new URL(this.config.colour.hue.status.url),
			);

			this.platform.log.debug('Retrieved the hue as:', data.hue);

			// [NOTE] Convert retrieved Zigbee hue value in range [0 - 65535] to degree value in range [0 - 360]
			if (this.config.colour.hue.unit === HUE_UNIT.ZIGBEE) {
				data.hue = Math.round((data.hue as number) / 65535 * 360);
				this.platform.log.debug('Converted the retrieved hue to:', data.hue);
			}

			// [NOTE] Clamp hue value to expected range [0 - 360]
			data.hue = Math.max(0, Math.min(360, (data.hue as number)));

			this.state.hue = data.hue;
			return this.state.hue;
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async setHue (value: CharacteristicValue): Promise<void> {
		let hue = value as number;

		if (this.state.hue === hue) return this.platform.log.debug('The hue remains:', this.state.hue);

		// [NOTE] Convert requested degree hue value in range [0 - 360] to Zigbee value in range [0 - 65535]
		if (this.config.colour.hue.unit === HUE_UNIT.ZIGBEE) {
			hue = Math.round(hue * 65535 / 360);
			this.platform.log.debug('Converted the requested hue to:', hue);
		}

		try {
			await fetchJSON(
				this.config.colour.hue.update.method,
				new URL(this.config.colour.hue.update.url),
				{ 'hue': hue },
			);

			this.state.hue = value as number;
			this.platform.log.debug('Changed the hue to:', this.state.hue);
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async getSaturation (): Promise<CharacteristicValue> {
		if (!Number.isNaN(this.state.saturation)) return this.state.saturation;

		try {
			const data = await fetchJSON(
				this.config.colour.saturation.status.method,
				new URL(this.config.colour.saturation.status.url),
			);

			this.platform.log.debug('Retrieved the saturation as:', data.saturation);

			// [NOTE] Convert retrieved RGB saturation value in range [0 - 254] to percentage value in range [0 - 100]
			if (this.config.colour.saturation.unit === SATURATION_UNIT.RGB) {
				data.saturation = Math.round((data.saturation as number) / 254 * 100);
				this.platform.log.debug('Converted the retrieved saturation to:', data.saturation);
			}

			// [NOTE] Clamp saturation value to expected range [0 - 100]
			data.saturation = Math.max(0, Math.min(100, (data.saturation as number)));

			this.state.saturation = data.saturation;
			return this.state.saturation;
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async setSaturation (value: CharacteristicValue): Promise<void> {
		let saturation = value as number;

		if (this.state.saturation === saturation) return this.platform.log.debug('The saturation remains:', this.state.saturation);

		// [NOTE] Convert requested percentage saturation value in range [0 - 100] to RGB value in range [0 - 254]
		if (this.config.colour.saturation.unit === SATURATION_UNIT.RGB) {
			saturation = Math.round(saturation * 254 / 100);
			this.platform.log.debug('Converted the requested saturation to:', saturation);
		}

		try {
			await fetchJSON(
				this.config.colour.saturation.update.method,
				new URL(this.config.colour.saturation.update.url),
				{ 'saturation': saturation },
			);

			this.state.saturation = value as number;
			this.platform.log.debug('Changed the saturation to:', this.state.saturation);
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async getTemperature (): Promise<CharacteristicValue> {
		if (!Number.isNaN(this.state.temperature)) return this.state.temperature;

		try {
			const data = await fetchJSON(
				this.config.temperature.status.method,
				new URL(this.config.temperature.status.url),
			);

			this.platform.log.debug('Retrieved the colour temperature as:', data.temperature);

			// [NOTE] Convert retrieved Kelvin colour temperature value in range [7150 - 2000] to Mired value in range [140 - 500]
			if (this.config.temperature.unit === TEMPERATURE_UNIT.KELVIN) {
				data.temperature = Math.round(1000000 / (data.temperature as number));
				this.platform.log.debug('Converted the retrieved colour temperature to:', data.temperature);
			}

			// [NOTE] Clamp colour temperature value to expected range [140 - 500]
			data.temperature = Math.max(140, Math.min(500, (data.temperature as number)));

			this.state.temperature = data.temperature;
			return this.state.temperature;
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}

	async setTemperature (value: CharacteristicValue): Promise<void> {
		let temperature = value as number;

		if (this.state.temperature === temperature)
			return this.platform.log.debug('The colour temperature remains:', this.state.temperature);

		// [NOTE] Convert requested Mired colour temperature value in range [140 - 500] to Kelvin value in range [7150 - 2000]
		if (this.config.temperature.unit === TEMPERATURE_UNIT.KELVIN) {
			temperature = Math.round(1000000 / temperature);
			this.platform.log.debug('Converted the requested colour temperature to:', temperature);
		}

		try {
			await fetchJSON(
				this.config.temperature.update.method,
				new URL(this.config.temperature.update.url),
				{ 'temperature': temperature },
			);

			this.state.temperature = value as number;
			this.platform.log.debug('Changed the colour temperature to:', this.state.temperature);
		} catch (error: unknown) { return handleFetchError(this.platform, error as FetchError) }
	}
}
