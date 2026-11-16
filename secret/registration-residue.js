(()=>{
  const room=location.pathname.split('/').pop()?.replace('.html','');
  const parts={signal:'keys',chronicle:'dates',orbit:'mirror',sealed:'margin'};
  const id=parts[room];
  if(!id)return;
  function refresh(){
    const stamp=document.querySelector('.fragment-stamp');
    if(!stamp)return;
    const joined=localStorage.getItem('nb036-misc-v4:joined')==='1';
    if(!stamp.dataset.hubLabel)stamp.dataset.hubLabel=stamp.getAttribute('aria-label')||'返回图集';
    stamp.dataset.fragment=id;
    stamp.classList.toggle('registered',joined);
    stamp.classList.toggle('route-to-print',joined);
    stamp.setAttribute('href',joined?'./impression.html#'+id:'./');
    stamp.setAttribute('aria-label',joined?
      stamp.dataset.hubLabel.replace('返回图集','返回反印版，对应套印位置'):
      stamp.dataset.hubLabel);
  }
  refresh();
  addEventListener('pageshow',refresh);
  addEventListener('storage',refresh);
})();