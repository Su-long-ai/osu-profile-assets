(()=>{'use strict';
if(window.NBProofChallenge?.handleFooter?.())return;
const A=window.NBArtifactOrder,E=window.NBReturnEcho,profile='https://osu.ppy.sh/users/29089125#me';
const order=A?.order?.()||[],expected=E?.forOrder?.(order)||null;
const code=new URLSearchParams(location.search).get('sig')||'';
if(localStorage.getItem('nb036-artifact-v4:press')!=='1'||!expected||code!==expected.code){location.replace(profile);return}
localStorage.setItem('nb036-artifact-v5:return',code);
const seal=document.querySelector('#return-seal'),hit=E.forCode(code);
const cx=78,cy=46,dx=cx-hit.x,dy=cy-(hit.y+10);
seal.dataset.echoCode=code;
seal.dataset.artifactOrder=order.join('-');
seal.innerHTML='<g transform="translate(0 10)">'+E.markup(code)+'</g>'+
  '<path class="return-route" d="M'+hit.x+' '+(hit.y+10)+' Q'+(hit.x+dx*.48)+' '+(hit.y+10+dy*.22)+' '+cx+' '+cy+'"/>'+
  '<circle class="return-halo" cx="'+cx+'" cy="'+cy+'" r="20"/>'+
  '<circle class="return-core" cx="'+cx+'" cy="'+cy+'" r="11"/>'+
  '<circle class="return-core-dot" cx="'+cx+'" cy="'+cy+'" r="2.2"/>'+
  '<path class="return-core" d="M'+(cx-17)+' '+cy+'h6m22 0h6M'+cx+' '+(cy-17)+'v6m0 22v6"/>';
})();
