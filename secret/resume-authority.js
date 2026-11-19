(()=>{'use strict';
const rooms=['keys','dates','mirror','margin'],artifacts=['folio','screen','flex'],A=window.NBArtifactOrder;
const seal=()=>document.querySelector('#completion-seal');
const foundAll=()=>rooms.every(id=>localStorage.getItem('nb036-misc-v3:'+id)==='1');
const joined=()=>localStorage.getItem('nb036-misc-v4:joined')==='1';
const replayingAssembly=()=>localStorage.getItem('nb036-assembly-v2:replay')==='1';
const aligned=()=>localStorage.getItem('nb036-impression-v1:aligned')==='1';
const contactsAll=()=>rooms.every(id=>localStorage.getItem('nb036-impression-v3:contact:'+id)==='1');
const versoSeen=()=>localStorage.getItem('nb036-verso-v1:seen')==='1';
const artifactsAll=()=>artifacts.every(id=>localStorage.getItem('nb036-artifact-v1:'+id)==='1');
const artifactOrder=()=>A?.order?.()||[];
const pressDone=()=>localStorage.getItem('nb036-artifact-v4:press')==='1';
const returnState=()=>window.NBPostReturn?.state?.()||null;
const postRoute=()=>window.NBPostReturn?.route?.()||[];
const afterprintDone=()=>localStorage.getItem('nb036-after-v2:palimpsest')==='1';
const homecomingDone=()=>localStorage.getItem('nb036-after-v3:homecoming')==='1';

function phase(){
  if(!foundAll())return {id:'discover',href:null,enabled:false,label:'继续探索四个源房间'};
  if(!joined()||replayingAssembly())return {id:replayingAssembly()?'assembly-replay':'assembly',href:'./finale.html',enabled:true,label:replayingAssembly()?'继续当前的重新拼合':'四片翼已找到，继续拼合'};
  if(!aligned()||!contactsAll())return {id:'impression',href:'./impression.html',enabled:true,label:'继续完成反印与四个接触'};
  if(!versoSeen())return {id:'verso',href:'./verso.html',enabled:true,label:'反印接触完成，进入实体工作台'};
  if(!artifactsAll()||artifactOrder().length!==3)return {id:'artifacts',href:'./verso.html',enabled:true,label:'继续完成三件实体物证'};
  if(!pressDone())return {id:'press',href:'./press.html',enabled:true,label:'三件实体物证完成，继续套准'};
  if(!returnState())return {id:'profile-return',href:'./press.html',enabled:true,label:'套准已完成，从回声图返回公开主页'};
  const r=postRoute();
  if(r.length<4)return {id:'second-pass',href:null,enabled:false,label:'主页回环已验证，自由重访四个源房间留下后印'};
  return {
    id:homecomingDone()?'homecoming':afterprintDone()?'profile-replay':'afterprint',
    href:'./afterprint.html',enabled:true,
    label:homecomingDone()?'打开已闭合的个人终局印版':
      afterprintDone()?'继续从个人印版回放公开主页':'四个二周目房间已记录，合成个人后印版'
  };
}
function refresh(){
  const page=location.pathname.split('/').pop()||'index.html';
  if(page!=='index.html'&&page!=='')return;
  const a=seal();if(!a)return;
  const p=phase();
  a.dataset.resumePhase=p.id;
  a.classList.toggle('resume-hold',!p.enabled&&p.id==='second-pass');
  if(p.href)a.setAttribute('href',p.href);else a.removeAttribute('href');
  a.tabIndex=p.enabled?0:-1;
  a.setAttribute('aria-disabled',String(!p.enabled));
  a.setAttribute('aria-label',p.label);
}
window.NBResumeAuthority={phase,refresh,artifactOrder};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
addEventListener('pageshow',refresh);addEventListener('storage',refresh);
})();
