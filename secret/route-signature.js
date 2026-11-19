(()=>{'use strict';
const ids=['keys','dates','mirror','margin'],accepted=new Set(ids);
const night={keys:'#9cc4c9',dates:'#b7adcb',mirror:'#a6c7ce',margin:'#bba8c9'};
const paper={keys:'#386770',dates:'#665577',mirror:'#416773',margin:'#75556e'};
const paperInk={
 '#9cc4c9':'#386770','#a6c7ce':'#416773','#b7adcb':'#665577','#bba8c9':'#75556e',
 '#beaace':'#846674','#a8cbd1':'#386770','#b4c8ce':'#59696a','#9ebdc8':'#53727a',
 '#b7ccd2':'#586c70','#536b79':'#84918d','#121820':'#e6e2d7','#0d131a':'#ded9cc'
};
const partial=key=>{try{
  const x=JSON.parse(localStorage.getItem(key)||'[]');
  return Array.isArray(x)&&x.length<=4&&new Set(x).size===x.length&&x.every(v=>accepted.has(v))?x:[];
}catch{return []}};
const order=key=>{const x=partial(key);return x.length===4?x:[]};
const append=(key,id)=>{
  if(!accepted.has(id))return partial(key);
  const x=partial(key);
  if(!x.includes(id)){
    x.push(id);
    localStorage.setItem(key,JSON.stringify(x.slice(0,4)));
  }
  return x.slice();
};
const routes=()=>({rooms:order('nb036-route-v1:rooms'),contacts:order('nb036-route-v1:contacts')});
const ready=()=>{const r=routes();return r.rooms.length===4&&r.contacts.length===4};
const edition=()=>localStorage.getItem('nb036-impression-v2:edition')==='paper'?'paper':'night';
const color=(id,ed=edition())=>(ed==='paper'?paper:night)[id]||night[id]||'#8198a2';
const recolor=(source,ed=edition())=>ed==='paper'?source.replace(/#[0-9a-f]{6}/gi,x=>paperInk[x.toLowerCase()]||x):source;
window.NBRouteSignature={ids,night,paper,paperInk,partial,order,append,routes,ready,edition,color,recolor};
})();