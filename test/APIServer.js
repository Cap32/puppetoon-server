
import EventEmitter from 'events';
import WebSocket from 'ws';
import uuid from 'uuid/v4';

const EventTypes = {
	Listen: 'LISTEN',
	Call: 'CALL',
};

export default class APIServer extends EventEmitter {
	constructor(url) {
		super();

		this._url = url;
		this._api = null;
		this._callbacks = {};
	}

	listen(handler) {
		this.once(EventTypes.LISTEN, handler);

		const emit = () => {
			this.emit(EventTypes.LISTEN, this._api);
		};

		if (this._api) {
			return emit();
		}

		const ws = this._ws = new WebSocket(this._url);
		const callbacks = this._callbacks;

		const send = (type, payload) => {
			return new Promise((resolve) => {
				const _id = uuid();
				callbacks[_id] = (res) => {
					Reflect.deleteProperty(callbacks, _id);
					resolve(res);
				};
				this._ws.send(JSON.stringify({ _id, type, payload }));
				const handler = (messageId, res) => {
					if (messageId === _id) {
						if (callbacks[_id]) {
							callbacks[_id](res);
						}
					}
					this.removeListener(EventTypes.Call, handler);
				};

				this.on(EventTypes.Call, handler);
			});
		};

		ws.on('open', () => {
			this._api = new Proxy({}, {
				get(target, type) {
					return async function call(payload) {
						return send(type, payload);
					};
				},
			});

			ws.on('message', (message) => {
				try {
					const { _id, payload } = JSON.parse(message);

					if (!_id) { throw new Error('Missing _id'); }

					this.emit(EventTypes.Call, _id, payload);
				}
				catch (err) {
					console.error('Invalid message', err);
				}
			});

			emit();
		});
	}

	close() {
		this._ws && this._ws.terminate();
	}
}
