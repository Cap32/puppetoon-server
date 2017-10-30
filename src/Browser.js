
import { logger } from 'pot-logger';
import puppeteer from 'puppeteer';

// const Max = 4;
const Max = 10;

let prevLocalTargetId = 0;

class Chunk {
	constructor(launch) {
		this._launch = launch;
		this._targets = new Set();
		this._isPending = false;
		this.count = 0;
		this._browser = null;
	}

	async browser() {
		if (this._browser) { return this._browser; }
		this._browser = this._launch();
		const browser = await this._browser;
		this._browser = browser;
		return this._browser;
	}

	add(target) {
		this.count++;
		return this._targets.add(target);
	}

	delete(target) {
		return this._targets.delete(target);
	}

	has(target) {
		return this._targets.has(target);
	}

	get size() {
		return this._targets.size;
	}
}

export default class Browser {
	constructor(launchOptions) {
		this._chunks = new Set();
		this._launchOptions = launchOptions;
	}

	async _launch() {
		const puppeteerBrowser = await puppeteer.launch(this._launchOptions);
		logger.info('New browser launched');
		return puppeteerBrowser;
	}

	async createTarget() {
		const localTargetId = ++prevLocalTargetId;

		const response = async (chunk) => {
			let targetId;
			const browser = await chunk.browser();
			const wsEndpoint = browser.wsEndpoint();
			try {
				const res = await browser._connection.send(
					'Target.createTarget',
					{ url: 'about:blank' },
				);
				targetId = res.targetId;
				chunk.delete(localTargetId);
				chunk.add(targetId);
			}
			catch (err) {
				chunk.delete(localTargetId);
				throw err;
			}
			return { targetId, wsEndpoint };
		};

		for (const chunk of this._chunks) {
			if (chunk.count < Max) {
				chunk.add(localTargetId);
				return response(chunk);
			}
		}

		const chunk = new Chunk(this._launch.bind(this));
		this._chunks.add(chunk);
		chunk.add(localTargetId);
		return response(chunk);
	}

	async closeTarget(targetId) {

		// is `localTargetId`
		if (targetId > 0) { return false; }

		for (const chunk of this._chunks) {
			if (chunk.has(targetId)) {
				const browser = await chunk.browser();
				await browser._connection.send('Target.closeTarget', { targetId });
				chunk.delete(targetId);
				if (!chunk.size) {
					this._chunks.delete(chunk);
					await browser.close();
				}
				return true;
			}
		}
		return false;
	}

	async version() {
		if (this._chunks.size) {
			const values = this._chunks.values();
			const chunk = values.next().value;
			const browser = await chunk.browser();
			return browser.version();
		}
		else {
			const pupBrowser = await this._launch();
			const res = await pupBrowser.version();
			await pupBrowser.close();
			return res;
		}
	}

	get size() {
		return this._chunks.size;
	}
}
