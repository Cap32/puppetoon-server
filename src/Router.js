
import { logger, createLogger } from 'pot-logger';
import chalk from 'chalk';
import Store from './Store';

export default class Router {
	constructor(browser, api) {
		this._browser = browser;
		this._api = api;
		this._requestLogger = createLogger('<=', 'green.bold');
		this._responseLogger = createLogger('=>', 'magenta.bold');
	}

	connect(ws) {
		Store.connect(ws, this._browser);
	}

	async disconnect(ws) {
		try {
			await Store.disconnect(ws);
		}
		catch (err) {
			logger.error(err);
		}
	}

	async run(ws, type, params, response) {
		const store = Store.get(ws);
		const handler = (this._api || {})[type];
		if (handler) {
			const styledType = chalk.cyan(type);
			this._requestLogger.info(styledType, params);
			let res = {};
			try {
				res = await handler(store, params);
				this._responseLogger.info(styledType, res);
			}
			catch (err) {
				const { message = 'Unkown error' } = err;
				res.error = `Failed to call "${type}": ${message}`;
				logger.debug(err);
			}
			response(res);
		}
		else {
			this._requestLogger.warn('Unknown type', type);
		}
	}
}
