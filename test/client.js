
import WebSocket from 'ws';

(async function main() {
	const ws = new WebSocket('ws://127.0.0.1:8808');

	ws.on('open', function open() {

		const send = (type, payload) => {
			ws.send(JSON.stringify({ type, payload }));
		};

		const debug = process.argv[2] || 'hello';
		send('newPage', { debug });

		ws.on('message', function incoming(message) {
			const { type, body } = JSON.parse(message);
			const { id } = body;
			console.log('received', type, body);

			if (type !== 'newPage') { return; }

			setTimeout(() => {
				send('getQueueSize');
			}, 2000);

			setTimeout(() => {
				send('closePage', { id, debug });
				ws.terminate();
			}, 4000);
		});

	});
}());
