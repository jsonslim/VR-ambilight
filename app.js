const robot = require("robotjs");
const udp = require('dgram');
const fs = require('fs');

const server = udp.createSocket('udp4');

const capturePointSize = 1;
let l1,l2,l3,l4 = Buffer.alloc(3);
// const buf = Buffer.allocUnsafe(3);
let captureMode = "dispArea"; // + standby + dispArea

// default config used if no config.json exists
let config = {
    boardIp: "192.168.0.30",     // ESP32 IP
    boardPort: 5555,        // ESP32 port
    srvPort: 5554,          // this server port
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

    //emits when socket is ready and listening for UDP messages
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

function hexToRgb(hex) {
  // Remove the '#' character if it's present
  hex = hex.replace(/^#/, '');

  // Parse the hex color code into its red, green, and blue components
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  // Return the RGB values as an array
  return [r, g, b];
}

// better cover LEDs with something instead using this func
function brightnessCorrection(color, divisor){
  if(divisor === 1){
    return color;
  }
  return Math.floor(color / divisor);
}

// todo get buffer lenght and calculate values from it for the loop
function getMedianColor(imgBuf, color){
  let sum = 0;  
  const step = 4;
  for(let i = 0; i < step*height; i += step){
    sum += imgBuf[i];
  }
  sum = Math.floor(sum/height);
  sum = brightnessCorrection(sum, config.brightnessDiv);
  return sum;
}

// returns median color from selected area
function captureScreenArea(x,y,width,height){
  let imgBuffer = robot.screen.capture(x,y,width,height).image;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  const step = 4;

  // get median blue -> getMedianColor(imgBuf)
  for(let i = 0; i < step*height; i += step){
    sumB += imgBuffer[i];
  }
  sumB = Math.floor(sumB/height);
  sumB = brightnessCorrection(sumB, config.brightnessDiv);

  // get median green -> getMedianColor(imgBuf)
  for(let i = 1; i < step*height-1; i += step){
    sumG += imgBuffer[i];
  }
  sumG = Math.floor(sumG/height);
  sumG = brightnessCorrection(sumG,config.brightnessDiv);

  // get median red -> getMedianColor(imgBuf)
  for(let i = 2; i < step*height-2; i += step){
    sumR += imgBuffer[i]; 
  }
  sumR = Math.floor(sumR/height);
  sumR = brightnessCorrection(sumR,config.brightnessDiv);

  // prepare result
  const buf = Buffer.allocUnsafe(3);
  buf.writeUInt8(sumB, 0);
  buf.writeUInt8(sumG, 1);
  buf.writeUInt8(sumR, 2);
  return buf;
}

// new implementation, now broken
function captureScreenAreaNew(x,y,width,height){
  let color = [];
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      color.push(robot.screen.capture(x,y,width,height).colorAt(i,j));
    }
  }
  
  console.log(color);
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  const buf = Buffer.allocUnsafe(3);
  buf.writeUInt8(sumB, 0);
  buf.writeUInt8(sumG, 1);
  buf.writeUInt8(sumR, 2);
}

// main screen capture mode, it makes median color from display sides
function captureScreen(width, height){
  l1 = captureScreenArea(0, 540, width, height);      // led1 - bottom left
  l2 = captureScreenArea(0, 0, width, height);        // led2 - top left
  l3 = captureScreenArea(1919, 0, width, height);     // led3 - top right
  l4 = captureScreenArea(1919, 540, width, height);   // led4 - bottom right
  console.log(`l1:`,l1, `l2:`,l2, `l3:`,l3 , `l4:`,l4);
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
  if(captureMode === "dispArea"){ 
    captureScreen(10, 540); // width, height
    server.send([l1,l2,l3,l4], config.boardPort, config.boardIp);
  }
  else if(captureMode === "standby"){ 
    /* we wait*/
  }
}, 1000/config.refreshRate);
