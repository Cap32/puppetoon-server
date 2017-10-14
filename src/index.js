
import logger, { setLoggers } from 'pot-logger';
import Connection from './Connection';
import Browser from './Browser';
import Queue from './Queue';
import Routes from './Routes';
import createRouter from './createRouter';
import { getDefaultLogsDir, addExitListener } from './utils';
import { resolve } from 'path';

const configs = (function genConfig() {
	try { return JSON.parse(process.env.PUPPETOON_ARGS) || {}; }
	catch (err) { return {}; }
}());

const {
	logLevel = 'INFO',
	logsDir = getDefaultLogsDir(),
	port = 8808,
	concurrency = 50,
	headless = true,
	ignoreHTTPSErrors,
	executablePath,
	slowMo,
	args,
	env,
	timeout,
	dumpio,
	userDataDir,
	devtools,
} = configs;

(async function main() {
	try {
		setLoggers({ logLevel, logsDir: resolve(logsDir) });

		const browser = new Browser();
		const connection = await Connection.create({ port });
		const queue = new Queue({ concurrency }, connection);
		const routes = new Routes(browser, queue);
		await browser.launch({
			headless,
			ignoreHTTPSErrors,
			executablePath,
			slowMo,
			args,
			env,
			timeout,
			dumpio,
			userDataDir,
			devtools,
		});

		addExitListener(::connection.close);

		const runRouter = createRouter(routes);
		connection.listen(runRouter);

		logger.trace('browser launched');
	}
	catch (err) {
		logger.fatal(err);
	}
}());
