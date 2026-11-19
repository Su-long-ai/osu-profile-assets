(()=>{'use strict';
const E=window.NBReturnEcho;
const artifactIds=['folio','screen','flex'];
const rooms=['keys','dates','mirror','margin'];
const roomPos={keys:[78,78],dates:[142,78],mirror:[78,142],margin:[142,142]};
const stationPos=Array.from({length:6},(_,i)=>{const a=(-150+i*60)*Math.PI/180;return [110+88*Math.cos(a),110+88*Math.sin(a)]});
const permute=a=>a.length<=1?[a.slice()]:a.flatMap((x,i)=>permute(a.slice(0,i).concat(a.slice(i+1))).map(rest=>[x,...rest]));
const routes=permute(rooms);
const key=x=>x.join('-');
const validOrder=x=>Array.isArray(x)&&x.length===3&&new Set(x).size===3&&x.every(v=>artifactIds.includes(v));
const validRoute=x=>Array.isArray(x)&&x.length===4&&new Set(x).size===4&&x.every(v=>rooms.includes(v));
const glyph=(id,x,y,rank,angle)=>{
  let body='';
  if(id==='folio')body='<path d="M-3 -2H3V2H-3Z M0 -2V2"/>';
  else if(id==='screen')body='<path d="M-3 -2H3V2H-3Z M-1 -2V2 M1 -2V2"/>';
  else body='<path d="M0 -3L3 2.4H-3Z M0 -3V2.4"/>';
  return '<g class="afterprint-artifact-witness" data-artifact="'+id+'" data-rank="'+rank+'" transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+angle.toFixed(1)+')">'+body+'</g>';
};
const rankRadius=[0,4.2,3.4,2.7,2.0];
const tokenCenters=[66,110,154],tokenSlots=[-10,-6,-2,2,6,10],tokenY=196;
function tokenRegisters(token){
  if(typeof token!=='string'||!/^[0-9a-z]{3}$/i.test(token))return '';
  return [...token.toLowerCase()].map((ch,i)=>{
    const v=parseInt(ch,36);if(!Number.isFinite(v)||v<0||v>35)return '';
    const q=Math.floor(v/6),m=v%6,cx=tokenCenters[i],qx=cx+tokenSlots[q],mx=cx+tokenSlots[m];
    return '<g class="proof-token-register" data-register="'+i+'">'+
      '<path class="proof-token-rail" d="M'+(cx-12)+' '+tokenY+'H'+(cx+12)+'"/>'+
      tokenSlots.map((o,j)=>'<circle class="proof-token-slot" data-slot="'+j+'" cx="'+(cx+o)+'" cy="'+tokenY+'" r=".55"/>').join('')+
      '<path class="proof-token-q" data-slot="'+q+'" d="M'+qx+' '+(tokenY-4)+'V'+(tokenY-1)+'"/>'+
      '<path class="proof-token-r" data-slot="'+m+'" d="M'+mx+' '+(tokenY+1)+'V'+(tokenY+4)+'"/>'+
    '</g>';
  }).join('');
}
const styles='<style>.afterprint-base{fill:#111820;stroke:#536b79;stroke-width:.8}.afterprint-orbit{fill:none;stroke:#627986;stroke-width:.6;opacity:.28}.afterprint-station{fill:#718894;opacity:.16}.afterprint-station.selected{fill:#b8d0d2;opacity:.88}.afterprint-station-ring{fill:none;stroke:#b8d0d2;stroke-width:.9;opacity:.62}.afterprint-room{fill:#839ba5;opacity:.86}.afterprint-room.rank-1{fill:#b9d0d2}.afterprint-room.rank-4{opacity:.62}.afterprint-artifact-witness{fill:none;stroke:#b8d0d2;stroke-width:.75;stroke-linecap:round;stroke-linejoin:round;opacity:.72}.afterprint-route{fill:none;stroke:#9eb9be;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round;opacity:.66}.afterprint-entry{fill:none;stroke:#a9c4c7;stroke-width:.7;stroke-dasharray:1.6 3;opacity:.46}.afterprint-core{fill:#c4d8d8;opacity:.78}.afterprint-homecoming-path{fill:none;stroke:#c2d8d8;stroke-width:1.05;stroke-linecap:round;stroke-dasharray:2 3;opacity:.7}.proof-token-register{color:#8fa8af}.proof-token-rail{fill:none;stroke:currentColor;stroke-width:.35;opacity:.28}.proof-token-slot{fill:currentColor;opacity:.22}.proof-token-q,.proof-token-r{fill:none;stroke:#bfd3d4;stroke-width:.8;stroke-linecap:round;opacity:.72}</style>';
function render(order,route,homecoming=false){
  if(!E||!validOrder(order)||!validRoute(route))return null;
  const hit=E.forOrder(order);if(!hit)return null;
  const selected=hit.index,routePts=route.map(id=>roomPos[id]);
  const routePath=routePts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
  const [sx,sy]=stationPos[selected],[fx,fy]=routePts[0],[lx,ly]=routePts[routePts.length-1];
  const ux=(sx-110)/88,uy=(sy-110)/88,tx=-uy,ty=ux;
  const witnessBase=[sx-ux*15,sy-uy*15],witnessAngle=Math.atan2(uy,ux)*180/Math.PI+90;
  const artifactWitnesses=order.map((id,i)=>{
    const off=(i-1)*8;
    return glyph(id,witnessBase[0]+tx*off,witnessBase[1]+ty*off,i+1,witnessAngle);
  }).join('');
  const roomMarks=Object.entries(roomPos).map(([id,p])=>{
    const rank=route.indexOf(id)+1;
    return '<circle class="afterprint-room rank-'+rank+'" data-room="'+id+'" data-rank="'+rank+'" cx="'+p[0]+'" cy="'+p[1]+'" r="'+rankRadius[rank]+'"/>';
  }).join('');
  const markup='<rect class="afterprint-base" x="14" y="14" width="192" height="192"/>'+
    '<circle class="afterprint-orbit" cx="110" cy="110" r="88"/>'+
    stationPos.map((p,i)=>'<circle class="afterprint-station '+(i===selected?'selected':'')+'" data-station="'+i+'" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(i===selected?'2.8':'1.7')+'"/>').join('')+
    '<circle class="afterprint-station-ring" cx="'+sx.toFixed(1)+'" cy="'+sy.toFixed(1)+'" r="7"/>'+
    artifactWitnesses+roomMarks+
    '<path class="afterprint-entry" d="M'+sx.toFixed(1)+' '+sy.toFixed(1)+'L'+fx+' '+fy+'"/>'+
    '<path class="afterprint-route" d="'+routePath+'"/>'+
    '<path class="afterprint-entry" d="M'+lx+' '+ly+'L110 110"/>'+
    '<circle class="afterprint-core" cx="110" cy="110" r="2.6"/>'+
    (homecoming?'<path class="afterprint-homecoming-path" d="M110 110L'+sx.toFixed(1)+' '+sy.toFixed(1)+'"/>':'')+
    (homecoming?tokenRegisters(tokenFor(order,route)):'');
  return {markup,selected,sx,sy,order:order.slice(),route:route.slice(),homecoming:!!homecoming,token:tokenFor(order,route)};
}
function tokenFor(order,route){
  if(!validOrder(order)||!validRoute(route)||!E)return null;
  const hit=E.forOrder(order);if(!hit)return null;
  const ri=routes.findIndex(x=>key(x)===key(route));if(ri<0)return null;
  const index=hit.index*24+ri;
  const mixed=(index*37+53)%144;
  const body=mixed.toString(36).padStart(2,'0');
  const check=((mixed*17+11)%36).toString(36);
  return body+check;
}
function decode(token){
  if(typeof token!=='string'||!/^[0-9a-z]{3}$/i.test(token))return null;
  const t=token.toLowerCase(),mixed=parseInt(t.slice(0,2),36);
  if(!Number.isFinite(mixed)||mixed>=144||((mixed*17+11)%36).toString(36)!==t[2])return null;
  const index=((mixed-53)*109%144+144)%144;
  const si=Math.floor(index/24),ri=index%24,row=E?.rows?.[si];
  if(!row||!routes[ri])return null;
  const order=row.key.split('-'),route=routes[ri].slice();
  return {token:t,index,stationIndex:si,order,route};
}
function svg(order,route,homecoming=true){
  const x=render(order,route,homecoming);if(!x)return null;
  const token=tokenFor(order,route)||'';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="90mm" height="90mm" data-proof-token="'+token+'">'+styles+x.markup+'</svg>';
}
window.NBPalimpsest=Object.freeze({
  rooms:Object.freeze(rooms.slice()),routes:Object.freeze(routes.map(x=>Object.freeze(x.slice()))),
  roomPos:Object.freeze({...roomPos}),stationPos:Object.freeze(stationPos.map(x=>Object.freeze(x.slice()))),
  render,svg,tokenFor,decode,tokenRegisters
});
})();
