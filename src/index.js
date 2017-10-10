
import logger, { setLoggers } from 'pot-logger';
import Server from './Server';
import Browser from './Browser';
import Queue from './Queue';

setLoggers('logLevel', 'DEBUG');

(async function main() {
	const browser = new Browser();
	const queue = new Queue({ concurrency: 1 });
	const server = new Server(browser, queue, { port: 8808 });
	await browser.launch();

	logger.trace('browser launched');
}());
