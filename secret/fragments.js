/* The pieces are four physical lobes of one drawing, never code digits. */
(() => {
  'use strict';
  const parts = [
    {
      id: 'keys', name: '四轨节奏留下的左上翼',
      color: '#9cc4c9',
      contour: 'M137 107 C112 73 79 33 38 23 C10 17 6 40 14 62 C29 93 78 91 137 107Z',
      veins: '<path d="M131 103 C104 91 79 63 39 44 M101 90 63 79" />' +
        '<path d="M42 43V56M54 50V65M69 61V75M85 75V84" stroke-width="2.3" opacity=".88"/>'
    },
    {
      id: 'dates', name: '时间线留下的右上翼',
      color: '#b7adcb',
      contour: 'M5 107 C29 69 65 21 107 23 C138 24 140 48 127 67 C111 92 57 95 5 107Z',
      veins: '<path d="M10 102 C47 79 74 50 108 42 M42 88 71 78" />' +
        '<path d="M104 37V66" stroke-width=".9"/><circle cx="104" cy="37" r="3" fill="#9cc4c9"/><circle cx="104" cy="66" r="3" fill="#beaace"/>'
    },
    {
      id: 'mirror', name: '星点留下的左下翼',
      color: '#a6c7ce',
      contour: 'M135 7 C105 28 74 14 51 33 C25 51 30 93 54 101 C91 116 112 68 135 7Z',
      veins: '<path d="M128 15 75 42 57 66 73 94 108 62" stroke-dasharray="2 6"/>' +
        '<g fill="#a8cbd1" stroke="none"><circle cx="75" cy="42" r="2.5"/><circle cx="57" cy="66" r="2.5"/><circle cx="73" cy="94" r="2.5"/><circle cx="108" cy="62" r="2.5"/></g>'
    },
    {
      id: 'margin', name: '笔迹留下的右下翼',
      color: '#bba8c9',
      contour: 'M7 7 C34 28 67 13 92 33 C120 52 115 97 87 102 C53 113 29 69 7 7Z',
      veins: '<path d="M13 15 C39 28 70 37 83 61 M32 37 50 75" />' +
        '<path d="M83 59V84 Q83 98 72 90 M69 96 93 88" stroke-width="1.7"/>'
    }
  ];
  const byId = Object.fromEntries(parts.map((part, i) => [part.id, { ...part, index: i }]));
  function svg(id, type = 'piece') {
    const part = byId[id];
    if (!part) return '';
    const ghost = type === 'ghost';
    const outline = '<path class="fragment-outline" d="' + part.contour + '" fill="none" stroke="' +
      (ghost ? '#667b89' : part.color) + '" stroke-width="' + (ghost ? '1' : '1.65') + '"' +
      (ghost ? ' stroke-dasharray="2 5"' : '') + '/>';
    const details = ghost ? '' : '<g class="fragment-detail" fill="none" stroke="' + part.color +
      '" stroke-width=".95" stroke-linejoin="round" stroke-linecap="round">' + part.veins + '</g>';
    return '<svg class="fragment-art' + (ghost ? ' ghost-art' : '') +
      '" viewBox="0 0 142 115" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      outline + details + '</svg>';
  }
  function mountStamp() {
    const page = location.pathname.split('/').pop()?.replace('.html', '');
    const lookup = { signal: 'keys', chronicle: 'dates', orbit: 'mirror', sealed: 'margin' };
    const id = lookup[page];
    const visual = document.querySelector('.workbench .visual');
    if (!id || !visual) return;
    const stamp = document.createElement('div');
    stamp.className = 'fragment-stamp';
    stamp.hidden = true;
    stamp.setAttribute('role', 'img');
    stamp.setAttribute('aria-label', byId[id].name);
    stamp.innerHTML = '<span class="fragment-hairline" aria-hidden="true"></span>' + svg(id);
    visual.append(stamp);
    const update = () => {
      const discovered = localStorage.getItem('nb036-misc-v3:' + id) === '1';
      stamp.hidden = !discovered;
    };
    document.addEventListener('nb:discovered', update);
    window.addEventListener('pageshow', update);
    update();
  }
  window.NBFragments = { parts, svg };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountStamp);
  else mountStamp();
})();