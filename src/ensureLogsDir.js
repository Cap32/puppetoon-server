
import { ensureDir } from 'fs-extra';
import homeOrTmp from 'home-or-tmp';
import { name } from '../package.json';
import { resolve } from 'path';

export default async function ensureLogsDir(logsDir) {
	const fullDir = resolve(
		...(logsDir ? [logsDir] : [homeOrTmp, '.config', name, 'logs']),
	);

	await ensureDir(fullDir);
	return fullDir;
}
