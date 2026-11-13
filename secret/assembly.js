/* The visual pieces fit by their physical outlines: no arbitrary number code. */
(() => {
  'use strict';
  const fragments = window.NBFragments;
  if (!fragments) return;
  const ids = fragments.parts.map(part => part.id);
  const oldKey = name => 'nb036-misc-v3:' + name;
  const finalKey = 'nb036-misc-v4:joined';
  const boardKey = 'nb036-assembly-v1:slots';
  const replayKey = 'nb036-assembly-v2:replay';
  if (!ids.every(id => localStorage.getItem(oldKey(id)) === '1')) {
    location.replace('./');
    return;
  }

  const board = document.querySelector('#assembly-board');
  const tray = document.querySelector('#assembly-tray');
  const endmark = document.querySelector('#assembly-endmark');
  const status = document.querySelector('#assembly-status');
  const slots = [...document.querySelectorAll('.assembly-slot')];
  const pieces = [...document.querySelectorAll('.assembly-piece')];
  // Each fitted wing continues its real root vein into the central body.
  // Wrong placements are allowed, but they never make this seam.
  const joins = [
    'M129 100 Q137 105 142 115',
    'M13 100 Q5 105 0 115',
    'M128 17 Q137 9 142 0',
    'M14 17 Q5 9 0 0'
  ];

  let placements = [null, null, null, null];
  let selected = null;
  let completed = localStorage.getItem(finalKey) === '1' &&
    localStorage.getItem(replayKey) !== '1';

  const saved = JSON.parse(localStorage.getItem(boardKey) || 'null');
  if (Array.isArray(saved) && saved.length === 4 &&
      saved.every(id => id === null || ids.includes(id)) &&
      new Set(saved.filter(Boolean)).size === saved.filter(Boolean).length) {
    placements = saved;
  }
  if (completed) placements = [...ids];

  function show() {
    slots.forEach((slot, index) => {
      const id = placements[index];
      const fitted = id === ids[index];
      const seam = fitted ?
        '<span class="assembly-root-join"><svg viewBox="0 0 142 115" aria-hidden="true">' +
        '<path d="' + joins[index] + '" stroke="' + fragments.parts[index].color +
        '" stroke-width="1.15" fill="none" stroke-linecap="round"/></svg></span>' : '';
      slot.innerHTML = '<span class="assembly-ghost">' + fragments.svg(ids[index], 'ghost') + '</span>' +
        (id ? '<span class="assembly-filled">' + fragments.svg(id) + '</span>' : '') + seam;
      slot.classList.toggle('occupied', Boolean(id));
      slot.classList.toggle('fits', id === ids[index]);
      slot.classList.toggle('selected', selected === id && id !== null);
      slot.setAttribute('aria-label', id ?
        '已放入' + fragments.parts.find(part => part.id === id).name + '，再次点按可拿起' :
        ['蝴蝶左上空位','蝴蝶右上空位','蝴蝶左下空位','蝴蝶右下空位'][index]);
      slot.disabled = completed;
      slot.draggable = Boolean(id) && !completed;
    });
    pieces.forEach(button => {
      const id = button.dataset.piece;
      const placed = placements.includes(id);
      button.innerHTML = fragments.svg(id);
      button.classList.toggle('already-placed', placed);
      button.classList.toggle('selected', selected === id);
      button.setAttribute('aria-pressed', String(selected === id));
      button.disabled = completed;
    });
    board.classList.toggle('is-solved', completed);
    board.classList.toggle('piece-selected', selected !== null && !completed);
    tray.hidden = completed;
    endmark.hidden = !completed;
  }
  function remember() {
    localStorage.setItem(boardKey, JSON.stringify(placements));
  }
  function pick(id) {
    if (completed || !ids.includes(id)) return;
    const from = placements.indexOf(id);
    if (from !== -1) placements[from] = null;
    selected = id;
    remember();
    status.textContent = fragments.parts.find(part => part.id === id).name + '已被拿起';
    show();
  }
  function finish() {
    const firstCompletion = localStorage.getItem(finalKey) !== '1';
    completed = true;
    selected = null;
    placements = [...ids];
    remember();
    localStorage.setItem(finalKey, '1');
    localStorage.removeItem(replayKey);
    show();
    status.textContent = '四片碎翼拼合，夜蝶完整显现';
    // Reassembling the same butterfly never counts as a new solver.
    if (firstCompletion) window.nightButterflyMetrics?.record('misc-assembly').catch(() => {});
  }
  function place(index) {
    if (completed) return;
    if (selected === null) {
      if (placements[index]) pick(placements[index]);
      return;
    }
    placements[index] = selected;
    selected = null;
    remember();
    show();
    if (placements.every((id, i) => id === ids[i])) finish();
    else status.textContent = '蝶翼已放入，可继续调整其他碎片';
  }

  endmark.addEventListener('click', () => {
    if (!completed) return;
    completed = false;
    selected = null;
    placements = [null, null, null, null];
    localStorage.setItem(replayKey, '1');
    remember();
    show();
    status.textContent = '四片蝶翼已经重新分开，可以再次拼合';
    pieces[0]?.focus();
  });

  for (const button of pieces) {
    button.addEventListener('click', () => pick(button.dataset.piece));
    button.addEventListener('dragstart', event => {
      if (completed) { event.preventDefault(); return; }
      const id = button.dataset.piece;
      event.dataTransfer.setData('text/plain', id);
      event.dataTransfer.effectAllowed = 'move';
      board.classList.add('dragging');
    });
    button.addEventListener('dragend', () => board.classList.remove('dragging'));
  }
  slots.forEach((slot, index) => {
    slot.addEventListener('click', () => place(index));
    slot.addEventListener('dragstart', event => {
      const id = placements[index];
      if (completed || !id) { event.preventDefault(); return; }
      event.dataTransfer.setData('text/plain', id);
      event.dataTransfer.effectAllowed = 'move';
      board.classList.add('dragging');
    });
    slot.addEventListener('dragover', event => {
      if (completed) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });
    slot.addEventListener('drop', event => {
      if (completed) return;
      event.preventDefault();
      board.classList.remove('dragging');
      const id = event.dataTransfer.getData('text/plain');
      if (!ids.includes(id)) return;
      pick(id);
      place(index);
    });
  });

  // Pointer-up owns touch actions because a browser may omit the synthetic
  // click immediately after a drag. Mouse and keyboard still use native click.
  let drag = null;
  let touchHandledAt = -Infinity;
  let touchControls = [];
  document.addEventListener('click', event => {
    if (event.detail === 0 || performance.now() - touchHandledAt > 700) return;
    if (!touchControls.some(control => control.contains(event.target))) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  document.addEventListener('pointerdown', event => {
    if (completed || event.pointerType !== 'touch') return;
    const element = event.target.closest('.assembly-piece,.assembly-slot');
    if (!element) return;
    const id = element.dataset.piece || placements[Number(element.dataset.slot)] || null;
    drag = { id, x: event.clientX, y: event.clientY, moved: false, pointerId: event.pointerId, source: element };
  });
  document.addEventListener('pointermove', event => {
    if (!drag || !drag.id || event.pointerId !== drag.pointerId) return;
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 12) return;
    drag.moved = true;
    event.preventDefault();
    let preview = document.querySelector('#assembly-drag-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'assembly-drag-preview';
      document.body.append(preview);
    }
    preview.innerHTML = fragments.svg(drag.id);
    preview.style.transform = 'translate(' + (event.clientX - 36) + 'px,' + (event.clientY - 31) + 'px)';
  }, { passive: false });
  document.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const active = drag;
    drag = null;
    document.querySelector('#assembly-drag-preview')?.remove();
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('.assembly-slot');
    if (active.moved && active.id && target) {
      pick(active.id);
      place(Number(target.dataset.slot));
    } else if (!active.moved) {
      if (active.source.matches('.assembly-piece')) pick(active.source.dataset.piece);
      else place(Number(active.source.dataset.slot));
    }
    touchControls = [active.source, target].filter(Boolean);
    touchHandledAt = performance.now();
  });
  document.addEventListener('pointercancel', () => {
    drag = null;
    document.querySelector('#assembly-drag-preview')?.remove();
  });
  show();
})();