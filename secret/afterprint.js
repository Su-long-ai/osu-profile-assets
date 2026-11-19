(()=>{'use strict';
const P=window.NBPostReturn,H=window.NBProfileReplay,M=window.NBPalimpsest;
const s=P?.state?.()||null,r=P?.route?.()||[];
if(!s||r.length!==4||new Set(r).size!==4||!M){location.replace('./');return}
const stage=document.querySelector('.afterprint-stage'),frame=document.querySelector('.afterprint-frame');
const plate=document.querySelector('#afterprint-plate'),download=document.querySelector('#afterprint-download'),share=document.querySelector('#afterprint-share');
const homecoming=H?.done?.()||false,rendered=M.render(s.order,r,homecoming);
if(!rendered){location.replace('./');return}
plate.innerHTML=rendered.markup;
plate.dataset.returnCode=s.code;plate.dataset.postRoute=r.join('-');plate.dataset.artifactOrder=s.order.join('-');plate.dataset.homecoming=String(homecoming);
localStorage.setItem('nb036-after-v2:palimpsest','1');
frame?.classList.toggle('homecoming',homecoming);
H?.bindAfterprint?.();
let exportUrl='';
const svg=M.svg(s.order,r,homecoming);
if(!svg||/<text|<image|https:|href=/i.test(svg))throw new Error('afterprint export purity');
exportUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
download.href=exportUrl;download.download=homecoming?'036js-homecoming.svg':'036js-afterprint.svg';
download.dataset.returnCode=s.code;download.dataset.postRoute=r.join('-');download.dataset.artifactOrder=s.order.join('-');download.dataset.homecoming=String(homecoming);
if(homecoming&&share){
  const token=M.tokenFor(s.order,r);
  if(token){
    share.href='./proof.html#'+token;share.dataset.proofToken=token;share.hidden=false;share.tabIndex=0;share.setAttribute('aria-hidden','false');
  }
}
stage.hidden=false;
addEventListener('pagehide',()=>{if(exportUrl)URL.revokeObjectURL(exportUrl)});
})();
