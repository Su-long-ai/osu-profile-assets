(()=>{'use strict';
const P=window.NBPostReturn,I=window.NBProfileInput;
const armKey='nb036-after-v3:profile-replay-arm';
const ownerStampKey='nb036-after-v4:profile-input';
const progressKey='nb036-after-v3:profile-replay-progress';
const doneKey='nb036-after-v3:homecoming';
const pageMap={signal:'keys',chronicle:'dates',orbit:'mirror',sealed:'margin'};
function base(){
  const s=P?.state?.()||null,r=P?.route?.()||[];
  return s&&r.length===4&&new Set(r).size===4&&localStorage.getItem('nb036-after-v2:palimpsest')==='1'?{s,r}:null;
}
function progress(){
  const b=base();if(!b)return [];
  try{
    const x=JSON.parse(localStorage.getItem(progressKey)||'[]');
    if(!Array.isArray(x)||x.length>4||x.some((v,i)=>v!==b.r[i]))throw 0;
    return x;
  }catch{localStorage.removeItem(progressKey);return []}
}
function done(){return !!base()&&localStorage.getItem(doneKey)==='1'}
function armed(){
  if(!base()||localStorage.getItem(armKey)!=='1'||done())return false;
  if(!I)return true;
  if(!I.owner()){
    if(localStorage.getItem(ownerStampKey)==='1')return false;
    I.claim('homecoming');
  }
  return I.is('homecoming');
}
function arm(){
  if(!base()||done())return false;
  I?.claim?.('homecoming');
  localStorage.setItem(ownerStampKey,'1');
  localStorage.setItem(armKey,'1');localStorage.removeItem(progressKey);return true;
}
function accept(id){
  const b=base();if(!b||!armed())return {accepted:false,progress:progress(),done:done()};
  let p=progress(),accepted=false;
  if(id===b.r[p.length]){p.push(id);accepted=true}
  else p=id===b.r[0]?[id]:[];
  if(p.length)localStorage.setItem(progressKey,JSON.stringify(p));else localStorage.removeItem(progressKey);
  if(p.length===4){
    localStorage.setItem(doneKey,'1');localStorage.removeItem(armKey);localStorage.removeItem(ownerStampKey);I?.release?.('homecoming');accepted=true;
  }
  return {accepted,progress:p.slice(),done:done()};
}
function roomId(){
  const page=location.pathname.split('/').pop()?.replace('.html','');
  return pageMap[page]||null;
}
let roomProcessed=false;
function renderRoom(){
  const id=roomId(),b=base();if(!id||!b)return;
  const fromProfile=new URLSearchParams(location.search).get('source')==='profile';
  const result=fromProfile&&!roomProcessed?(roomProcessed=true,accept(id)):{accepted:false,progress:progress(),done:done()};
  const rank=b.r.indexOf(id)+1,p=result.progress;
  const acknowledged=p.includes(id)||result.done;
  const stamp=document.querySelector('.fragment-stamp');if(!stamp)return;
  stamp.classList.toggle('profile-replay-ack',acknowledged);
  stamp.classList.toggle('profile-replay-complete',result.done&&id===b.r[3]);
  stamp.dataset.profileRank=String(rank);
  stamp.dataset.profileProgress=String(p.length);
  const hair=stamp.querySelector('.fragment-hairline');
  if(hair){
    hair.querySelectorAll('.profile-replay-mark').forEach(x=>x.remove());
    if(acknowledged){
      const i=document.createElement('i');i.className='profile-replay-mark';i.setAttribute('aria-hidden','true');
      i.style.setProperty('--profile-scale',String([0,.8,.88,.96,1.04][rank]||1));hair.append(i);
    }
  }
  if(result.done&&id===b.r[3]){
    stamp.href='./afterprint.html#homecoming';
    stamp.setAttribute('aria-label','主页四次回访已闭合，返回个人后印版');
  }
}
function bindAfterprint(){
  const relay=document.querySelector('#afterprint-relay');
  if(!relay||!base())return;
  relay.classList.toggle('homecoming-complete',done());
  if(relay.dataset.profileReplayBound==='1')return;
  relay.dataset.profileReplayBound='1';
  relay.addEventListener('click',()=>{if(!done())arm()});
}
window.NBProfileReplay={base,progress,done,armed,arm,accept,roomId,renderRoom,bindAfterprint};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{renderRoom();bindAfterprint()});
else {renderRoom();bindAfterprint()}
addEventListener('pageshow',()=>{renderRoom()});
})();
