
import logger from 'pot-logger';
import WebSocket from 'ws';
import Router from './Router';
import { signals } from 'signal-exit';

export default class Server {
	constructor(browser, queue, options) {
		const wss = new WebSocket.Server(options);
		this._wss = wss;
		this._browser = browser;
		this._router = new Router(browser, queue);

		wss.on('connection', (ws) => {

			logger.debug('connected');

			const response = (data) => ws.send(JSON.stringify(data));

			ws.on('message', async (data) => {
				try {
					const { payload = {}, type } = JSON.parse(data);
					if (!type) { throw new Error('Missing type'); }
					await this.handleRoute(type, payload, response);
				}
				catch (err) {
					logger.debug('Invalid message', err);
				}
			});
		});

		wss.on('error', logger.error);

		process.on('exit', () => {
			wss.close();
		});

		signals().forEach((signal) => {
			process.on(signal, process.exit);
		});
	}

	async handleRoute(type, payload, response) {
		const router = this._router;
		if (router[type]) {
			logger.debug('called', type);
			const body = await router[type](payload);
			response({ type, body });
		}
		else {
			logger.warn('Unknown type', type);
		}
	}
}
