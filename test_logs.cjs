const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.error('ERR:', err.toString(), err.stack));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await browser.close();
  process.exit(0);
})();
