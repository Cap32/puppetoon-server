
import { createLogger } from 'pot-logger';
import chalk from 'chalk';
import Store from './Store';

export default function createRouter(browser, routes) {
	const requestLogger = createLogger('<=', 'green.bold');
	const responseLogger = createLogger('=>', 'magenta.bold');

	return async function run(type, storeConfig, params, response) {
		const store = Store.ensure(storeConfig, browser);
		if (routes[type]) {
			const styledType = chalk.cyan(type);
			requestLogger.info(styledType, params);
			let res = {};
			try {
				res = await routes[type](store, params);
				responseLogger.info(styledType, res);
			}
			catch (err) {
				const { message = 'Unkown error' } = err;
				res.error = `Failed to call "${type}": ${message}`;
			}
			response(res);
		}
		else {
			requestLogger.warn('Unknown type', type);
		}
	};
}
