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
 const expectedCSS='silent.css?v=26';
 let firstPage=true;
 async function open(name=''){
  let res,css='';
  for(let attempt=0;attempt<(firstPage?16:1);attempt++){
   res=await page.goto(base+name+'?v='+cacheBuster+'-'+attempt,{waitUntil:'load',timeout:27000});
   css=await page.evaluate(()=>document.querySelector('link[href*="silent.css"]')?.getAttribute('href')||'');
   if(res.status()===200&&css.includes(expectedCSS))break;
   await new Promise(resolve=>setTimeout(resolve,2000));
  }
  firstPage=false;
  assert.equal(res.status(),200,name+' not ready: '+res.status());
  assert(css.includes(expectedCSS),name+' served stale artwork: '+css);
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
  assert(await page.$eval('#completion-seal',el=>el.hidden && !el.hasAttribute('href')),
    'Zero-progress center must not expose finale link');
  assert((await page.$$eval('.tile',xs=>xs.filter(x=>getComputedStyle(x).animationName==='tile-breath').length))===4,'Gallery lacks visual discovery cues');
  assert.equal(await page.$eval('.gallery',e=>getComputedStyle(e).position),'relative');
  await wordless();
  await shot('index-mobile.png');
  await open('signal.html');
  assert.equal(await page.$$eval('.roll g[fill="url(#hold)"] rect',xs=>xs.length),4);
  assert.equal(await page.$$eval('.hold-note[role="button"][tabindex="0"]',xs=>xs.length),4,'The visible long notes must be real accessible controls');
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
    if(i===0)await page.tap('.hold-note[data-hold="'+k+'"]');
    else await page.keyboard.press(k.toLowerCase());
    if(i<3)assert.equal(await page.$$eval('#key-progress circle.on',xs=>xs.length),i+1,'Input progress did not respond at '+k);
    if(i===1){
      await page.reload({waitUntil:'load'});
      assert.equal(await page.$$eval('#key-progress circle.on',xs=>xs.length),2,'Partial rhythm should survive refresh');
      assert.equal(await page.$$eval('.hold-note.accepted',xs=>xs.map(x=>x.dataset.hold).join('')),'JK','Accepted notes should remain visibly marked');
    }
  }
  assert(!(await page.$eval('#afterglow',e=>e.hasAttribute('hidden'))),'correct keys not resolved');
  assert(await discovered('keys'));
  assert(await page.$eval('#key-progress',e=>e.hasAttribute('hidden')),'Completed progress should be replaced by final mark');
  await open();
  assert(await page.$eval('#completion-seal',el=>!el.hidden),'First found wing should begin the central composition');
  assert.equal(await page.$$eval('.seal-shards > g.found',e=>e.length),1,'Center must show only discovered wing');
  assert(await page.$eval('#completion-seal',el=>el.getBoundingClientRect().width>=90),
    'Progress composition should be visible on a standard phone');
  assert(await page.$eval('#completion-seal',el=>!el.classList.contains('ready') &&
    !el.hasAttribute('href') && el.tabIndex<0 && getComputedStyle(el).pointerEvents==='none'),
    'Partial progress must not expose an actionable finale link');
  await open('chronicle.html');
  await wordless();
  assert.equal(await page.$$eval('[data-day]',e=>e.length),2);
  assert.equal(await page.$$eval('.week-marks i',e=>e.length),22,'154 days should be drawn as 22 real weeks');
  assert(await page.$eval('#interval',e=>e.hidden));
  await page.tap('[data-day="regular"]');
  assert(await page.$eval('#interval',e=>e.hidden),'Reversed dates must not unlock');
  assert(!(await discovered('dates')),'Reversed date selection counted as a discovery');
  await page.tap('[data-day="ln"]');
  assert(await page.$eval('#interval',e=>e.hidden));
  assert(await page.$eval('.dates',e=>e.classList.contains('has-one')),'First date gives no visual feedback');
  await page.reload({waitUntil:'load'});
  assert(await page.$eval('.dates',e=>e.classList.contains('has-one')),'Date start should survive refresh');
  assert(await page.$eval('#interval',e=>e.hidden),'Resuming date start should not complete it');
  await page.tap('[data-day="regular"]');
  assert.equal(await page.$eval('#interval',e=>e.textContent.trim()),'154');
  assert(!(await page.$eval('#interval',e=>e.hidden)));
  assert(await discovered('dates'));
  assert.equal(await page.$$eval('.week-marks i.active',e=>e.length),22);
  assert(await page.$eval('.dates',e=>e.classList.contains('has-both')),'Date line was not completed');
  await shot('dates-mobile.png');

  await open('orbit.html');
  await wordless();
  assert.equal(await page.$$eval('[data-star][role="button"]',e=>e.length),7);
  const axisStarGap=await page.evaluate(()=>{
    const a=document.querySelector('#axis-hit').getBoundingClientRect();
    const b=document.querySelector('[data-star="v1"]').getBoundingClientRect();
    return {overlap:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
      Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)),axisWidth:a.width};
  });
  assert(axisStarGap.axisWidth>=43,'Mirror axis is too narrow for touch');
  assert(axisStarGap.overlap<1,'Mirror axis transparent hitbox overlaps the first candidate');
  assert(await page.$eval('#axis-beacon',e=>!e.hasAttribute('hidden')),'No discoverable symmetry-line cue');
  await page.tap('#axis-hit');
  assert(!(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden'))));
  assert.equal(await page.$eval('#axis-hit',e=>getComputedStyle(e).outlineStyle),'none','SVG focus rectangle must stay invisible');
  assert(!(await discovered('mirror')),'Clicking the axis alone cannot solve the symmetry challenge');
  // Small phone taps slightly outside a dot should resolve to the nearest star,
  // while blank sky must remain inactive. Exact clicks should toggle once.
  const starMap=await page.$('#star-map').then(el=>el.boundingBox());
  await page.touchscreen.tap(starMap.x+270/280*starMap.width,starMap.y+154/160*starMap.height);
  assert.equal(await page.$$eval('[data-star].chosen',e=>e.length),0,'Blank sky falsely chose a star');
  await page.touchscreen.tap(starMap.x+255/280*starMap.width,starMap.y+39/160*starMap.height);
  assert(await page.$eval('[data-star="v3"]',e=>e.classList.contains('chosen')),'Near miss should select the nearest violet star');
  await page.tap('[data-star="v3"] .star-hit');
  assert.equal(await page.$$eval('[data-star].chosen',e=>e.length),0,'Exact tap double toggled a candidate');
  for(const star of ['v2','v3','v5','v7'])await page.tap('[data-star="'+star+'"] .star-hit');
  assert(!(await discovered('mirror')),'Wrong four stars must not unlock');
  assert.equal(await page.$$eval('#star-progress circle.on',e=>e.length),4);
  assert(await page.$eval('.star-wrap',e=>e.classList.contains('near-miss')),'Failed selection needs subtle feedback');
  await page.tap('[data-star="v4"] .star-hit');
  assert.equal(await page.$$eval('[data-star].chosen',e=>e.length),4,
    'A fifth star must be rejected, not silently stored with four progress pips');
  assert(await page.$eval('#star-progress',e=>e.classList.contains('limit')),
    'Four-selected feedback missing when user tries a fifth star');
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
  assert.equal(await page.$$eval('#ink-target',e=>e.length),1,'Missing real physical ink correction target');
  const inkArea=await page.$('#scribble').then(el=>el.boundingBox());
  await page.mouse.move(inkArea.x+inkArea.width/2,inkArea.y+inkArea.height/2);
  await page.mouse.down();
  await page.mouse.move(inkArea.x+inkArea.width/2-19,inkArea.y+inkArea.height/2-19,{steps:5});
  await page.mouse.up();
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')),'Moving the ink away from its target cannot solve');
  await page.mouse.move(inkArea.x+inkArea.width/2,inkArea.y+inkArea.height/2);
  await page.mouse.down();
  await page.mouse.move(inkArea.x+inkArea.width/2+34,inkArea.y+inkArea.height/2+20,{steps:5});
  await page.mouse.up();
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')),'Dragging down but far sideways cannot join ink');
  await page.tap('#scribble');
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')),
    'A single tap must pick the ink, never bypass the physical correction');
  assert(await page.$eval('#ink-socket',e=>!e.hasAttribute('hidden')),
    'Picking the loose ink should reveal its target control');
  await page.tap('#ink-socket');
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
  assert(await page.$eval('#completion-seal',e=>e.getAttribute('href')==='./finale.html'),
    'Completed collection must enable an actual final puzzle link');
  assert(await page.$eval('.seal-shards',e=>getComputedStyle(e).display!=='none'),'Unassembled hub must show separated wing fragments');
  assert(await page.$eval('.seal-wings',e=>getComputedStyle(e).display==='none'),'Full butterfly must not spoil the finale');
  const sameArtwork=await page.evaluate(()=>{
    const source=window.NBFragments.parts.map(p=>p.contour);
    const preview=[...document.querySelectorAll('.seal-shards > g > path')].map(p=>p.getAttribute('d'));
    return source.length===4 && source.every((d,i)=>d===preview[i]);
  });
  assert(sameArtwork,'Home butterfly differs from the four original wing outlines');
  await wordless();
  await shot('all-found-mobile.png');

  // The four source rooms physically leave the same pieces used in assembly.
  for(const room of ['signal.html','chronicle.html','orbit.html','sealed.html']){
    await open(room);
    assert.equal(await page.$$eval('.fragment-stamp:not([hidden]) .fragment-art',e=>e.length),1,
      'Solved room lost the actual wing fragment: '+room);
    assert.equal(await page.$eval('.fragment-stamp',el=>el.tagName),'A','Wing should be a semantic return link');
    await page.tap('.fragment-stamp:not([hidden])');
    await page.waitForFunction(()=>location.pathname.endsWith('/secret/'));
    await page.waitForSelector('.completion-seal.ready');
  }
  await open();
  await page.tap('#completion-seal');
  await page.waitForFunction(()=>location.pathname.endsWith('/finale.html'));
  await page.waitForFunction(()=>document.querySelectorAll('.assembly-ghost .fragment-art').length===4,{timeout:10000});
  assert.equal(await page.$$eval('.assembly-slot',e=>e.length),4);
  assert.equal(await page.$$eval('.assembly-piece',e=>e.length),4);
  assert.equal(await page.$$eval('.assembly-ghost .fragment-art',e=>e.length),4);
  assert.equal(await page.$$eval('.assembly-ghost clipPath rect',e=>e.filter(x=>Number(x.getAttribute('width'))<=20).length),4,
    'Only a small physical wing root should hint at each position');
  assert.equal(await page.$$eval('.assembly-root-join',e=>e.length),0);
  assert(await page.$eval('#assembly-endmark',e=>e.hidden),'An unfinished butterfly must remain open');
  await page.tap('.assembly-piece[data-piece="keys"]');
  assert(await page.$eval('.assembly-piece[data-piece="keys"]',e=>e.getAttribute('aria-pressed')==='true'));
  await page.tap('.assembly-piece[data-piece="keys"]');
  assert(await page.$eval('.assembly-piece[data-piece="keys"]',e=>e.getAttribute('aria-pressed')==='false'),
    'Tapping the held free shard again must cancel selection');
  assert(await page.$eval('.assembly-board',e=>!e.classList.contains('piece-selected')));
  await wordless();
  await shot('assembly-mobile.png');

  // A wrong physical shape must not unlock the drawing; its placement survives refresh.
  await page.tap('.assembly-piece[data-piece="margin"]');
  await page.tap('.assembly-slot[data-slot="0"]');
  assert(await page.$eval('.assembly-slot[data-slot="0"]',e=>!e.classList.contains('fits')));
  assert.equal(await page.$$eval('.assembly-root-join',e=>e.length),0,'Wrong wing must not visibly join body');
  assert(await page.$eval('#assembly-endmark',e=>e.hidden),'Wrong outline triggered completion');
  await page.reload({waitUntil:'load'});
  assert(await page.$eval('.assembly-slot[data-slot="0"]',e=>e.classList.contains('occupied')));
  for(const [part,position] of [['keys',0],['dates',1],['mirror',2],['margin',3]]){
    await page.tap('.assembly-piece[data-piece="'+part+'"]');
    await page.tap('.assembly-slot[data-slot="'+position+'"]');
  }
  assert(await page.$eval('.assembly-board',e=>e.classList.contains('is-solved')),
    'Four physically fitting wing pieces did not complete drawing');
  assert.equal(await page.$$eval('.assembly-root-join',e=>e.length),4,
    'Completed butterfly must visibly connect its four wings');
  assert(!(await page.$eval('#assembly-endmark',e=>e.hidden)),'Joined wing closure not shown');
  assert(await page.$eval('#assembly-tray',e=>e.hidden),'Collected pieces should disappear after assembly');
  assert(await page.evaluate(()=>localStorage.getItem('nb036-misc-v4:joined')==='1'),'Assembly not remembered');
  await page.tap('#assembly-endmark');
  assert(await page.$eval('.assembly-board',e=>!e.classList.contains('is-solved')),'Completed butterfly cannot be replayed');
  assert(await page.evaluate(()=>localStorage.getItem('nb036-misc-v4:joined')==='1'),'Replay erased historical completion');
  await open();
  assert(await page.$eval('#completion-seal',e=>!e.classList.contains('complete')),
    'Gallery must show separated wings while a finished player is replaying');
  assert(await page.$eval('#completion-seal',e=>e.getAttribute('href')==='./finale.html'),
    'Replay must retain a working finale entry');
  await open('finale.html');
  assert(await page.$eval('.assembly-board',e=>!e.classList.contains('is-solved')),
    'Returning to the finale should retain unfinished replay state');
  await page.reload({waitUntil:'load'});
  assert(await page.$eval('.assembly-board',e=>!e.classList.contains('is-solved')),'Replay progress lost on refresh');
  for(const [part,position] of [['keys',0],['dates',1],['mirror',2],['margin',3]]){
    await page.tap('.assembly-piece[data-piece="'+part+'"]');
    await page.tap('.assembly-slot[data-slot="'+position+'"]');
  }
  assert(await page.$eval('.assembly-board',e=>e.classList.contains('is-solved')),'Replayed assembly did not complete');
  await wordless();
  await shot('assembly-complete-mobile.png');
  await page.reload({waitUntil:'load'});
  assert(await page.$eval('.assembly-board',e=>e.classList.contains('is-solved')),'Completed drawing lost on refresh');
  await open();
  assert(await page.$eval('#completion-seal',e=>e.classList.contains('complete')),'Gallery did not retain completed butterfly');
  assert(await page.$eval('.seal-shards',e=>getComputedStyle(e).display==='none'),'Finished hub still shows unassembled shards');
  assert(await page.$eval('.seal-wings',e=>getComputedStyle(e).display!=='none'),'Finished hub did not reveal full butterfly');

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

  // Hitbox collisions matter even when pictures appear correctly positioned.
  // The same geometry check covers both portrait and the short landscape layout.
  const hitAudit=()=>page.evaluate(()=>{
    const selectors=['.breadcrumb','.utility','.tile-a','.tile-b','.tile-c','.tile-d','#completion-seal'];
    const rs=selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {s,r}});
    const collisions=[];
    for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){
      const a=rs[i].r,b=rs[j].r;
      const area=Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
        Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
      if(area>1)collisions.push(rs[i].s+' / '+rs[j].s+': '+Math.round(area));
    }
    return collisions;
  });

  // More viewports than the normal screenshot test: small phone, tablet, wide monitor.
  for (const [width,height] of [[320,568],[360,640],[390,844],[428,926],[768,1024],[1280,900],[1920,1080]]) {
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
    const overlaps=await hitAudit();
    assert.equal(overlaps.length,0,'Overlapping navigation hitboxes at '+width+': '+overlaps.join('; '));
  }
  // Very short screens scroll vertically rather than compressing or overlapping
  // interactive artworks. A short portrait still keeps all work in view.
  for(const [width,height] of [[390,667],[667,375],[844,390],[915,412],[1024,600]]) {
    await page.setViewport({width,height,deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
    await open();
    const bounds=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,
      height:document.documentElement.scrollHeight,
      tiles:[...document.querySelectorAll('.tile')].map(x=>{
        const r=x.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
      })
    }));
    assert(bounds.width<=width+2,'Landscape introduced horizontal scrolling at '+width);
    for(const r of bounds.tiles){
      assert(r.left>=-2&&r.right<=width+2,'Landscape tile clipped horizontally at '+width);
      assert(r.top>=0&&r.bottom<=bounds.height+2,'Landscape tile unreachable at '+width);
    }
    const overlaps=await hitAudit();
    assert.equal(overlaps.length,0,'Short-screen navigation collision '+width+'x'+height+': '+overlaps.join('; '));
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
  console.log('PASS silent site: no visible words, real 22-week timeline, seven-star symmetry, physical ink correction, four-wing assembly, archived original, mobile+desktop, stats exclusion');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
