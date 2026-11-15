(() => {
 'use strict';
 const button=document.querySelector('#source-lens'),proof=document.querySelector('#source-proof'),close=document.querySelector('#source-proof-close');
 const key='nb036-source-lens-v1:available';
 const solved=()=>localStorage.getItem('nb036-misc-v3:keys')==='1';
 function update(){button.hidden=solved()||localStorage.getItem(key)!=='1';if(solved()&&proof.open)proof.close()}
 document.addEventListener('nb:rhythm-rejected',()=>{
   const first=localStorage.getItem(key)!=='1';
   localStorage.setItem(key,'1');update();
   if(first){button.classList.add('new-proof');setTimeout(()=>button.classList.remove('new-proof'),650)}
 });
 document.addEventListener('nb:discovered',update);
 addEventListener('pageshow',update);
 button.addEventListener('click',()=>{if(!button.hidden&&!proof.open)proof.showModal()});
 button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)button.click()}});
 close.addEventListener('click',()=>proof.close());
 proof.addEventListener('click',e=>{if(e.target===proof)proof.close()});
 // The room's global keyboard shortcut must never enter a note while the
 // loupe is open (the browser dialog supplies Escape and focus handling).
 proof.addEventListener('keydown',e=>e.stopPropagation());
 update();
})();