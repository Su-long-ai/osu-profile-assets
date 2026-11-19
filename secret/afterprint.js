(()=>{'use strict';
const P=window.NBPostReturn,E=window.NBReturnEcho,H=window.NBProfileReplay;
const s=P?.state?.()||null,r=P?.route?.()||[];
if(!s||r.length!==4||new Set(r).size!==4){location.replace('./');return}
const stage=document.querySelector('.afterprint-stage'),plate=document.querySelector('#afterprint-plate'),download=document.querySelector('#afterprint-download');
const roomPos={keys:[78,78],dates:[142,78],mirror:[78,142],margin:[142,142]};
const stationPos=Array.from({length:6},(_,i)=>{const a=(-150+i*60)*Math.PI/180;return [110+88*Math.cos(a),110+88*Math.sin(a)]});
const selected=s.hit.index;
const routePts=r.map(id=>roomPos[id]);
const routePath=routePts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
const [sx,sy]=stationPos[selected],[fx,fy]=routePts[0],[lx,ly]=routePts[routePts.length-1];
const homecoming=H?.done?.()||false;
const ux=(sx-110)/88,uy=(sy-110)/88,tx=-uy,ty=ux;
const witnessBase=[sx-ux*15,sy-uy*15],witnessAngle=Math.atan2(uy,ux)*180/Math.PI+90;
const glyph=(id,x,y,rank)=>{
  let body='';
  if(id==='folio')body='<path d="M-3 -2H3V2H-3Z M0 -2V2"/>';
  else if(id==='screen')body='<path d="M-3 -2H3V2H-3Z M-1 -2V2 M1 -2V2"/>';
  else body='<path d="M0 -3L3 2.4H-3Z M0 -3V2.4"/>';
  return '<g class="afterprint-artifact-witness" data-artifact="'+id+'" data-rank="'+rank+'" transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+witnessAngle.toFixed(1)+')">'+body+'</g>';
};
const artifactWitnesses=s.order.map((id,i)=>{
  const off=(i-1)*8;
  return glyph(id,witnessBase[0]+tx*off,witnessBase[1]+ty*off,i+1);
}).join('');
const rankRadius=[0,4.2,3.4,2.7,2.0];
const roomMarks=Object.entries(roomPos).map(([id,p])=>{
  const rank=r.indexOf(id)+1;
  return '<circle class="afterprint-room rank-'+rank+'" data-room="'+id+'" data-rank="'+rank+'" cx="'+p[0]+'" cy="'+p[1]+'" r="'+rankRadius[rank]+'"/>';
}).join('');
const markup='<rect class="afterprint-base" x="14" y="14" width="192" height="192"/>'+
  '<circle class="afterprint-orbit" cx="110" cy="110" r="88"/>'+
  stationPos.map((p,i)=>'<circle class="afterprint-station '+(i===selected?'selected':'')+'" data-station="'+i+'" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(i===selected?'2.8':'1.7')+'"/>').join('')+
  '<circle class="afterprint-station-ring" cx="'+sx.toFixed(1)+'" cy="'+sy.toFixed(1)+'" r="7"/>'+
  artifactWitnesses+
  roomMarks+
  '<path class="afterprint-entry" d="M'+sx.toFixed(1)+' '+sy.toFixed(1)+'L'+fx+' '+fy+'"/>'+
  '<path class="afterprint-route" d="'+routePath+'"/>'+
  '<path class="afterprint-entry" d="M'+lx+' '+ly+'L110 110"/>'+
  '<circle class="afterprint-core" cx="110" cy="110" r="2.6"/>'+
  (homecoming?'<path class="afterprint-homecoming-path" d="M110 110L'+sx.toFixed(1)+' '+sy.toFixed(1)+'"/>':'');
plate.innerHTML=markup;plate.dataset.returnCode=s.code;plate.dataset.postRoute=r.join('-');plate.dataset.artifactOrder=s.order.join('-');plate.dataset.homecoming=String(homecoming);
localStorage.setItem('nb036-after-v2:palimpsest','1');
document.querySelector('.afterprint-frame')?.classList.toggle('homecoming',homecoming);
H?.bindAfterprint?.();
let exportUrl='';
const styles='<style>.afterprint-base{fill:#111820;stroke:#536b79;stroke-width:.8}.afterprint-orbit{fill:none;stroke:#627986;stroke-width:.6;opacity:.28}.afterprint-station{fill:#718894;opacity:.16}.afterprint-station.selected{fill:#b8d0d2;opacity:.88}.afterprint-station-ring{fill:none;stroke:#b8d0d2;stroke-width:.9;opacity:.62}.afterprint-room{fill:#839ba5;opacity:.86}.afterprint-room.rank-1{fill:#b9d0d2}.afterprint-room.rank-4{opacity:.62}.afterprint-artifact-witness{fill:none;stroke:#b8d0d2;stroke-width:.75;stroke-linecap:round;stroke-linejoin:round;opacity:.72}.afterprint-route{fill:none;stroke:#9eb9be;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;opacity:.66}.afterprint-entry{fill:none;stroke:#a9c4c7;stroke-width:.7;stroke-dasharray:1.6 3;opacity:.46}.afterprint-core{fill:#c4d8d8;opacity:.78}.afterprint-homecoming-path{fill:none;stroke:#c2d8d8;stroke-width:1.05;stroke-linecap:round;stroke-dasharray:2 3;opacity:.7}</style>';
const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="90mm" height="90mm" data-return-code="'+s.code+'" data-post-route="'+r.join('-')+'" data-artifact-order="'+s.order.join('-')+'">'+styles+markup+'</svg>';
if(/<text|<image|https:|href=/i.test(svg))throw new Error('afterprint export purity');
exportUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
download.href=exportUrl;download.download=homecoming?'036js-homecoming.svg':'036js-afterprint.svg';download.dataset.returnCode=s.code;download.dataset.postRoute=r.join('-');download.dataset.artifactOrder=s.order.join('-');download.dataset.homecoming=String(homecoming);
stage.hidden=false;
addEventListener('pagehide',()=>{if(exportUrl)URL.revokeObjectURL(exportUrl)});
})();
