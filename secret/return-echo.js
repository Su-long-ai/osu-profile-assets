(()=>{'use strict';
const rows=[
  ['folio-screen-flex','a7',32,24],
  ['folio-flex-screen','c2',70,16],
  ['screen-folio-flex','e9',70,32],
  ['screen-flex-folio','h4',86,16],
  ['flex-folio-screen','m6',86,32],
  ['flex-screen-folio','q1',124,24],
].map(([key,code,x,y],index)=>Object.freeze({key,code,x,y,index}));
const byKey=Object.fromEntries(rows.map(x=>[x.key,x]));
const byCode=Object.fromEntries(rows.map(x=>[x.code,x]));
const loops=[
  'M63 16q6-7 13 0','M80 16q6-7 12 0',
  'M64 32q6 7 12 0','M80 32q6 7 12 0'
];
const markup=code=>{
  const hit=byCode[code]||null;
  return loops.map(d=>'<path class="echo-loop" d="'+d+'"/>').join('')+
    rows.map(x=>'<circle class="echo-node'+(hit&&hit.code===x.code?' target':'')+'" data-echo="'+x.code+'" cx="'+x.x+'" cy="'+x.y+'" r="'+(hit&&hit.code===x.code?'1.7':'1')+'"/>').join('')+
    (hit?'<circle class="echo-ring" cx="'+hit.x+'" cy="'+hit.y+'" r="5.5"/>':'');
};
const forOrder=order=>Array.isArray(order)?(byKey[order.join('-')]||null):null;
window.NBReturnEcho=Object.freeze({
  rows:Object.freeze(rows.slice()),
  forOrder,
  forCode:code=>byCode[code]||null,
  markup
});
})();
