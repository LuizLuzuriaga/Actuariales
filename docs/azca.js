/* azca.js — nivel 4: Azca al amanecer. La plaza de las torres de cristal, tu edificio de oficinas (torre de cristal con un paño vertical de metal oscuro y
   un cartel rojo sin letras: no se dibuja ninguna marca), el quiosco de café, bancos, y las pistas de que algo va mal. Devuelve un «mundo» como el del andén. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;
  const R2 = Math.PI * 2;
  const { ellipsoid, paint, crowdMat } = Q.toonKit;

  Q.buildAzca = (renderer, envTex) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a4258); scene.fog = new THREE.FogExp2(0x4a4f63, 0.014);
    if (envTex) scene.environment = envTex;
    const W = { scene, obst: [], tick: [], acts: {}, actRoots: [], bounds: { minX: -11, maxX: 11, minZ: -6.3, maxZ: 6.6 }, spawn: [-9.6, 4.6], look: [5, 2.6, -5], exit: false, pistas: 0, extra: false };
    const rnd = Q.rng(4040), root = new THREE.Group(); scene.add(root);
    const put = (geo, m, x = 0, y = 0, z = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
    const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
    const emis = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
    const tag = (obj, id) => { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); W.actRoots.push(obj); };
    const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const cy = (rt, rb, h, x, y, z, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg).translate(x, y, z);
    const merged = (parts, m, parent = root) => { const o = new THREE.Mesh(MG.mergeBufferGeometries(parts), m); parent.add(o); return o; };
    const cv = (w, h) => { const c = Q.cvs(w, h); return [c, c.getContext('2d')]; };
    const tx = (c) => Q.toTex(c);
    const box = (x, z, w, d) => W.obst.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

    /* ---------- luz de amanecer: fría y baja, con un borde naranja ---------- */
    scene.add(new THREE.HemisphereLight(0x8fa0c0, 0x2c2622, 0.95));
    const sun = new THREE.DirectionalLight(0xffa868, 1.15); sun.position.set(40, 12, -20); scene.add(sun);

    /* ---------- cielo con gradiente y sol bajo ---------- */
    { const [c, g] = cv(8, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#141c34'); gr.addColorStop(0.45, '#3a4a72'); gr.addColorStop(0.75, '#a77a7a'); gr.addColorStop(0.9, '#e0a070'); gr.addColorStop(1, '#f0c090'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
      const sky = put(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({ map: tx(c), side: THREE.BackSide, fog: false, depthWrite: false }), 0, 0, 0); sky.renderOrder = -2;
      const [s, sg] = cv(128, 128); const sr = sg.createRadialGradient(64, 64, 0, 64, 64, 64); sr.addColorStop(0, 'rgba(255,220,160,.95)'); sr.addColorStop(0.3, 'rgba(255,170,100,.45)'); sr.addColorStop(1, 'rgba(255,150,80,0)'); sg.fillStyle = sr; sg.fillRect(0, 0, 128, 128);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx(s), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.position.set(80, 8, -80); sp.scale.setScalar(70); root.add(sp); }

    /* ---------- suelo: losas de granito mojadas por el rocío ---------- */
    { const t = Q.pbr(512, 512, (g, hg, rg, w, h) => {
        const r = Q.rng(21); g.fillStyle = '#26282b'; g.fillRect(0, 0, w, h); hg.fillStyle = '#303030'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#c0c0c0'; rg.fillRect(0, 0, w, h);
        for (let ty = 0; ty < 2; ty++) for (let tx2 = 0; tx2 < 2; tx2++) { const k = 0.85 + r() * 0.3, x = tx2 * 256 + 3, y = ty * 256 + 3; g.fillStyle = `rgb(${86 * k | 0},${88 * k | 0},${92 * k | 0})`; g.fillRect(x, y, 250, 250); hg.fillStyle = '#a0a0a0'; hg.fillRect(x, y, 250, 250); rg.fillStyle = `rgb(${60 + r() * 60 | 0},${60 + r() * 60 | 0},${60 + r() * 60 | 0})`; rg.fillRect(x, y, 250, 250); }
        for (let i = 0; i < 9000; i++) { const x = r() * w, y = r() * h, d = r() < 0.5; g.fillStyle = d ? `rgba(20,20,22,${r() * 0.3})` : `rgba(210,210,215,${r() * 0.22})`; g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2); }
        for (let i = 0; i < 8; i++) { const x = r() * w, y = r() * h, rad = 30 + r() * 70, gr = rg.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(10,10,10,.7)'); gr.addColorStop(1, 'rgba(10,10,10,0)'); rg.fillStyle = gr; rg.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      }, { strength: 2.2, repeat: [25, 18], rough: true });
      const f = put(new THREE.PlaneGeometry(60, 44), new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1 }), 0, 0, 0); f.rotation.x = -Math.PI / 2; }

    /* ---------- fachadas de cristal con ventanas encendidas ---------- */
    const facade = (cols, rows, lit, seed, allLit) => {
      const CW = 16, CH = 22, [c, g] = cv(cols * CW, rows * CH), [e, eg] = cv(cols * CW, rows * CH), r = Q.rng(seed);
      eg.fillStyle = '#000'; eg.fillRect(0, 0, e.width, e.height);
      for (let j = 0; j < rows; j++) { const k = 1 - j / rows; for (let i = 0; i < cols; i++) {
        const x = i * CW, y = j * CH, on = allLit ? r() < 0.97 : r() < lit;
        const base = `rgb(${Math.round(60 + 70 * k * 0.5 + r() * 14)},${Math.round(82 + 70 * k * 0.5 + r() * 14)},${Math.round(112 + 60 * k * 0.4 + r() * 14)})`;
        g.fillStyle = on ? `rgb(${236 + (r() * 16 | 0)},${200 + (r() * 26 | 0)},${140 + (r() * 30 | 0)})` : base; g.fillRect(x, y, CW, CH);
        if (on) { eg.fillStyle = `rgb(${210 + (r() * 30 | 0)},${170 + (r() * 30 | 0)},${100 + (r() * 30 | 0)})`; eg.fillRect(x + 2, y + 2, CW - 4, CH - 5); }
        g.fillStyle = 'rgba(8,10,14,.85)'; g.fillRect(x, y, CW, 2); g.fillRect(x, y, 2, CH); } }
      const gl = g.createLinearGradient(0, 0, 0, e.height); gl.addColorStop(0, 'rgba(255,200,150,0)'); gl.addColorStop(1, 'rgba(255,170,120,.22)'); g.fillStyle = gl; g.fillRect(0, 0, c.width, c.height);
      return { map: tx(c), emissiveMap: tx(e) };
    };
    const tower = (x, y, z, w, h, d, lit, seed, allLit, fins) => {
      let sideM;
      if (fins) { const [c, g] = cv(64, 256); g.fillStyle = '#25272a'; g.fillRect(0, 0, 64, 256); for (let i = 0; i < 64; i += 8) { g.fillStyle = '#3c3f43'; g.fillRect(i, 0, 3, 256); g.fillStyle = '#121315'; g.fillRect(i + 5, 0, 2, 256); } for (let j = 0; j < 256; j += 85) { g.fillStyle = '#0c0d0e'; g.fillRect(0, j, 64, 3); } sideM = new THREE.MeshStandardMaterial({ map: tx(c), roughness: 0.45, metalness: 0.7 }); }
      else { const t = facade(Math.max(4, Math.round(w / 0.95)), Math.max(6, Math.round(h / 1.7)), lit, seed, allLit); sideM = new THREE.MeshStandardMaterial({ map: t.map, emissive: 0xffffff, emissiveMap: t.emissiveMap, emissiveIntensity: 0.9, roughness: 0.18, metalness: 0.55 }); }
      const topM = std(0x2a2d33, 0.7), m = [sideM, sideM, topM, topM, sideM, sideM];
      return put(new THREE.BoxGeometry(w, h, d), m, x, y, z);
    };
    tower(-4.0, 22, -10.5, 11, 44, 5, 0.2, 11);                 // torre de cristal de la aseguradora
    tower(2.9, 22, -9.3, 3.0, 44, 3.4, 0, 0, false, true);       // paño vertical de metal oscuro
    tower(10.5, 7, -8.2, 12, 14, 6, 0.3, 12);                   // bloque bajo con el vestíbulo
    tower(-17, 28, -10, 8, 56, 8, 0.12, 13);
    const luz = tower(23, 31, -14, 9, 62, 9, 0, 14, true);       // pista: una torre entera con todas las luces encendidas
    tower(-15, 9, 3, 4, 18, 14, 0.3, 15); tower(15.5, 9, 2.5, 4, 18, 12, 0.25, 16);
    [[-34, 18, -32, 14, 36, 14], [-10, 25, -42, 12, 50, 12], [12, 20, -40, 14, 40, 12], [34, 28, -36, 12, 56, 12]].forEach(([x, y, z, w, h, d], i) => tower(x, y, z, w, h, d, 0.22, 20 + i));
    tag(luz, 'luces');

    /* ---------- entrada de la aseguradora: vestíbulo iluminado, marquesina y cartel rojo sin letras ---------- */
    { const g = new THREE.Group(); g.position.set(8.5, 0, -5.05); root.add(g);
      const [c, c2] = cv(512, 256); const gr = c2.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#f2dba0'); gr.addColorStop(1, '#c9a870'); c2.fillStyle = gr; c2.fillRect(0, 0, 512, 256);
      c2.fillStyle = '#6b5a40'; c2.fillRect(0, 170, 512, 8); for (let i = 0; i < 4; i++) { c2.fillStyle = '#2a2b2e'; c2.fillRect(60 + i * 110, 120, 34, 60); c2.fillStyle = '#6a6e74'; c2.fillRect(64 + i * 110, 112, 26, 10); }
      c2.fillStyle = '#3a2f26'; c2.fillRect(300, 150, 150, 30); for (let i = 0; i < 6; i++) { c2.fillStyle = 'rgba(0,0,0,.18)'; c2.fillRect(i * 90, 0, 3, 256); }
      put(new THREE.PlaneGeometry(7, 3.4), new THREE.MeshStandardMaterial({ map: tx(c), emissive: 0xffffff, emissiveMap: tx(c), emissiveIntensity: 0.85, roughness: 0.1 }), 0, 1.7, 0.05, g);
      const fr = [bx(7.2, 0.12, 0.2, 0, 3.4, 0), bx(0.1, 3.4, 0.2, -3.55, 1.7, 0), bx(0.1, 3.4, 0.2, 3.55, 1.7, 0), bx(0.07, 3.4, 0.2, -1.2, 1.7, 0), bx(0.07, 3.4, 0.2, 1.2, 1.7, 0)];
      merged(fr, std(0x1b1d20, 0.4, { metalness: 0.7 }), g);
      put(new THREE.BoxGeometry(8.6, 0.25, 2.4), std(0x2a2d31, 0.5, { metalness: 0.5 }), 0, 3.9, 1.0, g);                       // marquesina
      put(new THREE.BoxGeometry(6.4, 0.7, 0.14), std(0xb3261e, 0.45), 0, 4.45, 0.1, g);                                          // cartel rojo (sin letras)
      put(new THREE.CylinderGeometry(0.9, 0.9, 2.4, 20, 1, true), std(0x9fb4b8, 0.05, { metalness: 0.4, transparent: true, opacity: 0.25, side: THREE.DoubleSide }), 0, 1.2, 0.45, g);   // puerta giratoria
      put(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8), std(0x888d90, 0.3, { metalness: 0.9 }), 0, 1.2, 0.45, g);
      const st = []; for (let i = 0; i < 4; i++) st.push(bx(7.6, 0.14, 0.55, 0, 0.07 + i * 0.14, 0.9 + (3 - i) * 0.5)); merged(st, std(0x5c5e62, 0.8), g);
      const l = new THREE.PointLight(0xffd8a0, 0.9, 9, 2); l.position.set(0, 2.2, 1.6); g.add(l);
      tag(g, 'entrada'); box(8.5, -4.2, 8.4, 2.2); }

    /* ---------- quiosco de café, con la persiana a medias ---------- */
    { const g = new THREE.Group(); g.position.set(-7.4, 0, -2.0); root.add(g);
      put(new THREE.BoxGeometry(3.0, 2.3, 2.0), std(0x24302e, 0.6), 0, 1.15, 0, g);
      put(new THREE.BoxGeometry(3.4, 0.14, 2.4), std(0x1a1d1f, 0.5), 0, 2.38, 0, g);
      put(new THREE.BoxGeometry(2.6, 0.9, 0.12), emis(0xf6d79b, 0.8), 0, 1.5, 1.03, g);                                       // hueco del mostrador iluminado
      put(new THREE.BoxGeometry(2.8, 0.45, 0.14), std(0x6a6d70, 0.5, { metalness: 0.6 }), 0, 1.78, 1.07, g);                   // persiana medio bajada
      put(new THREE.BoxGeometry(3.0, 0.08, 0.7), std(0x3a3d40, 0.6), 0, 1.02, 1.25, g);
      const [c, c2] = cv(512, 128); c2.fillStyle = '#10110f'; c2.fillRect(0, 0, 512, 128); c2.fillStyle = '#e8a23a'; c2.font = '700 64px Georgia'; c2.textAlign = 'left'; c2.fillText('CAFÉ', 22, 82); c2.fillStyle = '#d6d0c2'; c2.font = '700 40px Consolas'; c2.textAlign = 'right'; c2.fillText('2,40 €', 492, 78);
      put(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshBasicMaterial({ map: tx(c), toneMapped: false }), 0, 2.05, 1.09, g);
      const l = new THREE.PointLight(0xffc080, 0.7, 5, 2); l.position.set(0, 1.4, 1.6); g.add(l);
      tag(g, 'cafe'); box(-7.4, -2.0, 3.4, 2.4); }

    /* ---------- farolas, bancos, jardineras con árboles, coche parado ---------- */
    [[-5.5, 3.2], [6.5, 1.0]].forEach(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
      put(new THREE.CylinderGeometry(0.06, 0.09, 4.6, 8), std(0x202326, 0.5, { metalness: 0.6 }), 0, 2.3, 0, g); put(new THREE.BoxGeometry(0.9, 0.12, 0.3), emis(0xffa860, 1.6), 0.3, 4.6, 0, g);
      const l = new THREE.PointLight(0xffa860, 1.0, 11, 2); l.position.set(0.3, 4.3, 0); g.add(l); if (i === 0) W.tick.push((dt, t) => { l.intensity = 1.0 * (Math.sin(t * 37) * Math.sin(t * 5.1) > 0.94 ? 0.2 : 1); }); box(x, z, 0.4, 0.4); });
    { const bench = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; root.add(g);
        const parts = []; for (let i = 0; i < 5; i++) parts.push(bx(1.8, 0.04, 0.07, 0, 0.46, -0.2 + i * 0.1)); for (let i = 0; i < 3; i++) parts.push(bx(1.8, 0.04, 0.07, 0, 0.78 + i * 0.1, -0.28));
        merged(parts, std(0x5a432c, 0.7), g); merged([bx(0.06, 0.46, 0.5, -0.85, 0.23, 0), bx(0.06, 0.46, 0.5, 0.85, 0.23, 0), bx(0.06, 0.5, 0.06, -0.85, 0.7, -0.28), bx(0.06, 0.5, 0.06, 0.85, 0.7, -0.28)], std(0x1a1c1e, 0.5, { metalness: 0.7 }), g);
        tag(g, 'banco'); box(x, z, 2.0, 0.9); };
      bench(-3.0, 2.8, 0); bench(0.6, 5.0, Math.PI); bench(6.6, 5.2, 0); }
    { const trunks = [], foliage = [], planters = []; [[-9.0, -3.8], [-1.2, 0.2], [3.2, -3.0], [10.0, 3.2], [-9.8, 1.0]].forEach(([x, z]) => {
        planters.push(bx(1.2, 0.5, 1.2, x, 0.25, z)); const tr = cy(0.08, 0.1, 2.2, x, 1.6, z, 7); paint(tr, 0.16, 0.12, 0.09); trunks.push(tr);
        const f = ellipsoid(0.95, 1.1, 0.95, 12).translate(x, 3.1, z); paint(f, 0.2, 0.26, 0.2); foliage.push(f); const f2 = ellipsoid(0.65, 0.7, 0.65, 10).translate(x + 0.4, 3.6, z - 0.2); paint(f2, 0.24, 0.3, 0.22); foliage.push(f2); box(x, z, 1.2, 1.2); });
      merged(planters, std(0x45484c, 0.8)); const strip = (a) => a.map((q) => { const n = new THREE.BufferGeometry(); n.setAttribute('position', q.attributes.position); n.setAttribute('normal', q.attributes.normal); n.setAttribute('color', q.attributes.color); n.setIndex(q.index); return n; });
      merged(strip(trunks.concat(foliage)), crowdMat()); }
    { const g = new THREE.Group(); g.position.set(4.6, 0, 3.8); g.rotation.y = 0.35; root.add(g);
      merged([bx(4.2, 0.7, 1.8, 0, 0.62, 0), bx(2.2, 0.6, 1.62, -0.3, 1.25, 0)], std(0x5a2a2a, 0.35, { metalness: 0.5 }), g);
      merged([cy(0.34, 0.34, 0.24, 1.4, 0.34, 0.9, 14), cy(0.34, 0.34, 0.24, 1.4, 0.34, -0.9, 14), cy(0.34, 0.34, 0.24, -1.4, 0.34, 0.9, 14), cy(0.34, 0.34, 0.24, -1.4, 0.34, -0.9, 14)].map((q) => q.rotateX(Math.PI / 2)), std(0x0e0f10, 0.8), g);
      put(new THREE.PlaneGeometry(1.2, 0.5), std(0x5a2a2a, 0.35, { metalness: 0.5, side: THREE.DoubleSide }), 0.6, 0.95, 1.55, g).rotation.set(0, 0.2, 0);             // puerta abierta
      [-0.55, 0.55].forEach((z) => put(new THREE.CircleGeometry(0.14, 14), emis(0xfff4d8, 2.0), 2.11, 0.7, z, g).rotation.y = Math.PI / 2);
      const l = new THREE.PointLight(0xfff0d0, 0.8, 7, 2); l.position.set(2.8, 0.8, 0); g.add(l); tag(g, 'coche'); box(4.6, 3.8, 4.4, 2.4); }

    /* ---------- periódico en el suelo y basura ---------- */
    { const [c, g] = cv(256, 180); g.fillStyle = '#cfc9b6'; g.fillRect(0, 0, 256, 180); g.fillStyle = '#1a1a1a'; g.font = '700 22px Georgia'; g.fillText('SERVICIOS MÍNIMOS', 12, 36); g.font = '700 16px Georgia'; g.fillText('EN TODA LA REGIÓN', 12, 58); g.fillStyle = '#555'; for (let i = 0; i < 9; i++) g.fillRect(12, 82 + i * 10, 150 + (i * 37 % 80), 4); g.fillStyle = '#9a9588'; g.fillRect(170, 76, 74, 74);
      const p = put(new THREE.PlaneGeometry(0.55, 0.39), new THREE.MeshStandardMaterial({ map: tx(c), roughness: 0.9 }), 1.2, 0.012, -1.3); p.rotation.set(-Math.PI / 2, 0, 0.5); tag(p, 'periodico');
      const lit = []; for (let i = 0; i < 26; i++) { const t = rnd(), x = -10 + rnd() * 20, z = -5 + rnd() * 10; if (t < 0.4) { const cp = cy(0.035, 0.026, 0.09, x, 0.045, z, 8); cp.rotateZ(rnd() < 0.5 ? 1.5 : 0); lit.push(cp); } else { const pg = new THREE.BoxGeometry(0.12 + rnd() * 0.1, 0.004, 0.08 + rnd() * 0.12); pg.rotateY(rnd() * 3); lit.push(pg.translate(x, 0.006, z)); } }
      merged(lit, new THREE.MeshStandardMaterial({ color: 0xa8a496, roughness: 0.8 })); }

    /* ---------- gente de camino a la oficina ---------- */
    { const spots = []; for (let i = 0; i < 46 && spots.length < 15; i++) { const x = -8 + rnd() * 17, z = -4.4 + rnd() * 9.6; if (Math.hypot(x - W.spawn[0], z - W.spawn[1]) < 2.2 || W.obst.some((o) => x > o.minX - 0.6 && x < o.maxX + 0.6 && z > o.minZ - 0.6 && z < o.maxZ + 0.6) || spots.some(([a, b]) => Math.hypot(a - x, b - z) < 1.3)) continue; spots.push([x, z]); }
      const C = Q.buildCrowd(spots, { seed: 57, yaw: (r) => r() * R2 }); root.add(C.group); C.obst.forEach((o) => W.obst.push(o)); }

    /* ---------- pistas que crecen con tu descuido: gente corriendo, humo lejano, luces azules ---------- */
    W.extraGroup = new THREE.Group(); W.extraGroup.visible = false; root.add(W.extraGroup);
    { const run = Q.buildCrowd([[0, 0], [0.9, 0.5], [-0.8, 0.7]], { seed: 9, yaw: () => -Math.PI / 2 }); run.group.position.set(-14, 0, -3.4); W.extraGroup.add(run.group);
      W.tick.push((dt) => { if (!W.extraGroup.visible) return; run.group.position.x += dt * 3.6; if (run.group.position.x > 16) run.group.position.x = -16; });
      const [s, sg] = cv(128, 128); const sr = sg.createRadialGradient(64, 64, 0, 64, 64, 64); sr.addColorStop(0, 'rgba(60,56,54,.75)'); sr.addColorStop(1, 'rgba(60,56,54,0)'); sg.fillStyle = sr; sg.fillRect(0, 0, 128, 128);
      const smoke = []; for (let i = 0; i < 9; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx(s), transparent: true, depthWrite: false, opacity: 0.5, fog: false })); sp.position.set(-26 + i * 0.6, 8 + i * 6, -34); sp.scale.setScalar(10 + i * 3); W.extraGroup.add(sp); smoke.push(sp); }
      W.tick.push((dt, t) => { if (!W.extraGroup.visible) return; smoke.forEach((sp, i) => { sp.position.y = 8 + ((i * 6 + t * 1.6) % 54); sp.material.opacity = 0.5 * (1 - sp.position.y / 70); sp.position.x = -26 + i * 0.6 + Math.sin(t * 0.2 + i) * 1.4; }); });
      const bl = new THREE.PointLight(0x3b6cff, 0, 14, 2); bl.position.set(-16, 1.5, 6.4); W.extraGroup.add(bl);
      W.tick.push((dt, t) => { if (W.extraGroup.visible) bl.intensity = Math.max(0, Math.sin(t * 9)) * 2.4; }); }
    W.setExtra = (on) => { W.extra = on; W.extraGroup.visible = on; };

    /* ---------- interacciones ---------- */
    W.acts.torres = { label: 'Mirar las torres', stand: [-1.5, 3.0], look: [-4, 22, -10.5], enabled: () => true, run: async (api) => { await api.say('Cuarenta plantas de hojas de cálculo apiladas. Cada ventana encendida es alguien reconciliando algo que no cuadra.'); } };
    W.acts.cafe = { label: 'El quiosco de café', stand: [-5.4, -0.4], look: [-7.4, 1.4, -2.0], enabled: () => true, run: async (api) => { await api.say(['Dos euros cuarenta. Arriba hay uno gratis que sabe a deber algo. Tu relación con el dinero es profundamente actuarial.', 'La persiana está a medias. Dentro, la luz encendida y nadie sirviendo. Quizá ha salido un segundo.']); } };
    W.acts.banco = { label: 'Sentarte un segundo', stand: [-3.0, 1.2], look: [-3.0, 0.6, 2.8], enabled: () => true, run: async (api) => { await api.say('Un minuto sentado. Reservas de energía: 14 %. No se computan intereses sobre ellas.'); } };
    W.acts.periodico = { label: 'Leer el periódico del suelo', stand: [1.2, -0.3], look: [1.2, 0, -1.3], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['«Servicios mínimos en toda la región». Debajo, en letra pequeña, una frase que alguien ha tachado dos veces.', { text: 'Seguro que es una huelga. Siempre es una huelga.', think: true }]); } };
    W.acts.coche = { label: 'Mirar el coche parado', stand: [2.2, 3.4], look: [4.6, 1.0, 3.8], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['Un coche con la puerta abierta, las luces encendidas y las llaves puestas. Nadie dentro.', { text: 'Habrá ido a por un café. Tu relación con la probabilidad es optimista.', think: true }]); } };
    W.acts.luces = { label: 'Mirar la torre iluminada', stand: [4.0, 1.5], look: [23, 33, -14], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['Una torre entera con todas las luces encendidas, de arriba abajo. Sin una sola sombra moviéndose.', 'Ni siquiera la limpieza trabaja con todas las luces a la vez.']); } };
    W.acts.entrada = { label: 'Entrar en la aseguradora', stand: [8.5, -2.7], look: [8.5, 1.8, -5.0], enabled: () => true, run: async (api) => { await api.say('Los tornos te leen la tarjeta y deciden en silencio si hoy mereces subir. Planta 4.'); W.exit = true; } };

    W.play = async (api) => {
      const { say, setTime, free, S } = api;
      setTime('07:55'); W.setExtra((S.descuido || 0) >= 3);
      await say(['Nuevos Ministerios. Sales del tren como quien sale de una lavadora: arrugado y con prisa.',
        'Azca: torres de cristal con empresas grandes dentro. Hay mucho dinero en un radio de cien metros, y ninguno en tu cuenta.',
        'Tu edificio es el de la entrada iluminada: una aseguradora. No diré cuál ni dibujaré su logo. Planta 4.']);
      await free(1e9, 'Mira a tu alrededor · tu edificio es el de la entrada iluminada · entra cuando quieras', () => W.exit);
      return 'entrar';
    };
    return W;
  };
})();
