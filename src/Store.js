
import Queue from './Queue';
import logger from 'pot-logger';

const stores = new Map();

const getStoreName = (ws) => ws.__storeName;

export default class Store {
	static connect(ws, browser) {
		for (const [name] of stores.entries()) {
			logger.info('store', name);
		}

		const name = getStoreName(ws);
		if (stores.has(name)) {
			const store = stores.get(name);
			store.connect(ws);
			return store;
		}
		else {
			const store = new Store(ws, browser);
			stores.set(name, store);
			logger.info(`store "${name}" created`);
			logger.info(`concurrency: ${ws.__queueConfig.concurrency}`);
			return store;
		}
	}

	static async disconnect(ws) {
		const name = getStoreName(ws);
		if (stores.has(name)) {
			const store = stores.get(name);
			const size = await store.disconnect(ws);
			if (!size) { stores.delete(name); }
		}
	}

	static get(ws) {
		const name = getStoreName(ws);
		return stores.get(name);
	}

	constructor(wsClient, browser) {
		this.connectedCount = 1;
		this.browser = browser;
		this.queue = new Queue(wsClient.__queueConfig);
		this._lastId = 0;
		this._targets = new Map();
		this._wsClients = new Set();
		this._wsClients.add(wsClient);
	}

	connect(wsClient) {
		this._wsClients.add(wsClient);
	}

	async disconnect(wsClient) {
		if (this._wsClients.size) { await this.clear(); }
		this._wsClients.delete(wsClient);
		return this._wsClients.size;
	}

	async createTarget(options) {
		const id = ++this._lastId;
		return this.queue.add(id, async () => {
			const res = await this.browser.createTarget();
			this._targets.set(res.targetId, id);
			return res;
		}, options);
	}

	async closeTarget(targetId) {
		if (this._targets.has(targetId)) {
			const id = this._targets.get(targetId);
			this.queue.close(id);
		}
		const success = await this.browser.closeTarget(targetId);
		if (success) { this._targets.delete(targetId); }
		return { success };
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
