/* portada.js: fondo animado de la portada. La curva de mortalidad natural (pico hacia los 90) y otra, roja, que se desplaza hacia los 45 como si el andén se la
   comiera, con un electrocardiograma que se apaga y ceniza cayendo. Se detiene en cuanto empieza el juego. */
(() => {
  const cv = document.getElementById('curvabg'), start = document.getElementById('start'); if (!cv || !start) return;
  const g = cv.getContext('2d'); const t0 = performance.now(); const ash = [];
  const curve = (age, peak, wid) => Math.exp(-Math.pow((age - peak) / wid, 2) / 2);
  const size = () => { const r = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * r; cv.height = innerHeight * r; g.setTransform(r, 0, 0, r, 0, 0); };
  for (let i = 0; i < 70; i++) ash.push({ x: Math.random(), y: Math.random(), v: 0.02 + Math.random() * 0.05, s: 0.6 + Math.random() * 1.6, p: Math.random() * 6 });
  const draw = (now) => {
    if (start.style.display === 'none') return;
    const t = (now - t0) / 1000, W = innerWidth, H = innerHeight, base = H * 0.86, top = H * 0.4; g.clearRect(0, 0, W, H);
    g.strokeStyle = 'rgba(200,190,160,.05)'; g.lineWidth = 1; for (let i = 0; i <= 10; i++) { const x = W * (0.06 + 0.88 * i / 10); g.beginPath(); g.moveTo(x, top - 20); g.lineTo(x, base); g.stroke(); }
    const mix = 0.5 + 0.5 * Math.sin(t * 0.35), peakRed = 90 - 44 * mix, N = 160;
    const path = (peak, wid, fill, stroke, amp) => { g.beginPath(); for (let i = 0; i <= N; i++) { const age = i / N * 100, x = W * (0.06 + 0.88 * age / 100), y = base - (base - top) * amp * curve(age, peak, wid); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.lineTo(W * 0.94, base); g.lineTo(W * 0.06, base); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); };
    path(90, 11, 'rgba(140,140,150,.05)', 'rgba(170,170,180,.3)', 1);
    path(peakRed, 10 + 2 * mix, 'rgba(179,32,44,.12)', 'rgba(224,60,72,.6)', 0.95);
    g.fillStyle = 'rgba(201,141,58,.55)'; g.font = '12px Georgia'; g.fillText('0', W * 0.06, base + 18); g.fillText('edad', W * 0.5 - 12, base + 18); g.fillText('100', W * 0.94 - 14, base + 18);
    g.beginPath(); g.strokeStyle = 'rgba(224,48,60,' + (0.22 + 0.18 * Math.sin(t * 2)) + ')'; g.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 3) { const p = ((x / 170) + t * 0.9) % 1, y = H * 0.09 + (p < 0.08 ? -Math.sin(p / 0.08 * Math.PI) * 26 : p < 0.14 ? Math.sin((p - 0.08) / 0.06 * Math.PI) * 14 : 0); if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    g.fillStyle = 'rgba(210,190,160,.35)'; ash.forEach((a) => { a.y += a.v * 0.016; if (a.y > 1) { a.y = -0.02; a.x = Math.random(); } g.fillRect(a.x * W + Math.sin(t * 0.6 + a.p) * 14, a.y * H, a.s, a.s); });
    requestAnimationFrame(draw);
  };
  size(); addEventListener('resize', size); requestAnimationFrame(draw);
})();
