(()=>{'use strict';
const profile='https://osu.ppy.sh/users/29089125#me',I=window.NBProfileInput;
const key='nb036-proof-v1:challenge',verifiedKey='nb036-proof-v1:verified';
const rooms=['keys','dates','mirror','margin'],roomSet=new Set(rooms);
const pageMap={signal:'keys',chronicle:'dates',orbit:'mirror',sealed:'margin'};
const valid=x=>x&&typeof x==='object'&&/^[0-9a-z]{3}$/.test(x.token||'')&&/^[0-9a-z]{2}$/.test(x.footer||'')&&
  Array.isArray(x.route)&&x.route.length===4&&new Set(x.route).size===4&&x.route.every(v=>roomSet.has(v))&&
  Number.isInteger(x.step)&&x.step>=0&&x.step<=5&&(x.inputVersion===undefined||x.inputVersion===1);
function read(){
  try{const x=JSON.parse(localStorage.getItem(key)||'null');if(!valid(x))throw 0;return x}
  catch{localStorage.removeItem(key);return null}
}
function write(x){localStorage.setItem(key,JSON.stringify(x));return x}
function arm(token){
  const M=window.NBPalimpsest,E=window.NBReturnEcho,d=M?.decode?.(token)||null;
  if(!d)return false;
  const hit=E?.forOrder?.(d.order)||null;if(!hit)return false;
  localStorage.removeItem(verifiedKey);
  I?.claim?.('proof:'+d.token);
  write({token:d.token,footer:hit.code,route:d.route.slice(),step:0,inputVersion:1});
  return true;
}
function active(){return read()}
function verified(token){return localStorage.getItem(verifiedKey)===(token||'')}
function owns(x){
  if(!x)return false;
  if(!I)return true;
  if(!I.owner()){
    if(x.inputVersion===1)return false;
    I.claim('proof:'+x.token);x.inputVersion=1;write(x);
  }
  return I.is('proof:'+x.token);
}
function acceptFooter(code){
  const x=read();if(!x||!owns(x))return {participating:false,accepted:false,step:x?.step||0,token:x?.token||''};
  x.step=code===x.footer?1:0;write(x);
  return {participating:true,accepted:x.step===1,step:x.step,token:x.token};
}
function handleFooter(){
  const x=read();if(!x||!owns(x)||new URLSearchParams(location.search).get('source')!=='profile')return false;
  acceptFooter(new URLSearchParams(location.search).get('sig')||'');
  location.replace(profile);
  return true;
}
function roomId(){
  const page=location.pathname.split('/').pop()?.replace('.html','');
  return pageMap[page]||null;
}
function handleRoom(id=roomId()){
  const x=read(),fromProfile=new URLSearchParams(location.search).get('source')==='profile';
  if(!x||!owns(x)||!fromProfile||!roomSet.has(id))return {participating:false,accepted:false,done:false,step:x?.step||0,token:x?.token||''};
  let accepted=false;
  if(x.step>=1&&x.step<=4&&id===x.route[x.step-1]){x.step++;accepted=true}
  else x.step=0;
  if(x.step===5){localStorage.setItem(verifiedKey,x.token);I?.release?.('proof:'+x.token)}
  write(x);
  return {participating:true,accepted,done:x.step===5,step:x.step,token:x.token};
}
let roomProcessed=false;
function renderRoom(){
  const id=roomId();if(!id||roomProcessed)return;
  roomProcessed=true;
  const result=handleRoom(id);if(!result.participating)return;
  const u=document.querySelector('.source-reference');if(!u)return;
  u.classList.toggle('proof-challenge-ack',result.accepted);
  u.classList.toggle('proof-challenge-complete',result.done);
  u.dataset.proofStep=String(result.step);u.dataset.proofToken=result.token;
  u.style.setProperty('--proof-progress-scale',String([.72,.78,.86,.94,1.02,1.1][result.step]||.72));
  if(result.done){
    u.href='./proof.html#'+result.token;
    u.setAttribute('aria-label','五步主页签名验证完成，返回只读印版');
  }
}
function bindProof(token){
  const a=document.querySelector('#proof-verify');if(!a)return;
  const done=verified(token);
  a.classList.toggle('verified',done);a.hidden=done;a.setAttribute('aria-hidden',String(done));a.tabIndex=done?-1:0;
  if(a.dataset.proofChallengeBound==='1')return;
  a.dataset.proofChallengeBound='1';
  a.addEventListener('click',()=>{if(!verified(token))arm(token)});
}
window.NBProofChallenge={arm,active,verified,acceptFooter,handleFooter,handleRoom,roomId,renderRoom,bindProof};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderRoom);else renderRoom();
})();
