
import yargs from 'yargs';
import { logger, setLoggers } from 'pot-logger';
import { start, stop } from 'pot-js';
import { upperCase } from 'lodash';
import { name, version } from '../package.json';
import { join } from 'path';

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
				.options({
					port: {
						alias: 'p',
						desc: 'Server port',
						default: 8808,
						type: 'number',
					},
					concurrency: {
						alias: 'c',
						desc: 'Max concurrency',
						default: 50,
						type: 'number',
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
					logLevel: isDev ? 'DEBUG' : 'INFO',
					workspace: name,
					execCommand: isDev ? 'babel-node' : 'node',
					watch: isDev,
					maxRestarts: isDev ? 0 : -1,
					inspect: isDev,
					production: !isDev,
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
			stop({ force }).catch((err) => logger.error(err.message));
		},
	})
	.env(upperCase(name))
	.alias('h', 'help')
	.wrap(yargs.terminalWidth())
	.help()
	.version(version)
	.argv
;
