const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://genius.com/2pac-keep-ya-head-up-lyrics');
  await page.screenshot({path: 'example.png'});

  await browser.close();
})();