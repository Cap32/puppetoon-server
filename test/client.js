
import APIServer from './APIServer';
import { signals } from 'signal-exit';

const apiServer = new APIServer('ws://127.0.0.1:8808');

apiServer.listen(async (api) => {
	const debug = process.argv[2] || 'hello';
	const pageInfo = await api.newPage({
		debug,
	});
	console.log('newPage', pageInfo);

	setTimeout(async () => {
		const queueSize = await api.getQueueSize();
		console.log('queue size', queueSize);
	}, 2000);

	setTimeout(async () => {
		await api.closePage(pageInfo);
		console.log('page closed');
		process.exit(0);
	}, 4000);
});

process.on('exit', () => {
	apiServer.close();
});

signals().forEach((signal) => {
	process.on(signal, process.exit);
});
