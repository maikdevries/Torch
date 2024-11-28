import type Platform from './platform.js';
import type { JSON } from './types.js';

import { HTTP_METHOD } from './types.js';


export class FetchError implements Error {
	public readonly name: string = 'FetchError';
	public readonly message: string;

	constructor (public readonly status: number, method: keyof typeof HTTP_METHOD, url: string) {
		this.message = `Fetch request failed with status ${this.status}. URL: ${method} ${url}`;
	}
}

export async function fetchJSON (method: keyof typeof HTTP_METHOD, url: URL, body?: JSON): Promise<JSON> | never {
	let response: Response;

	try {
		response = await fetch(url, {
			'method': method,
			'headers': {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			...(body && { 'body': JSON.stringify(body) }),
		});
	} catch { throw new FetchError(503, method, url.toString()) }

	return response.ok
		? (method === HTTP_METHOD.GET ? await response.json() as JSON : {})
		: (() => { throw new FetchError(response.status, method, response.url) })();
}

export function handleFetchError (platform: Platform, error: FetchError): never {
	platform.log.error(error.message);

	switch (error.status) {
		case 400: throw new platform.api.hap.HapStatusError(platform.api.hap.HAPStatus.INVALID_VALUE_IN_REQUEST);
		case 401: throw new platform.api.hap.HapStatusError(platform.api.hap.HAPStatus.INSUFFICIENT_AUTHORIZATION);
		case 403: throw new platform.api.hap.HapStatusError(platform.api.hap.HAPStatus.INSUFFICIENT_PRIVILEGES);
		case 404: throw new platform.api.hap.HapStatusError(platform.api.hap.HAPStatus.RESOURCE_DOES_NOT_EXIST);
		case 408: throw new platform.api.hap.HapStatusError(platform.api.hap.HAPStatus.OPERATION_TIMED_OUT);
		case 503:
		default: throw new platform.api.hap.HapStatusError(platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
	}
}
