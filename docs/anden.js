/* anden.js — nivel 2: el andén de cercanías en hora punta. Estación, tren que llega y se va, multitud con el estilo del protagonista
   (cabeza esférica con cruz, cuerpo de losa) y el guion de los cuatro trenes. Devuelve un «mundo» que main.js sabe habitar:
   { scene, bounds, obst, tick, acts, actRoots, spawn, look, play(api) }. */
(() => {
  const Q = window.QX;
  const { rng, clamp } = Q;
  const MG = THREE.BufferGeometryUtils;

  /* ---- mismo lenguaje visual que el avatar: toon de 3 escalones + contorno negro ---- */
  const ramp = new THREE.DataTexture(new Uint8Array([22, 22, 22, 255, 52, 52, 52, 255, 92, 92, 92, 255]), 3, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.generateMipmaps = false; ramp.needsUpdate = true;
  const scaled = (geo, sx, sy, sz) => {
    const p = geo.attributes.position, n = geo.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) * sx, p.getY(i) * sy, p.getZ(i) * sz);
      const nx = n.getX(i) / sx, ny = n.getY(i) / sy, nz = n.getZ(i) / sz, l = Math.hypot(nx, ny, nz) || 1; n.setXYZ(i, nx / l, ny / l, nz / l);
    }
    p.needsUpdate = n.needsUpdate = true; return geo;
  };
  const ellipsoid = (rx, ry, rz, seg = 20) => scaled(new THREE.SphereGeometry(1, seg, Math.max(8, seg * 0.65 | 0)), rx, ry, rz);
  const slab = (h, rBot, rTop, depth) => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(rBot * 0.82, 0), new THREE.Vector2(rBot, 0.025)];
    for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; pts.push(new THREE.Vector2(rTop * Math.cos(a), h - rTop * 0.55 + Math.sin(a) * rTop * 0.55)); }
    return scaled(new THREE.LatheGeometry(pts, 24), 1, 1, depth);
  };
  const paint = (geo, r, g, b) => { const n = geo.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = r; a[i * 3 + 1] = g; a[i * 3 + 2] = b; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo; };
  const inkMat = (w) => new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { w: { value: w } },
    vertexShader: 'uniform float w; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * w, 1.0); }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.02, 0.02, 0.025, 1.0); }' });

  const cv = (w, h) => { const c = Q.cvs(w, h); return [c, c.getContext('2d')]; };
  const tex = (c, rx = 1, ry = 1) => Q.toTex(c, { repeat: [rx, ry] });

  Q.buildPlatform = (renderer, envTex) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040505); scene.fog = new THREE.FogExp2(0x070a09, 0.05);
    if (envTex) scene.environment = envTex;
    const D = Q.platformTextures();
    const W = { D, scene, obst: [], tick: [], acts: {}, actRoots: [], bounds: { minX: -9, maxX: 9, minZ: -0.5, maxZ: 3.6 }, spawn: [-8.1, 2.75], look: [4, 1.45, 0.9] };
    const rnd = rng(2026);
    const root = new THREE.Group(); scene.add(root);
    const put = (geo, m, x, y, z, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
    const std = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
    const emis = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
    const act = (obj, id) => { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); W.actRoots.push(obj); };

    /* ---------- luz: fría, verdosa, de fluorescente cansado ---------- */
    scene.add(new THREE.HemisphereLight(0x39434a, 0x0e0e0c, 0.85));
    put(new THREE.BoxGeometry(17.6, 0.05, 0.2), emis(0xeef7e6, 1.7), 0, 3.18, 1.5);
    const lamps = [];
    [-6.6, -2.2, 2.2, 6.6].forEach((x, i) => {
      const l = new THREE.PointLight(0xdfeadb, 1.3, 10.5, 2); l.position.set(x, 3.0, 1.5); scene.add(l); lamps.push(l);
      
    });
    W.tick.push((dt, t) => { lamps[1].intensity = 0.95 * (Math.sin(t * 41) * Math.sin(t * 7.3) > 0.93 ? 0.25 : 1); lamps[3].intensity = 0.95 * (Math.sin(t * 29 + 2) * Math.sin(t * 3.1) > 0.97 ? 0.3 : 1); });

    /* ---------- estación ---------- */
    { const floor = put(new THREE.PlaneGeometry(18.4, 4.6), new THREE.MeshStandardMaterial({ map: D.floor.map, normalMap: D.floor.normalMap, roughnessMap: D.floor.roughnessMap, roughness: 1, normalScale: new THREE.Vector2(1.3, 1.3) }), 0, 0, 1.3); floor.rotation.x = -Math.PI / 2; }
    put(new THREE.BoxGeometry(18.4, 1.1, 0.1), new THREE.MeshStandardMaterial({ map: D.concrete(18, 1.1).map, normalMap: D.concrete(18, 1.1).normalMap, roughness: 1 }), 0, -0.55, -1.05);                                                  // canto del andén
    { const f = put(new THREE.PlaneGeometry(40, 4), std(0x0b0c0b, 1), 0, -1.08, -3.2); f.rotation.x = -Math.PI / 2; }                  // vía
    { const parts = []; for (let x = -20; x < 20; x += 0.62) { const b = new THREE.BoxGeometry(0.22, 0.1, 2.5); b.translate(x, -1.0, -3.2); parts.push(b); }
      put(MG.mergeBufferGeometries(parts), std(0x1a1512, 0.95), 0, 0, 0);
      [-2.45, -3.95].forEach((z) => put(new THREE.BoxGeometry(40, 0.1, 0.07), std(0x4b4f50, 0.4, { metalness: 0.7 }), 0, -0.93, z)); }
    { const wm = new THREE.MeshStandardMaterial({ map: D.wall.map, normalMap: D.wall.normalMap, roughnessMap: D.wall.roughnessMap, roughness: 1, normalScale: new THREE.Vector2(1.2, 1.2) });
      const w = put(new THREE.PlaneGeometry(18.4, 3.3), wm, 0, 1.65, 3.62); w.rotation.y = Math.PI;
      [-9.2, 9.2].forEach((x) => { const e = put(new THREE.PlaneGeometry(4.6, 3.3), wm, x, 1.65, 1.3); e.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; }); }
    { const cc = D.concrete(6, 3, 8), c = put(new THREE.PlaneGeometry(18.4, 8.8), new THREE.MeshStandardMaterial({ map: cc.map, normalMap: cc.normalMap, roughnessMap: cc.roughnessMap, roughness: 1 }), 0, 3.3, -0.8); c.rotation.x = Math.PI / 2; for (let x = -7.5; x <= 7.5; x += 3) put(new THREE.BoxGeometry(0.3, 0.32, 8.6), std(0x151817, 0.9), x, 3.14, -0.8); }
    [-5.7, 5.7].forEach((x) => { put(new THREE.BoxGeometry(0.46, 3.3, 0.46), new THREE.MeshStandardMaterial({ map: D.column.map, normalMap: D.column.normalMap, roughnessMap: D.column.roughnessMap, roughness: 1 }), x, 1.65, 1.75); W.obst.push({ minX: x - 0.25, maxX: x + 0.25, minZ: 1.5, maxZ: 2.0 }); });

    /* ---------- bancos, anuncios, panel ---------- */
    const benches = new THREE.Group(); root.add(benches);
    [-7.4].forEach((x) => { put(new THREE.BoxGeometry(2.4, 0.07, 0.5), std(0x3a2b1d, 0.7), x, 0.46, 3.25, benches); put(new THREE.BoxGeometry(2.4, 0.5, 0.06), std(0x3a2b1d, 0.7), x, 0.75, 3.5, benches); [-1, 1].forEach((s) => put(new THREE.BoxGeometry(0.06, 0.46, 0.44), std(0x1a1a1a, 0.5), x + s * 1.1, 0.23, 3.25, benches)); W.obst.push({ minX: x - 1.25, maxX: x + 1.25, minZ: 3.0, maxZ: 3.6 }); });
    act(benches, 'banco');
    const adTex = (l1, l2, hue) => { const [c, g] = cv(256, 360); g.fillStyle = '#0b0b0c'; g.fillRect(0, 0, 256, 360); g.fillStyle = hue; g.fillRect(14, 14, 228, 228); g.fillStyle = '#0b0b0c'; g.beginPath(); g.ellipse(128, 128, 58, 70, 0, 0, 7); g.fill();
      g.fillStyle = '#d6d0c2'; g.font = '700 26px Georgia'; g.textAlign = 'center'; g.fillText(l1, 128, 282); g.font = 'italic 17px Georgia'; g.fillStyle = '#8a867c'; g.fillText(l2, 128, 312); return tex(c); };
    const ads = new THREE.Group(); root.add(ads);
    [[-6.2, 'TU FUTURO', 'asegurado (casi)', '#3b4a3a'], [-2.6, 'VIVE HOY', 'paga a 96 cuotas', '#4d3a2c'], [2.6, '¿Y SI MAÑANA?', 'cobertura básica', '#2f3a4a']].forEach(([x, a, b, h]) => {
      const p = put(new THREE.BoxGeometry(1.3, 1.85, 0.06), new THREE.MeshStandardMaterial({ map: adTex(a, b, h), emissive: 0x777777, emissiveMap: adTex(a, b, h), roughness: 0.6 }), x, 1.75, 3.55, ads); p.rotation.y = Math.PI; });
    act(ads, 'anuncio');
    const boardC = Q.cvs(512, 140), bg = boardC.getContext('2d'), boardT = Q.toTex(boardC);
    const board = new THREE.Group(); root.add(board); board.position.set(0, 2.62, 0.2);
    put(new THREE.BoxGeometry(2.9, 0.62, 0.14), std(0x0a0a0a, 0.5), 0, 0, 0, board);
    put(new THREE.PlaneGeometry(2.7, 0.5), new THREE.MeshBasicMaterial({ map: boardT, toneMapped: false }), 0, 0, 0.075, board).rotation.y = 0;
    const bd = put(new THREE.PlaneGeometry(2.7, 0.5), new THREE.MeshBasicMaterial({ map: boardT, toneMapped: false }), 0, 0, -0.075, board); bd.rotation.y = Math.PI;
    [-1.2, 1.2].forEach((x) => put(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), std(0x222222), x, 0.62, 0, board));
    const setBoard = (l1, l2) => { bg.fillStyle = '#050403'; bg.fillRect(0, 0, 512, 140); bg.fillStyle = '#e8a23a'; bg.font = '700 44px Consolas, monospace'; bg.textAlign = 'center'; bg.fillText(l1, 256, 56); bg.fillStyle = l2.indexOf('COMPLETO') >= 0 ? '#d65a3a' : '#9fe07a'; bg.font = '700 40px Consolas, monospace'; bg.fillText(l2, 256, 112); boardT.needsUpdate = true; };
    setBoard('C-2  ANDÉN 2', 'PRÓXIMO TREN'); W.setBoard = setBoard; act(board, 'panel');

    /* ---------- tren: Cercanías Renfe (blanco, franja naranja y morada, morro naranja con luces) ---------- */
    const TL = 16, TH = 3.35, TZ = -2.85, TX = 1.5;
    const trainTex = (gap) => {
      const mk = (emissive) => { const [c, g] = cv(2048, 384), pm = 128, rr = rng(gap ? 5 : 3);
        g.fillStyle = emissive ? '#000' : '#e8e5dd'; g.fillRect(0, 0, 2048, 384);
        if (!emissive) {
          g.fillStyle = '#b4b1a8'; g.fillRect(0, 0, 2048, 16);
          g.fillStyle = '#e0561b'; g.fillRect(0, 268, 2048, 30); g.fillStyle = '#5b2a6b'; g.fillRect(0, 302, 2048, 6);
          g.fillStyle = '#2d2f32'; g.fillRect(0, 326, 2048, 58); g.fillStyle = '#17181a'; g.fillRect(0, 326, 2048, 4);
          for (let i = 0; i < 90; i++) { const x = rr() * 2048, gr = g.createLinearGradient(x, 20, x + 3, 260); gr.addColorStop(0, 'rgba(60,52,40,0)'); gr.addColorStop(1, 'rgba(60,52,40,.16)'); g.fillStyle = gr; g.fillRect(x, 20, 2 + rr() * 5, 240); }
          g.fillStyle = '#6b2a7a'; g.font = 'italic 700 38px Arial'; g.fillText('renfe', 1024 - 7.4 * pm, 250); g.fillStyle = '#7a756c'; g.font = '16px Consolas'; g.fillText('463 · 021-4', 1024 + 6.1 * pm, 248);
        }
        const zone = (cx, w, door) => { const x = 1024 + cx * pm - w * pm / 2, ww = w * pm, y = 74, h = 132;
          if (door && !emissive) { g.fillStyle = '#dcd9d0'; g.fillRect(x - 6, 30, ww + 12, 236); g.strokeStyle = '#8b887f'; g.lineWidth = 4; g.strokeRect(x - 6, 30, ww + 12, 236); g.beginPath(); g.moveTo(x + ww / 2, 30); g.lineTo(x + ww / 2, 266); g.stroke(); g.fillStyle = '#2a2b2e'; g.fillRect(x + ww / 2 - 14, 150, 5, 34); g.fillRect(x + ww / 2 + 9, 150, 5, 34); g.fillStyle = '#e0561b'; g.fillRect(x - 6, 240, ww + 12, 8); }
          g.fillStyle = emissive ? '#5c4d34' : '#14161a'; g.fillRect(x, y, ww, h);
          if (!emissive) { const gl = g.createLinearGradient(x, y, x + ww, y + h); gl.addColorStop(0, 'rgba(120,150,190,.20)'); gl.addColorStop(0.5, 'rgba(120,150,190,0)'); gl.addColorStop(1, 'rgba(120,150,190,.12)'); g.fillStyle = gl; g.fillRect(x, y, ww, h); }
          const empty = gap && door && cx === 2.0, n = empty ? 0 : (door ? 3 : 4);
          g.save(); g.beginPath(); g.rect(x, y, ww, h); g.clip();
          for (let i = 0; i < n; i++) { const px = x + 16 + rr() * (ww - 32), py = y + 34 + rr() * 38, r = 21 + rr() * 6;
            g.fillStyle = emissive ? '#000' : '#8e8e92'; g.strokeStyle = '#050506'; g.lineWidth = 3; g.beginPath(); g.ellipse(px, py, r, r * 1.1, 0, 0, 7); g.fill(); if (!emissive) g.stroke();
            g.fillStyle = emissive ? '#000' : ['#26272b', '#2f2a26', '#1f2430'][i % 3]; g.fillRect(px - r * 1.15, py + r, r * 2.3, h); if (!emissive) g.strokeRect(px - r * 1.15, py + r, r * 2.3, h);
            if (!emissive) { g.strokeStyle = '#050506'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(px - r * 0.5, py + 2); g.lineTo(px + r * 0.5, py + 2); g.moveTo(px, py - r * 0.5); g.lineTo(px, py + r * 0.55); g.stroke(); } }
          g.restore(); };
        [-4.0, 0, 4.0].forEach((cx) => zone(cx, 1.9, false)); [-7.2, 7.2].forEach((cx) => zone(cx, 0.8, false)); [-6.0, -2.0, 2.0, 6.0].forEach((cx) => zone(cx, 1.3, true));
        return Q.toTex(c); };
      return { map: mk(false), emissiveMap: mk(true) };
    };
    const TT = { full: trainTex(false), gap: trainTex(true) };
    const sideM = (t) => new THREE.MeshStandardMaterial({ map: t.map, emissive: 0xffffff, emissiveMap: t.emissiveMap, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.25 });
    const dark = std(0x2a2c2f, 0.55, { metalness: 0.4 }), roofM = std(0xcfccc3, 0.5, { metalness: 0.2 });
    const trainMats = (t) => [dark, dark, roofM, dark, sideM(t), std(0xdcd9d0, 0.5)];
    const train = new THREE.Group(); root.add(train); train.position.set(60, 0, 0);
    const trainBody = put(new THREE.BoxGeometry(TL, TH, 2.95), trainMats(TT.full), 0, TH / 2 - 0.35, TZ, train);
    { const orange = std(0xe0561b, 0.3, { metalness: 0.25 }), white = std(0xe8e5dd, 0.4), glass = new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.08, metalness: 0.5 });
      const nose = new THREE.Group(); train.add(nose); nose.position.set(-9.0, 0, TZ);
      put(Q.rbox(2.4, 3.2, 2.95, 0.6, 7), orange, 0, 1.28, 0, nose); put(Q.rbox(2.3, 0.8, 2.9, 0.16, 4), white, -0.02, 0.1, 0, nose);
      put(new THREE.PlaneGeometry(2.25, 1.0), glass, -1.215, 1.95, 0, nose).rotation.y = -Math.PI / 2;
      { const [k, g] = cv(512, 96); g.fillStyle = '#0a0705'; g.fillRect(0, 0, 512, 96); g.fillStyle = '#ffa526'; g.font = '700 54px Consolas'; g.textAlign = 'center'; g.fillText('C-2  N.MINISTERIOS', 256, 66);
        put(new THREE.PlaneGeometry(1.3, 0.24), new THREE.MeshBasicMaterial({ map: Q.toTex(k), toneMapped: false }), -1.218, 1.3, 0, nose).rotation.y = -Math.PI / 2; }
      [-1, 1].forEach((sd) => { put(new THREE.CircleGeometry(0.1, 20), emis(0xfff4d8, 2.2), -1.22, 0.62, 0.8 * sd, nose).rotation.y = -Math.PI / 2; put(new THREE.CircleGeometry(0.07, 16), emis(0xff2a1a, 1.8), -1.22, 0.62, 0.55 * sd, nose).rotation.y = -Math.PI / 2; });
      put(new THREE.BoxGeometry(0.5, 0.3, 0.9), dark, -1.4, -0.12, 0, nose);
      const hl = new THREE.PointLight(0xfff0d0, 1.1, 9, 2); hl.position.set(-2.4, 0.9, 0); nose.add(hl); }
    const tl = new THREE.PointLight(0xffb870, 0.9, 7, 2); tl.position.set(0, 1.9, -1.05); train.add(tl);
    W.train = train; W.setTrainGap = (gap) => { trainBody.material = trainMats(gap ? TT.gap : TT.full); };
    W.TX = TX; W.doorX = TX - 2.0;

    /* ---------- multitud (módulo compartido gente.js): densa, con un pasillo libre junto a la pared ---------- */
    { const R = rng(88), spots = [];
      for (let x = -8.2; x <= 8.4; x += 0.56) for (let z = -0.15; z <= 2.0; z += 0.56) {
        const nearDoor = [-4.5, -0.5, 3.5, 7.5].some((d) => Math.abs(x - d) < 1.4), p = (nearDoor ? 0.98 : 0.78) * (x < -7.3 && z > 1.2 ? 0.3 : 1);
        if (R() < p) spots.push([x + (R() - 0.5) * 0.3, z + (R() - 0.5) * 0.3]);
      }
      const C = Q.buildCrowd(spots, { seed: 88 }); root.add(C.group); C.obst.forEach((o) => W.obst.push(o)); W.crowdCount = C.count; act(C.group, 'gente'); }

    /* ---------- la señora que tose (pista de lo que viene) ---------- */
    { const g = new THREE.Group(); root.add(g); g.position.set(-7.0, 0, 1.5);
      const sh = new THREE.MeshToonMaterial({ color: 0x4a2f2f, gradientMap: ramp });
      put(ellipsoid(0.28, 0.31, 0.25, 18), new THREE.MeshToonMaterial({ color: 0x9aa088, gradientMap: ramp }), 0, 1.4, 0, g).rotation.x = 0.35;
      put(slab(0.98, 0.235, 0.255, 0.62), sh, 0, 0.14, 0, g).rotation.x = 0.1;
      const hb = put(ellipsoid(0.1, 0.07, 0.08, 10), new THREE.MeshToonMaterial({ color: 0x9aa088, gradientMap: ramp }), 0, 1.12, -0.3, g);
      W.tick.push((dt, t) => { const c = Math.max(0, Math.sin(t * 2.2)) ** 6; g.rotation.x = c * 0.07; g.position.y = c * 0.02; hb.position.y = 1.12 + c * 0.1; });
      W.obst.push({ minX: -7.3, maxX: -6.7, minZ: 1.2, maxZ: 1.8 }); act(g, 'senora'); }

    /* ---------- interacciones ---------- */
    W.pistas = 0;
    W.acts.panel = { label: 'Mirar el panel', stand: [-0.6, 1.6], look: [0, 2.62, 0.2], enabled: () => true, run: async (api) => { await api.say(['«C-3 · Andén 2». Lo único que el panel sabe con certeza es que va a llegar un tren y que no va a caber nadie. Es un buen predictor.']); } };
    W.acts.gente = { label: 'Mirar a la gente', stand: [-1.2, 2.4], look: [0.5, 1.5, 0.6], enabled: () => true, run: async (api) => { await api.say(['Todos tienen la misma expresión: la de quien ya ha hecho el cálculo y no le sale.', 'Ochocientas personas con la misma cara y ninguna se parece a ti. Lo cual, bien mirado, es un problema de identificabilidad.']); } };
    W.acts.banco = { label: 'Sentarte un segundo', stand: [-6.0, 2.6], look: [-7.4, 0.8, 3.4], enabled: () => true, run: async (api) => { await api.say(['Un banco libre. Sospechosamente libre. Te sientas un minuto: reservas de energía, 14 %. No se computan intereses sobre ellas.']); } };
    W.acts.anuncio = { label: 'Leer el anuncio', stand: [-2.6, 2.4], look: [-2.6, 1.75, 3.55], enabled: () => true, run: async (api) => { await api.say(['«Vive hoy, paga a 96 cuotas.» Debajo, en una letra que solo se lee con el cuerpo pegado a la pared, el TAE.']); } };
    W.acts.senora = { label: 'Mirar a la señora', stand: [-5.6, 2.4], look: [-7.0, 1.4, 1.5], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['Una señora tose sin parar, doblada sobre sí misma. La megafonía dice «por su seguridad, mantengan la distancia». Nadie la mantiene.', { text: 'Tose igual que la que viste en el telediario. Seguro que no es nada.', think: true }]); } };

    /* ---------- guion: cuatro trenes ---------- */
    W.acts.escalera = { label: 'Subir las escaleras', stand: [5.0, 3.0], look: [9.1, 3.1, 3.0], enabled: () => true, run: async (api) => {
      const { say, tween, P } = api, cl = (window.Sound && Sound.clue) || 0; W.pistas++;
      await say('Las escaleras suben hasta una puerta metálica que nadie ha abierto en toda la mañana. Subes.');
      const x0 = P.x, y0 = P.dy || 0; await tween(2400, (e) => { P.x = x0 + 3.5 * e; P.dy = y0 + 2.0 * e; P.walk = 1; }); P.walk = 0;
      if (window.Sound && Sound.on) { if (cl >= 2) Sound.scratch(1); Sound.knock(cl >= 3 ? 6 : 3, 0.7 + 0.1 * cl); }
      W.doorShake = cl;
      const T = [['Pegas la oreja a la chapa. Un murmullo, como de máquinas. O de gente hablando bajito, muy lejos.'],
        ['Tres golpes suaves, desde dentro. Una pausa. Otros tres.', { text: 'Alguien pide que le abran. O alguien pide que no lo hagas.', think: true }],
        ['Arañazos contra la chapa, un forcejeo y una voz que no llega a ser palabra.', { text: 'La puerta está cerrada con llave. Por fuera. Eso lo cambia todo.', think: true }],
        ['La puerta se curva hacia fuera con cada embestida. Hay manchas oscuras en el borde y el marco vibra en tus dientes.', 'Algo empuja. No es una persona. Son muchas, y no tienen prisa.', { text: 'Nunca se abre. Por eso es mejor no saber qué hay al otro lado.', think: true, block: true }]][Math.min(cl, 3)];
      await say(T); W.doorShake = 0;
      const x1 = P.x, y1 = P.dy; await tween(1800, (e) => { P.x = x1 - 3.5 * e; P.dy = y1 * (1 - e); P.walk = 1; }); P.walk = 0; P.dy = 0; } };
    W.tick.push((dt, t) => { if (W.doorMesh) { const k = W.doorShake || 0; W.doorMesh.position.x = 9.12 + (k ? Math.max(0, Math.sin(t * 22)) * 0.012 * Math.min(k, 3) : 0); } });
    const sleep0 = (ms) => new Promise((r) => setTimeout(r, ms));
    W.play = async (api) => {
      const { say, choose, tween, wait, setTime, free, P, S, chart } = api;
      const hh = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const t0 = 6 * 60 + 25 + (S.snooze || 0) * 10;
      const trainTo = (x, ms, snd) => { if (snd && window.Sound && Sound.on) Sound.whoosh(); const x0 = train.position.x; return tween(ms, (e) => { train.position.x = x0 + (x - x0) * e; }); };
      const sT = setTime; const setTime2 = (v) => { W.timeStr = v; sT(v); }; setTime2(hh(t0));
      await say(['Andén de cercanías. Hora punta. Ochocientas personas esperan a un tren que aún no ha llegado y que, cuando llegue, ya irá lleno.', 'Todos tienen la misma expresión: la de quien ya ha hecho el cálculo y no le sale.']);
      await free(12000, 'Puedes moverte (W A S D) y mirar. El tren llega en {s} s · V cambia la cámara');
      let pensado = false;
      for (let k = 1; k <= 2; k++) {
        setTime2(hh(t0 + k * 7));
        W.setBoard(`C-2  TREN ${k}`, k < 2 ? 'COMPLETO' : 'AÚN HAY HUECO*'); W.setTrainGap(k === 2); train.position.x = 60;
        S.busy = true; api.cine({ pos: [-8, 1.7, 3.0], look: () => [Math.max(train.position.x - 3, -2), 1.6, TZ] });         // plano del tren entrando, sin primera ni tercera persona
        await trainTo(TX, 3400, true); api.cine(null); S.busy = false;                                       // y de vuelta a ti, con libertad para moverte
        if (window.Sound && Sound.on) { Sound.brake(); setTimeout(() => Sound.doorBeep(), 900); }
        say([{ think: true, text: [
          'Llega el primero. Va hasta arriba: la gente se pega a los cristales como pegatinas.',
          'Segundo tren. Se ve algo de hueco entre un abrigo y una axila. Es tu momento… o tu excusa.'][k - 1] }]);
        const base = [0.04, 0.22][k - 1], p = k < 2 ? Math.max(0.01, base - 0.012 * (S.snooze || 0)) : 1;
        const accion = await new Promise((res) => {                                                     // barra de decisión: no bloquea, tienes 16 s y puedes moverte
          const el = document.createElement('div'); el.id = 'trenbar'; el.setAttribute('role', 'group');
          el.innerHTML = `<b>Tren ${k}: ¿qué haces?</b><button type="button" data-k="empujar"><kbd>1</kbd> Empujar y meterte como puedas<small>${k < 2 ? 'Probabilidad de subir ≈ ' + (p * 100).toFixed(0) + ' %' : 'Probabilidad de subir ≈ 100 %: es el último que te sirve'}</small></button><button type="button" data-k="pasar"><kbd>2</kbd> ${k < 2 ? 'Dejar pasar este tren' : 'Dejar pasar también este'}<small>${k < 2 ? 'Sin riesgo. Con culpa.' : 'Si lo pierdes, hoy no llegas a trabajar'}</small></button><i></i>`;
          document.body.appendChild(el); const bar = el.querySelector('i'); const t0 = performance.now();
          const done = (v) => { clearInterval(iv); window.removeEventListener('keydown', onKey); el.remove(); res(v); };
          const onKey = (e) => { if (e.key === '1') done('empujar'); else if (e.key === '2') done('pasar'); };
          window.addEventListener('keydown', onKey); el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => done(b.dataset.k)));
          const iv = setInterval(() => { const f = (performance.now() - t0) / 16000; bar.style.width = (100 - f * 100) + '%'; if (f >= 1) done('pasar'); }, 100);
        });
        S.busy = true;
        if (accion === 'empujar') {
          const sx = P.x, sz = P.z;
          await tween(520, (e) => { P.z = sz - 0.9 * Math.sin(e * Math.PI / 2); P.walk = 1; });
          if (Math.random() < p) {
            if (window.Sound && Sound.on) Sound.ok();
            await say(k === 1 ? ['¡Has subido a la primera! Era un suceso del 1 %. Hoy has gastado toda la suerte de la semana.'] : ['Entras en el hueco imposible. Las puertas se cierran detrás de tu mochila. Estás dentro.']);
            api.cine({ pos: [7.5, 1.7, 3.0], look: () => [train.position.x * 0.8, 1.6, TZ] });                    // plano del tren saliendo de la estación
            if (window.Sound && Sound.on) Sound.doorBeep(); await sleep0(900); await trainTo(-60, 3600, true); api.cine(null);
            return 'subido';
          }
          if (window.Sound && Sound.on) Sound.bad();
          await tween(620, (e) => { P.z = (sz - 0.9) + 0.9 * e; P.walk = 0.6; }); P.walk = 0;
          await say('Empujas. El tren, no. Un señor con maletín te devuelve a tu sitio con una ligera presión del hombro. Educado, pero firme.');
        } else {
          if (k === 2) { await trainTo(-60, 2400, true); return 'cervezas'; }
          S.descuido = (S.descuido || 0) + 1;
          await say('Lo dejas pasar. Rezas por una cosa: que el siguiente venga con un poco menos de gente.');
        }
        if (k === 1 && !pensado) { pensado = true; await say([{ text: 'Un tren, y la misma imagen: el andén lleno de gente de entre 40 y 50 años, pegada a las puertas.', think: true, block: true }, { text: '¿Por qué la curva de mortalidad no se mueve hacia ahí? Si lo hiciera, este andén sería una tabla de vida.', think: true, block: true }]); await chart(); }
        if (window.Sound && Sound.on) Sound.doorBeep(); await trainTo(-60, 2600, true);
        if (k < 2) await free(7000, 'Siguiente tren en {s} s · las escaleras del fondo, a la derecha, también se pueden subir');
      }
      return 'cervezas';
    };
    Q.decoratePlatform(W, { scene, root, rnd, std, emis, put, act, ellipsoid, slab, paint, ramp, inkMat });
    return W;
  };
})();
