const fs = require('fs');
const readline = require('readline');
const {
  google
} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = 'token.json';

let calendar = (query) => {
  return new Promise(function(resolve, reject) {
    fs.readFile('config/config.json', (err, content) => {
      if (err) return reject(err);
      authorize(JSON.parse(content), listEvents);
    });

    function authorize(credentials, callback) {
      const {
        client_secret,
        client_id,
        redirect_uris
      } = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }

    function getAccessToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return reject(err);
          oAuth2Client.setCredentials(token);
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return reject(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });
    }

    function listEvents(auth) {
      const calendar = google.calendar({
        version: 'v3',
        auth
      });
      calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date(query.date)).toISOString(),
        maxResults: query.maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      }, (err, res) => {
        if (err) return reject(err);
        const events = res.data.items;
        if (events.length) {
          // console.log(events);
          resolve(events);
          // return events;
        } else {
          reject('No upcoming events found');
        }
      });
    }
  });
}



// fs.readFile('config/config.json', (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err);
//   authorize(JSON.parse(content), listEvents);
// });
//
// function authorize(credentials, callback) {
//   const {
//     client_secret,
//     client_id,
//     redirect_uris
//   } = credentials.installed;
//   const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
//
//   fs.readFile(TOKEN_PATH, (err, token) => {
//     if (err) return getAccessToken(oAuth2Client, callback);
//     oAuth2Client.setCredentials(JSON.parse(token));
//     callback(oAuth2Client);
//   });
// }
//
// function getAccessToken(oAuth2Client, callback) {
//   const authUrl = oAuth2Client.generateAuthUrl({
//     access_type: 'offline',
//     scope: SCOPES,
//   });
//   console.log('Authorize this app by visiting this url:', authUrl);
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   rl.question('Enter the code from that page here: ', (code) => {
//     rl.close();
//     oAuth2Client.getToken(code, (err, token) => {
//       if (err) return console.error('Error retrieving access token', err);
//       oAuth2Client.setCredentials(token);
//       fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
//         if (err) return console.error(err);
//         console.log('Token stored to', TOKEN_PATH);
//       });
//       callback(oAuth2Client);
//     });
//   });
// }
//
// function listEvents(auth) {
//   const calendar = google.calendar({
//     version: 'v3',
//     auth
//   });
//   calendar.events.list({
//     calendarId: 'primary',
//     timeMin: (new Date('1 Mar 2020')).toISOString(),
//     maxResults: 30,
//     singleEvents: true,
//     orderBy: 'startTime',
//   }, (err, res) => {
//     if (err) return console.log('The API returned an error: ' + err);
//     const events = res.data.items;
//     if (events.length) {
//       // console.log(events);
//       return events;
//     } else {
//       console.log('No upcoming events found.');
//     }
//   });
// }

module.exports = {
  calendar
};
