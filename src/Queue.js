
import PQueue from 'p-queue';

export default class Queue {
	constructor(options) {
		this._callbacks = new Map();
		this._queue = new PQueue(options);
	}

	async add(id, options) {
		const queue = this._queue;
		const maybeDelay = queue.add(() => Promise.resolve(), options);
		queue.add(
			() => new Promise((resolve) => this._callbacks.set(id, resolve)),
			options,
		);
		return maybeDelay;
	}

	remove(id) {
		const callbacks = this._callbacks;
		if (callbacks.has(id)) {
			const callback = callbacks.get(id);
			callbacks.delete(id);
			callback();
		}
	}

	get pending() {
		return this._queue.pending;
	}

	get size() {
		return this._queue.size / 2;
	}
}
