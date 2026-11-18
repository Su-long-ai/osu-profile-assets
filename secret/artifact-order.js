(()=>{'use strict';
const ids=['folio','screen','flex'];
const key='nb036-artifact-v2:order',legacyKey='nb036-artifact-v2:legacy';
const witness=id=>localStorage.getItem('nb036-artifact-v1:'+id)==='1';
const read=()=>{
  if(localStorage.getItem(legacyKey)==='1')return [];
  const raw=localStorage.getItem(key);
  if(raw===null)return [];
  try{
    const x=JSON.parse(raw);
    if(!Array.isArray(x)||x.length>ids.length||new Set(x).size!==x.length||!x.every(id=>ids.includes(id)))throw 0;
    return x;
  }catch{
    localStorage.removeItem(key);
    localStorage.setItem(legacyKey,'1');
    return [];
  }
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
  return order.slice();
};
const weights=[{opacity:.96,width:1.7},{opacity:.66,width:1.15},{opacity:.38,width:.8}];
const marks=()=>read().map((id,i)=>({id,rank:i+1,opacity:weights[i].opacity,width:weights[i].width}));
window.NBArtifactOrder={ids:ids.slice(),order:()=>read().slice(),marks,mark};
})();
