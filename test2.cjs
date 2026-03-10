const https = require('https');
https.get('https://docs.google.com/spreadsheets/d/e/2PACX-1vQJNJu3ItvN4gbicHMmBPMEuX0iKSoi30tYKpkEMgpFlbwNXEZcgNag9JA_-mreOgiiGh4_h8Bd4QJD/pub?gid=1350001392&single=true&output=csv', (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400) {
    https.get(res.headers.location, (res2) => {
      res2.on('data', (d) => process.stdout.write(d));
    });
  } else {
    res.on('data', (d) => process.stdout.write(d));
  }
});
