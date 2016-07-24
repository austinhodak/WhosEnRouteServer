var firebase = require("firebase");
var dateFormat = require('dateformat');
var moment = require('moment-timezone');
var xmpp = require('node-xmpp-server');
var request = require("request");
var http = require('http');
var colors = require('colors');

console.log("=========================================".red);
console.log("===".red + " Who's En Route " + "Bluetooth Proximity".blue + " Starting..." + " ===".red);
console.log("=========================================".red);
console.log("=========".red + " Loading Departments..." + " ========".red);
console.log("=========================================\n".red);
