/* Night Butterfly / anonymous unlock counts. No pageview counters. */
(() => {
  'use strict';
  const ns = 'su-long-ai.github.io';
  const action = 'nightbutterfly-unlock';
  const root = 'https://counterapi.com/api/' + ns + '/' + action + '/';
  const prefix = 'nb036-analytics-v1:';
  const ownerHash = '6663b92aa7d5824b0a68e33c01b0cf8cbf821b6cb370b449981d017c362fc268';
  const allowed = new Set(['b-side', 'c-side', 'd-side', 'star-whisper']);
  const pending = new Set();

  async function activateOwner() {
    const hash = location.hash || '';
    if (hash.startsWith('#owner=')) {
      const passphrase = decodeURIComponent(hash.slice(7));
      // Never leave a private activation code in the visible URL or in referrers.
      history.replaceState(null, '', location.pathname + location.search);
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passphrase));
      const hex = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
      if (hex === ownerHash) localStorage.setItem(prefix + 'owner', '1');
    }
    if (localStorage.getItem(prefix + 'owner') === '1') {
      const parent = document.querySelector('.archive');
      if (parent && !document.querySelector('#owner-status')) {
        const tag = document.createElement('div');
        tag.id = 'owner-status';
        tag.textContent = 'OWNER VIEW / NOT COUNTED';
        tag.style.cssText = 'font-size:10px;color:#89b5bc;letter-spacing:.12em;margin-top:18px';
        parent.appendChild(tag);
      }
    }
  }

  const ready = activateOwner();
  function visitorId() {
    let id = localStorage.getItem(prefix + 'visitor');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(prefix + 'visitor', id);
    }
    return id;
  }

  async function record(stage) {
    if (!allowed.has(stage)) return false;
    await ready;
    if (localStorage.getItem(prefix + 'owner') === '1') return false;
    const once = prefix + 'counted:' + stage;
    if (localStorage.getItem(once) === '1' || pending.has(stage)) return false;
    pending.add(stage);
    try {
      // A random browser ID prevents double counting the same browser. No osu ID is sent.
      const url = root + encodeURIComponent(stage) + '?userId=' + encodeURIComponent(visitorId());
      const response = await fetch(url, {mode:'cors',cache:'no-store',referrerPolicy:'no-referrer',keepalive:true});
      if (!response.ok) throw new Error('Counting temporarily unavailable: ' + response.status);
      const data = await response.json();
      if (typeof data.value !== 'number') throw new Error('Unexpected counter response');
      localStorage.setItem(once, '1');
      return true;
    } finally {
      pending.delete(stage);
    }
  }

  async function count(stage) {
    if (!allowed.has(stage)) return null;
    const response = await fetch(root + encodeURIComponent(stage) + '?readOnly=true&unique=true',
      {mode:'cors',cache:'no-store',referrerPolicy:'no-referrer'});
    if (!response.ok) throw new Error('Stats temporarily unavailable: ' + response.status);
    const json = await response.json();
    return Number.isFinite(json.value) ? json.value : null;
  }

  window.nightButterflyMetrics = {ready, record, count};
})();
