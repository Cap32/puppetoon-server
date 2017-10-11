
import logger from 'pot-logger';
import uuid from 'uuid/v4';

export default class Routes {
	constructor(browser, queue) {
		this._browser = browser;
		this._queue = queue;
	}

	async newPage(payload) {
		logger.info('newPage', payload);

		const { priority = 0 } = payload;
		const id = uuid();
		const wsEndpoint = this._browser.wsEndpoint();
		await this._queue.add(id, { priority });
		return { id, wsEndpoint };
	}

	closePage(payload) {
		logger.info('closePage', payload);

		const { id } = payload;
		if (!id) { throw new Error('Missing id'); }
		this._queue.remove(id);
		return { id };
	}

	getQueueSize() {
		return { size: this._queue.size };
	}

	async version() {
		return { version: await this._browser.version() };
	}
}
