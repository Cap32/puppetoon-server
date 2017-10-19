
import EventEmitter from 'events';
import logger from 'pot-logger';
import WebSocket from 'ws';
import URL from 'url';
import QueryString from 'querystring';

const Events = {
	Connect: 'Connect',
	Disconnect: 'Disconnect',
	ApiCall: 'ApiCall',
};

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
			const config = QueryString.parse(query);
			const concurrency = ~~config.concurrency || 50;

			ws.__storeName = name;
			ws.__queueConfig = { concurrency };

			logger.debug('connected', name);

			this.emit(Events.Connect, ws);

			ws.isAlive = true;
			ws.on('pong', heartbeat);

			ws.on('close', () => {
				this.emit(Events.Disconnect, ws);
			});

			ws.on('message', (data) => {
				try {
					const { payload = {}, type, _id } = JSON.parse(data);

					if (!_id) { throw new Error('Missing _id'); }
					if (!type) { throw new Error('Missing type'); }

					this.emit(Events.ApiCall, ws, type, payload, (payload) => {
						ws.send(JSON.stringify({ _id, payload }));
					});
				}
				catch (err) {
					logger.debug('Invalid message', err);
				}
			});
		});

		this._heartbeatInterval = setInterval(() => {
			wss.clients.forEach((ws) => {
				logger.trace('heartbeat', ws.__storeName);

				if (ws.isAlive === false) {
					logger.debug('Disconnected', ws.__storeName);
					this.emit(Events.Disconnect, ws);
					return ws.terminate();
				}

				ws.isAlive = false;
				ws.ping('', false, true);
			});
		}, 30000);

		wss.on('listening', callback);
		wss.on('error', callback);
	}

	onConnect(handler) {
		this.on(Events.Connect, handler);
	}

	onDisconnect(handler) {
		this.on(Events.Disconnect, handler);
	}

	onApiCall(handler) {
		this.on(Events.ApiCall, handler);
	}

	close(callback) {
		clearInterval(this._heartbeatInterval);
		this._wss.close(callback);
	}
}
