/* Night Butterfly / anonymous unlock counts. No pageview counters. */
(() => {
  'use strict';
  const root = 'https://countapi.mileshilliard.com/api/v1/';
  const counterKey = stage => 'archive036_20261113_' + stage.replaceAll('-', '_');
  const prefix = 'nb036-analytics-v1:';
  const ownerHash = '6663b92aa7d5824b0a68e33c01b0cf8cbf821b6cb370b449981d017c362fc268';
  const allowed = new Set(['b-side', 'c-side', 'd-side', 'star-whisper', 'e-side', 'case-signal', 'case-chronicle', 'case-orbit', 'case-final', 'case-true', 'misc-keys', 'misc-dates', 'misc-mirror', 'misc-margin', 'misc-final', 'misc-assembly']);
  const pending = new Set();
  const backoffKey = prefix + 'service-retry-after';
  async function request(url, options) {
    if (Date.now() < Number(localStorage.getItem(backoffKey) || 0))
      throw new Error('Counter service temporarily unavailable');
    try {
      const response = await fetch(url, {...options, signal: AbortSignal.timeout(7000)});
      if (response.status === 403 || response.status === 429)
        localStorage.setItem(backoffKey, String(Date.now() + 10 * 60 * 1000));
      return response;
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'TypeError')
        localStorage.setItem(backoffKey, String(Date.now() + 60 * 1000));
      throw error;
    }
  }

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
      const parent = document.querySelector('.shell, .archive');
      if (parent && !document.querySelector('#owner-status')) {
        const tag = document.createElement('div');
        tag.id = 'owner-status';
        tag.textContent = '◌';
        tag.setAttribute('aria-label', '站长浏览器，访问不计数');
        tag.style.cssText = 'position:absolute;left:25px;bottom:20px;font-size:14px;color:#6e8993;pointer-events:none';
        parent.appendChild(tag);
      }
    }
  }

  const ready = activateOwner();
  async function record(stage) {
    if (!allowed.has(stage)) return false;
    await ready;
    if (localStorage.getItem(prefix + 'owner') === '1') return false;
    const once = prefix + 'counted:' + stage;
    if (localStorage.getItem(once) === '1' || pending.has(stage)) return false;
    pending.add(stage);
    try {
      // Each browser counts each stage once, with only local storage markers; no visitor ID is sent.
      const url = root + 'hit/' + counterKey(stage);
      const response = await request(url, {mode:'cors',cache:'no-store',referrerPolicy:'no-referrer',keepalive:true});
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
    const response = await request(root + 'get/' + counterKey(stage),
      {mode:'cors',cache:'no-store',referrerPolicy:'no-referrer'});
    // A never-used stage key returns 404; display zero instead of a network error.
    if (response.status === 404) return 0;
    if (!response.ok) throw new Error('Stats temporarily unavailable: ' + response.status);
    const json = await response.json();
    return Number.isFinite(json.value) ? json.value : null;
  }

  window.nightButterflyMetrics = {ready, record, count};
})();
