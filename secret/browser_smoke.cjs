/* 036js visual-only site QA: no visitor count is ever sent during tests. */
const puppeteer=require('puppeteer-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sourceLines=fs.readFileSync(__filename,'utf8').split(/\r?\n/);
const arrayEvalTokens=['xs=>','e=>e.length','e=>e.every','e=>e.map','e=>e.filter'];
const invalidSingleEval=sourceLines
  .map((line,i)=>({line,n:i+1}))
  .filter(x=>x.line.includes('page.'+'$eval(')&&arrayEvalTokens.some(t=>x.line.includes(t)));
assert.equal(invalidSingleEval.length,0,
  'browser_smoke contains single-element $eval with an array callback: '+JSON.stringify(invalidSingleEval));
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
 const expectedCSS='silent.css?v=47';
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
  await page.evaluate(()=>{
    for(const key of Object.keys(localStorage))if(key.startsWith('nb036-'))localStorage.removeItem(key);
  });
  await page.reload({waitUntil:'load'});
  assert.equal(await page.$$eval('.tile',xs=>xs.length),4);
  assert(await page.$eval('#completion-seal',el=>el.hidden && !el.hasAttribute('href')),
    'Zero-progress center must not expose finale link');
  assert.equal(await page.$$eval('.archive-link',xs=>xs.length),4,'Post-completion archive needs four source links');
  assert.equal(await page.$$eval('.source-afterimage',xs=>xs.length),4,'Hub needs four source-native afterimages');
  assert.equal(await page.$$eval('link[href*="source-memory.css?v=2"]',xs=>xs.length),1,'Source-memory stylesheet missing');
  assert.equal(await page.$$eval('link[href*="prejoin-cue.css?v=1"]',xs=>xs.length),1,'Pre-assembly convergence stylesheet missing');
  assert.equal(await page.$$eval('.archive-link[pathLength="1"]',xs=>xs.length),4,'Correspondence paths need normalized draw lengths');
  assert.equal(await page.$$eval('.gallery.ready,.gallery.prejoin-cue',xs=>xs.length),0,'Fresh hub must not expose the final convergence cue');
  assert.equal(await page.$eval('.impression-entry',e=>getComputedStyle(e).display),'none',
    'First act leaked the second-act print entry');
  assert(await page.$$eval('.source-afterimage',xs=>xs.every(x=>Number(getComputedStyle(x).opacity)===0)),
    'Source afterimages must stay invisible before assembly');
  assert(await page.$$eval('.source-afterimage',xs=>xs.every(x=>getComputedStyle(x).pointerEvents==='none')),
    'Source afterimages must never intercept the four existing trailheads');
  assert.equal(await page.$eval('.archive-map',e=>getComputedStyle(e).opacity),'0','Archive map must stay hidden before completion');
  assert.equal(await page.$eval('.archive-map',e=>getComputedStyle(e).pointerEvents),'none','Archive map must never intercept play');
  assert(await page.$$eval('.tile',xs=>xs.every(x=>getComputedStyle(x).animationName==='none')),
    'Gallery cards themselves must stay still');
  const galleryCueNames=await page.evaluate(()=>[
    getComputedStyle(document.querySelector('.tile-a .thumb-holds')).animationName,
    getComputedStyle(document.querySelector('.tile-b svg>circle')).animationName,
    getComputedStyle(document.querySelector('.tile-c .thumb-axis')).animationName,
    getComputedStyle(document.querySelector('.tile-d .thumb-ink')).animationName
  ]);
  assert.deepEqual(galleryCueNames,['gallery-hold-breath','gallery-date-pulse','gallery-axis-beacon','gallery-hook-glint'],
    'Each gallery illustration needs its own nonverbal discovery cue');
  assert.equal(await page.$eval('.gallery',e=>getComputedStyle(e).position),'relative');
  await wordless();
  await shot('index-mobile.png');
  await open('signal.html');
  assert.equal(await page.$$eval('script[src*="registration-residue.js?v=5"]',xs=>xs.length),1,
    'Archive-contact client cache version is stale');
  assert.equal(await page.$$eval('script[src*="metrics.js?v=2"]',xs=>xs.length),1,
    'Act-two metrics allowlist cache version is stale in archive room');
  assert.equal(await page.$$eval('.roll g[fill="url(#hold)"] rect',xs=>xs.length),7);
  assert.equal(await page.$$eval('.hold-note[role="button"][tabindex="0"]',xs=>xs.length),7,'The visible long notes must be real accessible controls');
  assert.equal(await page.$$eval('[data-lane]',xs=>xs.length),7);
  const capInspect=await page.evaluate(()=>({
    caps:[...document.querySelectorAll('.key-cap')].map(x=>({x:x.getAttribute('x'),parent:x.parentElement?.dataset?.lane})),
    lanes:[...document.querySelectorAll('[data-lane]')].map(x=>({lane:x.dataset.lane,cap:x.querySelectorAll('.key-cap').length,html:x.outerHTML.slice(0,300)})),
    svg:document.querySelector('#beat-grid')?.outerHTML.slice(-1500),
    url:location.href
  }));
  console.log('SVG_CAP_DIAGNOSTIC',JSON.stringify(capInspect));
  assert.equal(await page.$$eval('.key-cap',xs=>xs.length),7,'Invisible lane buttons remain: '+JSON.stringify(capInspect.caps));
  assert.equal(await page.$$eval('#key-progress circle',xs=>xs.length),4,'Four-beat state machine lost its compatibility markers');
  assert.equal(await page.$$eval('link[href*="diegetic-feedback.css?v=1"]',xs=>xs.length),1,'Diegetic feedback stylesheet missing in rhythm room');
  assert.equal(await page.$$eval('link[href*="archival-scenes.css?v=1"]',xs=>xs.length),1,'Archival room stylesheet missing in rhythm room');
  const keyCounter=await page.$eval('#key-progress',e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {o:Number(s.opacity),w:r.width,h:r.height,p:s.pointerEvents}});
  assert(keyCounter.o===0&&keyCounter.w<=1.1&&keyCounter.h<=1.1&&keyCounter.p==='none','Detached rhythm counter became visible again');
  assert.equal(await page.$$eval('.phrase-echo',xs=>xs.length),4,'In-grid rhythm history needs four scene marks');
  await wordless();
  await shot('keys-mobile.png');
  for(const [i,k] of ['S','SPACE','L','S'].entries()){
   await page.tap('[data-lane="'+k+'"] rect');
   if(i<3){
    assert.equal(await page.$$eval('#key-progress circle.on',xs=>xs.length),i+1,'Input count should advance without judging correctness');
    assert.equal(await page.$$eval('.phrase-echo:not([hidden])',xs=>xs.length),i+1,'Input history must live inside the piano roll');
    assert.equal(await page.$$eval('.hold-note.accepted',xs=>xs.length),0,'Partial input must not reveal correct lanes');
    assert(!(await page.$eval('#key-progress',el=>el.classList.contains('wrong-order'))),'Partial input leaked correctness');
   }
  }
  assert(await page.$eval('#afterglow',e=>e.hasAttribute('hidden')),'wrong full sequence revealed hidden mark');
  assert(await page.$eval('#key-progress',el=>el.classList.contains('wrong-order')),'Wrong full sequence lacks feedback');
  assert(await page.$eval('#beat-grid',el=>el.classList.contains('phrase-rejected')),'Wrong phrase feedback escaped the score scene');
  await page.waitForFunction(()=>document.querySelectorAll('#key-progress circle.on').length===0&&!document.querySelector('#key-progress').classList.contains('wrong-order'));
  assert.equal(await page.$$eval('.phrase-echo:not([hidden])',xs=>xs.length),0,'Rejected phrase left stale score marks');
  assert.equal(await page.$$eval('.hold-note.accepted',xs=>xs.length),0,'Wrong sequence left correctness marks');
  assert(!(await page.$eval('#source-lens',e=>e.hidden)),'A full failed phrase should reveal the source aperture');
  assert(!(await page.$eval('#source-proof',e=>e.open)),'Source aperture opened without intent');
  await page.tap('#source-lens');
  await page.waitForFunction(()=>document.querySelector('#source-proof')?.open===true);
  assert.equal(await page.$eval('.source-proof-aperture',()=>1),1,'Source crop lost its optical aperture');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('#source-proof-close').length),0,'Card-style close control regressed into the source aperture');
  assert.equal(await page.$eval('picture source[srcset*="v39-source-phrase.png"]',()=>1),1,
    'Reduced-motion source proof is not derived from the current v39 profile hero');
  assert.equal(await page.$eval('#source-proof img[src*="v39-source-phrase.gif"]',()=>1),1,
    'Animated source proof is not derived from the current v39 profile hero');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('[src*="v36-source-phrase"]').length),0,
    'Stale v36 source proof leaked back into the live rhythm room');
  await page.waitForFunction(()=>{const i=document.querySelector('#source-proof img');return i&&i.naturalWidth===344&&i.naturalHeight===246});
  await page.keyboard.press('j');
  assert.equal(await page.$$eval('#key-progress circle.on',xs=>xs.length),0,'Source aperture leaked keyboard input into the rhythm room');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.querySelector('#source-proof')?.open===false);
  for(const [i,k] of ['J','K','D','F'].entries()){
    if(i===0)await page.tap('.hold-note[data-hold="'+k+'"]');
    else await page.keyboard.press(k.toLowerCase());
    if(i<3)assert.equal(await page.$$eval('#key-progress circle.on',xs=>xs.length),i+1,'Input progress did not respond at '+k);
    if(i===1){
      await page.reload({waitUntil:'load'});
      assert.equal(await page.$$eval('#key-progress circle.on',xs=>xs.length),2,'Partial rhythm should survive refresh');
      assert.equal(await page.$$eval('.phrase-echo:not([hidden])',xs=>xs.length),2,'Visible score history must survive refresh with the partial rhythm');
      assert.deepEqual(await page.$$eval('.phrase-echo:not([hidden])',xs=>xs.map(x=>Number(x.getAttribute('x')))),[208,254],'Score history no longer maps J,K to their real lanes');
      assert.equal(await page.$$eval('.hold-note.accepted',xs=>xs.length),0,'Partial sequence must survive without revealing correct lanes');
    }
  }
  assert(!(await page.$eval('#afterglow',e=>e.hasAttribute('hidden'))),'correct keys not resolved');
  assert(await discovered('keys'));
  assert(await page.$eval('#key-progress',e=>e.hasAttribute('hidden')),'Completed progress should be replaced by final mark');
  assert.equal(await page.$$eval('.hold-note.accepted',xs=>xs.map(x=>x.dataset.hold).sort().join(',')),'D,F,J,K','Only the recovered four-note phrase should illuminate after completion');
  assert.equal(await page.$$eval('[data-lane][tabindex="-1"][aria-disabled="true"]',xs=>xs.length),7,'Solved rhythm lanes must leave the input tab order');
  assert.equal(await page.$$eval('.hold-note[tabindex="-1"][aria-disabled="true"]',xs=>xs.length),7,'Solved rhythm notes must leave the input tab order');
  assert(!(await page.$eval('#echo-play',e=>e.hidden)),'Post-solve audible memory must remain available');
  assert.equal(await page.$eval('[data-lane] rect',e=>getComputedStyle(e).cursor),'default','Solved rhythm lane still advertises pointer input');
  await open();
  assert(await page.$eval('#completion-seal',el=>el.hidden),'Partial progress must stay in the solved illustration, not create a premature centre object');
  await open('chronicle.html');
  assert.equal(await page.$$eval('link[href*="archival-scenes.css?v=1"]',xs=>xs.length),1,'Archival room stylesheet missing in timeline room');
  await wordless();
  assert.equal(await page.$$eval('[data-day]',e=>e.length),7);
  assert.equal(await page.$$eval('.week-marks i',e=>e.length),22,'154 days should be drawn as 22 real weeks');
  assert(await page.$eval('#interval',e=>e.hidden));
  assert.equal(await page.$$eval('.date-row',xs=>xs.length),7,'All real archive dates must be available');
  assert(await page.$eval('#time-thread',e=>e.hidden),'Do not reveal the answer before choosing');
  await page.tap('[data-day="r00"]');
  await page.tap('[data-day="r01"]');
  assert(!(await discovered('dates')),'Earlier milestones must not unlock the fifth-pass thread');
  await page.tap('[data-day="regular"]');
  await page.tap('[data-day="ln"]');
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
  assert.equal(await page.$$eval('.date-row:disabled',xs=>xs.length),7,'Solved timeline rows must become archival');
  assert.equal(await page.$eval('.date-row',e=>getComputedStyle(e).cursor),'default','Solved timeline row still advertises pointer input');
  assert.equal(await page.$$eval('.date-row:disabled[tabindex="-1"]',xs=>xs.length),7,
    'Solved timeline rows must explicitly leave the focus order');
  await shot('dates-mobile.png');

  await open('orbit.html');
  assert.equal(await page.$eval('.source-reference',a=>a.getAttribute('href')),'https://osu.ppy.sh/users/29089125#me','Mirror room must point back to the profile artwork');
  assert.equal(await page.$$eval('link[href*="diegetic-feedback.css?v=1"]',xs=>xs.length),1,'Diegetic feedback stylesheet missing in mirror room');
  const starCounter=await page.$eval('#star-progress',e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {o:Number(s.opacity),w:r.width,h:r.height,p:s.pointerEvents}});
  assert(starCounter.o===0&&starCounter.w<=1.1&&starCounter.h<=1.1&&starCounter.p==='none','Detached star counter became visible again');
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
    'Four-selected state marker missing when user tries a fifth star');
  assert(await page.$eval('.star-wrap',e=>e.classList.contains('selection-full')),
    'Four-selected feedback must pulse the chosen stars inside the scene');
  await page.reload({waitUntil:'load'});
  assert.equal(await page.$$eval('[data-star].chosen',e=>e.length),4,'In-progress selections were lost');
  await page.tap('[data-star="v2"] .star-hit');
  await page.tap('[data-star="v1"] .star-hit');
  assert(await discovered('mirror'),'Symmetric stars did not unlock');
  assert.equal(await page.$$eval('[data-star].matched',e=>e.length),4);
  assert.equal(await page.$$eval('[data-star].unmatched',e=>e.length),3);
  assert(await page.$eval('#axis-beacon',e=>e.hasAttribute('hidden')),'Mirror cue did not yield to the revealed guides');
  await shot('wing-mobile.png');
  assert(await page.$eval('#axis-hit',e=>e.disabled),'Solved mirror axis must become archival');
  assert.equal(await page.$$eval('[data-star][role="img"][tabindex="-1"]',xs=>xs.length),7,
    'Solved mirror stars must become static archive graphics');
  assert.equal(await page.$$eval('[data-star][role="button"]',xs=>xs.length),0,
    'Solved mirror must not leave seven stale puzzle buttons');
  assert.equal(await page.$$eval('[data-star][aria-pressed]',xs=>xs.length),0,
    'Static mirror archive must not advertise pressed button state');
  assert.equal(await page.$eval('#axis-hit',e=>e.tabIndex),-1,'Solved mirror axis stayed in the focus order');
  assert.equal(await page.$eval('[data-star]',e=>getComputedStyle(e).cursor),'default','Solved mirror star still advertises pointer input');
  assert.equal(await page.$eval('#axis-hit',e=>getComputedStyle(e).cursor),'default','Solved mirror axis still advertises pointer input');
  await page.$eval('#axis-hit',e=>e.click());
  assert(!(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden'))),'Solved mirror must not be visually hidden');
  await page.reload({waitUntil:'load'});
  assert(!(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden'))),'Mirror completion should survive reload');
  assert.equal(await page.$$eval('[data-star].matched',e=>e.length),4,'Solved mirror lost its four matched stars after reload');
  assert(await page.$eval('#axis-hit',e=>e.disabled),'Solved mirror axis unlocked after reload');

  await open('sealed.html');
  await wordless();
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')));
  const paperBounds=await page.$('#paper').then(el=>el.boundingBox());
  await page.mouse.click(paperBounds.x+paperBounds.width*.15,paperBounds.y+paperBounds.height*.22);
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')),'Clicking blank paper must not discover hidden ink');
  assert.equal(await page.$$eval('#ink-target',e=>e.length),1,'Missing real physical j-hook correction target');
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
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')),'Dragging away from the stem cannot join ink');
  await page.tap('#scribble');
  assert(await page.$eval('#correction',e=>e.hasAttribute('hidden')),
    'A single tap must pick the ink, never bypass the physical correction');
  assert(await page.$eval('#ink-socket',e=>!e.hasAttribute('hidden')),
    'Picking the loose hook should reveal its stem target');
  assert(!(await page.$eval('#paper',e=>e.classList.contains('corrected'))),
    'The revealing touch must not click through and solve the hook');
  await new Promise(resolve=>setTimeout(resolve,360));
  await page.tap('#ink-socket');
  assert(!(await page.$eval('#correction',e=>e.hasAttribute('hidden'))));
  assert(await page.$eval('#paper',e=>e.classList.contains('corrected')));
  assert(await discovered('margin'));
  assert(await page.$eval('#scribble',e=>e.disabled),'Solved paper correction must become archival');
  assert.equal(await page.$eval('#scribble',e=>e.tabIndex),-1,'Solved paper control stayed in the focus order');
  assert.equal(await page.$eval('#scribble',e=>getComputedStyle(e).cursor),'default','Solved paper still advertises pointer input');
  assert(await page.$eval('.paper-wrap',e=>e.classList.contains('archival')),'Solved paper wrapper lacks archival state');
  await page.$eval('#scribble',e=>e.click());
  assert(await page.$eval('#paper',e=>e.classList.contains('corrected')),'Solved paper was visually undone');
  await wordless();
  await shot('paper-mobile.png');
  await page.reload({waitUntil:'load'});
  assert(await page.$eval('#paper',e=>e.classList.contains('corrected')),'Paper completion should survive reload');
  assert(await page.$eval('#scribble',e=>e.disabled),'Solved paper correction unlocked after reload');

  await open('stats.html');
  await wordless();
  assert.equal(await page.$$eval('.stats-scene > .stats-row [id^="misc-"]',e=>e.length),5);
  assert.equal(await page.$eval('.stats-act-two .stats-row:not(.stats-artifact-branch) [id^="misc-"]',e=>e.length),3,
    'Stats main funnel needs impression, contact, and verso stages');
  assert.deepEqual(await page.$eval('.stats-act-two .stats-row:not(.stats-artifact-branch) output',xs=>xs.map(x=>x.id)),
    ['misc-impression','misc-contact','misc-verso'],'Stats main act-two stages drifted');
  assert.equal(await page.$eval('.stats-act-two .stats-artifact-branch #misc-duplex',xs=>xs.length),1,
    'Optional duplex-download branch is missing or duplicated');
  assert.equal(await page.$eval('link[href*="stats-funnel.css?v=2"]',xs=>xs.length),1,'Stats optional-branch stylesheet revision missing');
  assert(await page.evaluate(()=>typeof window.nightButterflyMetrics?.record==='function'&&typeof window.nightButterflyMetrics?.count==='function'),
    'Stats metrics API is unavailable');
  const statsBranch=await page.$eval('.stats-artifact-branch',e=>{
    const r=e.getBoundingClientRect(),p=e.parentElement.querySelector('.stats-row:not(.stats-artifact-branch)')?.getBoundingClientRect(),s=getComputedStyle(e),b=getComputedStyle(e,'::before');
    return {x:r.x,w:r.width,mainX:p?.x,mainW:p?.width,ml:parseFloat(s.marginLeft),opacity:parseFloat(s.opacity),connector:b.content,borderLeft:b.borderLeftWidth,borderBottom:b.borderBottomWidth};
  });
  assert(statsBranch.ml>=25&&statsBranch.x>statsBranch.mainX+20&&statsBranch.w<statsBranch.mainW-20&&statsBranch.opacity<.65,
    'Optional duplex branch reads like a required main-funnel stage: '+JSON.stringify(statsBranch));
  assert(statsBranch.connector!=='none'&&statsBranch.borderLeft!=='0px'&&statsBranch.borderBottom!=='0px',
    'Optional duplex branch lost its visual branch connector');
  assert.equal(await page.$$eval('.stats-spoke',xs=>xs.length),4,'Stats map needs four parallel source spokes');
  assert.equal(await page.$$eval('.stats-tip',xs=>xs.length),4,'Stats map needs four source tips');
  assert.equal(await page.$$eval('.stats-assembly-ring',xs=>xs.length),1,'Stats map needs one assembly hub');
  assert.equal(await page.$$eval('.stats-history output',e=>e.length),11);
  await page.waitForFunction(()=>[...document.querySelectorAll('.stats-scene > .stats-row output,.stats-act-two output')].every(e=>e.textContent==='—'),{timeout:12000});
  assert(await page.$$eval('.stats-scene > .stats-row output,.stats-act-two output',xs=>xs.every(x=>x.getAttribute('aria-label').includes('不代表零次'))),'Failed reads must not imply zero or distinct people');
  await shot('stats-mobile.png');

  await open();
  assert.equal(await page.$$eval('.tile.discovered',e=>e.length),4,'All four details should be marked after solving');
  assert(await page.$$eval('.tile.discovered',xs=>xs.every(x=>getComputedStyle(x,'::after').content==='none')),
    'Solved state must live in each artwork, not a generic completion badge');
  assert(!(await page.$eval('#completion-seal',e=>e.hidden)),'Four discoveries need a subtle closing motif');
  assert(await page.$eval('.gallery',e=>e.classList.contains('ready')),'Four discoveries must put the hub into ready state');
  await page.waitForFunction(()=>document.querySelector('.gallery')?.classList.contains('prejoin-cue'),{timeout:4000});
  assert(['prejoin-map','prejoin-map-mobile'].includes(
    await page.$eval('.archive-map',e=>getComputedStyle(e).animationName)),
    'Ready hub must briefly converge the four real correspondence curves');
  assert.equal(await page.$eval('#completion-seal .seal-ready-mark',e=>getComputedStyle(e).display),'inline','Ready state must use the neutral four-root mark');
  assert(await page.$eval('#completion-seal',e=>e.getAttribute('href')==='./finale.html'),
    'Completed collection must enable an actual final puzzle link');
  assert.equal(await page.$$eval('.seal-ready-mark .root-node',xs=>xs.length),4,'Ready mark must expose exactly four root nodes');
  assert(await page.$eval('.seal-body',e=>getComputedStyle(e).display==='none'),'Butterfly body must stay hidden before assembly');
  assert(await page.$eval('.seal-wings',e=>getComputedStyle(e).display==='none'),'Full butterfly must not spoil the finale');
  await wordless();
  await shot('all-found-mobile.png');

  // The four source rooms physically leave the same pieces used in assembly.
  for(const room of ['signal.html','chronicle.html','orbit.html','sealed.html']){
    await open(room);
    assert.equal(await page.$$eval('link[href*="registration-residue.css?v=1"]',xs=>xs.length),1,
      'Historical registration stylesheet missing: '+room);
    assert.equal(await page.$$eval('link[href*="registered-graph.css?v=2"]',xs=>xs.length),1,
      'Registered archive graph stylesheet missing: '+room);
    assert.equal(await page.$$eval('.fragment-stamp:not([hidden]) .fragment-art',e=>e.length),1,
      'Solved room lost the actual wing fragment: '+room);
    assert.equal(await page.$eval('.fragment-stamp',el=>el.tagName),'A','Wing should be a semantic return link');
    assert(!(await page.$eval('.fragment-stamp',el=>el.classList.contains('registered'))),
      'Registration residue leaked into the first-play room: '+room);
    assert.equal(await page.$eval('.fragment-stamp',el=>el.getAttribute('href')),'./',
      'First-play wing stopped returning to the hub: '+room);
    assert(!(await page.$eval('.fragment-stamp',el=>el.classList.contains('route-to-print'))),
      'Second-act archive route leaked into first play: '+room);
    assert((await page.$eval('.fragment-hairline',e=>e.getBoundingClientRect().width))>=28,
      'First-play fragment hairline was replaced before assembly history: '+room);
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
  assert.equal(await page.$$eval('link[href*="assembly-loose.css?v=1"]',e=>e.length),1,'Loose-fragment assembly stylesheet missing');
  assert(await page.$$eval('.assembly-piece',xs=>xs.every(x=>getComputedStyle(x).borderBottomWidth==='0px')),
    'Fragment tray rails returned');
  assert(await page.$$eval('.assembly-piece',xs=>xs.every(x=>getComputedStyle(x,'::after').display==='none')),
    'Fragment tray dots returned');
  assert.equal(await page.$$eval('.assembly-ghost .fragment-art',e=>e.length),4);
  assert.equal(await page.$$eval('.assembly-ghost clipPath rect',e=>e.filter(x=>Number(x.getAttribute('width'))<=20).length),4,
    'Only a small physical wing root should hint at each position');
  assert.equal(await page.$$eval('.assembly-root-join',e=>e.length),0);
  assert(await page.$eval('#assembly-endmark',e=>e.hidden),'An unfinished butterfly must remain open');
  assert(await page.$eval('#assembly-home',e=>e.hidden),'Unfinished assembly cannot act as a return link');
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
  assert(!(await page.$eval('#assembly-home',e=>e.hidden)),'Completed butterfly must expose its return link');
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.assembly-core-mark')).opacity)<.01 &&
    Number(getComputedStyle(document.querySelector('.assembly-spine')).opacity)>.99,{timeout:1800});
  assert((await page.$eval('.assembly-core-mark',e=>Number(getComputedStyle(e).opacity)))<.01,'Four-root core must disappear after completion');
  assert((await page.$eval('.assembly-spine',e=>Number(getComputedStyle(e).opacity)))>.99,'Butterfly body must appear only after completion');
  assert.equal(await page.$eval('#assembly-home',e=>e.getAttribute('href')),'https://osu.ppy.sh/users/29089125#me','Completed butterfly must return to the source profile');
  await page.goto(base+'?v='+cacheBuster+'-joined',{waitUntil:'load',timeout:27000});
  assert(await page.$eval('.gallery',e=>e.classList.contains('joined')),'Completed gallery must enter joined archive state');
  assert(await page.$eval('.gallery',e=>!e.classList.contains('prejoin-cue')),'Completed gallery must not replay the pre-assembly cue');
  assert(Number(await page.$eval('.archive-map',e=>getComputedStyle(e).opacity))>.5,'Joined archive map must become visible');
  assert.equal(await page.$$eval('.archive-root',xs=>xs.length),4,'Joined archive must show four corresponding roots');
  assert.notEqual(await page.$eval('.impression-entry',e=>getComputedStyle(e).display),'none',
    'Joined hub did not expose the second-act print entry');
  assert.equal(await page.$$eval('.impression-entry circle[r="5.8"]',xs=>xs.length),1,
    'Second-act entry no longer speaks the registration-ring language');
  assert.equal(await page.$$eval('.impression-entry path[d*="M4 14h3"]',xs=>xs.length),1,
    'Second-act entry lost its physical registration ticks');
  await new Promise(resolve=>setTimeout(resolve,520));
  const memories=await page.evaluate(()=>[...document.querySelectorAll('.source-afterimage')].map(e=>({
    opacity:Number(getComputedStyle(e).opacity),
    pointer:getComputedStyle(e).pointerEvents,
    background:getComputedStyle(e).backgroundImage
  })));
  assert.equal(memories.length,4,'Joined hub lost a source afterimage');
  assert(memories.every(x=>x.opacity>=.08),'Joined source memories never became visible');
  assert(memories.every(x=>x.pointer==='none'),'Joined source memories intercepted interaction');
  assert(memories.every(x=>/source-memory-(keys|dates|mirror|margin)\.png/.test(x.background)),
    'Joined source memory does not come from the profile-native crops');
  const sourceDims=await page.evaluate(async()=>{
    const names=['keys','dates','mirror','margin'], out={};
    await Promise.all(names.map(name=>new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>{out[name]=[img.naturalWidth,img.naturalHeight];resolve();};
      img.onerror=reject;
      img.src='./source-memory-'+name+'.png?v='+Date.now();
    })));
    return out;
  });
  assert.deepEqual(sourceDims,{
    keys:[210,125],dates:[310,129],mirror:[140,95],margin:[168,144]
  },'Source memories must use the exact four live profile imagemap windows');
  await page.focus('.tile-a');
  await page.waitForFunction(()=>{
    const xs=[...document.querySelectorAll('.seal-wings [data-mini-part]')];
    const own=xs.find(e=>e.dataset.miniPart==='keys');
    const other=xs.filter(e=>e.dataset.miniPart!=='keys');
    return own && Number(getComputedStyle(own).opacity)>.9 &&
      other.length===3 && other.every(e=>Number(getComputedStyle(e).opacity)<.3);
  },{timeout:1400});
  const wingFocus=await page.evaluate(()=>[...document.querySelectorAll('.seal-wings [data-mini-part]')].map(e=>[e.dataset.miniPart,Number(getComputedStyle(e).opacity),getComputedStyle(e).filter]));
  assert(wingFocus.find(x=>x[0]==='keys')[1]>.9,'Focused source must keep its own wing visible');
  assert(wingFocus.filter(x=>x[0]!=='keys').every(x=>x[1]<.3),'Focused source must dim the other three wings');
  assert.notEqual(wingFocus.find(x=>x[0]==='keys')[2],'none','Focused source wing needs a visible afterimage');
  await page.goto(base+'finale.html?v='+cacheBuster+'-joined-return',{waitUntil:'load',timeout:27000});
  assert(await page.$eval('.assembly-board',e=>e.classList.contains('is-solved')),'Returning to finale must restore the completed assembly');
  await page.focus('#assembly-home');
  const homeFocus=await page.evaluate(()=>({
    outline:getComputedStyle(document.querySelector('#assembly-home')).outlineStyle,
    wing:getComputedStyle(document.querySelector('.assembly-filled')).filter,
    spine:getComputedStyle(document.querySelector('.assembly-spine')).filter
  }));
  assert.equal(homeFocus.outline,'none','Completed butterfly focus must not draw a UI rectangle');
  assert.notEqual(homeFocus.wing,'none','Keyboard focus must remain visible on the butterfly itself');
  assert.notEqual(homeFocus.spine,'none','Keyboard focus should illuminate the butterfly body');
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
  assert.equal(await page.$$eval('link[href*="registration-return.css?v=1"]',xs=>xs.length),1,'Profile-return registration stylesheet missing');
  await page.goto(base+'?source=registration&v='+cacheBuster+'-profile-return',{waitUntil:'load',timeout:27000});
  await page.waitForFunction(()=>document.querySelector('.shell')?.classList.contains('registration-return'),{timeout:2500});
  assert.notEqual(await page.$eval('.impression-entry svg',e=>getComputedStyle(e).filter),'none','Profile registration return did not acknowledge the impression entry');
  await page.waitForFunction(()=>!document.querySelector('.shell')?.classList.contains('registration-return'),{timeout:2500});
  assert(await page.$eval('.seal-ready-mark',e=>getComputedStyle(e).display==='none'),'Finished hub still shows the ready mark');
  assert(await page.$eval('.seal-wings',e=>getComputedStyle(e).display!=='none'),'Finished hub did not reveal full butterfly');
  assert(await page.$eval('.seal-body',e=>getComputedStyle(e).display!=='none'),'Finished hub did not reveal the butterfly body');
  const sameArtwork=await page.evaluate(()=>{
    const source=window.NBFragments.parts.map(p=>p.contour);
    const preview=[...document.querySelectorAll('.seal-wings > g > path')].map(p=>p.getAttribute('d'));
    return source.length===4 && source.every((d,i)=>d===preview[i]);
  });
  assert(sameArtwork,'Finished home butterfly differs from the four original wing outlines');

  // Post-registration second read: the clean butterfly can reveal one real profile source at a time.
  await page.evaluate(()=>{
    localStorage.removeItem('nb036-impression-v1:aligned');
    localStorage.removeItem('nb036-impression-v2:edition');
  });
  await open('impression.html');
  assert.equal(await page.$$eval('script[src*="impression.js?v=11"]',xs=>xs.length),1,
    'Impression contact-history initializer is stale');
  assert.equal(await page.$$eval('script[src*="metrics.js?v=3"]',xs=>xs.length),1,
    'Impression metrics cache version is stale');
  assert.equal(await page.$$eval('link[href*="impression-source.css?v=2"]',xs=>xs.length),1,
    'Impression source-proof stylesheet missing');
  assert.equal(await page.$$eval('link[href*="registered-graph.css?v=2"]',xs=>xs.length),1,
    'Registered archive graph stylesheet missing from impression');
  assert.equal(await page.$$eval('link[href*="verso.css?v=2"]',xs=>xs.length),1,'Profile-verso stylesheet missing from impression');
  assert.equal(await page.$$eval('#verso-entry',xs=>xs.length),1,'Impression lost its physical verso axis');
  assert.equal(await page.$eval('#verso-entry',e=>e.tabIndex),-1,'Verso axis must stay out of focus before all archive contacts');
  assert.equal(await page.$eval('#verso-entry',e=>e.hasAttribute('href')),false,'Verso route leaked before all archive contacts');
  assert.equal(await page.$$eval('.source-proof',xs=>xs.length),4,'Registered print needs four source-proof layers');
  assert.equal(await page.$$eval('.pin-route',xs=>xs.length),4,'Registered print needs four archive routes');
  assert.equal(await page.$$eval('[data-proof-hit]',xs=>xs.length),4,'Registered print needs four physical proof regions');
  assert.equal(await page.$$eval('[data-pin-part]',xs=>xs.length),4,'Registered print needs four source registration pins');
  assert.equal(await page.$eval('#plate',e=>e.getAttribute('role')),'slider','Fresh impression must remain a rotation slider');
  assert.equal(await page.$eval('#plate',e=>e.tabIndex),0,'Fresh impression slider left the focus order');
  assert.equal(await page.$$eval('[data-proof-hit][tabindex="-1"][aria-disabled="true"]',xs=>xs.length),4,
    'Source proofs must not become interactive before registration');
  assert.equal(await page.$$eval('.pin-route[tabindex="-1"][aria-disabled="true"]',xs=>xs.length),4,
    'Archive routes must not become interactive before registration');
  assert.equal(await page.$$eval('.pin-route[href]',xs=>xs.length),0,
    'Fresh impression exposed archive destinations before registration');
  await page.focus('#plate');
  for(let i=0;i<13;i++)await page.keyboard.press('ArrowLeft');
  assert(await page.$eval('#plate',e=>e.classList.contains('solved')),'Keyboard registration did not complete the print');
  assert.equal(await page.$eval('#plate',e=>e.getAttribute('role')),'group','Solved print must retire slider semantics');
  assert.equal(await page.$eval('#plate',e=>e.tabIndex),-1,'Solved print slider stayed in the focus order');
  assert.equal(await page.$eval('#plate',e=>e.hasAttribute('aria-disabled')),false,
    'Solved print group disabled its own interactive archive descendants');
  assert.equal(await page.$$eval('.pin-route[tabindex="0"][aria-disabled="false"][href]',xs=>xs.length),4,
    'Solved print must expose four registered archive links');
  const pinBoxes=await page.$$eval('.pin-route',xs=>xs.map(x=>{const r=x.getBoundingClientRect();return [r.width,r.height]}));
  assert(pinBoxes.every(([w,h])=>w>=40&&h>=40),'Registered archive pin targets are too small: '+JSON.stringify(pinBoxes));
  assert.equal(await page.$$eval('[data-proof-hit][tabindex="0"][aria-disabled="false"]',xs=>xs.length),4,
    'Solved print must expose four source-proof regions');
  await page.$eval('[data-proof-hit="keys"]',e=>e.focus());
  assert.equal(await page.$eval('#plate',e=>e.dataset.proof),'keys','Focused wing did not reveal its source');
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('[data-source-part="keys"]')).opacity)>.12,{timeout:1500});
  assert(Number(await page.$eval('[data-source-part="keys"]',e=>getComputedStyle(e).opacity))>.12,
    'Focused key wing source never appeared');
  assert(await page.$$eval('.source-proof:not([data-source-part="keys"])',xs=>xs.every(e=>Number(getComputedStyle(e).opacity)<.03)),
    'One source proof revealed the other wings');
  assert.equal(await page.$eval('[data-proof-hit="keys"]',e=>getComputedStyle(e).outlineStyle),'none',
    'Source-proof keyboard focus drew a UI rectangle');
  await page.$eval('.pin-route[data-pin-route="mirror"]',e=>e.focus());
  assert.equal(await page.$eval('#plate',e=>e.dataset.proof),'mirror',
    'Focused registration pin did not preview its archive source');
  assert.equal(await page.$eval('#plate',e=>e.dataset.routePreview),'mirror',
    'Focused registration pin did not mark its route');
  assert.equal(await page.$eval('.pin-route[data-pin-route="mirror"]',e=>getComputedStyle(e).outlineStyle),'none',
    'Registration pin focus drew a UI rectangle');
  await page.$eval('[data-proof-hit="keys"]',e=>e.focus());
  await page.keyboard.press('Enter');
  await page.focus('#impression-edition');
  assert.equal(await page.$eval('#plate',e=>e.dataset.proof),'keys','Pinned source proof did not survive focus movement');
  await page.$eval('[data-proof-hit="keys"]',e=>e.focus());
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#plate',e=>e.hasAttribute('data-proof')),false,'Escape did not dismiss the source proof');
  const nightName=await page.$eval('#impression-download',a=>a.download);
  const nightExport=await page.$eval('#impression-download',async a=>await (await fetch(a.href)).text());
  assert.equal(nightName,'036js-night-impression.svg','Third-read history leaked into the pre-verso export filename');
  assert(nightExport.includes('viewBox="0 0 400 400"')&&!nightExport.includes('class="duplex-back"'),
    'Pre-verso print must remain the single recto artifact');
  assert(nightExport.includes('width="120mm" height="120mm"'),
    'Single-face print lost its physical 120mm square scale');
  assert(!nightExport.includes('class="duplex-fold"'),'Pre-verso single-face night export leaked fold marks');
  assert.equal(await page.$$eval('script[src*="duplex-back.js?v=1"]',xs=>xs.length),1,'Duplex back template is missing');
  const duplexThroughOrigins=await page.evaluate(()=>{
    const d=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+window.NBDuplexBack.svg+'</svg>','image/svg+xml');
    return [...d.querySelectorAll('.duplex-origin circle')].map(x=>[400-Number(x.getAttribute('cx')),Number(x.getAttribute('cy'))]);
  });
  assert(duplexThroughOrigins.length===2&&duplexThroughOrigins.every((p,i)=>p.every((v,j)=>Math.abs(v-[[89,275],[272,333]][i][j])<.01)),
    'Duplex back origins no longer register through the paper onto the mirror/margin pins: '+JSON.stringify(duplexThroughOrigins));
  assert(nightExport.includes('class="export-registration-pins"'),'Downloaded night print lost its four registration marks');
  assert.equal((nightExport.match(/r="5\.8"/g)||[]).length,4,'Downloaded night print needs four registration rings');
  assert(!nightExport.includes('data-pin-part='),'Downloaded print leaked DOM-only part labels');
  assert(!nightExport.includes('<image')&&!nightExport.includes('source-memory')&&!nightExport.includes('transfer-core'),
    'Temporary source/contact state leaked into the downloadable artifact');
  await page.click('#impression-edition');
  const paperName=await page.$eval('#impression-download',a=>a.download);
  const paperExport=await page.$eval('#impression-download',async a=>await (await fetch(a.href)).text());
  assert.equal(paperName,'036js-paper-impression.svg','Pre-verso paper export unexpectedly became duplex');
  assert(paperExport.includes('viewBox="0 0 400 400"')&&!paperExport.includes('class="duplex-back"'),
    'Pre-verso paper print must remain single-sided');
  assert(!paperExport.includes('class="duplex-fold"'),'Pre-verso single-face paper export leaked fold marks');
  assert(paperExport.includes('class="export-registration-pins"'),'Downloaded paper print lost its four registration marks');
  assert.equal((paperExport.match(/r="5\.8"/g)||[]).length,4,'Downloaded paper print needs four registration rings');
  assert(paperExport.includes('#386770')&&paperExport.includes('#665577')&&paperExport.includes('#416773')&&paperExport.includes('#75556e'),
    'Paper export registration pins were not recolored with the print');
  assert(!paperExport.includes('<image')&&!paperExport.includes('source-memory')&&!paperExport.includes('transfer-core'),
    'Paper export leaked temporary source/contact state');
  await page.click('#impression-edition');
  assert.equal(await page.$eval('#impression-edition',e=>e.getAttribute('aria-pressed')),'false',
    'Browser smoke did not restore the night edition before reprint/contact checks');
  await page.click('#reprint');
  assert.equal(await page.$eval('#plate',e=>e.getAttribute('role')),'slider','Reprint did not restore slider semantics');
  assert.equal(await page.$eval('#plate',e=>e.tabIndex),0,'Reprint did not restore slider focus');
  assert.equal(await page.$$eval('[data-proof-hit][tabindex="-1"][aria-disabled="true"]',xs=>xs.length),4,
    'Reprint left source proofs interactive');
  assert.equal(await page.$$eval('.pin-route[tabindex="-1"][aria-disabled="true"]',xs=>xs.length),4,
    'Reprint left registered archive routes interactive');
  assert.equal(await page.$$eval('.pin-route[href]',xs=>xs.length),0,
    'Reprint kept stale archive destinations');
  assert.equal(await page.$eval('#plate',e=>e.hasAttribute('data-proof')),false,'Reprint left a stale source proof visible');

  // After historical assembly, revisiting each solved archive carries the exact impression registration signature.
  for(const [room,part] of [['signal.html','keys'],['chronicle.html','dates'],['orbit.html','mirror'],['sealed.html','margin']]){
    await open(room);
    assert(await page.$eval('.fragment-stamp',e=>e.classList.contains('registered')),
      'Joined archive lost its registration residue: '+room);
    assert.equal(await page.$eval('.fragment-stamp',e=>e.dataset.fragment),part,
      'Registration residue attached to the wrong fragment: '+room);
    assert(await page.$eval('.fragment-stamp',e=>e.classList.contains('route-to-print')),
      'Joined archive wing did not become a route back to the registered print: '+room);
    assert.equal(await page.$eval('.fragment-stamp',e=>e.getAttribute('href')),'./impression.html#'+part,
      'Joined archive wing points to the wrong registered print position: '+room);
    assert.equal(await page.$eval('.breadcrumb',e=>e.getAttribute('href')),'./',
      'Archive breadcrumb must keep the direct hub route: '+room);
    assert(!(await page.$eval('.fragment-stamp',e=>e.classList.contains('registration-arrival'))),
      'Ordinary archive revisit falsely played a registered arrival: '+room);
    assert.equal(await page.evaluate(p=>localStorage.getItem('nb036-impression-v3:contact:'+p),part),null,
      'Ordinary archive revisit falsely recorded print contact: '+room);
    const reg=await page.$eval('.fragment-hairline',e=>{
      const r=e.getBoundingClientRect(),s=getComputedStyle(e),b=getComputedStyle(e,'::before'),a=getComputedStyle(e,'::after');
      return {w:r.width,h:r.height,border:s.borderTopWidth,bw:b.width,bh:b.height,bs:b.boxShadow,aw:a.width,ah:a.height,as:a.boxShadow};
    });
    assert(reg.w>=11&&reg.w<=13&&reg.h>=11&&reg.h<=13,'Archive registration ring changed size: '+room+' '+JSON.stringify(reg));
    assert(reg.border!=='0px'&&Number.parseFloat(reg.bw)>=2.5&&Number.parseFloat(reg.ah)>=2.5,
      'Archive registration ticks lost the impression geometry: '+room+' '+JSON.stringify(reg));
    assert.notEqual(reg.bs,'none','Horizontal registration mate lost its outer tick: '+room);
    assert.notEqual(reg.as,'none','Vertical registration mate lost its outer tick: '+room);
    assert.equal(await page.$$eval('.registration-residue,[data-registration-control]',xs=>xs.length),0,
      'Historical registration mark introduced a new UI control: '+room);
  }

  // Contact history is order-free and robust to same-document hash arrivals.
  await open('signal.html');
  await page.evaluate(()=>{location.hash='registered'});
  await page.waitForFunction(()=>localStorage.getItem('nb036-impression-v3:contact:keys')==='1');
  assert(await page.$eval('.fragment-stamp',e=>e.classList.contains('registration-arrival')),
    'Same-document registered arrival did not refresh the archive impression');
  for(const [room,part] of [['chronicle.html','dates'],['orbit.html','mirror'],['sealed.html','margin']]){
    await page.goto(base+room+'?v='+cacheBuster+'-contact-'+part+'#registered',{waitUntil:'load',timeout:27000});
    assert(await page.$eval('.fragment-stamp',e=>e.classList.contains('registration-arrival')),
      'Registered print route did not leave an arrival impression in '+room);
    assert.equal(await page.evaluate(p=>localStorage.getItem('nb036-impression-v3:contact:'+p),part),'1',
      'Registered archive did not record physical print contact: '+room);
  }
  await open('impression.html');
  assert(await page.$eval('#plate',e=>e.classList.contains('contact-complete')),
    'Four registered archive contacts did not complete the contact history');
  assert.equal(await page.$$eval('#fixed-pins .transfer-core',xs=>xs.length),4,
    'Registered print needs four physical transfer cores');
  assert(await page.$$eval('#fixed-pins .transfer-core',xs=>xs.every(x=>Number(getComputedStyle(x).opacity)>.4)),
    'Completed contacts did not ink all four registration cores');
  assert(await page.$$eval('.source-proof',xs=>xs.every(x=>Number(getComputedStyle(x).opacity)<.01)),
    'Unregistered reprint exposed the full contact ghost before the plate was aligned');
  await page.focus('#plate');
  for(let i=0;i<13;i++)await page.keyboard.press('ArrowLeft');
  assert(await page.$eval('#plate',e=>e.classList.contains('solved')&&e.classList.contains('contact-complete')),
    'Re-registering the contacted print did not restore the complete exposure');
  await page.waitForFunction(()=>[...document.querySelectorAll('.source-proof')].every(x=>{
    const o=Number(getComputedStyle(x).opacity);return o>=.04&&o<=.09;
  }),{timeout:1400});
  assert(await page.$$eval('.source-proof',xs=>xs.every(x=>{
    const o=Number(getComputedStyle(x).opacity);return o>=.04&&o<=.09;
  })),'Completed contact exposure is not the intended quiet all-source ghost');
  await page.$eval('[data-proof-hit="mirror"]',e=>e.focus());
  await page.waitForFunction(()=>{
    const own=document.querySelector('[data-source-part="mirror"]');
    const others=[...document.querySelectorAll('.source-proof:not([data-source-part="mirror"])')];
    return own&&Number(getComputedStyle(own).opacity)>.12&&others.every(x=>Number(getComputedStyle(x).opacity)<.02);
  },{timeout:1400});
  assert(Number(await page.$eval('[data-source-part="mirror"]',e=>getComputedStyle(e).opacity))>.12,
    'Individual proof did not override the contact exposure');
  assert(await page.$$eval('.source-proof:not([data-source-part="mirror"])',xs=>xs.every(x=>Number(getComputedStyle(x).opacity)<.02)),
    'Individual proof failed to suppress the other contact ghosts');
  assert(await page.$eval('#verso-entry',e=>e.classList.contains('available')),
    'Completed contact history did not unlock the physical verso axis');
  assert.equal(await page.$$eval('link[href*="verso-ready.css?v=1"]',xs=>xs.length),1,'Verso-ready convergence stylesheet missing');
  assert.equal(await page.$$eval('#verso-ready-lines path[pathLength="1"]',xs=>xs.length),4,
    'Third-read convergence needs four normalized registration paths');
  assert(await page.$eval('#plate',e=>e.classList.contains('verso-ready-cue')),
    'Unread profile verso did not trigger the one-shot convergence cue');
  assert.equal(await page.$eval('#verso-entry',e=>e.tabIndex),0,'Unlocked verso axis is missing from keyboard focus');
  assert.equal(await page.$eval('#verso-entry',e=>e.getAttribute('href')),'./verso.html','Verso axis points to the wrong back side');
  assert.equal(await page.$eval('#verso-entry',e=>getComputedStyle(e).outlineStyle),'none',
    'Verso axis fell back to the browser rectangular focus outline');
  const versoBox=await page.$eval('#verso-entry .verso-hit',e=>{const r=e.getBoundingClientRect();return [r.width,r.height]});
  assert(versoBox[0]>=40&&versoBox[1]>=40,'Verso flip target is too small: '+JSON.stringify(versoBox));
  await page.click('#verso-entry');
  await page.waitForFunction(()=>location.pathname.endsWith('/verso.html')&&!document.querySelector('.verso-stage')?.hidden,{timeout:5000});
  assert.equal(await page.$$eval('link[href*="verso.css?v=2"]',xs=>xs.length),1,
    'Profile verso did not pick up the focus-cleanup stylesheet revision');
  assert.equal(await page.$$eval('script[src*="verso.js?v=3"]',xs=>xs.length),1,
    'Profile-verso client cache version is stale');
  assert.equal(await page.$$eval('script[src*="metrics.js?v=2"]',xs=>xs.length),1,
    'Profile-verso metrics cache version is stale');
  assert.equal(await page.$$eval('.hot.play',xs=>xs.length),5,'Profile verso must preserve five selected-play regions');
  assert.equal(await page.$$eval('.hot.collab',xs=>xs.length),13,'Profile verso must preserve thirteen shared-frame regions');
  assert.equal(await page.$$eval('link[href*="verso-origin.css?v=1"]',xs=>xs.length),1,'Verso origin stylesheet missing');
  assert.equal(await page.$$eval('.verso-origin-mark',xs=>xs.length),2,'Verso needs exactly two profile-origin marks');
  assert.deepEqual(await page.$$eval('.verso-origin-mark circle',xs=>xs.map(x=>[Number(x.getAttribute('cx')),Number(x.getAttribute('cy')),Number(x.getAttribute('r'))])),
    [[850,1818,16],[846,1170,15]],'Verso profile-origin coordinates drifted from the v42 raster seeds');
  assert(await page.$$eval('.verso-origin-mark',xs=>xs.every(x=>Number(getComputedStyle(x).opacity)<.01)),
    'Verso origin marks must stay latent at rest');
  await page.$eval('.verso-register',e=>e.focus());
  await page.waitForFunction(()=>[...document.querySelectorAll('.verso-origin-mark')].every(x=>Number(getComputedStyle(x).opacity)>=.7),{timeout:2500});
  const versoSources=await page.$$eval('.verso-panel image',xs=>xs.map(x=>x.getAttribute('href')||''));
  assert.equal(versoSources.filter(x=>x.includes('036js-v42-selected-plays-body.jpg')).length,6,
    'Profile verso selected-play layers drifted from the v42 public-profile source');
  assert.equal(versoSources.filter(x=>x.includes('036js-v42-shared-frames-body.jpg')).length,14,
    'Profile verso shared-frame layers drifted from the v42 public-profile source');
  assert(versoSources.every(x=>!x.includes('036js-v27-selected-plays-body.jpg')&&!x.includes('036js-v27-shared-frames-body.jpg')),
    'Profile verso still contains a stale v27 profile source');
  assert.deepEqual(await page.$$eval('.hot.play',xs=>xs.map(x=>x.getAttribute('href'))),
    ['https://ibb.co/zHbXDsLT','https://ibb.co/9kgtKmbc','https://ibb.co/4RVSjS2f','https://ibb.co/zVJNVxQj','https://ibb.co/pjydc5dc'],
    'Profile verso play links drifted from the public profile');
  assert.deepEqual(await page.$$eval('.hot.collab',xs=>xs.map(x=>x.getAttribute('href'))),
    ['https://osu.ppy.sh/users/25520572','https://osu.ppy.sh/users/29089125','https://osu.ppy.sh/users/36372669','https://osu.ppy.sh/users/16178831','https://osu.ppy.sh/users/34523998','https://osu.ppy.sh/users/26795413','https://osu.ppy.sh/users/27235859','https://osu.ppy.sh/users/16233573','https://osu.ppy.sh/users/33005235','https://osu.ppy.sh/users/32910954','https://osu.ppy.sh/users/29089125','https://osu.ppy.sh/users/32358269','https://osu.ppy.sh/users/34278014'],
    'Profile verso collaborator links drifted from the public profile');
  assert.equal(await page.$eval('.verso-register',e=>e.getAttribute('href')),'./impression.html#verso','Verso registration axis does not flip back to the print');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nb036-verso-v1:seen')),'1',
    'Viewing the unlocked profile verso did not persist the third-read history flag');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,'Profile verso overflows horizontally');
  await page.click('.verso-register');
  await page.waitForFunction(()=>location.pathname.endsWith('/impression.html'),{timeout:5000});
  assert(await page.$eval('#plate',e=>e.classList.contains('solved')&&e.classList.contains('contact-complete')),
    'Returning from profile verso lost the registered/contacted print');
  assert.equal(await page.$eval('#plate',e=>e.classList.contains('verso-ready-cue')),false,
    'Third-read convergence cue returned after the profile verso had already been seen');
  assert(await page.$eval('#verso-entry',e=>e.classList.contains('available')),
    'Retiring the discovery cue accidentally removed the physical verso route');
  const duplexName=await page.$eval('#impression-download',a=>a.download);
  const duplexExport=await page.$eval('#impression-download',async a=>await (await fetch(a.href)).text());
  assert.equal(duplexName,'036js-night-duplex-impression.svg','Seen verso did not upgrade the physical print download');
  assert(duplexExport.includes('viewBox="0 0 840 400"')&&duplexExport.includes('class="duplex-front"')&&duplexExport.includes('class="duplex-back"'),
    'Third-read export is not the expected self-contained duplex sheet');
  assert(duplexExport.includes('width="252mm" height="120mm"'),
    'Duplex print lost its physical 252mm by 120mm print scale');
  assert.equal((duplexExport.match(/class="duplex-box"/g)||[]).length,18,'Duplex back must preserve all 5+13 public-profile regions');
  assert.equal((duplexExport.match(/class="duplex-origin"/g)||[]).length,2,'Duplex back lost the two v42 origin marks');
  assert.equal((duplexExport.match(/class="duplex-field"/g)||[]).length,2,'Duplex back needs exactly two profile source fields');
  assert.equal((duplexExport.match(/class="duplex-fold"/g)||[]).length,1,
    'Third-read duplex export must carry exactly one fold-registration group');
  assert(duplexExport.includes('M420 5v12M416 11h8')&&duplexExport.includes('M420 383v12M416 389h8'),
    'Duplex fold marks moved away from the physical fold axis x=420');
  const foldGeometry=await page.evaluate(svg=>{
    const d=new DOMParser().parseFromString(svg,'image/svg+xml');
    const origins=[...d.querySelectorAll('.duplex-origin circle')].map(x=>[Number(x.getAttribute('cx')),Number(x.getAttribute('cy'))]);
    const axis=d.querySelector('.duplex-axis circle');
    return {
      folded:origins.map(([x,y])=>[840-(440+x),y]),
      foldedAxis:axis?[840-(440+Number(axis.getAttribute('cx'))),Number(axis.getAttribute('cy'))]:null
    };
  },duplexExport);
  assert.deepEqual(foldGeometry.folded,[[89,275],[272,333]],
    'Folding the duplex no longer registers the two profile origins onto their recto pins');
  assert.deepEqual(foldGeometry.foldedAxis,[200,200],
    'Folding the duplex no longer registers the verso axis onto the recto center');
  assert(!duplexExport.includes('<image')&&!duplexExport.includes('href=')&&!duplexExport.includes('source-memory')&&!duplexExport.includes('data-pin-part='),
    'Duplex export leaked a raster, external dependency, source proof, or DOM-only answer label');
  assert(!duplexExport.includes('https://')&&(duplexExport.match(/http:\/\//g)||[]).length===1,
    'Duplex export contains an external network dependency');
  assert(duplexExport.length<50000,'Duplex vector artifact became unexpectedly heavy: '+duplexExport.length);
  await page.evaluate(()=>{
    window.__duplexMetricCalls=[];
    window.nightButterflyMetrics.record=async stage=>{window.__duplexMetricCalls.push(stage);return true};
  });
  assert.deepEqual(await page.evaluate(()=>window.__duplexMetricCalls),[],
    'Optional duplex metric fired before the user requested the artifact');
  await page.click('#impression-edition');
  const duplexPaper=await page.$eval('#impression-download',async a=>await (await fetch(a.href)).text());
  assert.equal(await page.$eval('#impression-download',a=>a.download),'036js-paper-duplex-impression.svg',
    'Paper edition lost duplex export naming');
  assert(duplexPaper.includes('width="252mm" height="120mm"'),
    'Paper duplex print lost the physical print scale');
  assert(duplexPaper.includes('#e6e2d7')&&duplexPaper.includes('#386770')&&duplexPaper.includes('#665577'),
    'Paper duplex export did not recolor both faces');
  assert.equal((duplexPaper.match(/class="duplex-fold"/g)||[]).length,1,
    'Paper duplex export lost the physical fold-registration marks');
  assert(duplexPaper.includes('stroke="#84918d"'),
    'Paper duplex fold marks did not recolor with the print edition');
  assert(!duplexPaper.includes('<image')&&!duplexPaper.includes('href='),
    'Paper duplex export stopped being self-contained vector geometry');
  await page.$eval('#impression-download',e=>e.click());
  await page.waitForFunction(()=>window.__duplexMetricCalls?.length===1,{timeout:2000});
  assert.deepEqual(await page.evaluate(()=>window.__duplexMetricCalls),['misc-duplex'],
    'Third-read duplex download did not emit exactly one optional artifact-engagement event');
  await open();
  assert.equal(await page.$$eval('link[href*="verso-echo.css?v=1"]',xs=>xs.length),1,'Verso echo stylesheet missing from hub');
  assert(await page.$eval('.gallery',e=>e.classList.contains('joined')&&e.classList.contains('verso-seen')),
    'Completed hub did not retain the quiet third-read echo after viewing verso');
  const echoedSeal=await page.$eval('#completion-seal',e=>{const r=e.getBoundingClientRect();const p=getComputedStyle(e,'::before');return {w:r.width,h:r.height,content:p.content,opacity:Number(p.opacity)}});
  assert(echoedSeal.w>=80&&echoedSeal.h>=80&&echoedSeal.content!=='none'&&echoedSeal.opacity>=.5,
    'Third-read echo changed the seal geometry or failed to render: '+JSON.stringify(echoedSeal));

  await open('stats.html');
  assert.equal(await page.$$eval('script[src*="metrics.js?v=3"]',xs=>xs.length),1,'Stats metrics cache version is stale');
  assert.equal(await page.$$eval('.stats-artifact-branch #misc-duplex',xs=>xs.length),1,
    'Stats page lost the optional duplex-download branch');
  const tape=await page.goto(base+'tape.html',{waitUntil:'domcontentloaded',timeout:27000});
  assert.equal(tape.status(),200);
  await page.waitForFunction(()=>location.pathname.replace(/\/$/,'').endsWith('/secret')&&document.querySelector('.gallery'),{timeout:10000});
  assert.equal(await page.evaluate(()=>document.querySelectorAll('.tile').length),4,'Legacy tape bookmark did not return to the current four-trailhead hub');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('#redact,[data-year],[data-digit],details').length),0,
    'Retired tape controls leaked back into the current ARG');
  assert.equal(await page.evaluate(()=>document.body.textContent.includes('REVEAL THE UNLISTED TRACK')),false,
    'Retired tape prose leaked back into the current ARG');

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
  // Test this in an unsolved room: solved rooms are intentionally archival.
  await page.setViewport({width:390,height:844,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await page.evaluate(()=>{
    localStorage.removeItem('nb036-misc-v3:mirror');
    localStorage.removeItem('nb036-visual-v1:mirror');
    localStorage.removeItem('nb036-visual-v2:star-selection');
  });
  await open('orbit.html');
  assert(!(await page.$eval('#axis-hit',e=>e.disabled)),'Fresh mirror axis must remain interactive');
  if(!(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden'))))await page.tap('#axis-hit');
  await page.focus('#axis-hit');
  await page.keyboard.press('Enter');
  assert.equal(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden')),false,'Enter did not turn on mirror');
  await page.keyboard.press('Space');
  assert.equal(await page.$eval('#mirror-guides',e=>e.hasAttribute('hidden')),true,'Space did not turn off mirror');
  await page.evaluate(()=>localStorage.setItem('nb036-misc-v3:mirror','1'));

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

  const actTwoAnalytics=await page.evaluate(async()=>{
    const stages=['misc-impression','misc-contact','misc-verso'];
    const owner='nb036-analytics-v1:owner',backoff='nb036-analytics-v1:service-retry-after';
    const oldFetch=window.fetch,beforeOwner=localStorage.getItem(owner),beforeBackoff=localStorage.getItem(backoff);
    const calls=Object.fromEntries(stages.map(stage=>[stage,0]));
    const beforeCounted=Object.fromEntries(stages.map(stage=>[stage,localStorage.getItem('nb036-analytics-v1:counted:'+stage)]));
    localStorage.removeItem(owner);localStorage.removeItem(backoff);
    for(const stage of stages)localStorage.removeItem('nb036-analytics-v1:counted:'+stage);
    window.fetch=async(url,...opts)=>{
      const text=String(url);
      for(const stage of stages)if(text.includes(stage.replaceAll('-','_'))){
        calls[stage]++;return {ok:true,json:async()=>({value:1})};
      }
      return oldFetch(url,...opts);
    };
    try{
      for(const stage of stages){
        await Promise.all([nightButterflyMetrics.record(stage),nightButterflyMetrics.record(stage)]);
        await nightButterflyMetrics.record(stage);
        if(calls[stage]!==1||localStorage.getItem('nb036-analytics-v1:counted:'+stage)!=='1')
          return {ok:false,phase:'dedupe',stage,calls};
      }
      const snapshot=JSON.stringify(calls);
      localStorage.setItem(owner,'1');
      for(const stage of stages)localStorage.removeItem('nb036-analytics-v1:counted:'+stage);
      for(const stage of stages)await nightButterflyMetrics.record(stage);
      return {ok:JSON.stringify(calls)===snapshot,calls,owner:localStorage.getItem(owner)};
    }finally{
      window.fetch=oldFetch;
      if(beforeOwner===null)localStorage.removeItem(owner);else localStorage.setItem(owner,beforeOwner);
      if(beforeBackoff===null)localStorage.removeItem(backoff);else localStorage.setItem(backoff,beforeBackoff);
      for(const stage of stages){
        const old=beforeCounted[stage];
        if(old===null)localStorage.removeItem('nb036-analytics-v1:counted:'+stage);
        else localStorage.setItem('nb036-analytics-v1:counted:'+stage,old);
      }
    }
  });
  assert(actTwoAnalytics.ok,'Act-two analytics allowlist/dedupe/owner exclusion failed: '+JSON.stringify(actTwoAnalytics));

  assert.equal(errors.length,0,'Browser JS errors: '+errors.join('; '));
  console.log('PASS silent site: no visible words, real 22-week timeline, seven-star symmetry, physical ink correction, four-wing assembly, archived original, mobile+desktop, stats exclusion');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
