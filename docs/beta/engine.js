/* engine.js — escenas en primera persona (SVG con parallax), diálogo, elecciones, hojas y finales.
   La historia (story.js) se escribe como un guion async: await Engine.say(...), await Engine.choose(...). */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const fmt = (n, d = 1) => Number(n).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });

const Engine = (() => {
  const ENDINGS_KEY = 'qx.finales';
  const BASE_W = 1920, BASE_H = 1080;
  let stageEl, dockEl, svg, scene = null;
  let vb = { w: BASE_W, h: BASE_H, y: 0 };
  const pan = { x: 0, target: 0 };
  let layers = [];
  let dragging = null, dragged = false;
  let raf = 0;
  let edgeV = 0;                 // velocidad de giro cuando el ratón está en los bordes

  /* ---------- Finales descubiertos (solo en este navegador) ---------- */
  const ENDINGS = {
    cervezas:   'Cervezas con Chelu',
    despedido:  'Despedido por inactividad',
    cafe_solo:  'Café para uno',
    continuara: 'Mañana superada (continuará)',
  };
  function found() { try { return JSON.parse(localStorage.getItem(ENDINGS_KEY) || '[]'); } catch (e) { return []; } }
  function saveEnding(id) {
    const f = found();
    if (!f.includes(id)) { f.push(id); try { localStorage.setItem(ENDINGS_KEY, JSON.stringify(f)); } catch (e) {} }
    renderCounter();
  }
  function renderCounter() {
    const c = $('#counter');
    if (c) c.textContent = `Finales ${found().length}/${Object.keys(ENDINGS).length}`;
  }

  /* ---------- HUD ---------- */
  function setTime(t) { $('#clock').textContent = t; }
  function setPlace(p) { $('#place').textContent = p; }

  /* ---------- Cámara: viewBox desplazable + capas con parallax ---------- */
  function fit() {
    if (!stageEl) return;
    const r = stageEl.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const aspect = r.width / r.height;
    if (aspect >= BASE_W / BASE_H) vb = { w: BASE_W, h: BASE_W / aspect, y: 0 };
    else vb = { w: BASE_H * aspect, h: BASE_H, y: 0 };
    vb.y = (BASE_H - vb.h) / 2;
    applyView();
  }
  function applyView() {
    if (!svg) return;
    const maxX = BASE_W - vb.w;
    const x = maxX * (pan.x + 1) / 2;
    svg.setAttribute('viewBox', `${x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
    layers.forEach(l => l.el.setAttribute('transform', `translate(${(x * l.d).toFixed(1)} 0)`));
  }
  function loop() {
    if (edgeV) pan.target = Math.max(-1, Math.min(1, pan.target + edgeV));
    const dx = pan.target - pan.x;
    if (Math.abs(dx) > 0.0005) { pan.x += dx * 0.12; applyView(); }
    raf = requestAnimationFrame(loop);
  }
  function panBy(delta) { pan.target = Math.max(-1, Math.min(1, pan.target + delta)); }

  function onPointerDown(e) { dragging = { x: e.clientX, t: pan.target }; dragged = false; }
  function onPointerMove(e) {
    if (e.pointerType === 'mouse' && !dragging) {          // bordes de la pantalla = girar la cabeza
      const r = stageEl.getBoundingClientRect();
      const u = (e.clientX - r.left) / r.width;
      edgeV = u < 0.14 ? -(0.14 - u) / 0.14 * 0.018 : u > 0.86 ? (u - 0.86) / 0.14 * 0.018 : 0;
      return;
    }
    if (!dragging) return;
    const r = stageEl.getBoundingClientRect();
    const dxPx = e.clientX - dragging.x;
    if (Math.abs(dxPx) > 6) dragged = true;
    const maxX = BASE_W - vb.w;
    const unitsPerPx = vb.w / r.width;
    const dPan = maxX > 0 ? -(dxPx * unitsPerPx) / (maxX / 2) : 0;
    pan.target = Math.max(-1, Math.min(1, dragging.t + dPan));
  }
  function onPointerUp() { dragging = null; edgeV = 0; }

  /* ---------- Escenas ---------- */
  function mountScene(def) {
    scene = def;
    $('#scene').classList.remove('hide');
    stageEl.innerHTML = '';
    stageEl.insertAdjacentHTML('beforeend',
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BASE_W} ${BASE_H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(def.alt || def.place || '')}">${def.art}</svg>`);
    svg = stageEl.querySelector('svg');
    layers = [...svg.querySelectorAll('[data-d]')].map(el => ({ el, d: parseFloat(el.dataset.d) }));
    pan.x = pan.target = def.pan || 0;
    if (def.time) setTime(def.time);
    if (def.place) setPlace(def.place);
    if (def.sound) Sound.ambience(def.sound);
    stageEl.classList.remove('fade'); void stageEl.offsetWidth; stageEl.classList.add('fade');
    fit();
  }

  /* Escena explorable: hotspots clicables + barra de acciones. Resuelve con lo que devuelva un hotspot. */
  function explore(def) {
    mountScene(def);
    const hot = def.hotspots || [];
    const holder = svg.querySelector('[data-hot-layer]') || svg;
    return new Promise((resolve, reject) => {
      const state = {};
      hot.forEach(h => { state[h.id] = { done: false, enabled: h.enabled !== false }; });
      let busy = false;

      const render = () => {
        svg.querySelectorAll('.hot').forEach(n => n.remove());
        hot.forEach(h => {
          const s = state[h.id];
          const [x, y, w, hh] = h.box;
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.setAttribute('class', `hot${s.done ? ' done' : ''}${s.enabled ? '' : ' off'}`);
          g.setAttribute('data-hot', h.id);
          g.setAttribute('role', 'button');
          g.setAttribute('tabindex', s.enabled ? '0' : '-1');
          g.setAttribute('aria-label', h.label);
          g.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="14"/><circle class="pulse" cx="${x + w / 2}" cy="${y + hh / 2}" r="${Math.max(16, Math.min(34, Math.min(w, hh) / 5))}"/>`;
          holder.appendChild(g);
        });
        const bar = $('#actions');
        bar.innerHTML = hot.map(h => {
          const s = state[h.id];
          return `<button type="button" class="act${s.done ? ' done' : ''}" data-hot="${h.id}"${s.enabled ? '' : ' disabled'}>${esc(h.label)}</button>`;
        }).join('');
      };

      const trigger = async (id) => {
        const h = hot.find(x => x.id === id);
        if (!h || busy || !state[id].enabled) return;
        busy = true; Sound.click();
        $('#actions').classList.add('busy');
        let res;
        try { res = await h.run(api); }
        catch (err) { cleanup(); busy = false; reject(err); return; }       // un hotspot puede terminar la partida (final)
        $('#actions').classList.remove('busy');
        busy = false;
        if (res && res.exit) { cleanup(); resolve(res.exit); return; }
        if (!h.repeat) state[id].done = true;
        render();
      };
      const api = {
        enable(id, on = true) { state[id].enabled = on; render(); },
        done(id) { state[id].done = true; render(); },
        isDone: (id) => state[id].done,
      };
      const onClick = (e) => {
        if (dragged) { dragged = false; return; }               // arrastrar para mirar no debe activar objetos
        const t = e.target.closest('[data-hot]');
        if (t) trigger(t.dataset.hot);
      };
      const onBar = (e) => { const t = e.target.closest('[data-hot]'); if (t) trigger(t.dataset.hot); };
      const onKey = (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.hot')) {
          e.preventDefault(); trigger(e.target.closest('.hot').dataset.hot);
        }
      };
      stageEl.addEventListener('click', onClick);
      stageEl.addEventListener('keydown', onKey);
      $('#actions').addEventListener('click', onBar);
      const cleanup = () => {
        stageEl.removeEventListener('click', onClick);
        stageEl.removeEventListener('keydown', onKey);
        $('#actions').removeEventListener('click', onBar);
        $('#actions').innerHTML = '';
      };
      render();
      if (def.intro) { busy = true; Promise.resolve(def.intro(api)).then(() => { busy = false; }); }
    });
  }

  /* Escena sin hotspots (secuencias narradas) */
  function show(def) { mountScene(def); $('#actions').innerHTML = ''; }

  /* ---------- Diálogo, elecciones ---------- */
  let typing = 0;
  function say(lines, opts = {}) {
    if (!Array.isArray(lines)) lines = [lines];
    return (async () => {
      for (const l of lines) await sayOne(typeof l === 'string' ? { text: l } : l, opts);
    })();
  }
  function sayOne({ who, text, think }, opts) {
    return new Promise(resolve => {
      const my = ++typing;
      dockEl.className = 'dock talk' + (think ? ' think' : '') + (who ? ' has-who' : '');
      dockEl.innerHTML = `${who ? `<div class="who">${esc(who)}</div>` : ''}<p class="line"></p><div class="next" aria-hidden="true">▶</div>`;
      const p = dockEl.querySelector('.line');
      let i = 0, finished = false;
      const full = text;
      const speed = opts.fast ? 6 : 14;
      const tick = () => {
        if (finished || my !== typing) return;
        i += 2;
        p.textContent = full.slice(0, i);
        if (i >= full.length) { finished = true; dockEl.classList.add('ready'); return; }
        setTimeout(tick, speed);
      };
      tick();
      const advance = (e) => {
        if (e && e.type === 'keydown' && !['Enter', ' ', 'ArrowRight'].includes(e.key)) return;
        if (e && e.type === 'keydown') e.preventDefault();
        if (!finished) { finished = true; p.textContent = full; dockEl.classList.add('ready'); return; }
        dockEl.removeEventListener('click', advance); window.removeEventListener('keydown', advance);
        dockEl.className = 'dock'; dockEl.innerHTML = '';
        resolve();
      };
      dockEl.addEventListener('click', advance);
      window.addEventListener('keydown', advance);
    });
  }

  function choose(options, prompt) {
    return new Promise(resolve => {
      dockEl.className = 'dock choose';
      dockEl.innerHTML = `${prompt ? `<p class="prompt">${esc(prompt)}</p>` : ''}<div class="opts">${
        options.map((o, i) => `<button type="button" class="opt" data-id="${esc(o.id)}"><span class="key">${i + 1}</span>${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('')}</div>`;
      const pick = (id) => {
        window.removeEventListener('keydown', onKey);
        dockEl.className = 'dock'; dockEl.innerHTML = '';
        Sound.click(); resolve(id);
      };
      const onKey = (e) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= options.length) pick(options[n - 1].id); };
      window.addEventListener('keydown', onKey);
      dockEl.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(b.dataset.id)));
      const first = dockEl.querySelector('.opt'); if (first) first.focus({ preventScroll: true });
    });
  }

  /* ---------- Hojas (minijuegos, ficha) ---------- */
  function sheet(mount, { title = '', wide = false, closable = false } = {}) {
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.className = 'sheet';
      wrap.innerHTML = `<div class="card${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        ${closable ? '<button type="button" class="x" aria-label="Cerrar">✕</button>' : ''}
        ${title ? `<h2>${esc(title)}</h2>` : ''}<div class="body"></div></div>`;
      document.body.appendChild(wrap);
      const finish = (v) => { wrap.remove(); window.removeEventListener('keydown', onEsc); resolve(v); };
      const onEsc = (e) => { if (closable && e.key === 'Escape') finish(null); };
      window.addEventListener('keydown', onEsc);
      if (closable) wrap.querySelector('.x').addEventListener('click', () => finish(null));
      mount(wrap.querySelector('.body'), finish);
      const f = wrap.querySelector('button, input'); if (f) f.focus({ preventScroll: true });
    });
  }

  /* ---------- Final ---------- */
  function end(id, title, text, art) {
    saveEnding(id);
    Sound.ambience(null);
    const wrap = document.createElement('div');
    wrap.className = 'ending';
    wrap.innerHTML = `${art ? `<div class="end-art">${art}</div>` : ''}
      <div class="end-body"><div class="end-tag">${id === 'continuara' ? 'Fin de la vertical de prueba' : 'Final'}</div>
      <h1>${esc(title)}</h1><p>${esc(text)}</p>
      <ul class="end-list">${Object.entries(ENDINGS).map(([k, v]) => `<li class="${found().includes(k) ? 'got' : ''}">${found().includes(k) ? '✔' : '○'} ${found().includes(k) ? esc(v) : '???'}</li>`).join('')}</ul>
      <button type="button" class="btn primary" id="again">↻ Volver a empezar el día</button></div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('#again').addEventListener('click', () => { location.hash = '#start'; location.reload(); });
    wrap.querySelector('#again').focus();
  }

  /* ---------- Arranque ---------- */
  function init() {
    stageEl = $('#stage'); dockEl = $('#dock');
    stageEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('resize', fit);
    window.addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowLeft') panBy(-0.25);
      if (e.key === 'ArrowRight') panBy(0.25);
    });
    $('#look-l').addEventListener('click', () => panBy(-0.6));
    $('#look-r').addEventListener('click', () => panBy(0.6));
    $('#snd').addEventListener('click', () => {
      const on = Sound.toggle();
      $('#snd').textContent = on ? '🔊' : '🔇';
      $('#snd').setAttribute('aria-pressed', on);
      $('#snd').setAttribute('aria-label', on ? 'Silenciar sonido' : 'Activar sonido');
    });
    renderCounter();
    raf = requestAnimationFrame(loop);
  }

  return { init, explore, show, say, choose, sheet, end, setTime, setPlace, found, ENDINGS, fit, wait };
})();
