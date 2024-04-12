const robot = require("robotjs");
const udp = require('dgram');
const fs = require('fs');

const server = udp.createSocket('udp4');

let l1, l2, l3, l4 = Buffer.alloc(3);

let captureMode = "dispArea"; // standby|dispArea

// default config used if no config.json exists
let config = {
	boardIp: "192.168.0.30",      // ESP32 IP
	boardPort: 5555,              // ESP32 port
	srvPort: 5554,                // this app port
	screenWidth: 1920,
	screenHeight: 1080,
	refreshRate: 24,
	led1x: 0,
	led1y: this.screenHeight / 3,
	led2x: 0,
	led2y: this.screenHeight - this.screenHeight / 3,
	led3x: this.screenWidth - 1,
	led3y: this.screenHeight / 3,
	led4x: this.screenWidth - 1,
	led4y: this.screenHeight - this.screenHeight / 3,
};

function init() {
	try {
		const fileData = fs.readFileSync('./config.json', 'utf-8');
		config = JSON.parse(fileData);
		// console.log(`-=Init successful=- \nip: ${config.ip} \nport: ${config.port}`);

		//emits when socket is ready and listening for UDP messages
		server.on('listening', function () {
			const address = server.address();
			const port = address.port;
			const ipaddr = address.address;
			console.log('Server is listening at port: ' + port);
			console.log('Server ip:' + ipaddr);
		});

		//emits after the socket is closed using socket.close(); ???
		server.on('close', function () {
			console.log('Socket is closed!');
		});

		server.bind({
			port: config.srvPort,
			// exclusive: false,
		});
	} catch (error) {
		console.log(error.message);
	}
}

// accepts only 6 bytes format, like '27ae60'
function hexToRgb(hex) {
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	return [r, g, b];
}

// returns average color from selected area
function captureScreenArea(x, y, width, height) {
	const img = robot.screen.capture(x, y, width, height);

	let sumR = 0;
	let sumG = 0;
	let sumB = 0;

	// Iterate over each pixel in the capture
	for (let x = 0; x < img.width; x++) {
		for (let y = 0; y < img.height; y++) {
			let hex = img.colorAt(x, y);
			console.log('hex data: ', hex);
			let rgb = hexToRgb(hex);
			sumR += rgb[0];
			sumG += rgb[1];
			sumB += rgb[2];
		}
	}

	// calc average color of the area
	const totalPixels = img.width * img.height;
	let avgR = sumR / totalPixels;
	let avgG = sumG / totalPixels;
	let avgB = sumB / totalPixels;

	// prepare result
	const buf = Buffer.allocUnsafe(3);
	buf.writeUInt8(avgB, 0);
	buf.writeUInt8(avgG, 1);
	buf.writeUInt8(avgR, 2);
	return buf;
}

// main screen capture mode, it makes average color from display sides
function captureScreen(width, height) {
	l1 = captureScreenArea(0, 540, width, height);      // led1 - bottom left
	l2 = captureScreenArea(0, 0, width, height);        // led2 - top left
	l3 = captureScreenArea(1919, 0, width, height);     // led3 - top right
	l4 = captureScreenArea(1919, 540, width, height);   // led4 - bottom right
	// console.log(`l1:`, l1, `l2:`, l2, `l3:`, l3, `l4:`, l4);
}

// emits when any error occurs
server.on('error', function (error) {
	console.log('Error: ' + error);
	server.close();
});

// emits on new datagram msg
server.on('message', function (msg, info) {
	console.log('Data received : ' + msg.toString());
	console.log('Received %d bytes from %s:%d\n', msg.length, info.address, info.port);
	captureMode = msg.toString();
});

// ==== run ==== //
init();

// main loop   
setInterval(() => {
	if (captureMode === "dispArea") {
		captureScreen(10, 540); // width, height
		server.send([l1, l2, l3, l4], config.boardPort, config.boardIp);
	}
	else if (captureMode === "standby") {
		/* we wait*/
	}
}, 1000 / config.refreshRate);

