/* oficina.js — nivel 5: el interior de la aseguradora. Dos mundos: el vestíbulo (tornos, ascensor, cartel rojo sin letras) y la planta 4 (moqueta gris,
   cubículos, monitores de tubo, fluorescentes que zumban, un fondo que no acaba: guiños a las Backrooms). Sin marcas: el logotipo es una forma roja abstracta. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;
  const RED = 0x7c1219;

  Q.buildOficina = (renderer, envTex, kind, opts = {}) => {
    const planta = kind === 'planta', MX = -11.7, MZ = -9.0;   // tu mesa: la del fondo a la izquierda
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(planta ? 0x14150f : 0x1c1d20); scene.fog = new THREE.FogExp2(planta ? 0x1a1b14 : 0x202226, planta ? 0.05 : 0.04);
    if (envTex) scene.environment = envTex;
    const bounds = planta ? { minX: -13, maxX: 13, minZ: -11, maxZ: 11 } : { minX: -6.5, maxX: 6.5, minZ: -4.6, maxZ: 4.6 };
    const W = { scene, obst: [], tick: [], acts: {}, actRoots: [], bounds, spawn: planta ? [0, 8.8] : [0, 3.6], look: planta ? [0, 1.4, -4] : [0, 1.5, -4.5], exit: false, pistas: 0 };
    const root = new THREE.Group(); scene.add(root);
    const rnd = Q.rng(planta ? 5151 : 5050);
    const std = (color, rough = 0.85, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra));
    const emis = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });
    const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const put = (geo, m, x = 0, y = 0, z = 0, parent = root) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); parent.add(o); return o; };
    const merged = (parts, m, parent = root) => { const o = new THREE.Mesh(MG.mergeBufferGeometries(parts), m); parent.add(o); return o; };
    const cv = (w, h) => { const c = Q.cvs(w, h); return [c, c.getContext('2d')]; };
    const tag = (obj, id) => { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); W.actRoots.push(obj); };
    const box = (x, z, w, d) => W.obst.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });
    const hx = bounds.maxX - bounds.minX, hz = bounds.maxZ - bounds.minZ, cx = (bounds.maxX + bounds.minX) / 2, cz = (bounds.maxZ + bounds.minZ) / 2, H = planta ? 2.7 : 3.4;

    scene.add(new THREE.HemisphereLight(planta ? 0xb9b8a4 : 0xaab0b8, 0x181816, planta ? 0.62 : 0.7));

    /* ---------- suelo: moqueta gris (planta) o terrazo gris (vestíbulo) ---------- */
    { const t = Q.pbr(256, 256, (g, hg, rg, w, h) => {
        const r = Q.rng(11); g.fillStyle = planta ? '#6c6a5e' : '#74777a'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); rg.fillStyle = '#e0e0e0'; rg.fillRect(0, 0, w, h);
        for (let i = 0; i < 9000; i++) { const x = r() * w, y = r() * h, d = r() < 0.5; g.fillStyle = d ? `rgba(30,30,26,${r() * 0.35})` : `rgba(190,188,170,${r() * 0.25})`; g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2); hg.fillStyle = d ? 'rgba(40,40,40,.6)' : 'rgba(220,220,220,.5)'; hg.fillRect(x, y, 1, 1); }
        if (!planta) { g.strokeStyle = 'rgba(20,20,20,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); }
      }, { strength: planta ? 1.2 : 0.6, repeat: [hx / 2.4, hz / 2.4], rough: true });
      put(new THREE.PlaneGeometry(hx, hz), new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1 }), cx, 0, cz).rotation.x = -Math.PI / 2; }

    /* ---------- techo de placas con fluorescentes ---------- */
    { const [c, g] = cv(128, 128); g.fillStyle = '#8c8a7c'; g.fillRect(0, 0, 128, 128); const r = Q.rng(7); for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(40,40,34,${r() * 0.28})`; g.fillRect(r() * 128, r() * 128, 1 + r() * 2, 1 + r() * 2); } g.strokeStyle = 'rgba(30,30,28,.7)'; g.lineWidth = 3; g.strokeRect(0, 0, 128, 128);
      const tex = Q.toTex(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(hx / 1.2, hz / 1.2);
      put(new THREE.PlaneGeometry(hx, hz), std(0xffffff, 1, { map: tex }), cx, H, cz).rotation.x = Math.PI / 2; }
    const panels = [], panelDark = [], lights = [];
    const stepX = planta ? 4.8 : 3.6, stepZ = planta ? 3.6 : 3.2;
    for (let x = bounds.minX + stepX / 2; x < bounds.maxX; x += stepX) for (let z = bounds.minZ + stepZ / 2; z < bounds.maxZ; z += stepZ) {
      const dead = planta && rnd() < 0.18; (dead ? panelDark : panels).push(bx(1.2, 0.03, 0.6, x, H - 0.02, z));
      if (!dead && planta && lights.length < 5 && Math.abs(x) < 8 && Math.abs(z - 2) < 8 && rnd() < 0.4) lights.push([x, z]);
    }
    if (panels.length) merged(panels, emis(planta ? 0xe9e8cc : 0xdfe6ee, 1.55));
    if (panelDark.length) merged(panelDark, emis(0x3a3a34, 1));
    if (!planta) lights.push([-2.2, -1], [2.2, 0.6]);
    lights.forEach(([x, z], i) => { const l = new THREE.PointLight(planta ? 0xeceacb : 0xdfe6ee, planta ? 0.8 : 0.9, 11, 2); l.position.set(x, H - 0.4, z); scene.add(l);
      if (i === 0) W.tick.push((dt, t) => { l.intensity = (planta ? 0.8 : 0.9) * (Math.sin(t * 41) * Math.sin(t * 6.3) > 0.93 ? 0.25 : 1); }); });

    /* ---------- paredes ---------- */
    const wallMat = std(planta ? 0x8a887a : 0x7e8286, 0.95);
    { const ws = [bx(hx, H, 0.2, cx, H / 2, bounds.minZ - 0.1), bx(hx, H, 0.2, cx, H / 2, bounds.maxZ + 0.1), bx(0.2, H, hz, bounds.minX - 0.1, H / 2, cz), bx(0.2, H, hz, bounds.maxX + 0.1, H / 2, cz)];
      merged(ws, wallMat); merged([bx(hx, 0.12, 0.04, cx, 0.06, bounds.maxZ - 0.02), bx(hx, 0.12, 0.04, cx, 0.06, bounds.minZ + 0.02)], std(0x2a2a28, 0.7)); }

    /* ---------- logotipo rojo, abstracto y sin letras ---------- */
    const logo = (x, y, z, ry, s) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; root.add(g);
      put(new THREE.BoxGeometry(1.5 * s, 0.9 * s, 0.05), std(0x7c1219, 0.6), 0, 0, 0, g);
      put(new THREE.RingGeometry(0.22 * s, 0.34 * s, 28), std(0xe7e4dc, 0.6, { side: THREE.DoubleSide }), -0.2 * s, 0, 0.03, g);
      put(new THREE.PlaneGeometry(0.5 * s, 0.1 * s), std(0xe7e4dc, 0.6, { side: THREE.DoubleSide }), 0.35 * s, 0, 0.03, g); return g; };

    if (!planta) {
      /* ---------- VESTÍBULO ---------- */
      logo(0, 2.4, bounds.minZ + 0.08, 0, 1.6);
      // mostrador de recepción, vacío
      { const g = new THREE.Group(); g.position.set(-4.2, 0, -1.0); root.add(g); merged([bx(0.7, 1.05, 3.2, 0, 0.52, 0), bx(0.8, 0.06, 3.4, 0, 1.08, 0)], std(0x3a3b3d, 0.5, { metalness: 0.2 }), g);
        put(new THREE.BoxGeometry(0.3, 0.22, 0.3), std(0xb8b4a4, 0.7), -0.1, 1.22, 0.7, g); tag(g, 'recepcion'); box(-4.2, -1.0, 0.9, 3.4); }
      // tornos
      { const g = new THREE.Group(); root.add(g); const parts = [], glass = []; [-2.4, -0.8, 0.8].forEach((x) => { parts.push(bx(0.2, 1.0, 1.1, x - 0.2, 0.5, -1.4), bx(0.2, 1.0, 1.1, x + 0.2, 0.5, -1.4)); glass.push(bx(0.02, 0.8, 0.7, x - 0.1, 1.3, -1.4)); box(x - 0.2, -1.4, 0.3, 1.2); box(x + 0.2, -1.4, 0.3, 1.2); });
        merged(parts, std(0x2d2f31, 0.45, { metalness: 0.5 }), g); merged(glass, new THREE.MeshStandardMaterial({ color: 0x9fb0bb, transparent: true, opacity: 0.3, roughness: 0.1 }), g);
        [-2.4, -0.8, 0.8].forEach((x) => put(new THREE.BoxGeometry(0.16, 0.04, 0.3), emis(0xc8383e, 1.6), x - 0.2, 1.03, -1.0, g)); tag(g, 'torno'); }
      // ascensores
      { const g = new THREE.Group(); g.position.set(3.6, 0, bounds.minZ + 0.06); root.add(g);
        merged([bx(1.5, 2.3, 0.08, -0.85, 1.15, 0), bx(1.5, 2.3, 0.08, 0.85, 1.15, 0)], std(0x7f858a, 0.28, { metalness: 0.9 }), g);
        put(new THREE.BoxGeometry(0.04, 2.3, 0.09), std(0x1a1a1a), 0, 1.15, 0.01, g); put(new THREE.BoxGeometry(0.16, 0.34, 0.06), std(0x2a2a2a), 2.0, 1.3, 0.03, g);
        put(new THREE.BoxGeometry(0.06, 0.06, 0.02), emis(0xffb040, 2), 2.0, 1.34, 0.07, g); tag(g, 'ascensor'); }
      // planta artificial y banco
      { const g = new THREE.Group(); g.position.set(5.5, 0, -3.6); root.add(g); put(new THREE.CylinderGeometry(0.3, 0.24, 0.5, 10), std(0x303030, 0.6), 0, 0.25, 0, g);
        const lv = []; for (let i = 0; i < 9; i++) { const a = i * 0.7, q = new THREE.ConeGeometry(0.1, 0.9, 5); q.translate(0, 0.45, 0); q.rotateZ(0.45); q.rotateY(a); q.translate(0, 0.5, 0); lv.push(q); } merged(lv, std(0x35402e, 0.8), g); box(5.5, -3.6, 0.7, 0.7); }
    } else {
      /* ---------- PLANTA 4 ---------- */
      logo(-6, 2.0, bounds.minZ + 0.08, 0, 1.3); logo(5, 1.9, bounds.maxZ - 0.08, Math.PI, 1.0);
      const cubs = [];
      const wall = [], desk = [], mon = [], scr = [], chair = [], paper = [];
      const cub = (x, z, ry, mine) => { const c = Math.cos(ry), s = Math.sin(ry), P = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
        const part = (lx, lz, w, d) => { const [px, pz] = P(lx, lz), q = bx(w, 1.5, d, 0, 0.75, 0); q.rotateY(ry); q.translate(px, 0, pz); wall.push(q); };
        part(-1.1, 0, 0.06, 2.2); part(0, -1.1, 2.2, 0.06); if (!mine) part(1.1, 0, 0.06, 2.2);
        const [dx, dz] = P(0, -0.8), d = bx(1.8, 0.05, 0.7, 0, 0.74, 0); d.rotateY(ry); d.translate(dx, 0, dz); desk.push(d);
        const m = bx(0.42, 0.36, 0.4, 0, 0.94, 0); m.rotateY(ry); const [mx, mz] = P(mine ? -0.4 : 0.1, -0.85); m.translate(mx, 0, mz); mon.push(m);
        const sc = bx(0.34, 0.27, 0.02, 0, 0.95, 0.205); sc.rotateY(ry); sc.translate(mx, 0, mz); scr.push(sc);
        if (mine) { const m2 = bx(0.42, 0.36, 0.4, 0, 0.94, 0); m2.rotateY(ry); const [m2x, m2z] = P(0.4, -0.85); m2.translate(m2x, 0, m2z); mon.push(m2); const s2 = bx(0.34, 0.27, 0.02, 0, 0.95, 0.205); s2.rotateY(ry); s2.translate(m2x, 0, m2z); scr.push(s2); }
        const [chx, chz] = P(0.1, -0.1); const ch = bx(0.5, 0.06, 0.5, 0, 0.5, 0); ch.rotateY(ry + (rnd() - 0.5) * 0.9); ch.translate(chx, 0, chz); chair.push(ch); const bk = bx(0.46, 0.5, 0.06, 0, 0.82, 0.22); bk.rotateY(ry + 0.2); bk.translate(chx, 0, chz); chair.push(bk);
        const [px2, pz2] = P(-0.5 + rnd() * 0.3, -0.7); const pp = bx(0.28, 0.01, 0.2, 0, 0.77, 0); pp.rotateY(rnd() * 3); pp.translate(px2, 0, pz2); paper.push(pp);
        box(x, z, 2.3, 2.3); };
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const x = -7.8 + i * 4.2, z = -8 + j * 3.4; if (i === 2 && j === 3) continue; if (i === 4 && j === 0) continue; cub(x, z, (i + j) % 2 ? 0 : Math.PI, false); cubs.push([x, z, (i + j) % 2 ? 0 : Math.PI]); }
      cub(MX, MZ, 0, true);                                                           // tu mesa: dos monitores
      merged(wall, std(0x9a9786, 0.95)); merged(desk, std(0xb4b09c, 0.7)); merged(mon, std(0xc8c2a8, 0.6)); merged(scr, new THREE.MeshStandardMaterial({ color: 0x0a0c0b, roughness: 0.25, metalness: 0.2, emissive: 0x0b140f })); merged(chair, std(0x1a2236, 0.85)); merged(paper, std(0xdedacc, 0.9));
      // pantallas de tu mesa: dos ventanas con luz propia
      { const [c, g] = cv(128, 96); g.fillStyle = '#0c1a14'; g.fillRect(0, 0, 128, 96); g.fillStyle = '#5ce0a0'; for (let i = 0; i < 8; i++) g.fillRect(8, 10 + i * 10, 20 + ((i * 37) % 80), 3); const t = Q.toTex(c);
        [-0.4, 0.4].forEach((dx) => { put(new THREE.PlaneGeometry(0.33, 0.26), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }), MX + dx, 0.95, MZ - 0.85 + 0.215); }); }
      // ascensor de vuelta, en la pared de atrás junto a donde apareces
      { const g = new THREE.Group(); g.position.set(0, 0, bounds.maxZ - 0.06); g.rotation.y = Math.PI; root.add(g); merged([bx(1.5, 2.3, 0.08, -0.85, 1.15, 0), bx(1.5, 2.3, 0.08, 0.85, 1.15, 0)], std(0x7f858a, 0.28, { metalness: 0.9 }), g); put(new THREE.BoxGeometry(0.04, 2.3, 0.09), std(0x1a1a1a), 0, 1.15, 0.01, g); tag(g, 'salir'); }
      // compañeros: aparecen cuando te levantas (unos de pie en sus puestos, otros paseando por los pasillos)
      W.gente = new THREE.Group(); W.gente.visible = false; root.add(W.gente); W.walkers = [];
      { const spots = cubs.filter((c, i) => i % 3 !== 1).map(([x, z, ry]) => [x + (ry ? 0.1 : -0.1), z + (ry ? -0.35 : 0.35)]); const C = Q.buildCrowd(spots, { seed: 91, yaw: (r) => r() * 6.28 }); W.gente.add(C.group); C.obst.forEach((q) => W.obst.push(q));
        [-5.7, -1.5, 2.7, 6.9].forEach((ax, k) => { const w = Q.buildCrowd([[0, 0]], { seed: 120 + k, yaw: () => 0 }); w.group.position.set(ax, 0, -9 + k * 3); W.gente.add(w.group); W.walkers.push({ g: w.group, v: 0.9 + k * 0.12, dir: k % 2 ? 1 : -1 }); }); }
      W.tick.push((dt) => { if (!W.gente.visible) return; W.walkers.forEach((w) => { w.g.position.z += w.dir * w.v * dt; if (w.g.position.z > 3.2) w.dir = -1; if (w.g.position.z < -9.6) w.dir = 1; w.g.rotation.y = w.dir > 0 ? 0 : Math.PI; }); });
      // la bacteria
      { const mon = Q.buildBacteria(); mon.group.visible = false; mon.group.position.set(6, 0, 10.4); root.add(mon.group); W.mon = mon;
        const st = W.chase = { on: false, t: 0, ng: 0, ns: 0, surge: 0, nextSurge: 4 }, touch = 'ontouchstart' in window;
        W.tick.push((dt, t) => { if (!mon.group.visible) return; mon.update(t, st.on ? (st.surge > 0 ? 2.1 : 1.5) : 0.6); if (!st.on || !W.api || W.api.S.busy) return;
          const P = W.api.P; st.t += dt; if (st.t < 2.5) return;
          st.nextSurge -= dt; if (st.nextSurge <= 0) { st.surge = 0.9; st.nextSurge = 5 + Math.random() * 3; if (window.Sound && Sound.on) Sound.growl(1); } st.surge -= dt;                                  // embestidas: cada pocos segundos se lanza hacia ti
          const dx = P.x - mon.group.position.x, dz = P.z - mon.group.position.z, d = Math.hypot(dx, dz) || 1, v = ((touch ? 1.45 : 2.45) + Math.min(0.45, (st.t - 2.5) * 0.03)) * (st.surge > 0 ? 1.4 : 1);
          mon.group.position.x += dx / d * v * dt; mon.group.position.z += dz / d * v * dt; mon.group.rotation.y = Math.atan2(dx, dz);
          st.ng -= dt; st.ns -= dt; if (window.Sound && Sound.on) { if (st.ng <= 0) { Sound.growl(1 - Math.min(0.8, d / 16)); st.ng = 1.6 + d * 0.14; } if (st.ns <= 0) { Sound.scuttle(1 - Math.min(0.8, d / 16)); st.ns = 0.45; } }
          if (d < 0.95) { st.on = false; W.caught = true; } }); }
      // flecha roja hacia tu mesa
      let arrow = null, lab = null;
      W.showArrow = () => { arrow = document.createElement('div'); arrow.id = 'flecha'; arrow.innerHTML = '<svg viewBox="0 0 60 80" width="54" height="72"><path d="M30 2 L58 40 H40 V78 H20 V40 H2 Z" fill="#c4202c" stroke="#2a0508" stroke-width="3"/></svg><b></b>'; document.body.appendChild(arrow); lab = arrow.querySelector('b'); };
      W.hideArrow = () => { if (arrow) { arrow.remove(); arrow = null; } };
      W.tick.push(() => { if (!arrow || !W.api) return; const P = W.api.P, dx = MX - P.x, dz = MZ + 1 - P.z; let rel = Math.atan2(-dx, -dz) - P.yaw; rel = ((rel + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; arrow.firstChild.style.transform = 'rotate(' + (-rel) + 'rad)'; lab.textContent = Math.round(Math.hypot(dx, dz)) + ' m'; });
      // cocina: encimera con la cafetera
      { const g = new THREE.Group(); g.position.set(10.9, 0, 2.0); root.add(g); merged([bx(0.7, 0.9, 3.4, 0, 0.45, 0), bx(0.8, 0.05, 3.5, 0, 0.92, 0)], std(0xb9b6a6, 0.6), g);
        merged([bx(0.35, 0.5, 0.3, 0, 1.2, -0.4), bx(0.3, 0.08, 0.28, 0, 1.0, -0.4)], std(0x2a2a2a, 0.4, { metalness: 0.5 }), g); put(new THREE.BoxGeometry(0.04, 0.04, 0.02), emis(0xff4030, 2), 0.1, 1.35, -0.25, g);
        put(new THREE.BoxGeometry(0.12, 0.12, 0.12), std(0xdedacc, 0.5), 0.0, 1.0, 0.6, g); tag(g, 'cocina'); box(10.9, 2.0, 0.9, 3.6); }
      // reloj parado y puerta de salida de emergencia
      { const [c, g] = cv(128, 128); g.fillStyle = '#d6d2c4'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#222'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.moveTo(64, 64); g.lineTo(92, 64); g.stroke();
        const cl = put(new THREE.CircleGeometry(0.28, 24), new THREE.MeshBasicMaterial({ map: Q.toTex(c) }), 5, 2.0, bounds.minZ + 0.1); tag(cl, 'reloj'); }
      { const d = put(new THREE.BoxGeometry(1.0, 2.1, 0.06), std(0x2f3a30, 0.6), 11.0, 1.05, bounds.minZ + 0.05); put(new THREE.BoxGeometry(0.5, 0.2, 0.02), emis(0x36d070, 1.8), 11.0, 2.32, bounds.minZ + 0.1); tag(d, 'emergencia'); }
      // fondo oscuro que no acaba (pasillo a ninguna parte)
      put(new THREE.PlaneGeometry(7, 2.6), new THREE.MeshBasicMaterial({ color: 0x030303 }), -9.5, 1.3, bounds.minZ + 0.12);
    }

    /* ---------- interacciones ---------- */
    if (!planta) {
      W.acts.recepcion = { label: 'Mirar la recepción', stand: [-2.8, -0.2], look: [-4.2, 1.1, -1.0], enabled: () => true, run: async (api) => { await api.say(['Recepción vacía. Un timbre, un bolígrafo atado con una cadenita y una pegatina: «Vuelvo en 5 minutos». La pegatina está amarillenta.', { text: 'Esa pegatina lleva años aquí. Los cinco minutos, no sé.', think: true }]); } };
      W.acts.torno = { label: 'Pasar la tarjeta', stand: [-0.8, 0.2], look: [-0.8, 1.0, -1.4], enabled: () => true, run: async (api) => { await api.say(['Pitido corto, luz verde. El torno te deja pasar sin mirarte, como cada día.', 'Detrás de ti, el segundo torno se queda en rojo un rato. Nadie lo atiende.']); W.pistas++; } };
      W.acts.ascensor = { label: 'Llamar al ascensor', stand: [3.6, -3.0], look: [3.6, 1.4, bounds.minZ], enabled: () => true, run: async (api) => { await api.say(['Planta 4. El ascensor tarda lo suficiente para que pienses en todo lo que no has pensado.', 'Las puertas se abren con un suspiro de metal. Dentro, un espejo y una luz que no favorece a nadie.']); W.exit = true; } };
      W.play = async (api) => {
        const { say, free } = api; await say(['El vestíbulo. Terrazo gris, fluorescentes y un cartel rojo sin una letra. No hace falta una marca: lo sabes de memoria.', 'Aquí se cruza el torno de la entrada con el de la salida. Solo uno de los dos se usa de verdad.']);
        await free(1e9, 'Cruza el torno · llama al ascensor cuando quieras', () => W.exit); return 'subir'; };
    } else {
      W.acts.mesa = { label: 'Sentarte y trabajar', stand: [MX + 0.1, MZ + 1.5], look: [MX, 0.95, MZ - 0.85], enabled: () => !W.sat, run: async (api) => {
        W.sat = true; W.chase.on = false; W.mon.group.visible = false; W.hideArrow();
        await api.say(['Te dejas caer en la silla. El ruido se detiene de golpe, como si alguien hubiera bajado una palanca.', 'Las dos pantallas se encienden solas: a la izquierda el modelo de tarificación, a la derecha el triángulo de reservas.']);
        api.S.busy = true; const a = await Q.miniGLM(); api.S.busy = true; const b = await Q.miniReservas(); api.S.busy = true; api.S.mini = a.score + b.score; api.S.miniMax = a.max + b.max;
        await api.say(a.score + b.score >= a.max + b.max - 1 ? ['Las dos cuadran. Por un momento, la oficina entera te parece razonable.'] : ['Algo no cuadra, pero con suficiente formato nadie lo notará.']);
        let c = 'quedar'; while (c === 'quedar') { c = await api.choose([{ id: 'levantar', label: 'Levantarte', hint: 'Estirar las piernas y ver cómo está la planta' }, { id: 'quedar', label: 'Quedarte un minuto más', hint: 'Mirar la pantalla sin leerla' }], 'Has terminado por ahora'); if (c === 'quedar') await api.say('Un minuto más. La pantalla te devuelve la mirada.'); }
        W.gente.visible = true; W.up = true;
        await api.say(['Te levantas. La planta, que estaba vacía, ahora respira: teclados, un teléfono sin atender, alguien arrastra una silla.', { text: 'Han estado aquí todo el rato. O han vuelto cuando ya no hacía falta tenerles miedo.', think: true }]); } };
      W.acts.salir = { label: 'Bajar por el ascensor', stand: [0, 9.3], look: [0, 1.4, bounds.maxZ], enabled: () => W.up, run: async (api) => { await api.say('Pulsas el botón. Planta baja. Un café con Chelu te espera, o eso dice el móvil.'); W.exit = true; } };
      W.acts.cocina = { label: 'Ir a por un café', stand: [9.4, 2.0], look: [10.9, 1.2, 2.0], enabled: () => true, run: async (api) => { await api.say(['La cafetera hace un ruido de motor viejo y entrega algo marrón y caliente.', 'Sabe a deber algo. Aun así te lo bebes: es lo único de la planta que se calienta a propósito.']); W.cafe = true; } };
      W.acts.reloj = { label: 'Mirar el reloj', stand: [5, -9.4], look: [5, 2.0, bounds.minZ], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['El reloj marca las cuatro y cuarto. Hace un mes también marcaba las cuatro y cuarto.', { text: 'Aquí el tiempo no pasa. Se factura.', think: true }]); } };
      W.acts.emergencia = { label: 'Mirar la puerta de emergencia', stand: [10.4, -9.0], look: [11.0, 1.1, bounds.minZ], enabled: () => true, run: async (api) => { W.pistas++; await api.say(['Salida de emergencia. La barra antipánico tiene polvo. Nadie ha entrado ni salido por aquí en meses.', { text: 'Al otro lado de las cristaleras, el pasillo oscuro sigue otra veintena de metros más. Y luego otra.', think: true }]); } };
      W.play = async (api) => {
        W.api = api; const { say, free } = api;
        if (opts.retry) await say(['Otra vez. Las puertas se abren, el ruido ya viene detrás y tu mesa sigue al fondo a la izquierda. Corre.']); else await say(['Planta 4. Las puertas del ascensor se abren a una moqueta gris que huele a cable caliente.', 'Filas de cubículos, fluorescentes que zumban y, al fondo, una oscuridad más larga de lo que debería.', 'Tu mesa está al fondo, a la izquierda. Y detrás de ti, algo grande y negro acaba de salir del pasillo.']);
        W.mon.group.visible = true; W.chase.on = true; W.chase.t = 0; W.showArrow();
        await free(1e9, '¡CORRE! (Shift) · sigue la flecha roja hasta tu mesa, al fondo a la izquierda, y siéntate', () => W.up || W.caught);
        if (W.caught) { W.hideArrow(); if (window.Sound && Sound.on) Sound.growl(1.6); await say(['Notas algo frío y poligonal en los tobillos. Las patas se cruzan sobre ti como un alambre.', 'La moqueta te parece, por primera vez, cómoda.']); return 'atrapado'; }
        await free(1e9, 'Pasea por la planta · el ascensor, cuando quieras', () => W.exit); return 'listo'; };
    }
    function S_desc(api, n) { api.S.descuido = (api.S.descuido || 0) + n; }
    return W;
  };
})();
