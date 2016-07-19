var firebase = require("firebase");
var dateFormat = require('dateformat');
var moment = require('moment-timezone');
var xmpp = require('node-xmpp-server');
var fs = require('fs');
var app = require('http').createServer();
var request = require("request");
firebase.initializeApp({
  serviceAccount: "FireDepartmentManager-68130346d95f.json",
  databaseURL: "https://fire-department-manager.firebaseio.com"
});
var date = moment().tz('America/New_York').format('YYYY/MM/DD HH:mm:ss');
var toneId = process.argv[2];
var departmentName = process.argv[3];

if (departmentName) {
  console.log(departmentName + " TONES DETECTED AT - " + date);
}
//var toneId = "riKzg8eeHdh4a4hSz9JQGUh2lgp1";

// fs.writeFile('test.txt', toneId, function(err) {
//   if (err) {
//     return console.log(err);
//   }
//   console.log("SAVED!");
// });
if (!toneId) {
  return;
}
firebase.database().ref('/departments/' + toneId).once('value').then(function(snapshot) {
  if (snapshot.val() == null) {
    console.log("AGENCY NOT FOUND");
    process.exit();
    return;
  }
  if (snapshot.val().activeIncident == false) {
    var append = "\n" + date + " | " + snapshot.val().name + " Tones Detected.";
    //No incident received yet, wait a bit (30 Seconds) and if still no message, send notificaions.
    fs.appendFile('log.txt', append, function (err) {

    });
    //No incident received yet, wait a bit (30 Seconds) and if still no message, send notificaions.
    console.log("No dispatch message received yet (activeIncident), waiting 30 seconds then checking again.");
    setTimeout(function() {
      firebase.database().ref('/departments/' + toneId).once('value').then(function(snapshot2) {
        if (snapshot2.val().activeIncident == false) {
          console.log("Still no dispatch message, assuming delayed or not received, send notifications.");
          //Still no dispatch message after 30 seconds, start notifying, don't wait any longer. Server will check to see if already alerted to avoid duplicates.
          try {
            //Send notifications/texts.("PAGER ALERT. YOUR TONES WENT OFF 30 SECONDS AGO. IS THERE A CALL?")
            sendDispatchNotification(null, "PAGER ALERT", "YOUR TONES WENT OFF 30 SECONDS AGO. IS THERE A CALL?", toneId);
          } catch (e) {

          } finally {
            //process.exit();
          }
        } else {
          console.log("Showing active incident after 30 seconds, nothing to do here!");
        }
      });
    }, 30000);
  } else {
    //Incident already active. Do nothing.
  }
});

function sendDispatchNotification(sender, subject, message, department) {
  var requestData = {
    "data": {
        "notification-type": "tones",
        "incidentTitle": subject,
        "incidentDesc": message
      },
    "to": "/topics/tones-"+department
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
//
// function saveDispatch() {
//   // A post entry.
//   var postData = {
//     date: date,
//     department: toneId
//   };
//   // Get a key for a new Post.
//   var newPostKey = firebase.database().ref().child('dispatches').push().key;
//   // Write the new post's data simultaneously in the posts list and the user's post list.
//   var updates = {};
//   updates['/dispatches/' + newPostKey] = postData;
//
//   updates['/departments/' + toneId + '/dispatches/' + newPostKey] = true;
//   //updates['/departments/' + department + '/activeIncident'] = true;
//   //
//   firebase.database().ref().update(updates);
// }
