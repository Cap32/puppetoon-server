
import homeOrTmp from 'home-or-tmp';
import { resolve } from 'path';
import { name } from '../package.json';

export default function getDefaultLogsDir() {
	return resolve(homeOrTmp, '.config', name, 'logs');
}
