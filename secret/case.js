/* Archive 036 / case state, client-side only. No login and no visitor fingerprint. */
(() => {
  'use strict';
  const prefix='nb036-case-v2:';
  const branches=['signal','chronicle','orbit'];
  const valid=new Set([...branches,'final','true']);
  const solved=id => localStorage.getItem(prefix+id)==='1';
  function count(id){
    // Keep original B-E counters unchanged; new branches have separate series.
    if(window.nightButterflyMetrics)window.nightButterflyMetrics.record('case-'+id).catch(()=>{});
  }
  function complete(id){
    if(!valid.has(id))return false;
    const first=!solved(id);
    localStorage.setItem(prefix+id,'1');
    count(id);
    return first;
  }
  const progress=()=>branches.filter(solved);
  function renderIndex(){
    for(const item of document.querySelectorAll('[data-case]')){
      const id=item.getAttribute('data-case');
      const done=solved(id);
      item.classList.toggle('done',done);
      const badge=item.querySelector('.file-state');
      if(badge)badge.textContent=done?'ARCHIVED / ✓':'UNRESOLVED';
    }
    const summary=document.querySelector('#summary');
    if(summary)summary.textContent=progress().length+' / 3 CASE FILES RECOVERED';
  }
  function renderPieces(){
    for(const el of document.querySelectorAll('[data-piece]')){
      const found=solved(el.dataset.piece);
      el.classList.toggle('found',found);
      el.textContent=(found?'✓ ':'○ ')+el.dataset.label;
    }
  }
  function reveal(el){
    if(!el)return;
    el.hidden=false;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)el.scrollIntoView({block:'nearest'});
    else el.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  window.NB={solved,complete,progress,renderIndex,renderPieces,reveal};
  // Retry a previously solved stage if its first analytics request failed;
  // metrics.js suppresses requests for already-counted stages and owner devices.
  for(const id of valid)if(solved(id))count(id);
})();
