(()=>{'use strict';
const route=window.NBRouteSignature,TARGET=10,SNAP=1.6;
if(!route){location.replace('./folio.html');return}
const roomRoute=route.order('nb036-route-v1:rooms'),contactRoute=route.order('nb036-route-v1:contacts');
const eligible=localStorage.getItem('nb036-misc-v4:joined')==='1'&&localStorage.getItem('nb036-verso-v1:seen')==='1'&&roomRoute.length===4&&contactRoute.length===4;
if(!eligible||!window.NBFragments?.parts){location.replace('./verso.html');return}
const plate=document.querySelector('#screen-plate'),base=document.querySelector('#screen-base'),film=document.querySelector('#screen-film'),download=document.querySelector('#screen-download');
const parts=window.NBFragments.parts,layout=parts.map((p,i)=>({p,x:i%2?202:81,y:i<2?99:197}));
const edition=route.edition();
const ink=id=>route.color(id,edition);
const routeTicks=(list,x0,cls)=>list.map((id,i)=>'<path class="'+cls+'" data-part="'+id+'" data-order="'+(i+1)+'" d="M'+x0+' '+(78+i*10)+'h4" stroke="'+ink(id)+'" stroke-width=".9" stroke-linecap="round"/>').join('');
const defs='<defs>'+layout.map((o,i)=>'<clipPath id="screen-wing-'+i+'" clipPathUnits="userSpaceOnUse"><path d="'+o.p.contour+'" transform="translate('+o.x+' '+o.y+') scale(.85)"/></clipPath>').join('')+'</defs>';
const bg=Array.from({length:19},(_,i)=>'<path d="M'+(10+i*20)+' 42V358"/>').join('');
const wing=Array.from({length:21},(_,i)=>'<path d="M'+(i*20)+' 42V358"/>').join('');
const wingScreens=layout.map((o,i)=>'<g clip-path="url(#screen-wing-'+i+')" class="screen-wing-grid" stroke="'+o.p.color+'">'+wing+'</g>').join('');
const routeSignature='<g class="screen-route-signature" fill="none" opacity=".72">'+routeTicks(roomRoute,0,'screen-room-route')+routeTicks(contactRoute,396,'screen-contact-route')+'</g>';
base.innerHTML=defs+'<g class="screen-grid">'+bg+'</g>'+wingScreens+'<g class="screen-butterfly-body"><path d="M200 185V232M200 193Q198 184 197 180M200 193Q202 184 203 180"/></g>'+routeSignature;
const bars=Array.from({length:22},(_,i)=>'<rect class="screen-film-bar" x="'+(-6+i*20)+'" y="42" width="12" height="316"/>').join('');
const reg=(x,y)=>'<g class="screen-film-register"><circle cx="'+x+'" cy="'+y+'" r="5.5"/><path d="M'+(x-9)+' '+y+'h3m12 0h3M'+x+' '+(y-9)+'v3m0 12v3"/><circle class="core" cx="'+x+'" cy="'+y+'" r="1.2"/></g>';
film.innerHTML='<g id="screen-film-move">'+bars+'<rect class="screen-film-edge" x="28" y="28" width="344" height="344"/>'+reg(40,52)+reg(340,348)+'</g>';
base.insertAdjacentHTML('beforeend','<g class="screen-film-register" opacity=".45">'+reg(50,52)+reg(350,348)+'</g>');
const exportReg=(x,y)=>'<g class="registration"><circle cx="'+x+'" cy="'+y+'" r="5.5"/><path d="M'+(x-9)+' '+y+'h3m12 0h3M'+x+' '+(y-9)+'v3m0 12v3"/><circle class="core" cx="'+x+'" cy="'+y+'" r="1.2"/></g>';
const exportBars=Array.from({length:22},(_,i)=>'<rect x="'+(4+i*20)+'" y="42" width="12" height="316"/>').join('');
const exportRoute='<g class="screen-route-signature" fill="none" opacity=".86">'+routeTicks(roomRoute,0,'screen-room-route')+routeTicks(contactRoute,396,'screen-contact-route')+'</g>';
const orderInk=edition==='paper'?'#65706d':'#8198a2';
const artifactResidue=()=>{
 const pos={folio:[188,18,4,4],screen:[200,18,-4,4],flex:[212,18,4,-4]};
 const marks=window.NBArtifactOrder?.marks?.()||[];
 return '<g class="artifact-order-imprint" fill="none" stroke-linecap="round">'+marks.map(m=>{const [x,y,dx,dy]=pos[m.id];return '<path data-artifact="'+m.id+'" data-order="'+m.rank+'" d="M'+x+' '+y+'l'+dx+' '+dy+'" stroke="'+orderInk+'" stroke-width="'+m.width+'" opacity="'+m.opacity+'"/>';}).join('')+'</g>';
};
const exportSvg=()=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="120mm" height="120mm"><g fill="#05070a">'+exportBars+'</g><g fill="none" stroke="#111820" stroke-width=".7"><rect x="38" y="28" width="344" height="344"/></g><g fill="none" stroke="#111820" stroke-width=".75">'+exportReg(50,52)+exportReg(350,348)+'</g>'+exportRoute+artifactResidue()+'<g fill="none" stroke="#111820" stroke-width=".55" opacity=".8"><path d="M0 16h18M16 0v18M382 0v18M382 16h18M0 384h18M16 382v18M382 382v18M382 384h18"/></g></svg>';
let exportUrl='',exportOrderKey='';
const refreshExport=()=>{
 const key=(window.NBArtifactOrder?.order?.()||[]).join('-');
 if(exportUrl&&key===exportOrderKey)return;
 if(exportUrl)URL.revokeObjectURL(exportUrl);
 exportUrl=URL.createObjectURL(new Blob([exportSvg()],{type:'image/svg+xml'}));
 exportOrderKey=key;download.href=exportUrl;download.download='036js-'+edition+'-registration-screen-route.svg';download.dataset.artifactOrder=key;
};
refreshExport();
download.dataset.roomRoute=roomRoute.join('-');download.dataset.contactRoute=contactRoute.join('-');
const moving=document.querySelector('#screen-film-move');
let phase=0,drag=null;
const clamp=x=>Math.max(0,Math.min(20,x));
const registered=()=>Math.abs(phase-TARGET)<.12;
const render=()=>{
 moving.setAttribute('transform','translate('+phase+' 0)');
 plate.setAttribute('aria-valuenow',String(Math.round(phase)));
 const on=registered();
 if(on){localStorage.setItem('nb036-artifact-v1:screen','1');window.NBArtifactOrder?.mark('screen');refreshExport()}
 plate.classList.toggle('registered',on);download.classList.toggle('ready',on);
 download.tabIndex=on?0:-1;download.setAttribute('aria-hidden',String(!on));
};
const change=x=>{phase=clamp(x);render()};
const settle=()=>{if(Math.abs(phase-TARGET)<=SNAP)change(TARGET)};
const pointerX=e=>{const r=plate.getBoundingClientRect();return (e.clientX-r.left)*400/r.width};
plate.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;e.preventDefault();plate.focus({preventScroll:true});drag={id:e.pointerId,x:pointerX(e),phase};plate.setPointerCapture(e.pointerId)});
plate.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id)change(drag.phase+pointerX(e)-drag.x)});
plate.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;settle()});
plate.addEventListener('pointercancel',()=>{drag=null});
plate.addEventListener('lostpointercapture',()=>{if(drag){drag=null;settle()}});
plate.addEventListener('keydown',e=>{const d={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[e.key];if(d!==undefined){e.preventDefault();change(phase+d)}else if(e.key==='Home'){e.preventDefault();change(0)}else if(e.key==='End'){e.preventDefault();change(20)}});
addEventListener('pagehide',()=>{if(exportUrl)URL.revokeObjectURL(exportUrl)});
render();document.querySelector('.screen-stage').hidden=false;
})();