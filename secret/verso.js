(()=>{'use strict';
const ids=['keys','dates','mirror','margin'];
const joined=localStorage.getItem('nb036-misc-v4:joined')==='1';
const complete=ids.every(id=>localStorage.getItem('nb036-impression-v3:contact:'+id)==='1');
if(!joined||!complete){location.replace(joined?'./impression.html':'./');return}
document.querySelector('.verso-stage').hidden=false;
localStorage.setItem('nb036-verso-v1:seen','1');
const accepted=new Set(ids);
const routeOrder=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)&&x.length===4&&new Set(x).size===4&&x.every(v=>accepted.has(v))?x:[]}catch{return []}};
const routeReady=()=>routeOrder('nb036-route-v1:rooms').length===4&&routeOrder('nb036-route-v1:contacts').length===4;
const artifacts={
  folio:document.querySelector('.artifact-folio'),
  screen:document.querySelector('.artifact-screen'),
  flex:document.querySelector('.artifact-flex')
};
const relay=document.querySelector('.verso-relay');
const keys={folio:'nb036-artifact-v1:folio',screen:'nb036-artifact-v1:screen',flex:'nb036-artifact-v1:flex'};
function refresh(){
  const ready=routeReady();
  const done=Object.fromEntries(Object.entries(keys).map(([id,key])=>[id,localStorage.getItem(key)==='1']));
  for(const [id,link] of Object.entries(artifacts)){
    if(!link)continue;
    link.classList.toggle('done',done[id]);
    link.setAttribute('aria-current',done[id]?'true':'false');
    if(ready){link.tabIndex=0;link.setAttribute('aria-disabled','false')}
    else{link.tabIndex=-1;link.setAttribute('aria-disabled','true')}
  }
  const all=ready&&Object.values(done).every(Boolean);
  const order=window.NBArtifactOrder?.order?.()||[];
  document.querySelector('.verso-junction')?.setAttribute('data-order',order.join('-'));
  relay?.querySelectorAll('.artifact-order-residue [data-artifact]').forEach(path=>{
    path.classList.remove('order-1','order-2','order-3');
    const i=order.indexOf(path.dataset.artifact);
    if(i>=0)path.classList.add('order-'+(i+1));
  });
  relay?.classList.toggle('available',all);
  if(relay){relay.tabIndex=all?0:-1;relay.setAttribute('aria-hidden',String(!all))}
}
for(const link of Object.values(artifacts)){
  link?.addEventListener('click',e=>{if(!routeReady())e.preventDefault()});
}
refresh();
addEventListener('pageshow',refresh);
addEventListener('storage',refresh);
void window.nightButterflyMetrics?.record('misc-verso').catch(()=>{});
})();
