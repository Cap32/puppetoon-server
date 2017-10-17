
import PQueue from 'p-queue';

export default class Queue {
	constructor(config) {
		this.concurrency = config.concurrency;
		this._queue = new PQueue(config);
		this._callbacks = new Map();
	}

	async add(id, resolve, options) {
		const queue = this._queue;

		const createCallback = () => {
			const res = {
				resolve: () => {},
				reject: () => {},
			};
			res.wait = new Promise((resolve, reject) => {
				res.resolve = resolve;
				res.reject = () => reject(new Error('Canceled'));
			});
			return res;
		};
		this._callbacks.set(id, createCallback());

		const resPromise = queue.add(resolve, options);
		queue.add(async () => {
			if (this._callbacks.has(id)) {
				const callback = this._callbacks.get(id);
				await callback.wait;
			}
		}, options);
		return resPromise;
	}

	close(id) {
		if (this._callbacks.has(id)) {
			const callback = this._callbacks.get(id);
			this._callbacks.delete(id);
			callback.resolve();
		}
	}

	clear() {
		for (const callback of this._callbacks.values()) {
			callback.reject();
		}
		this._callbacks.clear();
		this._queue.clear();
	}

	get pending() {
		return this._queue.pending;
	}

	get waiting() {
		return this._queue.size / 2;
	}

	get idle() {
		return this.concurrency - this.pending;
	}

	get total() {
		return this.pending + this.waiting;
	}
}
