/* 036js visual-only site QA: no visitor count is ever sent during tests. */
const puppeteer=require('puppeteer-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const folder='/tmp/archive036-screens';
 fs.mkdirSync(folder,{recursive:true});
 const browser=await puppeteer.launch({
   executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
   headless:true,args:['--no-sandbox','--disable-dev-shm-usage']
 });
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true});
 await page.setRequestInterception(true);
 page.on('request',r=>r.url().includes('countapi.mileshilliard.com')?r.abort():r.continue());
 const base='https://su-long-ai.github.io/osu-profile-assets/secret/';
 async function open(name=''){
  const res=await page.goto(base+name+'?v=silent1',{waitUntil:'domcontentloaded',timeout:27000});
  assert.equal(res.status(),200,name+' not ready: '+res.status());
  await page.waitForFunction(()=>!!document.querySelector('link[href*="silent.css"]'),{timeout:8000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'horizontal overflow: '+name);
 }
 async function wordless(){
   const text=await page.evaluate(()=>document.body.innerText.trim());
   assert(!/[\p{L}]/u.test(text),'visible words found: '+JSON.stringify(text));
 }
 async function shot(name){await page.screenshot({path:path.join(folder,name)});}
 async function discovered(id){return page.evaluate(x=>window.NB.seen(x),id);}
 try{
  await open();
  assert.equal(await page.$$eval('.tile',xs=>xs.length),4);
  assert.equal(await page.$eval('.gallery',e=>getComputedStyle(e).position),'relative');
  await wordless();
  await shot('index-mobile.png');
  await open('signal.html');
  assert.equal(await page.$$eval('.roll g[fill="url(#hold)"] rect',xs=>xs.length),4);
  assert.equal(await page.$$eval('[data-lane]',xs=>xs.length),4);
  await wordless();
  await shot('keys-mobile.png');
  for(const k of ['F','D'])await page.tap('[data-lane="'+k+'"] rect');
  assert(await page.$eval('#afterglow',e=>e.hidden),'wrong key order revealed hidden mark');
  for(const k of ['J','K','D','F'])await page.keyboard.press(k.toLowerCase());
  assert(!(await page.$eval('#afterglow',e=>e.hidden)),'correct keys not resolved');
  assert(await discovered('keys'));

  await open('chronicle.html');
  await wordless();
  assert.equal(await page.$$eval('[data-day]',e=>e.length),2);
  assert(await page.$eval('#interval',e=>e.hidden));
  await page.tap('[data-day="ln"]');
  assert(await page.$eval('#interval',e=>e.hidden));
  await page.tap('[data-day="regular"]');
  assert.equal(await page.$eval('#interval',e=>e.textContent.trim()),'154');
  assert(!(await page.$eval('#interval',e=>e.hidden)));
  assert(await discovered('dates'));
  await shot('dates-mobile.png');

  await open('orbit.html');
  await wordless();
  assert.equal(await page.$$eval('[data-star]',e=>e.length),7);
  await page.tap('#axis-hit');
  assert(!(await page.$eval('#mirror-guides',e=>e.hidden)));
  assert.equal(await page.$$eval('[data-star].matched',e=>e.length),4);
  assert.equal(await page.$$eval('[data-star].unmatched',e=>e.length),3);
  assert(await discovered('mirror'));
  await shot('wing-mobile.png');
  await page.tap('#axis-hit');
  assert(await page.$eval('#mirror-guides',e=>e.hidden));

  await open('sealed.html');
  await wordless();
  assert(await page.$eval('#correction',e=>e.hidden));
  await page.tap('#scribble');
  assert(!(await page.$eval('#correction',e=>e.hidden)));
  assert(await page.$eval('#paper',e=>e.classList.contains('corrected')));
  assert(await discovered('margin'));
  await wordless();
  await shot('paper-mobile.png');

  await open('stats.html');
  await wordless();
  assert.equal(await page.$$eval('[id^="misc-"]',e=>e.length),4);
  assert.equal(await page.$$eval('.stats-history output',e=>e.length),10);
  await shot('stats-mobile.png');

  const tape=await page.goto(base+'tape.html',{waitUntil:'domcontentloaded',timeout:27000});
  assert.equal(tape.status(),200);
  await page.waitForSelector('#e-side',{timeout:10000});

  await page.setViewport({width:1280,height:900,deviceScaleFactor:1,isMobile:false,hasTouch:false});
  await open();
  await wordless();
  await shot('index-desktop.png');
  assert.equal(errors.length,0,'Browser JS errors: '+errors.join('; '));
  console.log('PASS silent site: no visible words, 4 graphic routes, 4 interactions, numeric dates, mirrored stars, paper correction, private stats, archived original, mobile+desktop');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
