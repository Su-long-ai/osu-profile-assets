(()=>{'use strict';
const ids=['keys','dates','mirror','margin'];
const joined=localStorage.getItem('nb036-misc-v4:joined')==='1';
const complete=ids.every(id=>localStorage.getItem('nb036-impression-v3:contact:'+id)==='1');
if(!joined||!complete){location.replace(joined?'./impression.html':'./');return}
document.querySelector('.verso-stage').hidden=false;
localStorage.setItem('nb036-verso-v1:seen','1');
const accepted=new Set(ids);
const routeOrder=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)&&x.length===4&&new Set(x).size===4&&x.every(v=>accepted.has(v))?x:[]}catch{return []}};
const register=document.querySelector('.verso-register');
const folioAvailable=routeOrder('nb036-route-v1:rooms').length===4&&routeOrder('nb036-route-v1:contacts').length===4;
if(folioAvailable){
 register.href='./folio.html';register.classList.add('folio-available');register.setAttribute('aria-label','展开三联印版');
}
void window.nightButterflyMetrics?.record('misc-verso').catch(()=>{});
})();