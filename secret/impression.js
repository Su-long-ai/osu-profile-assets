(() => {
  'use strict';
  const state='nb036-impression-v1:aligned', editionKey='nb036-impression-v2:edition';
  const found=['keys','dates','mirror','margin'].every(k=>localStorage.getItem('nb036-misc-v3:'+k)==='1');
  if(!found||localStorage.getItem('nb036-misc-v4:joined')!=='1'){location.replace('./');return}
  const parts=window.NBFragments.parts;
  const plate=document.querySelector('#plate'),art=document.querySelector('#impression-art');
  const stage=document.querySelector('.impression-stage'), actions=document.querySelector('#impression-actions');
  const status=document.querySelector('#impression-status'),download=document.querySelector('#impression-download');
  const versoEntry=document.querySelector('#verso-entry');
  const fixed=document.querySelector('#print-layer'),turn=document.querySelector('#turn-layer'),pins=document.querySelector('#fixed-pins');
  const proofs=document.querySelector('#source-proofs'),hits=document.querySelector('#source-hits'),pinHits=document.querySelector('#pin-hits');
  const pt=[[100,93],[316,136],[89,275],[272,333]];
  const layout=parts.map((p,i)=>({p,x:i%2?202:81,y:i<2?99:197,i}));
  const groups=(fn)=>layout.map(o=>'<g transform="translate('+o.x+' '+o.y+') scale(.85)">'+fn(o.p,o.i)+'</g>').join('');
  const outlines=groups(p=>'<path d="'+p.contour+'" stroke="'+p.color+'" stroke-width="1.15" fill="none"/>');
  const veins=groups(p=>'<g stroke="'+p.color+'" stroke-width=".8" fill="none" stroke-linecap="round" stroke-linejoin="round">'+p.veins+'</g>');
  const grain=groups((p,i)=>'<defs><clipPath id="ink-clip-'+i+'"><path d="'+p.contour+'"/></clipPath></defs><g clip-path="url(#ink-clip-'+i+')" stroke="'+p.color+'" fill="none"><path d="'+p.contour+'" fill="'+p.color+'" fill-opacity=".055" stroke="none"/>'+Array.from({length:25},(_,n)=>'<path d="M-25 '+(n*7-65)+'L170 '+(n*7+38)+'" stroke-width=".45" opacity="'+(n%3===0?.26:.12)+'"/>').join('')+'</g>');
  const body='<path d="M200 185V231M200 193Q193 177 186 172M200 193Q207 177 214 172" stroke="#b4c8ce" stroke-width=".75" fill="none" stroke-linecap="round"/>';
  fixed.innerHTML='<g class="fixed-outline">'+outlines+'</g><g class="print-grain">'+grain+body+'</g>';
  pins.innerHTML=pt.map(([x,y],i)=>'<g data-pin-part="'+parts[i].id+'" stroke="'+parts[i].color+'" fill="none"><circle cx="'+x+'" cy="'+y+'" r="5.8" stroke-width=".9"/><path d="M'+(x-10)+' '+y+'h3m14 0h3M'+x+' '+(y-10)+'v3m0 14v3" stroke-width=".65" opacity=".6"/><circle class="transfer-core" cx="'+x+'" cy="'+y+'" r="2" fill="'+parts[i].color+'" stroke="none"/></g>').join('');
  turn.innerHTML='<g class="moving-veins">'+veins+'</g><g class="registration">'+pt.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="3.1" fill="'+parts[i].color+'"/>').join('')+'<path d="M200 49A151 151 0 0 1 250 57" stroke="#9ebdc8" stroke-opacity=".65" fill="none" stroke-width="1.4" stroke-linecap="round"/></g>';
  const sourceSpec={
    keys:{href:'./source-memory-keys.png',x:0,y:2,w:142,h:111,fit:'xMidYMid slice'},
    dates:{href:'./source-memory-dates.png',x:0,y:20,w:142,h:74,fit:'xMidYMid meet'},
    mirror:{href:'./impression-proof-mirror.png',x:29,y:9,w:84,h:96,fit:'xMidYMid meet'},
    margin:{href:'./impression-proof-margin.png',x:40,y:4,w:62,h:106,fit:'xMidYMid meet'}
  };
  const proofDefs=parts.map(p=>'<clipPath id="impression-source-'+p.id+'"><path d="'+p.contour+'"/></clipPath>').join('');
  proofs.innerHTML='<defs>'+proofDefs+'</defs>'+layout.map(o=>{
    const q=sourceSpec[o.p.id],clip='impression-source-'+o.p.id;
    return '<g data-source-group="'+o.p.id+'" transform="translate('+o.x+' '+o.y+') scale(.85)">'+
      '<image class="source-proof" data-source-part="'+o.p.id+'" href="'+q.href+'" x="'+q.x+'" y="'+q.y+'" width="'+q.w+'" height="'+q.h+'" preserveAspectRatio="'+q.fit+'" clip-path="url(#'+clip+')"/>'+
      '<path class="source-proof-edge" d="'+o.p.contour+'" fill="none" stroke="'+o.p.color+'" stroke-width=".7"/></g>';
  }).join('');
  hits.innerHTML=layout.map(o=>'<g transform="translate('+o.x+' '+o.y+') scale(.85)"><path class="source-hit" data-proof-hit="'+o.p.id+
    '" d="'+o.p.contour+'" stroke="'+o.p.color+'" role="button" tabindex="-1" aria-disabled="true" aria-label="回看'+o.p.name.replace('留下的','对应的')+'主页来源"/></g>').join('');
  const proofHits=[...hits.querySelectorAll('[data-proof-hit]')];
  const roomByPart={keys:'signal.html',dates:'chronicle.html',mirror:'orbit.html',margin:'sealed.html'};
  const validRoute=new Set(Object.keys(roomByPart));
  const routePart=validRoute.has(location.hash.slice(1))?location.hash.slice(1):null;
  pinHits.innerHTML=parts.map((p,i)=>'<a class="pin-route" data-pin-route="'+p.id+'" tabindex="-1" aria-disabled="true" aria-label="打开'+
    p.name.replace('留下的','对应的')+'归档"><circle class="pin-hit" cx="'+pt[i][0]+'" cy="'+pt[i][1]+'" r="32"/></a>').join('');
  const pinRoutes=[...pinHits.querySelectorAll('[data-pin-route]')];
  const editionControl=document.querySelector('#impression-edition');
  const rawFixed=fixed.innerHTML, rawTurn=turn.innerHTML, rawPins=pins.innerHTML;
  // The downloaded proof is the same physical object: keep the registration
  // geometry, but strip DOM-only part labels so the file carries no textual answer.
  const exportPins='<g class="export-registration-pins" opacity=".62">'+
    rawPins.replace(/<circle class="transfer-core"[^>]*(?:><\/circle>|\/>)/g,'').replace(/ data-pin-part="[^"]+"/g,'')+'</g>';
  const paperInk={'#9cc4c9':'#386770','#a6c7ce':'#416773','#b7adcb':'#665577','#bba8c9':'#75556e','#beaace':'#846674','#a8cbd1':'#386770','#b4c8ce':'#59696a','#9ebdc8':'#53727a','#b7ccd2':'#586c70','#536b79':'#84918d','#121820':'#e6e2d7'};
  const recolor=(source,paper)=>paper?source.replace(/#[0-9a-f]{6}/gi,x=>paperInk[x.toLowerCase()]||x):source;
  let angle=67,solved=false,drag=null,url='',edition='night',pinnedProof=null;
  const contactIds=()=>parts.filter(p=>localStorage.getItem('nb036-impression-v3:contact:'+p.id)==='1').map(p=>p.id);
  function renderContacts(){
    const ids=contactIds();
    for(const p of parts)plate.classList.toggle('contact-'+p.id,ids.includes(p.id));
    const contactComplete=ids.length===parts.length;
    plate.classList.toggle('contact-complete',contactComplete);
    const versoAvailable=solved&&contactComplete;
    versoEntry.classList.toggle('available',versoAvailable);
    versoEntry.tabIndex=versoAvailable?0:-1;
    versoEntry.setAttribute('aria-hidden',String(!versoAvailable));
    if(versoAvailable)versoEntry.setAttribute('href','./verso.html');
    else versoEntry.removeAttribute('href');
  }
  function showProof(id){
    if(solved&&id)plate.dataset.proof=id;
    else plate.removeAttribute('data-proof');
  }
  function enableProofs(enabled){
    proofHits.forEach(hit=>{
      hit.tabIndex=enabled?0:-1;
      hit.setAttribute('aria-disabled',String(!enabled));
    });
    if(!enabled){pinnedProof=null;showProof(null)}
  }
  function enableRoutes(enabled){
    pinRoutes.forEach(route=>{
      const id=route.dataset.pinRoute;
      route.tabIndex=enabled?0:-1;
      route.setAttribute('aria-disabled',String(!enabled));
      if(enabled)route.setAttribute('href','./'+roomByPart[id]+'#registered');
      else route.removeAttribute('href');
    });
    if(!enabled){
      plate.removeAttribute('data-route');
      plate.removeAttribute('data-route-preview');
    }
  }
  function selectEdition(next,remember=true){
    edition=solved&&next==='paper'?'paper':'night';
    const paper=edition==='paper';
    plate.classList.toggle('paper-edition',paper);
    document.querySelector('#print-ground').setAttribute('fill',paper?'#e6e2d7':'#121820');
    fixed.innerHTML=recolor(rawFixed,paper);
    turn.innerHTML=recolor(rawTurn,paper);
    pins.innerHTML=recolor(rawPins,paper);
    renderContacts();
    editionControl.setAttribute('aria-pressed',String(paper));
    download.download='036js-'+edition+'-impression.svg';
    if(remember)localStorage.setItem(editionKey,edition);
    if(solved)exportPrint();
  }
  const norm=a=>(a%360+360)%360;
  const near=a=>Math.min(norm(a),360-norm(a));
  function render(){
    turn.setAttribute('transform','rotate('+angle+' 200 200)');
    if(solved){
      plate.removeAttribute('aria-valuenow');plate.removeAttribute('aria-valuetext');
    }else{
      plate.setAttribute('aria-valuenow',String(Math.round(norm(angle))%360));
      plate.setAttribute('aria-valuetext','已旋转 '+Math.round(norm(angle))+' 度');
    }
  }
  function exportPrint(){
    if(url)URL.revokeObjectURL(url);
    const source='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="1200" height="1200"><rect width="400" height="400" fill="#121820"/><g stroke="#536b79" stroke-width=".75" fill="none"><path d="M42 60V42H60M340 42H358V60M358 340V358H340M60 358H42V340"/></g>'+grain+outlines+veins+body+exportPins+'</svg>';
    url=URL.createObjectURL(new Blob([recolor(source,edition==='paper')],{type:'image/svg+xml'}));
    download.href=url;
  }
  function complete(){
    angle=0;solved=true;drag=null;
    localStorage.setItem(state,'1');
    void window.nightButterflyMetrics?.record('misc-impression').catch(()=>{});
    plate.classList.add('solved');actions.hidden=false;
    plate.removeAttribute('aria-disabled');
    plate.setAttribute('role','group');plate.tabIndex=-1;
    plate.removeAttribute('aria-valuemin');plate.removeAttribute('aria-valuemax');
    plate.setAttribute('aria-label','套印完成，四片翼可以回看其主页来源，四个套印标记可以打开对应归档');
    enableProofs(true);enableRoutes(true);renderContacts();
    pinnedProof=routePart||pinnedProof;
    if(routePart)plate.dataset.route=routePart;
    showProof(pinnedProof);
    status.textContent='套印完成，完整反印图可以保存、回看来源、打开归档或重新转开';
    selectEdition(localStorage.getItem(editionKey),false);render();
  }
  function reset(){
    angle=67;solved=false;drag=null;localStorage.removeItem(state);
    plate.classList.remove('solved');actions.hidden=true;plate.removeAttribute('aria-disabled');
    plate.setAttribute('role','slider');plate.tabIndex=0;
    plate.setAttribute('aria-valuemin','0');plate.setAttribute('aria-valuemax','359');
    plate.setAttribute('aria-label','反印版，拖动或使用方向键旋转，令四组同色套印点重合');
    enableProofs(false);enableRoutes(false);
    pinnedProof=null;showProof(null);
    selectEdition('night',false);render();plate.focus();
  }
  function change(a){if(solved)return;angle=norm(a);if(near(angle)<=6)complete();else render()}
  function pointerAngle(e){const r=art.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI}
  plate.addEventListener('pointerdown',e=>{
    if(solved||!e.isPrimary||e.button!==0)return;
    e.preventDefault();plate.focus({preventScroll:true});
    drag={id:e.pointerId,start:pointerAngle(e),angle};
    plate.setPointerCapture(e.pointerId);
  });
  plate.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id)change(drag.angle+pointerAngle(e)-drag.start)});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])plate.addEventListener(type,()=>{drag=null});
  plate.addEventListener('keydown',e=>{
    if(solved)return;
    const delta={ArrowLeft:-5,ArrowDown:-5,ArrowRight:5,ArrowUp:5}[e.key];
    if(delta!==undefined){e.preventDefault();change(angle+delta)}
    else if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();change(angle+(e.key==='PageUp'?30:-30))}
  });
  function activateProof(id){
    if(!solved)return;
    plate.removeAttribute('data-route');
    pinnedProof=pinnedProof===id?null:id;
    showProof(pinnedProof);
    status.textContent=pinnedProof?'主页来源已显影':'主页来源显影已收起';
  }
  for(const route of pinRoutes){
    const id=route.dataset.pinRoute;
    const preview=()=>{if(solved){plate.dataset.routePreview=id;showProof(id)}};
    const restore=()=>{if(solved){plate.removeAttribute('data-route-preview');showProof(pinnedProof)}};
    route.addEventListener('mouseenter',preview);
    route.addEventListener('mouseleave',restore);
    route.addEventListener('focus',preview);
    route.addEventListener('blur',restore);
  }
  for(const hit of proofHits){
    const id=hit.dataset.proofHit;
    hit.addEventListener('mouseenter',()=>{if(solved)showProof(id)});
    hit.addEventListener('mouseleave',()=>{if(solved)showProof(pinnedProof)});
    hit.addEventListener('focus',()=>{if(solved)showProof(id)});
    hit.addEventListener('blur',()=>{if(solved)showProof(pinnedProof)});
    hit.addEventListener('click',event=>{
      if(!solved)return;
      event.preventDefault();event.stopPropagation();
      activateProof(id);
    });
    hit.addEventListener('keydown',event=>{
      if(!solved)return;
      if(event.key==='Enter'||event.key===' '){event.preventDefault();activateProof(id)}
      else if(event.key==='Escape'){event.preventDefault();pinnedProof=null;showProof(null)}
    });
  }
  document.querySelector('#reprint').addEventListener('click',reset);
  editionControl.addEventListener('click',()=>{
    if(!solved)return;
    selectEdition(edition==='night'?'paper':'night');
    status.textContent=edition==='paper'?'纸本印图，可保存':'夜色反印图，可保存';
  });
  stage.hidden=false;
  // Contact is historical state independent of the plate's current rotation.
  // Restore its classes on every fresh document; CSS decides that the combined
  // source ghost is visible only while the plate is actually registered.
  renderContacts();
  if(localStorage.getItem(state)==='1')complete();else render();
})();