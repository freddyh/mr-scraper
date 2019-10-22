const puppeteer = require('puppeteer');
const fs = require('fs');
const print = console.log;
const LyricsDB = require('./LyricsDB');
const maxFailures = 2;

const setupScreenshots = () => {
    const folderName = 'screenshots';
    try {
        fs.mkdirSync(folderName);
    } catch (err) {
        console.info(err);
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

    var failuresCount = 0;

    var n = 1;
    var error = null;
    while (error == null) {
        try {
            const itemSelector = `body > div.modal_window > div.modal_window-content.modal_window-content--narrow_width.modal_window-content--white_background > ng-transclude > artist-songs > scrollable-data > div:nth-child(1) > transclude-injecting-local-scope:nth-child(${n}) > div > mini-song-card > a`;
            const songUrl = await page.$eval(itemSelector, el => el.href);
            const songNameSelector = `.modal_window-content > ng-transclude:nth-child(1) > artist-songs:nth-child(1) > scrollable-data:nth-child(3) > div:nth-child(1) > transclude-injecting-local-scope:nth-child(${n}) > div:nth-child(1) > mini-song-card:nth-child(1) > a:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)`;
            const songName = await page.$eval(songNameSelector, el => el.innerHTML);
            LyricsDB.insertOne({
                name: songName,
                url: songUrl
            });
            n += 1;
        } catch {
            failuresCount += 1;
            if (failuresCount >= maxFailures) {
                const message = 'Max Failures Reached';
                error = Error(message);
                console.error(error);
            }

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

const main = async () => {
    await LyricsDB.clear();
    const artistUrl = 'https://genius.com/artists/2pac';
    readSongUrls(artistUrl)
        .then(() => {
            LyricsDB.listAll().then((result) => {
                debugger;
            }).catch((err) => {
                print(err);
            })
        }).catch((err) => {
            print('read song urls error', err);
        });
};

main();