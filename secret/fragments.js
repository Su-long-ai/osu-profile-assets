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
    const rootWindows = {
      keys: [124, 95, 18, 20], dates: [0, 95, 18, 20],
      mirror: [124, 0, 18, 19], margin: [0, 0, 18, 19]
    };
    const outline = '<path class="fragment-outline" d="' + part.contour + '" fill="none" stroke="' +
      (ghost ? '#8196a0' : part.color) + '" stroke-width="' + (ghost ? '1.15' : '1.65') + '"' +
      (ghost ? ' stroke-dasharray="2 4"' : '') + '/>';
    const details = ghost ? '' : '<g class="fragment-detail" fill="none" stroke="' + part.color +
      '" stroke-width=".95" stroke-linejoin="round" stroke-linecap="round">' + part.veins + '</g>';
    if (ghost) {
      // A physical joint, not a full dotted answer. The player must infer
      // the wing's outer shape and direction from the four collected shards.
      const [x,y,w,h] = rootWindows[id];
      const root = {keys:[137,107],dates:[5,107],mirror:[135,7],margin:[7,7]}[id];
      const clip = 'wing-seam-' + id;
      return '<svg class="fragment-art ghost-art" viewBox="0 0 142 115" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs><clipPath id="' + clip + '"><rect x="' + x + '" y="' + y +
        '" width="' + w + '" height="' + h + '"/></clipPath></defs>' +
        '<g clip-path="url(#' + clip + ')">' + outline + '</g>' +
        '<circle cx="' + root[0] + '" cy="' + root[1] +
        '" r="1.7" fill="#8faeb4" opacity=".62"/></svg>';
    }
    return '<svg class="fragment-art" viewBox="0 0 142 115" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      outline + details + '</svg>';
  }
  function miniSeal() {
    // The same source contours must appear in the rooms, assembly, and home.
    // Before completion the four wings are displaced, never a second drawing.
    const paint = broken => parts.map((part, i) => {
      const left = i % 2 === 0;
      const x = (left ? 0 : 142) + (broken ? (left ? -15 : 15) : 0);
      const y = (i < 2 ? 0 : 115) + (broken ? (i < 2 ? -11 : 11) : 0);
      return '<g data-mini-part="' + part.id + '" transform="translate(' + x + ' ' + y + ')">' +
        '<path d="' + part.contour + '" stroke="' + part.color + '" stroke-width="2.8" fill="none"/>' +
        '<g stroke="' + part.color + '" fill="none" stroke-width="1.5" opacity=".58">' + part.veins + '</g></g>';
    }).join('');
    return '<svg viewBox="-18 -12 316 256" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g class="seal-shards">' + paint(true) + '</g>' +
      '<g class="seal-wings">' + paint(false) + '</g>' +
      '<path d="M140 98V155M140 105Q131 86 122 80M140 105Q149 86 158 80" ' +
      'stroke="#8ca9af" stroke-width="1.7" fill="none" opacity=".64"/></svg>';
  }
  function mountStamp() {
    const page = location.pathname.split('/').pop()?.replace('.html', '');
    const lookup = { signal: 'keys', chronicle: 'dates', orbit: 'mirror', sealed: 'margin' };
    const id = lookup[page];
    const visual = document.querySelector('.workbench .visual');
    if (!id || !visual) return;
    const stamp = document.createElement('a');
    stamp.href = './';
    stamp.className = 'fragment-stamp';
    stamp.hidden = true;
    stamp.setAttribute('aria-label', byId[id].name+'，返回图集');
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
  window.NBFragments = { parts, svg, miniSeal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountStamp);
  else mountStamp();
})();