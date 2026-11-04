/* avatar.js — tu cuerpo: piernas, torso, brazos con manos de cinco dedos, cabeza con barba y pelo (solo visible en el espejo). */
(() => {
  const Q = window.QX;
  const { mat, rbox, lathe, rng, clamp, lerp } = Q;
  Q.EYE = 1.66;

  Q.buildAvatar = (scene) => {
    const A = {};
    const avatar = new THREE.Group(); scene.add(avatar); A.group = avatar;
    const put = (parent, geo, m, x = 0, y = 0, z = 0, o = {}) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); if (o.rx) me.rotation.x = o.rx; if (o.ry) me.rotation.y = o.ry; if (o.rz) me.rotation.z = o.rz; if (o.s) me.scale.set(...o.s); me.castShadow = o.cast !== false; me.receiveShadow = true; parent.add(me); return me; };
    const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

    /* ---- materiales ---- */
    const skinN = Q.pbr(256, 256, (g, hg, rg, w, h) => { const r = rng(2); g.fillStyle = '#c99a78'; g.fillRect(0, 0, w, h); hg.fillStyle = '#808080'; hg.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { hg.fillStyle = `rgba(${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() < 0.5 ? 0 : 255},${r() * 0.5})`; hg.fillRect(r() * w, r() * h, 1.5, 1.5); } }, { strength: 1.4, repeat: [3, 3] });
    const skin = new THREE.MeshStandardMaterial({ color: 0xcf9d7a, roughness: 0.6, normalMap: skinN.normalMap, normalScale: new THREE.Vector2(0.35, 0.35), emissive: 0x3a140a, emissiveIntensity: 0.07 });
    const clothT = Q.tex.cloth([90, 96, 122], 3, 30), clothP = Q.tex.cloth([80, 84, 100], 11, 34);
    const top = new THREE.MeshStandardMaterial({ color: 0x454b63, roughness: 0.85, normalMap: clothT.normalMap, roughnessMap: clothT.roughnessMap, normalScale: new THREE.Vector2(1.0, 1.0) });
    const pants = new THREE.MeshStandardMaterial({ color: 0x2c3150, roughness: 0.9, normalMap: clothP.normalMap, roughnessMap: clothP.roughnessMap, normalScale: new THREE.Vector2(0.9, 0.9) });
    const shoeM = new THREE.MeshStandardMaterial({ color: 0x6a6f80, roughness: 0.95 });
    const sole = mat(0x15161a, 0.7);
    A.mats = { top, pants, shoeM, skin };

    /* ---- piernas ---- */
    A.legs = []; A.shoes = [];
    [-1, 1].forEach((s) => {
      const hip = grp(avatar, 0.095 * s, 0.93, 0);
      put(hip, lathe([[0.001, 0], [0.083, -0.01], [0.082, -0.14], [0.07, -0.3], [0.06, -0.42], [0.001, -0.425]], 18), pants);
      const knee = grp(hip, 0, -0.42, 0);
      put(knee, lathe([[0.058, 0.0], [0.06, -0.06], [0.063, -0.14], [0.056, -0.24], [0.045, -0.34], [0.039, -0.41], [0.001, -0.415]], 18), pants);   // gemelo con volumen
      const ankle = grp(knee, 0, -0.43, 0);
      const shoe = grp(ankle, 0, -0.03, -0.04);
      put(shoe, rbox(0.105, 0.03, 0.29, 0.012), sole, 0, -0.005, 0);
      put(shoe, new THREE.SphereGeometry(0.06, 16, 12), shoeM, 0, 0.03, -0.0, { s: [0.85, 0.7, 1.55] });
      put(shoe, new THREE.SphereGeometry(0.05, 14, 10), shoeM, 0, 0.045, 0.07, { s: [0.9, 0.9, 1.0] });
      A.legs.push({ hip, knee, ankle }); A.shoes.push(shoe);
    });
    A.pelvis = put(avatar, new THREE.SphereGeometry(0.17, 20, 14), pants, 0, 0.94, 0, { s: [1.0, 0.7, 0.68] });

    /* ---- torso, cuello, camisa ---- */
    const torso = put(avatar, lathe([[0.001, 0.84], [0.178, 0.85], [0.172, 0.9], [0.164, 0.98], [0.17, 1.05], [0.188, 1.2], [0.2, 1.32], [0.19, 1.42], [0.13, 1.49], [0.06, 1.51], [0.001, 1.51]], 28), top, 0, 0, 0, { s: [1, 1, 0.64] });
    A.torso = torso;
    put(avatar, new THREE.SphereGeometry(0.09, 16, 10), top, 0, 1.49, 0, { s: [1.55, 0.5, 0.75] });                       // trapecios
    const collar = grp(avatar, 0, 1.5, 0);
    A.collar = grp(collar); A.collar.visible = false;
    put(A.collar, new THREE.TorusGeometry(0.062, 0.016, 8, 22), top, 0, 0, 0, { rx: Math.PI / 2, s: [1, 1.1, 0.5] });
    [-1, 1].forEach((s) => put(A.collar, rbox(0.06, 0.04, 0.012, 0.004), top, 0.045 * s, -0.008, -0.07, { rz: 0.4 * s, rx: 0.2 }));
    A.buttons = grp(avatar); A.buttons.visible = false;
    for (let i = 0; i < 6; i++) { const y = 1.4 - i * 0.075, r = 0.19 * 0.64; put(A.buttons, new THREE.SphereGeometry(0.0075, 8, 6), mat(0xe8e8ee, 0.3), 0, y, -(r * 0.97 + 0.002), { cast: false }); }
    put(A.buttons, rbox(0.012, 0.52, 0.004, 0.001), top, 0, 1.15, -0.1238, { cast: false });
    A.neck = put(avatar, lathe([[0.001, 1.46], [0.052, 1.47], [0.05, 1.56], [0.001, 1.57]], 14), skin);

    /* ---- brazos con manos ---- */
    A.arms = []; A.hands = [];
    [-1, 1].forEach((s) => {
      const sh = grp(avatar, 0.225 * s, 1.43, 0);
      put(sh, new THREE.SphereGeometry(0.058, 16, 12), top);
      put(sh, lathe([[0.001, 0], [0.052, -0.01], [0.05, -0.12], [0.044, -0.3], [0.001, -0.305]], 14), top);
      const el = grp(sh, 0, -0.3, 0);
      put(el, new THREE.SphereGeometry(0.044, 12, 10), top);
      put(el, lathe([[0.001, 0], [0.043, -0.01], [0.038, -0.12], [0.031, -0.26], [0.001, -0.265]], 14), top);
      const wrist = grp(el, 0, -0.27, 0);
      put(wrist, new THREE.CylinderGeometry(0.03, 0.026, 0.04, 12), skin, 0, -0.005, 0);
      const hand = grp(wrist, 0, -0.03, 0);
      put(hand, rbox(0.082, 0.085, 0.03, 0.012), skin, 0, -0.05, 0);
      put(hand, new THREE.SphereGeometry(0.02, 10, 8), skin, -0.04 * s, -0.045, -0.002, { s: [1, 1.3, 0.9] });                    // base del pulgar
      [-0.03, -0.01, 0.01, 0.03].forEach((kx) => put(hand, new THREE.SphereGeometry(0.0105, 8, 6), skin, kx, -0.093, 0.004));     // nudillos
      const fingers = [];
      [-0.03, -0.01, 0.01, 0.03].forEach((x, i) => {
        const f1 = grp(hand, x, -0.093, 0), len = [0.04, 0.046, 0.044, 0.035][i];
        put(f1, new THREE.CylinderGeometry(0.0095, 0.0085, len, 8), skin, 0, -len / 2, 0);
        const f2 = grp(f1, 0, -len, 0); put(f2, new THREE.CylinderGeometry(0.0085, 0.0075, len * 0.9, 8), skin, 0, -len * 0.45, 0);
        put(f2, new THREE.SphereGeometry(0.008, 8, 6), skin, 0, -len * 0.9, 0);
        fingers.push([f1, f2]);
      });
      const th = grp(hand, 0.045 * -s * -1 * (s > 0 ? -1 : -1), -0.04, -0.01); th.position.x = -0.045 * s; th.rotation.z = 0.7 * s;
      put(th, new THREE.CylinderGeometry(0.0105, 0.0095, 0.045, 8), skin, 0, -0.022, 0); const th2 = grp(th, 0, -0.045, 0); put(th2, new THREE.CylinderGeometry(0.0095, 0.0085, 0.035, 8), skin, 0, -0.017, 0);
      hand.rotation.x = -0.1; hand.rotation.z = 0.05 * s;
      const curl = (k) => { fingers.forEach(([a, b], i) => { a.rotation.x = -(0.25 + k * 1.1) * (1 + i * 0.03); b.rotation.x = -(0.35 + k * 1.2); }); th.rotation.x = -0.2 - k * 0.5; th2.rotation.x = -0.2 - k * 0.5; };
      curl(0.2);
      A.arms.push({ sh, el, hand, wrist, curl }); A.hands.push(hand);
    });

    /* ---- cabeza (solo capa 1: la ves en el espejo) ---- */
    const headPivot = grp(avatar, 0, 1.54, 0); headPivot.rotation.order = 'YXZ'; A.headPivot = headPivot;
    const head = grp(headPivot, 0, 0.12, 0);
    const hr = rng(8);
    const hairTex = Q.pbr(256, 256, (g, hg) => { g.fillStyle = '#1a110a'; g.fillRect(0, 0, 256, 256); hg.fillStyle = '#808080'; hg.fillRect(0, 0, 256, 256); for (let i = 0; i < 700; i++) { const x = hr() * 256, y = hr() * 256; g.strokeStyle = `rgba(${40 + hr() * 40},${24 + hr() * 20},${12},${0.3 + hr() * 0.4})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (hr() - 0.5) * 10, y + 14 + hr() * 20); g.stroke(); hg.strokeStyle = `rgba(255,255,255,${0.4})`; hg.beginPath(); hg.moveTo(x, y); hg.lineTo(x + (hr() - 0.5) * 10, y + 14 + hr() * 20); hg.stroke(); } }, { strength: 2, repeat: [2, 2] });
    const hairM = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.55, map: hairTex.map, normalMap: hairTex.normalMap, normalScale: new THREE.Vector2(0.8, 0.8) });
    const stubble = Q.cvs(256, 256), sg = stubble.getContext('2d'); { sg.fillStyle = 'rgba(0,0,0,0)'; sg.clearRect(0, 0, 256, 256); for (let i = 0; i < 6000; i++) { sg.fillStyle = `rgba(26,16,10,${0.4 + hr() * 0.6})`; sg.fillRect(hr() * 256, hr() * 256, 1.4, 1.4); } }
    const beardM = new THREE.MeshStandardMaterial({ color: 0x1c120b, roughness: 0.9, alphaMap: Q.toTex(stubble, { srgb: false }), transparent: true, alphaTest: 0.08, side: THREE.DoubleSide });
    put(head, new THREE.SphereGeometry(0.1, 28, 22), skin, 0, 0, 0, { s: [0.93, 1.18, 1.04] });                         // cráneo
    put(head, new THREE.SphereGeometry(0.07, 20, 14), skin, 0, -0.075, -0.018, { s: [1.02, 0.95, 1.0] });              // mandíbula
    [-1, 1].forEach((s) => {
      put(head, new THREE.SphereGeometry(0.02, 10, 8), skin, 0.095 * s, 0.0, 0.0, { s: [0.5, 1.2, 0.8] });              // orejas
      put(head, new THREE.SphereGeometry(0.0145, 12, 10), mat(0xf2f2f4, 0.2), 0.036 * s, 0.025, -0.1);                  // ojos
      put(head, new THREE.CircleGeometry(0.0072, 14), new THREE.MeshBasicMaterial({ color: 0x2c1a0e }), 0.036 * s, 0.025, -0.1148);
      put(head, new THREE.CircleGeometry(0.0034, 10), new THREE.MeshBasicMaterial({ color: 0x050505 }), 0.036 * s, 0.025, -0.1151);
      A.lids = A.lids || []; A.lids.push(put(head, new THREE.SphereGeometry(0.0168, 10, 8), skin, 0.036 * s, 0.025, -0.1, { s: [1, 0.02, 1.05] }));   // párpado que parpadea
      put(head, new THREE.CircleGeometry(0.0013, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0.0375 * s, 0.0268, -0.1153);
      put(head, new THREE.SphereGeometry(0.02, 10, 8), skin, 0.05 * s, -0.025, -0.085, { s: [1, 0.7, 0.7] });                       // pómulo
      put(head, rbox(0.034, 0.004, 0.006, 0.0015), mat(0x2a1a12, 0.8), 0.036 * s, 0.043, -0.1, { rz: -0.1 * s });                  // pestañas
      put(head, rbox(0.04, 0.008, 0.01, 0.003), hairM, 0.038 * s, 0.05, -0.098, { rz: -0.12 * s });                      // cejas
      put(head, new THREE.SphereGeometry(0.0145, 10, 8), skin, 0.036 * s, 0.04, -0.097, { s: [1.15, 0.5, 0.5] });          // párpado
    });
    put(head, new THREE.SphereGeometry(0.019, 12, 10), skin, 0, -0.012, -0.113, { s: [0.9, 1.35, 1.1] });               // nariz
    put(head, rbox(0.04, 0.0045, 0.01, 0.0018), mat(0x4a2018, 0.55), 0, -0.071, -0.104);                                // boca
    put(head, rbox(0.036, 0.007, 0.01, 0.003), mat(0x8a4a3e, 0.5), 0, -0.078, -0.103);                                  // labio inferior
    put(head, new THREE.SphereGeometry(0.011, 8, 6), skin, 0, -0.052, -0.14 + 0.03, { s: [1.5, 1, 0.7] });                // surco
    put(head, new THREE.SphereGeometry(0.012, 8, 6), skin, 0, -0.118, -0.04, { s: [1, 1, 1] });                           // nuez/cuello
    put(head, new THREE.SphereGeometry(0.105, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM, 0, 0.012, 0.008, { s: [0.94, 1.18, 1.06], rx: 0.1 }); // pelo corto
    put(head, new THREE.SphereGeometry(0.06, 16, 12), hairM, 0, 0.1, -0.04, { s: [1.1, 0.55, 1.3] });                    // volumen superior
    put(head, new THREE.SphereGeometry(0.05, 14, 10), hairM, 0.03, 0.095, -0.075, { s: [1.3, 0.5, 0.8], rz: -0.25 });      // flequillo peinado
    [-1, 1].forEach((s) => put(head, new THREE.SphereGeometry(0.03, 10, 8), hairM, 0.09 * s, 0.015, 0.01, { s: [0.5, 1.5, 1.2] })); // patillas
    put(head, new THREE.SphereGeometry(0.098, 22, 14, Math.PI * 0.18, Math.PI * 0.64, Math.PI * 0.48, Math.PI * 0.34), beardM, 0, -0.01, -0.015, { s: [0.97, 1.18, 1.08], ry: Math.PI }); // barba de semanas
    put(head, rbox(0.055, 0.013, 0.012, 0.004), beardM, 0, -0.053, -0.108);                                                // bigote
    head.traverse((o) => { if (o.isMesh) o.layers.set(1); });
    A.neck.layers.set(1);

    /* ---- mochila y bolso (sobre ti) ---- */
    const cord = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.85 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x5a3820, roughness: 0.55 });
    const pack = grp(avatar); pack.visible = false; A.pack = pack;
    put(pack, rbox(0.33, 0.48, 0.18, 0.06, 4), cord, 0, 1.2, 0.2); put(pack, rbox(0.27, 0.22, 0.06, 0.035, 4), cord, 0, 1.12, 0.31); put(pack, rbox(0.2, 0.07, 0.04, 0.02), cord, 0, 1.38, 0.3);
    put(pack, new THREE.TorusGeometry(0.045, 0.01, 8, 14, 3.1), cord, 0, 1.46, 0.2, { rz: 1.57 });
    [-1, 1].forEach((s) => { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.1 * s, 1.4, 0.115), new THREE.Vector3(0.11 * s, 1.52, 0.02), new THREE.Vector3(0.12 * s, 1.5, -0.07), new THREE.Vector3(0.13 * s, 1.25, -0.115), new THREE.Vector3(0.14 * s, 1.0, -0.06), new THREE.Vector3(0.12 * s, 0.98, 0.11)]);
      put(pack, new THREE.TubeGeometry(curve, 30, 0.018, 6, false), cord, 0, 0, 0, { s: [1, 1, 1] }); });
    put(pack, new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6), mat(0x8a8f9c, 0.3, 0.9), 0, 1.0, -0.118, { rz: Math.PI / 2 });          // cinta pectoral
    const bagG = grp(avatar); bagG.visible = false; A.bagG = bagG;
    put(bagG, rbox(0.3, 0.21, 0.1, 0.03, 4), leather, -0.26, 0.86, 0.0); put(bagG, rbox(0.3, 0.1, 0.104, 0.02, 4), leather, -0.26, 0.9, -0.004); put(bagG, rbox(0.035, 0.07, 0.01, 0.003), mat(0xb08a3e, 0.3, 0.9), -0.26, 0.86, -0.056);
    const strap = new THREE.CatmullRomCurve3([new THREE.Vector3(0.11, 1.5, 0), new THREE.Vector3(0.06, 1.38, -0.125), new THREE.Vector3(-0.1, 1.15, -0.13), new THREE.Vector3(-0.22, 0.97, -0.07), new THREE.Vector3(-0.22, 0.98, 0.07), new THREE.Vector3(-0.1, 1.15, 0.13), new THREE.Vector3(0.06, 1.38, 0.125)], true);
    put(bagG, new THREE.TubeGeometry(strap, 50, 0.014, 6, true), mat(0x3a2414, 0.7));


    /* ---- estados ---- */
    A.dress = (on) => {
      top.color.setHex(on ? 0x234a94 : 0x454b63); pants.color.setHex(on ? 0x2a2d35 : 0x2c3150);
      shoeM.color.setHex(on ? 0x0c0c10 : 0x6a6f80); shoeM.roughness = on ? 0.35 : 0.95;
      A.collar.visible = on; A.buttons.visible = on;
      A.shoes.forEach((s) => s.scale.set(1, on ? 1.15 : 0.8, 1));
    };
    A.carry = () => { pack.visible = true; bagG.visible = true; };
    A.reach = 0;                                                           // 0..1: brazo derecho extendido
    A.update = (dt, t, walk, pitch) => {
      const ph = t * 8.5, sw = Math.sin(ph) * 0.55 * walk;
      A.legs[0].hip.rotation.x = sw; A.legs[1].hip.rotation.x = -sw;
      A.legs[0].knee.rotation.x = Math.max(0, -Math.sin(ph + 1.2)) * 0.7 * walk; A.legs[1].knee.rotation.x = Math.max(0, Math.sin(ph + 1.2)) * 0.7 * walk;
      const idle = 1 - Math.min(1, walk * 2.2), sw2 = Math.sin(t * 0.37) * idle, br = Math.sin(t * 1.6);
      A.legs[0].hip.rotation.x += 0.045 * sw2; A.legs[1].hip.rotation.x -= 0.03 * sw2;                                // reparte el peso entre las piernas
      A.legs[0].knee.rotation.x += 0.09 * Math.max(0, sw2); A.legs[1].knee.rotation.x += 0.09 * Math.max(0, -sw2);
      A.pelvis.rotation.z = 0.025 * sw2; A.torso.rotation.z = -0.02 * sw2 + 0.004 * br; A.group.children.forEach((c) => { if (c.userData.lean) c.rotation.z = -0.02 * sw2; });
      const bt = (t + 1.3) % 4.6, blink = bt < 0.16 ? Math.sin(bt / 0.16 * Math.PI) : (bt > 2.2 && bt < 2.32 ? Math.sin((bt - 2.2) / 0.12 * Math.PI) : 0);
      (A.lids || []).forEach((l) => { l.scale.y = Math.max(0.02, blink * 1.0); });
      A.headPivot.rotation.x += Math.sin(t * 0.55) * 0.012 * idle; A.headPivot.rotation.y += Math.sin(t * 0.31 + 1) * 0.02 * idle; A.headPivot.rotation.z = Math.sin(t * 0.43) * 0.015 * idle;
      const L = A.arms[0], Rr = A.arms[1];
      L.sh.rotation.x = -Math.sin(ph) * 0.45 * walk + 0.1; L.el.rotation.x = 0.32 + Math.max(0, Math.sin(ph)) * 0.3 * walk + 0.02 * br; L.sh.rotation.z = 0.06;
      const k = A.reach;
      Rr.sh.rotation.x = lerp(Math.sin(ph) * 0.45 * walk + 0.1, Math.PI / 2 + clamp(pitch, -1.2, 0.4) * 0.95 + 0.08, k);
      Rr.sh.rotation.z = lerp(-0.06, -0.3, k); Rr.el.rotation.x = lerp(0.32, 0.42, k); Rr.curl(0.25 + k * 0.55);
      A.torso.scale.set(1 + br * 0.006, 1 + br * 0.004, 0.64 + br * 0.004 * 0.64);
    };
    A.dress(false);
    return A;
  };
})();
