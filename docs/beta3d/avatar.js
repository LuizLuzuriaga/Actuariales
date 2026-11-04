/* avatar.js — el protagonista, esculpido con campos de distancia: superficies orgánicas continuas (cabeza con mandíbula, pómulos,
   nariz, labios, cejas, barba y pelo; torso; brazos; manos de cinco dedos; piernas; zapatos). Se articula por partes. */
(() => {
  const Q = window.QX;
  const { mat, rbox, rng, clamp, lerp } = Q;
  const S = Q.sdf, ss = S.ss, smin = S.smin, smax = S.smax, ell = S.ell, cone = S.cone, sph = S.sphere;
  const H = Math.hypot;
  Q.EYE = 1.66;

  Q.buildAvatar = (scene, { high = true } = {}) => {
    const A = {};
    const avatar = new THREE.Group(); scene.add(avatar); A.group = avatar;
    const K = high ? 1 : 1.4;                                              // tamaño de celda: más grueso en móviles
    const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
    const put = (parent, geo, m, x = 0, y = 0, z = 0, o = {}) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); if (o.rx) me.rotation.x = o.rx; if (o.ry) me.rotation.y = o.ry; if (o.rz) me.rotation.z = o.rz; if (o.s) me.scale.set(...o.s); me.castShadow = o.cast !== false; me.receiveShadow = true; parent.add(me); return me; };
    const part = (parent, geo, m, x = 0, y = 0, z = 0) => put(parent, geo, m, x, y, z);

    /* ---- materiales ---- */
    const skinN = Q.pbr(256, 256, (g, hg) => { const r = rng(2); g.fillStyle = '#c99a78'; g.fillRect(0, 0, 256, 256); hg.fillStyle = '#808080'; hg.fillRect(0, 0, 256, 256); for (let i = 0; i < 6000; i++) { hg.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() * 0.5})`; hg.fillRect(r() * 256, r() * 256, 1.5, 1.5); } }, { strength: 1.4, repeat: [1, 1] });
    const clothT = Q.tex.cloth([90, 96, 122], 3, 30), clothP = Q.tex.cloth([80, 84, 100], 11, 34);
    [clothT, clothP].forEach((c) => { c.normalMap.repeat.set(1, 1); c.roughnessMap.repeat.set(1, 1); });
    const skinM = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.58, normalMap: skinN.normalMap, normalScale: new THREE.Vector2(0.4, 0.4) });
    const top = new THREE.MeshStandardMaterial({ color: 0x454b63, roughness: 0.85, normalMap: clothT.normalMap, roughnessMap: clothT.roughnessMap, normalScale: new THREE.Vector2(1.1, 1.1) });
    const pants = new THREE.MeshStandardMaterial({ color: 0x2c3150, roughness: 0.9, normalMap: clothP.normalMap, roughnessMap: clothP.roughnessMap, normalScale: new THREE.Vector2(1.0, 1.0) });
    const shoeM = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.4 });
    A.mats = { top, pants, skin: skinM };

    /* ================= Cabeza (origen = centro de la cabeza) ================= */
    const SKIN = S.lin(0xd29c7a), BLUSH = S.lin(0xd98a74), HAIR = S.lin(0x24180f), BEARD = S.lin(0x17100a), LIP = S.lin(0x9a4a40), BROW = S.lin(0x1a110a), FADE = S.lin(0x5a463a);
    const beardMask = (x, y, z) => { const ax = Math.abs(x), band = ss(0.02, -0.03, z) * ss(0.105, 0.078, ax) * ss(-0.165, -0.13, y); const cheek = ss(-0.046 + 0.012 * ss(0.03, 0.08, ax), -0.066, y); const stache = ss(0.034, 0.022, ax) * ss(-0.034, -0.044, y) * ss(-0.066, -0.058, y); return band * Math.max(cheek, stache); };
    const hairMask = (x, y, z) => {
      const ax = Math.abs(x), thr = 0.092 - 0.15 * Math.max(0, z) + (S.hash(x * 400, 3.1, z * 400) - 0.5) * 0.014;
      let m = ss(thr - 0.01, thr + 0.014, y);
      m *= 1 - ss(0.07, 0.082, ax) * ss(0.04, 0.0, y) * 0.0;                       // las sienes se tratan aparte
      m *= 1 - ss(0.08, 0.09, ax) * ss(0.05, 0.0, y);                              // sin pelo sobre las orejas
      return m;
    };
    const sideMask = (x, y, z) => ss(0.058, 0.074, Math.abs(x)) * ss(0.07, 0.05, y) * ss(-0.035, -0.005, y) * ss(0.04, 0.0, z);   // degradado rapado de las sienes
    const headF = (x, y, z) => {
      const ax = Math.abs(x);
      let d = ell(x, y, z, 0, 0.015, 0.005, 0.086, 0.098, 0.094);                                       // cráneo
      d = smin(d, ell(x, y, z, 0, -0.03, -0.02, 0.078, 0.1, 0.082), 0.03);                              // masa de la cara
      d = smin(d, cone(ax, y, z, 0, -0.085, -0.035, 0.044, -0.085, -0.035, 0.045, 0.045), 0.02);        // mandíbula cuadrada
      d = smin(d, sph(x, y, z, 0, -0.095, -0.058, 0.03), 0.02);                                         // mentón
      d = smin(d, sph(ax, y, z, 0.052, -0.02, -0.055, 0.026), 0.03);                                    // pómulos
      d = smin(d, cone(ax, y, z, 0, 0.047, -0.082, 0.046, 0.047, -0.082, 0.0165, 0.0165), 0.02);        // arcos de las cejas
      d = smin(d, cone(x, y, z, 0, 0.02, -0.09, 0, -0.022, -0.108, 0.012, 0.0165), 0.012);              // nariz
      d = smin(d, sph(ax, y, z, 0.014, -0.03, -0.098, 0.0095), 0.008);                                  // aletas
      d = smin(d, ell(ax, y, z, 0.088, -0.01, 0.01, 0.012, 0.028, 0.02), 0.01);                         // orejas
      d = smin(d, cone(x, y, z, 0, -0.1, 0.005, 0, -0.21, 0.012, 0.047, 0.05), 0.03);                   // cuello
      d = smin(d, cone(ax, y, z, 0, -0.06, -0.089, 0.02, -0.06, -0.087, 0.0075, 0.0075), 0.006);        // labio superior
      d = smin(d, cone(ax, y, z, 0, -0.078, -0.086, 0.017, -0.078, -0.085, 0.0085, 0.0085), 0.006);     // labio inferior
      const hm = hairMask(x, y, z);
      d = smin(d, ell(x, y, z, 0, 0.118, -0.022, 0.056, 0.04, 0.096), 0.03 * (0.4 + hm));               // tupé peinado hacia atrás
      d -= hm * 0.011 + beardMask(x, y, z) * 0.0075 + sideMask(x, y, z) * 0.002;                         // volumen de pelo, barba y degradado
      d = smax(d, -sph(ax, y, z, 0.036, 0.02, -0.09, 0.0165), 0.008);                                   // cuencas de los ojos
      d = smax(d, -cone(ax, y, z, 0, -0.069, -0.094, 0.021, -0.069, -0.092, 0.0035, 0.0035), 0.004);    // línea de la boca
      return d;
    };
    const headC = (x, y, z) => {
      const ax = Math.abs(x), n = S.hash(x * 900, y * 900, z * 900), n2 = S.hash(y * 700 + 3, z * 700, x * 700);
      let c = S.mix(SKIN, [SKIN[0] * 0.93, SKIN[1] * 0.9, SKIN[2] * 0.9], n2);
      c = S.mix(c, BLUSH, 0.4 * ss(0.05, 0.015, H(ax - 0.052, y + 0.03, z + 0.06)));                    // rubor en los pómulos
      c = S.mix(c, BLUSH, 0.35 * ss(0.022, 0.008, H(x, y + 0.022, z + 0.11)));                          // punta de la nariz
      const sm = sideMask(x, y, z); if (sm > 0 && n < sm) c = S.mix(c, FADE, 0.85);                      // sienes rapadas
      const bm = beardMask(x, y, z); if (n < bm * 1.05) c = S.mix(BEARD, [BEARD[0] * 1.8, BEARD[1] * 1.8, BEARD[2] * 1.8], n2);
      const hm = hairMask(x, y, z); if (n2 < hm * 1.08) c = S.mix(HAIR, [HAIR[0] * 3.4, HAIR[1] * 3.0, HAIR[2] * 2.6], Math.pow(n, 1.5));
      if (z < -0.06 && Math.abs(y - 0.047) < 0.0115 && ax > 0.012 && ax < 0.064) c = S.mix(c, BROW, 0.92);   // cejas
      { const lx = ax / 0.024, ly = (y + 0.07) / 0.0145; if (z < -0.078 && lx * lx + ly * ly < 1) c = S.mix(c, LIP, 0.9); }   // labios
      return c;
    };
    const headGeo = S.mesh(headF, [-0.125, -0.25, -0.14], [0.125, 0.15, 0.14], 0.0052 * K, headC, 6);
    const headPivot = grp(avatar, 0, 1.54, 0); headPivot.rotation.order = 'YXZ'; A.headPivot = headPivot;
    const head = grp(headPivot, 0, 0.12, 0);
    part(head, headGeo, skinM);
    const eyeW = mat(0xf2f2f4, 0.2), irisM = new THREE.MeshBasicMaterial({ color: 0x3a2314 }), pupilM = new THREE.MeshBasicMaterial({ color: 0x050505 }), glintM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    A.lids = [];
    [-1, 1].forEach((s) => {
      put(head, new THREE.SphereGeometry(0.0148, 14, 10), eyeW, 0.036 * s, 0.02, -0.09);
      put(head, new THREE.CircleGeometry(0.0075, 16), irisM, 0.036 * s, 0.02, -0.1049, { ry: Math.PI });
      put(head, new THREE.CircleGeometry(0.0036, 12), pupilM, 0.036 * s, 0.02, -0.1052, { ry: Math.PI });
      put(head, new THREE.CircleGeometry(0.0013, 8), glintM, 0.0378 * s, 0.0225, -0.1054, { ry: Math.PI });
      A.lids.push(put(head, new THREE.SphereGeometry(0.0168, 12, 8), skinM.clone(), 0.036 * s, 0.02, -0.09, { s: [1, 0.02, 1.05] }));
      A.lids[A.lids.length - 1].material.vertexColors = false; A.lids[A.lids.length - 1].material.color.setRGB(...SKIN.map((v) => Math.pow(v, 1 / 2.2)));
    });
    put(head, new THREE.SphereGeometry(0.0062, 10, 8), mat(0x050505, 0.25, 0.6), 0.092, -0.04, 0.012);        // pendiente negro
    head.traverse((o) => { if (o.isMesh) o.layers.set(1); });                                                  // la cabeza solo se ve en el espejo

    /* ================= Torso y pelvis ================= */
    const torsoF = (x, y, z) => {
      const ax = Math.abs(x);
      let d = ell(x, y, z, 0, 1.26, 0.005, 0.172, 0.205, 0.118);                                          // pecho
      d = smin(d, ell(x, y, z, 0, 1.03, 0.0, 0.155, 0.21, 0.108), 0.07);                                 // abdomen
      d = smin(d, ell(x, y, z, 0, 0.9, 0.0, 0.184, 0.11, 0.122), 0.05);                                  // bajo de la camisa
      d = smin(d, cone(ax, y, z, 0, 1.425, 0, 0.19, 1.412, 0, 0.05, 0.05), 0.06);                     // hombros
      d = smin(d, ell(x, y, z, 0, 1.485, 0.01, 0.105, 0.05, 0.07), 0.06);                                // trapecios
      return d + Math.sin(y * 38 + x * 9) * 0.0022 + Math.sin(y * 17 - z * 21 + x * 5) * 0.0018;          // arrugas
    };
    const torsoGeo = S.mesh(torsoF, [-0.3, 0.78, -0.2], [0.3, 1.58, 0.2], 0.0112 * K, null, 7);
    A.torso = part(avatar, torsoGeo, top);
    const hipF = (x, y, z) => { const ax = Math.abs(x); let d = ell(x, y, z, 0, 0.935, 0, 0.18, 0.115, 0.12); d = smin(d, cone(ax, y, z, 0.085, 0.93, 0, 0.09, 0.82, 0, 0.085, 0.078), 0.05); return d + Math.sin(y * 30 + z * 12) * 0.0016; };
    A.pelvis = part(avatar, S.mesh(hipF, [-0.26, 0.74, -0.18], [0.26, 1.06, 0.18], 0.0112 * K, null, 7), pants);
    const collar = grp(avatar, 0, 1.5, 0); A.collar = collar; collar.visible = false;
    put(collar, new THREE.TorusGeometry(0.062, 0.016, 8, 22), top, 0, 0, 0, { rx: Math.PI / 2, s: [1, 1.1, 0.5] });
    A.buttons = grp(avatar); A.buttons.visible = false;
    const frontZ = (y) => { for (let z = -0.2; z < 0.1; z += 0.002) if (torsoF(0, y, z) < 0) return z; return -0.12; };
    for (let i = 0; i < 6; i++) { const y = 1.4 - i * 0.075; put(A.buttons, new THREE.SphereGeometry(0.0078, 8, 6), mat(0xe8e8ee, 0.3), 0, y, frontZ(y) - 0.001, { cast: false }); }

    /* ================= Brazos: manga, antebrazo con puño y mano ================= */
    const upperF = (x, y, z) => { let d = cone(x, y, z, 0, 0, 0, 0, -0.3, 0, 0.056, 0.046); d = smin(d, sph(x, y, z, 0, 0, 0, 0.06), 0.04); d = smin(d, ell(x, y, z, 0, -0.1, -0.012, 0.052, 0.08, 0.05), 0.05); return d + Math.sin(y * 45 + x * 20) * 0.0016; };
    const foreF = (x, y, z) => { let d = cone(x, y, z, 0, 0, 0, 0, -0.27, 0, 0.046, 0.034); d = smin(d, sph(x, y, z, 0, 0, 0, 0.047), 0.03); d = smin(d, cone(x, y, z, 0, -0.238, 0, 0, -0.272, 0, 0.039, 0.039), 0.005); return d + Math.sin(y * 52 + z * 16) * 0.0015; };
    const handGeo = (s) => S.mesh((x, y, z) => {
      let d = ell(x, y, z, 0, -0.055, 0, 0.04, 0.05, 0.017);
      [[-0.027, 0.8], [-0.009, 1], [0.009, 0.97], [0.027, 0.82]].forEach(([fx, L]) => {
        d = smin(d, cone(x, y, z, fx, -0.095, 0, fx, -0.095 - 0.033 * L, 0.01 * L, 0.0098, 0.0092), 0.012);
        d = smin(d, cone(x, y, z, fx, -0.095 - 0.033 * L, 0.01 * L, fx, -0.1 - 0.056 * L, 0.036 * L, 0.0092, 0.0084), 0.008);
        d = smin(d, cone(x, y, z, fx, -0.1 - 0.056 * L, 0.036 * L, fx, -0.085 - 0.058 * L, 0.056 * L, 0.0084, 0.0078), 0.006);
      });
      const tx = -0.04 * s;
      d = smin(d, cone(x, y, z, tx, -0.03, 0.006, tx * 1.3, -0.065, 0.026, 0.0125, 0.0108), 0.012);
      d = smin(d, cone(x, y, z, tx * 1.3, -0.065, 0.026, tx * 1.05, -0.092, 0.044, 0.0108, 0.0092), 0.008);
      d = smin(d, ell(x, y, z, tx * 0.8, -0.05, 0.004, 0.02, 0.032, 0.016), 0.02);
      return d;
    }, [-0.085, -0.2, -0.05], [0.085, 0.03, 0.095], 0.0042 * K, (x, y, z) => S.mix(SKIN, [SKIN[0] * 0.9, SKIN[1] * 0.85, SKIN[2] * 0.85], S.hash(x * 800, y * 800, z * 800)), 8);
    const upperGeo = S.mesh(upperF, [-0.11, -0.38, -0.11], [0.11, 0.1, 0.11], 0.0075 * K, null, 7);
    const foreGeo = S.mesh(foreF, [-0.1, -0.32, -0.1], [0.1, 0.08, 0.1], 0.007 * K, null, 7);
    A.arms = []; A.hands = [];
    [-1, 1].forEach((s) => {
      const sh = grp(avatar, 0.225 * s, 1.43, 0); part(sh, upperGeo, top);
      const el = grp(sh, 0, -0.3, 0); part(el, foreGeo, top);
      const wrist = grp(el, 0, -0.27, 0); const hand = grp(wrist, 0, -0.025, 0); hand.rotation.x = -0.1; hand.rotation.z = 0.05 * s;
      part(hand, handGeo(s), skinM);
      A.arms.push({ sh, el, hand, wrist, curl: () => { } }); A.hands.push(hand);
    });

    /* ================= Piernas y zapatos ================= */
    const thighF = (x, y, z) => { let d = cone(x, y, z, 0, 0, 0, 0, -0.42, 0, 0.088, 0.062); d = smin(d, ell(x, y, z, 0.005, -0.15, 0, 0.082, 0.17, 0.08), 0.06); return d + Math.sin(y * 40 + z * 13) * 0.0018; };
    const shinF = (x, y, z) => { let d = cone(x, y, z, 0, 0, 0, 0, -0.41, 0, 0.058, 0.04); d = smin(d, ell(x, y, z, 0, -0.14, 0.02, 0.063, 0.12, 0.062), 0.05); d = smin(d, sph(x, y, z, 0, 0, 0, 0.056), 0.03); d = smin(d, cone(x, y, z, 0, -0.38, 0, 0, -0.42, 0, 0.045, 0.045), 0.005); return d + Math.sin(y * 36 + x * 11) * 0.0017; };
    const shoeF = (x, y, z) => { let d = ell(x, y, z, 0, -0.035, -0.045, 0.05, 0.05, 0.135); d = smin(d, ell(x, y, z, 0, -0.05, -0.11, 0.047, 0.036, 0.06), 0.02); d = smin(d, S.box(x, y, z, 0, -0.072, -0.05, 0.052, 0.012, 0.145, 0.011), 0.012); return d; };
    const slipperF = (x, y, z) => smin(ell(x, y, z, 0, -0.06, -0.04, 0.048, 0.03, 0.12), ell(x, y, z, 0, -0.065, 0.02, 0.044, 0.024, 0.07), 0.03);
    const SOLE = S.lin(0xcfd0d6), LEATHER = S.lin(0x0b0b0f), FELT = S.lin(0x6a6f80);
    const thighGeo = S.mesh(thighF, [-0.13, -0.47, -0.13], [0.13, 0.1, 0.13], 0.0088 * K, null, 7);
    const shinGeo = S.mesh(shinF, [-0.11, -0.47, -0.11], [0.11, 0.09, 0.11], 0.0082 * K, null, 7);
    const shoeGeo = S.mesh(shoeF, [-0.08, -0.11, -0.22], [0.08, 0.03, 0.1], 0.0058 * K, (x, y) => (y < -0.068 ? SOLE : S.mix(LEATHER, [LEATHER[0] * 2, LEATHER[1] * 2, LEATHER[2] * 2], ss(-0.03, 0.02, y))), 8);
    const slipGeo = S.mesh(slipperF, [-0.08, -0.11, -0.2], [0.08, 0.0, 0.1], 0.0058 * K, () => FELT, 8);
    A.legs = []; A.shoes = []; A.slippers = [];
    [-1, 1].forEach((s) => {
      const hip = grp(avatar, 0.095 * s, 0.93, 0); part(hip, thighGeo, pants);
      const knee = grp(hip, 0, -0.42, 0); part(knee, shinGeo, pants);
      const ankle = grp(knee, 0, -0.43, 0);
      const shoe = grp(ankle, 0, -0.03, 0); part(shoe, shoeGeo, shoeM); const slip = grp(ankle, 0, -0.03, 0); part(slip, slipGeo, shoeM);
      A.legs.push({ hip, knee, ankle }); A.shoes.push(shoe); A.slippers.push(slip);
    });

    /* ================= Mochila y bolso (sobre ti) ================= */
    const cord = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.85 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 0.55 });
    const pack = grp(avatar); pack.visible = false; A.pack = pack;
    put(pack, rbox(0.33, 0.48, 0.18, 0.06, 4), cord, 0, 1.2, 0.2); put(pack, rbox(0.27, 0.22, 0.06, 0.035, 4), cord, 0, 1.12, 0.31); put(pack, rbox(0.2, 0.07, 0.04, 0.02), cord, 0, 1.38, 0.3);
    put(pack, new THREE.TorusGeometry(0.045, 0.01, 8, 14, 3.1), cord, 0, 1.46, 0.2, { rz: 1.57 });
    [-1, 1].forEach((s) => { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.1 * s, 1.4, 0.115), new THREE.Vector3(0.11 * s, 1.52, 0.02), new THREE.Vector3(0.12 * s, 1.5, -0.07), new THREE.Vector3(0.13 * s, 1.25, -0.12), new THREE.Vector3(0.14 * s, 1.0, -0.06), new THREE.Vector3(0.12 * s, 0.98, 0.11)]);
      put(pack, new THREE.TubeGeometry(curve, 30, 0.018, 6, false), cord); });
    put(pack, new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6), mat(0x8a8f9c, 0.3, 0.9), 0, 1.0, -0.12, { rz: Math.PI / 2 });          // cinta pectoral
    const bagG = grp(avatar); bagG.visible = false; A.bagG = bagG;
    put(bagG, rbox(0.3, 0.21, 0.1, 0.03, 4), leather, -0.26, 0.86, 0.0); put(bagG, rbox(0.3, 0.1, 0.104, 0.02, 4), leather, -0.26, 0.9, -0.004); put(bagG, rbox(0.035, 0.07, 0.01, 0.003), mat(0xb08a3e, 0.3, 0.9), -0.26, 0.86, -0.056);
    const strap = new THREE.CatmullRomCurve3([new THREE.Vector3(0.11, 1.5, 0), new THREE.Vector3(0.06, 1.38, -0.125), new THREE.Vector3(-0.1, 1.15, -0.13), new THREE.Vector3(-0.22, 0.97, -0.07), new THREE.Vector3(-0.22, 0.98, 0.07), new THREE.Vector3(-0.1, 1.15, 0.13), new THREE.Vector3(0.06, 1.38, 0.125)], true);
    put(bagG, new THREE.TubeGeometry(strap, 50, 0.014, 6, true), mat(0x3a2414, 0.7));

    /* ================= Estados y animación ================= */
    A.dress = (on) => {
      top.color.setHex(on ? 0x234a94 : 0x454b63); pants.color.setHex(on ? 0x2a2d35 : 0x2c3150);
      collar.visible = on; A.buttons.visible = on;
      A.shoes.forEach((s) => { s.visible = on; }); A.slippers.forEach((s) => { s.visible = !on; });
    };
    A.carry = () => { pack.visible = true; bagG.visible = true; };
    A.reach = 0;                                                           // 0..1: brazo derecho extendido
    A.update = (dt, t, walk, pitch) => {
      const ph = t * 8.5, sw = Math.sin(ph) * 0.55 * walk;
      A.legs[0].hip.rotation.x = sw; A.legs[1].hip.rotation.x = -sw;
      A.legs[0].knee.rotation.x = Math.max(0, -Math.sin(ph + 1.2)) * 0.7 * walk; A.legs[1].knee.rotation.x = Math.max(0, Math.sin(ph + 1.2)) * 0.7 * walk;
      const idle = 1 - Math.min(1, walk * 2.2), sw2 = Math.sin(t * 0.37) * idle, br = Math.sin(t * 1.6);
      A.legs[0].hip.rotation.x += 0.045 * sw2; A.legs[1].hip.rotation.x -= 0.03 * sw2;
      A.legs[0].knee.rotation.x += 0.09 * Math.max(0, sw2); A.legs[1].knee.rotation.x += 0.09 * Math.max(0, -sw2);
      A.pelvis.rotation.z = 0.025 * sw2; A.torso.rotation.z = -0.02 * sw2 + 0.004 * br;
      const bt = (t + 1.3) % 4.6, blink = bt < 0.16 ? Math.sin(bt / 0.16 * Math.PI) : (bt > 2.2 && bt < 2.32 ? Math.sin((bt - 2.2) / 0.12 * Math.PI) : 0);
      A.lids.forEach((l) => { l.scale.y = Math.max(0.02, blink); });
      A.headPivot.rotation.x += Math.sin(t * 0.55) * 0.012 * idle; A.headPivot.rotation.y += Math.sin(t * 0.31 + 1) * 0.02 * idle; A.headPivot.rotation.z = Math.sin(t * 0.43) * 0.015 * idle;
      const L = A.arms[0], Rr = A.arms[1];
      L.sh.rotation.x = -Math.sin(ph) * 0.45 * walk + 0.1; L.el.rotation.x = 0.32 + Math.max(0, Math.sin(ph)) * 0.3 * walk + 0.02 * br; L.sh.rotation.z = 0.06;
      const k = A.reach;
      Rr.sh.rotation.x = lerp(Math.sin(ph) * 0.45 * walk + 0.1, Math.PI / 2 + clamp(pitch, -1.2, 0.4) * 0.95 + 0.08, k);
      Rr.sh.rotation.z = lerp(-0.06, -0.3, k); Rr.el.rotation.x = lerp(0.32, 0.42, k);
      A.torso.scale.set(1 + br * 0.006, 1 + br * 0.004, 1 + br * 0.004);
    };
    A.dress(false);
    return A;
  };
})();
