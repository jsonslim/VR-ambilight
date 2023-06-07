const robot = require("robotjs");
const udp = require('dgram');
const fs = require('fs');

const server = udp.createSocket('udp4');

const capturePointSize = 1;
let l1,l2,l3,l4 = Buffer.from('');

let config = {
    ipAddress: "localhost",
    port: 2222,
    screenWidth: 1920,
    screenHeight: 1080,
    led1x: 0,
    led1y: this.screenHeight/3,
    led2x: 0,
    led2y: this.screenHeight - this.screenHeight/3,
    led3x: this.screenWidth-1,
    led3y: this.screenHeight/3,
    led4x: this.screenWidth-1,
    led4y: this.screenHeight - this.screenHeight/3,
};

function init(){
    // read config.json and set variables in config var
    const fileData = fs.readFileSync('./config.json', 'utf-8');
    config = JSON.parse(fileData)
}

function captureScreen(){
  l1 = robot.screen.capture(config.led1x, config.led1y, capturePointSize, capturePointSize).image
  l2 = robot.screen.capture(config.led2x, config.led2y, capturePointSize, capturePointSize).image
  l3 = robot.screen.capture(config.led3x, config.led3y, capturePointSize, capturePointSize).image
  l4 = robot.screen.capture(config.led4x, config.led4y, capturePointSize, capturePointSize).image
}

// emits when any error occurs
server.on('error',function(error){
  console.log('Error: ' + error);
  server.close();
});
  
// emits on new datagram msg
server.on('message',function(msg,info){
  console.log('Data received from client : ' + msg.toString());
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);  
});

// main loop   
setInterval(()=>{
  captureScreen();
  console.log([l1,l2,l3,l4]);
  // send color to leds module
  server.send([l1,l2,l3,l4], config.port, config.ip); // callback can be added here
 
},1000);
