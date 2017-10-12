
import APIServer from './APIServer';
import { signals } from 'signal-exit';
import delay from 'delay';

const apiServer = new APIServer('ws://127.0.0.1:8808');

apiServer.listen(async (api) => {
	try {
		const debug = process.argv[2] || 'hello';
		const pageInfo = await api.newPage({
			debug,
		});
		console.log('newPage', pageInfo);

		await delay(2000);

		const { version } = await api.version();
		console.log('version', version);

		const queue = await api.getQueue();
		console.log('queue', queue);

		await delay(2000);

		await api.closePage(pageInfo);
		console.log('page closed');
		process.exit(0);
	}
	catch (err) {
		console.error(err);
	}
});

process.on('exit', () => {
	apiServer.close();
});

signals().forEach((signal) => {
	process.on(signal, process.exit);
});
