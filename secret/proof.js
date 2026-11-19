(()=>{'use strict';
const M=window.NBPalimpsest;
const token=(location.hash||'').slice(1).toLowerCase(),decoded=M?.decode?.(token)||null;
if(!decoded){location.replace('./');return}
const stage=document.querySelector('.proof-stage'),plate=document.querySelector('#proof-plate'),download=document.querySelector('#proof-download');
const rendered=M.render(decoded.order,decoded.route,true),svg=M.svg(decoded.order,decoded.route,true);
if(!rendered||!svg||/<text|<image|https:|href=/i.test(svg)){location.replace('./');return}
plate.innerHTML=rendered.markup;plate.dataset.proofToken=token;
plate.dataset.artifactOrder=decoded.order.join('-');plate.dataset.postRoute=decoded.route.join('-');
let exportUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
download.href=exportUrl;download.download='036js-proof-'+token+'.svg';download.dataset.proofToken=token;
stage.hidden=false;
addEventListener('pagehide',()=>URL.revokeObjectURL(exportUrl));
})();
