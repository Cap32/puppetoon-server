
import EventEmitter from 'events';
import logger from 'pot-logger';
import WebSocket from 'ws';

const EventType = 'API_CALL';

export default class Connection extends EventEmitter {
	static create(options) {
		return new Promise((resolve, reject) => {
			const connection = new Connection(options, (err) => {
				if (err) { reject(err); }
				else { resolve(connection); }
			});
		});
	}

	constructor(options, callback) {
		super();

		const wss = new WebSocket.Server(options);
		this._wss = wss;

		function heartbeat() {
			this.isAlive = true;
		}

		wss.on('connection', (ws) => {
			logger.debug('connected');

			ws.isAlive = true;
			ws.on('pong', heartbeat);

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

		this._heartbeatInterval = setInterval(function ping() {
			wss.clients.forEach(function each(ws) {
				if (ws.isAlive === false) return ws.terminate();

				ws.isAlive = false;
				ws.ping('', false, true);
			});
		}, 30000);

		wss.on('listening', callback);
		wss.on('error', callback);
	}

	listen(handler) {
		this.on(EventType, handler);
	}

	close(callback) {
		clearInterval(this._heartbeatInterval);
		this._wss.close(callback);
	}
}
