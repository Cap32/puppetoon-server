
import EventEmitter from 'events';
import logger from 'pot-logger';
import WebSocket from 'ws';
import URL from 'url';
import QueryString from 'querystring';

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

		const wss = new WebSocket.Server({
			...options,
			clientTracking: true,
		});
		this._wss = wss;

		function heartbeat() {
			this.isAlive = true;
		}

		wss.on('connection', (ws, request) => {
			const { pathname, query } = URL.parse(request.url);
			const name = pathname.slice(1) || 'root';
			const { concurrency = 50 } = QueryString.parse(query);

			logger.debug('connected', name);

			const storeConfig = { name, concurrency };

			ws.isAlive = true;
			ws.on('pong', heartbeat);

			ws.on('message', (data) => {
				try {
					const { payload = {}, type, _id } = JSON.parse(data);

					if (!_id) { throw new Error('Missing _id'); }
					if (!type) { throw new Error('Missing type'); }

					this.emit(EventType, type, storeConfig, payload, (payload) => {
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
				if (ws.isAlive === false) { return ws.terminate(); }

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
