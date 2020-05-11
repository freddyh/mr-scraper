const puppeteer = require('puppeteer');
const fs = require('fs');
const print = console.log;
const LyricsDB = require('./LyricsDB');
const maxFailures = 2;

const showAllAlbumsSelector = 'div.full_width_button:nth-child(2)';
const showAlbumSelector = '.modal_window-content > ng-transclude:nth-child(1) > scrollable-data:nth-child(1) > div:nth-child(1) > transclude-injecting-local-scope:nth-child(1) > div:nth-child(1) > mini-album-card:nth-child(1) > a:nth-child(1)';
const albumTitleSelector = '.modal_window-content > ng-transclude:nth-child(1) > scrollable-data:nth-child(1) > div:nth-child(1) > transclude-injecting-local-scope:nth-child(1) > div:nth-child(1) > mini-album-card:nth-child(1) > a:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)';
const albumYearSelector = '.modal_window-content > ng-transclude:nth-child(1) > scrollable-data:nth-child(1) > div:nth-child(1) > transclude-injecting-local-scope:nth-child(1) > div:nth-child(1) > mini-album-card:nth-child(1) > a:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)';
const lyricsSelector = 'body > routable-page > ng-outlet > song-page > div > div > div.song_body.column_layout > div.column_layout-column_span.column_layout-column_span--primary > div > defer-compile:nth-child(2) > lyrics > div > div > section';
const showAllSongsSelector = 'body > routable-page > ng-outlet > routable-profile-page > ng-outlet > routed-page > profile-page > div.column_layout > div.column_layout-column_span.column_layout-column_span--primary > artist-songs-and-albums > div.full_width_button.u-clickable.u-bottom_margin';
const scrollable_section = 'body > div.modal_window';

const buildItemSelector = (n) => {
    return `body > div.modal_window > div.modal_window-content.modal_window-content--narrow_width.modal_window-content--white_background > ng-transclude > artist-songs > scrollable-data > div:nth-child(1) > transclude-injecting-local-scope:nth-child(${n}) > div > mini-song-card > a`;
};

const buildSongNameSelector = (n) => {
    return `.modal_window-content > ng-transclude:nth-child(1) > artist-songs:nth-child(1) > scrollable-data:nth-child(3) > div:nth-child(1) > transclude-injecting-local-scope:nth-child(${n}) > div:nth-child(1) > mini-song-card:nth-child(1) > a:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(1)`;
};

const buildSongListSelector = () => {
    return 'body > routable-page > ng-outlet > routable-profile-page > ng-outlet > routed-page > profile-page > div.column_layout > div.column_layout-column_span.column_layout-column_span--primary > artist-songs-and-albums > div.full_width_button.u-clickable.u-bottom_margin';
};

const TupacArtistUrl = 'https://genius.com/artists/2pac';

const setupScreenshots = () => {
    const folderName = 'screenshots';
    try {
        fs.mkdirSync(folderName);
        console.info(`creating 'screenshots' directory for debugging purposes`);
    } catch (err) {
        if (err != null && !err.message.includes('EEXIST: file already exists')) {
            console.error(err);
        }
    }
};

const openPageTask = async (url) => {
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    await page.goto(url);
    const model = {
        page: page,
        onComplete: () => { browser.close() }
    }
    return model
};

// read lyrics given the url 
const readLyrics = async (songUrl) => {
    console.log(`Opening page at ${songUrl}`);
    const task = await openPageTask(songUrl);
    const page = task.page;
    const lyrics = await page.$eval(lyricsSelector, el => el.innerText);
    await task.onComplete();
    return lyrics;
};

// show songs for a given artist and read the hrefs
const readSongUrls = async (artistUrl) => {
    console.log(`Opening page at ${artistUrl}`);
    const task = await openPageTask(artistUrl);
    const page = task.page;
    console.log(`Opened page at ${artistUrl}`);

    await page.click(showAllSongsSelector);
    await page.screenshot({ path: `screenshots/${Date()}.png` });
    console.log(`Waiting for ten seconds...`);
    await page.waitFor(10 * 1000);

    var failuresCount = 0;

    var n = 1;
    var error = null;
    var songs = [];
    while (error == null) {
        try {
            const itemSelector = buildItemSelector(n);
            const songUrl = await page.$eval(itemSelector, el => el.href);
            const songNameSelector = buildSongNameSelector(n);
            const songName = await page.$eval(songNameSelector, el => el.innerHTML);

            const songData = {
                name: songName,
                url: songUrl
            };

            songs.push(songData);

            console.log(`Retrieved song data: ${songData.name} ${songData.url}`);
            LyricsDB.insertOne(songData);

            n += 1;
        } catch {
            console.log(`Failed to read song name element`);
            failuresCount += 1;
            if (failuresCount >= maxFailures) {
                const message = 'Max Failures Reached';
                error = Error(message);
                console.error(error);
            } else {
                console.log(`Scrolling down the page...preparing to try again`);
                // const scrollable_section = 'body > div.modal_window';
                await page.evaluate(selector => {
                    const scrollableSection = document.querySelector(selector);
                    const offset = 1000000;
                    scrollableSection.scrollTop = offset;
                }, scrollable_section);

                const interval = 6;
                console.log(`Waiting for ${interval} seconds`);
                await page.waitFor(interval * 1000);
                await page.screenshot({ path: `screenshots/${Date()}.png` });
            }
        }
    }

    await task.onComplete();
    return songs;
};

const clickShowAllAlbums = async (artistUrl) => {
    const task = await openPageTask(artistUrl);
    const page = task.page;

    await page.click(showAllAlbumsSelector);
    await page.waitFor(2 * 1000);
    await page.screenshot({ path: `screenshots/${Date()}.png` });
};

const main = async () => {
    const artistUrl = TupacArtistUrl;
    // clickShowAllAlbums(artistUrl);

    await LyricsDB.clear();
    readSongUrls(artistUrl)
        .then((songs) => {
            console.log(songs);
            LyricsDB.listAll().then((result) => {
                readLyrics(result[0].url).then((s) => {
                    print(s)
                });
            }).catch((err) => {
                print('read lyrics error', err);
            });
        }).catch((err) => {
            print('read song data error', err);
        });
};

main();