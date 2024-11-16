export interface State {
	power: boolean;
	brightness: number;
	temperature: number;
	hue: number;
	saturation: number;
}

export interface Config {
	name: string;
	power: {
		status: Endpoint;
		update: Endpoint;
	};
	brightness: {
		mode: keyof typeof MODE;
		unit: keyof typeof BRIGHTNESS_UNIT;
		status: Endpoint;
		update: Endpoint;
	};
	colour: {
		mode: keyof typeof COLOUR_MODE;
		hex: {
			status: Endpoint;
			update: Endpoint;
		};
		hue: {
			unit: keyof typeof HUE_UNIT;
			status: Endpoint;
			update: Endpoint;
		};
		saturation: {
			unit: keyof typeof SATURATION_UNIT;
			status: Endpoint;
			update: Endpoint;
		};
	};
	temperature: {
		mode: keyof typeof MODE;
		unit: keyof typeof TEMPERATURE_UNIT;
		status: Endpoint;
		update: Endpoint;
	};
}

interface Endpoint {
	method: keyof typeof HTTP_METHOD;
	url: string;
}

export const HTTP_METHOD = {
	GET: 'GET',
	POST: 'POST',
	PUT: 'PUT',
} as const;

export const MODE = {
	DISABLED: 'DISABLED',
	ENABLED: 'ENABLED',
} as const;

export const COLOUR_MODE = {
	DISABLED: 'DISABLED',
	HSV: 'HSV',
	HEX: 'HEX',
} as const;

export const BRIGHTNESS_UNIT = {
	PERCENTAGE: 'PERCENTAGE',
	RGB: 'RGB',
} as const;

export const HUE_UNIT = {
	DEGREES: 'DEGREES',
	ZIGBEE: 'ZIGBEE',
} as const;

export const SATURATION_UNIT = {
	PERCENTAGE: 'PERCENTAGE',
	RGB: 'RGB',
} as const;

export const TEMPERATURE_UNIT = {
	KELVIN: 'KELVIN',
	MIRED: 'MIRED',
} as const;

export interface JSON {
	[key: string]: string | number | boolean | null | JSON | JSON[];
}
