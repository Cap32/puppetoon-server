
import { createLogger } from 'pot-logger';

const requestLogger = createLogger('REQUEST', 'blue');
const responseLogger = createLogger('RESPONSE', 'yellow');

export default function createRouter(routes) {
	return async function run(type, payload, response) {
		if (routes[type]) {
			requestLogger.info(type, payload);
			let res = {};
			try {
				res = await routes[type](payload);
				responseLogger.info(type, res);
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
