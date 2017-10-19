
import { logger } from 'pot-logger';
import puppeteer from 'puppeteer';

// const Max = 4;
const Max = 100;

class Chunk {
	constructor(launch) {
		this._launch = launch;
		this._targets = new Set();
		this._isPending = false;
		this._browser = null;
	}

	async browser() {
		if (this._browser) { return this._browser; }
		this._browser = this._launch();
		const browser = await this._browser;
		this._browser = browser;
		return this._browser;
	}

	add(id) {
		return this._targets.add(id);
	}

	delete(id) {
		return this._targets.delete(id);
	}

	has(id) {
		return this._targets.has(id);
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
		const response = async (chunk) => {
			const browser = await chunk.browser();
			const wsEndpoint = browser.wsEndpoint();
			const { targetId } = await browser._connection.send(
				'Target.createTarget',
				{ url: 'about:blank' },
			);
			chunk.add(targetId);
			return { targetId, wsEndpoint };
		};

		for (const chunk of this._chunks) {
			if (chunk.size < Max) {
				return response(chunk);
			}
		}

		const chunk = new Chunk(this._launch.bind(this));
		this._chunks.add(chunk);
		return response(chunk);
	}

	async closeTarget(targetId) {
		for (const chunk of this._chunks) {
			if (chunk.has(targetId)) {
				const browser = await chunk.browser();
				await browser._connection.send('Target.closeTarget', { targetId });
				chunk.delete(targetId);
				if (!chunk.size) {
					await browser.close();
					this._chunks.delete(chunk);
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
