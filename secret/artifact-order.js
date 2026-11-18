(()=>{'use strict';
const ids=['folio','screen','flex'];
const key='nb036-artifact-v2:order',legacyKey='nb036-artifact-v2:legacy';
const snapshotKey=id=>'nb036-artifact-v3:snapshot:'+id;
const witness=id=>localStorage.getItem('nb036-artifact-v1:'+id)==='1';
const valid=x=>Array.isArray(x)&&x.length<=ids.length&&new Set(x).size===x.length&&x.every(id=>ids.includes(id));
const read=()=>{
  if(localStorage.getItem(legacyKey)==='1')return [];
  const raw=localStorage.getItem(key);
  if(raw===null)return [];
  try{
    const x=JSON.parse(raw);
    if(!valid(x))throw 0;
    return x;
  }catch{
    localStorage.removeItem(key);
    localStorage.setItem(legacyKey,'1');
    return [];
  }
};
const snapshot=id=>{
  if(!ids.includes(id)||localStorage.getItem(legacyKey)==='1')return [];
  const raw=localStorage.getItem(snapshotKey(id));
  if(raw!==null){
    try{
      const x=JSON.parse(raw);
      if(valid(x)&&x.length&&x[x.length-1]===id)return x;
    }catch{}
    localStorage.removeItem(snapshotKey(id));
  }
  const order=read(),i=order.indexOf(id);
  return i<0?order.slice():order.slice(0,i+1);
};
const freeze=id=>{
  const prefix=snapshot(id);
  if(prefix.length&&localStorage.getItem(snapshotKey(id))===null)localStorage.setItem(snapshotKey(id),JSON.stringify(prefix));
  return prefix;
};
const mark=id=>{
  if(!ids.includes(id)||localStorage.getItem(legacyKey)==='1')return read();
  const raw=localStorage.getItem(key),order=read();
  if(localStorage.getItem(legacyKey)==='1')return [];
  if(raw===null&&ids.some(other=>other!==id&&witness(other))){
    localStorage.setItem(legacyKey,'1');
    return [];
  }
  if(!order.includes(id)){
    order.push(id);
    localStorage.setItem(key,JSON.stringify(order));
  }
  freeze(id);
  return order.slice();
};
const weights=[{opacity:.96,width:1.7},{opacity:.66,width:1.15},{opacity:.38,width:.8}];
const toMarks=order=>order.map((id,i)=>({id,rank:i+1,opacity:weights[i].opacity,width:weights[i].width}));
const marks=()=>toMarks(read());
const marksFor=id=>toMarks(snapshot(id));
window.NBArtifactOrder={ids:ids.slice(),order:()=>read().slice(),snapshot,marks,marksFor,mark};
})();
