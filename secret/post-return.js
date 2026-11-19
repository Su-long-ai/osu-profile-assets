(()=>{'use strict';
const E=window.NBReturnEcho;
const rooms=['keys','dates','mirror','margin'],accepted=new Set(rooms);
const pageMap={signal:'keys',chronicle:'dates',orbit:'mirror',sealed:'margin'};
const routeKey='nb036-after-v1:route';
const positions={keys:[31,31],dates:[69,31],mirror:[31,69],margin:[69,69]};
function artifactOrder(){
  try{
    const x=JSON.parse(localStorage.getItem('nb036-artifact-v2:order')||'[]');
    return Array.isArray(x)&&x.length===3&&new Set(x).size===3&&x.every(v=>['folio','screen','flex'].includes(v))?x:[];
  }catch{return []}
}
function state(){
  if(!E||localStorage.getItem('nb036-artifact-v4:press')!=='1')return null;
  const order=artifactOrder(),code=localStorage.getItem('nb036-artifact-v5:return')||'';
  const hit=E.forOrder(order);
  return hit&&hit.code===code?{order,code,hit}:null;
}
function route(){
  try{
    const x=JSON.parse(localStorage.getItem(routeKey)||'[]');
    return Array.isArray(x)&&x.length<=4&&new Set(x).size===x.length&&x.every(v=>accepted.has(v))?x:[];
  }catch{return []}
}
function markRoom(id){
  const s=state();let r=route();
  if(!s||!accepted.has(id))return r;
  if(!r.includes(id)){r.push(id);localStorage.setItem(routeKey,JSON.stringify(r))}
  return r;
}
function stationAngle(index){return -150+index*60}
function renderRoom(){
  const page=location.pathname.split('/').pop()?.replace('.html',''),id=pageMap[page];
  const s=state();if(!id||!s)return;
  const r=markRoom(id),rank=r.indexOf(id);
  const stamp=document.querySelector('.fragment-stamp');if(!stamp)return;
  stamp.classList.add('post-return');stamp.dataset.postRank=String(rank+1);stamp.dataset.returnCode=s.code;
  const hair=stamp.querySelector('.fragment-hairline');if(!hair)return;
  hair.querySelectorAll('.post-return-notch').forEach(x=>x.remove());
  const n=document.createElement('i');n.className='post-return-notch';n.setAttribute('aria-hidden','true');
  n.style.setProperty('--post-x',(18+(s.hit.index*12.8))+'%');
  n.style.setProperty('--post-angle',(rank*45+s.hit.index*15)+'deg');
  hair.append(n);
}
function memoryMarkup(s,r){
  const pts=r.map(id=>positions[id]),routePath=pts.length?pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' '):'';
  const a=stationAngle(s.hit.index)*Math.PI/180,ex=50+42*Math.cos(a),ey=50+42*Math.sin(a);
  const first=pts[0];
  return (routePath?'<path class="post-route" d="'+routePath+'"/>':'')+
    (first?'<path class="post-route" d="M'+ex.toFixed(1)+' '+ey.toFixed(1)+'L'+first[0]+' '+first[1]+'"/>':'')+
    rooms.map(id=>{const p=positions[id],rank=r.indexOf(id)+1,rad=rank?[2.7,2.2,1.8,1.4][rank-1]:1.2;return '<circle class="post-node '+(rank?'visited':'')+'" data-post-room="'+id+'" data-post-rank="'+(rank||0)+'" cx="'+p[0]+'" cy="'+p[1]+'" r="'+rad+'"/>'}).join('')+
    '<circle class="post-echo" cx="'+ex.toFixed(1)+'" cy="'+ey.toFixed(1)+'" r="5"/><circle class="post-echo-core" cx="'+ex.toFixed(1)+'" cy="'+ey.toFixed(1)+'" r="1.5"/>';
}
function renderHub(){
  const page=location.pathname.split('/').pop()||'index.html';if(page!=='index.html'&&page!=='')return;
  const s=state(),seal=document.querySelector('#completion-seal');if(!s||!seal)return;
  const r=route();
  let svg=seal.querySelector('.post-return-memory');
  if(!svg){
    svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');svg.classList.add('post-return-memory');seal.append(svg);
  }
  svg.innerHTML=memoryMarkup(s,r);svg.dataset.returnCode=s.code;svg.dataset.postRoute=r.join('-');
  seal.classList.toggle('post-return-complete',r.length===4);
  if(r.length===4){
    seal.href='./afterprint.html';
    seal.setAttribute('aria-label','二周目四个源房间已留下后印，打开合成印版');
  }
}
function refresh(){renderRoom();renderHub()}
window.NBPostReturn={rooms:rooms.slice(),route,state,markRoom,positions,memoryMarkup};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
addEventListener('pageshow',refresh);addEventListener('storage',refresh);
})();
