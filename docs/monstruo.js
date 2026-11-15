/* monstruo.js — la entidad de la planta 4: una bacteria enorme y negra, de cuerpo poligonal (facetas planas, cristales por fuera) y muchas patas de dos
   tramos con garras, que se cruzan entre sí con alambres finos. Se mueve a saltitos, con un brillo rojo apenas visible debajo y una sombra que se arrastra. */
(() => {
  const Q = window.QX;
  Q.buildBacteria = () => {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x040404, roughness: 0.35, metalness: 0.45, flatShading: true });
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), mat); body.position.y = 1.35; body.scale.set(1.05, 1.15, 1.05); g.add(body);
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.05, 0), mat); core.position.y = 1.35; core.scale.set(1, 0.7, 1); g.add(core);
    const rnd = Q.rng(66);
    // cristales negros que sobresalen del cuerpo
    const spikes = []; for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(0.1 + rnd() * 0.08, 0.7 + rnd() * 0.7, 4), mat); const a = rnd() * 6.28, e = (rnd() - 0.3) * 1.5; const dir = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)).normalize(); s.position.set(dir.x * 0.8, 1.35 + dir.y * 0.9, dir.z * 0.8); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); g.add(s); spikes.push(s); }
    const N = 20, seg = new THREE.CylinderGeometry(0.035, 0.065, 1, 5).translate(0, 0.5, 0), claw = new THREE.ConeGeometry(0.06, 0.4, 4).translate(0, 0.2, 0), limbs = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.3, up = 0.1 + rnd() * 0.9, L1 = 1.0 + rnd() * 0.6, L2 = 1.4 + rnd() * 0.8;
      const root = new THREE.Group(); root.position.set(Math.cos(a) * 0.55, 1.35 + (rnd() - 0.4) * 0.6, Math.sin(a) * 0.55); root.rotation.y = -a; g.add(root);
      const j1 = new THREE.Group(); root.add(j1); const s1 = new THREE.Mesh(seg, mat); s1.scale.y = L1; j1.add(s1);
      const j2 = new THREE.Group(); j2.position.y = L1; j1.add(j2); const s2 = new THREE.Mesh(seg, mat); s2.scale.set(0.8, L2, 0.8); j2.add(s2);
      const tip = new THREE.Object3D(); tip.position.y = L2; j2.add(tip); const cl = new THREE.Mesh(claw, mat); cl.position.y = L2; j2.add(cl);
      limbs.push({ j1, j2, tip, b1: -(Math.PI / 2 - up), b2: -(0.9 + rnd() * 0.8), ph: rnd() * 6.28, sp: 4 + rnd() * 6 });
    }
    // alambre: cada punta se une con otras tres
    const pairs = []; for (let i = 0; i < N; i++) { pairs.push([i, (i + 3) % N], [i, (i + 7) % N], [i, (i + 9) % N]); }
    const lg = new THREE.BufferGeometry(); const pos = new Float32Array(pairs.length * 6); lg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x7a8076 })); lines.frustumCulled = false; g.add(lines);
    // sombra que se arrastra y un resplandor rojo bajo el cuerpo
    const sh = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; g.add(sh);
    const glow = new THREE.PointLight(0xff2418, 0.9, 5, 2); glow.position.y = 0.4; g.add(glow);
    const v = new THREE.Vector3(), tips = limbs.map(() => new THREE.Vector3());
    const update = (t, rage = 1) => {
      body.position.y = 1.35 + Math.sin(t * 6 * rage) * 0.07; core.position.y = body.position.y; body.rotation.y = t * 0.6; core.rotation.y = -t * 0.9;
      const j = 1 + Math.sin(t * 23) * Math.sin(t * 7.3) * 0.05 * rage; body.scale.set(1.05 * j, 1.15 / j, 1.05 * j);
      spikes.forEach((s, i) => { s.scale.y = 1 + Math.sin(t * 9 * rage + i) * 0.15; });
      glow.intensity = 0.7 + Math.sin(t * 5) * 0.3;
      limbs.forEach((l) => { l.j1.rotation.z = l.b1 + Math.sin(t * l.sp * rage + l.ph) * 0.24; l.j2.rotation.z = l.b2 + Math.cos(t * l.sp * rage + l.ph) * 0.34; });
      g.updateMatrixWorld(true);
      limbs.forEach((l, i) => { l.tip.getWorldPosition(v); g.worldToLocal(tips[i].copy(v)); });
      pairs.forEach(([a, b], k) => { pos.set([tips[a].x, tips[a].y, tips[a].z, tips[b].x, tips[b].y, tips[b].z], k * 6); }); lg.attributes.position.needsUpdate = true;
    };
    g.scale.setScalar(1.3); update(0);
    return { group: g, update };
  };
})();
