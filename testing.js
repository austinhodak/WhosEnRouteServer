var notifier = require('mail-notifier');
var nodemailer = require('nodemailer');
var firebase = require("firebase");
var dateFormat = require('dateformat');
var moment = require('moment-timezone');
var xmpp = require('node-xmpp-server');
var request = require("request");
var http = require('http');
var colors = require('colors');

var time = moment.tz('2016-08-19 13:10:00', 'America/New_York')

var diff = moment().diff(time, 'minutes');

//console.log(diff);

if(diff > 15) {
  console.log('Old Message')
} else {
  console.log(diff);
}
