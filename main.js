var notifier = require('mail-notifier');
var nodemailer = require('nodemailer');
var firebase = require("firebase");
var dateFormat = require('dateformat');
var moment = require('moment-timezone');
var xmpp = require('node-xmpp-server');
firebase.initializeApp({
  serviceAccount: "FireDepartmentManager-68130346d95f.json",
  databaseURL: "https://fire-department-manager.firebaseio.com"
});

console.log(moment().tz('America/New_York').format('YYYY/MM/DD HH:mm:ss'));
// create http request client to consume the QPX API
var request = require("request");

var http = require('http');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(8080);

console.log('Server running on port ' + process.env.PORT);

// JSON to be passed to the QPX Express API


// var smtpConfig = {
//   host: 'a2plcpnl0092.prod.iad2.secureserver.net',
//   port: 465,
//   secure: true, // use SSL
//   auth: {
//     user: 'admin@whosenroute.com',
//     pass: 'vuSaz#CRuX4h'
//   }
// };

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

function writeDispatch(sender, subject, message, date, department) {
  // A post entry.
  var postData = {
    sender: sender,
    type: subject,
    message: message,
    date: date,
    department: department,
    activeIncident: true
  };
  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('messages').push().key;
  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/messages/' + newPostKey] = postData;

  updates['/departments/' + department + '/messages/' + newPostKey] = true;
  updates['/departments/' + department + '/activeIncident'] = true;
  sendDispatchNotification(sender, subject, message, department)
  //
  return firebase.database().ref().update(updates);
}

function sendDispatchNotification(sender, subject, message, department) {
  sendiOSNotifications(sender, subject, message, department);
  var requestData = {
    "data": {
        "notification-type": "incident",
        "incidentTitle": subject,
        "incidentDesc": message
      },
    "to": "/topics/incidents"
    //"to" : "ehsGir5Kn6Y:APA91bGIs94I97j9qzyeXDbxhz_EXycliTG_tYTCoBqTS5WtlpiB9JwtfcPqoBs_kvNnrlCEr2Q978lG5li3nd164LlZGqH0aTne9Y4UQrbk0u4RTTbWg5B067iluWki911sYTHCBr0T"
  }

  // QPX REST API URL (I censored my api key)
  url = "https://fcm.googleapis.com/fcm/send"

  // fire request
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
  var requestData = {
    "to": "/topics/incidents-ios",
    "notification": {
      "body": "New Incident: " + subject + " | " + message,
      "title": "Who's En Route?",
      "click_action": "RESPOND_CATEGORY"
    },
    "content_available": true

    //"to" : "ehsGir5Kn6Y:APA91bGIs94I97j9qzyeXDbxhz_EXycliTG_tYTCoBqTS5WtlpiB9JwtfcPqoBs_kvNnrlCEr2Q978lG5li3nd164LlZGqH0aTne9Y4UQrbk0u4RTTbWg5B067iluWki911sYTHCBr0T"
    //"to" : "d_Onh85JxaI:APA91bFuBOP7jogo2A9_ckLH-DJdohzKy6C6Sopk02DodzlmBK6DKYe2lBeAOfQ8YuDCDT3Xsqu3D76PS56GRGQDsqca9mTMHPCB7_KAwRrIITjr4hFRDFYQq7QBvvmAX4a0VbD083uL"
  }

  // QPX REST API URL (I censored my api key)
  url = "https://fcm.googleapis.com/fcm/send"

  // fire request
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

//TODO (FOR EACH DEPARTMENT, GET EMAIL USERNAME, PASS, & SERVER. CREATE EMAIL LISTENER, )
function loadDepartments() {
  // Get a database reference to our posts
  var db = firebase.database();
  var ref = db.ref("departments");
  // Attach an asynchronous callback to read the data at our posts reference
  ref.once("value", function(snapshot) {

    snapshot.forEach(function(childsnapshot) {

      var deparmentRef = firebase.database().ref('departments/' + childsnapshot.key).child('members');
      var textAddresses = [];
      var phoneNumbers = [];
      var membersList = [];
      var department = childsnapshot.val();
      deparmentRef.on('child_added', function(data) {
        firebase.database().ref('users').child(data.key).on('value', function(member) {
          var memberVal = member.val();
          //console.log(memberVal);
          //TODO CHECK USER SETTINGS AND ADD ADDRESS'S TO LIST
          if (memberVal.dispatchNotifications) {
            if (memberVal.dispatchNotifications.mobile) {
              var mobile = memberVal.phoneNum.toString() + '' + memberVal.phoneProvider;
              var index = textAddresses.indexOf(mobile);
              if (index > -1) {
                textAddresses.splice(index, 1);
              }
              textAddresses.push(mobile);
              phoneNumbers.push(mobile);
              console.log(mobile + ' :Added to List!');
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
              console.log(memberVal.email + ' :Added to List!');
            } else {

            }
          } else {
            console.log('No settings found for user: ' + memberVal.name);
          }
          console.log('\n');

          for (var i = 0; i < membersList.length; i++) {
            if (membersList[i].key == member.key) {
              membersList.splice(index, 1);
            }
          }
          membersList.push(member);
        });
      });
      //console.log(childsnapshot.val());

      //TODO CREATE LISTENER FOR EACH DEPARTMENT + GET ALL MEMBERS WITH TXTS ENABLED.
      var imap = {
        user: department.messaging.email,
        password: department.messaging.pass,
        host: department.messaging.server,
        port: 993, // imap port
        tls: true,// use secure connection
        tlsOptions: { rejectUnauthorized: false }
      };
      if (department.messaging.email == "nil") {
          return;
      }
      notifier(imap).on('mail', function(mail) {
        console.log('\n' + 'NEW EMAIL FROM: ' + mail.from[0].address + ' | SUBJECT: ' + mail.subject + " | TEXT: " + mail.text + ' | DISPATCHRECEIVERS: ' + textAddresses);
        if (mail.from[0].address == department.messaging.dispatch) {
          writeDispatch(mail.from[0].address, mail.subject, mail.text, moment().tz('America/New_York').format('YYYY/MM/DD HH:mm:ss'), childsnapshot.key);
          sendTexts(mail.from[0].address, mail.subject, mail.text, textAddresses);
        } else {
          for (var i = 0; i < phoneNumbers.length; i++) {
            var addressNum = parseInt(phoneNumbers[i], 10);
            if (parseInt(mail.from[0].address, 10) == addressNum) {
              //EMAIL IS FROM USER ON NOTIFICATION LIST.
              for (var i = 0; i < membersList.length; i++) {
                var senderNumOnly = parseInt(mail.from[0].address, 10);
                if (membersList[i].val().phoneNum == senderNumOnly) {
                  //FOUND MEMBER USING NUMBER. FIGURE OUT TEXT AND DO STUFF.
                  console.log('Member Found for Number! | ' + membersList[i].val().name);

                  if (mail.text.toUpperCase().indexOf('STATION') > -1) {
                    console.log('TEXT-EMAIL FROM: ' + senderNumOnly + ' | RESPONDING TO: STATION');
                    //RESPONDING TO STATION
                    var membersRef = firebase.database().ref('users').child(membersList[i].key);
                    membersRef.update({
                      "respondingTo": "STATION",
                      "respondingTime": moment().format('YYYY/MM/DD HH:mm:ss'),
                      "isResponding": true
                    });
                  }
                  if (mail.text.toUpperCase().indexOf('SCENE') > -1) {
                    console.log('TEXT-EMAIL FROM: ' + senderNumOnly + ' | RESPONDING TO: SCENE');
                    //RESPONDING TO SCENE
                    var membersRef = firebase.database().ref('users').child(membersList[i].key);
                    membersRef.update({
                      "respondingTo": "SCENE",
                      "respondingTime": moment().format('YYYY/MM/DD HH:mm:ss'),
                      "isResponding": true
                    });
                  }
                  if (mail.text.toUpperCase().indexOf('NR') > -1) {
                    console.log('TEXT-EMAIL FROM: ' + senderNumOnly + ' | CANT RESPOND');
                    //CAN'T RESPOND
                    var membersRef = firebase.database().ref('users').child(membersList[i].key);
                    membersRef.update({
                      "respondingTo": "NR",
                      "respondingTime": moment().format('YYYY/MM/DD HH:mm:ss'),
                      "isResponding": true
                    });
                  }
                  if (mail.text.toUpperCase().indexOf("CAN'T RESPOND") > -1) {
                    console.log('TEXT-EMAIL FROM: ' + senderNumOnly + ' | CANT RESPOND');
                    //CAN'T RESPOND
                    var membersRef = firebase.database().ref('users').child(membersList[i].key);
                    membersRef.update({
                      "respondingTo": "NR",
                      "respondingTime": moment().format('YYYY/MM/DD HH:mm:ss'),
                      "isResponding": true
                    });
                  }
                }
              }
            }
          }
        }
      }).on('connected', function() {
        console.log(department.messaging.email + ' :Mail Server Connected! Listening for new emails!');
        console.log(textAddresses);
      }).start();
    });
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  });
}

function newDepartment() {
  // A post entry.
  var postData = {
    name: "Youngsville Fire Department"
  };
  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('departments').push().key;
  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/departments/' + newPostKey] = postData;

  //updates['/departments/' + department + '/messages/' + newPostKey] = true;
  //updates['/departments/' + department + '/activeIncident'] = true;
  //sendDispatchNotification(sender, subject, message, department)
  //
  return firebase.database().ref().update(updates);
}
