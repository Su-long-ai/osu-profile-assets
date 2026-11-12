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
  assert((await page.$$eval('.tile',xs=>xs.filter(x=>getComputedStyle(x).animationName==='tile-breath').length))===4,'Gallery lacks visual discovery cues');
  assert.equal(await page.$eval('.gallery',e=>getComputedStyle(e).position),'relative');
  await wordless();
  await shot('index-mobile.png');
  await open('signal.html');
  assert.equal(await page.$$eval('.roll g[fill="url(#hold)"] rect',xs=>xs.length),4);
  assert.equal(await page.$$eval('[data-lane]',xs=>xs.length),4);
  assert.equal(await page.$$eval('.key-cap',xs=>xs.length),4,'Invisible lane buttons remain');
  assert.equal(await page.$$eval('#key-progress circle',xs=>xs.length),4,'No four-beat input feedback');
  await wordless();
  await shot('keys-mobile.png');
  for(const k of ['F','D'])await page.tap('[data-lane="'+k+'"] rect');
  assert(await page.$eval('#afterglow',e=>e.hasAttribute('hidden')),'wrong key order revealed hidden mark');
  assert.equal(await page.$$eval('#key-progress circle.on',xs=>xs.length),0,'Wrong input should reset progress');
  for(const [i,k] of ['J','K','D','F'].entries()){
    await page.keyboard.press(k.toLowerCase());
    if(i<3)assert.equal(await page.$$eval('#key-progress circle.on',xs=>xs.length),i+1,'Input progress did not respond at '+k);
  }
  assert(!(await page.$eval('#afterglow',e=>e.hasAttribute('hidden'))),'correct keys not resolved');
  assert(await discovered('keys'));
  assert(await page.$eval('#key-progress',e=>e.hasAttribute('hidden')),'Completed progress should be replaced by final mark');

  await open('chronicle.html');
  await wordless();
  assert.equal(await page.$$eval('[data-day]',e=>e.length),2);
  assert(await page.$eval('#interval',e=>e.hidden));
  await page.tap('[data-day="ln"]');
  assert(await page.$eval('#interval',e=>e.hidden));
  assert(await page.$eval('.dates',e=>e.classList.contains('has-one')),'First date gives no visual feedback');
  await page.tap('[data-day="regular"]');
  assert.equal(await page.$eval('#interval',e=>e.textContent.trim()),'154');
  assert(!(await page.$eval('#interval',e=>e.hidden)));
  assert(await discovered('dates'));
  assert(await page.$eval('.dates',e=>e.classList.contains('has-both')),'Date line was not completed');
  await shot('dates-mobile.png');

  await open('orbit.html');
  await wordless();
  assert.equal(await page.$$eval('[data-star]',e=>e.length),7);
  assert(await page.$eval('#axis-beacon',e=>!e.hasAttribute('hidden')),'No discoverable symmetry-line cue');
  await page.tap('#axis-hit');
  assert(!(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden'))));
  assert.equal(await page.$eval('#axis-hit',e=>getComputedStyle(e).outlineStyle),'none','SVG focus rectangle must stay invisible');
  assert.equal(await page.$$eval('[data-star].matched',e=>e.length),4);
  assert.equal(await page.$$eval('[data-star].unmatched',e=>e.length),3);
  assert(await discovered('mirror'));
  assert(await page.$eval('#axis-beacon',e=>e.hasAttribute('hidden')),'Mirror cue did not yield to the revealed guides');
  await shot('wing-mobile.png');
  await page.tap('#axis-hit');
  assert(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden')));

  await open('sealed.html');
  await wordless();
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')));
  await page.tap('#scribble');
  assert(!(await page.$eval('#correction',e=>e.hasAttribute('hidden'))));
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

  // More viewports than the normal screenshot test: small phone, tablet, wide monitor.
  for (const [width,height] of [[320,568],[768,1024],[1920,1080]]) {
    await page.setViewport({width,height,deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
    await open();
    const rects=await page.evaluate(()=>[...document.querySelectorAll('.tile')].map(x=>{
      const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width};
    }));
    assert.equal(rects.length,4);
    for (const r of rects) {
      assert(r.width>70 && r.left>=-2 && r.right<=width+2,'Tile clipped at '+width+': '+JSON.stringify(r));
      assert(r.top>=0 && r.bottom<=height+2,'Tile inaccessible vertically at '+width+': '+JSON.stringify(r));
    }
  }

  // HTML button keyboard activation must toggle exactly once (not twice).
  await page.setViewport({width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await open('orbit.html');
  await page.focus('#axis-hit');
  await page.keyboard.press('Enter');
  assert.equal(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden')),false,'Enter did not turn on mirror');
  await page.keyboard.press('Space');
  assert.equal(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden')),true,'Space did not turn off mirror');

  // No real analytics requests are sent. Simulated fetch checks de-duplication
  // and that owner flag wins even if the local reported marker was cleared.
  const analytics=await page.evaluate(async()=>{
    const stage='misc-keys';
    const key='nb036-analytics-v1:counted:'+stage;
    const owner='nb036-analytics-v1:owner';
    const oldFetch=window.fetch;
    const beforeOwner=localStorage.getItem(owner);
    let calls=0;
    localStorage.removeItem(owner);
    localStorage.removeItem(key);
    window.fetch=async(url,...opts)=>{
      if(String(url).includes('/hit/')){calls++;return {ok:true,json:async()=>({value:1})}}
      return oldFetch(url,...opts);
    };
    try{
      await Promise.all([nightButterflyMetrics.record(stage),nightButterflyMetrics.record(stage)]);
      await nightButterflyMetrics.record(stage);
      const deduplicated=calls===1&&localStorage.getItem(key)==='1';
      localStorage.removeItem(key);
      localStorage.setItem(owner,'1');
      await nightButterflyMetrics.record(stage);
      return {deduplicated,ownerExcluded:calls===1,ownerFlag:localStorage.getItem(owner)};
    }finally{
      window.fetch=oldFetch;
      if(beforeOwner===null)localStorage.removeItem(owner); else localStorage.setItem(owner,beforeOwner);
    }
  });
  assert(analytics.deduplicated && analytics.ownerExcluded,'Analytics owner / repeat gate failed: '+JSON.stringify(analytics));

  assert.equal(errors.length,0,'Browser JS errors: '+errors.join('; '));
  console.log('PASS silent site: no visible words, 4 graphic routes, 4 interactions, numeric dates, mirrored stars, paper correction, private stats, archived original, mobile+desktop');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
