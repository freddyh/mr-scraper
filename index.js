const puppeteer = require('puppeteer');

// read lyrics given the url 
(async () => {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  const songUrl = 'https://genius.com/2pac-keep-ya-head-up-lyrics';
  await page.goto(songUrl);

  const lyrics_selector = 'body > routable-page > ng-outlet > song-page > div > div > div.song_body.column_layout > div.column_layout-column_span.column_layout-column_span--primary > div > defer-compile:nth-child(2) > lyrics > div > div > section';
  const lyrics = await page.$eval(lyrics_selector, el => el.innerText);
  console.log(lyrics);

  await browser.close();
})();

// show songs for a given artist and read the hrefs
(async () => {
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();
    let artistUrl = 'https://genius.com/artists/2pac';
    await page.goto(artistUrl);
  
    const view_all_songs_selector = 'body > routable-page > ng-outlet > routable-profile-page > ng-outlet > routed-page > profile-page > div.column_layout > div.column_layout-column_span.column_layout-column_span--primary > artist-songs-and-albums > div.full_width_button.u-clickable.u-bottom_margin';
    await page.click(view_all_songs_selector);
    await page.screenshot({ path: `screenshots/${Date()}.png` });
    await page.waitFor(2*1000);
    const first_item_selector = 'body > div.modal_window > div.modal_window-content.modal_window-content--narrow_width.modal_window-content--white_background > ng-transclude > artist-songs > scrollable-data > div:nth-child(1) > transclude-injecting-local-scope:nth-child(1) > div > mini-song-card > a';
    const second_item_selector = 'body > div.modal_window > div.modal_window-content.modal_window-content--narrow_width.modal_window-content--white_background > ng-transclude > artist-songs > scrollable-data > div:nth-child(1) > transclude-injecting-local-scope:nth-child(2) > div > mini-song-card > a';
    const url1 = await page.$eval(first_item_selector, el => el.href);
    const url2 = await page.$eval(second_item_selector, el => el.href);
    console.log(url1);
    console.log(url2);

    await browser.close();
  })();