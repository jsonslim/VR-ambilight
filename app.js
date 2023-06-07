const robot = require("robotjs");
const udp = require('dgram');
const fs = require('fs');

const server = udp.createSocket('udp4');

const capturePointSize = 1;
let colorArr = [];

let config = {
    ipAddress: "localhost",
    port: 1234,
    screenWidth: 1920,
    screenHeight: 1080,
    led1x: 0,
    led1y: screenHeight/3,
    led2x: 0,
    led2y: screenHeight - screenHeight/3,
    led3x: screenWidth-1,
    led3y: screenHeight/3,
    led4x: screenWidth-1,
    led4y: screenHeight - screenHeight/3,
};

function init(){
    // read config.json and set variables in config var
    const fileData = fs.readFileSync('./config.json', 'utf-8');
    config = JSON.parse(fileData)
}

function captureScreen(){
  colorArr.push(robot.screen.capture(0, 0, capturePointSize, capturePointSize))
  colorArr.push(robot.screen.capture(0, 0, capturePointSize, capturePointSize))
  colorArr.push(robot.screen.capture(0, 0, capturePointSize, capturePointSize))
  colorArr.push(robot.screen.capture(0, 0, capturePointSize, capturePointSize))
}

// emits when any error occurs
// server.on('error',function(error){
//     console.log('Error: ' + error);
//     server.close();
// });
  
// emits on new datagram msg
// server.on('message',function(msg,info){
//   console.log('Data received from client : ' + msg.toString());
//   console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);  
// });


// main loop   
setInterval(()=>{
  captureScreen();
  console.log(colorArr);

  // send color to leds module
  server.send(colorArr, config.port, config.ip); // callback can be added here

  // clear array
  colorArr.length = 0; 
},1000);
