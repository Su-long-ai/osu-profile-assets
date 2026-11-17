(()=>{
  const room=location.pathname.split('/').pop()?.replace('.html','');
  const parts={signal:'keys',chronicle:'dates',orbit:'mirror',sealed:'margin'};
  const id=parts[room];
  if(!id)return;
  const routeKey='nb036-route-v1:contacts',roomRouteKey='nb036-route-v1:rooms';
  const accepted=new Set(Object.values(parts));
  function routeOrder(key){
    try{
      const list=JSON.parse(localStorage.getItem(key)||'[]');
      return Array.isArray(list)&&list.length===4&&new Set(list).size===4&&list.every(x=>accepted.has(x))?list:[];
    }catch{return []}
  }
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
  function renderRouteMemory(stamp){
    const hair=stamp.querySelector('.fragment-hairline');
    if(!hair)return;
    hair.querySelectorAll('.route-memory-mark').forEach(x=>x.remove());
    stamp.classList.remove('route-memory');
    if(localStorage.getItem('nb036-verso-v1:seen')!=='1')return;
    const rooms=routeOrder(roomRouteKey),contacts=routeOrder(routeKey);
    if(rooms.length!==4||contacts.length!==4)return;
    const ri=rooms.indexOf(id),ci=contacts.indexOf(id),angles=[45,135,225,315];
    for(const [kind,i,radius] of [['room',ri,9],['contact',ci,4.3]]){
      const mark=document.createElement('i');
      mark.className='route-memory-mark route-'+kind+'-mark';
      mark.dataset.ordinal=String(i+1);
      mark.setAttribute('aria-hidden','true');
      mark.style.transform='translate(-50%,-50%) rotate('+angles[i]+'deg) translateY(-'+radius+'px)';
      hair.append(mark);
    }
    stamp.classList.add('route-memory');
  }
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
    renderRouteMemory(stamp);
  }
  refresh();
  addEventListener('pageshow',refresh);
  addEventListener('storage',refresh);
})();