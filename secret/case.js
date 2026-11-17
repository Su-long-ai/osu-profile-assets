/* A few local interactions, not a quest or player-tracking system. */
(() => {
  'use strict';
  const prefix = 'nb036-misc-v3:';
  const accepted = new Set(['keys', 'dates', 'mirror', 'margin']);
  const routeKey='nb036-route-v1:rooms';
  function appendRoute(name){
    let list=[];
    try{const parsed=JSON.parse(localStorage.getItem(routeKey)||'[]');if(Array.isArray(parsed))list=parsed.filter(x=>accepted.has(x))}
    catch{}
    if(!list.includes(name)){list.push(name);localStorage.setItem(routeKey,JSON.stringify(list.slice(0,4)))}
  }
  function seen(name) {
    return localStorage.getItem(prefix + name) === '1';
  }
  function notice(name) {
    if (!accepted.has(name) || seen(name)) return;
    localStorage.setItem(prefix + name, '1');
    appendRoute(name);
    document.dispatchEvent(new CustomEvent('nb:discovered', {detail:{name}}));
    // Counts refer to one browser first noticing this detail, not a "win".
    window.nightButterflyMetrics?.record('misc-' + name).catch(() => {});
  }
  // Reloads also retry a failed counter request, without double-counting:
  // metrics.js keeps its own persistent "reported" marker.
  for (const id of accepted) {
    if (seen(id)) window.nightButterflyMetrics?.record('misc-' + id).catch(() => {});
  }
  window.NB = {notice,seen};
})();