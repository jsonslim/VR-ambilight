const udp = require('dgram');

const client = udp.createSocket('udp4');

// emits on new datagram msg
client.on('message',function(msg,info){
  const receivedBuffers = Array.from(msg);
  console.log('Data received from client : ' + receivedBuffers);
  console.log('Received %d bytes from %s:%d\n',msg.length, info.address, info.port);  
});

//emits when socket is ready and listening for datagram msgs
client.on('listening',function(){
  var address = client.address();
  var port = address.port;
  var ipaddr = address.address;
  console.log('listening at port :' + port);
  console.log('ip :' + ipaddr);
});

client.bind(5555); // ambilight port, which should be set in config.json