var notifier = require('mail-notifier');
var nodemailer = require('nodemailer');
var firebase = require("firebase");
var dateFormat = require('dateformat');
var moment = require('moment-timezone');
var xmpp = require('node-xmpp-server');
var request = require("request");
var http = require('http');
firebase.initializeApp({
  serviceAccount: "FireDepartmentManager-68130346d95f.json",
  databaseURL: "https://fire-department-manager.firebaseio.com"
});

console.log("=========================================");
console.log("=== Who's En Route Server Starting... ===");
console.log("=========================================");
console.log("========= Loading Departments... ========");
console.log("=========================================\n");

var departments = [];
var notifiers = {};

var smtpConfig = {
  service: 'postmark',
  auth: {
    user: '48731b4c-e23e-450a-b9a5-2d0a893b4b90',
    pass: '48731b4c-e23e-450a-b9a5-2d0a893b4b90'
  }
};

var transporter = nodemailer.createTransport(smtpConfig, {
  from: 'ahodak65@gmail.com',
});

loadDepartments();

function loadDepartments() {
  var db = firebase.database();
  var ref = db.ref("departments");
  var count = 0;

  ref.on("child_added", function(snapshot, prevChildKey) {
    var department = snapshot.val();
    console.log("=========================================");
    console.log("== Name: " + department.name + " ==");
    console.log("== Dispatch Email: " + department.messaging.dispatch + " ==");
    console.log("== ID: " + snapshot.key + " ==");
    console.log("=========================================\n");
    departments.push(snapshot);
  });

  ref.once("value", function(snap) {
    console.log("Initial data loaded!" + "\n====================================");
    setupMailListeners();
  });
}

function setupMailListeners() {
  console.log("Setting Up Mail Listeners...\n");
  for (i = 0; i < departments.length; i++) {
    var objectSnap = departments[i];
    startNotifier(objectSnap);
  }
}

function startNotifier(objectSnap) {
  var object = objectSnap.val();
  var imap = {
    user: object.messaging.email,
    password: object.messaging.pass,
    host: object.messaging.server,
    port: 993, // imap port
    tls: true,// use secure connection
    tlsOptions: { rejectUnauthorized: false }
  };
  var n = notifier(imap);
  n.on('end', function () { // session closed
    n.start();
  }).on('mail',function(mail){
    var time = moment().tz('America/New_York').format('YYYY/MM/DD HH:mm:ss');
    console.log(time + '\n' + object.name + ' -- NEW EMAIL FROM: ' + mail.from[0].address + ' | SUBJECT: ' + mail.subject + " | TEXT: " + mail.text + "-- END MESSAGE\n");

    if (mail.from[0].address == object.messaging.dispatch) {
      //Email is from dispatch, do the STUFF :/
    }
  }).on('connected',function() {
    console.log(object.name + " (" + objectSnap.key + ")" + "| Mail Listener Connected.\n");
  }).start();
  notifiers[objectSnap.key] = {notifier: n};

  var time = moment().tz('America/New_York').format('YYYY/MM/DD HH:mm:ss');
  //console.log(time + '\n' + object.name + ' -- NEW EMAIL FROM: ' + "WCC911" + ' | SUBJECT: ' + "EMS" + " | TEXT: " + "TESTTTSETTESTSETSTET" + "-- END MESSAGE\n");
}
