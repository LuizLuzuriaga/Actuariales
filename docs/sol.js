/* sol.js — nivel alternativo: la Puerta del Sol al atardecer. Si dejas pasar el tren, el Grandullón te escribe: «¿cañas?». Edificio con reloj al fondo, Kilómetro Cero,
   el oso y el madroño, la fuente, farolas, una terraza con el Grandullón y gente paseando. Tras dos rondas llega el apocalipsis: cielo rojo, la gente huye,
   los infectados entran por las calles. Sin marcas: los rótulos son genéricos. Devuelve un «mundo» como el resto. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;

  Q.buildSol = (renderer, envTex, opts = {}) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a3350); scene.fog = new THREE.FogExp2(0x4a4058, 0.018);
    if (envTex) scene.environment = envTex;
    const bounds = { minX: -34, maxX: 34, minZ: -8.4, maxZ: 10.2 };
    const W = { scene, obst: [], tick: [], acts: {}, actRoots: [], bounds, spawn: [-1.5, 7.0], look: [-5.2, 1.6, 3.0], pistas: 0, ronda: 0, barra: false, exit: false, apoc: false };
    const root = new THREE.Group(); scene.add(root);
    const rnd = Q.rng(2828);
    const std = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
    const emis = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
    const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const put = (geo, m, x = 0, y = 0, z = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
    const merged = (parts, m, parent = root) => { const o = new THREE.Mesh(MG.mergeBufferGeometries(parts), m); parent.add(o); return o; };
    const cv = (w, h) => { const c = Q.cvs(w, h); return [c, c.getContext('2d')]; };
    const tag = (obj, id) => { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); W.actRoots.push(obj); };
    const box = (x, z, w, d) => W.obst.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

    /* ---------- luces: atardecer frío con farolas cálidas ---------- */
    const hemi = new THREE.HemisphereLight(0x8a82ac, 0x2a2224, 0.8); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xff9a60, 0.9); sun.position.set(-30, 8, 20); scene.add(sun);
    const lamps = [];

    /* ---------- cielo: dos gradientes, el de atardecer y el del fin del mundo ---------- */
    const skyTex = (stops) => { const [c, g] = cv(8, 256); const gr = g.createLinearGradient(0, 0, 0, 256); stops.forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, 8, 256); return Q.toTex(c); };
    const skyA = skyTex([[0, '#141a38'], [0.5, '#4a4272'], [0.78, '#b0707a'], [1, '#e8a070']]), skyB = skyTex([[0, '#1a0605'], [0.45, '#5a1810'], [0.8, '#c0381a'], [1, '#f08a2a']]);
    const sky = put(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({ map: skyA, side: THREE.BackSide, fog: false, depthWrite: false })); sky.renderOrder = -2;

    /* ---------- suelo: adoquín gris claro, con el Kilómetro Cero ---------- */
    { const t = Q.pbr(256, 256, (g, hg, rg, w, h) => { const r = Q.rng(4); g.fillStyle = '#7e7c80'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#c0c0c0'; rg.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const k = 0.85 + r() * 0.3; g.fillStyle = `rgb(${126 * k | 0},${124 * k | 0},${128 * k | 0})`; g.fillRect(x + 1, y + 1, 30, 30); hg.fillStyle = '#404040'; hg.fillRect(x, y, 32, 1); hg.fillRect(x, y, 1, 32); }
        for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(20,20,24,${r() * 0.18})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, { strength: 1.2, repeat: [8, 7], rough: true });
      put(new THREE.PlaneGeometry(40, 34), new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1 }), 0, 0, 0).rotation.x = -Math.PI / 2; }
    { const [c, g] = cv(256, 256); g.fillStyle = '#5a5558'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.beginPath(); g.arc(128, 128, 110, 0, 7); g.stroke(); g.fillStyle = '#c9a24a'; g.font = '700 26px Georgia'; g.textAlign = 'center'; g.fillText('KILÓMETRO', 128, 118); g.fillText('CERO', 128, 150);
      const km = put(new THREE.CircleGeometry(0.7, 28), new THREE.MeshStandardMaterial({ map: Q.toTex(c), roughness: 0.4, metalness: 0.4 }), 0, 0.012, -5.6); km.rotation.x = -Math.PI / 2; tag(km, 'km0'); }

    /* ---------- fachadas: ladrillo y piedra, balcones y ventanas encendidas ---------- */
    const facade = (cols, rows, base, seed, lit) => { const CW = 28, CH = 40, [c, g] = cv(cols * CW, rows * CH), r = Q.rng(seed); g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = i * CW + 5, y = j * CH + 7, on = r() < lit; g.fillStyle = on ? `rgb(${240 + (r() * 14 | 0)},${196 + (r() * 30 | 0)},${120 + (r() * 30 | 0)})` : '#1c1e26'; g.fillRect(x, y, CW - 10, CH - 18);
        g.fillStyle = 'rgba(235,225,200,.8)'; g.fillRect(x - 2, y - 2, CW - 6, 2); g.fillRect(x - 2, y + CH - 18, CW - 6, 3); if (j > 0) { g.fillStyle = '#16171c'; g.fillRect(x - 3, y + CH - 14, CW - 4, 2); } }
      for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(20,16,14,${r() * 0.1})`; g.fillRect(r() * c.width, r() * c.height, 1 + r() * 2, 1 + r() * 2); } return Q.toTex(c); };
    const bld = (x, z, w, h, d, base, seed, ry = 0, frontAxis = 'z') => { const m = std(0xffffff, 0.9, { map: facade(Math.max(4, Math.round(w * 1.1)), Math.round(h / 1.4), base, seed, 0.45) });
      const o = put(new THREE.BoxGeometry(w, h, d), m, x, h / 2, z); o.rotation.y = ry; W.obst.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 }); return o; };
    // fondo: la Casa del Reloj, con torre y cúpula
    bld(0, -10.4, 15, 11, 4, '#a4523c', 11); bld(-13.5, -10.4, 12, 10, 4, '#c8b48a', 12); bld(13.5, -10.4, 12, 10, 4, '#d0b890', 13);
    { const g = new THREE.Group(); g.position.set(0, 11, -10.2); root.add(g); put(new THREE.BoxGeometry(3.2, 3.4, 2.6), std(0xb8b09a, 0.8), 0, 1.7, 0, g);
      const [c, k] = cv(128, 128); k.fillStyle = '#e8e0cc'; k.beginPath(); k.arc(64, 64, 60, 0, 7); k.fill(); k.strokeStyle = '#1a1a1a'; k.lineWidth = 5; k.beginPath(); k.arc(64, 64, 58, 0, 7); k.stroke(); k.lineWidth = 6; k.beginPath(); k.moveTo(64, 64); k.lineTo(64, 20); k.moveTo(64, 64); k.lineTo(94, 76); k.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; k.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 2, 4, 4); }
      const clock = put(new THREE.CircleGeometry(0.95, 28), new THREE.MeshBasicMaterial({ map: Q.toTex(c), toneMapped: false }), 0, 1.95, 1.34, g); tag(clock, 'reloj');
      put(new THREE.ConeGeometry(2.1, 1.7, 4), std(0x3a3a40, 0.6), 0, 4.25, 0, g).rotation.y = Math.PI / 4; put(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), std(0x222222), 0, 5.7, 0, g); }
    // laterales y fondo trasero con calles que se abren (a Mayor, Alcalá, Carretas)
    bld(-23.45, -7.25, 21.1, 12, 9.5, '#c9ae80', 21, 0); bld(-23.45, 7.75, 21.1, 11, 8.5, '#b89a78', 22, 0); bld(23.45, -10.25, 21.1, 13, 7.5, '#cdb48a', 23, 0); bld(23.45, 5.75, 21.1, 11, 12.5, '#bf9f7a', 24, 0);
    /* calzadas y aceras de las dos calles; al fondo se ve que la ciudad sigue, hasta una valla de obras que corta el paso */
    const road = (x0, x1, zc, w) => { const L = Math.abs(x1 - x0); put(new THREE.PlaneGeometry(L, w), std(0x26272b, 0.95), (x0 + x1) / 2, 0.012, zc).rotation.x = -Math.PI / 2; [-1, 1].forEach((k) => put(new THREE.PlaneGeometry(L, 1.7), std(0x75737a, 0.95), (x0 + x1) / 2, 0.02, zc + k * (w / 2 - 0.85)).rotation.x = -Math.PI / 2);
      const [lc, lg] = cv(512, 16); lg.fillStyle = '#c9b84a'; for (let i = 0; i < 12; i++) lg.fillRect(i * 44 + 6, 6, 26, 4); const lt = Q.toTex(lc); lt.wrapS = THREE.RepeatWrapping; lt.repeat.set(L / 24, 1); put(new THREE.PlaneGeometry(L, 0.3), new THREE.MeshBasicMaterial({ map: lt, transparent: true }), (x0 + x1) / 2, 0.03, zc).rotation.x = -Math.PI / 2; };
    road(-80, -12.9, 0.5, 6); road(12.9, 80, -3.5, 6);
    const shop = (x, zFront, face, text, awn) => { const g = new THREE.Group(); g.position.set(x, 0, zFront + face * 0.03); if (face < 0) g.rotation.y = Math.PI; root.add(g);
      put(new THREE.PlaneGeometry(1.2, 2.1), std(0x16171c, 0.6), -0.9, 1.05, 0.02, g); put(new THREE.PlaneGeometry(2.0, 1.3), emis(0xffd89a, 0.32), 1.0, 1.35, 0.02, g); put(new THREE.BoxGeometry(3.8, 0.16, 0.9), std(awn, 0.8), 0, 2.55, 0.45, g);
      const [c2, g2] = cv(256, 64); g2.fillStyle = '#14151a'; g2.fillRect(0, 0, 256, 64); g2.fillStyle = '#e8dcc0'; g2.font = '700 30px Georgia'; g2.textAlign = 'center'; g2.fillText(text, 128, 44); put(new THREE.PlaneGeometry(2.6, 0.65), new THREE.MeshBasicMaterial({ map: Q.toTex(c2), toneMapped: false }), 0, 3.15, 0.03, g); };
    [[-16.5, -2.5, 1, 'FARMACIA', 0x2f7a46], [-21.5, -2.5, 1, 'ESTANCO', 0x7a3a2a], [-26.5, -2.5, 1, 'ZAPATERÍA', 0x3a4a7a], [-31, -2.5, 1, 'BAR', 0x8a2a2a], [-17, 3.5, -1, 'LIBRERÍA', 0x5a4a2a], [-22.5, 3.5, -1, 'CAFETERÍA', 0x7a5a2a], [-28.5, 3.5, -1, 'FERRETERÍA', 0x3a5a5a],
      [16.5, -6.5, 1, 'TABERNA', 0x7a2a2a], [22, -6.5, 1, 'FLORISTERÍA', 0x2a6a3a], [28, -6.5, 1, 'PELUQUERÍA', 0x5a3a6a], [17, -0.5, -1, 'PAPELERÍA', 0x4a5a2a], [23, -0.5, -1, 'PIZZERÍA', 0x8a3a2a], [29, -0.5, -1, 'LOTERÍA', 0x2a4a6a]].forEach((a) => shop(...a));
    // valla de obras que corta cada calle, con luz naranja que parpadea, y una vista de la ciudad que sigue más allá
    const valla = (x, zc, face) => { const [vc, vg] = cv(128, 64); vg.fillStyle = '#e8e4d8'; vg.fillRect(0, 0, 128, 64); for (let i = -2; i < 8; i++) { vg.fillStyle = '#c4202c'; vg.beginPath(); vg.moveTo(i * 22, 0); vg.lineTo(i * 22 + 12, 0); vg.lineTo(i * 22 + 12 + 30, 64); vg.lineTo(i * 22 + 30, 64); vg.fill(); }
      const vt = new THREE.MeshStandardMaterial({ map: Q.toTex(vc), roughness: 0.7 }); for (let k = -2; k <= 2; k++) put(new THREE.BoxGeometry(0.12, 1.1, 1.18), vt, x, 0.7, zc + k * 1.2);
      put(new THREE.BoxGeometry(0.1, 0.08, 6.2), std(0x1a1a1a), x, 1.3, zc); const [sc, sg] = cv(256, 96); sg.fillStyle = '#d29a1a'; sg.fillRect(0, 0, 256, 96); sg.fillStyle = '#16120a'; sg.font = '700 30px Georgia'; sg.textAlign = 'center'; sg.fillText('CALLE CORTADA', 128, 42); sg.font = '20px Georgia'; sg.fillText('OBRAS · NO PASAR', 128, 74);
      const sp = put(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: Q.toTex(sc), toneMapped: false, side: THREE.DoubleSide }), x, 2.2, zc); sp.rotation.y = Math.PI / 2; const bl = put(new THREE.SphereGeometry(0.14, 8, 6), emis(0xff8a20, 2.2), x, 1.55, zc + 2.4); W.tick.push((dt, t) => { bl.visible = Math.sin(t * 6) > 0; });
      W.obst.push({ minX: x - 0.6, maxX: x + 0.6, minZ: zc - 3.2, maxZ: zc + 3.2 }); [-1, 1].forEach((k) => put(new THREE.CylinderGeometry(0.03, 0.2, 0.7, 8), std(0xe86a1a, 0.7), x + face * 0.8, 0.35, zc + k * 1.8)); };
    valla(-33.4, 0.5, 1); valla(33.4, -3.5, -1);
    /* ---------- pancartas en las fachadas, marquesinas con carteles y las tiendas de campaña de la plaza ---------- */
    const pancarta = (text, x, y, z, ry, w, bg, fg) => { const [pc, pg] = cv(512, 128); pg.fillStyle = bg; pg.fillRect(0, 0, 512, 128); pg.strokeStyle = fg; pg.lineWidth = 4; pg.strokeRect(6, 6, 500, 116); pg.fillStyle = fg; pg.textAlign = 'center';
      const words = text.split(' '), lines = ['', '']; words.forEach((wd) => { const k = lines[0].length + wd.length < 18 ? 0 : 1; lines[k] += (lines[k] ? ' ' : '') + wd; }); pg.font = '700 40px Georgia'; if (!lines[1]) pg.fillText(lines[0], 256, 78); else { pg.fillText(lines[0], 256, 56); pg.fillText(lines[1], 256, 106); }
      const p = put(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: Q.toTex(pc), roughness: 0.9 }), x, y, z); p.rotation.y = ry; return p; };
    pancarta('LA CORRELACIÓN NO IMPLICA CAUSALIDAD', -10, 5.2, -8.36, 0, 5, '#e8dcc0', '#1a1612'); pancarta('R² = 0,03 PERO NOS QUEREMOS', 10, 5.2, -8.36, 0, 5, '#2a3a5a', '#f2ead8');
    pancarta('OVERFITTING: MI EX', -12.86, 5.6, 6.5, Math.PI / 2, 5, '#6a2a2a', '#f2ead8'); pancarta('EL MERCADO ES EFICIENTE; YO, NO', -12.86, 5.4, -5.5, Math.PI / 2, 5, '#d8c890', '#1a1612');
    pancarta('SESGO DE CONFIRMACIÓN: YA LO SABÍA', 12.86, 5.6, 8.0, -Math.PI / 2, 5, '#2a5a4a', '#f2ead8'); pancarta('HOY NO RINDO: GRADIENTE DESCENDENTE', 12.86, 5.4, -9.0, -Math.PI / 2, 5, '#4a3a6a', '#f2ead8');
    pancarta('LA TERAPIA SE PAGA SOLA (EN CAÑAS)', -9, 4.2, 10.45, Math.PI, 5, '#8a5a2a', '#1a1208');
    const marquesina = (x, z, ry, txt, bg) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
      put(new THREE.BoxGeometry(3.0, 0.1, 1.2), std(0x2a2c30, 0.5, { metalness: 0.5 }), 0, 2.45, 0, g); [-1.4, 1.4].forEach((k) => put(new THREE.BoxGeometry(0.08, 2.45, 0.08), std(0x2a2c30, 0.5, { metalness: 0.5 }), k, 1.22, -0.5, g));
      put(new THREE.PlaneGeometry(2.8, 1.9), new THREE.MeshStandardMaterial({ color: 0x9fb4b8, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }), 0, 1.3, -0.52, g);
      const [qc, qg] = cv(256, 380); qg.fillStyle = bg; qg.fillRect(0, 0, 256, 380); qg.fillStyle = '#f2ead8'; qg.font = '700 34px Georgia'; qg.textAlign = 'center'; txt.forEach((l, i) => qg.fillText(l, 128, 80 + i * 46)); put(new THREE.PlaneGeometry(0.9, 1.35), new THREE.MeshBasicMaterial({ map: Q.toTex(qc), toneMapped: false }), 0.9, 1.25, -0.45, g);
      put(new THREE.BoxGeometry(2.2, 0.06, 0.4), std(0x3a3a3e, 0.6), -0.3, 0.5, -0.3, g); W.obst.push({ minX: x - 1.6, maxX: x + 1.6, minZ: z - 0.7, maxZ: z + 0.7 }); return g; };
    marquesina(9.8, 8.4, Math.PI, ['CONCIERTO', 'LOS', 'HIPOTECADOS', 'ENTRADA: 3 SUELDOS'], '#2a1a3a'); marquesina(-9.4, -6.9, 0, ['SE VENDE', 'ALGORITMO', 'QUE PREDICE', 'EL PASADO'], '#1a3a3a');
    const tienda = (x, z, ry, col, id) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
      const body = put(new THREE.ConeGeometry(1.6, 1.5, 4), std(col, 0.9, { flatShading: true }), 0, 0.75, 0, g); body.rotation.y = Math.PI / 4; body.scale.set(1.0, 1, 0.8);
      put(new THREE.PlaneGeometry(0.7, 1.0), std(0x0a0a0c, 0.9, { side: THREE.DoubleSide }), 0, 0.52, 1.0, g).rotation.x = -0.45;
      put(new THREE.BoxGeometry(1.1, 0.12, 0.5), std(0x6a4a2a, 0.8), -1.7, 0.1, 0.9, g); put(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8), std(0x3a3a3e, 0.8), 1.6, 0.2, 0.9, g);
      pancarta(id === 1 ? 'SE ALQUILA ESTUDIO 900 EUR' : 'ACAMPADA POR BACKTESTING', x, 2.2, z + 1.4, 0, 1.8, id === 1 ? '#e8dcc0' : '#2a2a30', id === 1 ? '#1a1612' : '#e8dcc0');
      put(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6), std(0x5a4a3a, 0.8), -0.9, 1.2, 1.4, g); put(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6), std(0x5a4a3a, 0.8), 0.9, 1.2, 1.4, g);
      W.obst.push({ minX: x - 1.4, maxX: x + 1.4, minZ: z - 1.2, maxZ: z + 1.4, tent: true }); tag(g, id === 1 ? 'tienda' : 'tienda2'); return g; };
    W.tents = [tienda(-5.2, 3.0, 0.15, 0xd8802a, 1), tienda(-7.6, 6.0, -0.25, 0x2a5a9a, 2)];
    // el perro de la tienda naranja: atado, con cara de auditor interno
    const perro = new THREE.Group(); perro.position.set(-2.9, 0, 3.9); perro.rotation.y = 2.4; root.add(perro); { const pelo = std(0xb08a58, 0.9), osc = std(0x2a2118, 0.9);
      put(new THREE.BoxGeometry(0.62, 0.3, 0.26), pelo, 0, 0.42, 0, perro); put(new THREE.BoxGeometry(0.22, 0.22, 0.22), pelo, 0.38, 0.55, 0, perro); put(new THREE.BoxGeometry(0.12, 0.09, 0.14), osc, 0.52, 0.5, 0, perro); [-1, 1].forEach((k) => { put(new THREE.BoxGeometry(0.06, 0.14, 0.08), osc, 0.34, 0.68, k * 0.1, perro); [-0.22, 0.24].forEach((x) => put(new THREE.BoxGeometry(0.07, 0.3, 0.07), pelo, x, 0.15, k * 0.09, perro)); });
      W.tail = put(new THREE.BoxGeometry(0.26, 0.06, 0.06), pelo, -0.42, 0.55, 0, perro); W.perro = perro; tag(perro, 'perro'); W.obst.push({ minX: -3.3, maxX: -2.5, minZ: 3.5, maxZ: 4.3 }); }
    W.tick.push((dt, t) => { if (W.tail) W.tail.rotation.z = Math.sin(t * 9) * 0.6 + 0.3; if (W.perro) W.perro.visible = !W.apoc;
      W.tents.forEach((g, i) => { g.rotation.z = W.apoc && !W.apocRes ? Math.sin(t * 38 + i * 2) * 0.025 * (W.apocT < 8 ? 1 : 0.3) : 0; }); if (W.apoc) W.apocT = (W.apocT || 0) + dt; });

    { const sky = []; [[-1, 0.5], [1, -3.5]].forEach(([sgn, zc], si) => { for (let i = 0; i < 12; i++) { const h = 14 + rnd() * 22, d = 10 + rnd() * 6, x = sgn * (44 + i * 8 + rnd() * 3), zz = zc + (rnd() < 0.5 ? -1 : 1) * (7 + rnd() * 9);
        sky.push(put(new THREE.BoxGeometry(8 + rnd() * 4, h, d), std(0xffffff, 0.95, { map: facade(10, Math.round(h / 1.5), '#6a6070', 60 + i + si * 20, 0.3) }), x, h / 2, zz)); }
      put(new THREE.BoxGeometry(24, 38, 8), std(0xffffff, 0.95, { map: facade(16, 24, '#5a5266', 90 + si, 0.25) }), sgn * 108, 19, zc); }); }
    // farolas, coches aparcados y papeleras en las calles
    [[-19, -1.7], [-28, 2.7], [19, -5.0], [28, -1.0]].forEach(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g); put(new THREE.CylinderGeometry(0.05, 0.08, 4.2, 8), std(0x202326, 0.4, { metalness: 0.7 }), 0, 2.1, 0, g); put(new THREE.SphereGeometry(0.22, 10, 8), emis(0xffc080, 1.8), 0, 4.3, 0, g); W.obst.push({ minX: x - 0.2, maxX: x + 0.2, minZ: z - 0.2, maxZ: z + 0.2 }); });
    [[-22, 2.7, 0, 0x3a4a5a], [-30, -1.7, Math.PI, 0x5a2a2a], [21, -5.1, 0, 0x2a3a2a], [27, -0.9, Math.PI, 0x4a4a5a]].forEach(([x, z, ry, col]) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g); merged([bx(3.8, 0.7, 1.6, 0, 0.6, 0), bx(2.0, 0.6, 1.45, -0.3, 1.2, 0)], std(col, 0.4, { metalness: 0.5 }), g); W.obst.push({ minX: x - 2.0, maxX: x + 2.0, minZ: z - 0.9, maxZ: z + 0.9 }); });
    bld(-5, 12.5, 14, 9, 4, '#b6a080', 25, 0); bld(9, 12.5, 14, 10, 4, '#c4a888', 26, 0);
    // rótulo luminoso genérico en lo alto de un edificio
    { const [c, g] = cv(256, 96); g.fillStyle = '#0c0c10'; g.fillRect(0, 0, 256, 96); g.fillStyle = '#ff5a40'; g.font = '700 40px Georgia'; g.textAlign = 'center'; g.fillText('CAÑAS & CO.', 128, 62);
      put(new THREE.PlaneGeometry(3.2, 1.2), new THREE.MeshBasicMaterial({ map: Q.toTex(c), toneMapped: false }), 14, 8.7, -4.2).rotation.y = -Math.PI / 2 + 0.01; }

    /* ---------- el oso y el madroño, la fuente, farolas, entrada de metro ---------- */
    { const g = new THREE.Group(); g.position.set(7, 0, -2.5); root.add(g); const dk = std(0x3a2a20, 0.55, { metalness: 0.3 });
      put(new THREE.BoxGeometry(1.5, 0.45, 1.2), std(0x8a8678, 0.8), 0, 0.225, 0, g); put(new THREE.CylinderGeometry(0.1, 0.16, 2.3, 8), dk, -0.35, 1.6, 0, g);
      const ft = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8), std(0x2a3a22, 0.8)); ft.position.set(-0.35, 3.0, 0); ft.scale.set(1, 0.8, 1); g.add(ft);
      put(new THREE.SphereGeometry(0.4, 10, 8), dk, 0.35, 0.95, 0, g).scale.set(1.5, 0.9, 0.9); put(new THREE.SphereGeometry(0.22, 10, 8), dk, 0.0, 1.35, 0, g); put(new THREE.SphereGeometry(0.2, 8, 6), dk, 0.72, 1.2, 0, g);
      [[-0.1, 0.2], [0.7, 0.2], [-0.1, -0.2], [0.7, -0.2]].forEach(([x, z]) => put(new THREE.CylinderGeometry(0.06, 0.07, 0.5, 6), dk, 0.1 + x, 0.7, z, g));
      tag(g, 'oso'); box(7, -2.5, 1.7, 1.5); }
    { const g = new THREE.Group(); g.position.set(-7, 0, -3.5); root.add(g); const st = std(0xa8a49a, 0.7); put(new THREE.CylinderGeometry(1.4, 1.5, 0.5, 20), st, 0, 0.25, 0, g); put(new THREE.CylinderGeometry(0.2, 0.28, 1.2, 10), st, 0, 1.0, 0, g); put(new THREE.CylinderGeometry(0.7, 0.4, 0.3, 14), st, 0, 1.55, 0, g);
      put(new THREE.CylinderGeometry(1.2, 1.2, 0.05, 20), std(0x2a4a5a, 0.1, { metalness: 0.4 }), 0, 0.45, 0, g); put(new THREE.CylinderGeometry(0.06, 0.1, 1.0, 8), st, 0, 2.2, 0, g); tag(g, 'fuente'); box(-7, -3.5, 3, 3); }
    [[-4.5, 3.6], [5.0, 4.0], [-9.5, -6.0], [10, -6.5], [0, -2.3]].forEach(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
      put(new THREE.CylinderGeometry(0.05, 0.08, 4.4, 8), std(0x202326, 0.4, { metalness: 0.7 }), 0, 2.2, 0, g); put(new THREE.SphereGeometry(0.26, 12, 10), emis(0xffc080, 1.8), 0, 4.5, 0, g);
      if (i < 3) { const l = new THREE.PointLight(0xffb070, 0.8, 11, 2); l.position.set(0, 4.3, 0); g.add(l); lamps.push(l); } box(x, z, 0.3, 0.3); });
    { const g = new THREE.Group(); g.position.set(-10.5, 0, 3); root.add(g); merged([bx(2.4, 2.4, 0.08, 0, 1.2, 0), bx(0.08, 2.4, 1.6, -1.2, 1.2, 0.8), bx(0.08, 2.4, 1.6, 1.2, 1.2, 0.8), bx(2.4, 0.08, 1.6, 0, 2.4, 0.8)], new THREE.MeshStandardMaterial({ color: 0x9fb4b8, transparent: true, opacity: 0.35, roughness: 0.1 }), g); put(new THREE.PlaneGeometry(1.6, 0.4), emis(0xc4202c, 1.4), 0, 2.8, 0.1, g); box(-10.5, 3.8, 2.6, 1.8); }

    /* ---------- terraza: mesas con cañas y el Grandullón ---------- */
    const tables = [[2.6, 2.6], [5.6, 4.2], [-3.2, 1.0]];
    tables.forEach(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g); put(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 16), std(0x2a2a2e, 0.5), 0, 0.74, 0, g); put(new THREE.CylinderGeometry(0.04, 0.08, 0.74, 8), std(0x1a1a1a, 0.5), 0, 0.37, 0, g);
      merged([bx(0.4, 0.04, 0.4, 0.7, 0.44, 0), bx(0.4, 0.04, 0.4, -0.7, 0.44, 0), bx(0.04, 0.4, 0.4, 0.9, 0.66, 0), bx(0.04, 0.4, 0.4, -0.9, 0.66, 0)], std(0x2a2018, 0.7), g); if (x === 2.6) tag(g, 'cerveza'); if (x === 5.6) tag(g, 'arma');
      [[-0.12, 0.1], [0.14, -0.08]].forEach(([a, b]) => { put(new THREE.CylinderGeometry(0.05, 0.045, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xd8a640, roughness: 0.2, transparent: true, opacity: 0.9 }), a, 0.83, b, g); put(new THREE.CylinderGeometry(0.052, 0.052, 0.03, 10), std(0xf2eede, 0.9), a, 0.915, b, g); }); box(x, z, 1.1, 1.1); });
    /* camarero: sale de la barra de la terraza con una bandeja, sirve las dos cañas en la mesa y vuelve */
    const waiter = Q.buildCrowd([[0, 0]], { seed: 31, yaw: () => 0 }); waiter.group.position.set(-1.5, 0, 6.9); waiter.group.visible = false; root.add(waiter.group);
    const tray = new THREE.Group(); tray.visible = false; root.add(tray); put(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 14), std(0xb8b8b8, 0.3, { metalness: 0.6 }), 0, 0, 0, tray);
    const beer = (x, z, parent) => { put(new THREE.CylinderGeometry(0.05, 0.045, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xd8a640, roughness: 0.2, transparent: true, opacity: 0.92 }), x, 0.08, z, parent); put(new THREE.CylinderGeometry(0.052, 0.052, 0.03, 10), std(0xf4f0e0, 0.9), x, 0.165, z, parent); };
    beer(-0.09, 0, tray); beer(0.09, 0, tray);
    const served = new THREE.Group(); served.visible = false; served.position.set(2.6, 0.78, 2.6); root.add(served); beer(0.18, 0.12, served); beer(-0.2, -0.1, served);
    W.serve = async (api) => {
      const { tween } = api, x0 = -1.5, z0 = 6.9, x1 = 2.0, z1 = 3.5; waiter.group.visible = true; tray.visible = true;
      const place = (x, z, th) => { waiter.group.position.set(x, 0, z); waiter.group.rotation.y = th; tray.position.set(x + Math.sin(th + Math.PI) * -0.42 * -1, 1.02, z + Math.cos(th + Math.PI) * -0.42 * -1); };
      const th1 = Math.atan2(x1 - x0, z1 - z0) + Math.PI; if (window.Sound && Sound.on) Sound.click();
      await tween(2600, (e) => { const x = x0 + (x1 - x0) * e, z = z0 + (z1 - z0) * e; place(x, z, th1); waiter.group.position.y = Math.abs(Math.sin(e * 22)) * 0.03; });
      // se inclina y deja las cañas en la mesa
      const tp = tray.position.clone(); await tween(700, (e) => { tray.position.set(tp.x + (2.55 - tp.x) * e, tp.y + (0.9 - tp.y) * e, tp.z + (2.75 - tp.z) * e); waiter.group.rotation.x = -0.35 * Math.sin(e * Math.PI); });
      tray.visible = false; served.visible = true; if (window.Sound && Sound.on) { Sound.ok(); }
      const th2 = Math.atan2(x0 - x1, z0 - z1) + Math.PI; await tween(2200, (e) => { const x = x1 + (x0 - x1) * e, z = z1 + (z0 - z1) * e; waiter.group.position.set(x, Math.abs(Math.sin(e * 20)) * 0.03, z); waiter.group.rotation.y = th2; });
      waiter.group.visible = false;
    };
    { const C = Q.buildCrowd([[3.5, 2.6]], { seed: 12, yaw: () => Math.PI / 2 }); root.add(C.group); C.obst.forEach((o) => W.obst.push(o)); tag(C.group, 'chelu'); W.chelu = C.group; }

    /* ---------- gente que pasea; en el apocalipsis, la que huye ---------- */
    /* Paseantes: entran por una calle, caminan de frente, se paran a mirar el oso, la fuente, el Kilómetro Cero o el reloj, y salen por otra calle.
       Nunca cruzan edificios: solo hay dos bocas (la de Mayor a la izquierda y la de Alcalá a la derecha) y siempre pasan por su punto de entrada. */
    const MOUTH = [{ app: [-13.8, 0.5], out: [-29, 0.5] }, { app: [13.8, -3.5], out: [29, -3.5] }];
    const SIGHTS = [{ p: [5.0, -1.6], look: [7, 1.0, -2.5] }, { p: [8.8, -1.2], look: [7, 1.0, -2.5] }, { p: [-4.6, -1.4], look: [-7, 1.0, -3.5] }, { p: [-8.9, -1.0], look: [-7, 1.0, -3.5] }, { p: [0.0, -3.9], look: [0, 0.0, -5.6] }, { p: [-1.6, -2.6], look: [0, 12.5, -8.8] }, { p: [1.8, -2.6], look: [0, 12.5, -8.8] }];
    const walkers = [];
    for (let i = 0; i < 9; i++) {
      const w = Q.buildCrowd([[0, 0]], { seed: 300 + i, yaw: () => 0 }); root.add(w.group);
      const o = { minX: 0, maxX: 0, minZ: 0, maxZ: 0, own: w.group.position }; W.obst.push(o);
      const m0 = MOUTH[i % 2]; w.group.position.set(m0.app[0] + (i % 2 ? 1 : -1) * rnd() * 5, 0, m0.app[1] + (rnd() - 0.5) * 3);
      walkers.push({ g: w.group, v: 0.7 + rnd() * 0.5, o, route: [], mode: 'go', t: 0, face: null, side: 0, sideT: 0, from: i % 2 });
    }
    const planRoute = (w) => {                      // próximo destino: mirar algo y luego salir, o salir directamente por la calle más lejana
      const p = w.g.position, far = p.x < 0 ? MOUTH[1] : MOUTH[0], near = p.x < 0 ? MOUTH[0] : MOUTH[1];
      if (rnd() < 0.7) { const sight = SIGHTS[(rnd() * SIGHTS.length) | 0]; w.route = [{ to: sight.p, watch: sight }, { to: far.app }, { to: far.out, leave: true }]; }
      else w.route = [{ to: far.app }, { to: far.out, leave: true }];
      w.mode = 'go';
    };
    walkers.forEach((w) => planRoute(w));
    const walkerPos = () => walkers.filter((q) => q.g.visible).map((q) => q.g.position).concat(waiter.group.visible ? [waiter.group.position] : []);
    { let tries = 0; walkers.forEach((w) => { while (tries++ < 400 && (W.obst.some((o) => o.own !== w.g.position && w.g.position.x > o.minX - 0.4 && w.g.position.x < o.maxX + 0.4 && w.g.position.z > o.minZ - 0.4 && w.g.position.z < o.maxZ + 0.4))) w.g.position.z += 0.7; }); }
    const infected = []; for (let i = 0; i < 20; i++) { const w = Q.buildCrowd([[0, 0]], { seed: 400 + i, yaw: () => 0, zombie: true }); w.group.visible = false; root.add(w.group); const gate = [[-14, -1.5], [14, -2.5], [-3, -11], [-7, 12], [12, 11]][i % 5]; w.group.position.set(gate[0], 0, gate[1]); infected.push({ g: w.group, v: 1.0 + rnd() * 0.7, ph: rnd() * 6, start: gate }); }
    W.infected = infected;
    /* ---------- la moto del Pasota: llega al final y os rescata al Grandullón y a ti ---------- */
    const moto = new THREE.Group(); moto.visible = false; root.add(moto); const wheels = [];
    { const dk = std(0x1c1c20, 0.4, { metalness: 0.6 }), rd2 = std(0xb3202a, 0.4, { metalness: 0.4 });
      [0.6, -0.6].forEach((x) => { const w = put(new THREE.TorusGeometry(0.3, 0.08, 8, 16), dk, x, 0.38, 0, moto); wheels.push(w); put(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), dk, x, 0.38, 0, moto).rotation.x = Math.PI / 2; });
      put(new THREE.BoxGeometry(1.1, 0.26, 0.3), rd2, 0.05, 0.72, 0, moto); put(new THREE.BoxGeometry(0.5, 0.22, 0.34), rd2, 0.35, 0.95, 0, moto); put(new THREE.BoxGeometry(0.6, 0.12, 0.3), dk, -0.3, 0.9, 0, moto);
      put(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), dk, 0.65, 0.75, 0, moto).rotation.z = 0.35; put(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), dk, 0.74, 1.12, 0, moto).rotation.x = Math.PI / 2;
      put(new THREE.SphereGeometry(0.1, 10, 8), emis(0xfff4d0, 3), 0.82, 0.95, 0, moto); const hl = new THREE.PointLight(0xfff0d0, 1.6, 10, 2); hl.position.set(1.0, 0.95, 0); moto.add(hl);
      const D = Q.buildCrowd([[0, 0]], { seed: 77, yaw: () => -Math.PI / 2, cap: true, pasota: true }); D.group.position.set(-0.3, 0.45, 0); D.group.scale.setScalar(0.9); moto.add(D.group); W.dani = D.group;
      const [c, g] = cv(128, 32); g.fillStyle = '#c4202c'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#fff'; g.font = '700 22px Georgia'; g.textAlign = 'center'; g.fillText('PASOTA', 64, 24); const tg = put(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshBasicMaterial({ map: Q.toTex(c), toneMapped: false, side: THREE.DoubleSide }), -0.7, 0.72, 0.18, moto); }
    W.rescue = async (api) => {
      const { say, tween, P } = api;
      if (window.Sound && Sound.on) Sound.moto(1);
      await say(['Por la calle Mayor, sobre el ruido de la plaza, un rugido de motor. Un solo faro que barra el humo como un haz de interrogantes.']);
      { const y0 = P.yaw, dy = ((-Math.PI / 2 - y0 + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI, p0 = P.pitch; await tween(900, (e) => { P.yaw = y0 + dy * e; P.pitch = p0 * (1 - e) - 0.04 * e; }); }
      moto.visible = true; moto.position.set(30, 0, -3.5); moto.rotation.y = Math.PI;
      const tx = P.x + 2.4, tzm = P.z + 0.8; await tween(3600, (e) => { const k = e < 0.6 ? e / 0.6 : 1, mk = e < 0.6 ? 0 : (e - 0.6) / 0.4, ox = moto.position.x, oz = moto.position.z, nx = e < 0.6 ? 30 + (13.8 - 30) * k : 13.8 + (tx - 13.8) * mk * mk * (3 - 2 * mk), nz = e < 0.6 ? -3.5 : -3.5 + (tzm + 3.5) * mk * mk * (3 - 2 * mk); moto.position.set(nx, 0, nz); if (Math.hypot(nx - ox, nz - oz) > 1e-4) moto.rotation.y = Math.atan2(-(nz - oz), nx - ox); wheels.forEach((w) => { w.rotation.z -= 0.5 * (1 - e) + 0.1; }); });
      if (window.Sound && Sound.on) Sound.brake();
      await say(['Un chico con el casco a medio abrochar derrapa justo delante de ti. El Pasota, que llega siempre tarde a todo menos a esto. Para los amigos, el Pasota; para los acreedores, ilocalizable.',
        '—¡Subid, que esto está peor que el cercanías a las ocho! —grita el Pasota, sin apagar el motor.']);
      // el Grandullón corre hasta la moto y se sube detrás del Pasota
      const c0 = [3.5, 2.6], mz = moto.position.z, sx = tx + 1.3, sz = mz + 0.9;
      await tween(1500, (e) => { W.chelu.position.set((sx - c0[0]) * e, Math.abs(Math.sin(e * 16)) * 0.05, (sz - c0[1]) * e); W.chelu.rotation.y = Math.atan2(sx - c0[0], sz - c0[1]) + Math.PI; });
      await say([{ text: 'El Grandullón, resoplando junto a la moto: «¿Tú sabes conducir esto?»', think: false }, '—Con 125 centímetros cúbicos y cero papeles: ¡arriba! —responde el Pasota.']);
      if (window.Sound && Sound.on) Sound.click();
      await tween(700, (e) => { W.chelu.position.set(sx - c0[0] - 0.55 * e, Math.sin(e * Math.PI) * 0.55 + 0.45 * e, sz - c0[1] - 0.9 * e); W.chelu.rotation.y = -Math.PI / 2 + 0.0; });       // sube de un salto y se agarra al asiento
      // tú: caminas hacia la moto en primera persona, subes la pierna y te acomodas detrás
      { const x0 = P.x, z0 = P.z, y0 = P.yaw, tx2 = tx + 2.2, tz2 = mz + 0.55, a2 = Math.atan2(-(tx - tx2), -(mz - tz2));
        await tween(1300, (e) => { P.x = x0 + (tx2 - x0) * e; P.z = z0 + (tz2 - z0) * e; P.walk = 1; P.yaw = y0 + (((a2 - y0 + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * e; P.pitch = -0.12 * e; }); P.walk = 0;
        await tween(900, (e) => { P.x = tx2 - 0.6 * e; P.z = tz2 - 0.35 * e; P.dy = Math.sin(e * Math.PI) * 0.32 - 0.14 * e; P.pitch = -0.12 + 0.12 * e; P.yaw += 0.001; }); }
      await say([{ text: 'Dos ruedas: menos masa, más varianza. La decisión menos aseguradora de tu vida. Y la única que funciona.', think: true, block: true }]);
      // arranca: la cámara va en el asiento de atrás, mirando la espalda del Pasota y la calle que se aleja
      if (window.Sound && Sound.on) Sound.moto(1.3);
      { const x1 = moto.position.x, z1 = moto.position.z, P0y = P.yaw, look = Math.PI / 2;
        await tween(3600, (e) => { const mx = x1 - 25 * e * e, pz = z1 + (0.5 - z1) * Math.min(1, (x1 - mx) / 9), ox = moto.position.x, oz = moto.position.z; moto.position.set(mx, 0, pz); if (Math.hypot(mx - ox, pz - oz) > 1e-4) moto.rotation.y = Math.atan2(-(pz - oz), mx - ox); wheels.forEach((w) => { w.rotation.z -= 0.5; });
          W.chelu.position.set(mx + 0.9 - c0[0], 0.5 + Math.sin(e * 40) * 0.01, pz - c0[1]); P.x = mx + 1.35; P.z = pz; P.yaw = P0y + (((look - P0y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * Math.min(1, e * 3); P.dy = -0.12 + Math.sin(e * 55) * 0.006; P.pitch = -0.04 + Math.sin(e * 9) * 0.01; });
        P.dy = 0; W.chelu.visible = false; }
    };
    /* ---------- fuego, humo y coche volcado: solo cuando llega el fin ---------- */
    const fxg = new THREE.Group(); fxg.visible = false; root.add(fxg);
    { const car = put(new THREE.BoxGeometry(2.2, 0.8, 1.1), std(0x4a1a1a, 0.4, { metalness: 0.5 }), 6.0, 0.55, -6.0, fxg); car.rotation.set(0.3, 0.5, 1.2); put(new THREE.BoxGeometry(1.2, 0.5, 1.0), std(0x2a0e0e, 0.5), 5.6, 0.9, -6.0, fxg).rotation.set(0.3, 0.5, 1.2);
      [[-12, 1.2, -2], [9, 1.2, -8], [-1, 1.2, 9], [12, 1.0, 5]].forEach(([x, y, z]) => { const l = new THREE.PointLight(0xff6a20, 1.4, 12, 2); l.position.set(x, y, z); fxg.add(l); lamps.push(l); const [c, g] = cv(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,180,70,.95)'); gr.addColorStop(1, 'rgba(255,60,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.toTex(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.position.set(x, 1.4, z); sp.scale.setScalar(3.2); fxg.add(sp); W.tick.push((dt, t) => { sp.scale.setScalar(2.8 + Math.sin(t * 9 + x) * 0.5); }); });
      const [sc, sg] = cv(128, 128); const sr = sg.createRadialGradient(64, 64, 0, 64, 64, 64); sr.addColorStop(0, 'rgba(40,34,32,.7)'); sr.addColorStop(1, 'rgba(40,34,32,0)'); sg.fillStyle = sr; sg.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 8; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.toTex(sc), transparent: true, depthWrite: false, opacity: 0.55, fog: false })); sp.position.set(-14 + i * 4, 6 + (i % 3) * 3, -9 + (i % 4) * 4); sp.scale.setScalar(9); fxg.add(sp); W.tick.push((dt, t) => { sp.position.y = 6 + ((i * 2 + t * 0.8) % 12); }); } }
    // una pistola olvidada en la mesa de la terraza, que solo aparece cuando llega el fin
    const gun = new THREE.Group(); gun.visible = false; root.add(gun); put(new THREE.BoxGeometry(0.2, 0.1, 0.04), std(0x14161a, 0.3, { metalness: 0.7 }), 0, 0, 0, gun); put(new THREE.BoxGeometry(0.06, 0.12, 0.04), std(0x14161a, 0.3, { metalness: 0.7 }), -0.06, -0.09, 0, gun); put(new THREE.BoxGeometry(0.28, 0.035, 0.035), std(0x2a2d33, 0.25, { metalness: 0.9 }), 0.08, 0.04, 0, gun);
    const shot = new THREE.Group(); shot.visible = false; root.add(shot); put(new THREE.BoxGeometry(0.75, 0.05, 0.05), std(0x2a2d33, 0.25, { metalness: 0.9 }), 0, 0, 0, shot); put(new THREE.BoxGeometry(0.28, 0.07, 0.06), std(0x5a3a22, 0.6), -0.28, -0.02, 0, shot); shot.position.set(-3.2, 0.8, 1.0); shot.rotation.y = 0.3; tag(shot, 'escopeta'); W.shotMesh = shot;
    gun.position.set(5.5, 0.78, 4.4); gun.rotation.y = 0.6; tag(gun, 'pistola'); W.gunMesh = gun; { const l = new THREE.PointLight(0xffe0a0, 0.5, 2.5, 2); l.position.set(0, 0.3, 0); gun.add(l); }
    // boca de metro: cartel verde para el refugio
    put(new THREE.PlaneGeometry(1.8, 0.5), emis(0x30d070, 1.6), -10.5, 2.55, 3.15);
    W.setApoc = (on) => { W.apoc = on; sky.material.map = on ? skyB : skyA; sky.material.needsUpdate = true; scene.fog.color.set(on ? 0x4a1810 : 0x4a4058); scene.background.set(on ? 0x3a1008 : 0x3a3350); sun.color.set(on ? 0xff4a20 : 0xff9a60); hemi.color.set(on ? 0xa05040 : 0x8a82ac); infected.forEach((z) => { z.g.visible = on; }); fxg.visible = on; gun.visible = on && !Q.apoc.hasGun(); shot.visible = on && !Q.apoc.hasGun('escopeta'); };
    W.tick.push((dt, t) => {
      walkers.forEach((w) => {
        const p = w.g.position;
        if (W.apoc) {                                                    // huyen por la calle más cercana, de frente y sin atravesar edificios
          if (!w.flee) { const m = p.x < 0 ? MOUTH[0] : MOUTH[1]; w.flee = [{ to: m.app }, { to: m.out, leave: true }]; }
          const step = w.flee[0], dx = step.to[0] - p.x, dz = step.to[1] - p.z, d = Math.hypot(dx, dz) || 1;
          if (Q.npcStep(p, dx / d * 3.4 * dt, dz / d * 3.4 * dt, 0.3, W.obst, walkerPos())) Q.npcStep(p, -dz / d * 3.4 * dt, dx / d * 3.4 * dt, 0.3, W.obst, walkerPos());
          w.g.rotation.y = Math.atan2(dx, dz) + Math.PI; if (d < 0.7) { if (step.leave) w.g.visible = false; else w.flee.shift(); }
        } else if (w.mode === 'watch') {                                 // se queda observando el monumento y luego sigue
          w.t -= dt; if (w.face) w.g.rotation.y = Math.atan2(w.face[0] - p.x, w.face[2] - p.z) + Math.PI + Math.sin(performance.now() / 900 + w.v * 9) * 0.06;
          if (w.t <= 0) { w.mode = 'go'; w.face = null; }
        } else {
          const step = w.route[0]; if (!step) { planRoute(w); }
          else {
            const dx = step.to[0] - p.x, dz = step.to[1] - p.z, d = Math.hypot(dx, dz) || 1, sp = w.v * dt;
            if (d < 0.5) { if (step.watch) { w.mode = 'watch'; w.t = 3 + rnd() * 5; w.face = step.watch.look; } if (step.leave) { const o = MOUTH[(p.x < 0 ? 1 : 0)]; p.set(o.out[0], 0, o.out[1] + (rnd() - 0.5) * 0.8); w.route = [{ to: o.app }]; planRoute(w); w.route.unshift({ to: o.app }); } else w.route.shift(); }
            else {
              let moved = true; const bl = Q.npcStep(p, dx / d * sp, dz / d * sp, 0.3, W.obst, walkerPos());
              if (bl) { w.sideT = 0.9; w.side = w.side || (rnd() < 0.5 ? 1 : -1); } if (w.sideT > 0) { w.sideT -= dt; Q.npcStep(p, -dz / d * sp * 1.1 * w.side, dx / d * sp * 1.1 * w.side, 0.3, W.obst, walkerPos()); } else w.side = 0;
              w.g.rotation.y = Math.atan2(dx, dz) + Math.PI;               // siempre de cara a donde caminan
            }
          }
        }
        w.o.minX = p.x - 0.27; w.o.maxX = p.x + 0.27; w.o.minZ = p.z - 0.27; w.o.maxZ = p.z + 0.27; });
      if (W.apoc) lamps.forEach((l, i) => { l.intensity = 0.5 + 0.5 * Math.max(0, Math.sin(t * 4 + i * 2)); });
    });

    /* ---------- interacciones ---------- */
    W.acts.pistola = { label: 'Coger la pistola', stand: [4.7, 3.6], look: [5.5, 0.8, 4.4], enabled: () => W.apocOn && !Q.apoc.hasGun(), run: async (api) => { await Q.apoc.fly(api, W.gunMesh); await api.hand('gun', 1000); Q.apoc.giveGun(); W.gunMesh.visible = false; await api.say(['Una pistola abandonada junto a una caña a medias y una porra de agente. Doce balas, calibre desconocido y fecha de caducidad probablemente vencida.', { text: 'La única póliza que cubre esto es la de seguro de hogar. Y no cubre zombis. Clic para disparar.', think: true }]); } };
    W.acts.escopeta = { label: 'Coger la escopeta', stand: [-2.2, 2.0], look: [-3.2, 0.8, 1.0], enabled: () => W.apocOn && !Q.apoc.hasGun('escopeta'), run: async (api) => { await Q.apoc.fly(api, W.shotMesh); await api.hand('gun', 1000); Q.apoc.giveGun('escopeta'); W.shotMesh.visible = false; await api.say(['Una escopeta de caza que alguien dejó en una terraza, entre dos cañas. Pocos cartuchos, mucho poder de convicción.', { text: 'Dispara en abanico: abate a varios de golpe. Clic para disparar.', think: true }]); } };
    W.acts.arma = { label: 'Coger una silla de la terraza', stand: [4.6, 3.4], look: [5.6, 0.5, 4.2], enabled: () => W.apocOn && !W.armed, run: async (api) => { W.armed = true; Q.apoc.pick(); await api.say('Una silla metálica de terraza. Pesa justo lo que debe pesar un argumento. F para empujar con ella.'); } };
    W.acts.cerveza = { label: 'Pedir unas cañas', stand: [3.0, 4.3], look: [2.6, 0.9, 2.6], enabled: () => !W.barra, run: async (api) => { W.barra = true; await W.serve(api); await api.hand('beer', 3200); await api.say(['El camarero te planta dos cañas con una espuma de ingeniería y un aperitivo que cuesta más que la cerveza.', 'Brindas por el consumo privado, que es lo único que sube en esta ciudad.']); } };
    W.acts.tienda = { label: 'Mirar la tienda de campaña naranja', stand: [-4.2, 1.6], look: [-5.2, 0.9, 3.0], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['Una tienda de campaña en pleno Sol, con un cartel: «SE ALQUILA ESTUDIO, 900 €». Es, por lo menos, un anuncio honesto.', { text: 'Oferta: una tienda. Demanda: toda una generación. El precio de equilibrio es dormir en la plaza.', think: true }]); } };
    W.acts.tienda2 = { label: 'Mirar la tienda de campaña azul', stand: [-8.8, 7.4], look: [-7.6, 0.9, 6.0], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['Dentro de la tienda azul hay alguien con una sudadera de «Máster en Big Data», leyendo los términos y condiciones de un cajero. Lleva tres semanas acampado «por backtesting».', { text: 'Su modelo dice que vivir aquí tiene un R² altísimo. Con un intervalo de confianza del ancho de la plaza.', think: true }]); } };
    W.acts.perro = { label: 'Mirar al perro de la tienda', stand: [-1.7, 3.0], look: [-2.9, 0.5, 3.9], enabled: () => true, run: async (api) => { await api.say(['Un perro atado a la tienda naranja, con cara de auditor interno: te mira, mira tu cartera, concluye que no hay materialidad y vuelve a dormirse.', { text: 'En la chapa pone «Coste de Oportunidad». Lo bautizó, sin duda, un economista en paro.', think: true }]); } };
    W.acts.km0 = { label: 'Mirar el Kilómetro Cero', stand: [0, -3.8], look: [0, 0, -5.6], enabled: () => true, run: async (api) => { await api.say(['Kilómetro Cero: desde aquí se miden todas las carreteras de España. Todo está a una distancia positiva de este punto, que es, técnicamente, la mejor definición de «centro».', { text: 'Cualquier medida necesita un origen. En el mercado laboral, también.', think: true }]); } };
    W.acts.oso = { label: 'Mirar el oso y el madroño', stand: [5.4, -0.6], look: [7, 1.4, -2.5], enabled: () => true, run: async (api) => { await api.say(['El oso y el madroño: el símbolo de Madrid. El oso se come las frutas del árbol que, a su vez, depende de que el oso se las coma. Un ciclo cerrado. Los actuarios lo llaman «reaseguro»; los demás, «amistad».']); } };
    W.acts.fuente = { label: 'Mirar la fuente', stand: [-5.0, -1.0], look: [-7, 1.2, -3.5], enabled: () => true, run: async (api) => { await api.say('La Mariblanca, o su fuente. Cientos de monedas en el fondo. El rendimiento medio de un deseo es del 0 %, pero con una desviación enorme.'); } };
    W.acts.reloj = { label: 'Mirar el reloj de la Casa de Correos', stand: [0, -2.6], look: [0, 12.95, -8.85], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['El reloj de la Real Casa de Correos. El que marca las campanadas de Nochevieja. Hoy marca las siete y diez de la tarde, y alguien ha tosido con rabia en la torre.', { text: 'Lleva unos minutos parado. Y eso que es el reloj de referencia nacional.', think: true }]); } };
    W.acts.chelu = { label: 'Hablar con el Grandullón', stand: [2.2, 3.9], look: [3.5, 1.5, 2.6], enabled: () => W.barra && W.ronda < 2, run: async (api) => {
      const { say, choose } = api, n = W.ronda++;
      if (n === 0) {
        await say(['—Sol. Mira cómo está de gente: unos para comprar, otros para vender, nadie para pagar. —El Grandullón levanta la caña—. Por los que suben.']);
        const r = await choose([{ id: 'a', label: '«Por los que suben… menos el IPC»', hint: 'Brindar con humor' }, { id: 'b', label: '«Hoy me ha pasado algo muy raro en el andén»', hint: 'Contar lo de la gente de 40-50 años' }, { id: 'c', label: '«Otra, y no me hagas pensar»', hint: 'Dejarse llevar' }], 'Primera ronda');
        await say(r === 'a' ? '—Eso es: el IPC como la ex, que siempre vuelve más caro.' : r === 'b' ? '—Eso es sesgo de supervivencia, chaval: ves a los vivos porque los muertos no cogen el cercanías.' : '—Esa es mi filosofía. Cero estructura, cien por cien liquidez.');
      } else {
        await say(['—¿Y tu novia? ¿Sigue convencida de que todo lo arreglas con una hoja de cálculo? —pregunta el Grandullón.', 'Tu novia, la psicóloga, diría que evitar sentir también es una forma de sentir, pero con peor cobertura.']);
        const r = await choose([{ id: 'a', label: '«Dice que huyo hacia delante con espuma»', hint: 'Honestidad con cerveza' }, { id: 'b', label: '«Dice que soy un modelo bien especificado»', hint: 'Orgullo actuarial' }, { id: 'c', label: '«Cambia de tema, el Grandullón»', hint: 'Evitar la sesión' }], 'Segunda ronda');
        await say(r === 'a' ? '—Pues tiene razón. Que Freud la ampare.' : r === 'b' ? '—Eso no es un cumplido, es un diagnóstico.' : '—Ya hablo de otra cosa… oye, ¿has oído eso?');
        W.fin = true;
      } } };
    W.play = async (api) => {
      W.api = api; const { say, free, wait, S } = api;
      if (!opts.retry) say([{ text: 'Dos tiendas de campaña en mitad de Sol, con su perro y todo. Madre mía: hace poco había de verdad y ahora hay copias. Esto no es un campamento, es el mercado inmobiliario hablando.', think: true }]);
      if (!opts.retry) await say(['Puerta del Sol. 19:10. Te dejas llevar: el tren se fue y el móvil ya había decidido por ti.', 'Madrid entero parece haberse puesto de acuerdo en pasar por aquí: turistas, oficinistas, un oso de bronce con su madroño y un el Grandullón en una terraza.']);
      if (!opts.retry) await free(1e9, 'Pide las cañas · habla con el Grandullón (dos rondas) · mira alrededor', () => W.fin); else { W.barra = true; W.ronda = 2; W.fin = true; }
      if (window.Sound && Sound.on) Sound.siren(5);
      if (opts.retry) await say(['Otra vez: la plaza se vacía, el cielo se pone naranja y ya vienen por las calles. Corre hacia el metro.']); else await say(['De pronto, el ruido de la plaza cambia. Primero una sirena. Luego otra, más cerca. Los paseantes aceleran, luego corren.', 'El cielo se vuelve de un naranja antinatural. Las farolas parpadean. En la boca de la calle Mayor se mueve algo que no camina como un vecino.']);
      W.setApoc(true); if (window.Sound && Sound.on) { Sound.shout(0.07); setTimeout(() => Sound.shout(0.07), 700); }
      Q.apoc.start(W, { refuge: [-10.5, 5.3], r: 1.9, refugeLabel: 'marquesina del metro', gates: [[-5.2, 3.0], [-7.6, 6.0], [-5.2, 3.0], [-7.6, 6.0], [-30, 0.5], [30, -3.5]], enemies: infected.map((z) => ({ g: z.g, v: z.v * 0.7, ph: z.ph })),
        quips: [['Alerta', 'Las tiendas de campaña se mueven solas. Es el único movimiento ciudadano que ha funcionado.'], ['Chelu', '¡A la boca del metro! Arriba hay turistas y abajo hay cobertura. Elige.'], ['Amor', 'No te pares. Huir es una conducta adaptativa, no una derrota.'], ['Chelu', 'Si pierdes una vida, recuerda: el seguro no cubre mordiscos.'], ['Sheldon', 'Pregunta técnica: ¿con qué frecuencia mueren los asegurados? Es para la tarifa.'], ['Amor', 'Coge algo contundente. Un argumento, una silla, lo que tengas a mano.']], onEnd: () => { } });
      const skipped = await free(1e9, 'Corre (Shift) hasta la boca del metro, la flecha roja · F empuja a los infectados · puedes coger una silla de la terraza', () => W.apocRes);
      if (skipped && !W.apocRes) { Q.apoc.stop(); W.apocRes = 'refugio'; }
      if (W.apocRes === 'refugio') { await W.rescue(api); return 'rescatado'; }
      return 'muerto';
    };
    return W;
  };
})();
