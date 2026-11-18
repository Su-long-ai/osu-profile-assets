(()=>{'use strict';
const A=window.NBArtifactOrder,R=window.NBRouteSignature,E=window.NBReturnEcho;
const ids=['folio','screen','flex'],profile='https://osu.ppy.sh/users/29089125#me';
const done=ids.every(id=>localStorage.getItem('nb036-artifact-v1:'+id)==='1');
const order=A?.order?.()||[];
if(!A||!done||order.length!==3){location.replace('./verso.html');return}
const stage=document.querySelector('.press-stage'),frame=document.querySelector('.press-frame'),plate=document.querySelector('#press-plate');
const relay=document.querySelector('#press-relay'),download=document.querySelector('#press-download'),returnSigil=document.querySelector('#return-sigil');
const edition=R?.edition?.()||'night',echo=E?.forOrder?.(order)||null;
const palette=edition==='paper'?{folio:'#386770',screen:'#665577',flex:'#416773'}:{folio:'#9cc4c9',screen:'#b7adcb',flex:'#a6c7ce'};
const starts={folio:{x:-42,y:28},screen:{x:36,y:-32},flex:{x:26,y:42}};
const reg={folio:[92,92],screen:[308,92],flex:[200,314]};
const vertices={folio:[154,208],screen:[246,208],flex:[200,286]};
const solved=localStorage.getItem('nb036-artifact-v4:press')==='1';
const state=Object.fromEntries(ids.map(id=>[id,{...(solved?{x:0,y:0,locked:true}:starts[id]),locked:solved}]));
const cross=(x,y,cls='press-target')=>'<g class="'+cls+'"><circle cx="'+x+'" cy="'+y+'" r="7"/><path d="M'+(x-13)+' '+y+'h5m16 0h5M'+x+' '+(y-13)+'v5m0 16v5"/></g>';
const chronology=id=>{
  const s=A.snapshot(id),rank=s.indexOf(id)+1,[x,y]=vertices[id];
  if(rank<=0)return '';
  if(rank===1)return '<g class="chronology"><circle class="chronology-core" cx="'+x+'" cy="'+y+'" r="4.4"/><path class="chronology-tail" d="M'+x+' '+(y-10)+'v-12"/></g>';
  const prev=s[rank-2],[px,py]=vertices[prev];
  const dx=x-px,dy=y-py,n=Math.hypot(dx,dy)||1,ux=dx/n,uy=dy/n;
  const ax=x-ux*12,ay=y-uy*12;
  return '<g class="chronology"><path d="M'+px+' '+py+'L'+ax+' '+ay+'"/><path d="M'+ax+' '+ay+'l'+(-uy*5-ux*8)+' '+(ux*5-uy*8)+'M'+ax+' '+ay+'l'+(uy*5-ux*8)+' '+(-ux*5-uy*8)+'"/><circle class="chronology-core" cx="'+x+'" cy="'+y+'" r="2.6"/></g>';
};
const shape=id=>{
  const c=palette[id],[rx,ry]=reg[id],regmark=cross(rx,ry,'reg')+'<circle class="reg-hit" cx="'+rx+'" cy="'+ry+'" r="18" fill="transparent" stroke="none" pointer-events="all"/>';
  if(id==='folio')return '<g class="press-layer" data-artifact="folio" role="button" tabindex="0" aria-label="对准折页印版" style="color:'+c+'"><path class="sheet" d="M78 126H322V286H78Z"/><g class="detail"><path d="M158 126v160M242 126v160"/><path d="M78 146h244M78 266h244"/></g>'+regmark+'<circle class="reg-core" cx="'+rx+'" cy="'+ry+'" r="1.4"/>'+chronology(id)+'</g>';
  if(id==='screen')return '<g class="press-layer" data-artifact="screen" role="button" tabindex="0" aria-label="对准透明网版" style="color:'+c+'"><rect class="sheet" x="112" y="104" width="176" height="208"/><g class="detail">'+Array.from({length:9},(_,i)=>'<path d="M'+(128+i*18)+' 116v184"/>').join('')+'<path d="M124 138h152M124 278h152"/></g>'+regmark+'<circle class="reg-core" cx="'+rx+'" cy="'+ry+'" r="1.4"/>'+chronology(id)+'</g>';
  return '<g class="press-layer" data-artifact="flex" role="button" tabindex="0" aria-label="对准三面折纸印版" style="color:'+c+'"><path class="sheet" d="M200 104 286 154 286 254 200 304 114 254 114 154Z"/><g class="detail"><path d="M200 104v200M114 154l172 100M286 154 114 254M114 204h172"/></g>'+regmark+'<circle class="reg-core" cx="'+rx+'" cy="'+ry+'" r="1.4"/>'+chronology(id)+'</g>';
};
plate.innerHTML='<rect class="press-base" x="24" y="24" width="352" height="352"/><g aria-hidden="true">'+ids.map(id=>{const [x,y]=reg[id];return cross(x,y)}).join('')+'<circle class="press-target-core" cx="200" cy="236" r="2"/></g>'+ids.map(shape).join('');
const layers=Object.fromEntries(ids.map(id=>[id,plate.querySelector('[data-artifact="'+id+'"]')]));
const apply=id=>{const s=state[id],el=layers[id];el.setAttribute('transform','translate('+s.x+' '+s.y+')');el.classList.toggle('registered',s.locked);el.setAttribute('tabindex',s.locked?'-1':'0');el.setAttribute('aria-disabled',String(s.locked))};
const point=e=>{const r=plate.getBoundingClientRect();return {x:(e.clientX-r.left)*400/r.width,y:(e.clientY-r.top)*400/r.height}};
let active=null,exportUrl='';
const refreshExport=()=>{
  if(exportUrl)URL.revokeObjectURL(exportUrl);
  const base='<rect x="24" y="24" width="352" height="352" fill="'+(edition==='paper'?'#e6e2d7':'#111820')+'" stroke="#536b79" stroke-width=".8"/>';
  const targets=ids.map(id=>{const [x,y]=reg[id];return cross(x,y,'registration')}).join('');
  const flattened=ids.map(id=>shape(id).replace(' class="press-layer"',' class="press-layer registered"').replace(/ role="button" tabindex="0" aria-label="[^"]+"/,'').replace(/ style="color:([^"]+)"/,' color="$1"').replace(/<circle class="reg-hit"[^>]*\/>/g,'')).join('');
  const styles='<style>.registered{opacity:.84}.sheet{fill:currentColor;fill-opacity:.025;stroke:currentColor;stroke-width:.8}.detail{fill:none;stroke:currentColor;stroke-width:.7;stroke-linecap:round;stroke-linejoin:round;opacity:.62}.reg,.registration{fill:none;stroke:currentColor;stroke-width:1.05;stroke-linecap:round}.reg-core{fill:currentColor;opacity:.6}.chronology{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.chronology-core{fill:currentColor;stroke:none}.chronology-tail{fill:none;stroke:currentColor;stroke-width:.7;opacity:.42}.registration{color:#718895;opacity:.42}</style>';
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="120mm" height="120mm">'+styles+base+targets+flattened+'</svg>';
  if(/<text|<image|https:|href=/i.test(svg))throw new Error('press export purity');
  exportUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));download.href=exportUrl;download.download='036js-'+edition+'-chronology-press.svg';download.dataset.artifactOrder=order.join('-');
};
const revealReturnEcho=()=>{
  if(!echo||!returnSigil)return;
  returnSigil.innerHTML=E.markup(echo.code);
  returnSigil.dataset.echoCode=echo.code;
  returnSigil.dataset.artifactOrder=order.join('-');
  returnSigil.removeAttribute('hidden');
};
const finish=()=>{
  if(!ids.every(id=>state[id].locked))return;
  localStorage.setItem('nb036-artifact-v4:press','1');frame.classList.add('solved');
  relay.href=profile;relay.tabIndex=0;relay.setAttribute('aria-hidden','false');
  download.tabIndex=0;download.setAttribute('aria-hidden','false');refreshExport();revealReturnEcho();
};
const settle=id=>{
  const s=state[id];
  if(Math.hypot(s.x,s.y)<=11){s.x=0;s.y=0;s.locked=true}
  layers[id].classList.remove('near');apply(id);finish();
};
plate.addEventListener('pointerdown',e=>{
  const el=e.target.closest?.('.press-layer');if(!el)return;const id=el.dataset.artifact,s=state[id];if(s.locked)return;
  e.preventDefault();const p=point(e);active={id,pointerId:e.pointerId,px:p.x,py:p.y,x:s.x,y:s.y};plate.setPointerCapture?.(e.pointerId);el.focus({preventScroll:true});
});
plate.addEventListener('pointermove',e=>{if(!active||e.pointerId!==active.pointerId)return;const p=point(e),s=state[active.id];s.x=active.x+p.x-active.px;s.y=active.y+p.y-active.py;layers[active.id].classList.toggle('near',Math.hypot(s.x,s.y)<=18);apply(active.id)});
plate.addEventListener('pointerup',e=>{if(!active||e.pointerId!==active.pointerId)return;const id=active.id;active=null;settle(id)});
plate.addEventListener('pointercancel',()=>{if(active){const id=active.id;active=null;settle(id)}});
for(const id of ids){
  layers[id].addEventListener('keydown',e=>{
    const s=state[id],step=e.shiftKey?8:2;
    const d={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];
    if(d){e.preventDefault();s.x+=d[0];s.y+=d[1];layers[id].classList.toggle('near',Math.hypot(s.x,s.y)<=18);apply(id)}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();settle(id)}
  });
}
ids.forEach(apply);
if(solved)finish();
stage.hidden=false;
addEventListener('pagehide',()=>{if(exportUrl)URL.revokeObjectURL(exportUrl)});
})();