
import Queue from './Queue';
import logger from 'pot-logger';

const stores = new Map();

export default class Store {
	static ensure(storeConfig, browser) {
		const { name, ...queueConfig } = storeConfig;
		if (stores.has(name)) { return stores.get(name); }
		else {
			const store = new Store(name, queueConfig, browser);
			stores.set(name, store);
			return store;
		}
	}

	constructor(name, queueConfig, browser) {
		this.browser = browser;
		this.queue = new Queue(queueConfig);
		this._lastId = 0;
		this._targets = new Map();

		logger.info(`store "${name}" created`);
		logger.info(`concurrency: ${queueConfig.concurrency}`);
	}

	async createTarget(options) {
		const id = ++this._lastId;
		return this.queue.add(id, async () => {
			const targetId = await this.browser.createTarget();
			this._targets.set(targetId, id);
			return {
				targetId,
				wsEndpoint: this.browser.wsEndpoint,
			};
		}, options);
	}

	async closeTarget(targetId) {
		if (this._targets.has(targetId)) {
			const id = this._targets.get(targetId);
			this.queue.close(id);
		}
		return this.browser.closeTarget(targetId);
	}

	async clear() {
		const promises = [];
		for (const targetId of this._targets.keys()) {
			promises.push(this.closeTarget(targetId));
		}
		this.queue.clear();
		return Promise.all(promises);
	}
}
