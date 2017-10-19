
import { logger, setLoggers } from 'pot-logger';
import Client from './Client';
import chalk from 'chalk';
import logUpdate from 'log-update';
import { addExitListener } from './utils';
import delay from 'delay';

class InstantLogger {
	constructor(options) {
		this._data = [];
		this._options = options;
	}

	info(title, value = '', style = 'yellow') {
		this._data.push(`${title} ${chalk.bold[style](value)}`);
		return this;
	}

	verbose(...args) {
		if (!this._options.verbose) { return this; }
		return this.info(...args);
	}

	show() {
		logUpdate(this._data.join('\n'));
	}
}

export default async function getStatus(store, options = {}) {
	const { port = 8808, logLevel = 'INFO', verbose } = options;

	const client = await Client.create({
		url: `ws://127.0.0.1:${port}/${store}`,
	});

	setLoggers('logLevel', logLevel);

	addExitListener(() => client && client.close());

	try {
		while (true) {
			const status = await client.send('getStatus');
			const {
				name,
				createdAt,
				connections,
				browsers,
				waiting,
				pending,
				idle,
				concurrency,
			} = status || {};

			// ignore `getStatus` connection
			const count = connections - 1;
			const instantLogger = new InstantLogger({ verbose });

			if (count < 1) {
				instantLogger
					.info(chalk.red(`"${name}" has not created or has closed`))
					.show()
				;
				return process.exit(0);
			}

			instantLogger
				.info('Connections', count)
				.info('Queue Concurrency', concurrency)
				.info('Queue Idle', idle)
				.info('Queue Pending', pending)
				.info('Queue Waiting', waiting)
				.verbose('Started at', new Date(createdAt).toString(), 'grey')
				.verbose('Browsers', browsers)
				.show()
			;

			await delay(1000);
		}
	}
	catch (err) {
		logger.warn(err.message || 'Not running');
		logger.debug(err);
	}
}
