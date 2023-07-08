const robot = require("robotjs");
const udp = require('dgram');
const fs = require('fs');

const server = udp.createSocket('udp4');

const capturePointSize = 1;
let l1,l2,l3,l4 = Buffer.alloc(3);
// const buf = Buffer.allocUnsafe(3);
let captureMode = "dispArea"; // + standby + dispArea

let config = {
    ip: "192.168.0.30",     // ESP32's IP
    srvPort: 5554,          // this server port
    boardPort: 5555,
    screenWidth: 1920,
    screenHeight: 1080,
    refreshRate: 16,
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
  try {
    // read config.json and set variables in config var
    const fileData = fs.readFileSync('./config.json', 'utf-8');
    config = JSON.parse(fileData);
    // console.log(`-=Init successful=- \nip: ${config.ip} \nport: ${config.port}`);

    //emits when socket is ready and listening for datagram msgs
    server.on('listening',function(){
      const address = server.address();
      const port = address.port;
      const ipaddr = address.address;
      console.log('Server is listening at port: ' + port);
      console.log('Server ip:' + ipaddr);
    });

    //emits after the socket is closed using socket.close();
    server.on('close',function(){
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

// the easiest implementation, only for testing, not recommended for use
function captureScreenSinglePixel(){
  // get RGB componet by pixel coordinate to each led 
  l1 = robot.screen.capture(config.led1x, config.led1y, capturePointSize, capturePointSize).image.slice(0,3)
  l2 = robot.screen.capture(config.led2x, config.led2y, capturePointSize, capturePointSize).image.slice(0,3)
  l3 = robot.screen.capture(config.led3x, config.led3y, capturePointSize, capturePointSize).image.slice(0,3)
  l4 = robot.screen.capture(config.led4x, config.led4y, capturePointSize, capturePointSize).image.slice(0,3)
}

function captureScreenArea(x,y,width,height){
  let l1Temp = robot.screen.capture(x,y,width,height).image;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for(let i = 0; i < 4*540; i += 4){
    sumB += l1Temp[i];
  }
  sumB = Math.floor(sumB/540);


  for(let i = 1; i < 4*540-1; i += 4){
    sumG += l1Temp[i];
  }
  sumG = Math.floor(sumG/540);


  for(let i = 2; i < 4*540-2; i += 4){
    sumR += l1Temp[i]; 
  }
  sumR = Math.floor(sumR/540);

  const buf = Buffer.allocUnsafe(3);
  buf.writeUInt8(sumB, 0);
  buf.writeUInt8(sumG, 1);
  buf.writeUInt8(sumR, 2);
  return buf;
}

// main screen capture mode, it makes median color from display sides
function captureDisplayAreas(){
  l1 = captureScreenArea(0, 540, 1, 540);      // led1 - bottom left
  l2 = captureScreenArea(0, 0, 1, 540);        // led2 - top left
  l3 = captureScreenArea(1919, 0, 1, 540);     // led3 - top right
  l4 = captureScreenArea(1919, 540, 1, 540);   // led4 - bottom right
}

// emits when any error occurs
server.on('error',function(error){
  console.log('Error: ' + error);
  server.close();
});
  
// emits on new datagram msg
server.on('message',function(msg,info){
  console.log('Data received : ' + msg.toString());
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);
  captureMode = msg.toString();
});


// ==== run ==== //
init();

// main loop   
setInterval(()=>{
  if(captureMode === "singlePixel"){ 
    captureScreenSinglePixel();
    server.send([l1,l2,l3,l4], config.boardPort, config.ip);
  }
  else if(captureMode === "dispArea"){ 
    captureDisplayAreas(); 
    server.send([l1,l2,l3,l4], config.boardPort, config.ip);
  }
  // else if(captureMode === "standby"){ /* we wait*/ }
}, config.refreshRate);
