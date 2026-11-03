/* room.js — el dormitorio con mucho detalle: materiales PBR con relieve, muebles biselados, objetos de uso diario. */
(() => {
  const Q = window.QX;
  const { mat, rbox, lathe, fold, cable, tex, art, rng, lerp, clamp } = Q;
  const W = 4.4, D = 3.6, H = 2.6;
  Q.ROOM = { W, D, H, minX: -W / 2, maxX: W / 2, minZ: -D / 2, maxZ: D / 2 };

  Q.buildRoom = (scene, { pr = 1, high = true } = {}) => {
    const R = { g: {}, ref: {}, obst: [], tick: [] };
    const rnd = rng(77);

    /* ---- utilidades de construcción ---- */
    function put(parent, geo, material, x = 0, y = 0, z = 0, o = {}) {
      const m = new THREE.Mesh(geo, material);
      m.position.set(x, y, z);
      if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz;
      if (o.s) m.scale.set(...o.s);
      m.castShadow = o.cast !== false; m.receiveShadow = o.recv !== false;
      parent.add(m); return m;
    }
    const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
    const std = (t, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1, color: 0xffffff }, extra));
    const emissive = (color, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), toneMapped: false });

    /* ---- materiales ---- */
    const T = {
      wood: tex.wood(3), paint: tex.paint([66, 82, 118], 5), paintCeil: tex.paint([120, 124, 138], 6),
      walnut: tex.veneer([78, 50, 30], 9), wardrobe: tex.veneer([96, 66, 42], 21), oak: tex.veneer([120, 88, 58], 31),
      duvet: tex.fabric([52, 70, 118], 7, 6), sheet: tex.fabric([188, 192, 205], 8, 8), pillow: tex.fabric([196, 200, 212], 9, 8),
      rug: tex.rug(11), leather: tex.leather([92, 58, 34], 13), cordura: tex.cordura([20, 22, 28], 15),
      curtain: tex.fabric([30, 44, 62], 17, 3), felt: tex.fabric([108, 112, 124], 19, 4),
    };
    T.wood.map.repeat.set(2.4, 2); T.wood.normalMap.repeat.set(2.4, 2); T.wood.roughnessMap.repeat.set(2.4, 2);
    [T.rug, T.duvet, T.sheet, T.pillow, T.curtain, T.felt, T.cordura, T.leather].forEach((t, i) => { const rep = [1, 9, 7, 6, 7, 5, 4, 3][i] || 1; [t.map, t.normalMap, t.roughnessMap].forEach(m => { if (m) { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.set(rep, rep); } }); });
    T.rug.map.repeat.set(1, 1); T.rug.normalMap.repeat.set(3, 3); T.rug.roughnessMap.repeat.set(3, 3);
    [T.walnut, T.wardrobe, T.oak].forEach(t => [t.map, t.normalMap, t.roughnessMap].forEach(m => { m.wrapS = m.wrapT = THREE.RepeatWrapping; m.repeat.set(1, 1); }));

    const M = {
      floor: std(T.wood, { roughness: 1, normalScale: new THREE.Vector2(1.3, 1.3) }),
      wall: std(T.paint, { normalScale: new THREE.Vector2(0.5, 0.5), envMapIntensity: 0.3 }),
      ceil: std(T.paintCeil, { normalScale: new THREE.Vector2(0.4, 0.4) }),
      trim: mat(0xcfd2da, 0.45), trimDark: mat(0x15181f, 0.5),
      walnut: std(T.walnut, { normalScale: new THREE.Vector2(0.9, 0.9) }), wardrobe: std(T.wardrobe), oak: std(T.oak),
      brass: mat(0xb08a3e, 0.28, 0.95), steel: mat(0x9aa0aa, 0.3, 0.9), black: mat(0x0b0c10, 0.5, 0.2),
      duvet: std(T.duvet, { normalScale: new THREE.Vector2(0.8, 0.8), side: THREE.DoubleSide }), sheet: std(T.sheet), pillow: std(T.pillow),
      rug: std(T.rug, { normalScale: new THREE.Vector2(1.2, 1.2) }), leather: std(T.leather), cordura: std(T.cordura),
      curtain: std(T.curtain, { side: THREE.DoubleSide, normalScale: new THREE.Vector2(0.5, 0.5) }), felt: std(T.felt),
      glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }),
      ceramic: mat(0xe8e4da, 0.25), white: mat(0xe9ebf0, 0.55),
    };

    /* ====================== Estructura ====================== */
    const floor = put(scene, new THREE.PlaneGeometry(W, D), M.floor, 0, 0, 0, { rx: -Math.PI / 2, cast: false });
    put(scene, new THREE.PlaneGeometry(W, D), M.ceil, 0, H, 0, { rx: Math.PI / 2, cast: false });
    const wt = 0.2;
    const wall = (w, h, d, x, y, z) => put(scene, new THREE.BoxGeometry(w, h, d), M.wall, x, y, z, { cast: true });
    wall(wt, H, D + 2 * wt, -W / 2 - wt / 2, H / 2, 0);          // oeste
    wall(wt, H, D + 2 * wt, W / 2 + wt / 2, H / 2, 0);           // este
    wall(W, H, wt, 0, H / 2, D / 2 + wt / 2);                    // sur
    wall(2.4, H, wt, -W / 2 + 1.2, H / 2, -D / 2 - wt / 2); wall(0.6, H, wt, 1.9, H / 2, -D / 2 - wt / 2);
    wall(1.4, 1.0, wt, 0.9, 0.5, -D / 2 - wt / 2); wall(1.4, 0.5, wt, 0.9, 2.35, -D / 2 - wt / 2);
    // rodapié y moldura de techo (perfil con bisel)
    const strip = (ax, len, x, y, z, h, d, m) => put(scene, rbox(ax === 'x' ? len : d, h, ax === 'x' ? d : len, 0.008), m, x, y, z, { cast: false });
    strip('x', W, 0, 0.08, D / 2 - 0.012, 0.16, 0.024, M.trim); strip('z', D, -W / 2 + 0.012, 0.08, 0, 0.16, 0.024, M.trim); strip('z', D, W / 2 - 0.012, 0.08, 0, 0.16, 0.024, M.trim);
    strip('x', 2.4, -1.0, 0.08, -D / 2 + 0.012, 0.16, 0.024, M.trim); strip('x', 0.6, 1.9, 0.08, -D / 2 + 0.012, 0.16, 0.024, M.trim);
    strip('x', W, 0, H - 0.05, D / 2 - 0.03, 0.1, 0.06, M.trim); strip('x', W, 0, H - 0.05, -D / 2 + 0.03, 0.1, 0.06, M.trim);
    strip('z', D, -W / 2 + 0.03, H - 0.05, 0, 0.1, 0.06, M.trim); strip('z', D, W / 2 - 0.03, H - 0.05, 0, 0.1, 0.06, M.trim);

    /* ====================== Ventana ====================== */
    const win = grp(scene, 0.9, 1.55, -D / 2);
    // cielo y ciudad de noche a través del cristal
    const night = Q.cvs(1024, 640), ng = night.getContext('2d'), nr = rng(3);
    { const gr = ng.createLinearGradient(0, 0, 0, 640); gr.addColorStop(0, '#071026'); gr.addColorStop(0.55, '#1d2548'); gr.addColorStop(0.85, '#6a3a3a'); gr.addColorStop(1, '#a8603a'); ng.fillStyle = gr; ng.fillRect(0, 0, 1024, 640);
      for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 16; i++) { const x = i * 70 - 20 + nr() * 30, h = 120 + nr() * (160 + layer * 40), w = 54 + nr() * 40, y = 640 - h - layer * 24;
        ng.fillStyle = `rgb(${10 + layer * 6},${12 + layer * 6},${26 + layer * 8})`; ng.fillRect(x, y, w, h + 40);
        for (let k = 0; k < 20 + layer * 6; k++) { if (nr() < 0.5) { ng.fillStyle = nr() < 0.7 ? '#ffd48a' : '#cfe8ff'; ng.globalAlpha = 0.4 + nr() * 0.6; ng.fillRect(x + 6 + nr() * (w - 14), y + 8 + nr() * (h - 16), 4, 5); } } ng.globalAlpha = 1; }
      ng.filter = 'blur(10px)'; for (let i = 0; i < 50; i++) { ng.fillStyle = `rgba(255,${160 + nr() * 60 | 0},80,${0.15 + nr() * 0.3})`; ng.beginPath(); ng.arc(nr() * 1024, 380 + nr() * 220, 6 + nr() * 10, 0, 7); ng.fill(); } ng.filter = 'none';
      const lamp = ng.createRadialGradient(760, 190, 0, 760, 190, 130); lamp.addColorStop(0, 'rgba(255,200,120,1)'); lamp.addColorStop(0.15, 'rgba(255,150,60,.8)'); lamp.addColorStop(1, 'rgba(255,120,40,0)'); ng.fillStyle = lamp; ng.fillRect(500, 0, 520, 420);
      ng.fillStyle = '#05070d'; ng.fillRect(742, 190, 36, 460); }
    put(win, new THREE.PlaneGeometry(1.4, 1.1), new THREE.MeshBasicMaterial({ map: Q.toTex(night), fog: false, toneMapped: false }), 0, 0, -0.14, { cast: false, recv: false });
    const fr = (w, h, x, y, z = 0.03, d = 0.07) => put(win, rbox(w, h, d, 0.008), M.trim, x, y, z, { cast: true });
    fr(1.46, 0.06, 0, 0.55); fr(1.46, 0.06, 0, -0.55); fr(0.06, 1.16, -0.7, 0); fr(0.06, 1.16, 0.7, 0); fr(0.035, 1.1, 0, 0, 0.03, 0.05); fr(1.4, 0.035, 0, 0.05, 0.03, 0.05);
    put(win, rbox(1.62, 0.04, 0.22, 0.01), M.trim, 0, -0.58, 0.1);                                                      // alféizar
    put(win, new THREE.PlaneGeometry(1.4, 1.1), new THREE.MeshPhysicalMaterial({ color: 0xaac4ff, roughness: 0.02, transparent: true, opacity: 0.07, clearcoat: 1 }), 0, 0, 0.0, { cast: false, recv: false });
    put(win, new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), M.brass, 0.05, 0.02, 0.07, { rz: Math.PI / 2 });         // cierre
    // cortinas con pliegues + barra
    const rod = put(win, new THREE.CylinderGeometry(0.014, 0.014, 2.1, 10), M.brass, 0, 0.75, 0.2, { rz: Math.PI / 2 });
    [-1.02, 1.02].forEach((x) => put(win, new THREE.SphereGeometry(0.03, 12, 10), M.brass, x, 0.75, 0.2));
    const folds = (u, v) => Math.sin(u * 46) * 0.035 + Math.sin(u * 19 + v * 3) * 0.015;
    const cL = put(win, fold(0.5, 1.75, 64, 8, folds), M.curtain, -0.62 - 0.12, -0.12, 0.21); const cR = put(win, fold(0.5, 1.75, 64, 8, folds), M.curtain, 0.62 + 0.12, -0.12, 0.21);
    put(win, fold(1.4, 1.1, 60, 6, (u) => Math.sin(u * 34) * 0.012), new THREE.MeshStandardMaterial({ color: 0xcfd6e6, roughness: 1, transparent: true, opacity: 0.06, side: THREE.DoubleSide }), 0, 0, 0.16, { cast: false });
    // radiador
    const rad = grp(scene, 0.9, 0.42, -D / 2 + 0.07);
    for (let i = 0; i < 16; i++) put(rad, rbox(0.045, 0.5, 0.075, 0.01), M.white, -0.6 + i * 0.08, 0, 0, { cast: false });
    put(rad, rbox(1.3, 0.04, 0.08, 0.01), M.white, 0, 0.27, 0, { cast: false });
    put(rad, new THREE.CylinderGeometry(0.012, 0.012, 0.06, 8), M.steel, 0.66, -0.2, 0, { rz: Math.PI / 2 });
    R.obst.push({ minX: 0.2, maxX: 1.6, minZ: -1.8, maxZ: -1.6 });
    // plantita en el alféizar
    const pot = grp(scene, 1.35, 1.0, -D / 2 + 0.15);
    put(pot, lathe([[0, 0], [0.05, 0], [0.065, 0.03], [0.075, 0.11], [0.082, 0.12], [0.07, 0.115], [0, 0.1]], 24), M.ceramic, 0, 0, 0);
    put(pot, new THREE.CircleGeometry(0.068, 18), mat(0x1a120c, 1), 0, 0.108, 0, { rx: -Math.PI / 2 });
    const leafG = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(0.03, 0.02, 0.05, 0.07, 0, 0.12); s.bezierCurveTo(-0.05, 0.07, -0.03, 0.02, 0, 0); return new THREE.ShapeGeometry(s, 8); })();
    const leafM = new THREE.MeshStandardMaterial({ color: 0x2f6a35, roughness: 0.55, side: THREE.DoubleSide });
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28, l = put(pot, leafG, leafM, Math.cos(a) * 0.025, 0.11 + (i % 4) * 0.012, Math.sin(a) * 0.025, { ry: -a + 1.57, rx: -0.55 - (i % 3) * 0.2, s: [1.3 + (i % 3) * 0.3, 1.6 + (i % 4) * 0.2, 1] }); l.rotation.order = 'YXZ'; }

    /* ====================== Cama ====================== */
    const bed = grp(scene); R.g.bed = bed;
    put(bed, rbox(1.46, 0.26, 2.04, 0.025), M.walnut, -1.5, 0.19, -0.78);                                                   // somier
    [[-2.17, -1.77], [-0.83, -1.77], [-2.17, 0.19], [-0.83, 0.19]].forEach(([x, z]) => put(bed, rbox(0.07, 0.14, 0.07, 0.01), M.walnut, x, 0.07, z));
    put(bed, rbox(1.54, 1.0, 0.07, 0.02), M.walnut, -1.5, 0.78, -D / 2 + 0.05);                                             // cabecero
    for (let i = 0; i < 5; i++) put(bed, rbox(0.22, 0.58, 0.015, 0.006), M.oak, -2.06 + i * 0.28 + 0.14, 0.82, -D / 2 + 0.095);
    put(bed, rbox(1.34, 0.2, 1.94, 0.06), std(T.sheet), -1.5, 0.43, -0.78);                                                  // colchón + sábana
    // nórdico arrugado con caída lateral
    const duvetGeo = (() => { const g = new THREE.PlaneGeometry(1.42, 1.34, 56, 52); g.rotateX(-Math.PI / 2); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), u = x / 1.42 * 2, v = z / 1.34 * 2; const edge = Math.max(Math.abs(u) - 0.86, 0) / 0.14, tail = Math.max(v - 0.86, 0) / 0.14;
        const wr = Math.sin(x * 11 + z * 5) * 0.012 + Math.sin(z * 17 - x * 3) * 0.011 + Math.sin(x * 29 + z * 13) * 0.004 + Math.max(0, 1 - Math.hypot(x + 0.22, z + 0.3) * 4) * 0.045;
        p.setY(i, wr - edge * edge * 0.18 - tail * tail * 0.16 + (v < -0.8 ? (v + 0.8) * 0.06 : 0)); }
      g.computeVertexNormals(); return g; })();
    put(bed, duvetGeo, M.duvet, -1.5, 0.58, -0.22);
    const fold1 = put(bed, new THREE.CylinderGeometry(0.05, 0.05, 1.34, 14), M.duvet, -1.5, 0.585, -0.9, { rz: Math.PI / 2 });                // doblez del nórdico
    [[-1.78, -1.58, 0.1], [-1.22, -1.55, -0.07]].forEach(([x, z, r]) => { const pg = rbox(0.6, 0.15, 0.38, 0.07, 5); const pp = pg.attributes.position; for (let i = 0; i < pp.count; i++) { pp.setY(i, pp.getY(i) + Math.sin(pp.getX(i) * 18 + pp.getZ(i) * 9) * 0.006 + Math.max(0, 1 - Math.hypot(pp.getX(i), pp.getZ(i)) * 4) * 0.025); } pg.computeVertexNormals(); put(bed, pg, M.pillow, x + 0.28, 0.6, z, { ry: r }); });
    R.obst.push({ minX: -2.2, maxX: -0.8, minZ: -1.8, maxZ: 0.2 });

    /* ====================== Mesilla y móvil ====================== */
    const ns = grp(scene); R.g.nightstand = ns;
    put(ns, rbox(0.42, 0.52, 0.42, 0.012), M.walnut, -0.55, 0.28, -1.6);
    put(ns, rbox(0.36, 0.2, 0.01, 0.004), M.oak, -0.55, 0.42, -1.388); put(ns, rbox(0.36, 0.2, 0.01, 0.004), M.oak, -0.55, 0.2, -1.388);
    put(ns, new THREE.SphereGeometry(0.014, 12, 10), M.brass, -0.55, 0.42, -1.376); put(ns, new THREE.SphereGeometry(0.014, 12, 10), M.brass, -0.55, 0.2, -1.376);
    [[-0.74, -1.79], [-0.36, -1.79], [-0.74, -1.41], [-0.36, -1.41]].forEach(([x, z]) => put(ns, new THREE.CylinderGeometry(0.014, 0.01, 0.04, 8), M.black, x, 0.0, z));
    R.obst.push({ minX: -0.78, maxX: -0.32, minZ: -1.8, maxZ: -1.38 });
    // móvil con pantalla emisiva
    const phone = grp(ns, -0.5, 0.548, -1.56); phone.rotation.y = 0.55;
    put(phone, rbox(0.074, 0.009, 0.152, 0.004), mat(0x0a0c11, 0.25, 0.7), 0, 0, 0);
    const phoneCanvas = Q.cvs(256, 512), phoneTex = Q.toTex(phoneCanvas, { aniso: 4 });
    const screen = put(phone, new THREE.PlaneGeometry(0.066, 0.143), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false }), 0, 0.0052, 0, { rx: -Math.PI / 2, cast: false, recv: false });
    R.ref.phone = phone; R.ref.phoneCanvas = phoneCanvas; R.ref.phoneTex = phoneTex;
    const cable1 = put(ns, cable([[-0.74, 0.88, -1.79], [-0.73, 0.7, -1.74], [-0.66, 0.55, -1.66], [-0.58, 0.5475, -1.6], [-0.54, 0.5475, -1.575]], 0.0035), mat(0xe8e8ee, 0.5), 0, 0, 0, { cast: false });
    put(scene, rbox(0.085, 0.085, 0.012, 0.004), M.white, -0.74, 0.88, -D / 2 + 0.008, { cast: false });                                                       // enchufe
    put(scene, rbox(0.055, 0.055, 0.004, 0.002), mat(0xcccfd6, 0.6), -0.74, 0.88, -D / 2 + 0.016, { cast: false });
    // lámpara de mesilla (apagada), vaso de agua, libro y gafas
    const lamp = grp(ns, -0.66, 0.54, -1.7);
    put(lamp, lathe([[0, 0], [0.05, 0], [0.058, 0.02], [0.04, 0.09], [0.02, 0.17], [0.012, 0.22]], 20), mat(0x2a3a4a, 0.25, 0.1), 0, 0, 0);
    put(lamp, lathe([[0.04, 0.2], [0.09, 0.2], [0.075, 0.33], [0.045, 0.33]], 24), new THREE.MeshStandardMaterial({ color: 0xcfc6ae, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x201808, emissiveIntensity: 0.4 }), 0, 0, 0);
    const glassWater = grp(ns, -0.4, 0.55, -1.68);
    put(glassWater, lathe([[0, 0], [0.032, 0], [0.036, 0.02], [0.04, 0.11], [0.038, 0.115], [0.034, 0.11], [0.03, 0.02], [0, 0.012]], 20), M.glass, 0, 0, 0, { cast: false });
    put(glassWater, lathe([[0, 0.012], [0.03, 0.02], [0.034, 0.075], [0, 0.075]], 20), new THREE.MeshPhysicalMaterial({ color: 0x9ec8ff, roughness: 0.05, transparent: true, opacity: 0.35 }), 0, 0, 0, { cast: false });
    put(ns, rbox(0.15, 0.025, 0.21, 0.004), mat(0x1c2a46, 0.7), -0.4, 0.5575, -1.5, { ry: 0.3 }); put(ns, rbox(0.145, 0.006, 0.205, 0.002), M.white, -0.4, 0.57, -1.5, { ry: 0.3 });
    const framePhoto = grp(ns, -0.57, 0.55, -1.74); framePhoto.rotation.y = 0.2;
    put(framePhoto, rbox(0.11, 0.14, 0.012, 0.004), M.brass, 0, 0.07, 0, { rx: -0.2 }); put(framePhoto, new THREE.PlaneGeometry(0.085, 0.115), new THREE.MeshStandardMaterial({ map: art.photo(), roughness: 0.4 }), 0, 0.07, 0.0075, { rx: -0.2, cast: false });
    const phoneLight = new THREE.PointLight(0x6fe8ff, 0.5, 2.2, 2); phoneLight.position.set(-0.5, 0.75, -1.5); scene.add(phoneLight); R.ref.phoneLight = phoneLight;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.glowTex, color: 0x6fe8ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6 })); halo.scale.set(0.8, 0.8, 1); halo.position.set(-0.5, 0.6, -1.56); scene.add(halo); R.ref.halo = halo;

    /* ====================== Armario ====================== */
    const wr = grp(scene); R.g.wardrobe = wr;
    put(wr, rbox(0.62, 2.22, 1.64, 0.012), mat(0x2a211a, 0.9), 1.89, 1.11, -0.2);                                              // carcasa interior
    put(wr, rbox(0.05, 2.22, 1.64, 0.01), M.wardrobe, 2.17, 1.11, -0.2);                                                       // trasera
    put(wr, rbox(0.62, 0.05, 1.64, 0.01), M.wardrobe, 1.89, 2.23, -0.2); put(wr, rbox(0.66, 0.08, 1.7, 0.012), M.wardrobe, 1.88, 2.27, -0.2);   // techo y cornisa
    put(wr, rbox(0.58, 0.04, 1.6, 0.008), M.wardrobe, 1.9, 1.5, -0.2);                                                          // balda
    put(wr, new THREE.CylinderGeometry(0.012, 0.012, 1.55, 10), M.steel, 1.9, 1.88, -0.2, { rx: Math.PI / 2 });                // barra
    const shirtMats = [0xe7e9ee, 0xcfd3dc, 0x1c1d24, 0x3a3f4a, 0x8d9ab4, 0xe2d8c8];
    for (let i = 0; i < 10; i++) { const z = -0.9 + i * 0.072 + (i > 3 ? 0.08 : 0); if (i === 4) continue;
      const hg = grp(wr, 1.9, 1.88, z); put(hg, new THREE.TorusGeometry(0.014, 0.003, 6, 12, 4.5), M.steel, 0, 0.035, 0, { cast: false });
      put(hg, rbox(0.012, 0.014, 0.4, 0.004), mat(0xb89a6a, 0.6), 0, 0.0, 0, { cast: false });
      const sh = new THREE.MeshStandardMaterial({ color: shirtMats[i % shirtMats.length], roughness: 0.85, side: THREE.DoubleSide, map: T.sheet.map, normalMap: T.sheet.normalMap });
      put(hg, fold(0.4, 0.64, 18, 12, (u, v) => Math.sin(v * 8 + u * 3) * 0.012 * (1 - v)), sh, 0, -0.34, 0, { ry: Math.PI / 2 }); }
    // la camisa azul de hoy y el pantalón gris
    const shirt = grp(wr, 1.9, 1.88, -0.62);
    const blue = new THREE.MeshStandardMaterial({ color: 0x2c5fb6, roughness: 0.8, side: THREE.DoubleSide, map: T.sheet.map, normalMap: T.sheet.normalMap });
    put(shirt, new THREE.TorusGeometry(0.014, 0.003, 6, 12, 4.5), M.steel, 0, 0.035, 0, { cast: false });
    put(shirt, fold(0.42, 0.66, 18, 12, (u, v) => Math.sin(v * 7 + u * 4) * 0.012 * (1 - v)), blue, 0, -0.34, 0, { ry: Math.PI / 2 });
    put(shirt, fold(0.64, 0.2, 18, 4, (u, v) => Math.sin(u * 6) * 0.01), blue, 0, -0.06, 0, { ry: Math.PI / 2, rz: 0 });
    const pantsG = grp(wr, 1.9, 1.88, -0.42);
    const grey = new THREE.MeshStandardMaterial({ color: 0x3b3f48, roughness: 0.9, side: THREE.DoubleSide });
    put(pantsG, new THREE.BoxGeometry(0.02, 0.5, 0.16), grey, 0, -0.35, 0.05); put(pantsG, new THREE.BoxGeometry(0.02, 0.5, 0.16), grey, 0, -0.35, -0.07);
    R.ref.shirt = shirt; R.ref.pants = pantsG;
    // puertas con paneles, tiradores y bisagras
    const doorN = grp(wr, 1.575, 1.12, -1.0); R.ref.doorN = doorN;
    put(doorN, rbox(0.03, 2.2, 0.8, 0.008), M.wardrobe, 0, 0, 0.4); put(doorN, rbox(0.012, 1.9, 0.6, 0.006), M.walnut, -0.014, 0, 0.4); put(doorN, rbox(0.012, 0.7, 0.5, 0.006), M.oak, -0.02, 0.55, 0.4); put(doorN, rbox(0.012, 0.7, 0.5, 0.006), M.oak, -0.02, -0.55, 0.4);
    put(doorN, new THREE.CylinderGeometry(0.009, 0.009, 0.34, 10), M.brass, -0.04, 0, 0.73); [0.12, -0.12].forEach(y => put(doorN, new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8), M.brass, -0.025, y, 0.73, { rz: Math.PI / 2 }));
    const doorS = grp(wr, 1.575, 1.12, 0.6);
    put(doorS, rbox(0.03, 2.2, 0.8, 0.008), M.wardrobe, 0, 0, -0.4); put(doorS, rbox(0.012, 1.9, 0.6, 0.006), M.walnut, -0.014, 0, -0.4); put(doorS, rbox(0.012, 0.7, 0.5, 0.006), M.oak, -0.02, 0.55, -0.4); put(doorS, rbox(0.012, 0.7, 0.5, 0.006), M.oak, -0.02, -0.55, -0.4);
    put(doorS, new THREE.CylinderGeometry(0.009, 0.009, 0.34, 10), M.brass, -0.04, 0, -0.73); [0.12, -0.12].forEach(y => put(doorS, new THREE.CylinderGeometry(0.008, 0.008, 0.04, 8), M.brass, -0.025, y, -0.73, { rz: Math.PI / 2 }));
    R.ref.wInside = new THREE.PointLight(0xdfe8ff, 0, 3.2, 2); R.ref.wInside.position.set(1.7, 2.0, -0.4); scene.add(R.ref.wInside);
    R.obst.push({ minX: 1.55, maxX: 2.2, minZ: -1.05, maxZ: 0.65 });
    // pesas y esterilla junto al armario
    const dumb = grp(scene, 1.35, 0, 1.55);
    [0, 0.2].forEach((dz) => { const d = grp(dumb, 0, 0.055, dz); put(d, new THREE.CylinderGeometry(0.012, 0.012, 0.15, 10), M.steel, 0, 0, 0, { rz: Math.PI / 2 }); [-0.075, 0.075].forEach(x => put(d, new THREE.CylinderGeometry(0.05, 0.05, 0.05, 6), M.black, x, 0, 0, { rz: Math.PI / 2 })); });
    const mat1 = put(scene, new THREE.CylinderGeometry(0.06, 0.06, 0.6, 18), mat(0x356a58, 0.85), 2.05, 0.06, 0.95, { rx: Math.PI / 2 });

    /* ====================== Espejo ====================== */
    const MR = { x: 2.19, y: 1.3, z: 1.2, w: 0.64, h: 1.54 }; Q.MIRROR = MR;
    const mscale = Math.min(pr, 1.25) * (high ? 1 : 0.7);
    const mirror = new THREE.Reflector(new THREE.PlaneGeometry(MR.w, MR.h), { clipBias: 0.003, textureWidth: Math.floor(560 * mscale), textureHeight: Math.floor(1280 * mscale), color: 0xb4bcc8 });
    mirror.position.set(MR.x - 0.003, MR.y, MR.z); mirror.rotation.y = -Math.PI / 2; scene.add(mirror); R.g.mirror = mirror;
    const mf = grp(scene); R.g.mirrorFrame = mf;
    const fx = MR.x + 0.008;
    put(mf, rbox(0.04, 0.09, MR.w + 0.2, 0.012), M.brass, fx, MR.y + MR.h / 2 + 0.045, MR.z); put(mf, rbox(0.04, 0.09, MR.w + 0.2, 0.012), M.brass, fx, MR.y - MR.h / 2 - 0.045, MR.z);
    put(mf, rbox(0.04, MR.h + 0.18, 0.09, 0.012), M.brass, fx, MR.y, MR.z - MR.w / 2 - 0.045); put(mf, rbox(0.04, MR.h + 0.18, 0.09, 0.012), M.brass, fx, MR.y, MR.z + MR.w / 2 + 0.045);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => put(mf, new THREE.SphereGeometry(0.035, 14, 10), M.brass, fx - 0.005, MR.y + a * (MR.h / 2 + 0.045), MR.z + b * (MR.w / 2 + 0.1)));
    const smudge = Q.cvs(256, 512), sg = smudge.getContext('2d'), sr = rng(9); sg.filter = 'blur(2px)';
    for (let i = 0; i < 24; i++) { sg.fillStyle = `rgba(255,255,255,${0.04 + sr() * 0.08})`; sg.beginPath(); sg.ellipse(sr() * 256, sr() * 512, 6 + sr() * 26, 4 + sr() * 12, sr() * 3, 0, 7); sg.fill(); }
    for (let i = 0; i < 120; i++) { sg.fillStyle = `rgba(255,255,255,${sr() * 0.14})`; sg.fillRect(sr() * 256, sr() * 512, 1.5, 1.5); }
    put(scene, new THREE.PlaneGeometry(MR.w, MR.h), new THREE.MeshBasicMaterial({ map: Q.toTex(smudge), transparent: true, depthWrite: false, toneMapped: false }), MR.x - 0.0015, MR.y, MR.z, { ry: -Math.PI / 2, cast: false, recv: false });

    /* ====================== Puerta ====================== */
    const dg = grp(scene); R.g.doorG = dg;
    put(dg, rbox(0.95, 2.08, 0.045, 0.01), M.walnut, 0.05, 1.04, D / 2 - 0.05);
    [[1.55, 0.7], [0.55, 0.7]].forEach(([y, h]) => { put(dg, rbox(0.66, h, 0.012, 0.008), M.oak, 0.05, y, D / 2 - 0.082); put(dg, rbox(0.54, h - 0.16, 0.008, 0.006), M.walnut, 0.05, y, D / 2 - 0.09); });
    strip('x', 1.16, 0.05, 2.1, D / 2 - 0.03, 0.07, 0.04, M.trim);
    put(dg, rbox(0.07, 2.1, 0.04, 0.008), M.trim, -0.5, 1.05, D / 2 - 0.03); put(dg, rbox(0.07, 2.1, 0.04, 0.008), M.trim, 0.6, 1.05, D / 2 - 0.03);
    put(dg, rbox(0.055, 0.2, 0.012, 0.004), M.brass, 0.5, 1.0, D / 2 - 0.082);
    put(dg, new THREE.CylinderGeometry(0.009, 0.009, 0.12, 10), M.brass, 0.46, 1.0, D / 2 - 0.115, { rz: Math.PI / 2 }); put(dg, new THREE.CylinderGeometry(0.01, 0.01, 0.04, 10), M.brass, 0.52, 1.0, D / 2 - 0.1, { rx: Math.PI / 2 });
    [0.3, 1.0, 1.7].forEach((y) => put(dg, new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), M.brass, -0.42, y, D / 2 - 0.048));
    put(scene, new THREE.BoxGeometry(0.95, 0.012, 0.01), emissive(0xffd9a0, 2.2), 0.05, 0.011, D / 2 - 0.045, { cast: false, recv: false });   // luz bajo la puerta
    const crack = new THREE.PointLight(0xffe2a0, 0.8, 3.2, 2); crack.position.set(0.05, 0.12, D / 2 - 0.3); scene.add(crack);
    put(scene, rbox(0.085, 0.13, 0.014, 0.004), M.white, 0.75, 1.2, D / 2 - 0.012, { cast: false }); put(scene, rbox(0.012, 0.03, 0.012, 0.003), mat(0xcccfd6, 0.4), 0.75, 1.2, D / 2 - 0.02, { cast: false });   // interruptor
    R.ref.crack = crack;
    // zapatillas junto a la puerta
    const sneak = (x, z, ry) => { const s = grp(scene, x, 0, z); s.rotation.y = ry; put(s, rbox(0.1, 0.03, 0.29, 0.012), mat(0xe4e6ec, 0.7), 0, 0.02, 0); put(s, rbox(0.095, 0.075, 0.2, 0.03), mat(0x8c93a6, 0.8), 0, 0.075, 0.03); put(s, new THREE.SphereGeometry(0.047, 14, 10), mat(0xe4e6ec, 0.7), 0, 0.055, -0.1, { s: [1, 0.55, 1.1] }); put(s, rbox(0.04, 0.012, 0.06, 0.004), mat(0xc83a3a, 0.7), 0, 0.118, 0.01, { cast: false }); };
    sneak(-0.75, 1.62, 0.2); sneak(-0.62, 1.55, -0.1);

    /* ====================== Escritorio, estante y silla ====================== */
    const desk = grp(scene); R.g.desk = desk;
    put(desk, rbox(0.64, 0.045, 1.34, 0.01), M.oak, -1.88, 0.75, 1.1);
    [[-2.14, 0.5], [-2.14, 1.68], [-1.62, 0.5], [-1.62, 1.68]].forEach(([x, z]) => put(desk, rbox(0.05, 0.73, 0.05, 0.008), M.walnut, x, 0.365, z));
    put(desk, rbox(0.5, 0.12, 0.012, 0.004), M.walnut, -1.88, 0.66, 0.45); put(desk, rbox(0.58, 0.14, 0.4, 0.008), M.walnut, -1.9, 0.66, 1.38); put(desk, rbox(0.5, 0.1, 0.01, 0.004), M.oak, -1.62, 0.66, 1.38); put(desk, new THREE.SphereGeometry(0.012, 10, 8), M.brass, -1.605, 0.66, 1.38);
    R.obst.push({ minX: -2.2, maxX: -1.58, minZ: 0.44, maxZ: 1.76 });
    const top = 0.773;
    put(desk, rbox(0.3, 0.018, 0.22, 0.006), mat(0xa9afba, 0.3, 0.9), -1.9, top + 0.009, 0.78, { ry: 1.57 });                         // portátil cerrado
    put(desk, new THREE.PlaneGeometry(0.06, 0.06), new THREE.MeshBasicMaterial({ color: 0x6fe8ff, transparent: true, opacity: 0.0 }), -1.9, top + 0.02, 0.78, { rx: -Math.PI / 2, cast: false });
    [[0.0, 0x7a2a2a, 'Previsión Social'], [0.02, 0x2a4a7a, 'Cálculo Actuarial'], [0.045, 0x2a5a3a, 'Estadística']].forEach(([h, c, t], i) => put(desk, rbox(0.17 - i * 0.01, 0.026, 0.24, 0.004), mat(c, 0.7), -1.9, top + 0.013 + i * 0.026, 0.4, { ry: 1.57 + i * 0.07 }));
    put(desk, rbox(0.16, 0.012, 0.22, 0.004), mat(0xe0dccc, 0.8), -1.8, top + 0.007, 1.0, { ry: 1.7 }); put(desk, new THREE.CylinderGeometry(0.004, 0.004, 0.14, 8), mat(0x1a1a22, 0.4), -1.78, top + 0.016, 1.03, { rz: Math.PI / 2, ry: 0.5 });
    const mug = grp(desk, -1.75, top, 1.45); put(mug, lathe([[0, 0], [0.04, 0], [0.043, 0.09], [0.04, 0.092], [0.037, 0.09], [0.036, 0.01], [0, 0.008]], 20), mat(0xdcdfe6, 0.3), 0, 0, 0); put(mug, new THREE.TorusGeometry(0.025, 0.006, 8, 14, 3.4), mat(0xdcdfe6, 0.3), 0.05, 0.05, 0, { rz: -1.7 }); put(mug, new THREE.CircleGeometry(0.036, 18), mat(0x2a160c, 0.2), 0, 0.084, 0, { rx: -Math.PI / 2 });
    const cup = grp(desk, -2.05, top, 1.55); put(cup, lathe([[0, 0], [0.035, 0], [0.037, 0.1], [0.033, 0.1], [0.032, 0.01], [0, 0.008]], 16), mat(0x2a2f3a, 0.5, 0.5), 0, 0, 0); [0, 1, 2, 3, 4].forEach((i) => put(cup, new THREE.CylinderGeometry(0.004, 0.004, 0.16, 6), mat([0xe7c840, 0x3a6ad0, 0xc8403a, 0x222, 0x3aaa5a][i], 0.5), Math.cos(i) * 0.012, 0.1, Math.sin(i) * 0.012, { rx: Math.sin(i * 2) * 0.12, rz: Math.cos(i * 2) * 0.12 }));
    const dl = grp(desk, -2.08, top, 0.62);                                                                                           // flexo
    put(dl, lathe([[0, 0], [0.07, 0], [0.07, 0.015], [0.015, 0.025]], 18), M.black, 0, 0, 0); put(dl, new THREE.CylinderGeometry(0.006, 0.006, 0.32, 8), M.steel, 0.0, 0.18, 0, { rz: 0.35 }); put(dl, new THREE.CylinderGeometry(0.006, 0.006, 0.3, 8), M.steel, 0.1, 0.38, 0, { rz: -0.9 });
    put(dl, lathe([[0.02, 0], [0.07, 0.08], [0.075, 0.09], [0.02, 0.03]], 20), mat(0x1a2a4a, 0.4, 0.4), 0.22, 0.44, 0, { rz: 0.5 });
    const hp = grp(desk, -1.7, top, 0.95); put(hp, new THREE.TorusGeometry(0.075, 0.012, 8, 20, 3.4), M.black, 0, 0.09, 0, { rx: 0, rz: 0.0 }); [-1, 1].forEach(s => put(hp, new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), M.black, s * 0.075, 0.03, 0, { rz: Math.PI / 2 }));
    // estante con libros reales (lomos con título)
    put(scene, rbox(0.26, 0.03, 1.2, 0.008), M.oak, -2.07, 1.5, 1.1); [0.55, 1.65].forEach(z => put(scene, rbox(0.18, 0.1, 0.02, 0.005), M.brass, -2.13, 1.44, z));
    const titles = ['Previsión', 'Solvencia', 'GLM', 'R', 'Python', 'Seguros', 'Cálculo', 'SQL', 'Riesgo', 'Markov', 'Series', 'Matrices'], cols = ['#7a2a2a', '#2a4a7a', '#2a5a3a', '#6a4a22', '#4a2a6a', '#22525a', '#7a5a22', '#2a2a4a', '#5a2a3a', '#3a5a2a', '#6a3a22', '#2a4a5a'];
    let bz = 0.6; titles.forEach((tt, i) => { const w = 0.03 + (i % 4) * 0.008, h = 0.2 + (i % 3) * 0.035, mm = new THREE.MeshStandardMaterial({ map: art.spine(tt, cols[i], i), roughness: 0.7 });
      put(scene, new THREE.BoxGeometry(0.17, h, w), mm, -2.1, 1.515 + h / 2, bz + w / 2, { rz: i === 9 ? 0.0 : 0, ry: 0 }); bz += w + 0.002; });
    put(scene, rbox(0.12, 0.2, 0.012, 0.004), M.brass, -2.1, 1.62, bz + 0.03);                                                           // sujetalibros
    const medal = grp(scene, -2.17, 1.48, 1.62); put(medal, new THREE.CylinderGeometry(0.004, 0.004, 0.02, 6), M.steel, 0.01, 0.1, 0, { rz: Math.PI / 2 }); put(medal, new THREE.CylinderGeometry(0.03, 0.03, 0.006, 24), mat(0xc9a13a, 0.25, 0.95), 0.0, -0.01, 0, { rz: Math.PI / 2 }); put(medal, rbox(0.004, 0.11, 0.025, 0.001), mat(0xb83a3a, 0.7), 0.0, 0.05, 0);
    R.g.shelf = medal;
    // silla de escritorio
    const chair = grp(scene, -1.2, 0, 1.12); chair.rotation.y = 1.9; R.g.chair = chair;
    put(chair, rbox(0.46, 0.05, 0.46, 0.015), M.oak, 0, 0.46, 0); put(chair, rbox(0.46, 0.5, 0.035, 0.012), M.oak, 0, 0.74, 0.22, { rx: -0.08 });
    [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([x, z]) => put(chair, new THREE.CylinderGeometry(0.018, 0.013, 0.46, 8), M.walnut, x, 0.23, z));
    R.obst.push({ minX: -1.5, maxX: -0.9, minZ: 0.8, maxZ: 1.4 });
    // mochila negra y bolso marrón (sobre la silla hasta que los cargas)
    const bags = grp(chair); R.ref.chairBags = bags;
    const bp = grp(bags, 0, 0.7, 0.12); bp.rotation.x = -0.1;
    put(bp, rbox(0.34, 0.5, 0.2, 0.06, 4), M.cordura, 0, 0, 0); put(bp, rbox(0.28, 0.24, 0.07, 0.04, 4), M.cordura, 0, -0.08, -0.12); put(bp, rbox(0.22, 0.07, 0.05, 0.02), M.cordura, 0, 0.19, -0.1);
    put(bp, new THREE.CylinderGeometry(0.004, 0.004, 0.24, 6), mat(0x888d99, 0.3, 0.9), 0, 0.045, -0.155, { rz: Math.PI / 2 }); put(bp, new THREE.CylinderGeometry(0.004, 0.004, 0.28, 6), mat(0x888d99, 0.3, 0.9), 0, 0.2, 0.0, { rz: Math.PI / 2, ry: 0 });
    put(bp, new THREE.TorusGeometry(0.05, 0.012, 8, 14, 3.1), M.black, 0, 0.27, 0, { rz: 1.57 });
    [-0.09, 0.09].forEach(x => put(bp, rbox(0.05, 0.4, 0.02, 0.008), M.black, x, -0.02, 0.11));
    const bag = grp(bags, 0.0, 0.52, -0.2);
    put(bag, rbox(0.32, 0.22, 0.1, 0.03, 4), M.leather, 0, 0, 0); put(bag, rbox(0.32, 0.12, 0.105, 0.02, 4), M.leather, 0, 0.07, 0.004); put(bag, rbox(0.04, 0.08, 0.012, 0.004), M.brass, 0, 0.0, -0.058);
    put(bag, new THREE.TorusGeometry(0.1, 0.008, 6, 20, 3.0), mat(0x3a2414, 0.7), 0, 0.12, 0, { rz: Math.PI / 2 - 0.1 });
    R.obst.push(); R.g.bags = bags;

    /* ====================== Alfombra, zapatillas de estar en casa, cuadros ====================== */
    put(scene, new THREE.PlaneGeometry(1.9, 1.3), M.rug, 0.45, 0.008, 0.5, { rx: -Math.PI / 2, cast: false });
    for (let i = 0; i < 38; i++) { [-1, 1].forEach((s) => put(scene, new THREE.CylinderGeometry(0.004, 0.004, 0.05, 4), mat(0x6b5a3a, 1), 0.45 - 0.95 + i * 0.05, 0.01, 0.5 + s * 0.66, { rx: Math.PI / 2, cast: false })); }
    [[-0.35, 0.15], [-0.5, 0.22]].forEach(([x, z], i) => { const sl = grp(scene, x, 0, z); sl.rotation.y = 0.4 + i * 0.5; put(sl, rbox(0.1, 0.04, 0.26, 0.018), mat(0x5a5f70, 1), 0, 0.02, 0); put(sl, new THREE.SphereGeometry(0.048, 14, 10), mat(0x7a8094, 1), 0, 0.04, -0.07, { s: [1, 0.55, 1.2] }); });
    const hang = (x, y, z, ry, w, h, tx) => { const f = grp(scene, x, y, z); f.rotation.y = ry; put(f, rbox(w + 0.06, h + 0.06, 0.03, 0.008), mat(0x14161c, 0.4), 0, 0, 0); put(f, rbox(w + 0.03, h + 0.03, 0.01, 0.004), M.white, 0, 0, 0.012); put(f, new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.45 }), 0, 0, 0.018, { cast: false }); return f; };
    hang(-1.5, 1.62, -D / 2 + 0.03, 0, 0.9, 0.62, art.cityPrint());
    hang(-1.2, 1.5, D / 2 - 0.03, Math.PI, 0.5, 0.7, art.mortalityPoster());

    /* ====================== Techo ====================== */
    const smoke = grp(scene, 0.6, H - 0.012, 0.35); put(smoke, new THREE.CylinderGeometry(0.06, 0.065, 0.025, 24), M.white, 0, 0, 0, { cast: false });
    const led = put(smoke, new THREE.SphereGeometry(0.006, 8, 6), emissive(0xff3030, 3), 0.035, -0.014, 0, { cast: false, recv: false }); R.ref.led = led;
    const pend = grp(scene, 0.2, H, 0.2); put(pend, new THREE.CylinderGeometry(0.004, 0.004, 0.5, 6), M.black, 0, -0.25, 0); put(pend, new THREE.SphereGeometry(0.1, 24, 18), new THREE.MeshPhysicalMaterial({ color: 0xe6ecf5, roughness: 0.1, transparent: true, opacity: 0.35, clearcoat: 1 }), 0, -0.56, 0, { cast: false }); put(pend, new THREE.SphereGeometry(0.02, 12, 10), mat(0xffe9b8, 0.5), 0, -0.56, 0, { cast: false });

    /* ====================== Luces y atmósfera ====================== */
    scene.add(new THREE.HemisphereLight(0x4a5c90, 0x120d0a, 0.62));
    const fill = new THREE.PointLight(0x8aa0d8, 0.35, 6, 2); fill.position.set(0, 2.3, 0.2); scene.add(fill);
    const moon = new THREE.DirectionalLight(0x5878b8, 0.3); moon.position.set(2, 3, -4); scene.add(moon);
    const street = new THREE.SpotLight(0xff9a50, 12, 12, 0.34, 0.6, 1.2);
    street.position.set(0.9, 4.5, -4.0); street.target.position.set(0.9, 0, -0.4); street.castShadow = true;
    street.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024); street.shadow.bias = -0.0004; street.shadow.normalBias = 0.02; street.shadow.camera.near = 1; street.shadow.camera.layers.enable(1); street.shadow.radius = 4;
    scene.add(street, street.target); R.ref.street = street;
    const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.glowTex, color: 0xff9a3c, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); lampGlow.scale.set(1.5, 1.5, 1); lampGlow.position.set(1.0, 1.75, -D / 2 - 0.25); scene.add(lampGlow); R.ref.lampGlow = lampGlow;
    const beamM = new THREE.MeshBasicMaterial({ map: Q.beamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.3, fog: false });
    const quad = (a, b, c, d) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], 2)); const m = new THREE.Mesh(g, beamM); m.renderOrder = 5; scene.add(m); };
    const zW = -D / 2 + 0.05; quad([0.2, 2.1, zW], [0.2, 1.0, zW], [0.2, 0, -1.15], [0.2, 0, 0.15]); quad([1.6, 2.1, zW], [1.6, 1.0, zW], [1.6, 0, -1.15], [1.6, 0, 0.15]); quad([0.2, 2.1, zW], [1.6, 2.1, zW], [1.6, 0, 0.15], [0.2, 0, 0.15]);
    const DUST = high ? 220 : 120, dGeo = new THREE.BufferGeometry(), dPos = new Float32Array(DUST * 3), dSeed = [];
    for (let i = 0; i < DUST; i++) { dPos[i * 3] = lerp(0.1, 1.7, rnd()); dPos[i * 3 + 1] = lerp(0.2, 2.1, rnd()); dPos[i * 3 + 2] = lerp(-1.7, 0.2, rnd()); dSeed.push(rnd() * 6.28); }
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    scene.add(new THREE.Points(dGeo, new THREE.PointsMaterial({ map: Q.glowTex, color: 0xffd9a0, size: 0.024, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })));
    R.tick.push((dt, t) => {
      const a = dGeo.attributes.position.array;
      for (let i = 0; i < DUST; i++) { a[i * 3 + 1] += Math.sin(t * 0.3 + dSeed[i]) * 0.0007 - 0.00018; a[i * 3] += Math.cos(t * 0.2 + dSeed[i]) * 0.0005; if (a[i * 3 + 1] < 0.15) a[i * 3 + 1] = 2.1; }
      dGeo.attributes.position.needsUpdate = true;
      led.visible = (Math.floor(t * 0.7) % 3) === 0 && (t % 1.43) < 0.12;
      lampGlow.material.opacity = 0.85 + Math.sin(t * 2.1) * 0.05;
      cL.rotation.y = Math.sin(t * 0.5) * 0.003; cR.rotation.y = -Math.sin(t * 0.45) * 0.003;
    });
    return R;
  };

  /* texturas de utilidad */
  Q.glowTex = (() => { const c = Q.cvs(128, 128), g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return Q.toTex(c); })();
  Q.beamTex = (() => { const c = Q.cvs(64, 128), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,170,80,.6)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 128); const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,.6)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,.6)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, 64, 128); return Q.toTex(c); })();
})();
