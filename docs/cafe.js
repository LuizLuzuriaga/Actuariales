/* cafe.js — nivel 6: la cafetería de la planta baja. El Grandullón te espera en una mesa. Tres rondas de conversación deciden el final; si has ido dejando
   que todo se descuide (descuido ≥ 7), por la ventana se ve cómo acabal mundo. Devuelve { score, zombi } al terminar. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;

  Q.buildCafe = (renderer, envTex, apoc, opts = {}) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(apoc ? 0x2a0c0a : 0x20222a); scene.fog = new THREE.FogExp2(apoc ? 0x2a1210 : 0x1c1a18, 0.045);
    if (envTex) scene.environment = envTex;
    const bounds = { minX: -5, maxX: 5, minZ: -4, maxZ: 4 };
    const W = { scene, obst: [], tick: [], acts: {}, actRoots: [], bounds, spawn: [0.6, 3.2], look: [2.9, 1.4, 0.2], exit: false, ronda: 0, score: 0, barra: false, zombi: false };
    const root = new THREE.Group(); scene.add(root);
    const std = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
    const emis = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
    const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const put = (geo, m, x = 0, y = 0, z = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
    const merged = (parts, m, parent = root) => { const o = new THREE.Mesh(MG.mergeBufferGeometries(parts), m); parent.add(o); return o; };
    const cv = (w, h) => { const c = Q.cvs(w, h); return [c, c.getContext('2d')]; };
    const tag = (obj, id) => { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); W.actRoots.push(obj); };
    const box = (x, z, w, d) => W.obst.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    const H = 3.0, hx = 10, hz = 8;

    scene.add(new THREE.HemisphereLight(apoc ? 0x7a4a40 : 0x8a7a68, 0x1a1412, 0.7));
    [[2.9, 0.4], [-2.6, 0.8], [0, -2.2]].forEach(([x, z]) => { const l = new THREE.PointLight(apoc ? 0xff6a40 : 0xffb36b, 0.9, 9, 2); l.position.set(x, 2.5, z); scene.add(l); put(new THREE.CylinderGeometry(0.12, 0.22, 0.2, 12), emis(apoc ? 0xff8a60 : 0xffc890, 1.6), x, 2.6, z); });

    /* suelo de tablas, techo y paredes (la de la izquierda lleva ventana) */
    { const t = Q.pbr(256, 256, (g, hg, rg, w, h) => { const r = Q.rng(3); g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#c0c0c0'; rg.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 32) { g.fillStyle = `rgba(0,0,0,${0.25 + r() * 0.2})`; g.fillRect(0, y, w, 2); hg.fillStyle = '#404040'; hg.fillRect(0, y, w, 2); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '10,6,3' : '120,86,52'},${r() * 0.2})`; g.fillRect(r() * w, y + r() * 30, 8 + r() * 30, 1); } } }, { strength: 1, repeat: [hx / 2, hz / 2], rough: true });
      put(new THREE.PlaneGeometry(hx, hz), new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1 }), 0, 0, 0).rotation.x = -Math.PI / 2; }
    put(new THREE.PlaneGeometry(hx, hz), std(0x2a211b, 1), 0, H, 0).rotation.x = Math.PI / 2;
    const wall = std(0x3b3029, 0.95);
    merged([bx(hx, H, 0.2, 0, H / 2, bounds.minZ - 0.1), bx(hx, H, 0.2, 0, H / 2, bounds.maxZ + 0.1), bx(0.2, H, hz, bounds.maxX + 0.1, H / 2, 0)], wall);
    merged([bx(0.2, 0.9, hz, bounds.minX - 0.1, 0.45, 0), bx(0.2, H - 2.3, hz, bounds.minX - 0.1, 2.3 + (H - 2.3) / 2, 0), bx(0.2, 1.4, 2.6, bounds.minX - 0.1, 1.6, -2.7), bx(0.2, 1.4, 2.6, bounds.minX - 0.1, 1.6, 2.7)], wall);
    // fuera de la ventana: cielo y, según el descuido, el fin del mundo
    { const [c, g] = cv(8, 128); const gr = g.createLinearGradient(0, 0, 0, 128); if (apoc) { gr.addColorStop(0, '#2a0c0a'); gr.addColorStop(0.6, '#a03a22'); gr.addColorStop(1, '#e8802e'); } else { gr.addColorStop(0, '#2a3450'); gr.addColorStop(0.6, '#8a6a70'); gr.addColorStop(1, '#e0a070'); } g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
      put(new THREE.PlaneGeometry(14, 3.4), new THREE.MeshBasicMaterial({ map: Q.toTex(c), fog: false }), bounds.minX - 6, 1.6, 0).rotation.y = Math.PI / 2;
      const sil = []; for (let i = 0; i < 9; i++) { const w = 0.8 + (i * 37 % 7) * 0.25, h = 1.2 + (i * 53 % 9) * 0.35; sil.push(bx(0.4, h, w, bounds.minX - 8 - (i % 2), h / 2, -6 + i * 1.5)); } merged(sil, new THREE.MeshBasicMaterial({ color: apoc ? 0x150605 : 0x1a1a22, fog: false })); }
    const glass = put(new THREE.PlaneGeometry(2.6, 1.4), new THREE.MeshStandardMaterial({ color: 0xaab8c4, transparent: true, opacity: 0.12, roughness: 0.05 }), bounds.minX, 1.6, 0); glass.rotation.y = Math.PI / 2; tag(glass, 'ventana');
    /* barra, cafetera y carta */
    { const g = new THREE.Group(); g.position.set(0, 0, bounds.minZ + 0.7); root.add(g); merged([bx(5.6, 1.0, 0.7, 0, 0.5, 0), bx(5.8, 0.06, 0.9, 0, 1.03, 0)], std(0x4a3626, 0.55), g);
      merged([bx(0.7, 0.5, 0.5, -1.6, 1.3, 0), bx(0.6, 0.12, 0.45, -1.6, 1.06, 0.08)], std(0x303030, 0.35, { metalness: 0.6 }), g); put(new THREE.BoxGeometry(0.06, 0.06, 0.02), emis(0xff5a30, 2), -1.45, 1.45, 0.26, g);
      for (let i = 0; i < 4; i++) put(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 8), std(0xe9e4d6, 0.5), -0.6 + i * 0.28, 1.1, 0.1, g);
      tag(g, 'barra'); box(0, bounds.minZ + 0.7, 5.8, 1.0); }
    { const [c, g] = cv(256, 160); g.fillStyle = '#16120e'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#e8dcc0'; g.font = '700 20px Georgia'; g.fillText('CARTA', 92, 28); g.font = '15px Georgia';
      [['Café solo', '1,40'], ['Con leche', '1,60'], ['Caña', '1,80'], ['Tostada', '2,20'], ['Prima de riesgo', '—']].forEach(([n, p], i) => { g.fillText(n, 22, 60 + i * 24); g.fillText(p, 190, 60 + i * 24); });
      put(new THREE.PlaneGeometry(1.5, 0.94), new THREE.MeshBasicMaterial({ map: Q.toTex(c), toneMapped: false }), 1.3, 2.1, bounds.minZ + 0.12); }
    /* mesas con sillas */
    [[2.9, 0.4], [-2.6, 0.8], [-2.2, -1.8], [3.2, -2.0]].forEach(([x, z]) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g); put(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 18), std(0x6a4a30, 0.5), 0, 0.76, 0, g); put(new THREE.CylinderGeometry(0.06, 0.1, 0.76, 8), std(0x1a1a1a, 0.5), 0, 0.38, 0, g);
      merged([bx(0.4, 0.05, 0.4, 0.8, 0.45, 0), bx(0.4, 0.05, 0.4, -0.8, 0.45, 0), bx(0.05, 0.45, 0.4, 1.0, 0.7, 0), bx(0.05, 0.45, 0.4, -1.0, 0.7, 0)], std(0x2a2018, 0.7), g); put(new THREE.CylinderGeometry(0.04, 0.035, 0.07, 8), std(0xe9e4d6, 0.5), 0.1, 0.82, 0.1, g); if (x === -2.2) tag(g, 'arma'); box(x, z, 1.3, 1.3); });

    /* Chelu: alto, regordete, dejado (la base simple) */
    { const C = Q.buildCrowd([[3.7, 0.4]], { seed: 12, yaw: () => Math.PI / 2 }); root.add(C.group); C.obst.forEach((o) => W.obst.push(o)); tag(C.group, 'chelu'); }
    /* si todo se ha ido al garete: gente fuera, pegada al cristal, y destellos rojos */
    if (apoc) {
      const zs = []; for (let k = 0; k < 20; k++) { const w = Q.buildCrowd([[0, 0]], { seed: 500 + k, yaw: () => -Math.PI / 2, zombie: true }); w.group.position.set(bounds.minX - 1.0 - (k % 3) * 0.7 - (k >= 10 ? 2.4 : 0), 0, -3.6 + (k % 10) * 0.8); root.add(w.group); zs.push({ g: w.group, ph: k * 1.7, x0: w.group.position.x, z0: w.group.position.z }); }
      const rl = new THREE.PointLight(0xff2a18, 0, 12, 2); rl.position.set(-4.4, 1.5, 0); scene.add(rl);
      const shards = []; for (let k = 0; k < 26; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.1 + Math.random() * 0.2, 0.02, 0.1 + Math.random() * 0.2), new THREE.MeshStandardMaterial({ color: 0xaab8c4, roughness: 0.1, transparent: true, opacity: 0.7 })); s.visible = false; s.userData.v = new THREE.Vector3(1 + Math.random() * 2.5, 1 + Math.random() * 2, (Math.random() - 0.5) * 3); scene.add(s); shards.push(s); }
      W.zs = zs; W.breach = false; let bt = 0;
      const gun = new THREE.Group(); put(new THREE.BoxGeometry(0.2, 0.1, 0.04), std(0x14161a, 0.3, { metalness: 0.7 }), 0, 0, 0, gun); put(new THREE.BoxGeometry(0.06, 0.12, 0.04), std(0x14161a, 0.3, { metalness: 0.7 }), -0.06, -0.09, 0, gun); put(new THREE.BoxGeometry(0.28, 0.035, 0.035), std(0x2a2d33, 0.25, { metalness: 0.9 }), 0.08, 0.04, 0, gun);
      const shot = new THREE.Group(); shot.visible = false; root.add(shot); put(new THREE.BoxGeometry(0.75, 0.05, 0.05), std(0x2a2d33, 0.25, { metalness: 0.9 }), 0, 0, 0, shot); put(new THREE.BoxGeometry(0.28, 0.07, 0.06), std(0x5a3a22, 0.6), -0.28, -0.02, 0, shot); shot.position.set(-1.2, 1.12, bounds.minZ + 0.7); shot.rotation.y = 0.2; tag(shot, 'escopeta'); W.shotMesh = shot;
      gun.position.set(1.6, 1.12, bounds.minZ + 0.7); gun.rotation.y = 0.4; tag(gun, 'pistola'); W.gunMesh = gun; gun.visible = false; { const l = new THREE.PointLight(0xffe0a0, 0.5, 2.5, 2); l.position.set(0, 0.3, 0); gun.add(l); }
      W.doBreach = () => { W.breach = true; glass.visible = false; if (!Q.apoc.hasGun()) gun.visible = true; if (!Q.apoc.hasGun('escopeta')) shot.visible = true; shards.forEach((s) => { s.visible = true; s.position.set(bounds.minX + 0.1, 0.7 + Math.random() * 1.8, -1.2 + Math.random() * 2.4); }); };
      W.tick.push((dt, t) => { rl.intensity = 1.6 * Math.max(0, Math.sin(t * 5)) * (W.breach ? 1.5 : 1);
        if (!W.breach) zs.forEach((z) => { z.g.position.x = z.x0 + 0.08 * Math.abs(Math.sin(t * 6 + z.ph)); z.g.rotation.z = Math.sin(t * 2.4 + z.ph) * 0.1; if (glass.material.opacity < 0.5) glass.material.opacity += 0; });
        else { bt += dt;
          shards.forEach((s) => { if (s.position.y > 0.02) { s.userData.v.y -= 9 * dt; s.position.addScaledVector(s.userData.v, dt); s.rotation.x += dt * 4; } else s.position.y = 0.02; }); } });
    }

    // puerta de la cocina: el refugio
    put(new THREE.BoxGeometry(0.1, 2.1, 0.9), std(0x2f3a30, 0.6), bounds.maxX - 0.06, 1.05, -2.8); put(new THREE.PlaneGeometry(0.7, 0.22), emis(0x36d070, 1.8), bounds.maxX - 0.13, 2.3, -2.8).rotation.y = -Math.PI / 2;
    /* ---------- interacciones ---------- */

    if (apoc) W.startApoc = async (api, quick) => {
        const say = api.say;
        if (!quick) await say(['—Qué pinta tienes —dice el Grandullón sin mirarte, mirando al cristal—. Mira cómo está la calle.', 'El cristal tiembla. Algo golpeal marco. Luego, otra cosa. Luego, todas.']);
        W.doBreach(); if (window.Sound && Sound.on) { Sound.glass(); setTimeout(() => Sound.shout(0.08), 500); Sound.growl(0.9); } await api.wait(1800);
        await say(quick ? ['El cristal vuelve a caer y la calle entra otra vez. Corre.'] : ['El cristal cae en mil trozos y la calle entra a la cafetería. Cuerpos torcidos, bocas abiertas, un olor a lunes pasado.', 'El Grandullón se gira despacio. Tiene los ojos blancos y una sonrisa que no es suya. «Cañas», murmura. Corre.']);
        Q.apoc.start(W, { refuge: [bounds.maxX - 0.7, -2.8], r: 1.5, refugeLabel: 'puerta de la cocina', gates: [[-6.5, -3], [-6.5, 0], [-6.5, 3], [-8, -1.5], [-8, 1.5]], enemies: W.zs.map((z, i) => ({ g: z.g, v: 1.35 + 0.02 * i, stun: i * 0.15, ph: z.ph })),
          quips: [['Amor', 'Si estás en la cafetería: la cocina siempre tiene salida de emergencia. Es una norma, no una opinión.'], ['Sheldon', 'No es por meter prisa, pero este evento no está tarificado.'], ['Chelu', 'Soy yo. Sigo siendo yo. Más o menos. Quiero una caña.']], onEnd: () => { W.exit = true; } });
    };
    /* barista tras la barra: se desplaza a la cafetera, sale vapor, y desliza la taza hasta ti */
    const barista = Q.buildCrowd([[0, 0]], { seed: 41, yaw: () => 0 }); barista.group.position.set(-2.4, 0, bounds.minZ + 0.1); barista.group.rotation.y = Math.PI; root.add(barista.group);
    const cup = new THREE.Group(); cup.visible = false; root.add(cup); put(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 10), std(0xf4f0e0, 0.5), 0, 0.04, 0, cup); put(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 10), std(0x3a2418, 0.4), 0, 0.085, 0, cup);
    const steam = []; { const [sc, sg] = cv(64, 64); const sr = sg.createRadialGradient(32, 32, 0, 32, 32, 32); sr.addColorStop(0, 'rgba(255,255,255,.7)'); sr.addColorStop(1, 'rgba(255,255,255,0)'); sg.fillStyle = sr; sg.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 5; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.toTex(sc), transparent: true, depthWrite: false, opacity: 0 })); sp.scale.setScalar(0.25); root.add(sp); steam.push(sp); } }
    W.steam = 0; W.tick.push((dt, t) => { steam.forEach((sp, i) => { if (W.steam > 0) { const k = ((t * 0.8 + i * 0.2) % 1); sp.position.set(-1.6 + Math.sin(t * 3 + i) * 0.04, 1.5 + k * 0.5, bounds.minZ + 0.95); sp.material.opacity = (1 - k) * 0.6; sp.scale.setScalar(0.18 + k * 0.3); } else sp.material.opacity = 0; }); });
    W.servir = async (api) => {
      const { tween } = api, bz = bounds.minZ + 0.1; if (window.Sound && Sound.on) Sound.click();
      await tween(900, (e) => { barista.group.position.x = -2.4 + 0.8 * e; });                                     // va a la cafetera
      W.steam = 1; if (window.Sound && Sound.on) { Sound.growl(0.12); } await tween(1700, (e) => { barista.group.position.y = Math.abs(Math.sin(e * 18)) * 0.02; });   // la máquina escupe vapor
      W.steam = 0; cup.visible = true; cup.position.set(-1.6, 1.07, bounds.minZ + 0.8); if (window.Sound && Sound.on) Sound.ok();
      await tween(1000, (e) => { cup.position.set(-1.6 + 1.9 * e, 1.07, bounds.minZ + 0.8 + 0.25 * e); barista.group.position.x = -1.6 + 0.8 * e; });          // desliza la taza por la barra hasta ti
      await tween(700, (e) => { barista.group.position.x = -0.8 - 1.6 * e; });
    };
    W.acts.barra = { label: 'Pedir un café', stand: [0, -1.9], look: [0, 1.2, bounds.minZ + 0.7], enabled: () => !W.barra, run: async (api) => {
      W.barra = true; await W.servir(api); await api.say(['Un café solo, dos euros y unas monedas que no devuelven ninguna rentabilidad.', 'La máquina gruñe, escupe y te lo entrega con la dignidad de quien lleva doce años en el mismo turno.']); } };
    W.acts.pistola = { label: 'Coger la pistola de la barra', stand: [1.6, -2.0], look: [1.6, 1.1, bounds.minZ + 0.7], enabled: () => W.apocOn && !!W.gunMesh && !Q.apoc.hasGun(), run: async (api) => { await Q.apoc.fly(api, W.gunMesh); Q.apoc.giveGun(); W.gunMesh.visible = false; await api.say(['Detrás de la barra, junto a la cafetera, el camarero guardaba una pistola «por si acaso». Doce balas.', { text: 'Siempre dije que el café ponía nervioso, pero esto es nuevo. Clic para disparar.', think: true }]); } };
    W.acts.escopeta = { label: 'Coger la escopeta de la barra', stand: [-1.2, -2.0], look: [-1.2, 1.1, bounds.minZ + 0.7], enabled: () => W.apocOn && !!W.shotMesh && !Q.apoc.hasGun('escopeta'), run: async (api) => { await Q.apoc.fly(api, W.shotMesh); Q.apoc.giveGun('escopeta'); W.shotMesh.visible = false; await api.say(['Bajo la barra, junto al cartel de «prohibido fumar», una escopeta del dueño. Pocos cartuchos y mucha determinación.', { text: 'Dispara en abanico. Clic para disparar.', think: true }]); } };
    W.acts.arma = { label: 'Coger una silla', stand: [-1.2, -1.0], look: [-2.2, 0.6, -1.8], enabled: () => W.apocOn && !W.armed, run: async (api) => { W.armed = true; Q.apoc.pick(); await api.say('Una silla de madera maciza. Perfecta para estudiar las propiedades del hueso temporal. F para empujar con ella.'); } };
    W.acts.ventana = { label: 'Mirar por la ventana', stand: [-3.7, 0], look: [-5, 1.6, 0], enabled: () => true, run: async (api) => {
      if (apoc) { W.pistas = 9; await api.say(['Fuera hay gente pegada al cristal. Muchos. Quietos, con la cabeza ladeada, mirando dentro.', { text: 'Nadie los ha llamado. Nadie los ha parado. Es lo que pasa cuando todo se va dejando para luego.', think: true }]); }
      else await api.say(['La calle despierta: un camión de reparto, tres oficinistas con vasos de cartón, una paloma que se lo piensa.', { text: 'Todo el mundo va a algún sitio. Tú, también. Casi.', think: true }]); } };
    W.acts.chelu = { label: 'Hablar con el Grandullón', stand: [2.2, 1.6], look: [3.7, 1.5, 0.4], enabled: () => W.barra && !W.exit, run: async (api) => {
      const { say, choose, S } = api, n = W.ronda++;
      if (apoc) { W.zombi = true; await W.startApoc(api, false); return; }
      if (n === 0) {
        await say(['—Pensaba que no llegabas —dice el Grandullón, con una caña vacía ya delante de las nueve de la mañana—. ¿Cómo va la cosa?']);
        const r = await choose([{ id: 'a', label: '«Bien, con el modelo de tarificación casi listo»', hint: 'Hablas de trabajo' }, { id: 'b', label: '«Tirando. ¿Y tú?»', hint: 'Conversación sin compromiso' }, { id: 'c', label: '«Fatal. Lo dejaría todo»', hint: 'Sinceridad' }], 'Primera ronda');
        W.score += r === 'a' ? 1 : r === 'b' ? 0 : -1;
        await say(r === 'a' ? '—Qué serio. Así te va.' : r === 'b' ? '—Pues yo tengo un plan que no es un plan.' : '—Eso se arregla con una caña. Siempre se arregla con una caña.');
      } else if (n === 1) {
        await say(['El móvil vibra. Sheldon: «Reunión a las 9:30. Trae el triángulo corregido. Y cierra la ventana, hay corriente en mi cabeza».', 'El Grandullón lo lee por encima de tu hombro, sin vergüenza: —Ese tío no ha salido de una hoja de cálculo desde 2019.']);
        const r = await choose([{ id: 'a', label: 'Contestar al Sheldon ahora', hint: '«Ahí estaré»' }, { id: 'b', label: 'Dejarlo en visto', hint: 'Ya habrá tiempo' }, { id: 'c', label: 'Decirle al Grandullón que se lo conteste él', hint: 'Delegar con encanto' }], 'Segunda ronda');
        W.score += r === 'a' ? 1 : r === 'b' ? -1 : 0;
        await say(r === 'a' ? 'Escribes «ahí estaré». Respuesta en tres segundos: «Con el triángulo». Naturalmente.' : r === 'b' ? 'Dejas el móvil boca abajo. Vibra una vez. Dos. Lo ignoras con la solidez de un mal estimador.' : '—Yo no sé hablar con el Sheldon. Me responde con LaTeX.');
      } else {
        await say(['Entra un mensaje de Amor: «¿Cenamos hoy?». Debajo, la caña del Grandullón, ya recién tirada. Alguien en la barra ha puesto música de ascensor.', '—Una rápida —dice el Grandullón—, y no te pregunto nada más en todo el día.']);
        const r = await choose([{ id: 'a', label: 'Una caña', hint: 'Son las nueve de la mañana' }, { id: 'b', label: 'Otro café, y luego subo', hint: 'Termino lo que empecé' }, { id: 'c', label: 'Me voy ya', hint: 'El Sheldon y el triángulo esperan' }], 'Tercera ronda');
        W.score += r === 'a' ? -2 : r === 'b' ? 0 : 1; W.exit = true;
        await say(r === 'a' ? 'La caña llega fría y perfecta. Las nueve de la mañana nunca habían sido tan razonables.' : r === 'b' ? 'El segundo café sabe igual que el primero, pero con más culpa.' : 'Te levantas. El Grandullón levantal vaso: —Por los que suben. Luego te cuento el cotilleo.');
      } } };
    W.play = async (api) => {
      W.api = api; const { say, free } = api;
      if (opts.retry && apoc) { W.barra = true; W.zombi = true; await say(['Otra vez la cafetería. El cristal tiembla.']); await W.startApoc(api, true); { const sk = await free(1e9, '¡CORRE! hasta la puerta de la cocina · F empuja', () => W.exit); if (sk && !W.apocRes) { Q.apoc.stop(); W.apocRes = 'refugio'; } } return { score: W.score, zombi: true, res: W.apocRes }; }
      await say(apoc ? ['La cafetería de la planta baja. El cristal de la ventana tiembla de una forma que el cristal no debería.', 'El Grandullón ya está en su mesa.']
        : ['La cafetería de la planta baja. Olor a tostada y a lunes aunque sea otro día. Hay café de verdad y mesas pequeñas con gente pequeña.', 'El Grandullón ya está en su mesa, con un vaso que ya no tiene nada dentro.']);
      { const sk = await free(1e9, 'Pide algo en la barra · habla con el Grandullón (tres rondas) · mira por la ventana', () => W.exit); if (sk && W.zombi && !W.apocRes) { Q.apoc.stop(); W.apocRes = 'refugio'; } }
      return { score: W.score, zombi: W.zombi, res: W.apocRes };
    };
    return W;
  };
})();
