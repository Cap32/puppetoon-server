
import yargs from 'yargs';
import { logger, setLoggers } from 'pot-logger';
import { start, stop } from 'pot-js';
import { upperCase } from 'lodash';
import { name, version } from '../package.json';
import { join } from 'path';
import getStatus from './getStatus';
import { getDefaultLogsDir } from './utils';

const isDev = process.env.NODE_ENV === 'development';

// eslint-disable-next-line
yargs
	.usage('$0 <command> [args]')
	.demand(1, 'Please specify one of the commands!')
	.command({
		command: 'start',
		desc: 'Start process',
		builder(yargs) {
			yargs // eslint-disable-line
				.usage('$0 start [options]')
				.options({
					port: {
						alias: 'p',
						desc: 'Server port',
						default: 8808,
						type: 'number',
					},
					headless: {
						desc: 'Headless mode',
						default: true,
						type: 'bool',
					},
					daemon: {
						alias: 'd',
						desc: 'Use as a daemon',
						default: true,
						type: 'bool',
					},
					logLevel: {
						alias: 'l',
						desc: 'Log level',
						choices: [
							'ALL', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'OFF',
						],
						default: 'INFO',
					},
					force: {
						alias: 'f',
						desc: 'Force restart even if the process is exists',
						type: 'bool',
					},
					cwd: {
						desc: 'Root dir. Defaults to `process.cwd()`',
						type: 'string',
					},
					logsDir: {
						desc: 'Log files dir. Resolve from `cwd`',
						type: 'string',
						default: getDefaultLogsDir(),
					},
					executablePath: {
						desc: 'Path to a Chromium executable to run instead of bundled Chromium. If executablePath is a relative path, then it is resolved relative to current working directory',
						type: 'string',
					},
					args: {
						desc: 'Additional arguments to pass to the Chromium instance',
						type: 'array',
						default: ['--no-sandbox', '--disable-setuid-sandbox'],
					},
					launchIgnoreHTTPSErrors: {
						desc: 'Whether to ignore HTTPS errors during navigation',
						type: 'bool',
						default: false,
					},
					slowMo: {
						desc: 'Slows down Puppeteer operations by the specified amount of milliseconds. Useful so that you can see what is going on',
						type: 'number',
					},
					timeout: {
						desc: 'Maximum time in milliseconds to wait for the Chrome instance to start (in seconds). Pass 0 to disable timeout',
						type: 'number',
						default: 30000,
					},
					dumpio: {
						desc: 'Whether to pipe browser process stdout and stderr into process.stdout and process.stderr',
						type: 'bool',
						default: false,
					},
					userDataDir: {
						desc: 'Path to a User Data Directory',
						type: 'string',
					},
					devtools: {
						desc: 'Whether to auto-open DevTools panel for each tab. If this option is true, the headless option will be set false',
						type: 'bool',
					},
					env: {
						desc: 'Process and Chromium environment variables',
					},
				})
				.argv
			;
		},
		async handler(argv) {
			try {
				await start({
					...argv,
					name,
					daemon: isDev ? false : argv.daemon,
					logLevel: isDev ? 'DEBUG' : argv.logLevel,
					workspace: name,
					execCommand: isDev ? 'babel-node' : 'node',
					maxRestarts: isDev ? 0 : -1,
					inspect: isDev,
					production: !isDev,
					watch: isDev,
					entry: join(__dirname, 'index.js'),
					configToEnv: 'PUPPETOON_ARGS',
				});
			}
			catch (err) {
				setLoggers('logLevel', argv.logLevel);
				logger.error(err.message);
				logger.debug(err);
			}
		},
	})
	.command({
		command: 'stop [name]',
		desc: 'Stop process',
		builder(yargs) {
			yargs // eslint-disable-line
				.usage('$0 stop [options]')
				.options({
					f: {
						alias: 'force',
						desc: 'Stop without confirming',
						type: 'bool',
					},
				})
				.argv
			;
		},
		handler({ force }) {
			const options = { force, name, workspace: name };
			stop(options).catch((err) => logger.error(err.message));
		},
	})
	.command({
		command: 'status',
		desc: 'Show status',
		builder(yargs) {
			yargs // eslint-disable-line
				.usage('$0 status <store> [options]')
				.demand(1, 'Please specify store')
				.options({
					verbose: {
						alias: 'v',
						desc: 'Verbose',
						type: 'bool',
					},
				})
				.argv
			;
		},
		handler(argv) {
			const [, store] = argv._;
			getStatus(store, argv).catch((err) => logger.error(err.message));
		},
	})
	.env(upperCase(name))
	.alias('h', 'help')
	.wrap(yargs.terminalWidth())
	.help()
	.version(version)
	.argv
;
