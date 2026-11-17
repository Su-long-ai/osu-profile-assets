(()=>{
  const room=location.pathname.split('/').pop()?.replace('.html','');
  const parts={signal:'keys',chronicle:'dates',orbit:'mirror',sealed:'margin'};
  const id=parts[room];
  if(!id)return;
  const routeKey='nb036-route-v1:contacts';
  const accepted=new Set(Object.values(parts));
  function appendRoute(name){
    let list=[];
    try{const parsed=JSON.parse(localStorage.getItem(routeKey)||'[]');if(Array.isArray(parsed))list=parsed.filter(x=>accepted.has(x))}
    catch{}
    if(!list.includes(name)){list.push(name);localStorage.setItem(routeKey,JSON.stringify(list.slice(0,4)))}
  }
  function markContact(){
    if(localStorage.getItem('nb036-misc-v4:joined')==='1'&&location.hash==='#registered'){
      const contactKey='nb036-impression-v3:contact:'+id;
      const first=localStorage.getItem(contactKey)!=='1';
      localStorage.setItem(contactKey,'1');
      if(first)appendRoute(id);
      const allContacts=Object.values(parts).every(part=>localStorage.getItem('nb036-impression-v3:contact:'+part)==='1');
      if(allContacts)void window.nightButterflyMetrics?.record('misc-contact').catch(()=>{});
    }
  }
  markContact();
  addEventListener('hashchange',()=>{markContact();refresh()});
  addEventListener('pageshow',markContact);
  function refresh(){
    const stamp=document.querySelector('.fragment-stamp');
    if(!stamp)return;
    const joined=localStorage.getItem('nb036-misc-v4:joined')==='1';
    if(!stamp.dataset.hubLabel)stamp.dataset.hubLabel=stamp.getAttribute('aria-label')||'返回图集';
    stamp.dataset.fragment=id;
    stamp.classList.toggle('registered',joined);
    stamp.classList.toggle('route-to-print',joined);
    stamp.classList.toggle('registration-arrival',joined&&location.hash==='#registered');
    stamp.setAttribute('href',joined?'./impression.html#'+id:'./');
    stamp.setAttribute('aria-label',joined?
      stamp.dataset.hubLabel.replace('返回图集','返回反印版，对应套印位置'):
      stamp.dataset.hubLabel);
  }
  refresh();
  addEventListener('pageshow',refresh);
  addEventListener('storage',refresh);
})();