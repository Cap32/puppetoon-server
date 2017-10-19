
import EventEmitter from 'events';
import WebSocket from 'ws';
import uuid from 'uuid/v4';
import URL from 'url';
import QueryString from 'querystring';

const Events = {
	ApiCall: 'ApiCall',
	Close: 'Close',
};

export default class Client extends EventEmitter {
	static create(options = {}) {
		return new Promise((resolve, reject) => {
			const connection = new Client(options, (err) => {
				if (err) { reject(err); }
				else { resolve(connection); }
			});
		});
	}

	constructor(options, callback) {
		super();

		const {
			onError, url, concurrency, store,
		} = options;

		const urlObj = URL.parse(url);
		const query = Object.assign(QueryString.parse(urlObj.query), {
			concurrency,
		});
		urlObj.search = `?${QueryString.stringify(query)}`;
		if (store) { urlObj.pathname = store; }

		const wsUrl = URL.format(urlObj);

		const ws = this._ws = new WebSocket(wsUrl);
		const callbacks = new Map();

		this.send = (type, payload) => {
			return new Promise((resolve, reject) => {
				const _id = uuid();

				callbacks.set(_id, (res) => {
					callbacks.delete(_id);
					if (res.error) { reject(res); }
					else { resolve(res); }
				});

				this._ws.send(JSON.stringify({ _id, type, payload }));
			});
		};

		this.on(Events.ApiCall, (_id, payload) => {
			if (callbacks.has(_id)) {
				const handler = callbacks.get(_id);
				handler(payload);
			}
		});

		ws.on('message', (message) => {
			try {
				const { _id, payload } = JSON.parse(message);
				if (!_id) { throw new Error('Missing _id'); }
				this.emit(Events.ApiCall, _id, payload);
			}
			catch (err) {
				onError && onError(err);
			}
		});

		ws.on('close', () => {
			this.emit(Events.Close);
		});

		ws.on('open', callback);
		ws.on('error', callback);
	}

	onClose(handler) {
		this.on(Events.Close, handler);
	}

	close() {
		if (this._ws) {
			this._ws.terminate();
			this._ws = null;
		}
	}
}
