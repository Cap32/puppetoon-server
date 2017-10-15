
import PQueue from 'p-queue';

export default class Queue {
	constructor(options = {}) {
		this.concurrency = (options.concurrency = options.concurrency || 50);
		this._callbacks = new Map();
		this.concurrency = options.concurrency;
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
