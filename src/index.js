
import logger, { setLoggers } from 'pot-logger';
import APIServer from './APIServer';
import Browser from './Browser';
import Queue from './Queue';
import Routes from './Routes';
import createRouter from './createRouter';
import { signals } from 'signal-exit';

const configs = (function () {
	try { return JSON.parse(process.env.PUPPETOON_ARGS) || {}; }
	catch (err) { return {}; }
}());

const {
	logLevel = 'INFO',
	port = 8808,
	concurrency = 50,
} = configs;

setLoggers('logLevel', logLevel);

(async function main() {
	const browser = new Browser();
	const queue = new Queue({ concurrency });
	const apiServer = new APIServer({ port });
	const routes = new Routes(browser, queue);

	await browser.launch();

	process.on('exit', () => {
		apiServer.close();
	});

	signals().forEach((signal) => {
		process.on(signal, process.exit);
	});

	const runRouter = createRouter(routes);
	apiServer.listen(runRouter);

	logger.trace('browser launched');
}());
