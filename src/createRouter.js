
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
				res.error = err.message || 'UNKNOWN ERROR';
			}
			response(res);
		}
		else {
			logger.warn('Unknown type', type);
		}
	};
}
