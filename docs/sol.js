/* sol.js — nivel alternativo: la Puerta del Sol al atardecer. Si dejas pasar el tren, el Grandullón te escribe: «¿cañas?». Edificio con reloj al fondo, Kilómetro Cero,
   el oso y el madroño, la fuente, farolas, una terraza con el Grandullón y gente paseando. Tras dos rondas llegal apocalipsis: cielo rojo, la gente huye,
   los infectados entran por las calles. Sin marcas: los rótulos son genéricos. Devuelve un «mundo» como el resto. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;

  Q.buildSol = (renderer, envTex, opts = {}) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a3350); scene.fog = new THREE.FogExp2(0x4a4058, 0.018);
    if (envTex) scene.environment = envTex;
    const bounds = { minX: -12.2, maxX: 12.2, minZ: -8.6, maxZ: 8.8 };
    const W = { scene, obst: [], tick: [], acts: {}, actRoots: [], bounds, spawn: [-1.5, 7.0], look: [0, 3.2, -9], pistas: 0, ronda: 0, barra: false, exit: false, apoc: false };
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
      const o = put(new THREE.BoxGeometry(w, h, d), m, x, h / 2, z); o.rotation.y = ry; return o; };
    // fondo: la Casa del Reloj, con torre y cúpula
    bld(0, -10.4, 15, 11, 4, '#a4523c', 11); bld(-13.5, -10.4, 12, 10, 4, '#c8b48a', 12); bld(13.5, -10.4, 12, 10, 4, '#d0b890', 13);
    { const g = new THREE.Group(); g.position.set(0, 11, -10.2); root.add(g); put(new THREE.BoxGeometry(3.2, 3.4, 2.6), std(0xb8b09a, 0.8), 0, 1.7, 0, g);
      const [c, k] = cv(128, 128); k.fillStyle = '#e8e0cc'; k.beginPath(); k.arc(64, 64, 60, 0, 7); k.fill(); k.strokeStyle = '#1a1a1a'; k.lineWidth = 5; k.beginPath(); k.arc(64, 64, 58, 0, 7); k.stroke(); k.lineWidth = 6; k.beginPath(); k.moveTo(64, 64); k.lineTo(64, 20); k.moveTo(64, 64); k.lineTo(94, 76); k.stroke(); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; k.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 2, 4, 4); }
      const clock = put(new THREE.CircleGeometry(0.95, 28), new THREE.MeshBasicMaterial({ map: Q.toTex(c), toneMapped: false }), 0, 1.95, 1.34, g); tag(clock, 'reloj');
      put(new THREE.ConeGeometry(2.1, 1.7, 4), std(0x3a3a40, 0.6), 0, 4.25, 0, g).rotation.y = Math.PI / 4; put(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), std(0x222222), 0, 5.7, 0, g); }
    // laterales y fondo trasero con calles que se abren (a Mayor, Alcalá, Carretas)
    bld(-15.4, -3, 5, 11, 6, '#c9ae80', 21, 0); bld(-15.4, 5.5, 5, 10, 8, '#b89a78', 22, 0); bld(15.4, -6.2, 5, 11, 4.5, '#cdb48a', 23, 0); bld(15.4, 1.8, 5, 10, 9, '#bf9f7a', 24, 0);
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
    { const C = Q.buildCrowd([[3.5, 2.6]], { seed: 12, yaw: () => Math.PI / 2 }); root.add(C.group); C.obst.forEach((o) => W.obst.push(o)); tag(C.group, 'chelu'); W.chelu = C.group; }

    /* ---------- gente que pasea; en el apocalipsis, la que huye ---------- */
    const walkers = []; for (let i = 0; i < 9; i++) { const w = Q.buildCrowd([[0, 0]], { seed: 300 + i, yaw: () => 0 }); const z = -6 + rnd() * 13, dir = i % 2 ? 1 : -1; w.group.position.set(-11 + rnd() * 22, 0, z); root.add(w.group); walkers.push({ g: w.group, dir, v: 0.7 + rnd() * 0.5, z }); }
    const infected = []; for (let i = 0; i < 20; i++) { const w = Q.buildCrowd([[0, 0]], { seed: 400 + i, yaw: () => 0, zombie: true }); w.group.visible = false; root.add(w.group); const gate = [[-14, -1.5], [14, -2.5], [-3, -11], [-7, 12], [12, 11]][i % 5]; w.group.position.set(gate[0], 0, gate[1]); infected.push({ g: w.group, v: 1.0 + rnd() * 0.7, ph: rnd() * 6, start: gate }); }
    W.infected = infected;
    /* ---------- la moto del Pasota: llega al final y os rescata al Grandullón y a ti ---------- */
    const moto = new THREE.Group(); moto.visible = false; root.add(moto); const wheels = [];
    { const dk = std(0x1c1c20, 0.4, { metalness: 0.6 }), rd2 = std(0xb3202a, 0.4, { metalness: 0.4 });
      [0.6, -0.6].forEach((x) => { const w = put(new THREE.TorusGeometry(0.3, 0.08, 8, 16), dk, x, 0.38, 0, moto); wheels.push(w); put(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), dk, x, 0.38, 0, moto).rotation.x = Math.PI / 2; });
      put(new THREE.BoxGeometry(1.1, 0.26, 0.3), rd2, 0.05, 0.72, 0, moto); put(new THREE.BoxGeometry(0.5, 0.22, 0.34), rd2, 0.35, 0.95, 0, moto); put(new THREE.BoxGeometry(0.6, 0.12, 0.3), dk, -0.3, 0.9, 0, moto);
      put(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), dk, 0.65, 0.75, 0, moto).rotation.z = 0.35; put(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), dk, 0.74, 1.12, 0, moto).rotation.x = Math.PI / 2;
      put(new THREE.SphereGeometry(0.1, 10, 8), emis(0xfff4d0, 3), 0.82, 0.95, 0, moto); const hl = new THREE.PointLight(0xfff0d0, 1.6, 10, 2); hl.position.set(1.0, 0.95, 0); moto.add(hl);
      const D = Q.buildCrowd([[0, 0]], { seed: 77, yaw: () => 0 }); D.group.position.set(-0.3, 0.45, 0); D.group.scale.setScalar(0.9); moto.add(D.group); W.dani = D.group;
      const [c, g] = cv(128, 32); g.fillStyle = '#c4202c'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#fff'; g.font = '700 22px Georgia'; g.textAlign = 'center'; g.fillText('PASOTA', 64, 24); const tg = put(new THREE.PlaneGeometry(0.6, 0.15), new THREE.MeshBasicMaterial({ map: Q.toTex(c), toneMapped: false, side: THREE.DoubleSide }), -0.7, 0.72, 0.18, moto); }
    W.rescue = async (api) => {
      const { say, tween, P } = api;
      if (window.Sound && Sound.on) Sound.moto(1);
      await say(['Por la calle Mayor, sobre el ruido de la plaza, un rugido de motor. Un solo faro que barral humo como un haz de interrogantes.']);
      { const y0 = P.yaw, dy = ((-Math.PI / 2 - y0 + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI, p0 = P.pitch; await tween(900, (e) => { P.yaw = y0 + dy * e; P.pitch = p0 * (1 - e) - 0.04 * e; }); }
      moto.visible = true; moto.position.set(P.x + 22, 0, P.z + 0.8); moto.rotation.y = Math.PI;
      const x0 = moto.position.x, tx = P.x + 2.4; await tween(2800, (e) => { moto.position.x = x0 + (tx - x0) * e; wheels.forEach((w) => { w.rotation.z -= 0.5 * (1 - e) + 0.1; }); });
      if (window.Sound && Sound.on) Sound.brake();
      await say(['Un chico con el casco a medio abrochar derrapa justo delante de ti. El Pasota, que llega siempre tarde a todo menos a esto. Para los amigos, el Pasota; para los acreedores, ilocalizable.',
        '—¡Subid, que esto está peor que el cercanías a las ocho! —grital Pasota, sin apagar el motor.']);
      const c0 = [3.5, 2.6], dxc = (tx + 0.5) - c0[0], dzc = moto.position.z - 1.2 - c0[1]; await tween(1500, (e) => { W.chelu.position.set(dxc * e, 0, dzc * e); });
      await say([{ text: 'El Grandullón, ya al lado de la moto: «¿Tú sabes conducir esto?»', think: false }, '—Con 125 centímetros cúbicos y cero papeles: ¡arriba! —respondel Pasota.', { text: 'Dos ruedas: menos masa, más varianza. La decisión menos aseguradora de tu vida. Y la única que funciona.', think: true, block: true }]);
      W.chelu.visible = false; if (window.Sound && Sound.on) Sound.moto(1.3);
      const x1 = moto.position.x; moto.rotation.y = Math.PI; await tween(2800, (e) => { moto.position.x = x1 - 36 * e * e; wheels.forEach((w) => { w.rotation.z -= 0.5; }); });
    };
    /* ---------- fuego, humo y coche volcado: solo cuando llegal fin ---------- */
    const fxg = new THREE.Group(); fxg.visible = false; root.add(fxg);
    { const car = put(new THREE.BoxGeometry(2.2, 0.8, 1.1), std(0x4a1a1a, 0.4, { metalness: 0.5 }), 6.0, 0.55, -6.0, fxg); car.rotation.set(0.3, 0.5, 1.2); put(new THREE.BoxGeometry(1.2, 0.5, 1.0), std(0x2a0e0e, 0.5), 5.6, 0.9, -6.0, fxg).rotation.set(0.3, 0.5, 1.2);
      [[-12, 1.2, -2], [9, 1.2, -8], [-1, 1.2, 9], [12, 1.0, 5]].forEach(([x, y, z]) => { const l = new THREE.PointLight(0xff6a20, 1.4, 12, 2); l.position.set(x, y, z); fxg.add(l); lamps.push(l); const [c, g] = cv(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,180,70,.95)'); gr.addColorStop(1, 'rgba(255,60,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.toTex(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); sp.position.set(x, 1.4, z); sp.scale.setScalar(3.2); fxg.add(sp); W.tick.push((dt, t) => { sp.scale.setScalar(2.8 + Math.sin(t * 9 + x) * 0.5); }); });
      const [sc, sg] = cv(128, 128); const sr = sg.createRadialGradient(64, 64, 0, 64, 64, 64); sr.addColorStop(0, 'rgba(40,34,32,.7)'); sr.addColorStop(1, 'rgba(40,34,32,0)'); sg.fillStyle = sr; sg.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 8; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.toTex(sc), transparent: true, depthWrite: false, opacity: 0.55, fog: false })); sp.position.set(-14 + i * 4, 6 + (i % 3) * 3, -9 + (i % 4) * 4); sp.scale.setScalar(9); fxg.add(sp); W.tick.push((dt, t) => { sp.position.y = 6 + ((i * 2 + t * 0.8) % 12); }); } }
    // una pistola olvidada en la mesa de la terraza, que solo aparece cuando llegal fin
    const gun = new THREE.Group(); gun.visible = false; root.add(gun); put(new THREE.BoxGeometry(0.2, 0.1, 0.04), std(0x14161a, 0.3, { metalness: 0.7 }), 0, 0, 0, gun); put(new THREE.BoxGeometry(0.06, 0.12, 0.04), std(0x14161a, 0.3, { metalness: 0.7 }), -0.06, -0.09, 0, gun); put(new THREE.BoxGeometry(0.28, 0.035, 0.035), std(0x2a2d33, 0.25, { metalness: 0.9 }), 0.08, 0.04, 0, gun);
    const shot = new THREE.Group(); shot.visible = false; root.add(shot); put(new THREE.BoxGeometry(0.75, 0.05, 0.05), std(0x2a2d33, 0.25, { metalness: 0.9 }), 0, 0, 0, shot); put(new THREE.BoxGeometry(0.28, 0.07, 0.06), std(0x5a3a22, 0.6), -0.28, -0.02, 0, shot); shot.position.set(-3.2, 0.8, 1.0); shot.rotation.y = 0.3; tag(shot, 'escopeta'); W.shotMesh = shot;
    gun.position.set(5.5, 0.78, 4.4); gun.rotation.y = 0.6; tag(gun, 'pistola'); W.gunMesh = gun; { const l = new THREE.PointLight(0xffe0a0, 0.5, 2.5, 2); l.position.set(0, 0.3, 0); gun.add(l); }
    // boca de metro: cartel verde paral refugio
    put(new THREE.PlaneGeometry(1.8, 0.5), emis(0x30d070, 1.6), -10.5, 2.55, 3.15);
    W.setApoc = (on) => { W.apoc = on; sky.material.map = on ? skyB : skyA; sky.material.needsUpdate = true; scene.fog.color.set(on ? 0x4a1810 : 0x4a4058); scene.background.set(on ? 0x3a1008 : 0x3a3350); sun.color.set(on ? 0xff4a20 : 0xff9a60); hemi.color.set(on ? 0xa05040 : 0x8a82ac); infected.forEach((z) => { z.g.visible = on; }); fxg.visible = on; gun.visible = on && !Q.apoc.hasGun(); shot.visible = on && !Q.apoc.hasGun('escopeta'); };
    W.tick.push((dt, t) => {
      walkers.forEach((w) => { if (W.apoc) { w.g.position.x += (w.g.position.x < 0 ? -1 : 1) * 3.6 * dt; w.g.rotation.y = w.g.position.x < 0 ? -Math.PI / 2 : Math.PI / 2; if (Math.abs(w.g.position.x) > 17) w.g.visible = false; }
        else { w.g.position.x += w.dir * w.v * dt; if (w.g.position.x > 11.5) w.dir = -1; if (w.g.position.x < -11.5) w.dir = 1; w.g.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2; } });
      if (W.apoc) lamps.forEach((l, i) => { l.intensity = 0.5 + 0.5 * Math.max(0, Math.sin(t * 4 + i * 2)); });
    });

    /* ---------- interacciones ---------- */
    W.acts.pistola = { label: 'Coger la pistola', stand: [4.7, 3.6], look: [5.5, 0.8, 4.4], enabled: () => W.apocOn && !Q.apoc.hasGun(), run: async (api) => { Q.apoc.giveGun(); W.gunMesh.visible = false; await api.say(['Una pistola abandonada junto a una caña a medias y una porra de agente. Doce balas, calibre desconocido y fecha de caducidad probablemente vencida.', { text: 'La única póliza que cubre esto es la de seguro de hogar. Y no cubre zombis. Clic para disparar.', think: true }]); } };
    W.acts.escopeta = { label: 'Coger la escopeta', stand: [-2.2, 2.0], look: [-3.2, 0.8, 1.0], enabled: () => W.apocOn && !Q.apoc.hasGun('escopeta'), run: async (api) => { Q.apoc.giveGun('escopeta'); W.shotMesh.visible = false; await api.say(['Una escopeta de caza que alguien dejó en una terraza, entre dos cañas. Pocos cartuchos, mucho poder de convicción.', { text: 'Dispara en abanico: abate a varios de golpe. Clic para disparar.', think: true }]); } };
    W.acts.arma = { label: 'Coger una silla de la terraza', stand: [4.6, 3.4], look: [5.6, 0.5, 4.2], enabled: () => W.apocOn && !W.armed, run: async (api) => { W.armed = true; Q.apoc.pick(); await api.say('Una silla metálica de terraza. Pesa justo lo que debe pesar un argumento. F para empujar con ella.'); } };
    W.acts.cerveza = { label: 'Pedir unas cañas', stand: [3.0, 4.3], look: [2.6, 0.9, 2.6], enabled: () => !W.barra, run: async (api) => { W.barra = true; await api.say(['El camarero te planta dos cañas con una espuma de ingeniería y un aperitivo que cuesta más que la cerveza.', 'Brindas por el consumo privado, que es lo único que sube en esta ciudad.']); } };
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
        await say(['—¿Y tu novia? ¿Sigue convencida de que todo lo arreglas con una hoja de cálculo? —preguntal Grandullón.', 'Tu novia, la psicóloga, diría que evitar sentir también es una forma de sentir, pero con peor cobertura.']);
        const r = await choose([{ id: 'a', label: '«Dice que huyo hacia delante con espuma»', hint: 'Honestidad con cerveza' }, { id: 'b', label: '«Dice que soy un modelo bien especificado»', hint: 'Orgullo actuarial' }, { id: 'c', label: '«Cambia de tema, el Grandullón»', hint: 'Evitar la sesión' }], 'Segunda ronda');
        await say(r === 'a' ? '—Pues tiene razón. Que Freud la ampare.' : r === 'b' ? '—Eso no es un cumplido, es un diagnóstico.' : '—Ya hablo de otra cosa… oye, ¿has oído eso?');
        W.fin = true;
      } } };
    W.play = async (api) => {
      W.api = api; const { say, free, wait, S } = api;
      if (!opts.retry) await say(['Puerta del Sol. 19:10. Te dejas llevar: el tren se fue y el móvil ya había decidido por ti.', 'Madrid entero parece haberse puesto de acuerdo en pasar por aquí: turistas, oficinistas, un oso de bronce con su madroño y un el Grandullón en una terraza.']);
      if (!opts.retry) await free(1e9, 'Pide las cañas · habla con el Grandullón (dos rondas) · mira alrededor', () => W.fin); else { W.barra = true; W.ronda = 2; W.fin = true; }
      if (window.Sound && Sound.on) Sound.siren(5);
      if (opts.retry) await say(['Otra vez: la plaza se vacía, el cielo se pone naranja y ya vienen por las calles. Corre hacial metro.']); else await say(['De pronto, el ruido de la plaza cambia. Primero una sirena. Luego otra, más cerca. Los paseantes aceleran, luego corren.', 'El cielo se vuelve de un naranja antinatural. Las farolas parpadean. En la boca de la calle Mayor se mueve algo que no camina como un vecino.']);
      W.setApoc(true); if (window.Sound && Sound.on) { Sound.shout(0.07); setTimeout(() => Sound.shout(0.07), 700); }
      Q.apoc.start(W, { refuge: [-10.5, 5.3], r: 1.9, refugeLabel: 'marquesina del metro', gates: [[-14, -1.5], [14, -2.5], [-3, -11], [-7, 12], [12, 11]], enemies: infected.map((z) => ({ g: z.g, v: z.v * 0.7, ph: z.ph })),
        quips: [['Chelu', '¡A la boca del metro! Arriba hay turistas y abajo hay cobertura. Elige.'], ['Amor', 'No te pares. Huir es una conducta adaptativa, no una derrota.'], ['Chelu', 'Si pierdes una vida, recuerda: el seguro no cubre mordiscos.'], ['Sheldon', 'Pregunta técnica: ¿con qué frecuencia mueren los asegurados? Es para la tarifa.'], ['Amor', 'Coge algo contundente. Un argumento, una silla, lo que tengas a mano.']], onEnd: () => { } });
      const skipped = await free(1e9, 'Corre (Shift) hasta la boca del metro, la flecha roja · F empuja a los infectados · puedes coger una silla de la terraza', () => W.apocRes);
      if (skipped && !W.apocRes) { Q.apoc.stop(); W.apocRes = 'refugio'; }
      if (W.apocRes === 'refugio') { await W.rescue(api); return 'rescatado'; }
      return 'muerto';
    };
    return W;
  };
})();
