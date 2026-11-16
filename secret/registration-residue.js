(()=>{
  const room=location.pathname.split('/').pop()?.replace('.html','');
  const parts={signal:'keys',chronicle:'dates',orbit:'mirror',sealed:'margin'};
  const id=parts[room];
  if(!id)return;
  function refresh(){
    const stamp=document.querySelector('.fragment-stamp');
    if(!stamp)return;
    stamp.dataset.fragment=id;
    stamp.classList.toggle('registered',localStorage.getItem('nb036-misc-v4:joined')==='1');
  }
  refresh();
  addEventListener('pageshow',refresh);
  addEventListener('storage',refresh);
})();