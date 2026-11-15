/* curva.js — pensamiento del andén: la curva de mortalidad real de España (INE 2024) y qué pasaría si la hora punta fuera una tabla de vida.
   Animación en tres tiempos sobre un canvas: 1) riesgo qₓ por edad, que se dibuja de izquierda a derecha y se anota; 2) a los 40-50 aparece un repunte enorme;
   3) las muertes por edad (dₓ) se desplazan desde su pico natural (~88 años) hasta los 45. Usa INE (../beta/data.js). Devuelve una promesa que se resuelve al cerrar. */
(() => {
  const Q = window.QX;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');

  Q.showMortality = () => new Promise((resolve) => {
    const T = INE.total, l = T.l;
    const qx = T.q.map((v) => v / 1000); qx[100] = 1;
    const dx = l.slice(0, 100).map((v, i) => (v - l[i + 1]) / l[0]); let rest = l[100];
    for (let k = 0; k < 10; k++) { const d = k < 9 ? rest * 0.35 : rest; dx.push(d / l[0]); rest -= d; }
    const peak = dx.indexOf(Math.max(...dx.slice(0, 100))), dmax = Math.max(...dx.slice(0, 100)) * 1.12;
    const SHIFT = peak - 45;
    const shifted = (s) => dx.map((_, x) => { const p = x + s, i = Math.floor(p), f = p - i; return (dx[i] || 0) * (1 - f) + (dx[i + 1] || 0) * f; });

    const host = document.createElement('div'); host.id = 'sheet';
    host.innerHTML = '<div class="card"><h3 id="sh-t"></h3><canvas id="sh-c" width="960" height="470"></canvas><p id="sh-cap"></p>' +
      '<div class="row"><button type="button" class="btn" id="sh-re">↻ Otra vez</button><button type="button" class="btn primary" id="sh-ok">Dejar de pensar (llega otro tren)</button></div>' +
      '<small>Fuente: INE, Tablas de mortalidad 2024 (total nacional). Las curvas de la animación son reales; el desplazamiento es una broma de andén.</small></div>';
    document.body.appendChild(host);
    const cv = host.querySelector('#sh-c'), g = cv.getContext('2d'), title = host.querySelector('#sh-t'), cap = host.querySelector('#sh-cap');
    const W = 960, H = 470, ml = 78, mr = 30, mt = 34, mb = 56, pw = W - ml - mr, ph = H - mt - mb;
    const X = (a) => ml + (a / 100) * pw;
    const LO = -5, HI = 0, Yq = (v) => mt + (1 - (Math.log10(Math.max(v, 1e-5)) - LO) / (HI - LO)) * ph, Yd = (v) => mt + (1 - v / dmax) * ph;
    const BONE = '#d6d0c2', MUTED = '#8a867c', GRID = '#1c1814', EMBER = '#e8a23a', RED = '#a3342a', CURVE = '#cfd6c4';

    function axes(xlabel, ylabel) {
      g.strokeStyle = '#3b342c'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(ml, mt); g.lineTo(ml, mt + ph); g.lineTo(ml + pw, mt + ph); g.stroke();
      g.fillStyle = MUTED; g.font = '13px Consolas, monospace'; g.textAlign = 'center';
      for (let a = 0; a <= 100; a += 10) { g.fillText(a, X(a), mt + ph + 20); g.strokeStyle = GRID; g.beginPath(); g.moveTo(X(a), mt); g.lineTo(X(a), mt + ph); g.stroke(); }
      g.font = 'italic 14px Georgia'; g.fillText(xlabel, ml + pw / 2, H - 14); g.save(); g.translate(18, mt + ph / 2); g.rotate(-Math.PI / 2); g.fillText(ylabel, 0, 0); g.restore();
    }
    function band(alpha) {
      g.save(); g.globalAlpha = alpha; g.fillStyle = 'rgba(232,162,58,.13)'; g.fillRect(X(40), mt, X(50) - X(40), ph); g.fillStyle = EMBER; g.font = 'italic 14px Georgia'; g.textAlign = 'center'; g.fillText('40-50 años · la hora punta', (X(40) + X(50)) / 2, mt + 14); g.restore();
    }
    function note(txt, a, v, ox, oy, alpha, anchor = 'left') {
      if (alpha <= 0) return; g.save(); g.globalAlpha = alpha; const x = X(a), y = Yq(v);
      g.strokeStyle = MUTED; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + ox, y + oy); g.stroke(); g.fillStyle = BONE; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
      g.font = 'italic 15px Georgia'; g.textAlign = anchor; g.fillStyle = '#b8b2a4'; g.fillText(txt, x + ox + (anchor === 'left' ? 6 : -6), y + oy + 4); g.restore();
    }
    function crowd(alpha) {                                                       // diez cabezas con cruz sobre la banda, como la gente del andén
      g.save(); g.globalAlpha = alpha;
      for (let i = 0; i < 10; i++) { const x = X(40.5 + i * 0.95), y = mt + ph - 16; g.fillStyle = '#9a9a9e'; g.strokeStyle = '#050506'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - 5, y + 1); g.lineTo(x + 5, y + 1); g.moveTo(x, y - 5); g.lineTo(x, y + 5); g.stroke(); }
      g.restore();
    }
    function viewQx(t, alpha) {
      g.save(); g.globalAlpha = alpha; axes('edad (años)', 'probabilidad de morir en el año (escala logarítmica)');
      [1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1].forEach((v) => { g.strokeStyle = GRID; g.beginPath(); g.moveTo(ml, Yq(v)); g.lineTo(ml + pw, Yq(v)); g.stroke(); g.fillStyle = MUTED; g.font = '12px Consolas, monospace'; g.textAlign = 'right'; g.fillText((v * 100 >= 1 ? Math.round(v * 100) : fmt(v * 100, v * 100 < 0.01 ? 3 : 2)) + ' %', ml - 8, Yq(v) + 4); });
      band(clamp01((t - 5.2) / 0.8));
      const p = clamp01(t / 3.6), last = Math.floor(100 * p);
      g.strokeStyle = CURVE; g.lineWidth = 3.4; g.lineJoin = 'round'; g.shadowColor = 'rgba(207,214,196,.35)'; g.shadowBlur = 8; g.beginPath();
      for (let a = 0; a <= last; a++) { const f = a === last ? 100 * p - last : 0; const v = a === last && a < 100 ? qx[a] * Math.pow(qx[a + 1] / qx[a], f) : qx[a]; a ? g.lineTo(X(a + (a === last ? f : 0)), Yq(v)) : g.moveTo(X(a), Yq(v)); }
      g.stroke(); g.shadowBlur = 0;
      const ag = 100 * p, ta = (a0) => clamp01((ag - a0) / 4);
      note('Recién nacido: 3 de cada 1.000', 0, qx[0], 34, -58, ta(0));
      note('El mínimo vital: 9-10 años', 9, qx[9], 40, 54, ta(9));
      note('La joroba de los 20: accidentes', 22, qx[22], -6, -128, ta(22));
      note('Desde aquí se duplica cada ~9 años', 62, qx[62], 26, 92, ta(62));
      note('A los 90, 1 de cada 5', 90, qx[90], -16, 70, ta(90), 'right');
      const A = 0.42 * ease(clamp01((t - 6.2) / 2.2));
      if (A > 0) {
        g.strokeStyle = EMBER; g.lineWidth = 4; g.shadowColor = 'rgba(232,162,58,.5)'; g.shadowBlur = 12; g.beginPath();
        for (let a = 0; a <= 100; a += 0.5) { const i = Math.floor(a), f = a - i, base = qx[i] * Math.pow((qx[Math.min(100, i + 1)] || 1) / qx[i], f), v = Math.min(1, base + A * Math.exp(-0.5 * Math.pow((a - 45) / 3.4, 2))); a ? g.lineTo(X(a), Yq(v)) : g.moveTo(X(a), Yq(v)); }
        g.stroke(); g.shadowBlur = 0;
        note('¡Repunte enorme! Casi 1 de cada 3', 45, Math.min(1, qx[45] + A), 58, 30, clamp01((A - 0.2) / 0.2));
        crowd(clamp01((t - 7.4) / 0.8));
      }
      g.restore();
    }
    function viewDx(t, alpha) {
      g.save(); g.globalAlpha = alpha; axes('edad (años)', 'muertes por edad (% de las muertes)');
      for (let k = 0; k <= 4; k++) { const v = (dmax / 4) * k; g.strokeStyle = GRID; g.beginPath(); g.moveTo(ml, Yd(v)); g.lineTo(ml + pw, Yd(v)); g.stroke(); g.fillStyle = MUTED; g.font = '12px Consolas, monospace'; g.textAlign = 'right'; g.fillText(fmt(v * 100, 1) + ' %', ml - 8, Yd(v) + 4); }
      band(1);
      const s = SHIFT * ease(clamp01((t - 10.6) / 4.2)), arr = shifted(s);
      const area = (a, col, al) => { g.fillStyle = col; g.globalAlpha = alpha * al; g.beginPath(); g.moveTo(X(0), Yd(0)); for (let x = 0; x <= 100; x++) g.lineTo(X(x), Yd(a[x])); g.lineTo(X(100), Yd(0)); g.closePath(); g.fill(); g.globalAlpha = alpha; };
      area(dx, '#8a9484', s > 0.3 ? 0.18 : 0.6);
      g.strokeStyle = '#8a9484'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= 100; x++) x ? g.lineTo(X(x), Yd(dx[x])) : g.moveTo(X(x), Yd(dx[x])); g.stroke();
      if (s > 0.01) { area(arr, EMBER, 0.62); g.strokeStyle = EMBER; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= 100; x++) x ? g.lineTo(X(x), Yd(arr[x])) : g.moveTo(X(x), Yd(arr[x])); g.stroke(); }
      const tot = arr.slice(0, 110).reduce((a, b) => a + b, 0), mean = arr.reduce((acc, v, a) => acc + v * (a + 0.5), 0) / tot, en45 = arr.slice(40, 51).reduce((a, b) => a + b, 0) / tot;
      g.fillStyle = '#b8b2a4'; g.font = 'italic 15px Georgia'; g.textAlign = 'left'; g.fillText('la curva natural: pico a los ' + peak + ' años', X(peak - 4) - 270, Yd(dx[peak]) + 4);
      g.textAlign = 'left'; g.fillStyle = BONE; g.font = '700 15px Consolas, monospace'; g.fillText('edad media al morir  ' + fmt(mean) + ' años', ml + 14, mt + 58); g.fillText('muertes a los 40-50  ' + fmt(en45 * 100) + ' %', ml + 14, mt + 80);
      g.restore(); return s;
    }

    let t0 = performance.now(), raf = 0, closed = false;
    function frame(now) {
      if (closed) return; const t = (now - t0) / 1000; g.fillStyle = '#050507'; g.fillRect(0, 0, W, H);
      const x = clamp01((t - 9.5) / 0.7);                                         // fundido de la vista qx a la vista dx
      if (x < 1) viewQx(t, 1 - x); if (x > 0) viewDx(t, x);
      if (t < 5.6) { title.textContent = 'La curva de mortalidad real'; cap.textContent = 'Riesgo de morir en un año, por edad, en España. Arriba un pequeño repunte al nacer, una caída enorme, una joroba en los 20 y luego una subida lenta y exponencial.'; }
      else if (t < 9.5) { title.textContent = 'Y si la hora punta fuera una tabla de mortalidad…'; cap.textContent = 'El andén está lleno de gente de 40 a 50 años. Imagina que la curva se disparara justo ahí.'; }
      else { title.textContent = '…la curva se desplazaría hasta el andén'; cap.textContent = 'Las muertes por edad viajan desde su pico natural, hacia los ' + peak + ' años, hasta los 45. Por suerte (y por Solvencia II) sigue siendo solo un tren lleno.'; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    const close = () => { if (closed) return; closed = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey, true); host.remove(); resolve(); };
    const onKey = (e) => { if (['Enter', 'Escape', 'e', 'E', ' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); close(); } };
    window.addEventListener('keydown', onKey, true);
    host.querySelector('#sh-ok').addEventListener('click', close);
    host.querySelector('#sh-re').addEventListener('click', () => { t0 = performance.now(); });
  });
})();
