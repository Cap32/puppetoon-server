
import logger, { setLoggers } from 'pot-logger';
import Connection from './Connection';
import Browser from './Browser';
import Queue from './Queue';
import Routes from './Routes';
import createRouter from './createRouter';
import getDefaultLogsDir from './getDefaultLogsDir';
import { signals } from 'signal-exit';
import { resolve } from 'path';

const configs = (function genConfig() {
	try { return JSON.parse(process.env.PUPPETOON_ARGS) || {}; }
	catch (err) { return {}; }
}());

const {
	logLevel = 'INFO',
	logsDir = getDefaultLogsDir(),
	port = 8808,
	headless = true,
	concurrency = 50,
} = configs;

(async function main() {
	try {
		setLoggers({ logLevel, logsDir: resolve(logsDir) });

		const browser = new Browser();
		const queue = new Queue({ concurrency });
		const connection = await Connection.create({ port });
		const routes = new Routes(browser, queue);
		await browser.launch({ headless });

		process.on('exit', () => {
			connection.close();
		});

		signals().forEach((signal) => {
			process.on(signal, process.exit);
		});

		const runRouter = createRouter(routes);
		connection.listen(runRouter);

		logger.trace('browser launched');
	}
	catch (err) {
		logger.fatal(err);
	}
}());
