
import logger from 'pot-logger';

export default function createRouter(routes) {
	return async function run(type, payload, response) {
		if (routes[type]) {
			logger.debug('called', type);
			let res = {};
			try {
				res = await routes[type](payload);
				logger.debug('res', res);
			}
			catch (err) {
				const { message = 'Unkown error' } = err;
				res.error = `Failed to call "${type}": ${message}`;
			}
			response(res);
		}
		else {
			logger.warn('Unknown type', type);
		}
	};
}
