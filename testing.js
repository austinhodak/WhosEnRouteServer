var noble = require('noble');
var uuid = 'e2c56db5dffb48d2b060d0f5a71096e0';
var major = 0; // 0x0000 - 0xffff
var minor = 0; // 0x0000 - 0xffff
var measuredPower = -59; // -128 - 127
var Bleacon = require('bleacon');
Bleacon.startAdvertising('e2c56db5dffb48d2b060d0f5a71096e1', 654, 2, -59);

// noble.on('stateChange', function(callback){
//   noble.startScanning();
// });
// noble.on('scanStart', function(){
//   console.log("Scan Started!");
// });
// noble.on('discover', function(callback){
//   console.log(callback);
//   callback.connect(function(error) {
//
//   });
//   callback.once('connect', function() {
//     console.log("Connected");
//   });
// });
