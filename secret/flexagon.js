(()=>{'use strict';
const ids=['keys','dates','mirror','margin'],accepted=new Set(ids);
const routeOrder=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)&&x.length===4&&new Set(x).size===4&&x.every(v=>accepted.has(v))?x:[]}catch{return []}};
const eligible=localStorage.getItem('nb036-misc-v4:joined')==='1'&&localStorage.getItem('nb036-verso-v1:seen')==='1'&&routeOrder('nb036-route-v1:rooms').length===4&&routeOrder('nb036-route-v1:contacts').length===4;
if(!eligible){location.replace('./verso.html');return}
const edition=localStorage.getItem('nb036-impression-v2:edition')==='paper'?'paper':'night';
const asset='./036js-flexagon-'+edition+'.svg';
const image=document.querySelector('#flex-print'),download=document.querySelector('#flex-download');
image.src=asset;download.href=asset;download.download='036js-'+edition+'-trihexaflexagon.svg';
const cycle=[1,3,2];let index=0;
const render=()=>{
 document.querySelectorAll('.flex-face').forEach(x=>x.classList.toggle('active',Number(x.dataset.face)===cycle[index]));
 document.querySelector('#flex-pin').dataset.face=String(cycle[index]);
};
document.querySelector('#flex-pin').addEventListener('click',()=>{index=(index+1)%cycle.length;render()});
render();document.querySelector('.flexagon-stage').hidden=false;
})();