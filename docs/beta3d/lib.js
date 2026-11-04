/* lib.js — utilidades y texturas procedurales (color + relieve + rugosidad). Todo se genera en el navegador. */
window.QX = window.QX || {};
(() => {
  const Q = window.QX;
  Q.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Q.lerp = (a, b, t) => a + (b - a) * t;
  Q.rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  /* ---------- Lienzos y mapas ---------- */
  function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  Q.cvs = cvs;
  function toTex(c, { srgb = true, repeat = null, aniso = 8 } = {}) {
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = aniso;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
  }
  Q.toTex = toTex;

  /* Mapa de normales a partir de un mapa de alturas (canvas en grises) */
  function normalFrom(hc, strength = 2.5) {
    const w = hc.width, h = hc.height, src = hc.getContext('2d').getImageData(0, 0, w, h).data;
    const out = cvs(w, h), og = out.getContext('2d'), img = og.createImageData(w, h), d = img.data;
    const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (H(x - 1, y) - H(x + 1, y)) * strength, dy = (H(x, y - 1) - H(x, y + 1)) * strength;
      const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      d[i] = (dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
    }
    og.putImageData(img, 0, 0);
    return out;
  }
  Q.normalFrom = normalFrom;

  /* Par color + altura (+ rugosidad opcional) con una sola función de dibujo */
  function pbr(w, h, draw, { strength = 2.5, repeat = null, rough = null } = {}) {
    const col = cvs(w, h), hei = cvs(w, h), rgh = rough ? cvs(w, h) : null;
    draw(col.getContext('2d'), hei.getContext('2d'), rgh && rgh.getContext('2d'), w, h);
    const out = { map: toTex(col, { repeat }), normalMap: toTex(normalFrom(hei, strength), { srgb: false, repeat }) };
    if (rgh) out.roughnessMap = toTex(rgh, { srgb: false, repeat });
    return out;
  }
  Q.pbr = pbr;

  function speckle(g, w, h, n, alpha, size = 1, color = '255,255,255', r = Math.random) {
    for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${color},${r() * alpha})`; g.fillRect(r() * w, r() * h, size, size); }
  }

  /* ---------- Texturas concretas ---------- */
  Q.tex = {
    wood(seed = 3) {
      const r = Q.rng(seed);
      return pbr(1024, 1024, (g, hg, rg, w, h) => {
        const rows = 8, ph = h / rows;
        hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h);
        rg.fillStyle = '#9a9a9a'; rg.fillRect(0, 0, w, h);
        for (let i = 0; i < rows; i++) {
          const y0 = i * ph, joint = r() * w, tone = 0.8 + r() * 0.35;
          g.fillStyle = `rgb(${120 * tone | 0},${84 * tone | 0},${52 * tone | 0})`; g.fillRect(0, y0, w, ph);
          for (let k = 0; k < 70; k++) {
            const y = y0 + r() * ph, len = 80 + r() * 500, x = r() * w, a = r() * 0.22;
            g.strokeStyle = `rgba(${r() < 0.5 ? '30,16,6' : '200,150,100'},${a})`; g.lineWidth = 0.6 + r() * 1.6;
            g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 5, x + len * 0.7, y + (r() - 0.5) * 5, x + len, y + (r() - 0.5) * 3); g.stroke();
            hg.strokeStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${a * 0.6})`; hg.lineWidth = 1;
            hg.beginPath(); hg.moveTo(x, y); hg.lineTo(x + len, y + (r() - 0.5) * 3); hg.stroke();
          }
          if (r() < 0.6) { const kx = r() * w, ky = y0 + ph * (0.25 + r() * 0.5); for (let q = 6; q > 0; q--) { g.strokeStyle = `rgba(40,20,8,${0.1 + q * 0.04})`; g.lineWidth = 2; g.beginPath(); g.ellipse(kx, ky, q * 6, q * 3, 0, 0, 7); g.stroke(); } }
          g.fillStyle = 'rgba(0,0,0,.65)'; g.fillRect(0, y0, w, 3); g.fillRect(joint, y0, 3, ph);
          hg.fillStyle = '#000'; hg.fillRect(0, y0, w, 4); hg.fillRect(joint, y0, 4, ph);
          rg.fillStyle = '#d0d0d0'; rg.fillRect(0, y0, w, 3);
        }
        speckle(g, w, h, 6000, 0.08, 2, '0,0,0', r);
      }, { strength: 3.2, repeat: [2.4, 2], rough: true });
    },
    paint(base = [58, 72, 104], seed = 5) {
      const r = Q.rng(seed);
      return pbr(1024, 512, (g, hg, rg, w, h) => {
        g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.011})`; g.fillRect(r() * w, 0, 6 + r() * 30, h); }       // rodillo
        for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h; const gr = g.createRadialGradient(x, y, 0, x, y, 40 + r() * 90); gr.addColorStop(0, `rgba(0,0,0,${r() * 0.12})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 150, y - 150, 300, 300); }
        const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,.45)'); v.addColorStop(0.1, 'rgba(0,0,0,0)'); v.addColorStop(0.9, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
        g.fillStyle = v; g.fillRect(0, 0, w, h);                                                                                                // oclusión en esquinas
        hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); speckle(hg, w, h, 40000, 0.5, 2, '255,255,255', r); speckle(hg, w, h, 40000, 0.5, 2, '0,0,0', r);
        speckle(g, w, h, 5000, 0.05, 2, '255,255,255', r);
        rg.fillStyle = '#e6e6e6'; rg.fillRect(0, 0, w, h);
      }, { strength: 1.1, rough: true });
    },
    fabric(base = [50, 66, 106], seed = 7, weave = 6) {
      const r = Q.rng(seed);
      return pbr(256, 256, (g, hg, rg, w, h) => {
        g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
        hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h);
        const s = w / (weave * 8);
        for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
          const o = ((x / s + y / s) % 2) ? 1 : 0;
          hg.fillStyle = o ? '#bbb' : '#555'; hg.fillRect(x, y, s, s);
          g.fillStyle = `rgba(255,255,255,${o ? 0.05 : 0})`; g.fillRect(x, y, s, s);
        }
        speckle(g, w, h, 1800, 0.12, 1, '255,255,255', r); speckle(g, w, h, 1800, 0.12, 1, '0,0,0', r);
        rg.fillStyle = '#f2f2f2'; rg.fillRect(0, 0, w, h);
      }, { strength: 2.2, rough: true });
    },
    veneer(base = [70, 46, 28], seed = 9) {
      const r = Q.rng(seed);
      return pbr(512, 1024, (g, hg, rg, w, h) => {
        g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
        hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h);
        for (let k = 0; k < 260; k++) {
          const x = r() * w, a = r() * 0.25, len = 200 + r() * 800, y = r() * h;
          g.strokeStyle = `rgba(${r() < 0.5 ? '20,10,4' : '190,140,90'},${a})`; g.lineWidth = 0.5 + r() * 1.8;
          g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (r() - 0.5) * 12, y + len * 0.3, x + (r() - 0.5) * 12, y + len * 0.7, x + (r() - 0.5) * 8, y + len); g.stroke();
          hg.strokeStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${a * 0.5})`; hg.lineWidth = 1; hg.beginPath(); hg.moveTo(x, y); hg.lineTo(x + (r() - 0.5) * 8, y + len); hg.stroke();
        }
        rg.fillStyle = '#b4b4b4'; rg.fillRect(0, 0, w, h); speckle(rg, w, h, 3000, 0.3, 2, '255,255,255', r);
      }, { strength: 2.6, rough: true });
    },
    rug(seed = 11) {
      const r = Q.rng(seed);
      return pbr(512, 512, (g, hg, rg, w, h) => {
        g.fillStyle = '#25203f'; g.fillRect(0, 0, w, h);
        g.strokeStyle = '#6b5a3a'; g.lineWidth = 10; g.strokeRect(26, 26, w - 52, h - 52);
        g.strokeStyle = '#8a3a3a'; g.lineWidth = 5; g.strokeRect(46, 46, w - 92, h - 92);
        g.fillStyle = '#3a2f5e'; g.beginPath(); g.moveTo(w / 2, 110); g.lineTo(w - 110, h / 2); g.lineTo(w / 2, h - 110); g.lineTo(110, h / 2); g.closePath(); g.fill();
        g.strokeStyle = '#b08a4a'; g.lineWidth = 3; g.stroke();
        for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(176,138,74,.5)'; g.beginPath(); g.arc(w / 2, h / 2, 14 + i * 14, 0, 7); g.stroke(); }
        hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); speckle(hg, w, h, 90000, 0.9, 2, '255,255,255', r); speckle(hg, w, h, 90000, 0.9, 2, '0,0,0', r);
        speckle(g, w, h, 30000, 0.12, 2, '255,255,255', r); speckle(g, w, h, 30000, 0.12, 2, '0,0,0', r);
        rg.fillStyle = '#fafafa'; rg.fillRect(0, 0, w, h);
      }, { strength: 2.4, rough: true });
    },
    cloth(base = [90, 96, 122], seed = 3, folds = 26) {                // prenda: trama + pliegues suaves
      const r = Q.rng(seed);
      return pbr(512, 512, (g, hg, rg, w, h) => {
        g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
        hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h);
        const soft = 'filter' in hg;
        if (soft) hg.filter = 'blur(5px)';
        for (let i = 0; i < folds; i++) {
          const x = r() * w, y = r() * h, len = 90 + r() * 240, a = (r() - 0.5) * 1.1;
          hg.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)'; hg.lineWidth = 6 + r() * 16;
          hg.beginPath(); hg.moveTo(x, y); hg.quadraticCurveTo(x + Math.sin(a) * len * 0.6 + 20, y + len * 0.5, x + Math.sin(a) * len, y + len); hg.stroke();
        }
        if (soft) hg.filter = 'none';
        for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { hg.fillStyle = ((x + y) / 4) % 2 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'; hg.fillRect(x, y, 4, 4); }
        speckle(g, w, h, 3000, 0.1, 1, '255,255,255', r); speckle(g, w, h, 3000, 0.1, 1, '0,0,0', r);
        rg.fillStyle = '#ececec'; rg.fillRect(0, 0, w, h);
      }, { strength: 3.4, repeat: [2, 2], rough: true });
    },
    leather(base = [88, 56, 34], seed = 13) {
      const r = Q.rng(seed);
      return pbr(256, 256, (g, hg, rg, w, h) => {
        g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
        hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h);
        for (let i = 0; i < 1400; i++) { const x = r() * w, y = r() * h, rr = 2 + r() * 5; hg.strokeStyle = `rgba(0,0,0,${0.2 + r() * 0.3})`; hg.beginPath(); hg.arc(x, y, rr, 0, 7); hg.stroke(); }
        speckle(g, w, h, 2200, 0.15, 1, '0,0,0', r); speckle(g, w, h, 1500, 0.12, 1, '255,220,170', r);
        rg.fillStyle = '#9c9c9c'; rg.fillRect(0, 0, w, h);
      }, { strength: 2.0, rough: true });
    },
    cordura(base = [16, 17, 22], seed = 15) {           // mochila: tejido técnico
      const r = Q.rng(seed);
      return pbr(256, 256, (g, hg, rg, w, h) => {
        g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, w, h);
        hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { const o = ((x + y) / 4) % 2; hg.fillStyle = o ? '#c8c8c8' : '#484848'; hg.fillRect(x, y, 4, 4); }
        speckle(g, w, h, 2500, 0.1, 1, '255,255,255', r);
        rg.fillStyle = '#d8d8d8'; rg.fillRect(0, 0, w, h);
      }, { strength: 2.8, rough: true });
    },
  };

  /* ---------- Carteles, cuadros, lomos de libros ---------- */
  Q.art = {
    mortalityPoster() {
      const c = cvs(512, 720), g = c.getContext('2d');
      g.fillStyle = '#e9e2d0'; g.fillRect(0, 0, 512, 720);
      g.fillStyle = '#1a2440'; g.font = '700 38px Georgia'; g.textAlign = 'center'; g.fillText('TABLA DE VIDA', 256, 80);
      g.font = 'italic 20px Georgia'; g.fillStyle = '#4a4a55'; g.fillText('lₓ — supervivientes de 100.000', 256, 112);
      g.strokeStyle = '#b8b09a'; g.lineWidth = 1;
      for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(60, 160 + i * 44); g.lineTo(452, 160 + i * 44); g.stroke(); }
      g.strokeStyle = '#b3342a'; g.lineWidth = 4; g.beginPath();
      const l = (x) => 1 / (1 + Math.exp((x - 87) / 7)) * (1 - Math.exp(-x * 0.3) * 0.02);
      for (let x = 0; x <= 100; x++) { const px = 60 + x * 3.92, py = 600 - l(x) * 440; if (x) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
      g.fillStyle = '#1a2440'; g.font = '16px Georgia'; for (let x = 0; x <= 100; x += 20) g.fillText(String(x), 60 + x * 3.92, 640);
      g.font = 'italic 17px Georgia'; g.fillStyle = '#4a4a55'; g.fillText('e₀ = Σ lₓ / l₀', 256, 690);
      return toTex(c);
    },
    cityPrint() {
      const c = cvs(512, 384), g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 384); gr.addColorStop(0, '#1b2a5a'); gr.addColorStop(0.7, '#c4603c'); gr.addColorStop(1, '#ffb070'); g.fillStyle = gr; g.fillRect(0, 0, 512, 384);
      const r = Q.rng(4);
      for (let i = 0; i < 18; i++) { const x = i * 30 - 10, h = 90 + r() * 190; g.fillStyle = `rgb(${12 + r() * 14},${12 + r() * 14},${24 + r() * 18})`; g.fillRect(x, 384 - h, 34, h); for (let k = 0; k < 14; k++) { if (r() < 0.45) { g.fillStyle = '#ffd48a'; g.fillRect(x + 4 + r() * 22, 384 - h + 8 + r() * (h - 20), 3, 4); } } }
      return toTex(c);
    },
    photo() {
      const c = cvs(256, 320), g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#8aa4c8'); gr.addColorStop(1, '#3a5a3a'); g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
      g.fillStyle = '#c4906c'; g.beginPath(); g.arc(90, 150, 32, 0, 7); g.fill(); g.beginPath(); g.arc(170, 160, 30, 0, 7); g.fill();
      g.fillStyle = '#2a2a38'; g.fillRect(55, 185, 70, 140); g.fillStyle = '#7a3a5a'; g.fillRect(135, 192, 70, 130);
      g.fillStyle = '#1c120b'; g.beginPath(); g.arc(90, 134, 30, Math.PI, 0); g.fill(); g.fillStyle = '#120c08'; g.beginPath(); g.arc(170, 142, 31, Math.PI, 0); g.fill();
      return toTex(c);
    },
    spine(title, color, seed) {
      const c = cvs(64, 256), g = c.getContext('2d'), r = Q.rng(seed);
      g.fillStyle = color; g.fillRect(0, 0, 64, 256);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, 6, 256);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(58, 0, 6, 256);
      g.fillStyle = r() < 0.5 ? '#e8d9a0' : '#e8ecf3'; g.save(); g.translate(40, 128); g.rotate(-Math.PI / 2); g.font = '600 24px Georgia'; g.textAlign = 'center'; g.fillText(title, 0, 0); g.restore();
      g.fillStyle = '#d8c070'; g.fillRect(8, 20, 48, 3); g.fillRect(8, 232, 48, 3);
      return toTex(c);
    },
  };

  /* ---------- Geometrías ---------- */
  Q.rbox = (w, h, d, r = 0.01, seg = 3) => {
    r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
    const iw = w - 2 * r, ih = h - 2 * r, s = new THREE.Shape(), k = Math.min(r, iw / 2, ih / 2);
    s.moveTo(-iw / 2 + k, -ih / 2); s.lineTo(iw / 2 - k, -ih / 2); s.quadraticCurveTo(iw / 2, -ih / 2, iw / 2, -ih / 2 + k);
    s.lineTo(iw / 2, ih / 2 - k); s.quadraticCurveTo(iw / 2, ih / 2, iw / 2 - k, ih / 2);
    s.lineTo(-iw / 2 + k, ih / 2); s.quadraticCurveTo(-iw / 2, ih / 2, -iw / 2, ih / 2 - k);
    s.lineTo(-iw / 2, -ih / 2 + k); s.quadraticCurveTo(-iw / 2, -ih / 2, -iw / 2 + k, -ih / 2);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: seg, curveSegments: 4 });
    g.translate(0, 0, -(d - 2 * r) / 2);
    return g;
  };
  /* Los perfiles se recorren siempre de abajo arriba: así las normales salen hacia fuera */
  Q.lathe = (pts, seg = 32) => { const p = pts[0][1] > pts[pts.length - 1][1] ? pts.slice().reverse() : pts; return new THREE.LatheGeometry(p.map(([x, y]) => new THREE.Vector2(x, y)), seg); };
  Q.fold = (w, h, sx, sy, fn) => {
    const g = new THREE.PlaneGeometry(w, h, sx, sy), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i) / w + 0.5, v = p.getY(i) / h + 0.5; p.setZ(i, fn(u, v)); }
    g.computeVertexNormals(); return g;
  };
  Q.cable = (pts, r = 0.004) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))), 40, r, 6, false);
  Q.mat = (color, rough = 0.85, metal = 0, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, extra));
})();
