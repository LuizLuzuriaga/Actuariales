/* fachada.js — la estación vista desde fuera, antes de bajar al andén: un edificio bajo y largo con el cartel rojo arriba, puertas de cristal, escalones, una máquina,
   farolas y gente que entra. Amanece entre sirenas lejanas. Pulsa E en las puertas para entrar; después, pantalla de carga hacial andén. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;

  Q.buildFachada = (renderer, envTex) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2c3a); scene.fog = new THREE.FogExp2(0x3a3a48, 0.02);
    if (envTex) scene.environment = envTex;
    const bounds = { minX: -9.5, maxX: 9.5, minZ: -5.6, maxZ: 8.6 };
    const W = { scene, obst: [], tick: [], acts: {}, actRoots: [], bounds, spawn: [-1.2, 7.0], look: [0, 2.8, -7], exit: false, pistas: 0 };
    const root = new THREE.Group(); scene.add(root); const rnd = Q.rng(606);
    const std = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
    const emis = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
    const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const put = (geo, m, x = 0, y = 0, z = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
    const merged = (parts, m, parent = root) => { const o = new THREE.Mesh(MG.mergeBufferGeometries(parts), m); parent.add(o); return o; };
    const cv = (w, h) => { const c = Q.cvs(w, h); return [c, c.getContext('2d')]; };
    const tag = (obj, id) => { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); W.actRoots.push(obj); };
    const box = (x, z, w, d) => W.obst.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

    scene.add(new THREE.HemisphereLight(0x8a90b0, 0x2a2428, 0.9));
    const sun = new THREE.DirectionalLight(0xffa070, 0.8); sun.position.set(-20, 6, 20); scene.add(sun);
    { const [c, g] = cv(8, 256); const gr = g.createLinearGradient(0, 0, 0, 256); [[0, '#141a38'], [0.5, '#3e4472'], [0.8, '#a67080'], [1, '#e8a070']].forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
      put(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({ map: Q.toTex(c), side: THREE.BackSide, fog: false, depthWrite: false })).renderOrder = -2; }

    // suelo: calzada al fondo, acera de baldosas delante de la estación
    { const t = Q.pbr(256, 256, (g, hg, rg, w, h) => { const r = Q.rng(5); g.fillStyle = '#6e6e72'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#c0c0c0'; rg.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const k = 0.88 + r() * 0.24; g.fillStyle = `rgb(${110 * k | 0},${110 * k | 0},${114 * k | 0})`; g.fillRect(x + 1, y + 1, 30, 30); hg.fillStyle = '#404040'; hg.fillRect(x, y, 32, 1); hg.fillRect(x, y, 1, 32); }
        for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(20,20,24,${r() * 0.18})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }, { strength: 1, repeat: [8, 6], rough: true });
      put(new THREE.PlaneGeometry(36, 24), new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1 }), 0, 0, 2).rotation.x = -Math.PI / 2;
      put(new THREE.PlaneGeometry(60, 10), std(0x25262a, 0.95), 0, 0.01, 14).rotation.x = -Math.PI / 2; }

    /* el edificio: hormigón y ladrillo, banda roja arriba con el rótulo, ventanas y puertas de cristal */
    { const [c, g] = cv(512, 160); g.fillStyle = '#5a504a'; g.fillRect(0, 0, 512, 160); const r = Q.rng(8); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '20,16,14' : '160,140,120'},${r() * 0.14})`; g.fillRect(r() * 512, r() * 160, 1 + r() * 3, 1 + r() * 2); }
      for (let i = 0; i < 8; i++) { g.fillStyle = '#16171c'; g.fillRect(24 + i * 62, 48, 38, 70); g.fillStyle = 'rgba(220,200,150,.35)'; g.fillRect(24 + i * 62, 48, 38, 4); }
      const body = put(new THREE.BoxGeometry(24, 7, 5), std(0xffffff, 0.9, { map: Q.toTex(c) }), 0, 3.5, -8.2); box(0, -8.2, 24, 5);
      // banda roja con el rótulo
      const [s, k] = cv(512, 96); k.fillStyle = '#b3141c'; k.fillRect(0, 0, 512, 96); k.fillStyle = '#f4efe6'; k.font = '700 40px Georgia'; k.textAlign = 'center'; k.fillText('RENFE · CERCANÍAS', 256, 60);
      const band = put(new THREE.PlaneGeometry(14, 2.6), new THREE.MeshBasicMaterial({ map: Q.toTex(s), toneMapped: false }), 0, 5.9, -5.67); put(new THREE.BoxGeometry(14.4, 3.0, 0.2), std(0x2a0a0c, 0.6), 0, 5.9, -5.8); }
    // marquesina y soportes
    put(new THREE.BoxGeometry(14, 0.3, 3.0), std(0x2a2c30, 0.5, { metalness: 0.4 }), 0, 4.0, -4.3); [-6.6, 6.6].forEach((x) => put(new THREE.BoxGeometry(0.25, 4.0, 0.25), std(0x1e2024, 0.5, { metalness: 0.5 }), x, 2.0, -3.0));
    // puertas de cristal
    { const g = new THREE.Group(); g.position.set(0, 0, -5.6); root.add(g);
      merged([bx(5.6, 0.2, 0.3, 0, 3.1, 0), bx(0.2, 3.1, 0.3, -2.8, 1.55, 0), bx(0.2, 3.1, 0.3, 2.8, 1.55, 0), bx(0.12, 3.1, 0.3, 0, 1.55, 0), bx(0.12, 3.1, 0.3, -1.4, 1.55, 0), bx(0.12, 3.1, 0.3, 1.4, 1.55, 0)], std(0x181a1e, 0.4, { metalness: 0.6 }), g);
      put(new THREE.PlaneGeometry(5.5, 3.0), new THREE.MeshStandardMaterial({ color: 0x9fb4b8, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3, side: THREE.DoubleSide, depthWrite: false }), 0, 1.55, 0.02, g);
      put(new THREE.PlaneGeometry(5.4, 3.0), emis(0xffe0b0, 0.55), 0, 1.55, -0.6, g);                                  // luz cálida del vestíbulo, al fondo
      const l = new THREE.PointLight(0xffd8a0, 1.2, 9, 2); l.position.set(0, 2.4, 1.2); g.add(l);
      put(new THREE.BoxGeometry(5.8, 0.18, 1.6), std(0x8a8890, 0.9), 0, 0.09, 1.0, g); put(new THREE.BoxGeometry(5.8, 0.14, 1.0), std(0x76747a, 0.9), 0, 0.07, 2.0, g);   // escalones
      tag(g, 'entrar'); }
    // máquina de billetes, papeleras, banco y farolas
    { const g = new THREE.Group(); g.position.set(-7.4, 0, -4.8); root.add(g); put(new THREE.BoxGeometry(0.9, 1.9, 0.6), std(0xb3141c, 0.4, { metalness: 0.3 }), 0, 0.95, 0, g); put(new THREE.PlaneGeometry(0.6, 0.45), emis(0x6af0b0, 0.9), 0, 1.4, 0.31, g); tag(g, 'maquina'); box(-7.4, -4.8, 1.1, 0.8); }
    { const g = new THREE.Group(); g.position.set(6.2, 0, -3.2); root.add(g); put(new THREE.BoxGeometry(1.8, 0.06, 0.5), std(0x5a432c, 0.7), 0, 0.5, 0, g); put(new THREE.BoxGeometry(1.8, 0.5, 0.06), std(0x5a432c, 0.7), 0, 0.85, -0.22, g); [-0.8, 0.8].forEach((x) => put(new THREE.BoxGeometry(0.06, 0.5, 0.45), std(0x1a1c1e), x, 0.25, 0, g)); tag(g, 'banco'); box(6.2, -3.2, 2.0, 0.7); }
    [[-4.2, 0.8], [4.2, 0.8], [-8.4, 4.5], [8.4, 4.5]].forEach(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g); put(new THREE.CylinderGeometry(0.05, 0.08, 4.4, 8), std(0x202326, 0.4, { metalness: 0.7 }), 0, 2.2, 0, g); put(new THREE.SphereGeometry(0.24, 10, 8), emis(0xffc080, 1.8), 0, 4.5, 0, g); if (i < 2) { const l = new THREE.PointLight(0xffb070, 0.9, 10, 2); l.position.set(0, 4.3, 0); g.add(l); W.tick.push((dt, t) => { l.intensity = 0.9 * (Math.sin(t * 29 + i) * Math.sin(t * 4.1) > 0.92 ? 0.25 : 1); }); } box(x, z, 0.3, 0.3); });
    // un cartel de «se busca» en el lateral (el mismo, cada vez más cerca de ti)
    { const p = put(new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshStandardMaterial({ map: Q.toTex(Q.drawWanted(Q.wantedStage(((window.Sound && Sound.clue) || 1)))), roughness: 0.9 }), 9.55, 1.7, -2.4); p.rotation.y = -Math.PI / 2; tag(p, 'cartel'); }
    // gente que entra a primera hora
    { const spots = []; for (let i = 0; i < 12; i++) spots.push([-7 + rnd() * 14, -2 + rnd() * 6]); const C = Q.buildCrowd(spots.filter(([x, z]) => Math.hypot(x + 1.2, z - 7) > 2.5), { seed: 66, yaw: () => 0 + (rnd() - 0.5) * 0.6 }); root.add(C.group); C.obst.forEach((o) => W.obst.push(o)); }

    W.acts.entrar = { label: 'Entrar en la estación', stand: [0, -3.2], look: [0, 1.6, -6.2], enabled: () => !!W.api && Math.hypot(W.api.P.x, W.api.P.z + 2.5) < 6.5, run: async (api) => { await api.say(['Las puertas de cristal se abren con ese zumbido de «no te lo pienses mucho». Dentro huele a café frío y a lunes.']); W.exit = true; } };
    W.acts.maquina = { label: 'Mirar la máquina de billetes', stand: [-6.2, -3.4], look: [-7.4, 1.4, -4.8], enabled: () => true, run: async (api) => { await api.say(['La máquina de billetes tiene una pantalla que dice «Cargando…» desde 2019. Es la única cosa de la estación que no tiene prisa.', { text: 'La espera media en la cola de la máquina es una variable aleatoria sin esperanza finita.', think: true }]); } };
    W.acts.banco = { label: 'Sentarte un segundo', stand: [4.8, -2.2], look: [6.2, 0.7, -3.2], enabled: () => true, run: async (api) => { await api.say('Te sientas medio segundo. El banco está frío y alguien ha grabado «aquí se sufre» con un bolígrafo. Un clásico de la literatura de cercanías.'); } };
    W.acts.cartel = { label: 'Leer el cartel de «se busca»', stand: [8.2, -2.4], look: [9.5, 1.7, -2.4], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['Un cartel de «SE BUSCA» pegado a la estación. Seguro que no tiene nada que ver contigo.', { text: 'Seguro.', think: true }]); } };
    W.play = async (api) => {
      W.api = api; const { say, free } = api;
      await say(['La estación de Entrevías, vista desde fuera: un edificio bajo y largo, con el cartel rojo arriba y las puertas de cristal con ganas de abrirse. Todavía es de noche en las esquinas.', 'Hay gente entrando, y también alguien que sale rápido, sin mirar atrás. No parece venir de un lunes normal.']);
      await free(1e9, 'Acércate a las puertas de cristal y pulsa E para entrar · mira alrededor si quieres', () => W.exit); return 'entrar';
    };
    return W;
  };
})();
