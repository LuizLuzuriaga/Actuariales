/* monstruo.js — la entidad de la planta 4, fiel a la referencia: una cabeza negra y poligonal, achatada, sostenida en lo alto por unas patas larguísimas y finísimas
   que se abren como un trípode, un tallo retorcido que cuelga del centro y bifurca al final, y zarcillos que se enroscan alrededor de la cabeza. Negro puro,
   sin brillo: solo silueta. Camina con zancadas de zancos y el tallo ondula como una liana. */
(() => {
  const Q = window.QX;
  Q.buildBacteria = () => {
    const g = new THREE.Group();
    const black = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const rnd = Q.rng(66), HY = 4.1;
    const segGeo = (r0, r1, L) => new THREE.CylinderGeometry(r0, r1, L, 5).translate(0, -L / 2, 0);   // cuelga hacia abajo desde su articulación

    /* cabeza: un polígono achatado e irregular, con un brillo mínimo en las aristas */
    const hg = new THREE.CylinderGeometry(0.5, 0.62, 0.44, 9, 1); { const p = hg.attributes.position; for (let i = 0; i < p.count; i++) { p.setX(i, p.getX(i) * (0.92 + rnd() * 0.16)); p.setZ(i, p.getZ(i) * (0.92 + rnd() * 0.16)); p.setY(i, p.getY(i) + (rnd() - 0.5) * 0.06); } hg.computeVertexNormals(); }
    const head = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: 0x030303, roughness: 0.35, metalness: 0.4, flatShading: true })); head.position.y = HY; head.rotation.z = 0.08; g.add(head);

    /* cadena articulada: n tramos colgando; devuelve sus articulaciones para ondularlas */
    const chain = (parent, n, len, r0, r1) => {
      const L = len / n, js = []; let p = parent;
      for (let i = 0; i < n; i++) { const j = new THREE.Group(); if (i) j.position.y = -L; p.add(j); const r = r0 + (r1 - r0) * (i / n), r2 = r0 + (r1 - r0) * ((i + 1) / n); const m = new THREE.Mesh(segGeo(r, r2, L), black); j.add(m); js.push(j); p = j; }
      return js;
    };
    const fork = (js, spread) => { const last = js[js.length - 1]; [-1, 1].forEach((s) => { const a = new THREE.Group(); a.position.y = -0.0; last.add(a); const gj = new THREE.Group(); gj.position.y = -(0.7 / js.length); a.add(gj); const m = new THREE.Mesh(segGeo(0.025, 0.012, 0.35), black); gj.add(m); gj.rotation.z = s * spread; }); };

    /* cuatro patas de zancos que se abren desde debajo de la cabeza */
    const legs = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.5, root = new THREE.Group(); root.position.set(Math.cos(a) * 0.35, HY - 0.15, Math.sin(a) * 0.35); root.rotation.y = -a; g.add(root);
      const js = chain(root, 6, 4.2, 0.05, 0.022); fork(js, 0.35);
      legs.push({ js, ph: i * Math.PI / 2 + (i % 2 ? Math.PI : 0), base: [0.92, -0.38, -0.25, -0.1, -0.12, -0.1] });
    }
    /* tallo retorcido que cuelga del centro, con una bifurcación al final */
    const stalkRoot = new THREE.Group(); stalkRoot.position.set(0.05, HY - 0.25, 0); g.add(stalkRoot);
    const stalk = chain(stalkRoot, 10, 3.0, 0.085, 0.04);
    const bif = [-1, 1].map((s) => { const r = new THREE.Group(); stalk[9].add(r); r.position.y = -0.3; return { js: chain(r, 4, 0.95, 0.035, 0.018), s }; });
    /* zarcillos enroscados alrededor de la cabeza + un par de aros */
    const tend = [];
    for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.4, r = new THREE.Group(); r.position.set(Math.cos(a) * 0.5, HY - 0.05 + rnd() * 0.1, Math.sin(a) * 0.5); r.rotation.y = -a; r.rotation.x = Math.PI / 2; g.add(r); tend.push({ js: chain(r, 8, 1.7, 0.03, 0.012), ph: rnd() * 6, k: 0.55 + rnd() * 0.25 }); }
    [[0.62, 0.5], [0.45, -0.4]].forEach(([R, tilt], i) => { const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.028, 5, 20), black); ring.position.y = HY - 0.02 + i * 0.12; ring.rotation.set(Math.PI / 2 + tilt * 0.3, 0, tilt); g.add(ring); });
    /* sombra sobre la moqueta */
    const sh = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; g.add(sh);

    const update = (t, rage = 1) => {
      head.position.y = HY + Math.sin(t * 5 * rage) * 0.06; head.rotation.y = Math.sin(t * 1.3) * 0.3;
      legs.forEach((l) => { const w = t * 4.2 * rage + l.ph; l.js.forEach((j, k) => { j.rotation.z = l.base[k] + (k < 2 ? Math.sin(w) * 0.2 * (k ? -0.6 : 1) : Math.sin(w + k * 0.5) * 0.03); j.rotation.x = k === 1 ? Math.cos(w) * 0.16 : 0; }); });
      stalk.forEach((j, i) => { j.rotation.z = Math.sin(i * 0.95 + t * 1.7 * rage) * 0.42 + 0.08; j.rotation.x = Math.cos(i * 0.8 + t * 1.3 * rage) * 0.38; });
      bif.forEach((b) => b.js.forEach((j, i) => { j.rotation.z = b.s * (i ? 0.1 : 0.55) + Math.sin(t * 2.4 + i) * 0.08; }));
      tend.forEach((d) => d.js.forEach((j, i) => { j.rotation.z = d.k + Math.sin(t * 2.2 * rage + d.ph + i * 0.4) * 0.12; }));
    };
    g.scale.setScalar(0.62); update(0);
    return { group: g, update };
  };
})();
