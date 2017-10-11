
import EventEmitter from 'events';
import logger from 'pot-logger';
import WebSocket from 'ws';

const EventType = 'API_CALL';

export default class APIServer extends EventEmitter {
	constructor(options) {
		super();

		const wss = new WebSocket.Server(options);
		this._wss = wss;

		wss.on('connection', (ws) => {
			logger.debug('connected');

			ws.on('message', (data) => {
				try {
					const { payload = {}, type, _id } = JSON.parse(data);

					if (!_id) { throw new Error('Missing _id'); }
					if (!type) { throw new Error('Missing type'); }

					this.emit(EventType, type, payload, function response(payload) {
						ws.send(JSON.stringify({ _id, payload }));
					});
				}
				catch (err) {
					logger.debug('Invalid message', err);
				}
			});
		});

		wss.on('error', logger.error);
	}

	listen(handler) {
		this.on(EventType, handler);
	}

	close(callback) {
		this._wss.close(callback);
	}
}
