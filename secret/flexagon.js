(()=>{'use strict';
const route=window.NBRouteSignature;
if(!route){location.replace('./folio.html');return}
const roomRoute=route.order('nb036-route-v1:rooms'),contactRoute=route.order('nb036-route-v1:contacts');
const eligible=localStorage.getItem('nb036-misc-v4:joined')==='1'&&localStorage.getItem('nb036-verso-v1:seen')==='1'&&roomRoute.length===4&&contactRoute.length===4;
if(!eligible){location.replace('./verso.html');return}
const edition=route.edition();
const asset='./036js-flexagon-'+edition+'.svg';
const print=document.querySelector('#flex-print'),download=document.querySelector('#flex-download');
download.download='036js-'+edition+'-trihexaflexagon-route.svg';
const topCycle=[1,3,2],bottomCycle=[3,2,1];let index=0,exportUrl='';
const seenFaces=new Set((()=>{try{const x=JSON.parse(localStorage.getItem('nb036-artifact-v1:flex-faces')||'[]');return Array.isArray(x)?x.filter(v=>topCycle.includes(v)):[]}catch{return []}})());
seenFaces.add(topCycle[index]);
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
const addRouteImprint=root=>{
 const net=[...root.querySelectorAll('svg')].find(x=>(x.getAttribute('viewBox')||'').startsWith('0 0 736'));
 if(!net)throw new Error('flexagon route net');
 const ns='http://www.w3.org/2000/svg',g=document.createElementNS(ns,'g');
 g.setAttribute('class','route-imprint');g.setAttribute('fill','none');g.setAttribute('stroke-linecap','round');g.setAttribute('opacity','.72');
 const xs=[158,278,398,518];
 const add=(list,kind,y,dir)=>list.forEach((id,i)=>{
   const p=document.createElementNS(ns,'path');
   const len=5.2+i*1.15;
   p.setAttribute('class','route-'+kind);p.setAttribute('data-part',id);p.setAttribute('data-order',String(i+1));
   p.setAttribute('d','M'+xs[i]+' '+y+'v'+(dir*len).toFixed(2));
   p.setAttribute('stroke',route.color(id,edition));p.setAttribute('stroke-width','.92');
   g.appendChild(p);
 });
 add(roomRoute,'room',47,1);add(contactRoute,'contact',237,-1);
 const seam=document.createElementNS(ns,'g');seam.setAttribute('class','route-imprint-seams');seam.setAttribute('stroke',edition==='paper'?'#71807d':'#657983');seam.setAttribute('stroke-width','.42');seam.setAttribute('opacity','.34');
 const a=document.createElementNS(ns,'path');a.setAttribute('d','M148 44h20M268 44h20M388 44h20M508 44h20');
 const b=document.createElementNS(ns,'path');b.setAttribute('d','M148 240h20M268 240h20M388 240h20M508 240h20');
 seam.append(a,b);g.prepend(seam);net.appendChild(g);
 return g.querySelectorAll('.route-room').length+g.querySelectorAll('.route-contact').length;
};
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
 const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
 const root=doc.documentElement;
 if(root.nodeName.toLowerCase()!=='svg'||doc.querySelector('parsererror'))throw new Error('flexagon svg parse');
 if(addRouteImprint(root)!==8)throw new Error('flexagon route imprint');
 const serialized=new XMLSerializer().serializeToString(root);
 if(/<script|<image|href=/i.test(serialized))throw new Error('flexagon route purity');
 print.innerHTML=serialized;print.dataset.roomRoute=roomRoute.join('-');print.dataset.contactRoute=contactRoute.join('-');
 print.classList.add('ready');
 exportUrl=URL.createObjectURL(new Blob([serialized],{type:'image/svg+xml'}));download.href=exportUrl;
 render();
}).catch(()=>location.replace('./verso.html'));
document.querySelector('#flex-pin').addEventListener('click',()=>{index=(index+1)%topCycle.length;seenFaces.add(topCycle[index]);localStorage.setItem('nb036-artifact-v1:flex-faces',JSON.stringify([...seenFaces]));if(seenFaces.size===topCycle.length){localStorage.setItem('nb036-artifact-v1:flex','1');window.NBArtifactOrder?.mark('flex');document.querySelector('.flexagon-stage')?.classList.add('witnessed')}render()});
if(seenFaces.size===topCycle.length){localStorage.setItem('nb036-artifact-v1:flex','1');window.NBArtifactOrder?.mark('flex');document.querySelector('.flexagon-stage')?.classList.add('witnessed')}
addEventListener('pagehide',()=>{if(exportUrl)URL.revokeObjectURL(exportUrl)});
render();document.querySelector('.flexagon-stage').hidden=false;
})();