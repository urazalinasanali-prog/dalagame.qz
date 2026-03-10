const https = require('https');
const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJNJu3ItvN4gbicHMmBPMEuX0iKSoi30tYKpkEMgpFlbwNXEZcgNag9JA_-mreOgiiGh4_h8Bd4QJD/pub?gid=1350001392&single=true&output=csv';

function fetchUrl(url) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400) {
      fetchUrl(res.headers.location);
    } else {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => console.log(data));
    }
  });
}
fetchUrl(url);
