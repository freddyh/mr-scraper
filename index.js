const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('https://genius.com/2pac-keep-ya-head-up-lyrics');

  const lyrics_selector = 'body > routable-page > ng-outlet > song-page > div > div > div.song_body.column_layout > div.column_layout-column_span.column_layout-column_span--primary > div > defer-compile:nth-child(2) > lyrics > div > div > section';
  const lyrics = await page.$eval(lyrics_selector, el => el.innerText);
  console.log(lyrics);

  await browser.close();
})();