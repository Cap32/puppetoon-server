
import logger from 'pot-logger';
import puppeteer from 'puppeteer';

export default class Browser {
	constructor() {
		this._browser = null;
	}

	async launch(options) {
		try {
			this._browser = await puppeteer.launch(options);
		}
		catch (err) {
			logger.fatal(err);
		}
		return this;
	}

	async createTarget() {
		const { targetId } = await this._browser._connection.send(
			'Target.createTarget',
			{ url: 'about:blank' },
		);
		return targetId;
	}

	async closeTarget(targetId) {
		return this._browser._connection.send(
			'Target.closeTarget',
			{ targetId },
		);
	}

	wsEndpoint() {
		return this._browser.wsEndpoint();
	}

	version() {
		return this._browser.version();
	}
}
