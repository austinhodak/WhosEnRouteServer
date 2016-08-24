var notifier = require('mail-notifier');
var nodemailer = require('nodemailer');
var firebase = require("firebase");
var dateFormat = require('dateformat');
var moment = require('moment');
var xmpp = require('node-xmpp-server');
var request = require("request");
var http = require('http');
var colors = require('colors');
firebase.initializeApp({
  serviceAccount: "FireDepartmentManager-68130346d95f.json",
  databaseURL: "https://fire-department-manager.firebaseio.com"
});

console.log("=========================================".red);
console.log("===".red + " Who's En Route Server Starting..." + " ===".red);
console.log("=========================================".red);
console.log("=========".red + " Loading Departments..." + " ========".red);
console.log("=========================================\n".red);

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
    console.log("Initial departments loaded!".green + "\n====================================");
    setupMailListeners();
  });
}

function setupMailListeners() {
  console.log("Setting Up Mail Listeners...\n".yellow);
  for (i = 0; i < departments.length; i++) {
    var objectSnap = departments[i];
    startNotifier(objectSnap);
  }
}

function toggleListener(n, started) {
  if(started) {
    n.stop();
    n.start();
    console.log("Stopping...Starting");
  }
  started = !started;
}

function startNotifier(objectSnap) {
  var started = true;
  //console.log("========== Listener Start ==========");
  var textAddresses = [];
  var phoneNumbers = [];
  var membersList = [];
  
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
  
  n.on('mail',function(mail){
    //
    //var time = moment.tz(mail.date, 'ddd MMM DD YYYY HH:mm:ss Z', 'America/New_York').format();
    var time = moment(mail.date).format('YYYY/MM/DD HH:mm:ss');
    var currenttime = moment().format('YYYY/MM/DD HH:mm:ss');
    console.log( '\n' + time + '\n' + object.name + ' -- NEW EMAIL FROM: ' + mail.from[0].address + ' | SUBJECT: ' + mail.subject + " | TEXT: " + mail.text + " -- END MESSAGE\n");
    if (mail.from[0].address == object.messaging.dispatch) {
      //Email is from dispatch, do the STUFF :/
      //if(time.diff(currenttime, 'minutes') > 20) {
	//writeDispatch(mail.from[0].address, mail.subject, mail.text, time, objectSnap.key, false);
	//sendTexts(mail.from[0].address, mail.subject, mail.text, textAddresses);
      //} else {
	writeDispatch(mail.from[0].address, mail.subject, mail.text, time, objectSnap, true);
	sendTexts(mail.from[0].address, mail.subject, mail.text, textAddresses);
      //}
    }
  }).on('connected',function() {
    started = true;
    console.log("**** " + object.name + " (" + objectSnap.key + ")" + " | Mail Listener Connected. ****\n".green);
    //setTimeout(function() {
    //  toggleListener(n, started);
    //}, 5000);
  }).start();
  notifiers[objectSnap.key] = {notifier: n};
  
  ///////////////////////////////////////////////////////////////////////////
  var departmentRef = firebase.database().ref('departments/' + objectSnap.key).child('members');
  var department = objectSnap.val();
  departmentRef.on('child_added', function(data) {
    firebase.database().ref('users').child(data.key).once('value').then(function(member) {
      var memberVal = member.val();
      //TODO CHECK USER SETTINGS AND ADD ADDRESS'S TO LIST
      var email, phone;
      if (memberVal.dispatchNotifications) {
	if (memberVal.dispatchNotifications.mobile) {
	  var mobile = memberVal.phoneNum.toString() + '' + memberVal.phoneProvider;
	  var index = textAddresses.indexOf(mobile);
	  if (index > -1) {
	    textAddresses.splice(index, 1);
	  }
	  textAddresses.push(mobile);
	  phoneNumbers.push(mobile);
	  phone = mobile;
	} else {
	  var mobile = memberVal.phoneNum.toString() + '' + memberVal.phoneProvider;
	  phoneNumbers.push(mobile);
	}
	if (memberVal.dispatchNotifications.email) {
	  var index = textAddresses.indexOf(memberVal.email);
	  if (index > -1) {
	    textAddresses.splice(index, 1);
	  }
	  textAddresses.push(memberVal.email);
	  email = memberVal.email;
	} else {
	  
	}
	if (email && phone) {
	  console.log("== Added: " + email + " - " + phone + " | Agency: " + object.name + " === \n");
	} else if (email) {
	  console.log("== Added: " + email + " | Agency: " + object.name + " === \n");
	} else if (phone) {
	  console.log("== Added: " + phone + " | Agency: " + object.name + " === \n");
	}
      } else {
	console.log('(!) No settings found for user: '.red + memberVal.name + ' (!)\n');
      }
      //console.log('\n');
      for (var i = 0; i < membersList.length; i++) {
	if (membersList[i].key == member.key) {
	  membersList.splice(index, 1);
	}
      }
      membersList.push(member);
    });
  });
  ////////////////////////////////////////////
}

//
function writeDispatch(sender, subject, message, date, department, notify) {
  var dispatchData = {
    sender: sender,
    type: subject,
    message: message,
    date: date,
    department: department,
    activeIncident: true,
    server: 'RPI 1'
  };
  // Get a key for a new Post.
  var dispatchKey = firebase.database().ref().child('messages').push().key;
  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/messages/' + dispatchKey] = dispatchData;
  
  updates['/departments/' + department + '/messages/' + dispatchKey] = true;
  updates['/departments/' + department + '/activeIncident'] = true;
  
  firebase.database().ref().update(updates).then(function(snapshot) {
    // The Promise was "fulfilled" (it succeeded).
    
    if (department.key === "riKzg8eeHdh4a4hSz9JQGUh2lgp1" && notify == true) {
      console.log("====== Dispatch Saved to Datbase! Sending Notifications! ======");
      sendDispatchNotification(sender, subject, message, department);
    }
  }, function(error) {
    // The Promise was rejected.
    console.error(error);
  });
}

//notifications
function sendDispatchNotification(sender, subject, message, department) {
  sendiOSNotifications(sender, subject, message, department);
  var channel = "'incidents-" + department + "'";
  var requestData = {
    "condition": "'incidents' in topics || " + channel + " in topics",
    "data": {
      "notification-type": "incident",
      "incidentTitle": department.abbrv + ' | ' + subject,
      "incidentDesc": message,
      "departmentKey": department.key
    }
  }
  
  url = "https://fcm.googleapis.com/fcm/send"
  
  request({
    url: url,
    method: "POST",
    headers: {
      'content-type': 'application/json',
      'Authorization': 'key=AIzaSyD0Ds_GDlH0SO4UdoqnAg921lt1GsSZU8w'
    },
    json: requestData
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(body)
    }
    else {
      console.log("error: " + error)
      console.log("response.statusCode: " + response.statusCode)
      console.log("response.statusText: " + response.statusText)
    }
  })
}

function sendiOSNotifications(sender, subject, message, department) {
  var channel = "/topics/incidents-ios-" + department;
  var requestData = {
    "condition": "'incidents-ios' in topics || " + channel + " in topics",
    "notification": {
      "body": "New Incident: " + subject + " | " + message,
      "title": "Who's En Route?",
      "click_action": "RESPOND_CATEGORY"
    },
    "content_available": true
  }
  
  url = "https://fcm.googleapis.com/fcm/send"
  
  request({
    url: url,
    method: "POST",
    headers: {
      'content-type': 'application/json',
      'Authorization': 'key=AIzaSyD0Ds_GDlH0SO4UdoqnAg921lt1GsSZU8w'
    },
    json: requestData
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(body)
    }
    else {
      console.log("error: " + error)
      console.log("response.statusCode: " + response.statusCode)
      console.log("response.statusText: " + response.statusText)
    }
  })
}

function sendTexts(sender, subject, message, users) {
  var mailData = {
    from: 'messaging@whosenroute.com',
    to: users,
    subject: subject,
    text: message
  };
  transporter.sendMail(mailData, function (error, info) {
    if (error) {
      console.log('Error occurred');
      console.log(error.message);
      return;
    }
    console.log('Message sent successfully!');
    console.log('Server responded with "%s"', info.response);
  });
}

//alertAdmins("** SERVER DOWN **", "WHOER SERVER DOWN AT 23:57 7/23/16");

function alertAdmins(subject, message) {
  var mailData = {
    from: 'messaging@whosenroute.com',
    to: "8146887657@txt.att.net",
    subject: subject,
    text: message
  };
  transporter.sendMail(mailData, function (error, info) {
    if (error) {
      console.log('Error occurred');
      console.log(error.message);
      return;
    }
    console.log('Message sent successfully!');
    console.log('Server responded with "%s"', info.response);
  });
}
