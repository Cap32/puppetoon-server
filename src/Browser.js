
import logger from 'pot-logger';
import puppeteer from 'puppeteer';

export default class Browser {
	constructor() {
		this._browser = null;
	}

	async launch(options) {
		try {
			this._browser = await puppeteer.launch({
				args: ['--no-sandbox', '--disable-setuid-sandbox'],
				...options,
			});
		}
		catch (err) {
			logger.fatal(err);
		}
		return this;
	}

	async newPage() {
		return this._browser.newPage();
	}

	wsEndpoint() {
		return this._browser.wsEndpoint();
	}

	version() {
		return this._browser.version();
	}
}
