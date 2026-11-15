(() => {
  'use strict';
  const state='nb036-impression-v1:aligned', editionKey='nb036-impression-v2:edition';
  const found=['keys','dates','mirror','margin'].every(k=>localStorage.getItem('nb036-misc-v3:'+k)==='1');
  if(!found||localStorage.getItem('nb036-misc-v4:joined')!=='1'){location.replace('./');return}
  const parts=window.NBFragments.parts;
  const plate=document.querySelector('#plate'),art=document.querySelector('#impression-art');
  const stage=document.querySelector('.impression-stage'), actions=document.querySelector('#impression-actions');
  const status=document.querySelector('#impression-status'),download=document.querySelector('#impression-download');
  const fixed=document.querySelector('#print-layer'),turn=document.querySelector('#turn-layer'),pins=document.querySelector('#fixed-pins');
  const pt=[[100,93],[316,136],[89,275],[272,333]];
  const layout=parts.map((p,i)=>({p,x:i%2?202:81,y:i<2?99:197,i}));
  const groups=(fn)=>layout.map(o=>'<g transform="translate('+o.x+' '+o.y+') scale(.85)">'+fn(o.p,o.i)+'</g>').join('');
  const outlines=groups(p=>'<path d="'+p.contour+'" stroke="'+p.color+'" stroke-width="1.15" fill="none"/>');
  const veins=groups(p=>'<g stroke="'+p.color+'" stroke-width=".8" fill="none" stroke-linecap="round" stroke-linejoin="round">'+p.veins+'</g>');
  const grain=groups((p,i)=>'<defs><clipPath id="ink-clip-'+i+'"><path d="'+p.contour+'"/></clipPath></defs><g clip-path="url(#ink-clip-'+i+')" stroke="'+p.color+'" fill="none"><path d="'+p.contour+'" fill="'+p.color+'" fill-opacity=".055" stroke="none"/>'+Array.from({length:25},(_,n)=>'<path d="M-25 '+(n*7-65)+'L170 '+(n*7+38)+'" stroke-width=".45" opacity="'+(n%3===0?.26:.12)+'"/>').join('')+'</g>');
  const body='<path d="M200 185V231M200 193Q193 177 186 172M200 193Q207 177 214 172" stroke="#b4c8ce" stroke-width=".75" fill="none" stroke-linecap="round"/>';
  fixed.innerHTML='<g class="fixed-outline">'+outlines+'</g><g class="print-grain">'+grain+body+'</g>';
  pins.innerHTML=pt.map(([x,y],i)=>'<g stroke="'+parts[i].color+'" fill="none"><circle cx="'+x+'" cy="'+y+'" r="5.8" stroke-width=".9"/><path d="M'+(x-10)+' '+y+'h3m14 0h3M'+x+' '+(y-10)+'v3m0 14v3" stroke-width=".65" opacity=".6"/></g>').join('');
  turn.innerHTML='<g class="moving-veins">'+veins+'</g><g class="registration">'+pt.map(([x,y],i)=>'<circle cx="'+x+'" cy="'+y+'" r="3.1" fill="'+parts[i].color+'"/>').join('')+'<path d="M200 49A151 151 0 0 1 250 57" stroke="#9ebdc8" stroke-opacity=".65" fill="none" stroke-width="1.4" stroke-linecap="round"/></g>';
  const editionControl=document.querySelector('#impression-edition');
  const rawFixed=fixed.innerHTML, rawTurn=turn.innerHTML, rawPins=pins.innerHTML;
  const paperInk={'#9cc4c9':'#386770','#a6c7ce':'#416773','#b7adcb':'#665577','#bba8c9':'#75556e','#beaace':'#846674','#a8cbd1':'#386770','#b4c8ce':'#59696a','#9ebdc8':'#53727a','#b7ccd2':'#586c70','#536b79':'#84918d','#121820':'#e6e2d7'};
  const recolor=(source,paper)=>paper?source.replace(/#[0-9a-f]{6}/gi,x=>paperInk[x.toLowerCase()]||x):source;
  let angle=67,solved=false,drag=null,url='',edition='night';
  function selectEdition(next,remember=true){
    edition=solved&&next==='paper'?'paper':'night';
    const paper=edition==='paper';
    plate.classList.toggle('paper-edition',paper);
    document.querySelector('#print-ground').setAttribute('fill',paper?'#e6e2d7':'#121820');
    fixed.innerHTML=recolor(rawFixed,paper);
    turn.innerHTML=recolor(rawTurn,paper);
    pins.innerHTML=recolor(rawPins,paper);
    editionControl.setAttribute('aria-pressed',String(paper));
    download.download='036js-'+edition+'-impression.svg';
    if(remember)localStorage.setItem(editionKey,edition);
    if(solved)exportPrint();
  }
  const norm=a=>(a%360+360)%360;
  const near=a=>Math.min(norm(a),360-norm(a));
  function render(){
    turn.setAttribute('transform','rotate('+angle+' 200 200)');
    plate.setAttribute('aria-valuenow',String(Math.round(norm(angle))%360));
    plate.setAttribute('aria-valuetext',solved?'套印完成':('已旋转 '+Math.round(norm(angle))+' 度'));
  }
  function exportPrint(){
    if(url)URL.revokeObjectURL(url);
    const source='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="1200" height="1200"><rect width="400" height="400" fill="#121820"/><g stroke="#536b79" stroke-width=".75" fill="none"><path d="M42 60V42H60M340 42H358V60M358 340V358H340M60 358H42V340"/></g>'+grain+outlines+veins+body+'</svg>';
    url=URL.createObjectURL(new Blob([recolor(source,edition==='paper')],{type:'image/svg+xml'}));
    download.href=url;
  }
  function complete(){
    angle=0;solved=true;drag=null;
    localStorage.setItem(state,'1');
    plate.classList.add('solved');actions.hidden=false;
    plate.setAttribute('aria-disabled','true');status.textContent='套印完成，完整反印图可以保存或重新转开';
    selectEdition(localStorage.getItem(editionKey),false);render();
  }
  function reset(){
    angle=67;solved=false;drag=null;localStorage.removeItem(state);
    plate.classList.remove('solved');actions.hidden=true;plate.removeAttribute('aria-disabled');
    selectEdition('night',false);render();plate.focus();
  }
  function change(a){if(solved)return;angle=norm(a);if(near(angle)<=6)complete();else render()}
  function pointerAngle(e){const r=art.getBoundingClientRect();return Math.atan2(e.clientY-(r.top+r.height/2),e.clientX-(r.left+r.width/2))*180/Math.PI}
  plate.addEventListener('pointerdown',e=>{
    if(solved||!e.isPrimary||e.button!==0)return;
    e.preventDefault();plate.focus({preventScroll:true});
    drag={id:e.pointerId,start:pointerAngle(e),angle};
    plate.setPointerCapture(e.pointerId);
  });
  plate.addEventListener('pointermove',e=>{if(drag&&e.pointerId===drag.id)change(drag.angle+pointerAngle(e)-drag.start)});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])plate.addEventListener(type,()=>{drag=null});
  plate.addEventListener('keydown',e=>{
    if(solved)return;
    const delta={ArrowLeft:-5,ArrowDown:-5,ArrowRight:5,ArrowUp:5}[e.key];
    if(delta!==undefined){e.preventDefault();change(angle+delta)}
    else if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();change(angle+(e.key==='PageUp'?30:-30))}
  });
  document.querySelector('#reprint').addEventListener('click',reset);
  editionControl.addEventListener('click',()=>{
    if(!solved)return;
    selectEdition(edition==='night'?'paper':'night');
    status.textContent=edition==='paper'?'纸本印图，可保存':'夜色反印图，可保存';
  });
  stage.hidden=false;
  if(localStorage.getItem(state)==='1')complete();else render();
})();