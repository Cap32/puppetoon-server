
import Client from '../src/Client';
import { signals } from 'signal-exit';
import delay from 'delay';

(async function main() {
	try {
		const client = await Client.create({
			url: 'ws://127.0.0.1:8808',
			store: 'test',
		});

		process.on('exit', () => {
			client.close();
		});

		signals().forEach((signal) => {
			process.on(signal, process.exit);
		});

		const debug = process.argv[2] || 'hello';
		const pageInfo = await client.send('newPage', {
			debug,
		});
		console.log('newPage', pageInfo);

		await delay(2000);

		const { version } = await client.send('version');
		console.log('version', version);

		const queue = await client.send('getQueue');
		console.log('queue', queue);

		await delay(2000);

		await client.send('closePage', pageInfo);
		console.log('page closed');

		for (let i = 0; i < 10; i++) {
			await client.send('newPage', { debug: `debug_${i}` });
			console.log('newPage', i);
		}

		const queue2 = await client.send('getQueue');
		console.log('queue', queue2);

		await delay(10000);

		await client.send('clear');
		console.log('all pages closed');

		process.exit(0);
	}
	catch (err) {
		console.error(err);
	}
}());
