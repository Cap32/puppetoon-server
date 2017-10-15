
import uuid from 'uuid/v4';

export default class Routes {
	constructor(browser, queue) {
		this._browser = browser;
		this._queue = queue;
	}

	async newPage(payload) {
		const { priority = 0 } = payload;
		const id = uuid();
		const wsEndpoint = this._browser.wsEndpoint();
		await this._queue.add(id, { priority });
		return { id, wsEndpoint };
	}

	closePage(payload) {
		const { id } = payload;
		if (!id) { throw new Error('Missing id'); }
		this._queue.remove(id);
		return { id };
	}

	async version() {
		return { version: await this._browser.version() };
	}

	getQueueSize() {
		const { waiting } = this._queue;
		return { size: waiting, waiting };
	}

	getQueuePending() {
		return { pending: this._queue.pending };
	}

	getQueue() {
		const { waiting, pending, concurrency, total, idle } = this._queue;
		return { waiting, pending, concurrency, total, idle };
	}
}
