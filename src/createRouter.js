
import { createLogger } from 'pot-logger';
import chalk from 'chalk';

const requestLogger = createLogger('<=', 'green.bold');
const responseLogger = createLogger('=>', 'magenta.bold');

export default function createRouter(routes) {
	return async function run(type, prefix, payload, response) {
		if (routes[type]) {
			const styledType = chalk.cyan(type);
			requestLogger.info(styledType, payload);
			let res = {};
			try {
				res = await routes[type](payload, prefix);
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
