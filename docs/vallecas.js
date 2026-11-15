/* vallecas.js — el final: Vallecas de nuevo. Danny os deja en la esquina de la calle de la Albufera y, en el portal de casa, te espera Amor (pelo oscuro, ojos verdes).
   Una calle al amanecer con humo, un coche abandonado, tu cartel de «se busca» y una conversación corta con humor de psicología y estadística. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;

  Q.buildVallecas = (renderer, envTex) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x3a2a30); scene.fog = new THREE.FogExp2(0x4a3338, 0.022);
    if (envTex) scene.environment = envTex;
    const bounds = { minX: -5.6, maxX: 5.6, minZ: -12, maxZ: 8.4 };
    const W = { scene, obst: [], tick: [], acts: {}, actRoots: [], bounds, spawn: [-1.2, 6.8], look: [4.8, 1.5, -3.0], fin: false, pistas: 0 };
    const root = new THREE.Group(); scene.add(root); const rnd = Q.rng(1919);
    const std = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
    const emis = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
    const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const put = (geo, m, x = 0, y = 0, z = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
    const merged = (parts, m, parent = root) => { const o = new THREE.Mesh(MG.mergeBufferGeometries(parts), m); parent.add(o); return o; };
    const cv = (w, h) => { const c = Q.cvs(w, h); return [c, c.getContext('2d')]; };
    const tag = (obj, id) => { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); W.actRoots.push(obj); };
    const box = (x, z, w, d) => W.obst.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

    scene.add(new THREE.HemisphereLight(0x9a8aa8, 0x2a1e20, 0.85));
    const sun = new THREE.DirectionalLight(0xff9a5a, 0.9); sun.position.set(-20, 6, -30); scene.add(sun);
    { const [c, g] = cv(8, 256); const gr = g.createLinearGradient(0, 0, 0, 256); [[0, '#1a1730'], [0.5, '#5a4468'], [0.8, '#c0707a'], [1, '#f0a070']].forEach(([p, col]) => gr.addColorStop(p, col)); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
      put(new THREE.SphereGeometry(140, 24, 16), new THREE.MeshBasicMaterial({ map: Q.toTex(c), side: THREE.BackSide, fog: false, depthWrite: false })).renderOrder = -2; }

    /* calzada con líneas, aceras */
    { const [c, g] = cv(256, 256); g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, 256, 256); const r = Q.rng(3); for (let i = 0; i < 3500; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '10,10,12' : '90,90,96'},${r() * 0.2})`; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); } g.fillStyle = '#c9b84a'; g.fillRect(122, 0, 4, 90); g.fillRect(130, 0, 4, 90); g.fillRect(122, 150, 4, 90); g.fillRect(130, 150, 4, 90);
      const t = Q.toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 5); put(new THREE.PlaneGeometry(6, 40), std(0xffffff, 0.95, { map: t }), 0, 0, -4).rotation.x = -Math.PI / 2; }
    [-1, 1].forEach((s) => { put(new THREE.PlaneGeometry(4.2, 40), std(0x76747a, 0.95), s * 5.1, 0.04, -4).rotation.x = -Math.PI / 2; put(new THREE.BoxGeometry(0.2, 0.12, 40), std(0x8a8890, 0.9), s * 3.0, 0.06, -4); });

    /* edificios con ventanas encendidas y balcones */
    const facade = (cols, rows, base, seed) => { const CW = 28, CH = 40, [c, g] = cv(cols * CW, rows * CH), r = Q.rng(seed); g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = i * CW + 5, y = j * CH + 7, on = r() < 0.35; g.fillStyle = on ? `rgb(${240 + (r() * 14 | 0)},${196 + (r() * 30 | 0)},${120 + (r() * 30 | 0)})` : '#1a1c24'; g.fillRect(x, y, CW - 10, CH - 18); g.fillStyle = 'rgba(235,225,200,.75)'; g.fillRect(x - 2, y + CH - 18, CW - 6, 3); g.fillStyle = '#14151a'; if (j) g.fillRect(x - 3, y + CH - 14, CW - 4, 2); }
      for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(20,16,14,${r() * 0.1})`; g.fillRect(r() * c.width, r() * c.height, 1 + r() * 2, 1 + r() * 2); } return Q.toTex(c); };
    const bld = (x, z, w, h, d, base, seed) => put(new THREE.BoxGeometry(w, h, d), std(0xffffff, 0.9, { map: facade(Math.max(4, Math.round(w * 1.1)), Math.round(h / 1.5), base, seed) }), x, h / 2, z);
    [[-9.4, -2, 10, 14, 'bda080', 31], [-9.4, -12, 12, 12, 'c8aa88', 32], [-9.4, 8, 9, 13, 'b89878', 33], [9.4, -12, 12, 15, 'c4a284', 34], [9.4, 0, 6, 13, 'c0a080', 35], [9.4, 8, 9, 12, 'b49476', 36]].forEach(([x, z, d, h, b, s]) => bld(x, z, 6, h, d, '#' + b, s));
    bld(0, -18, 14, 14, 4, '#b8987a', 37);
    // el portal de casa: puerta con luz, escalón y número
    { const g = new THREE.Group(); g.position.set(6.4, 0, -3.0); root.add(g); put(new THREE.BoxGeometry(0.2, 2.5, 1.5), std(0x2a2218, 0.6), 0, 1.25, 0, g); put(new THREE.BoxGeometry(0.1, 2.2, 1.2), std(0x4a3a28, 0.5), -0.06, 1.1, 0, g); put(new THREE.BoxGeometry(0.5, 0.18, 1.8), std(0x8a8890, 0.9), -0.3, 0.09, 0, g);
      const [c, k] = cv(256, 64); k.fillStyle = '#16171c'; k.fillRect(0, 0, 256, 64); k.fillStyle = '#e8dcc0'; k.font = '700 26px Georgia'; k.textAlign = 'center'; k.fillText('VALLECAS', 128, 42); put(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: Q.toTex(c), toneMapped: false }), -0.12, 2.75, 0, g).rotation.y = -Math.PI / 2;
      const l = new THREE.PointLight(0xffc880, 1.4, 8, 2); l.position.set(-0.8, 2.4, 0); g.add(l); put(new THREE.SphereGeometry(0.13, 10, 8), emis(0xffd8a0, 2), -0.45, 2.5, 0, g); tag(g, 'portal'); }
    // farolas y un coche abandonado
    [[-3.4, 3], [3.4, -8], [-3.4, -7]].forEach(([x, z], i) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g); put(new THREE.CylinderGeometry(0.05, 0.08, 4.4, 8), std(0x202326, 0.4, { metalness: 0.7 }), 0, 2.2, 0, g); put(new THREE.SphereGeometry(0.24, 10, 8), emis(0xffc080, 1.8), 0, 4.5, 0, g); if (i < 2) { const l = new THREE.PointLight(0xffb070, 0.9, 10, 2); l.position.set(0, 4.3, 0); g.add(l); W.tick.push((dt, t) => { l.intensity = 0.9 * (Math.sin(t * 31 + i) * Math.sin(t * 4.3) > 0.9 ? 0.25 : 1); }); } });
    { const g = new THREE.Group(); g.position.set(-1.2, 0, -5.5); g.rotation.y = 0.5; root.add(g); merged([bx(3.8, 0.7, 1.7, 0, 0.6, 0), bx(2.0, 0.6, 1.55, -0.3, 1.2, 0)], std(0x3a4a5a, 0.4, { metalness: 0.5 }), g); put(new THREE.PlaneGeometry(1.1, 0.5), std(0x3a4a5a, 0.4, { metalness: 0.5, side: THREE.DoubleSide }), 0.6, 0.95, 1.5, g).rotation.y = 0.3; tag(g, 'coche'); box(-1.2, -5.5, 4, 2.2); }
    // tu cartel de «se busca», pegado en la pared del edificio de la izquierda
    { const p = put(new THREE.PlaneGeometry(0.7, 0.98), new THREE.MeshStandardMaterial({ map: Q.toTex(Q.drawWanted(3)), roughness: 0.9 }), -6.38, 1.6, -3.4); p.rotation.y = Math.PI / 2; tag(p, 'cartel'); }
    // humo lejano
    { const [c, g] = cv(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(48,40,42,.7)'); gr.addColorStop(1, 'rgba(48,40,42,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 7; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.toTex(c), transparent: true, depthWrite: false, opacity: 0.55, fog: false })); sp.position.set(-12 + i * 4, 8 + (i % 3) * 3, -16); sp.scale.setScalar(10); root.add(sp); W.tick.push((dt, t) => { sp.position.y = 8 + ((i * 2 + t * 0.7) % 14); }); } }

    /* Amor, en el escalón del portal */
    { const A = Q.buildCrowd([[5.3, -3.0]], { seed: 21, yaw: () => Math.PI / 2 + 0.2, amor: true }); root.add(A.group); A.obst.forEach((o) => W.obst.push(o)); tag(A.group, 'amor'); W.amor = A.group; }

    W.acts.amor = { label: 'Hablar con Amor', stand: [3.7, -2.4], look: [5.3, 1.45, -3.0], enabled: () => !W.fin, run: async (api) => {
      const { say, choose } = api;
      await say(['—Llegas tarde —dice Amor, sin sonreír del todo—. Tres horas y media tarde. Sin apocalipsis, sería un récord personal.', '—Tengo un diagnóstico —añade, cruzándose de brazos—: apego evitativo con sesgo de optimismo actuarial. Pero el pronóstico es bueno.']);
      const r = await choose([{ id: 'a', label: '«Te quiero. Con un intervalo de confianza del 99 %»', hint: 'Declararte con rigor' }, { id: 'b', label: '«Hemos sobrevivido. Mi probabilidad de acabar aquí era del 0,3 %»', hint: 'Estadística, como siempre' }, { id: 'c', label: 'Abrazarla sin decir nada', hint: 'Lo que tu terapeuta recomendaría' }], 'Amor te mira');
      await say(r === 'a' ? ['—Rechazo la hipótesis nula de que no —responde Amor, y por fin sonríe.'] : r === 'b' ? ['—El 0,3 % eres tú explicándome las cosas. Anda, sube —dice, y te despeina con la mano.'] : ['Ella no dice nada. Te abraza fuerte, con la cara contra tu mochila rota. Su respiración huele a café y a lluvia que no ha caído.']);
      await say(['Fuera, la ciudad arde a lo lejos y una radio repite alertas. Dentro del portal, la luz funciona y alguien ha puesto música de piano.', { text: 'Casi todo el día pensando en curvas de mortalidad. Y lo que importaba, al final, era el denominador: ella.', think: true, block: true }]);
      W.fin = true; } };
    W.acts.portal = { label: 'Mirar el portal de casa', stand: [3.4, -3.0], look: [6.3, 1.5, -3.0], enabled: () => true, run: async (api) => { await api.say('El portal de siempre, con su luz amarilla y el felpudo torcido. Al fondo, el ascensor que nunca ha funcionado a la primera. Esta vez, tampoco hará falta.'); } };
    W.acts.coche = { label: 'Mirar el coche abandonado', stand: [-0.2, -3.8], look: [-1.2, 1.0, -5.5], enabled: () => true, run: async (api) => { W.pistas++; await api.say('Un coche con las llaves puestas, la puerta abierta y una caña de cartón en el salpicadero. En Vallecas, aun en el apocalipsis, hay quien aparca en doble fila.'); } };
    W.acts.cartel = { label: 'Leer el cartel de «se busca»', stand: [-4.4, -3.4], look: [-6.3, 1.6, -3.4], enabled: () => true, run: async (api) => { await api.say(['«SE BUSCA». Cabeza de cruz, mochila, prisa. Eres tú.', { text: 'Visto por última vez, hoy. Visto de nuevo, ahora, en la misma calle donde empezó todo. Cerrando el intervalo.', think: true }]); } };
    W.play = async (api) => {
      const { say, free } = api;
      await say(['Danny frena en la esquina, a la entrada de Vallecas. «Aquí os dejo, que tengo que buscar a mi madre», dice, y la moto se pierde calle abajo con Chelu agarrado al sillín.',
        'Vallecas, otra vez. Amanece entre humo y farolas que parpadean. El portal de casa está igual que siempre. Y en el escalón, con el pelo oscuro revuelto y los ojos verdes, está Amor.']);
      await free(1e9, 'Acércate a Amor y habla con ella · mira la calle si quieres', () => W.fin); return 'fin';
    };
    return W;
  };
})();
