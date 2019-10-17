const puppeteer = require('puppeteer');

// read lyrics given the url 
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

// show all songs for a given artist
(async () => {
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();
    await page.goto('https://genius.com/artists/2pac');
  
    const view_all_songs_selector = 'body > routable-page > ng-outlet > routable-profile-page > ng-outlet > routed-page > profile-page > div.column_layout > div.column_layout-column_span.column_layout-column_span--primary > artist-songs-and-albums > div.full_width_button.u-clickable.u-bottom_margin';
    await page.click(view_all_songs_selector);
    // await page.waitForNavigation();
    await page.screenshot({ path: `screenshots/${Date()}.png` }); 
  
    await browser.close();
  })();