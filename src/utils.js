
import homeOrTmp from 'home-or-tmp';
import { signals } from 'signal-exit';
import { resolve } from 'path';
import { name } from '../package.json';

export function getDefaultLogsDir() {
	return resolve(homeOrTmp, '.config', name, 'logs');
}

export function addExitListener(handler) {
	process.on('exit', handler);

	signals().forEach((signal) => {
		process.on(signal, process.exit);
	});
}
