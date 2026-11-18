(()=>{'use strict';
const ids=['keys','dates','mirror','margin'],accepted=new Set(ids);
const routeOrder=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)&&x.length===4&&new Set(x).size===4&&x.every(v=>accepted.has(v))?x:[]}catch{return []}};
const eligible=localStorage.getItem('nb036-misc-v4:joined')==='1'&&localStorage.getItem('nb036-verso-v1:seen')==='1'&&routeOrder('nb036-route-v1:rooms').length===4&&routeOrder('nb036-route-v1:contacts').length===4;
if(!eligible){location.replace('./verso.html');return}
const edition=localStorage.getItem('nb036-impression-v2:edition')==='paper'?'paper':'night';
const asset='./036js-flexagon-'+edition+'.svg';
const print=document.querySelector('#flex-print'),download=document.querySelector('#flex-download');
download.href=asset;download.download='036js-'+edition+'-trihexaflexagon.svg';
const topCycle=[1,3,2],bottomCycle=[3,2,1];let index=0;
const main=document.querySelector('#flex-face-art'),under=document.querySelector('#flex-under-art');
const grainWeights={1:[1,2,3,4,5,6],2:[1,2,2,5,5,6],3:[1,1,3,4,6,6]};
const grainColors={1:'#9cc4c9',2:'#b7adcb',3:'#a6c7ce'};
const decorateGrain=root=>{
 root.querySelectorAll('.flex-face').forEach(face=>{
  const f=Number(face.dataset.face),polys=[...face.children].filter(x=>x.tagName.toLowerCase()==='polygon');
  polys.forEach((poly,i)=>{
   const pts=(poly.getAttribute('points')||'').trim().split(/\s+/).map(p=>p.split(',').map(Number));
   if(pts.length!==3)return;
   const cx=pts.reduce((a,p)=>a+p[0],0)/3,cy=pts.reduce((a,p)=>a+p[1],0)/3,n=grainWeights[f][i];
   const g=document.createElementNS('http://www.w3.org/2000/svg','g');
   g.setAttribute('class','magic-grain');g.dataset.weight=String(n);g.setAttribute('stroke',grainColors[f]);
   g.setAttribute('stroke-width','.85');g.setAttribute('stroke-linecap','round');g.setAttribute('fill','none');
   for(let k=0;k<n;k++){const q=document.createElementNS('http://www.w3.org/2000/svg','path'),dx=(k-(n-1)/2)*3.2;q.setAttribute('d',`M${(cx+dx).toFixed(2)} ${(cy+27).toFixed(2)}v${(3.4+(k%2)*1.2).toFixed(2)}`);g.appendChild(q)}
   face.appendChild(g);
  });
 });
};
decorateGrain(main);
under.innerHTML=main.innerHTML;
const markNet=(top,bottom)=>{
 print.querySelectorAll('[data-face]').forEach(x=>{
  const face=Number(x.dataset.face);
  x.classList.toggle('net-top',face===top);
  x.classList.toggle('net-bottom',face===bottom);
 });
};
const render=()=>{
 const top=topCycle[index],bottom=bottomCycle[index];
 main.querySelectorAll('.flex-face').forEach(x=>x.classList.toggle('active',Number(x.dataset.face)===top));
 under.querySelectorAll('.flex-face').forEach(x=>x.classList.toggle('active',Number(x.dataset.face)===bottom));
 markNet(top,bottom);
 const pin=document.querySelector('#flex-pin');
 pin.dataset.face=String(top);pin.dataset.topFace=String(top);pin.dataset.bottomFace=String(bottom);
};
fetch(asset).then(r=>{if(!r.ok)throw new Error('flexagon print');return r.text()}).then(svg=>{
 if(/<script|<image|href=/i.test(svg))throw new Error('flexagon print purity');
 print.innerHTML=svg;print.classList.add('ready');render();
}).catch(()=>location.replace('./folio.html'));
document.querySelector('#flex-pin').addEventListener('click',()=>{index=(index+1)%topCycle.length;render()});
render();document.querySelector('.flexagon-stage').hidden=false;
})();