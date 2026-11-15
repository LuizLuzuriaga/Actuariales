/* tren.js — nivel 3: dentro del Cercanías en hora punta. Un vagón con suelo de goma acanalado, asientos de tela, barras y asas, pantallas LED sobre las puertas,
   ventanas con luces que pasan, multitud apretada y el vecino a dos centímetros. Devuelve un «mundo» como el del andén. También define Q.showFicha (el currículum). */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;
  const R2 = Math.PI * 2;
  const { ellipsoid, slab, paint, inkMat, crowdMat } = Q.toonKit;

  /* ---------- ficha: el currículum, en la misma ventana que la curva ---------- */
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const FICHA = {
    nombre: 'Luiz Alberto Luzuriaga Izquierdo', rol: 'Estudiante de Máster en Ciencias Actuariales y Financieras (UAH) · Madrid',
    trayectoria: [['Máster en Ciencias Actuariales y Financieras', 'UAH · sept. 2025 – actualidad', 'Modelos de solvencia, estadística avanzada, gestión de riesgos.'],
      ['Grado en Economía', 'UAH · 2021 – 2025 · nota media 8,6', 'Econometría y análisis macroeconómico.'],
      ['Gestor de operaciones bancarias', 'EVO Banco (Covisian) · 2023 – 2024', 'Prevención de blanqueo, Salesforce, KPIs en Excel.'],
      ['Team leader en hostelería', '2017 – 2021', 'Equipos de hasta 5 personas, inventarios, presión alta.']],
    proyectos: [['Gedankenpalast — Atlas 3D de estudio', 'Atlas interactivo del temario actuarial y cuantitativo con fórmulas y código ejecutable en el navegador.', ['JavaScript', 'Three.js', 'KaTeX', 'Pyodide']],
      ['Modelización de riesgo crediticio', 'Patrones de riesgo sobre datos transaccionales bancarios.', ['Python', 'Pandas', 'Excel']],
      ['Reporting de KPIs operativos', 'Cuadros de mando con integración en un CRM.', ['Salesforce', 'Power Query']],
      ['TFG — Econometría aplicada', 'Regresión y series temporales sobre datos macroeconómicos.', ['R', 'Stata', 'LaTeX']]],
    habilidades: [['Análisis de datos / Estadística', 85], ['Excel avanzado / Stata', 82], ['R (tidyverse, ggplot2)', 72], ['Python (Pandas, NumPy)', 70], ['Salesforce CRM', 75], ['Power BI', 68], ['LaTeX', 65], ['SQL (básico)', 55]],
  };
  Q.showFicha = () => new Promise((resolve) => {
    if (document.pointerLockElement) document.exitPointerLock();
    const F = FICHA, host = document.createElement('div'); host.id = 'sheet';
    host.innerHTML = '<div class="card ficha"><h3>' + esc(F.nombre) + '</h3><p class="rol">' + esc(F.rol) + '</p><div class="cols"><div><h4>Trayectoria</h4>' +
      F.trayectoria.map(([t, w, d]) => '<div class="tl"><b>' + esc(t) + '</b><span>' + esc(w) + '</span><em>' + esc(d) + '</em></div>').join('') +
      '<h4>Herramientas</h4>' + F.habilidades.map(([k, v]) => '<div class="sk"><span>' + esc(k) + '</span><i style="width:' + v + '%"></i></div>').join('') +
      '</div><div><h4>Proyectos</h4>' + F.proyectos.map(([t, d, tags]) => '<div class="pj"><b>' + esc(t) + '</b><em>' + esc(d) + '</em><div>' + tags.map((g) => '<span>' + esc(g) + '</span>').join('') + '</div></div>').join('') + '</div></div>' +
      '<div class="row"><button type="button" class="btn primary" id="sh-ok">Guardar el móvil</button></div></div>';
    document.body.appendChild(host);
    let closed = false; const close = () => { if (closed) return; closed = true; window.removeEventListener('keydown', onKey, true); host.remove(); resolve(); };
    const onKey = (e) => { if (['Enter', 'Escape', 'e', 'E', ' ', 'm', 'M'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); close(); } };
    window.addEventListener('keydown', onKey, true); host.querySelector('#sh-ok').addEventListener('click', close);
  });

  /* Cartel de «se busca» que cambia con el descuido: 0 mascota · 1 anónimo · 2 alguien conocido · 3 tú */
  Q.wantedStage = (clue) => Math.max(0, Math.min(3, clue - 1));
  Q.drawWanted = (stage) => {
    const c = Q.cvs(256, 360), g = c.getContext('2d'), r = Q.rng(70 + stage);
    g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, 256, 360); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(90,80,60,${r() * 0.12})`; g.fillRect(r() * 256, r() * 360, 1 + r() * 2, 1 + r() * 2); }
    g.fillStyle = '#6a1a1a'; g.font = '700 44px Georgia'; g.textAlign = 'center'; g.fillText(stage === 0 ? 'SE BUSCA' : 'SE BUSCA', 128, 54);
    g.fillStyle = '#1a1a1a'; g.fillRect(28, 72, 200, 170);
    g.fillStyle = '#d8d0b8'; g.fillRect(32, 76, 192, 162);
    const txt = (a, y, s = 17, w = '400') => { g.fillStyle = '#1a1a1a'; g.font = `${w} ${s}px Georgia`; g.textAlign = 'center'; a.forEach((l, i) => g.fillText(l, 128, y + i * (s + 4))); };
    if (stage === 0) {                                                     // un gato
      g.fillStyle = '#2a2622'; g.beginPath(); g.ellipse(128, 182, 40, 32, 0, 0, 7); g.fill(); g.beginPath(); g.arc(128, 142, 28, 0, 7); g.fill(); g.beginPath(); g.moveTo(104, 126); g.lineTo(108, 100); g.lineTo(124, 118); g.fill(); g.beginPath(); g.moveTo(152, 126); g.lineTo(148, 100); g.lineTo(132, 118); g.fill();
      g.fillStyle = '#e8d890'; g.beginPath(); g.arc(118, 142, 4, 0, 7); g.arc(138, 142, 4, 0, 7); g.fill(); txt(['Responde al nombre de «Prima».', 'Muy asustadizo.'], 268); txt(['Recompensa: una caña'], 338, 14);
    } else if (stage === 1) {                                              // silueta sin rostro
      g.fillStyle = '#16181a'; g.beginPath(); g.arc(128, 132, 34, 0, 7); g.fill(); g.fillRect(96, 160, 64, 74); g.fillStyle = '#d8d0b8'; g.font = '700 42px Georgia'; g.textAlign = 'center'; g.fillText('?', 128, 146);
      txt(['Sin identificar.', 'Puede ser cualquiera.'], 268); txt(['Visto por la zona. Mucho.'], 338, 14);
    } else if (stage === 2) {                                              // un rostro conocido: alto, regordete, perilla y bigote
      g.fillStyle = '#4a3220'; g.beginPath(); g.arc(128, 118, 40, Math.PI, 0); g.fill(); g.fillStyle = '#d6a888'; g.beginPath(); g.ellipse(128, 138, 38, 44, 0, 0, 7); g.fill();
      g.fillStyle = '#4a3220'; g.fillRect(104, 150, 48, 6); g.beginPath(); g.moveTo(118, 156); g.lineTo(138, 156); g.lineTo(128, 182); g.fill(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(114, 132, 3, 0, 7); g.arc(142, 132, 3, 0, 7); g.fill();
      g.fillStyle = '#8a8a8a'; g.fillRect(84, 186, 88, 52); txt(['Te suena de algo.', 'De muchas cañas.'], 268); txt(['Visto por última vez: de cañas'], 338, 14);
    } else {                                                               // tú: cabeza de cruz y mochila
      g.fillStyle = '#d6d6d0'; g.beginPath(); g.arc(128, 128, 34, 0, 7); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 34, 0, 7); g.moveTo(112, 128); g.lineTo(144, 128); g.moveTo(128, 112); g.lineTo(128, 144); g.stroke();
      g.fillStyle = '#4a4e56'; g.fillRect(100, 164, 56, 72); g.fillStyle = '#2a2e36'; g.fillRect(92, 172, 14, 52); txt(['TÚ.', 'Actuario, mochila, prisa.'], 268, 19, '700'); txt(['Visto por última vez: hoy'], 338, 14);
    }
    return c;
  };
  Q.buildTrain = (renderer, envTex, getClue) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608); scene.fog = new THREE.FogExp2(0x0a0c0e, 0.07);
    if (envTex) scene.environment = envTex;
    const W = { scene, obst: [], tick: [], acts: {}, actRoots: [], bounds: { minX: -2.1, maxX: 0.6, minZ: -0.8, maxZ: 0.85 }, spawn: [-0.95, 0.35], look: [-1.7, 1.45, -1.34],
      hudAct: { id: 'movil', label: '📱 Sacar el móvil (M)', key: 'm' }, sway: { roll: 0, y: 0 }, exit: false, pistas: 0 };
    const rnd = Q.rng(515), root = new THREE.Group(); scene.add(root);
    const put = (geo, m, x = 0, y = 0, z = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
    const std = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
    const emis = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
    const tag = (obj, id) => { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); W.actRoots.push(obj); };
    const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const cy = (rt, rb, h, x, y, z, axis = 'y', seg = 10) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg); if (axis === 'x') g.rotateZ(Math.PI / 2); if (axis === 'z') g.rotateX(Math.PI / 2); return g.translate(x, y, z); };
    const merged = (parts, m, parent = root) => { const o = new THREE.Mesh(MG.mergeBufferGeometries(parts), m); parent.add(o); return o; };
    const cv = (w, h) => { const c = Q.cvs(w, h); return [c, c.getContext('2d')]; };
    const tx = (c) => Q.toTex(c);
    const metal = std(0x2a2d2f, 0.45, { metalness: 0.7 }), steel = std(0xb7bcbe, 0.25, { metalness: 0.95 }), black = std(0x0c0d0e, 0.6, { metalness: 0.3 });

    /* ---------- materiales con relieve ---------- */
    const floorT = Q.pbr(512, 512, (g, hg, rg, w, h) => {
      const r = Q.rng(3); g.fillStyle = '#34373a'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#d0d0d0'; rg.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, y, w, 4); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(0, y + 5, w, 2); hg.fillStyle = '#2e2e2e'; hg.fillRect(0, y, w, 5); hg.fillStyle = '#c8c8c8'; hg.fillRect(0, y + 6, w, 4); }
      for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 0 : 150},${r() < 0.5 ? 0 : 150},${r() < 0.5 ? 0 : 150},${r() * 0.18})`; g.fillRect(r() * w, r() * h, 2, 2); }
      for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h, rad = 30 + r() * 70, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(110,112,108,.22)'); gr.addColorStop(1, 'rgba(110,112,108,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      for (let i = 0; i < 22; i++) { const x = r() * w, y = r() * h, rad = 6 + r() * 16, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(14,12,10,.55)'); gr.addColorStop(1, 'rgba(14,12,10,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    }, { strength: 3, repeat: [10, 2], rough: true });
    const fabricT = Q.pbr(256, 256, (g, hg, rg, w, h) => {
      const r = Q.rng(12); g.fillStyle = '#4a3b57'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#e0e0e0'; rg.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 8) for (let x = ((y / 8) % 2) * 8; x < w; x += 16) { g.fillStyle = '#6a5a78'; g.fillRect(x, y, 6, 6); g.fillStyle = '#2c2436'; g.fillRect(x + 8, y + 2, 4, 4); hg.fillStyle = '#b0b0b0'; hg.fillRect(x, y, 6, 6); }
      for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 0 : 200},${r() < 0.5 ? 0 : 200},${r() < 0.5 ? 0 : 200},${r() * 0.1})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
    }, { strength: 2.4, repeat: [2, 2], rough: true });
    const lamT = Q.pbr(256, 256, (g, hg, rg, w, h) => {
      const r = Q.rng(14); g.fillStyle = '#c9c3b2'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#8a8a8a'; rg.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(70,66,56,.5)'; g.fillRect(x, 0, 2, h); hg.fillStyle = '#383838'; hg.fillRect(x - 1, 0, 4, h); }
      for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 240},${r() * 0.06})`; g.fillRect(r() * w, r() * h, 2, 2); }
      for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(60,56,46,${0.1 + r() * 0.2})`; g.fillRect(r() * w, r() * h, 3 + r() * 20, 1.5); }
      const gb = g.createLinearGradient(0, h * 0.6, 0, h); gb.addColorStop(0, 'rgba(0,0,0,0)'); gb.addColorStop(1, 'rgba(30,26,20,.3)'); g.fillStyle = gb; g.fillRect(0, h * 0.6, w, h * 0.4);
    }, { strength: 2.2, repeat: [6, 1], rough: true });
    const pbrM = (t, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1 }, extra));
    const whiteM = std(0xe4e1d9, 0.55), frameM = std(0x1b1d1f, 0.5, { metalness: 0.4 });

    /* ---------- luz: LED frío y un reflejo naranja de farolas fuera ---------- */
    scene.add(new THREE.HemisphereLight(0x4a5760, 0x15130f, 0.85));
    [-3.6, 0, 3.6].forEach((x) => { const l = new THREE.PointLight(0xe8f0f5, 1.15, 8, 2); l.position.set(x, 2.0, 0); scene.add(l); });
    const flick = [-1, 1].map((s) => { const l = new THREE.PointLight(0xffa84a, 0.3, 3.2, 2); l.position.set(-1, 1.5, 1.2 * s); scene.add(l); return l; });

    /* ---------- caja del vagón ---------- */
    const fl = put(new THREE.PlaneGeometry(14, 2.7), pbrM(floorT, { normalScale: new THREE.Vector2(1.4, 1.4) }), 0, 0, 0); fl.rotation.x = -Math.PI / 2;
    { const c = put(new THREE.PlaneGeometry(14, 2.7), whiteM, 0, 2.32, 0); c.rotation.x = Math.PI / 2;
      [-1, 1].forEach((s) => { const sl = put(new THREE.PlaneGeometry(14, 0.5), whiteM, 0, 2.16, 1.18 * s); sl.rotation.x = s > 0 ? Math.PI / 2 + 0.55 : -Math.PI / 2 - 0.55; sl.rotation.order = 'XYZ'; sl.rotation.y = s > 0 ? Math.PI : 0; });
      const strips = [bx(13.6, 0.02, 0.12, 0, 2.3, -0.5), bx(13.6, 0.02, 0.12, 0, 2.3, 0.5)]; merged(strips, emis(0xeaf2ff, 1.8));
      const vents = []; for (let x = -6.4; x <= 6.4; x += 1.6) { vents.push(bx(0.5, 0.02, 0.22, x, 2.31, 0)); for (let k = -2; k <= 2; k++) vents.push(bx(0.5, 0.024, 0.01, x, 2.305, k * 0.04)); } merged(vents, black);
      const cams = []; [[-6.6, 2.2, -0.6], [6.6, 2.2, 0.6]].forEach(([x, y, z]) => { const g = new THREE.Group(); g.position.set(x, y, z); root.add(g); put(new THREE.BoxGeometry(0.1, 0.07, 0.1), metal, 0, 0, 0, g); put(new THREE.SphereGeometry(0.05, 12, 8), black, 0, -0.05, 0, g); put(new THREE.CircleGeometry(0.012, 8), emis(0xff2a1a, 1.5), 0.04, -0.05, 0.02, g); }); }
    // testeros con la puerta de intercomunicación
    [-1, 1].forEach((s) => { const e = put(new THREE.PlaneGeometry(2.7, 2.35), pbrM(lamT), 7 * s, 1.175, 0); e.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
      const [k, g] = cv(256, 512); g.fillStyle = '#9a968a'; g.fillRect(0, 0, 256, 512); g.fillStyle = '#14161a'; g.fillRect(40, 90, 176, 220); g.strokeStyle = '#4a4740'; g.lineWidth = 6; g.strokeRect(14, 14, 228, 484); g.fillStyle = '#2a2b2e'; g.fillRect(222, 270, 10, 60);
      const d = put(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshStandardMaterial({ map: tx(k), roughness: 0.5 }), 6.97 * s, 1.0, 0); d.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; });

    /* ---------- laterales: panel laminado, ventanas con luces que pasan, puertas ---------- */
    const winX = [[-5.85, 1.7], [-2.2, 2.0], [0, 1.8], [2.2, 2.0], [5.85, 1.7]], doorX = [-4.0, 4.0];
    const outT = [];
    [-1, 1].forEach((s) => {
      const zw = 1.34 * s, rot = s > 0 ? Math.PI : 0;
      const wall = put(new THREE.PlaneGeometry(14, 0.95), pbrM(lamT), 0, 0.475, zw); wall.rotation.y = rot;
      const pil = []; const edges = [-7]; winX.forEach(([c, w]) => { edges.push(c - w / 2, c + w / 2); }); edges.push(7);
      for (let i = 0; i < edges.length; i += 2) { const a = edges[i], b = edges[i + 1]; if (b - a > 0.02) pil.push(new THREE.BoxGeometry(b - a, 1.4, 0.04).translate((a + b) / 2, 1.65, zw)); }
      merged(pil, whiteM);
      const fr = []; winX.forEach(([c, w]) => { fr.push(bx(w + 0.08, 0.05, 0.07, c, 0.97, zw), bx(w + 0.08, 0.05, 0.07, c, 2.03, zw), bx(0.05, 1.12, 0.07, c - w / 2, 1.5, zw), bx(0.05, 1.12, 0.07, c + w / 2, 1.5, zw)); }); merged(fr, frameM);
      // exterior: tiras de luz que pasan (textura que se desplaza)
      const [oc, g] = cv(1024, 128); g.fillStyle = '#030406'; g.fillRect(0, 0, 1024, 128); const rr = Q.rng(31 + s); for (let x = 0; x < 1024; x += 256) { g.fillStyle = 'rgba(40,52,70,.10)'; g.fillRect(x + rr() * 40, 0, 3, 128); }   // túnel: negro, con un brillo apenas perceptible de vez en cuando
      const ot = tx(oc); ot.wrapS = THREE.RepeatWrapping; ot.repeat.set(3, 1); outT.push(ot);
      const outs = put(new THREE.PlaneGeometry(14, 1.12), new THREE.MeshBasicMaterial({ map: ot, toneMapped: false }), 0, 1.5, 1.62 * s); outs.rotation.y = rot;
      const gl = put(new THREE.PlaneGeometry(14, 1.12), new THREE.MeshStandardMaterial({ color: 0x8aa0aa, transparent: true, opacity: 0.1, roughness: 0.03, metalness: 0.4, depthWrite: false }), 0, 1.5, 1.335 * s); gl.rotation.y = rot; tag(gl, 'ventana');
      // puertas dobles con ventanilla, juntas de goma, botón y franja amarilla en el suelo
      doorX.forEach((dx) => {
        const [k, c2] = cv(256, 512); c2.fillStyle = '#b9b5a8'; c2.fillRect(0, 0, 256, 512); c2.fillStyle = '#16181c'; c2.fillRect(34, 70, 188, 230); c2.strokeStyle = '#3a3832'; c2.lineWidth = 5; c2.strokeRect(10, 10, 236, 492); c2.beginPath(); c2.moveTo(128, 10); c2.lineTo(128, 502); c2.stroke();
        c2.fillStyle = '#2a2b2e'; c2.fillRect(108, 280, 7, 60); c2.fillRect(141, 280, 7, 60); c2.fillStyle = '#e0561b'; c2.fillRect(10, 440, 236, 14); c2.fillStyle = '#6b2a7a'; c2.font = 'italic 700 22px Arial'; c2.fillText('renfe', 150, 410);
        const d = put(new THREE.PlaneGeometry(1.3, 2.1), new THREE.MeshStandardMaterial({ map: tx(k), roughness: 0.45, metalness: 0.2 }), dx, 1.05, 1.33 * s); d.rotation.y = rot; tag(d, 'puertas');
        put(new THREE.PlaneGeometry(1.3, 0.34), (() => { const [k2, g2] = cv(512, 128); g2.fillStyle = '#0a0705'; g2.fillRect(0, 0, 512, 128); g2.fillStyle = '#ffa526'; g2.font = '700 40px Consolas'; g2.textAlign = 'center'; g2.fillText('PRÓXIMA: N. MINISTERIOS', 256, 54); g2.font = '700 34px Consolas'; g2.fillStyle = '#9fe07a'; g2.fillText('C-2 · 07:20', 256, 106); return new THREE.MeshBasicMaterial({ map: tx(k2), toneMapped: false }); })(), dx, 2.17, 1.3 * s).rotation.y = rot;
        const sf = put(new THREE.PlaneGeometry(1.3, 0.14), (() => { const [k3, g3] = cv(256, 32); for (let i = 0; i < 16; i++) { g3.fillStyle = i % 2 ? '#c9b227' : '#18181a'; g3.fillRect(i * 16, 0, 16, 32); } return new THREE.MeshStandardMaterial({ map: tx(k3), roughness: 0.6 }); })(), dx, 0.005, 1.2 * s); sf.rotation.x = -Math.PI / 2;
        put(new THREE.BoxGeometry(0.11, 0.11, 0.03), std(0x1d6b3a, 0.4), dx + 0.78, 1.2, 1.32 * s);
      });
      // mapa de línea sobre las ventanas
      { const [k, g] = cv(2048, 96); g.fillStyle = '#101214'; g.fillRect(0, 0, 2048, 96); g.strokeStyle = '#a3342a'; g.lineWidth = 10; g.beginPath(); g.moveTo(60, 56); g.lineTo(1988, 56); g.stroke();
        ['Alcalá', 'Vicálvaro', 'Vallecas', 'Entrevías', 'Atocha', 'Recoletos', 'N. Ministerios', 'Chamartín'].forEach((n, i) => { const x = 110 + i * 260; g.fillStyle = i === 3 ? '#e8a23a' : '#d6d0c2'; g.beginPath(); g.arc(x, 56, i === 3 ? 12 : 9, 0, R2); g.fill(); g.fillStyle = '#b8b2a4'; g.font = '24px Arial'; g.textAlign = 'center'; g.fillText(n, x, 28); });
        put(new THREE.PlaneGeometry(12.5, 0.16), new THREE.MeshStandardMaterial({ map: tx(k), emissive: 0x333333, emissiveMap: tx(k), roughness: 0.5 }), 0, 2.15, 1.3 * s).rotation.y = rot; }
    });
    { let cl = 1; try { cl = getClue ? getClue() : 1; } catch (e) { }
      const poster = put(new THREE.PlaneGeometry(0.4, 0.56), new THREE.MeshStandardMaterial({ map: tx(Q.drawWanted(Q.wantedStage(cl))), roughness: 0.9 }), -0.6, 1.5, -1.3); tag(poster, 'cartel'); W.actRoots.push(poster); }
    W.tick.push((dt, t) => { outT.forEach((o, i) => { o.offset.x = (i ? -1 : 1) * t * 0.12; }); flick.forEach((l) => { l.intensity = 0; }); W.sway.roll = Math.sin(t * 1.15) * 0.005 + Math.sin(t * 3.7) * 0.0018; W.sway.y = Math.sin(t * 2.4) * 0.01; });

    /* ---------- asientos de tela con reposacabezas, barras, asas colgantes y extintor ---------- */
    { const cush = [], back = [], frame = [];
      [-1, 1].forEach((s) => { [[-3.15, -0.25], [0.25, 3.15]].forEach(([a, b]) => { for (let x = a + 0.25; x < b; x += 0.5) {
        cush.push(bx(0.46, 0.1, 0.5, x, 0.46, 1.1 * s)); const bk = bx(0.46, 0.55, 0.1, x, 0.8, 1.3 * s); bk.rotateX(0); back.push(bk); back.push(bx(0.34, 0.16, 0.08, x, 1.2, 1.31 * s)); frame.push(bx(0.46, 0.38, 0.45, x, 0.19, 1.1 * s)); }
        frame.push(bx(0.04, 0.2, 0.5, a + 0.02, 0.62, 1.1 * s), bx(0.04, 0.2, 0.5, b - 0.02, 0.62, 1.1 * s)); }); });
      merged(cush, pbrM(fabricT)); merged(back, pbrM(fabricT)); merged(frame, std(0x1e2022, 0.6, { metalness: 0.3 })); }
    { const poles = [], rails = [], loops = [];
      [-3.1, -0.1, 3.1].forEach((x) => [-0.2, 0.55].forEach((z) => poles.push(cy(0.019, 0.019, 2.3, x, 1.15, z, 'y', 10))));
      [-0.6, 0.6].forEach((z) => rails.push(cy(0.015, 0.015, 13.6, 0, 2.1, z, 'x', 8)));
      for (let x = -6.5; x <= 6.5; x += 0.55) [-0.6, 0.6].forEach((z) => { const t = new THREE.TorusGeometry(0.07, 0.011, 6, 12); t.translate(x, 1.95, z); loops.push(t); poles.push(cy(0.006, 0.006, 0.08, x, 2.06, z, 'y', 5)); });
      merged(poles, steel); merged(rails, steel); merged(loops, std(0x1b1b1d, 0.7)); }
    { const g = new THREE.Group(); g.position.set(-5.2, 0, 1.28); root.add(g); put(new THREE.BoxGeometry(0.4, 0.62, 0.18), std(0x8c2a22, 0.45), 0, 1.1, 0, g); put(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 14), std(0xa02a20, 0.35, { metalness: 0.5 }), 0, 1.1, -0.04, g); }
    { const e = bx(0.16, 0.2, 0.06, 4.9, 1.5, 1.31); merged([e], std(0xa3342a, 0.4)); }

    /* ---------- multitud apretada (módulo compartido) ---------- */
    { const spots = [];
      for (let x = -6.6; x <= 6.6; x += 0.5) for (let z = -0.8; z <= 0.85; z += 0.5) {
        if (Math.hypot(x - W.spawn[0], z - W.spawn[1]) < 0.62 || Math.hypot(x + 0.45, z) < 0.45 || (x > -2.2 && x < -0.8 && z < 0.2)) continue;       // hueco del protagonista y de su vecino
        if (rnd() < 0.88) spots.push([x + (rnd() - 0.5) * 0.14, z + (rnd() - 0.5) * 0.14]);
      }
      const C = Q.buildCrowd(spots, { seed: 303, yaw: (r) => r() * Math.PI * 2 }); root.add(C.group); C.obst.forEach((o) => W.obst.push(o)); W.crowdCount = C.count;
      W.tick.push((dt, t) => { C.group.position.x = Math.sin(t * 1.1) * 0.012; C.group.position.z = Math.sin(t * 0.8 + 1) * 0.008; }); }

    /* ---------- el vecino: pálido, sudoroso, de espaldas y pegadísimo ---------- */
    { const g = new THREE.Group(); g.position.set(-0.45, 0, 0.0); root.add(g);
      const heads = [], bodies = []; const h = ellipsoid(0.28, 0.31, 0.25, 22).translate(0, 1.45, 0); paint(h, 0.55, 0.62, 0.54); heads.push(h);
      const b = slab(1.02, 0.235, 0.255, 0.62).translate(0, 0.14, 0); paint(b, 0.09, 0.1, 0.17); bodies.push(b);
      const bp = ellipsoid(0.19, 0.27, 0.1, 14).translate(0, 0.78, 0.26); paint(bp, 0.1, 0.09, 0.08); bodies.push(bp);
      const hair = ellipsoid(0.285, 0.2, 0.26, 18).translate(0, 1.55, 0.02); paint(hair, 0.06, 0.05, 0.05); heads.push(hair);
      const geo = MG.mergeBufferGeometries([].concat(heads, bodies).map((q) => { const n = new THREE.BufferGeometry(); n.setAttribute('position', q.attributes.position); n.setAttribute('normal', q.attributes.normal); n.setAttribute('color', q.attributes.color); n.setIndex(q.index); return n; }));
      put(geo, crowdMat(), 0, 0, 0, g); put(geo, inkMat(0.018), 0, 0, 0, g);
      [[-0.1, 1.55, 0.2], [0.12, 1.4, 0.23], [0.02, 1.3, 0.25]].forEach(([x, y, z]) => put(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: 0xa8c8d8, roughness: 0.1, metalness: 0.2 }), x, y, z, g));      // gotas de sudor
      g.rotation.y = Math.PI; tag(g, 'vecino'); W.obst.push({ minX: -0.73, maxX: -0.17, minZ: -0.28, maxZ: 0.28 }); }

    /* ---------- interacciones ---------- */
    W.acts.movil = { label: 'Sacar el móvil: leer tu currículum', stand: [-0.95, 0.35], look: [-0.95, 0.6, 0.9], enabled: () => true, run: async (api) => {
      await api.say('Es lo único que puedes sostener sin tocar a nadie. Así que repasas tu propio currículum, como quien relee su propio horóscopo.'); await Q.showFicha(); } };
    W.acts.ventana = { label: 'Mirar por la ventana', stand: [-0.95, 0.35], look: [-1.6, 1.55, -1.34], enabled: () => true, run: async (api) => {
      await api.say('Madrid pasa en rayas de luz. En las vías, la «velocidad media» y la «velocidad percibida» son dos variables incompatibles.'); } };
    W.acts.cartel = { label: 'Leer el cartel de «se busca»', stand: [-0.6, 0.2], look: [-0.6, 1.5, -1.3], enabled: () => true, run: async (api) => {
      const st = Q.wantedStage(((window.Sound && Sound.clue) || 1)); W.pistas++;
      await api.say([['Pegado con celo en el cristal: «SE BUSCA». Un gato negro llamado Prima. Se asusta con facilidad. Tiene toda tu simpatía.'],
        ['Otro cartel de «SE BUSCA». Esta vez, una silueta sin cara y un interrogante. «Sin identificar. Puede ser cualquiera.»', { text: 'No dice qué ha hecho. Eso es lo inquietante.', think: true }],
        ['«SE BUSCA». La cara te suena: perilla, bigote, un aire de caña a deshoras. Es el de siempre.', { text: 'El Grandullón. Es el Grandullón en versión cartel de pared. ¿Qué ha hecho el Grandullón?', think: true }],
        ['«SE BUSCA». Cabeza de cruz, mochila, prisa. Te reconoces antes de leerlo.', { text: 'Visto por última vez: hoy. Quien lo haya pegado sabe tu ruta.', think: true, block: true }]][st]); } };
    W.acts.vecino = { label: 'Notar a tu vecino', stand: [-0.95, 0.35], look: [-0.45, 1.45, 0.0], enabled: () => true, run: async (api) => {
      W.pistas++; await api.say(['El pelo de tu vecino está a dos centímetros de tu cara. No sabes su nombre, pero conoces su champú. Ya hay más intimidad en este vagón que en tu último comité.', { text: 'Está pálido, suda y respira raro. Será el madrugón. Seguro que es el madrugón.', think: true }]); } };
    W.acts.puertas = { label: 'Esperar a Nuevos Ministerios', stand: [-1.9, 0.35], look: [-4.0, 1.3, -1.34], enabled: () => true, run: async (api) => {
      await api.say('Las puertas se abren entre dos estornudos. Nuevos Ministerios. Sales empujado por una marea que sabe adónde va.'); W.exit = true; } };

    W.play = async (api) => {
      const { say, setTime, free } = api;
      setTime('07:20');
      await say(['Dentro. «Aplastado» es un verbo suave para esto. Respiras en tandas, por turnos con tu vecino.']);
      await free(1e9, 'M: sacar el móvil · mira por la ventana · mira a tu vecino · acércate a las puertas cuando quieras bajar', () => W.exit);
      setTime('07:55');
      return 'bajar';
    };
    return W;
  };
})();
