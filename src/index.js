
import logger, { setLoggers } from 'pot-logger';
import Connection from './Connection';
import Browser from './Browser';
import Router from './Router';
import API from './API';
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
	maxTabs = 10,
} = configs;

(async function main() {
	try {
		setLoggers({ logLevel, logsDir: resolve(logsDir) });

		const browser = new Browser({
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
		}, maxTabs);
		const connection = await Connection.create({ port });
		const api = new API();

		addExitListener(::connection.close);

		const router = new Router(browser, api);
		connection.onConnect(router.connect.bind(router));
		connection.onDisconnect(router.disconnect.bind(router));
		connection.onApiCall(router.run.bind(router));
	}
	catch (err) {
		logger.fatal(err);
	}
}());
