/* Live Chromium checks for 036js / misc. Block all analytics: tests are not visitors. */
const puppeteer = require('puppeteer-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const output = '/tmp/archive036-screens';
  fs.mkdirSync(output, {recursive:true});
  const executablePath = process.env.CHROME_BIN || '/usr/bin/google-chrome';
  const browser = await puppeteer.launch({
    executablePath, headless:true, args:['--no-sandbox','--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  const faults = [];
  page.on('pageerror', e => faults.push(e.message));
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await page.setRequestInterception(true);
  page.on('request', r => r.url().includes('countapi.mileshilliard.com') ? r.abort() : r.continue());
  const root='https://su-long-ai.github.io/osu-profile-assets/secret/';

  async function goto(file='') {
    const response=await page.goto(root+file+'?check=misc3', {waitUntil:'networkidle2',timeout:30000});
    assert.equal(response.status(),200,'HTTP '+response.status()+' for '+file);
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),
      'mobile horizontal overflow: '+file);
  }
  async function snap(name) { await page.screenshot({path:path.join(output,name)}); }
  const seen=(name)=>page.evaluate(id=>window.NB.seen(id),name);
  try {
    await goto();
    assert.equal(await page.$$eval('.file-list a.file',x=>x.length),4);
    assert(!(await page.evaluate(()=>document.body.textContent.includes('UNRESOLVED'))));
    assert((await page.$eval('.file-index',e=>parseFloat(getComputedStyle(e).fontSize)))<=12);
    await snap('index-mobile.png');

    await goto('sealed.html');
    assert(await page.$eval('.text-note',x=>!x.hidden));
    assert(await page.$eval('#last-line',x=>x.hidden));
    await page.tap('#scribble');
    assert(!(await page.$eval('#last-line',x=>x.hidden)));
    assert(await seen('margin'));
    await snap('note-mobile.png');

    await goto('signal.html');
    assert.equal(await page.$$eval('.mania-roll g[fill="url(#hold)"] rect',a=>a.length),4);
    assert.equal(await page.$$eval('[data-lane]',a=>a.length),4);
    await snap('8ticks-mobile.png');
    await page.tap('[data-lane="F"] rect');
    await page.tap('[data-lane="D"] rect');
    assert(await page.$eval('#margin-note',x=>x.hidden));
    for (const key of ['J','K','D','F']) await page.tap('[data-lane="'+key+'"] rect');
    assert(!(await page.$eval('#margin-note',x=>x.hidden)));
    assert(await seen('keys'));

    await goto('chronicle.html');
    const source=await page.content();
    assert(!source.includes('2025.03.07') && !source.includes('2025.05.27'));
    assert(source.includes('2025.12.26') && source.includes('2026.05.29'));
    assert(await page.$eval('#days-apart',x=>x.hidden));
    await page.tap('[data-day="regular"]');
    assert(await page.$eval('#days-apart',x=>x.hidden));
    await page.tap('[data-day="ln"]');
    assert(!(await page.$eval('#days-apart',x=>x.hidden)));
    assert((await page.$eval('#days-apart',x=>x.textContent)).includes('154'));
    assert(await seen('dates'));
    await snap('dates-mobile.png');

    await goto('orbit.html');
    assert.equal(await page.$$eval('[data-star]',a=>a.length),7);
    assert(await page.$eval('#wing-note',x=>x.hidden));
    await page.tap('#axis-hit');
    assert.equal(await page.$$eval('[data-star].matched',a=>a.length),4);
    assert.equal(await page.$$eval('[data-star].unmatched',a=>a.length),3);
    assert(!(await page.$eval('#wing-note',x=>x.hidden)));
    assert(await seen('mirror'));
    await snap('wing-mobile.png');
    await page.tap('#axis-hit');
    assert(await page.$eval('#wing-note',x=>x.hidden));

    await goto('stats.html');
    assert.equal(await page.$$eval('[id^="misc-"]',a=>a.length),4);
    assert.equal(await page.$$eval('.legacy [id]',a=>a.length),10);
    await snap('stats-mobile.png');

    const legacy=await page.goto(root+'tape.html', {waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(legacy.status(),200);
    await page.waitForSelector('#e-side');

    await page.setViewport({width:1280,height:900,isMobile:false,hasTouch:false,deviceScaleFactor:1});
    await goto();
    await snap('index-desktop.png');
    assert.equal(faults.length,0,faults.join('; '));
    console.log('PASS: 4 quiet files, mobile/desktop layout, chart touch, grounded dates, mirror toggle, casual note, legacy, no analytics contamination');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
