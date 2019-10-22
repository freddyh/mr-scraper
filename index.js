const puppeteer = require('puppeteer');
const fs = require('fs');

const setupScreenshots = () => {
    const folderName = 'screenshots';
    try {
        fs.mkdirSync(folderName);
    } catch (err) {
        console.error(err);
    }
};
setupScreenshots();

// read lyrics given the url 
const readLyrics = async (songUrl) => {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    await page.goto(songUrl);

    const lyrics_selector = 'body > routable-page > ng-outlet > song-page > div > div > div.song_body.column_layout > div.column_layout-column_span.column_layout-column_span--primary > div > defer-compile:nth-child(2) > lyrics > div > div > section';
    const lyrics = await page.$eval(lyrics_selector, el => el.innerText);
    console.log(lyrics);

    await browser.close();
};

// show songs for a given artist and read the hrefs
const readSongUrls = async (artistUrl) => {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    await page.goto(artistUrl);

    const view_all_songs_selector = 'body > routable-page > ng-outlet > routable-profile-page > ng-outlet > routed-page > profile-page > div.column_layout > div.column_layout-column_span.column_layout-column_span--primary > artist-songs-and-albums > div.full_width_button.u-clickable.u-bottom_margin';
    await page.click(view_all_songs_selector);
    await page.screenshot({ path: `screenshots/${Date()}.png` });
    await page.waitFor(2 * 1000);

    const maxFailures = 10;
    var failuresCount = 0;

    var n = 1;
    var error = null;
    while (error == null) {
        try {
            const nth_item_selector = `body > div.modal_window > div.modal_window-content.modal_window-content--narrow_width.modal_window-content--white_background > ng-transclude > artist-songs > scrollable-data > div:nth-child(1) > transclude-injecting-local-scope:nth-child(${n}) > div > mini-song-card > a`;
            const songUrl = await page.$eval(nth_item_selector, el => el.href);
            console.log(songUrl);
            n += 1;
        } catch {
            if (failuresCount >= maxFailures) {
                const message = 'fhj: selector not found';
                console.log(message);
                error = Error(message);
            }
            failuresCount += 1;

            const scrollable_section = 'body > div.modal_window';
            await page.evaluate(selector => {
                const scrollableSection = document.querySelector(selector);
                const offset = 1000000;
                scrollableSection.scrollTop = offset;
            }, scrollable_section);

            await page.waitFor(6 * 1000);
            await page.screenshot({ path: `screenshots/${Date()}.png` });
        }
    }

    await browser.close();
};

readSongUrls('https://genius.com/artists/2pac');