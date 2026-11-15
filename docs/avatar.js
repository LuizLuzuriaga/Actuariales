/* avatar.js — el protagonista, nivel 0 (estilo Madness Combat): cabeza elipsoide con una cruz, cuerpo de losa alta,
   manos y pies que flotan. Sombreado toon de 3 escalones + contorno negro: parece 2D, pero es 3D (sombras, espejo, luces).
   Mismo contrato que la versión detallada (guardada en avatar.detallado.js.bak): group, headPivot, arms, legs, dress, carry, reach, update. */
(() => {
  const Q = window.QX;
  const { rbox, clamp, lerp } = Q;
  Q.EYE = 1.45;

  Q.buildAvatar = (scene /*, { high } */) => {
    const A = {};
    const avatar = new THREE.Group(); scene.add(avatar); A.group = avatar;
    const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };

    /* ---- sombreado toon: 3 escalones de luz ---- */
    const ramp = new THREE.DataTexture(new Uint8Array([22, 22, 22, 255, 52, 52, 52, 255, 92, 92, 92, 255]), 3, 1, THREE.RGBAFormat);
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.generateMipmaps = false; ramp.needsUpdate = true;
    const toonMat = (color, extra = {}) => { const m = new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: ramp }, extra)); m.emissive.set(color); m.emissiveIntensity = 0.06; return m; };   // un poco de emisión para que se lea de noche

    /* ---- contorno: casco invertido empujado a lo largo de las normales ---- */
    const inkMat = (w) => new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { w: { value: w } },
      vertexShader: 'uniform float w; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * w, 1.0); }',
      fragmentShader: 'void main(){ gl_FragColor = vec4(0.02, 0.02, 0.025, 1.0); }' });

    /* ---- geometría: la escala se aplica a los vértices (y las normales con la inversa) para que el contorno mida lo mismo en todos los lados ---- */
    const scaled = (geo, sx, sy, sz) => {
      const p = geo.attributes.position, n = geo.attributes.normal;
      for (let i = 0; i < p.count; i++) {
        p.setXYZ(i, p.getX(i) * sx, p.getY(i) * sy, p.getZ(i) * sz);
        const nx = n.getX(i) / sx, ny = n.getY(i) / sy, nz = n.getZ(i) / sz, l = Math.hypot(nx, ny, nz) || 1;
        n.setXYZ(i, nx / l, ny / l, nz / l);
      }
      p.needsUpdate = n.needsUpdate = true; geo.computeBoundingSphere(); return geo;
    };
    const ellipsoid = (rx, ry, rz) => scaled(new THREE.SphereGeometry(1, 32, 20), rx, ry, rz);
    const slab = (h, rBot, rTop, depth) => {                                  // losa alta de arriba redondeada, abajo casi plana
      const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(rBot * 0.82, 0), new THREE.Vector2(rBot, 0.025)];
      for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push(new THREE.Vector2(rTop * Math.cos(a), h - rTop * 0.55 + Math.sin(a) * rTop * 0.55)); }
      return scaled(new THREE.LatheGeometry(pts, 32), 1, 1, depth);
    };
    const put = (parent, geo, material, x = 0, y = 0, z = 0, ink = 0.014) => {
      const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m);
      if (ink) { const o = new THREE.Mesh(geo, inkMat(ink)); o.castShadow = false; o.receiveShadow = false; m.add(o); }
      return m;
    };
    const hull = (m, k = 1.07) => { const o = new THREE.Mesh(m.geometry, new THREE.MeshBasicMaterial({ color: 0x050506, side: THREE.BackSide })); o.scale.setScalar(k); m.add(o); };  // contorno para cajas

    /* ---- materiales ---- */
    const headM = toonMat(0xffffff);
    { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
      g.fillStyle = '#9a9a9f'; g.fillRect(0, 0, 1024, 512);
      g.strokeStyle = '#08080a'; g.lineWidth = 19; g.lineCap = 'round';                // la cruz, de frente (u = 0.75 en una esfera de Three.js = eje -Z)
      g.beginPath(); g.moveTo(768 - 105, 232); g.lineTo(768 + 105, 232); g.moveTo(768 - 6, 232 - 90); g.lineTo(768 - 6, 232 + 90); g.stroke();
      const t = new THREE.CanvasTexture(c); t.anisotropy = 4; headM.map = t; headM.emissiveMap = t; }
    const top = toonMat(0x626266);                                                    // cuerpo
    const handM = toonMat(0x85858a);
    const shoeM = toonMat(0x2e2e32), slipM = toonMat(0x55555a);
    A.mats = { top, pants: shoeM, skin: headM };

    /* ================= Cabeza (origen = centro de la cabeza; solo se ve en el espejo) ================= */
    const headPivot = grp(avatar, 0, 1.33, 0); headPivot.rotation.order = 'YXZ'; A.headPivot = headPivot;
    const head = grp(headPivot, 0, 0.12, 0);
    put(head, ellipsoid(0.28, 0.31, 0.25), headM, 0, 0, 0, 0.026);
    head.traverse((o) => { if (o.isMesh) o.layers.set(1); });
    A.lids = [];                                                                       // sin ojos que parpadeen

    /* ================= Cuerpo: una losa, sin cuello ni cintura ================= */
    A.torso = put(avatar, slab(1.02, 0.235, 0.255, 0.62), top, 0, 0.14, 0, 0.026);
    A.pelvis = grp(avatar, 0, 0.9, 0);                                                 // solo existe para el balanceo
    const collar = grp(avatar); collar.visible = false; A.collar = collar;
    A.buttons = grp(avatar); A.buttons.visible = false;

    /* ================= Manos que flotan (sin brazos) ================= */
    const handGeo = ellipsoid(0.09, 0.08, 0.075), thumbGeo = ellipsoid(0.04, 0.045, 0.042);
    A.arms = []; A.hands = [];
    [-1, 1].forEach((s) => {
      const sh = grp(avatar, 0.37 * s, 1.08, 0);
      const el = grp(sh, 0, -0.3, 0);
      const wrist = grp(el, 0, -0.27, 0);
      const hand = grp(wrist, 0, -0.04, 0); hand.rotation.x = -0.1; hand.rotation.z = 0.12 * s;
      put(hand, handGeo, handM, 0, 0, 0, 0.02);
      put(hand, thumbGeo, handM, -0.075 * s, 0.012, -0.04, 0.016);
      A.arms.push({ sh, el, hand, wrist, curl: () => { } }); A.hands.push(hand);
    });

    /* ================= Pies que flotan (sin piernas) ================= */
    const footGeo = ellipsoid(0.125, 0.065, 0.18);
    A.legs = []; A.shoes = []; A.slippers = [];
    [-1, 1].forEach((s) => {
      const hip = grp(avatar, 0.1 * s, 0.93, 0);
      const knee = grp(hip, 0, -0.42, 0);
      const ankle = grp(knee, 0, -0.43, 0);
      const shoe = grp(ankle, 0, -0.01, -0.03); put(shoe, footGeo, shoeM, 0, 0, 0, 0.02);
      const slip = grp(ankle, 0, -0.01, -0.03); put(slip, footGeo, slipM, 0, 0, 0, 0.02);
      A.legs.push({ hip, knee, ankle }); A.shoes.push(shoe); A.slippers.push(slip);
    });

    /* ================= Mochila y bolso: cajas lisas ================= */
    const black = toonMat(0x1d1d21), brown = toonMat(0x6b4426);
    const pack = grp(avatar); pack.visible = false; A.pack = pack;
    { const m = new THREE.Mesh(rbox(0.34, 0.5, 0.17, 0.06, 4), black); m.position.set(0, 0.82, 0.2); m.castShadow = true; hull(m); pack.add(m); }
    const bagG = grp(avatar); bagG.visible = false; A.bagG = bagG;
    { const m = new THREE.Mesh(rbox(0.28, 0.2, 0.1, 0.03, 4), brown); m.position.set(-0.42, 0.6, 0.0); m.castShadow = true; hull(m); bagG.add(m); }

    /* ================= Estados y animación ================= */
    A.dress = (on) => {                                                                // pijama = gris claro; vestido = gris oscuro
      top.color.setHex(on ? 0x3c3c41 : 0x77777c); top.emissive.copy(top.color);
      A.shoes.forEach((s) => { s.visible = on; }); A.slippers.forEach((s) => { s.visible = !on; });
    };
    A.carry = () => { pack.visible = true; bagG.visible = true; };
    A.reach = 0;                                                                       // 0..1: mano derecha extendida
    A.update = (dt, t, walk, pitch) => {
      const ph = t * 8.5, sw = Math.sin(ph) * 0.55 * walk, step = Math.abs(Math.sin(ph));
      A.legs[0].hip.rotation.x = sw; A.legs[1].hip.rotation.x = -sw;
      A.legs[0].knee.rotation.x = Math.max(0, -Math.sin(ph + 1.2)) * 0.5 * walk; A.legs[1].knee.rotation.x = Math.max(0, Math.sin(ph + 1.2)) * 0.5 * walk;
      const idle = 1 - Math.min(1, walk * 2.2), sw2 = Math.sin(t * 0.37) * idle, br = Math.sin(t * 1.6);
      // rebote de caricatura: el cuerpo se estira al andar y se aplasta al apoyar
      const bob = step * 0.035 * walk;
      A.torso.position.y = 0.14 + bob; A.headPivot.position.y = 1.33 + bob * 1.4;
      A.torso.scale.set(1 + (0.03 - step * 0.05) * walk + br * 0.006, 1 + (step * 0.04 - 0.01) * walk + br * 0.005, 1 + br * 0.004);
      A.torso.rotation.z = -0.02 * sw2 + Math.sin(ph) * 0.05 * walk; A.torso.rotation.x = 0.05 * walk;
      A.pelvis.rotation.z = 0.025 * sw2;
      A.headPivot.rotation.x += Math.sin(t * 0.55) * 0.012 * idle; A.headPivot.rotation.y += Math.sin(t * 0.31 + 1) * 0.02 * idle; A.headPivot.rotation.z = Math.sin(t * 0.43) * 0.015 * idle + Math.sin(ph) * 0.04 * walk;
      const L = A.arms[0], Rr = A.arms[1];
      L.sh.rotation.x = -Math.sin(ph) * 0.45 * walk + 0.1; L.el.rotation.x = 0.32 + Math.max(0, Math.sin(ph)) * 0.3 * walk + 0.02 * br; L.sh.rotation.z = 0.06;
      const k = A.reach;
      Rr.sh.rotation.x = lerp(Math.sin(ph) * 0.45 * walk + 0.1, Math.PI / 2 + clamp(pitch, -1.2, 0.4) * 0.95 + 0.08, k);
      Rr.sh.rotation.z = lerp(-0.06, -0.3, k); Rr.el.rotation.x = lerp(0.32, 0.42, k);
    };
    A.dress(false);
    return A;
  };
})();
