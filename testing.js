// var request = require("request");
// sendDispatchNotification(null, null, null, null);
// function sendDispatchNotification(sender, subject, message, department) {
//   var requestData = {
//     "data": {
//         "notification-type": "incident",
//         "incidentTitle": "MVA-TEST-MVA",
//         "incidentDesc": "THIS IS A TEST MESSAGE, TEST."
//       },
//     //"to": "/topics/incidents"
//     "to" : "c2Fbntt-sf0:APA91bFnTvSMHCr2KzxAbmfIJcSSpiTc5tUYDbcBB5U57pOQWvyXJBJs-iBMq-ssxtA_btMoXbkyCfK-KYUZbMxRJ8K0p1w9X4EWzqaDH0GyFBFFxiRTkOYWQOMkMXcsD417jcixksOz"
//   }
//
//   // QPX REST API URL (I censored my api key)
//   url = "https://fcm.googleapis.com/fcm/send"
//
//   // fire request
//   request({
//     url: url,
//     method: "POST",
//     headers: {
//       'content-type': 'application/json',
//       'Authorization': 'key=AIzaSyD0Ds_GDlH0SO4UdoqnAg921lt1GsSZU8w'
//     },
//     json: requestData
//   }, function (error, response, body) {
//     if (!error && response.statusCode === 200) {
//       console.log(body)
//     }
//     else {
//
//       console.log("error: " + error)
//       console.log("response.statusCode: " + response.statusCode)
//       console.log("response.statusText: " + response.statusText)
//     }
//   })
// }
var moment = require('moment');

var now = new Date();
moment().format('YYYY/MM/DD HH:mm:ss');
console.log(now);
