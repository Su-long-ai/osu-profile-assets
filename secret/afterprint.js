(()=>{'use strict';
const P=window.NBPostReturn,E=window.NBReturnEcho;
const s=P?.state?.()||null,r=P?.route?.()||[];
if(!s||r.length!==4||new Set(r).size!==4){location.replace('./');return}
const stage=document.querySelector('.afterprint-stage'),plate=document.querySelector('#afterprint-plate'),download=document.querySelector('#afterprint-download');
const roomPos={keys:[78,78],dates:[142,78],mirror:[78,142],margin:[142,142]};
const stationPos=Array.from({length:6},(_,i)=>{const a=(-150+i*60)*Math.PI/180;return [110+88*Math.cos(a),110+88*Math.sin(a)]});
const selected=s.hit.index;
const routePts=r.map(id=>roomPos[id]);
const routePath=routePts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
const [sx,sy]=stationPos[selected],[fx,fy]=routePts[0],[lx,ly]=routePts[routePts.length-1];
const markup='<rect class="afterprint-base" x="14" y="14" width="192" height="192"/>'+
  '<circle class="afterprint-orbit" cx="110" cy="110" r="88"/>'+
  stationPos.map((p,i)=>'<circle class="afterprint-station '+(i===selected?'selected':'')+'" data-station="'+i+'" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(i===selected?'2.8':'1.7')+'"/>').join('')+
  '<circle class="afterprint-station-ring" cx="'+sx.toFixed(1)+'" cy="'+sy.toFixed(1)+'" r="7"/>'+
  Object.entries(roomPos).map(([id,p])=>'<circle class="afterprint-room visited" data-room="'+id+'" cx="'+p[0]+'" cy="'+p[1]+'" r="3"/>').join('')+
  '<path class="afterprint-entry" d="M'+sx.toFixed(1)+' '+sy.toFixed(1)+'L'+fx+' '+fy+'"/>'+
  '<path class="afterprint-route" d="'+routePath+'"/>'+
  '<path class="afterprint-entry" d="M'+lx+' '+ly+'L110 110"/>'+
  '<circle class="afterprint-core" cx="110" cy="110" r="2.6"/>';
plate.innerHTML=markup;plate.dataset.returnCode=s.code;plate.dataset.postRoute=r.join('-');
localStorage.setItem('nb036-after-v2:palimpsest','1');
let exportUrl='';
const styles='<style>.afterprint-base{fill:#111820;stroke:#536b79;stroke-width:.8}.afterprint-orbit{fill:none;stroke:#627986;stroke-width:.6;opacity:.28}.afterprint-station{fill:#718894;opacity:.16}.afterprint-station.selected{fill:#b8d0d2;opacity:.88}.afterprint-station-ring{fill:none;stroke:#b8d0d2;stroke-width:.9;opacity:.62}.afterprint-room{fill:#839ba5;opacity:.86}.afterprint-route{fill:none;stroke:#9eb9be;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;opacity:.66}.afterprint-entry{fill:none;stroke:#a9c4c7;stroke-width:.7;stroke-dasharray:1.6 3;opacity:.46}.afterprint-core{fill:#c4d8d8;opacity:.78}</style>';
const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="90mm" height="90mm" data-return-code="'+s.code+'" data-post-route="'+r.join('-')+'">'+styles+markup+'</svg>';
if(/<text|<image|https:|href=/i.test(svg))throw new Error('afterprint export purity');
exportUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
download.href=exportUrl;download.download='036js-afterprint.svg';download.dataset.returnCode=s.code;download.dataset.postRoute=r.join('-');
stage.hidden=false;
addEventListener('pagehide',()=>{if(exportUrl)URL.revokeObjectURL(exportUrl)});
})();
