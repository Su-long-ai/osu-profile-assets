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
 const cacheBuster=process.env.GITHUB_SHA?.slice(0,12)||Date.now().toString(36);
 async function open(name=''){
  const res=await page.goto(base+name+'?v='+cacheBuster,{waitUntil:'load',timeout:27000});
  assert.equal(res.status(),200,name+' not ready: '+res.status());
  await page.waitForFunction(()=>!!document.querySelector('link[href*="silent.css"]'),{timeout:8000});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'horizontal overflow: '+name);
 }
 async function wordless(){
 const text=await page.evaluate(()=>{
   const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const visible=[];
     let node;
     while((node=walker.nextNode())){
       const el=node.parentElement;
       if(!el||el.closest('.sr-only,[hidden],[aria-hidden="true"],script,style'))continue;
       if(getComputedStyle(el).visibility==='hidden'||getComputedStyle(el).display==='none')continue;
       if(node.textContent.trim())visible.push(node.textContent.trim());
     }
     return visible.join(' ');
   });
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
  const capInspect=await page.evaluate(()=>({
    caps:[...document.querySelectorAll('.key-cap')].map(x=>({x:x.getAttribute('x'),parent:x.parentElement?.dataset?.lane})),
    lanes:[...document.querySelectorAll('[data-lane]')].map(x=>({lane:x.dataset.lane,cap:x.querySelectorAll('.key-cap').length,html:x.outerHTML.slice(0,300)})),
    svg:document.querySelector('#beat-grid')?.outerHTML.slice(-1500),
    url:location.href
  }));
  console.log('SVG_CAP_DIAGNOSTIC',JSON.stringify(capInspect));
  assert.equal(await page.$$eval('.key-cap',xs=>xs.length),4,'Invisible lane buttons remain: '+JSON.stringify(capInspect.caps));
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
  assert.equal(await page.$$eval('[data-star][role="button"]',e=>e.length),7);
  assert(await page.$eval('#axis-beacon',e=>!e.hasAttribute('hidden')),'No discoverable symmetry-line cue');
  await page.tap('#axis-hit');
  assert(!(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden'))));
  assert.equal(await page.$eval('#axis-hit',e=>getComputedStyle(e).outlineStyle),'none','SVG focus rectangle must stay invisible');
  assert(!(await discovered('mirror')),'Clicking the axis alone cannot solve the symmetry challenge');
  for(const star of ['v2','v3','v5','v7'])await page.tap('[data-star="'+star+'"] .star-hit');
  assert(!(await discovered('mirror')),'Wrong four stars must not unlock');
  assert.equal(await page.$$eval('#star-progress circle.on',e=>e.length),4);
  assert(await page.$eval('.star-wrap',e=>e.classList.contains('near-miss')),'Failed selection needs subtle feedback');
  await page.reload({waitUntil:'load'});
  assert.equal(await page.$$eval('[data-star].chosen',e=>e.length),4,'In-progress selections were lost');
  await page.tap('[data-star="v2"] .star-hit');
  await page.tap('[data-star="v1"] .star-hit');
  assert(await discovered('mirror'),'Symmetric stars did not unlock');
  assert.equal(await page.$$eval('[data-star].matched',e=>e.length),4);
  assert.equal(await page.$$eval('[data-star].unmatched',e=>e.length),3);
  assert(await page.$eval('#axis-beacon',e=>e.hasAttribute('hidden')),'Mirror cue did not yield to the revealed guides');
  await shot('wing-mobile.png');
  await page.tap('#axis-hit');
  assert(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden')));
  await page.tap('#axis-hit');
  await page.reload({waitUntil:'load'});
  assert(!(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden'))),'Mirror completion should survive reload');

  await open('sealed.html');
  await wordless();
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')));
  const paperBounds=await page.$('#paper').then(el=>el.boundingBox());
  await page.mouse.click(paperBounds.x+paperBounds.width*.15,paperBounds.y+paperBounds.height*.22);
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')),'Clicking blank paper must not discover hidden ink');
  await page.tap('#scribble');
  assert(!(await page.$eval('#correction',e=>e.hasAttribute('hidden'))));
  assert(await page.$eval('#paper',e=>e.classList.contains('corrected')));
  assert(await discovered('margin'));
  await wordless();
  await shot('paper-mobile.png');
  await page.reload({waitUntil:'load'});
  assert(await page.$eval('#paper',e=>e.classList.contains('corrected')),'Paper completion should survive reload');

  await open('stats.html');
  await wordless();
  assert.equal(await page.$$eval('.stats-scene > .stats-row [id^="misc-"]',e=>e.length),5);
  assert.equal(await page.$$eval('.stats-history output',e=>e.length),11);
  await shot('stats-mobile.png');

  await open();
  assert.equal(await page.$$eval('.tile.discovered',e=>e.length),4,'All four details should be marked after solving');
  assert(!(await page.$eval('#completion-seal',e=>e.hidden)),'Four discoveries need a subtle closing motif');
  await wordless();
  await shot('all-found-mobile.png');

  // The four source rooms physically leave the same pieces used in assembly.
  for(const room of ['signal.html','chronicle.html','orbit.html','sealed.html']){
    await open(room);
    assert.equal(await page.$$eval('.fragment-stamp:not([hidden]) .fragment-art',e=>e.length),1,
      'Solved room lost the actual wing fragment: '+room);
  }
  await open();
  await page.tap('#completion-seal');
  await page.waitForFunction(()=>location.pathname.endsWith('/finale.html'));
  await page.waitForFunction(()=>document.querySelectorAll('.assembly-ghost .fragment-art').length===4,{timeout:10000});
  assert.equal(await page.$$eval('.assembly-slot',e=>e.length),4);
  assert.equal(await page.$$eval('.assembly-piece',e=>e.length),4);
  assert.equal(await page.$$eval('.assembly-ghost .fragment-art',e=>e.length),4);
  assert(await page.$eval('#assembly-endmark',e=>e.hidden),'An unfinished butterfly must remain open');
  await wordless();
  await shot('assembly-mobile.png');

  // A wrong physical shape must not unlock the drawing; its placement survives refresh.
  await page.tap('.assembly-piece[data-piece="margin"]');
  await page.tap('.assembly-slot[data-slot="0"]');
  assert(await page.$eval('.assembly-slot[data-slot="0"]',e=>!e.classList.contains('fits')));
  assert(await page.$eval('#assembly-endmark',e=>e.hidden),'Wrong outline triggered completion');
  await page.reload({waitUntil:'load'});
  assert(await page.$eval('.assembly-slot[data-slot="0"]',e=>e.classList.contains('occupied')));
  for(const [part,position] of [['keys',0],['dates',1],['mirror',2],['margin',3]]){
    await page.tap('.assembly-piece[data-piece="'+part+'"]');
    await page.tap('.assembly-slot[data-slot="'+position+'"]');
  }
  assert(await page.$eval('.assembly-board',e=>e.classList.contains('is-solved')),
    'Four physically fitting wing pieces did not complete drawing');
  assert(!(await page.$eval('#assembly-endmark',e=>e.hidden)),'Joined wing closure not shown');
  assert(await page.$eval('#assembly-tray',e=>e.hidden),'Collected pieces should disappear after assembly');
  assert(await page.evaluate(()=>localStorage.getItem('nb036-misc-v4:joined')==='1'),'Assembly not remembered');
  await wordless();
  await shot('assembly-complete-mobile.png');
  await page.reload({waitUntil:'load'});
  assert(await page.$eval('.assembly-board',e=>e.classList.contains('is-solved')),'Completed drawing lost on refresh');
  await open();
  assert(await page.$eval('#completion-seal',e=>e.classList.contains('complete')),'Gallery did not retain completed butterfly');

  const tape=await page.goto(base+'tape.html',{waitUntil:'domcontentloaded',timeout:27000});
  assert.equal(tape.status(),200);
  await page.waitForSelector('#e-side',{timeout:10000});
  await page.tap('details summary');
  await page.tap('#redact');
  for(const k of ['d','f','j','k'])await page.tap('[data-lane="'+k+'"]');
  await page.tap('[data-year="2020"]');
  await page.tap('[data-year="2025"]');
  await page.tap('#constellation');
  for(const k of ['0','3','6'])await page.tap('[data-digit="'+k+'"]');
  assert(!(await page.$eval('#e-side',e=>e.hidden)),'Archived E-Side cannot be completed');
  await page.reload({waitUntil:'load'});
  assert(!(await page.$eval('#e-side',e=>e.hidden)),'Archived E-Side should survive reload');

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
  if(!(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden'))))await page.tap('#axis-hit');
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
    const backoff='nb036-analytics-v1:service-retry-after';
    const oldFetch=window.fetch;
    const beforeOwner=localStorage.getItem(owner);
    const beforeBackoff=localStorage.getItem(backoff);
    let calls=0;
    localStorage.removeItem(owner);
    localStorage.removeItem(backoff); // isolate the simulated success from a prior blocked network call
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
      if(beforeBackoff===null)localStorage.removeItem(backoff); else localStorage.setItem(backoff,beforeBackoff);
    }
  });
  assert(analytics.deduplicated && analytics.ownerExcluded,'Analytics owner / repeat gate failed: '+JSON.stringify(analytics));

  assert.equal(errors.length,0,'Browser JS errors: '+errors.join('; '));
  console.log('PASS silent site: no visible words, 4 graphic routes, 4 interactions, numeric dates, mirrored stars, paper correction, private stats, archived original, mobile+desktop');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
