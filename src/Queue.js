
import PQueue from 'p-queue';
import Store from './Store';

export default class Queue {
	constructor(options = {}) {
		this.concurrency = (options.concurrency = options.concurrency || 50);
		this.concurrency = options.concurrency;
		this._queue = new PQueue(options);
	}

	async add(id, prefix, options) {
		const queue = this._queue;
		const maybeDelay = queue.add(() => Promise.resolve(), options);
		queue.add(
			() => Store.create(id, prefix),
			options,
		);
		return maybeDelay;
	}

	remove(id, prefix) {
		return Store.remove(id, prefix);
	}

	removeAll(prefix) {
		return Store.removeAll(prefix);
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
