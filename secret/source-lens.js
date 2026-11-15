(() => {
 'use strict';
 const button=document.querySelector('#source-lens'),proof=document.querySelector('#source-proof');
 const key='nb036-source-lens-v1:available';
 const solved=()=>localStorage.getItem('nb036-misc-v3:keys')==='1';
 function update(){button.hidden=solved()||localStorage.getItem(key)!=='1';if(solved()&&proof.open)proof.close()}
 document.addEventListener('nb:rhythm-rejected',()=>{
   const first=localStorage.getItem(key)!=='1';
   localStorage.setItem(key,'1');update();
   if(first){button.classList.add('new-proof');setTimeout(()=>button.classList.remove('new-proof'),720)}
 });
 document.addEventListener('nb:discovered',update);
 addEventListener('pageshow',update);
 button.addEventListener('click',()=>{if(!button.hidden&&!proof.open)proof.showModal()});
 button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)button.click()}});
 // Outside click and Escape fold the aperture back into the room.
 proof.addEventListener('click',e=>{if(e.target===proof)proof.close()});
 // The room's global keyboard shortcut must never enter a note while the
 // source aperture is open. Escape is still handled by the native dialog.
 proof.addEventListener('keydown',e=>e.stopPropagation());
 update();
})();