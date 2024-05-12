const robot = require("robotjs");
const udp = require('dgram');
const fs = require('fs');

const server = udp.createSocket('udp4');

let l1, l2, l3, l4 = Buffer.alloc(3);
let captureMode = "dispArea"; // standby || dispArea

// default config used if no config.json exists
let config = {
  boardIp: "192.168.0.30",      // ESP32 IP
  boardPort: 5555,              // ESP32 port
  srvPort: 5554,                // this server port
  screenWidth: 1920,
  screenHeight: 1080,
  refreshRate: 16,
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
    // read config.json and set variables in config var
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

    //emits after the socket is closed using socket.close();
    server.on('close', function () {
      console.log('Socket is closed !');
    });

    server.bind({
      port: config.srvPort,
      // exclusive: false,
    });
  } catch (error) {
    console.log(error.message);
  }
}

// returns average color from selected area
function captureScreenArea(x, y, width, height) {
  let imgBuffer = robot.screen.capture(x, y, width, height).image;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const step = 4;

  // get average blue -> getMedianColor(imgBuf)
  for (let i = 0; i < step * height; i += step) {
    sumB += imgBuffer[i];
  }
  sumB = Math.floor(sumB / height);

  // get average green -> getMedianColor(imgBuf)
  for (let i = 1; i < step * height - 1; i += step) {
    sumG += imgBuffer[i];
  }
  sumG = Math.floor(sumG / height);

  // get average red -> getMedianColor(imgBuf)
  for (let i = 2; i < step * height - 2; i += step) {
    sumR += imgBuffer[i];
  }
  sumR = Math.floor(sumR / height);

  // prepare result
  const buf = Buffer.allocUnsafe(3);
  buf.writeUInt8(sumB, 0);
  buf.writeUInt8(sumG, 1);
  buf.writeUInt8(sumR, 2);
  return buf;
}

// main screen capture mode, it makes average color from display sides
function captureScreen(width, height) {
  l1 = captureScreenArea(0, 540, width, height);      // led1 - bottom left
  l2 = captureScreenArea(0, 0, width, height);        // led2 - top left
  l3 = captureScreenArea(1919, 0, width, height);     // led3 - top right
  l4 = captureScreenArea(1919, 540, width, height);   // led4 - bottom right
  console.log(`l1:`, l1, `l2:`, l2, `l3:`, l3, `l4:`, l4);
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


// ===================================== run ====================================== //
init();

// main loop   
setInterval(() => {
  if (captureMode === "active") {
    captureScreen(10, 540); // width, height
    server.send([l1, l2, l3, l4], config.boardPort, config.boardIp);
  }
  else if (captureMode === "standby") {
    /* we wait*/
  }
}, 1000 / config.refreshRate);
