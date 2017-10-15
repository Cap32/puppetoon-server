
import { Bridge } from 'pot-js';
import logger from 'pot-logger';
import { name } from '../package.json';
import Client from './Client';
import chalk from 'chalk';
import logUpdate from 'log-update';
import { addExitListener } from './utils';

class Logger {
	constructor(options) {
		this._data = [];
		this._options = options;
	}

	info(...args) {
		const line = args.join(' ');
		this._data.push(line);
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

export default async function getStatus(options = {}) {
	let client;
	let loopTimeoutId;

	async function loop() {
		const notRunning = () => {
			logger.warn('Not running');
			clearInterval(loopTimeoutId);
		};

		const bridge = await Bridge.getByName(name, name);
		if (!bridge) { return notRunning(); }

		const state = await bridge.getState();
		if (!state) { return notRunning(); }

		const {
			status, started,
			data: { concurrency, headless, timeout, args, port },
		} = state;

		client = await Client.create({
			url: `ws://127.0.0.1:${port}`,
		});

		const queue = await client.send('getQueue');
		client.close();

		const { size, pending } = queue || {};

		new Logger(options)
			.info('Status', chalk[status === 'running' ? 'green' : 'red'](status))
			.info('Queue Concurrency', chalk.bold.yellow(concurrency))
			.info('Queue Idle', chalk.bold.yellow(concurrency - pending))
			.info('Queue Pending', chalk.bold.yellow(pending))
			.info('Queue Size', chalk.bold.yellow(size))
			.verbose('Started at', new Date(started).toString())
			.verbose('Headless', headless)
			.verbose('Timeout', timeout)
			.verbose('Args', args)
			.show()
		;

		loopTimeoutId = setTimeout(loop, 1000);
	}

	loop();
	addExitListener(() => client && client.close());
}
