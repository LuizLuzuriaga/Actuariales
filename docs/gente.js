/* gente.js — la multitud compartida por todos los niveles: la misma gente que el protagonista (cabeza esférica con cruz, cuerpo de losa) con abrigos
   oscuros, mochilas y gorras. Todo en tres mallas fusionadas (cuerpos, contorno, cruces). Sombreado toon con una sola luz: con varios focos, el toon
   de Three.js calcula un escalón por foco y las cabezas se llenan de facetas. */
(() => {
  const Q = window.QX;
  const MG = THREE.BufferGeometryUtils;

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
  const crowdMat = () => new THREE.ShaderMaterial({ vertexColors: true, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { L: { value: new THREE.Vector3(0.3, 0.9, -0.35).normalize() } }]),
    vertexShader: 'varying vec3 vN; varying vec3 vC;\n#include <fog_pars_vertex>\nvoid main(){ vN = normalize(mat3(modelMatrix) * normal); vC = color; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: 'uniform vec3 L; varying vec3 vN; varying vec3 vC;\n#include <fog_pars_fragment>\nvoid main(){ float d = dot(normalize(vN), L) * 0.5 + 0.5; float s = d < 0.42 ? 0.5 : (d < 0.7 ? 0.78 : 1.02); gl_FragColor = vec4(vC * s * 1.15, 1.0);\n#include <fog_fragment>\n}' });

  Q.toonKit = { scaled, ellipsoid, slab, paint, inkMat, crowdMat };

  /* spots: [[x, z], …] sobre el suelo (y = 0). Devuelve { group, obst, count }.
     opts: seed, yaw(R) → giro de cada persona (por defecto: casi todos mirando a −z), floorY. */
  Q.buildCrowd = (spots, opts = {}) => {
    const R = Q.rng(opts.seed || 88), heads = [], bodies = [], feet = [], crosses = [], obst = [];
    const yawOf = opts.yaw || ((r) => (r() < 0.8 ? 0 : r() * Math.PI * 2) + (r() - 0.5) * 0.8);
    const arcTube = (pts) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.008, 5, false);
    const COATS = [[0.12, 0.13, 0.16], [0.2, 0.17, 0.15], [0.1, 0.12, 0.2], [0.27, 0.27, 0.26], [0.16, 0.2, 0.15], [0.3, 0.22, 0.14], [0.08, 0.08, 0.1], [0.14, 0.12, 0.17], [0.7, 0.34, 0.1], [0.5, 0.46, 0.38]];
    spots.forEach(([x, z]) => {
      const s = 0.9 + R() * 0.16, yaw = yawOf(R), m = new THREE.Matrix4().compose(new THREE.Vector3(x, opts.floorY || 0, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(s, s, s));
      const Z = opts.zombie, AM = opts.amor, cl = AM ? [0.16, 0.3, 0.26] : Z ? [0.28, 0.33, 0.29] : COATS[(R() < 0.12 ? 8 + (R() * 2 | 0) : (R() * 8 | 0))], sh = 0.85 + R() * 0.3, hs = 0.5 + R() * 0.22;
      const h = ellipsoid(0.28, 0.31, 0.25, 18).translate(0, 1.45, 0); if (Z) paint(h, 0.1, 0.42, 0.14); else paint(h, hs, hs, hs * 1.03); heads.push(h.applyMatrix4(m));
      const b = slab(1.02, 0.235, 0.255, 0.62).translate(0, 0.14, 0); paint(b, cl[0] * sh, cl[1] * sh, cl[2] * sh); bodies.push(b.applyMatrix4(m));
      if (R() < 0.5) { const k = R(), bp = ellipsoid(0.19, 0.27, 0.1, 14).translate(0, 0.78, 0.26); paint(bp, 0.08 + k * 0.1, 0.08 + k * 0.08, 0.1 + k * 0.1); bodies.push(bp.applyMatrix4(m)); const sp = ellipsoid(0.12, 0.1, 0.07, 10).translate(0, 0.5, 0.31); paint(sp, 0.07, 0.07, 0.08); bodies.push(sp.applyMatrix4(m)); }
      else if (R() < 0.4) { const bg = ellipsoid(0.15, 0.12, 0.07, 12).translate(0.3, 0.52, 0.02); paint(bg, 0.3, 0.2, 0.12); bodies.push(bg.applyMatrix4(m)); }
      if (R() < 0.3) { const cap = ellipsoid(0.295, 0.15, 0.265, 16).translate(0, 1.6, -0.01); paint(cap, 0.1, 0.11, 0.14); heads.push(cap.applyMatrix4(m)); const br = ellipsoid(0.2, 0.025, 0.14, 10).translate(0, 1.55, -0.24); paint(br, 0.09, 0.1, 0.12); heads.push(br.applyMatrix4(m)); }
      if (AM) {                                                                                 // Amor: pelo oscuro y largo, ojos verdes
        const add2 = (geo, c, arr) => { paint(geo, c[0], c[1], c[2]); arr.push(geo.applyMatrix4(m)); };
        add2(ellipsoid(0.31, 0.27, 0.3, 14).translate(0, 1.55, 0.04), [0.04, 0.03, 0.04], heads); add2(ellipsoid(0.27, 0.42, 0.12, 12).translate(0, 1.2, 0.2), [0.04, 0.03, 0.04], heads);
        [-1, 1].forEach((k) => { add2(ellipsoid(0.05, 0.04, 0.02, 8).translate(0.1 * k, 1.46, -0.255), [0.95, 0.95, 0.95], heads); add2(ellipsoid(0.028, 0.028, 0.02, 8).translate(0.1 * k, 1.46, -0.268), [0.1, 0.65, 0.4], heads); });
        add2(ellipsoid(0.07, 0.018, 0.02, 8).translate(0, 1.36, -0.255), [0.65, 0.2, 0.25], heads);
      }
      if (Z) {                                                                                  // infectado: cabeza verde, boca abierta con dientes y sangre, abrigo manchado, puños verdes
        const add = (geo, c, arr) => { paint(geo, c[0], c[1], c[2]); arr.push(geo.applyMatrix4(m)); };
        add(ellipsoid(0.13, 0.095, 0.05, 12).translate(0, 1.35, -0.225), [0.62, 0.05, 0.06], heads);
        for (let i = -3; i <= 3; i++) { add(ellipsoid(0.014, 0.034, 0.012, 6).translate(i * 0.036, 1.395, -0.262), [0.93, 0.93, 0.88], heads); add(ellipsoid(0.014, 0.03, 0.012, 6).translate(i * 0.036, 1.31, -0.262), [0.93, 0.93, 0.88], heads); }
        for (let i = 0; i < 4; i++) add(ellipsoid(0.04 + R() * 0.04, 0.04 + R() * 0.04, 0.02, 8).translate((R() - 0.5) * 0.4, 1.35 + R() * 0.3, -0.24), [0.55, 0.04, 0.06], heads);
        for (let i = 0; i < 5; i++) add(ellipsoid(0.04 + R() * 0.05, 0.05 + R() * 0.08, 0.02, 8).translate((R() - 0.5) * 0.36, 0.35 + R() * 0.8, -0.265), [0.1, 0.42, 0.14], bodies);
        [-1, 1].forEach((k) => { add(ellipsoid(0.055, 0.22, 0.055, 8).translate(0.27 * k, 0.95, -0.12), [0.1, 0.4, 0.14], bodies); add(ellipsoid(0.095, 0.085, 0.1, 10).translate(0.27 * k, 0.72, -0.2), [0.12, 0.5, 0.16], bodies); });
      }
      [-1, 1].forEach((k) => { const f = ellipsoid(0.1, 0.055, 0.13, 8).translate(0.1 * k, 0.05, -0.02); paint(f, 0.05, 0.05, 0.06); feet.push(f.applyMatrix4(m)); });
      const hp = [], vp = []; for (let a = -0.5; a <= 0.5; a += 0.125) hp.push(new THREE.Vector3(0.285 * Math.sin(a), 1.42, -0.255 * Math.cos(a) - 0.004));
      for (let a = -0.5; a <= 0.55; a += 0.13) vp.push(new THREE.Vector3(0, 1.45 + 0.315 * Math.sin(a), -0.255 * Math.cos(a) - 0.004));
      if (!AM) { crosses.push(arcTube(hp).applyMatrix4(m)); if (!Z) crosses.push(arcTube(vp).applyMatrix4(m)); }
      obst.push({ minX: x - 0.25 * s, maxX: x + 0.25 * s, minZ: z - 0.25 * s, maxZ: z + 0.25 * s });
    });
    const strip = (arr) => arr.map((g) => { const n = new THREE.BufferGeometry(); n.setAttribute('position', g.attributes.position); n.setAttribute('normal', g.attributes.normal); if (g.attributes.color) n.setAttribute('color', g.attributes.color); n.setIndex(g.index); return n; });
    const group = new THREE.Group(), bodyGeo = MG.mergeBufferGeometries(strip([].concat(heads, bodies, feet)));
    group.add(new THREE.Mesh(bodyGeo, crowdMat()));
    group.add(new THREE.Mesh(bodyGeo, inkMat(0.018)));
    if (crosses.length) group.add(new THREE.Mesh(MG.mergeBufferGeometries(strip(crosses)), new THREE.MeshBasicMaterial({ color: 0x050506 })));
    return { group, obst, count: spots.length };
  };
})();
