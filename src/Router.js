
import logger from 'pot-logger';
import uuid from 'uuid/v4';

export default class Router {
	constructor(browser, queue) {
		this._browser = browser;
		this._queue = queue;
	}

	async newPage(payload) {
		logger.info('newPage', payload);

		const id = uuid();
		const wsEndpoint = this._browser.wsEndpoint();
		await this._queue.add(id);
		return { ok: true, id, wsEndpoint };
	}

	closePage(payload) {
		logger.info('closePage', payload);

		const { id } = payload;
		this._queue.remove(id);
		return { ok: true, id };
	}

	getQueueSize() {
		return { size: this._queue.size };
	}
}
