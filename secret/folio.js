(()=>{'use strict';
const ids=['keys','dates','mirror','margin'],accepted=new Set(ids);
const routeOrder=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)&&x.length===4&&new Set(x).size===4&&x.every(v=>accepted.has(v))?x:[]}catch{return []}};
const eligible=localStorage.getItem('nb036-misc-v4:joined')==='1'&&localStorage.getItem('nb036-verso-v1:seen')==='1'&&routeOrder('nb036-route-v1:rooms').length===4&&routeOrder('nb036-route-v1:contacts').length===4;
if(!eligible||!window.NBFragments?.parts||!window.NBDuplexBack?.svg){location.replace('./verso.html');return}
const parts=window.NBFragments.parts,pt=[[100,93],[316,136],[89,275],[272,333]];
const layout=parts.map((p,i)=>({p,x:i%2?202:81,y:i<2?99:197}));
const groups=fn=>layout.map(o=>'<g transform="translate('+o.x+' '+o.y+') scale(.85)">'+fn(o.p)+'</g>').join('');
const outlines=groups(p=>'<path d="'+p.contour+'" stroke="'+p.color+'" stroke-width="1.15" fill="none"/>');
const veins=groups(p=>'<g stroke="'+p.color+'" stroke-width=".8" fill="none" stroke-linecap="round" stroke-linejoin="round">'+p.veins+'</g>');
const grain=groups(p=>'<g stroke="'+p.color+'" fill="none"><path d="'+p.contour+'" fill="'+p.color+'" fill-opacity=".055" stroke="none"/></g>');
const body='<path d="M200 185V231M200 193Q193 177 186 172M200 193Q207 177 214 172" stroke="#b4c8ce" stroke-width=".75" fill="none" stroke-linecap="round"/>';
const pins='<g class="export-registration-pins" opacity=".62">'+pt.map(([x,y],i)=>'<g stroke="'+parts[i].color+'" fill="none"><circle cx="'+x+'" cy="'+y+'" r="5.8" stroke-width=".9"/><path d="M'+(x-10)+' '+y+'h3m14 0h3M'+x+' '+(y-10)+'v3m0 14v3" stroke-width=".65" opacity=".6"/></g>').join('')+'</g>';
const front='<rect width="400" height="400" fill="#121820"/><g stroke="#536b79" stroke-width=".75" fill="none"><path d="M42 60V42H60M340 42H358V60M358 340V358H340M60 358H42V340"/></g>'+grain+outlines+veins+body+pins;
const paperInk={'#9cc4c9':'#386770','#a6c7ce':'#416773','#b7adcb':'#665577','#bba8c9':'#75556e','#beaace':'#846674','#a8cbd1':'#386770','#b4c8ce':'#59696a','#9ebdc8':'#53727a','#b7ccd2':'#586c70','#536b79':'#84918d','#121820':'#e6e2d7','#0d131a':'#ded9cc'};
const recolor=source=>localStorage.getItem('nb036-impression-v2:edition')==='paper'?source.replace(/#[0-9a-f]{6}/gi,x=>paperInk[x.toLowerCase()]||x):source;
document.querySelector('#folio-left').innerHTML=recolor(window.NBDuplexBack.svg);
document.querySelector('#folio-center').innerHTML=recolor(front);
document.querySelector('#folio-right').innerHTML=recolor(window.NBDuplexBack.svg);
const folio=document.querySelector('#folio'),hinge=document.querySelector('#folio-hinge'),download=document.querySelector('#folio-download'),flex=document.querySelector('#folio-flex');
const edition=localStorage.getItem('nb036-impression-v2:edition')==='paper'?'paper':'night';
const color=Object.fromEntries(parts.map(p=>[p.id,p.color]));
const routeTicks=(list,x0,y0)=>{
  return list.map((id,i)=>{
    const ink=edition==='paper'?(paperInk[color[id]]||color[id]):color[id];
    return '<path d="M'+x0+' '+(y0+i*10)+'h4" stroke="'+ink+'" stroke-width=".9" stroke-linecap="round"/>';
  }).join('');
};
const roomRoute=routeOrder('nb036-route-v1:rooms'),contactRoute=routeOrder('nb036-route-v1:contacts');
const routeSignature='<g class="gatefold-route-signature" fill="none" opacity=".72">'+
  routeTicks(roomRoute,204,78)+routeTicks(contactRoute,608,78)+'</g>';
const appendPreviewSignature=()=>{
  const ns='http://www.w3.org/2000/svg';
  const add=(root,list,x0,cls)=>{
    const g=document.createElementNS(ns,'g');g.setAttribute('class','folio-route-signature '+cls);g.setAttribute('fill','none');g.setAttribute('opacity','.72');
    list.forEach((id,i)=>{
      const path=document.createElementNS(ns,'path');path.setAttribute('d','M'+x0+' '+(78+i*10)+'h4');
      path.setAttribute('stroke',edition==='paper'?(paperInk[color[id]]||color[id]):color[id]);
      path.setAttribute('stroke-width','.9');path.setAttribute('stroke-linecap','round');g.append(path);
    });
    root.append(g);
  };
  add(document.querySelector('#folio-left'),roomRoute,396,'room-route');
  add(document.querySelector('#folio-right'),contactRoute,0,'contact-route');
};
appendPreviewSignature();
let exportUrl='';
const gatefoldSvg=()=>{
  const frontFace=recolor(front),backFace=recolor(window.NBDuplexBack.svg);
  const foldMarks='<g class="gatefold-folds" fill="none" stroke="'+(edition==='paper'?'#84918d':'#536b79')+'" stroke-width=".7" stroke-linecap="round" opacity=".62">'+
    '<path d="M208 4v14M204 11h8M608 4v14M604 11h8"/><path d="M208 382v14M204 389h8M608 382v14M604 389h8"/></g>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="240mm" height="120mm">'+
    '<defs><clipPath id="gate-selected"><rect x="0" y="0" width="208" height="400"/></clipPath><clipPath id="gate-shared"><rect x="608" y="0" width="192" height="400"/></clipPath></defs>'+
    '<g class="gatefold-selected" clip-path="url(#gate-selected)"><g transform="translate(-192 0)">'+backFace+'</g></g>'+
    '<g class="gatefold-front" transform="translate(208 0)">'+frontFace+'</g>'+
    '<g class="gatefold-shared" clip-path="url(#gate-shared)"><g transform="translate(608 0)">'+backFace+'</g></g>'+foldMarks+routeSignature+'</svg>';
};
const refreshDownload=()=>{
  if(exportUrl)URL.revokeObjectURL(exportUrl);
  exportUrl=URL.createObjectURL(new Blob([gatefoldSvg()],{type:'image/svg+xml'}));
  download.href=exportUrl;download.download='036js-'+edition+'-gatefold.svg';
};
refreshDownload();
hinge.addEventListener('click',()=>{
  const on=folio.classList.toggle('folded');
  hinge.setAttribute('aria-pressed',String(on));
  download.tabIndex=on?0:-1;
  download.setAttribute('aria-hidden',String(!on));
  flex.tabIndex=on?0:-1;
  flex.setAttribute('aria-hidden',String(!on));
});
addEventListener('pagehide',()=>{if(exportUrl)URL.revokeObjectURL(exportUrl)});
document.querySelector('.folio-stage').hidden=false;
})();