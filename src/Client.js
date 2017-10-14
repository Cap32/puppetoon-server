
import EventEmitter from 'events';
import WebSocket from 'ws';
import uuid from 'uuid/v4';

const EventType = 'API_CALL';

export default class Client extends EventEmitter {
	static create(options) {
		return new Promise((resolve, reject) => {
			const connection = new Client(options, (err) => {
				if (err) { reject(err); }
				else { resolve(connection); }
			});
		});
	}

	constructor(options, callback) {
		super();

		const ws = this._ws = new WebSocket(options.url);
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

		this.on(EventType, (_id, payload) => {
			if (callbacks.has(_id)) {
				const handler = callbacks.get(_id);
				handler(payload);
			}
		});

		ws.on('message', (message) => {
			try {
				const { _id, payload } = JSON.parse(message);
				if (!_id) { throw new Error('Missing _id'); }
				this.emit(EventType, _id, payload);
			}
			catch (err) {
				options.onError && options.onError(err);
			}
		});

		ws.on('open', callback);
		ws.on('error', callback);
	}

	close() {
		if (this._ws) {
			this._ws.terminate();
			this._ws = null;
		}
	}
}
