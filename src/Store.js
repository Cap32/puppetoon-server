
const stores = new Map();

export default class Store {
	static ensure(prefix) {
		if (stores.has(prefix)) {
			return stores.get(prefix);
		}
		else {
			const newStore = new Store();
			stores.set(prefix, newStore);
			return newStore;
		}
	}

	static create(id, prefix) {
		const store = Store.ensure(prefix);
		return new Promise((resolve) => {
			store.create(id, resolve);
		});
	}

	static remove(id, prefix) {
		const store = Store.ensure(prefix);
		store.remove(id);
	}

	static removeAll(prefix) {
		const store = Store.ensure(prefix);
		return store.removeAll();
	}

	constructor() {
		this._ids = new Map();
	}

	create(id, callback) {
		this._ids.set(id, {
			createdAt: new Date(),
			callback,
		});
	}

	remove(id) {
		if (this._ids.has(id)) {
			const { callback } = this._ids.get(id);
			this._ids.delete(id);
			callback();
			return id;
		}
		return null;
	}

	removeAll() {
		const list = [];
		this._ids.forEach(({ callback }, id) => {
			this._ids.delete(id);
			list.push(id);
			callback();
		});
		return list;
	}
}
