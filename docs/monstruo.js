/* monstruo.js — la entidad de la planta 4: una especie de bacteria enorme y negra, de cuerpo poligonal (facetas planas) y patas de dos tramos que
   se cruzan entre sí con líneas finas, como un alambre que une las puntas. Se mueve a saltitos, con las patas ondulando. */
(() => {
  const Q = window.QX;
  Q.buildBacteria = () => {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.4, metalness: 0.35, flatShading: true });
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 1), mat); body.position.y = 1.3; body.scale.set(1, 1.18, 1); g.add(body);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), mat); core.position.y = 1.3; core.scale.set(1, 0.7, 1); g.add(core);      // puntas de cristal alrededor
    const rnd = Q.rng(66), N = 14, seg = new THREE.CylinderGeometry(0.03, 0.055, 1, 5).translate(0, 0.5, 0), limbs = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.3, up = 0.2 + rnd() * 0.7, L1 = 0.9 + rnd() * 0.5, L2 = 1.3 + rnd() * 0.6;
      const root = new THREE.Group(); root.position.set(Math.cos(a) * 0.5, 1.3 + (rnd() - 0.4) * 0.5, Math.sin(a) * 0.5); root.rotation.y = -a; g.add(root);
      const j1 = new THREE.Group(); root.add(j1); const s1 = new THREE.Mesh(seg, mat); s1.scale.y = L1; j1.add(s1);
      const j2 = new THREE.Group(); j2.position.y = L1; j1.add(j2); const s2 = new THREE.Mesh(seg, mat); s2.scale.set(0.8, L2, 0.8); j2.add(s2);
      const tip = new THREE.Object3D(); tip.position.y = L2; j2.add(tip);
      limbs.push({ j1, j2, tip, b1: -(Math.PI / 2 - up), b2: -(0.9 + rnd() * 0.7), ph: rnd() * 6.28, sp: 4 + rnd() * 5 });
    }
    // alambre: cada punta se une con otras dos, y las rodillas con el cuerpo
    const pairs = []; for (let i = 0; i < N; i++) { pairs.push([i, (i + 3) % N], [i, (i + 5) % N]); }
    const lg = new THREE.BufferGeometry(); const pos = new Float32Array(pairs.length * 6); lg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x6a6f66 })); lines.frustumCulled = false; g.add(lines);
    const v = new THREE.Vector3(), tips = limbs.map(() => new THREE.Vector3());
    let t0 = 0;
    const update = (t, rage = 1) => {
      body.position.y = 1.3 + Math.sin(t * 6 * rage) * 0.06; core.position.y = body.position.y; body.rotation.y = t * 0.6; core.rotation.y = -t * 0.9;
      limbs.forEach((l) => { l.j1.rotation.z = l.b1 + Math.sin(t * l.sp * rage + l.ph) * 0.22; l.j2.rotation.z = l.b2 + Math.cos(t * l.sp * rage + l.ph) * 0.3; });
      g.updateMatrixWorld(true);
      limbs.forEach((l, i) => { l.tip.getWorldPosition(v); g.worldToLocal(tips[i].copy(v)); });
      pairs.forEach(([a, b], k) => { pos.set([tips[a].x, tips[a].y, tips[a].z, tips[b].x, tips[b].y, tips[b].z], k * 6); }); lg.attributes.position.needsUpdate = true;
    };
    g.scale.setScalar(1.15); update(0);
    return { group: g, update };
  };
})();
