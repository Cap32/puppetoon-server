
export default class Routes {
	async newPage(store, params) {
		const { priority = 0 } = params;
		return store.createTarget({ priority });
	}

	async closePage(store, params) {
		const { targetId } = params;
		if (!targetId) { throw new Error('Missing targetId'); }
		await store.closeTarget(targetId);
		return { targetId };
	}

	clear(store) {
		return store.clear();
	}

	async version(store) {
		return { version: await store.browser.version() };
	}

	getQueueSize(store) {
		const { waiting } = store.queue;
		return { size: waiting, waiting };
	}

	getQueuePending(store) {
		return { pending: store.queue.pending };
	}

	getQueue(store) {
		const { waiting, pending, concurrency, total, idle } = store.queue;
		return { waiting, pending, concurrency, total, idle };
	}
}
