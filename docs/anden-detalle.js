/* anden-detalle.js — materiales PBR con relieve y decoración densa del andén: baldosa gastada, azulejo con mugre, hormigón con encofrado,
   pavimento podotáctil, instalaciones de techo, vía con balasto, máquina expendedora, mapa de líneas, señales, suciedad y polvo en el aire. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;
  const R2 = Math.PI * 2;

  /* ============================== Texturas ============================== */
  Q.platformTextures = () => {
    const D = {};
    /* Baldosa gris de andén: junta con relieve, terrazo, caminos de desgaste, manchas, chicles y grietas */
    D.floor = Q.pbr(512, 512, (g, hg, rg, w, h) => {
      const r = Q.rng(11);
      g.fillStyle = '#7f827e'; g.fillRect(0, 0, w, h); hg.fillStyle = '#2c2c2c'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#c8c8c8'; rg.fillRect(0, 0, w, h);
      for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) {
        const k = 0.92 + r() * 0.14, x = tx * 128 + 3, y = ty * 128 + 3;
        g.fillStyle = `rgb(${176 * k | 0},${178 * k | 0},${174 * k | 0})`; g.fillRect(x, y, 122, 122);
        hg.fillStyle = '#9a9a9a'; hg.fillRect(x, y, 122, 122); hg.fillStyle = '#b4b4b4'; hg.fillRect(x + 3, y + 3, 116, 116);
        rg.fillStyle = `rgb(${70 + r() * 50 | 0},${70 + r() * 50 | 0},${70 + r() * 50 | 0})`; rg.fillRect(x, y, 122, 122);
      }
      for (let i = 0; i < 6000; i++) { const px = r() * w, py = r() * h, d = r() < 0.5; g.fillStyle = d ? `rgba(40,40,38,${r() * 0.22})` : `rgba(240,240,232,${r() * 0.25})`; g.fillRect(px, py, 1 + r() * 2.2, 1 + r() * 2.2); hg.fillStyle = `rgba(${d ? 40 : 210},${d ? 40 : 210},${d ? 40 : 210},.5)`; hg.fillRect(px, py, 1.5, 1.5); }
      for (let i = 0; i < 5; i++) { const x = r() * w, y = r() * h, rad = 60 + r() * 100, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(96,98,90,.20)'); gr.addColorStop(1, 'rgba(96,98,90,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        const rr = rg.createRadialGradient(x, y, 0, x, y, rad); rr.addColorStop(0, 'rgba(30,30,30,.6)'); rr.addColorStop(1, 'rgba(30,30,30,0)'); rg.fillStyle = rr; rg.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h, rad = 14 + r() * 34, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(60,56,46,.38)'); gr.addColorStop(1, 'rgba(60,56,46,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      for (let i = 0; i < 14; i++) { const x = r() * w, y = r() * h, s = 2 + r() * 3; g.fillStyle = '#3a3a36'; g.beginPath(); g.ellipse(x, y, s, s * 0.8, r() * 3, 0, R2); g.fill(); hg.fillStyle = '#d0d0d0'; hg.beginPath(); hg.ellipse(x, y, s, s * 0.8, 0, 0, R2); hg.fill(); }
      for (let i = 0; i < 3; i++) { let x = r() * w, y = r() * h; g.strokeStyle = 'rgba(40,40,38,.7)'; hg.strokeStyle = '#000'; g.lineWidth = 1.2; hg.lineWidth = 2.2; g.beginPath(); hg.beginPath(); g.moveTo(x, y); hg.moveTo(x, y);
        for (let j = 0; j < 8; j++) { x += (r() - 0.4) * 22; y += (r() - 0.5) * 22; g.lineTo(x, y); hg.lineTo(x, y); } g.stroke(); hg.stroke(); }
    }, { strength: 2.2, repeat: [7.67, 1.92], rough: true });

    /* Pavimento podotáctil amarillo: cúpulas con relieve (cada 6 cm) */
    D.tactile = Q.pbr(256, 256, (g, hg, rg) => {
      g.fillStyle = '#5a5d5a'; g.fillRect(0, 0, 256, 256); hg.fillStyle = '#3a3a3a'; hg.fillRect(0, 0, 256, 256); rg.fillStyle = '#b0b0b0'; rg.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const x = 16 + i * 32, y = 16 + j * 32;
        const a = g.createRadialGradient(x - 3, y - 3, 1, x, y, 13); a.addColorStop(0, '#a4a7a3'); a.addColorStop(1, '#4c4f4c'); g.fillStyle = a; g.beginPath(); g.arc(x, y, 12, 0, R2); g.fill();
        const b = hg.createRadialGradient(x, y, 0, x, y, 13); b.addColorStop(0, '#ffffff'); b.addColorStop(1, '#3a3a3a'); hg.fillStyle = b; hg.beginPath(); hg.arc(x, y, 13, 0, R2); hg.fill(); }
      const r = Q.rng(4); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.18})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
    }, { strength: 4.5, repeat: [36.8, 1], rough: true });

    /* Pared: azulejo biselado con mugre, cenefa y pintura desconchada arriba (4,6 m × 3,3 m por repetición) */
    D.wall = Q.pbr(1024, 740, (g, hg, rg, w, h) => {
      const r = Q.rng(23), pm = 224;                                                      // 224 px por metro; el origen (arriba) es el techo (3,3 m)
      g.fillStyle = '#76776f'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#d4d4d4'; rg.fillRect(0, 0, w, h);
      for (let i = 0; i < 12000; i++) { const x = r() * w, y = r() * 168, d = r() < 0.5; g.fillStyle = d ? `rgba(0,0,0,${r() * 0.16})` : `rgba(200,200,190,${r() * 0.1})`; g.fillRect(x, y, 2, 2); }   // hormigón
      for (let x = 0; x <= w; x += 256) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x, 0, 3, 168); hg.fillStyle = '#404040'; hg.fillRect(x, 0, 4, 168); }
      g.fillStyle = '#b5261d'; g.fillRect(0, 168, w, 56); g.fillStyle = '#d4392d'; g.fillRect(0, 168, w, 5); g.fillStyle = '#7e1a14'; g.fillRect(0, 219, w, 5); hg.fillStyle = '#b0b0b0'; hg.fillRect(0, 168, w, 56); rg.fillStyle = '#6a6a6a'; rg.fillRect(0, 168, w, 56);   // franja roja
      const gp = g.createLinearGradient(0, 224, 0, 672); gp.addColorStop(0, '#dedbd0'); gp.addColorStop(1, '#c9c6bb'); g.fillStyle = gp; g.fillRect(0, 224, w, 448); hg.fillStyle = '#909090'; hg.fillRect(0, 224, w, 448); rg.fillStyle = '#7a7a7a'; rg.fillRect(0, 224, w, 448);   // paneles blancos
      for (let x = 0; x <= w; x += 256) { g.fillStyle = 'rgba(70,68,60,.55)'; g.fillRect(x, 224, 3, 448); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 3, 224, 2, 448); hg.fillStyle = '#303030'; hg.fillRect(x - 1, 224, 6, 448); }
      for (let i = 0; i < 16; i++) { const x = r() * w, gr = g.createLinearGradient(x, 224, x + 4, 672); gr.addColorStop(0, 'rgba(60,54,44,0)'); gr.addColorStop(1, 'rgba(60,54,44,.2)'); g.fillStyle = gr; g.fillRect(x, 224, 3 + r() * 10, 448); }   // regueros
      for (let i = 0; i < 60; i++) { const x = r() * w, y = 300 + r() * 360; g.fillStyle = `rgba(60,58,50,${0.1 + r() * 0.2})`; g.fillRect(x, y, 6 + r() * 26, 1.5 + r() * 2.5); }   // roces
      const gb = g.createLinearGradient(0, 520, 0, 672); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(30,26,20,.34)'); g.fillStyle = gb; g.fillRect(0, 520, w, 152);
      g.fillStyle = '#34363a'; g.fillRect(0, 672, w, 68); g.fillStyle = '#4a4d52'; g.fillRect(0, 672, w, 4); hg.fillStyle = '#707070'; hg.fillRect(0, 672, w, 68); rg.fillStyle = '#9a9a9a'; rg.fillRect(0, 672, w, 68);   // zócalo oscuro
    }, { strength: 2.6, repeat: [4, 1], rough: true });

    /* Hormigón con encofrado, orificios de atirantado, manchas y óxido */
    D.concrete = (rx, ry, seed = 5) => Q.pbr(512, 512, (g, hg, rg, w, h) => {
      const r = Q.rng(seed);
      g.fillStyle = '#85867f'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#d4d4d4'; rg.fillRect(0, 0, w, h);
      for (let i = 0; i < 14000; i++) { const x = r() * w, y = r() * h, d = r() < 0.5; g.fillStyle = d ? `rgba(0,0,0,${r() * 0.18})` : `rgba(190,190,180,${r() * 0.1})`; g.fillRect(x, y, 1 + r() * 2.2, 1 + r() * 2.2); hg.fillStyle = `rgba(${d ? 30 : 220},${d ? 30 : 220},${d ? 30 : 220},.35)`; hg.fillRect(x, y, 1.6, 1.6); }
      g.strokeStyle = 'rgba(0,0,0,.4)'; hg.strokeStyle = '#303030'; g.lineWidth = 2; hg.lineWidth = 3; for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); hg.beginPath(); hg.moveTo(x, 0); hg.lineTo(x, h); hg.stroke(); }
      for (let y = 64; y < h; y += 128) for (let x = 32; x < w; x += 128) { g.fillStyle = '#141414'; g.beginPath(); g.arc(x, y, 5, 0, R2); g.fill(); hg.fillStyle = '#101010'; hg.beginPath(); hg.arc(x, y, 6, 0, R2); hg.fill(); }
      for (let i = 0; i < 8; i++) { const x = r() * w, gr = g.createLinearGradient(x, 0, x + 4, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(20,18,14,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, 0, 6 + r() * 14, h); }
      for (let i = 0; i < 3; i++) { const x = r() * w, y = r() * h * 0.6, gr = g.createLinearGradient(x, y, x, y + 190); gr.addColorStop(0, 'rgba(120,64,30,.45)'); gr.addColorStop(1, 'rgba(120,64,30,0)'); g.fillStyle = gr; g.fillRect(x, y, 5, 190); }   // óxido
    }, { strength: 3.0, repeat: [rx, ry], rough: true });
    D.column = Q.pbr(256, 660, (g, hg, rg, w, h) => {                                    // columna blanca con tope rojo y capitel de hormigón (200 px/m)
      const r = Q.rng(7);
      g.fillStyle = '#76776f'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#d4d4d4'; rg.fillRect(0, 0, w, h);
      g.fillStyle = '#b5261d'; g.fillRect(0, 150, w, 50); g.fillStyle = '#d4392d'; g.fillRect(0, 150, w, 4); g.fillStyle = '#7e1a14'; g.fillRect(0, 196, w, 4); rg.fillStyle = '#6a6a6a'; rg.fillRect(0, 150, w, 50);
      g.fillStyle = '#dcd9ce'; g.fillRect(0, 200, w, 420); rg.fillStyle = '#7a7a7a'; rg.fillRect(0, 200, w, 420); g.fillStyle = '#34363a'; g.fillRect(0, 620, w, 40); rg.fillStyle = '#9a9a9a'; rg.fillRect(0, 620, w, 40);
      for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 0 : 200},${r() < 0.5 ? 0 : 200},${r() < 0.5 ? 0 : 190},${r() * 0.08})`; g.fillRect(r() * w, r() * h, 2, 2); }
      const gb = g.createLinearGradient(0, 480, 0, 620); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(30,26,20,.35)'); g.fillStyle = gb; g.fillRect(0, 480, w, 140);
      for (let i = 0; i < 25; i++) { g.fillStyle = `rgba(60,58,50,${0.1 + r() * 0.25})`; g.fillRect(r() * w, 260 + r() * 340, 4 + r() * 24, 1.5 + r() * 2); }
    }, { strength: 2.2, rough: true });
    return D;
  };

  /* ============================== Decoración ============================== */
  Q.decoratePlatform = (W, c) => {
    const { scene, root, rnd, std, emis, put, act, ellipsoid, slab, paint, ramp, inkMat } = c;
    const toTex = Q.toTex, cvs = Q.cvs;
    const R = Q.rng(404);
    const grp = (x = 0, y = 0, z = 0, parent = root) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
    const bx = (w, h, d, x, y, z, ry = 0, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); return g.translate(x, y, z); };
    const cy = (rt, rb, h, x, y, z, axis = 'y', seg = 10) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); if (axis === 'x') g.rotateZ(Math.PI / 2); if (axis === 'z') g.rotateX(Math.PI / 2); return g.translate(x, y, z); };
    const merged = (parts, m, parent = root, cast = false) => { const o = new THREE.Mesh(MG.mergeBufferGeometries(parts), m); o.castShadow = cast; parent.add(o); return o; };
    const cv = (w, h) => { const k = cvs(w, h); return [k, k.getContext('2d')]; };
    const tx = (k) => toTex(k);
    const metal = std(0x2a2d2f, 0.45, { metalness: 0.7 }), galv = std(0x777c7e, 0.35, { metalness: 0.85 }), black = std(0x0c0d0e, 0.6, { metalness: 0.3 });

    /* ---------- techo: bandejas de cables, tuberías, conductos, focos, cámaras, megafonía ---------- */
    { const p = [], cab = [];
      [-0.2, 2.7].forEach((z) => { p.push(bx(18.2, 0.035, 0.34, 0, 3.17, z)); p.push(bx(18.2, 0.09, 0.025, 0, 3.2, z - 0.16), bx(18.2, 0.09, 0.025, 0, 3.2, z + 0.16));
        for (let x = -9; x < 9; x += 0.3) p.push(bx(0.02, 0.012, 0.32, x, 3.19, z));
        for (let x = -8.5; x < 9; x += 2.2) p.push(bx(0.03, 0.15, 0.03, x, 3.25, z - 0.14), bx(0.03, 0.15, 0.03, x, 3.25, z + 0.14));
        for (let i = 0; i < 4; i++) cab.push(cy(0.012 + R() * 0.01, 0.012, 18, 0, 3.205 + i * 0.006, z - 0.11 + i * 0.07, 'x', 6)); });
      merged(p, galv); merged(cab, black);
      const pipes = [], fire = [], br = [];
      pipes.push(cy(0.075, 0.075, 18.2, 0, 3.12, 0.95, 'x', 14), cy(0.05, 0.05, 18.2, 0, 3.2, 1.2, 'x', 12)); fire.push(cy(0.05, 0.05, 18.2, 0, 3.08, 1.45, 'x', 12));
      for (let x = -8.6; x < 9; x += 1.9) { br.push(bx(0.04, 0.14, 0.7, x, 3.2, 1.2)); pipes.push(cy(0.095, 0.095, 0.05, x + 0.4, 3.12, 0.95, 'x', 14), cy(0.095, 0.095, 0.05, x - 2, 3.12, 0.95, 'x', 14)); }
      merged(pipes, galv); merged(fire, std(0x8c2a22, 0.5, { metalness: 0.3 })); merged(br, metal);
      const duct = [bx(18.2, 0.4, 0.7, 0, 3.05, -1.95)]; for (let x = -9; x < 9.2; x += 2) duct.push(bx(0.06, 0.46, 0.78, x, 3.05, -1.95));
      merged(duct, std(0x5a5f60, 0.5, { metalness: 0.75 }));
      const lamps = []; lamps.push(bx(17.8, 0.07, 0.3, 0, 3.235, 1.5), bx(17.8, 0.02, 0.03, 0, 3.15, 1.35), bx(17.8, 0.02, 0.03, 0, 3.15, 1.65));
      merged(lamps, metal);
      const smoke = [], cam = [], spk = []; [-7.2, -3, 3, 7.2].forEach((x) => smoke.push(cy(0.07, 0.075, 0.03, x, 3.28, 0.2, 'y', 16), cy(0.02, 0.02, 0.012, x, 3.26, 0.2, 'y', 8)));
      merged(smoke, std(0xd8d8d0, 0.5));
      [[-8.6, 3.0, 3.3], [8.6, 3.0, 3.3], [0, 3.1, -0.6]].forEach(([x, y, z]) => { const g = grp(x, y, z); g.rotation.y = x < 0 ? -0.5 : x > 0 ? 0.5 : 0; put(new THREE.BoxGeometry(0.1, 0.1, 0.22), metal, 0, 0, 0, g); put(new THREE.SphereGeometry(0.06, 14, 10), black, 0, -0.04, -0.12, g); put(new THREE.CircleGeometry(0.018, 10), emis(0xff2a1a, 1.4), 0, -0.04, -0.181, g).rotation.y = Math.PI; });
      [-5, 5].forEach((x) => { const g = grp(x, 3.0, 0.9); put(new THREE.CylinderGeometry(0.045, 0.14, 0.2, 14, 1, true), metal, 0, 0, 0, g); put(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 14), black, 0, -0.1, 0, g); put(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), metal, 0, 0.2, 0, g); });
      const exitC = cv(256, 96); { const g = exitC[1]; g.fillStyle = '#0c2a14'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#7dffa3'; g.font = '700 44px Arial'; g.textAlign = 'center'; g.fillText('SALIDA  ↑', 128, 62); g.strokeStyle = '#7dffa3'; g.lineWidth = 4; g.strokeRect(5, 5, 246, 86); }
      const exitT = tx(exitC[0]); [[-8.5, 2.95, 3.3, 0], [8.5, 2.95, 3.3, 0]].forEach(([x, y, z]) => { const g = grp(x, y, z); put(new THREE.BoxGeometry(0.62, 0.24, 0.07), black, 0, 0, 0, g); [-1, 1].forEach((s) => put(new THREE.PlaneGeometry(0.56, 0.2), new THREE.MeshBasicMaterial({ map: exitT, toneMapped: false }), 0, 0, 0.037 * s, g).rotation.y = s < 0 ? Math.PI : 0); put(new THREE.CylinderGeometry(0.006, 0.006, 0.35, 6), metal, 0, 0.29, 0, g); const l = new THREE.PointLight(0x4dff88, 0.28, 3.2, 2); l.position.set(0, -0.1, 0); g.add(l); }); }

    /* ---------- pared del fondo: zócalo, carteles, mapa de líneas, extintor, armario eléctrico, tablón, grafiti, manchas ---------- */
    const wallZ = 3.585;
    { const wall = grp(0, 0, wallZ); wall.rotation.y = Math.PI;                       // eje local +z = hacia el andén (-z real); x invertida
      const L = (x) => -x;                                                         // convierte x del andén a x local
      put(new THREE.BoxGeometry(18.4, 0.14, 0.04), std(0x151716, 0.7), 0, 0.07, 0.02, wall);                                       // zócalo
      const sign = (x, y, w, h, l1, l2, col) => { const [k, g] = cv(512, 128); g.fillStyle = col; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#d6d0c2'; g.lineWidth = 4; g.strokeRect(6, 6, 500, 116); g.fillStyle = '#d6d0c2'; g.textAlign = 'center'; g.font = '700 38px Arial'; g.fillText(l1, 256, 56); g.font = '26px Arial'; g.fillStyle = '#b8b2a4'; g.fillText(l2, 256, 98);
        const m = put(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx(k), roughness: 0.4, metalness: 0.2 }), L(x), y, 0.03, wall); put(new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.02), metal, L(x), y, 0.012, wall); return m; };
      sign(-4.4, 2.62, 1.5, 0.4, 'ASAMBLEA DE MADRID', 'ENTREVÍAS · C-2  C-7  C-8', '#2b2e31'); sign(4.4, 2.62, 1.5, 0.4, 'Salida', '↖ escaleras y ascensor', '#2b2e31');
      { const [k, g] = cv(1024, 512); g.fillStyle = '#0d1311'; g.fillRect(0, 0, 1024, 512); g.fillStyle = '#d6d0c2'; g.font = '700 40px Arial'; g.textAlign = 'left'; g.fillText('CERCANÍAS · C-2 C-7 C-8', 40, 66); g.strokeStyle = '#a3342a'; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(60, 260); g.lineTo(960, 260); g.stroke();
        const st = ['Alcalá', 'Vicálvaro', 'Vallecas', 'Entrevías', 'Atocha', 'Recoletos', 'N. Ministerios']; st.forEach((n, i) => { const x = 60 + i * 150; g.fillStyle = i === 3 ? '#e8a23a' : '#d6d0c2'; g.beginPath(); g.arc(x, 260, i === 3 ? 17 : 12, 0, R2); g.fill(); g.strokeStyle = '#0d1311'; g.lineWidth = 4; g.stroke(); g.save(); g.translate(x, 232); g.rotate(-0.5); g.fillStyle = '#b8b2a4'; g.font = '22px Arial'; g.textAlign = 'left'; g.fillText(n, 6, 0); g.restore(); });
        g.fillStyle = '#e8a23a'; g.font = 'italic 24px Georgia'; g.fillText('Usted está aquí', 60 + 3 * 150 - 70, 340); g.fillStyle = '#8a867c'; g.font = '20px Arial'; g.fillText('Hora punta: trenes cada 6 min · ocupación 190 %', 40, 450);
        put(new THREE.PlaneGeometry(2.3, 1.15), new THREE.MeshStandardMaterial({ map: tx(k), roughness: 0.3, metalness: 0.1, emissive: 0x222222, emissiveMap: tx(k) }), 0, 1.7, 0.035, wall); put(new THREE.BoxGeometry(2.4, 1.25, 0.03), metal, 0, 1.7, 0.015, wall); }
      { const g = grp(L(1.8), 0, 0.12, wall); put(new THREE.BoxGeometry(0.34, 0.62, 0.2), std(0x8c2a22, 0.45), 0, 1.1, 0, g); put(new THREE.PlaneGeometry(0.22, 0.34), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.15, metalness: 0.3 }), 0, 1.12, 0.103, g); put(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 14), std(0xa02a20, 0.35, { metalness: 0.5 }), 0, 1.1, 0.04, g); put(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), black, 0, 1.36, 0.04, g); }          // extintor
      { const g = grp(L(-8.3), 0, 0.14, wall); put(new THREE.BoxGeometry(0.95, 1.45, 0.26), std(0x4d5456, 0.5, { metalness: 0.6 }), 0, 1.0, 0, g); [-0.3, 0.3].forEach((x) => { put(new THREE.BoxGeometry(0.4, 1.3, 0.02), metal, x, 1.0, 0.135, g); put(new THREE.BoxGeometry(0.03, 0.14, 0.03), black, x * 0.6, 1.0, 0.16, g); });
        for (let i = 0; i < 4; i++) put(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 8), galv, -0.3 + i * 0.2, 2.5, -0.02, g); put(new THREE.PlaneGeometry(0.26, 0.2), new THREE.MeshBasicMaterial({ color: 0xe8c23a }), 0, 1.6, 0.14, g); }          // armario eléctrico + cables
      { const g = grp(L(-4.4), 0, 0.12, wall); const [k, c2] = cv(256, 330); c2.fillStyle = '#6a4a2a'; c2.fillRect(0, 0, 256, 330); c2.fillStyle = '#7a5a36'; c2.fillRect(10, 10, 236, 310);
        for (let i = 0; i < 11; i++) { const px = 20 + R() * 150, py = 20 + R() * 220, pw = 50 + R() * 60, ph = 60 + R() * 50; c2.save(); c2.translate(px + pw / 2, py + ph / 2); c2.rotate((R() - 0.5) * 0.14); c2.fillStyle = ['#d8d2c0', '#c9c2a8', '#b8c0b0', '#cfc8b4'][i % 4]; c2.fillRect(-pw / 2, -ph / 2, pw, ph); c2.fillStyle = '#2a2a2a'; for (let j = 0; j < 7; j++) c2.fillRect(-pw / 2 + 5, -ph / 2 + 8 + j * 7, pw * (0.5 + R() * 0.4), 2); c2.fillStyle = '#a3342a'; c2.beginPath(); c2.arc(0, -ph / 2 + 2, 3, 0, R2); c2.fill(); c2.restore(); }
        put(new THREE.PlaneGeometry(0.85, 1.1), new THREE.MeshStandardMaterial({ map: tx(k), roughness: 0.7 }), 0, 1.35, 0.025, g); put(new THREE.BoxGeometry(0.95, 1.2, 0.03), std(0x2a1d12, 0.6), 0, 1.35, 0.012, g); }                                    // tablón de anuncios
      const decal = (x, y, w, h, draw, z = 0.012) => { const [k, g] = cv(512, Math.round(512 * h / w)); draw(g, 512, Math.round(512 * h / w)); const m = new THREE.MeshBasicMaterial({ map: tx(k), transparent: true, depthWrite: false }); put(new THREE.PlaneGeometry(w, h), m, L(x), y, z, wall); };
      decal(-7.3, 0.85, 1.7, 0.9, (g, w, h) => { g.strokeStyle = '#8a3f3a'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(40, h * 0.7); g.bezierCurveTo(100, 20, 180, h * 0.9, 240, h * 0.3); g.bezierCurveTo(300, -20, 380, h * 0.95, 470, h * 0.4); g.stroke(); g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.stroke(); });   // pintada
      [-1.5, 3.2, 7.4].forEach((x, i) => decal(x, 1.4, 1.2, 2.0, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(10,8,5,.5)'); gr.addColorStop(1, 'rgba(10,8,5,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(w * 0.35, 0); g.lineTo(w * 0.65, 0); g.lineTo(w * (0.7 + i * 0.05), h); g.lineTo(w * 0.3, h); g.fill(); }, 0.008));   // manchas de humedad
      [-9.0, 9.0].forEach((x, i) => { const g = grp(L(x * 0.97), 0, 0.2, wall); put(new THREE.BoxGeometry(0.5, 0.22, 0.26), metal, 0, 0.9, 0, g); put(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshBasicMaterial({ color: i ? 0x3affb0 : 0xffb03a, toneMapped: false }), 0, 0.9, 0.135, g); });          // balizas
    }

    /* ---------- máquina expendedora (con luz propia) ---------- */
    { const g = grp(0, 0, 3.4); g.position.x = 4.4; const [k, c2] = cv(256, 512); c2.fillStyle = '#10151a'; c2.fillRect(0, 0, 256, 512); c2.fillStyle = '#1d2a36'; c2.fillRect(8, 8, 240, 340);
      const cols = ['#a3342a', '#c27a3c', '#5a7a4a', '#4a6a8a', '#8a6a9a', '#b8a24a']; for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) { const x = 18 + q * 58, y = 18 + r * 54; c2.fillStyle = 'rgba(255,255,255,.07)'; c2.fillRect(x, y + 40, 52, 3); c2.fillStyle = cols[(r * 3 + q * 2) % 6]; c2.fillRect(x + 6, y + 8, 36, 30); c2.fillStyle = 'rgba(0,0,0,.35)'; c2.fillRect(x + 6, y + 8, 36, 5); }
      c2.fillStyle = '#0a0a0a'; c2.fillRect(8, 360, 240, 130); c2.fillStyle = '#7dffa3'; c2.font = '700 22px Consolas'; c2.fillText('1,80 €', 22, 392); c2.fillStyle = '#2a2f33'; for (let i = 0; i < 12; i++) c2.fillRect(22 + (i % 4) * 28, 404 + Math.floor(i / 4) * 24, 22, 18); c2.fillStyle = '#050505'; c2.fillRect(170, 384, 60, 10); c2.fillRect(176, 440, 52, 36);
      put(new THREE.BoxGeometry(1.05, 1.95, 0.8), std(0x23262a, 0.4, { metalness: 0.6 }), 0, 0.975, 0, g);
      put(new THREE.PlaneGeometry(0.95, 1.8), new THREE.MeshStandardMaterial({ map: tx(k), emissive: 0xffffff, emissiveMap: tx(k), emissiveIntensity: 0.9, roughness: 0.25 }), 0, 0.98, -0.402, g).rotation.y = Math.PI;
      const l = new THREE.PointLight(0x6fb0ff, 0.9, 4.2, 2); l.position.set(0, 1.0, -0.9); g.add(l); act(g, 'maquina'); W.obst.push({ minX: 3.85, maxX: 4.95, minZ: 2.95, maxZ: 3.6 }); }

    /* ---------- reloj analógico colgado (marca la hora de la escena) ---------- */
    { const g = grp(2.35, 2.62, 0.2); put(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), metal, 0, 0.5, 0, g);
      [-1, 1].forEach((s) => { const [k, c2] = cv(256, 256); c2.fillStyle = '#e8e2d0'; c2.beginPath(); c2.arc(128, 128, 122, 0, R2); c2.fill(); c2.strokeStyle = '#111'; c2.lineWidth = 8; c2.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * R2; c2.lineWidth = i % 3 ? 3 : 7; c2.beginPath(); c2.moveTo(128 + Math.sin(a) * 104, 128 - Math.cos(a) * 104); c2.lineTo(128 + Math.sin(a) * 118, 128 - Math.cos(a) * 118); c2.stroke(); }
        put(new THREE.CircleGeometry(0.17, 28), new THREE.MeshStandardMaterial({ map: tx(k), roughness: 0.4 }), 0, 0, 0.046 * s, g).rotation.y = s < 0 ? Math.PI : 0; });
      put(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 28), black, 0, 0, 0, g).rotation.x = Math.PI / 2;
      const hands = [0, 1].map((i) => { const gg = grp(0, 0, 0, g); put(new THREE.BoxGeometry(0.012, i ? 0.15 : 0.1, 0.01), black, 0, (i ? 0.15 : 0.1) / 2, 0.055, gg); put(new THREE.BoxGeometry(0.012, i ? 0.15 : 0.1, 0.01), black, 0, (i ? 0.15 : 0.1) / 2, -0.055, gg); return gg; });
      W.tick.push(() => { const m = /(\d+):(\d+)/.exec(W.timeStr || '06:25'); if (!m) return; const hh = +m[1] % 12, mm = +m[2]; hands[0].rotation.z = -(hh + mm / 60) / 12 * R2; hands[1].rotation.z = -mm / 60 * R2; }); }

    /* ---------- suelo: franja podotáctil, marcas de puerta, texto de seguridad, charcos, basura, sumidero ---------- */
    { const dec = (w, h, draw, x, z, ry = 0, opaque = false) => { const [k, g] = cv(Math.round(w * 256), Math.round(h * 256)); draw(g, k.width, k.height); const m = new THREE.MeshBasicMaterial({ map: tx(k), transparent: !opaque, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); const o = put(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: m.map, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), x, 0.006, z); o.rotation.x = -Math.PI / 2; o.rotation.z = ry; return o; };
      [-6, -2, 2, 6].forEach((x, i) => { dec(1.3, 1.0, (g, w, h) => { g.fillStyle = '#c8b640'; g.globalAlpha = 0.9; g.fillRect(8, 8, w - 16, h - 16); g.globalAlpha = 1; g.fillStyle = '#10110f'; g.font = `700 ${h * 0.55 | 0}px Arial`; g.textAlign = 'center'; g.fillText(String(i + 1), w / 2, h * 0.68); for (let n = 0; n < 160; n++) { g.fillStyle = `rgba(20,20,16,${R() * 0.5})`; g.fillRect(R() * w, R() * h, 2, 2); } }, x, 0.18); });
      dec(8.4, 0.7, (g, w, h) => { g.fillStyle = '#c8b640'; g.font = `700 ${h * 0.46 | 0}px Arial`; g.textAlign = 'center'; g.globalAlpha = 0.8; g.fillText('MANTÉNGASE DETRÁS DE LA LÍNEA AMARILLA', w / 2, h * 0.6); }, 0, -0.18);
      const puddle = (x, z, rx, rz) => { const m = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.72, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }); const o = put(new THREE.CircleGeometry(1, 28), m, x, 0.008, z); o.rotation.x = -Math.PI / 2; o.scale.set(rx, rz, 1); };
      puddle(-2.2, 2.7, 0.7, 0.35); puddle(3.9, 1.0, 0.55, 0.3); puddle(-7.4, 0.9, 0.45, 0.4); puddle(6.2, 2.9, 0.8, 0.28);
      const litter = []; for (let i = 0; i < 46; i++) { const x = -8.5 + R() * 17, z = -0.3 + R() * 3.7, t = R();
        if (t < 0.3) litter.push(cy(0.03, 0.022, 0.08, x, 0.04, z, 'y', 10).rotateZ ? (() => { const g = cy(0.03, 0.022, 0.08, 0, 0, 0, 'y', 10); g.rotateZ(R() < 0.5 ? 1.5 : 0); g.rotateY(R() * 3); return g.translate(x, 0.035, z); })() : null);
        else if (t < 0.7) { const g = new THREE.BoxGeometry(0.1 + R() * 0.1, 0.003, 0.08 + R() * 0.12); g.rotateY(R() * 3); litter.push(g.translate(x, 0.006, z)); }
        else { const g = cy(0.004, 0.004, 0.03, 0, 0, 0, 'y', 5); g.rotateZ(1.57); g.rotateY(R() * 3); litter.push(g.translate(x, 0.005, z)); } }
      merged(litter.filter(Boolean), new THREE.MeshStandardMaterial({ color: 0x9a968a, roughness: 0.8 }));
      { const g = grp(-3.0, 0.004, 0.0); const m = std(0x161616, 0.4, { metalness: 0.8 }); put(new THREE.BoxGeometry(0.5, 0.01, 0.3), m, 0, 0, 0, g); for (let i = -4; i <= 4; i++) put(new THREE.BoxGeometry(0.012, 0.014, 0.28), std(0x050505), i * 0.052, 0.004, 0, g); } }       // sumidero

    /* ---------- papeleras, pilares con pulsador de emergencia y expendedor de billetes ---------- */
    [[-0.9, 3.3], [-8.0, 3.3]].forEach(([x, z]) => { const g = grp(x, 0, z); put(new THREE.CylinderGeometry(0.2, 0.17, 0.75, 18, 1, true), std(0x2c3a30, 0.45, { metalness: 0.6, side: THREE.DoubleSide }), 0, 0.4, 0, g); put(new THREE.CylinderGeometry(0.205, 0.205, 0.04, 18), black, 0, 0.78, 0, g); put(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 18), black, 0, 0.03, 0, g); put(new THREE.PlaneGeometry(0.12, 0.05), emis(0x9bd0a0, 0.6), 0, 0.6, 0.205, g); W.obst.push({ minX: x - 0.25, maxX: x + 0.25, minZ: z - 0.25, maxZ: z + 0.25 }); });
    [-5.7, 5.7].forEach((x) => { const g = grp(x, 0, 1.75 - 0.24); put(new THREE.BoxGeometry(0.16, 0.2, 0.06), std(0xa3342a, 0.4), 0, 1.3, 0.01, g); put(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 14), std(0xe0d8c8, 0.4), 0, 1.3, -0.03, g).rotation.x = Math.PI / 2; put(new THREE.BoxGeometry(0.5, 0.06, 0.5), std(0x1b1c1c, 0.8), 0, 0.03, 0.24, g); put(new THREE.BoxGeometry(0.5, 0.12, 0.5), std(0x232625, 0.8), 0, 3.24, 0.24, g); });

    /* ---------- borde del andén: tapa podotáctil con dibujo y canto desgastado ---------- */
    { const m = new THREE.MeshStandardMaterial({ map: W.D.tactile.map, normalMap: W.D.tactile.normalMap, roughnessMap: W.D.tactile.roughnessMap, roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2) }); const o = put(new THREE.PlaneGeometry(18.4, 0.5), m, 0, 0.007, -0.73); o.rotation.x = -Math.PI / 2;
      put(new THREE.BoxGeometry(18.4, 0.03, 0.04), std(0x151515, 0.5), 0, 0.012, -0.995); }

    /* ---------- vía: balasto, carriles con perfil, carril de contacto, cables, señales, pared del túnel ---------- */
    { const ball = []; for (let i = 0; i < 900; i++) { const g = new THREE.BoxGeometry(0.06 + R() * 0.1, 0.04 + R() * 0.05, 0.06 + R() * 0.1); g.rotateY(R() * 3); g.rotateX((R() - 0.5) * 0.6); ball.push(g.translate(-20 + R() * 40, -1.04 + R() * 0.05, -1.3 - R() * 3.8)); }
      merged(ball, new THREE.MeshStandardMaterial({ color: 0x3a3733, roughness: 1 }));
      const rails = []; [-2.45, -3.95].forEach((z) => { rails.push(bx(40, 0.015, 0.14, 0, -0.98, z), bx(40, 0.1, 0.022, 0, -0.92, z), bx(40, 0.04, 0.07, 0, -0.85, z)); for (let x = -19.7; x < 20; x += 5) rails.push(bx(0.5, 0.07, 0.05, x, -0.9, z - 0.04), bx(0.5, 0.07, 0.05, x, -0.9, z + 0.04)); });
      merged(rails, std(0x6a6358, 0.35, { metalness: 0.85 }));
      merged([bx(40, 0.05, 0.1, 0, -0.9, -1.75), bx(40, 0.012, 0.16, 0, -0.865, -1.75)], std(0x1a1a1a, 0.5));
      { const cab = []; [0.4, 0.58, 0.76].forEach((y, i) => cab.push(cy(0.03 - i * 0.004, 0.03 - i * 0.004, 40, 0, y, -5.16, 'x', 8))); for (let x = -19; x < 20; x += 1.6) cab.push(bx(0.04, 0.5, 0.08, x, 0.58, -5.14)); merged(cab, black); }
      { const wm = new THREE.MeshStandardMaterial({ map: W.D.wall.map, normalMap: W.D.wall.normalMap, roughnessMap: W.D.wall.roughnessMap, roughness: 1, normalScale: new THREE.Vector2(1.1, 1.1) });
        put(new THREE.PlaneGeometry(18.4, 3.3), wm, 0, 1.65, -5.22); put(new THREE.PlaneGeometry(40, 1.2), std(0x16181a, 0.95), 0, -0.6, -5.24); }
      [-8, 7.4].forEach((x, i) => { const g = grp(x, 0, -4.9); put(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), metal, 0, 0.1, 0, g); put(new THREE.BoxGeometry(0.22, 0.52, 0.18), black, 0, 1.3, 0, g);
        const red = i === 0; put(new THREE.CircleGeometry(0.06, 16), emis(red ? 0xff2a1a : 0x3dff7a, 1.8), 0, 1.4, 0.092, g); put(new THREE.CircleGeometry(0.06, 16), emis(0x201010, 0.5), 0, 1.22, 0.092, g); const l = new THREE.PointLight(red ? 0xff3322 : 0x44ff88, 0.55, 5, 2); l.position.set(0, 1.4, 0.4); g.add(l); });
      const refuge = [bx(1.4, 1.9, 0.3, -3.5, 0.0, -5.12), bx(1.4, 1.9, 0.3, 4.5, 0.0, -5.12)]; merged(refuge, std(0x08090a, 0.9)); }

    /* ---------- aire: haces de los focos y polvo en suspensión ---------- */
    { 
      const N = 700, pos = new Float32Array(N * 3), seed = []; for (let i = 0; i < N; i++) { pos[i * 3] = -9 + R() * 18; pos[i * 3 + 1] = R() * 3.2; pos[i * 3 + 2] = -1 + R() * 4.6; seed.push(R() * 100); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xcfd6c4, size: 0.022, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true })); root.add(dust);
      W.tick.push((dt, t) => { const p = geo.attributes.position; for (let i = 0; i < N; i++) { p.array[i * 3] += Math.sin(t * 0.2 + seed[i]) * 0.0008 + 0.0004; p.array[i * 3 + 1] += Math.cos(t * 0.3 + seed[i]) * 0.0007 - 0.0002; if (p.array[i * 3] > 9) p.array[i * 3] = -9; if (p.array[i * 3 + 1] < 0) p.array[i * 3 + 1] = 3.2; } p.needsUpdate = true; }); }

    /* ---------- cercha metálica del techo y catenaria ---------- */
    { const tr = []; [-0.45, 2.95].forEach((z0) => { tr.push(bx(18.2, 0.07, 0.07, 0, 3.27, z0), bx(18.2, 0.07, 0.07, 0, 2.93, z0));
        for (let i = 0, x = -9; x < 9; x += 0.9, i++) { const g = bx(0.05, 0.5, 0.05, 0, 0, 0); g.rotateZ((i % 2 ? 1 : -1) * 0.62); tr.push(g.translate(x + 0.45, 3.1, z0)); tr.push(bx(0.05, 0.34, 0.05, x, 3.1, z0)); } });
      merged(tr, std(0x5c6063, 0.5, { metalness: 0.8 }));
      const wr = []; [-2.45, -3.95].forEach((z) => { wr.push(cy(0.008, 0.008, 40, 0, 3.12, z, 'x', 5), cy(0.006, 0.006, 40, 0, 3.22, z, 'x', 5)); for (let x = -19; x < 20; x += 2.4) wr.push(cy(0.004, 0.004, 0.1, x, 3.17, z, 'y', 4)); });
      merged(wr, black); }

    /* ---------- escalera hacia la calle (con baranda y hueco oscuro arriba) ---------- */
    { const cc = W.D.concrete(1, 1, 31), cm = new THREE.MeshStandardMaterial({ map: cc.map, normalMap: cc.normalMap, roughnessMap: cc.roughnessMap, roughness: 1 });
      const st = []; for (let i = 0; i < 12; i++) st.push(bx(0.3, 0.17 * (i + 1), 1.15, 5.55 + i * 0.3 + 0.15, 0.17 * (i + 1) / 2, 3.025));
      merged(st, cm);
      const ny = []; for (let i = 0; i < 12; i++) ny.push(bx(0.045, 0.03, 1.15, 5.55 + i * 0.3 + 0.275, 0.17 * (i + 1) + 0.015, 3.025)); merged(ny, std(0x8a7a3a, 0.7));
      const ang = Math.atan2(0.17 * 12, 0.3 * 12), len = Math.hypot(0.3 * 12, 0.17 * 12);
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, len, 10), galv); rail.rotation.z = Math.PI / 2 - ang; rail.position.set(5.55 + 1.8, 0.17 * 6 + 0.95, 2.43); root.add(rail);
      const rail2 = rail.clone(); rail2.position.y -= 0.35; root.add(rail2);
      const posts = []; for (let i = 0; i <= 12; i += 3) posts.push(cy(0.02, 0.02, 1.0, 5.55 + i * 0.3, 0.17 * i + 0.5, 2.43, 'y', 8)); merged(posts, galv);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.9), new THREE.MeshStandardMaterial({ color: 0x9fb4b8, transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide, depthWrite: false })); glass.rotation.z = -ang + 0; glass.rotation.z = ang; glass.position.set(5.55 + 1.8, 0.17 * 6 + 0.55, 2.43); root.add(glass);
      put(new THREE.BoxGeometry(0.05, 1.3, 1.2), std(0x020202, 1), 9.17, 2.7, 3.0);                                                                          // hueco oscuro de la planta superior
      { const [k, g] = cv(128, 256); g.fillStyle = '#4a5054'; g.fillRect(0, 0, 128, 256); const r = Q.rng(5); for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '20,22,24' : '120,126,130'},${r() * 0.18})`; g.fillRect(r() * 128, r() * 256, 1 + r() * 3, 1 + r() * 3); }
        g.fillStyle = '#25292c'; g.fillRect(8, 8, 112, 240); g.strokeStyle = '#8a9094'; g.lineWidth = 3; g.strokeRect(14, 14, 100, 228); g.fillStyle = '#b8b020'; g.fillRect(52, 150, 24, 6);
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 1.0), new THREE.MeshStandardMaterial({ map: tx(k), roughness: 0.55, metalness: 0.5 })); door.position.set(9.12, 3.1, 3.025); root.add(door); W.doorMesh = door; W.actRoots.push(door); door.userData.act = 'escalera'; }
      const hl = new THREE.PointLight(0xdfe8ff, 0.5, 4, 2); hl.position.set(8.4, 2.6, 3.0); root.add(hl);
      W.obst.push({ minX: 5.4, maxX: 9.1, minZ: 2.35, maxZ: 3.6 }); }

    /* ---------- suelo: reflejo de los fluorescentes, tapas redondas, línea amarilla ---------- */
    { const [k, g] = cv(64, 128); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(235,245,230,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128);
      const m = new THREE.MeshBasicMaterial({ map: tx(k), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const o = put(new THREE.PlaneGeometry(17.4, 0.7), m, 0, 0.011, 1.5); o.rotation.x = -Math.PI / 2;
      [-6.6, -2.2, 2.2, 6.6].forEach((x) => { const sp = put(new THREE.PlaneGeometry(1.8, 1.3), m, x, 0.012, 1.5); sp.rotation.x = -Math.PI / 2; });
      const cov = []; for (let x = -7.5; x <= 7.6; x += 3.0) [0.95, 2.75].forEach((z) => { const gg = new THREE.CircleGeometry(0.21, 24); gg.rotateX(-Math.PI / 2); cov.push(gg.translate(x, 0.009, z)); });
      merged(cov, std(0x1a1b1c, 0.35, { metalness: 0.7 }));
      const ring = []; for (let x = -7.5; x <= 7.6; x += 3.0) [0.95, 2.75].forEach((z) => { const gg = new THREE.RingGeometry(0.21, 0.235, 24); gg.rotateX(-Math.PI / 2); ring.push(gg.translate(x, 0.0095, z)); });
      merged(ring, std(0x6a6d6b, 0.4, { metalness: 0.6 }));
      put(new THREE.PlaneGeometry(18.4, 0.09), std(0xc9b227, 0.6), 0, 0.0105, -0.42).rotation.x = -Math.PI / 2; }

    /* ---------- interacción con la máquina ---------- */
    W.acts.maquina = { label: 'Mirar la máquina expendedora', stand: [3.6, 2.4], look: [4.4, 1.3, 3.4], enabled: () => true, run: async (api) => { await api.say(['Una barrita con aspecto de haber visto mejores años: 1,80 €. Dentro, la prima de riesgo de tu desayuno.', { text: 'Rentabilidad: negativa. Liquidez: inmediata. Como casi todo lo que compras.', think: true }]); } };
  };
})();
