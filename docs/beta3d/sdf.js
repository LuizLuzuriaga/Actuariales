/* sdf.js — escultura con campos de distancia: primitivas, uniones suaves y una malla de «surface nets» con normales y color por vértice.
   Sirve para modelar el cuerpo como superficies orgánicas continuas en vez de piezas apiladas. */
(() => {
  const Q = window.QX;
  const S = Q.sdf = {};
  const H = Math.hypot;

  S.sphere = (x, y, z, cx, cy, cz, r) => H(x - cx, y - cy, z - cz) - r;
  S.ell = (x, y, z, cx, cy, cz, rx, ry, rz) => {                       // elipsoide (distancia aproximada, buena cerca de la superficie)
    const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
    const k0 = H(px, py, pz); if (k0 < 1e-6) return -Math.min(rx, ry, rz);
    const k1 = H(px / rx, py / ry, pz / rz);
    return k0 * (k0 - 1) / Math.max(k1, 1e-6);
  };
  S.cone = (x, y, z, ax, ay, az, bx, by, bz, ra, rb) => {              // cápsula con radios distintos
    const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
    const baba = bax * bax + bay * bay + baz * baz;
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / baba));
    return H(pax - bax * h, pay - bay * h, paz - baz * h) - (ra + (rb - ra) * h);
  };
  S.box = (x, y, z, cx, cy, cz, hx, hy, hz, r) => {                    // caja redondeada
    const qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r, qz = Math.abs(z - cz) - hz + r;
    return H(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  };
  S.smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  S.smax = (a, b, k) => -S.smin(-a, -b, k);
  S.ss = (a, b, t) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
  S.hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  S.lin = (hex) => [Math.pow(((hex >> 16) & 255) / 255, 2.2), Math.pow(((hex >> 8) & 255) / 255, 2.2), Math.pow((hex & 255) / 255, 2.2)];
  S.mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  /* Malla a partir de un campo de distancia f(x,y,z) < 0 dentro. Devuelve BufferGeometry con position, normal, uv y color. */
  S.mesh = (f, min, max, cell, colorFn, uvScale = 7) => {
    const nx = Math.ceil((max[0] - min[0]) / cell) + 1, ny = Math.ceil((max[1] - min[1]) / cell) + 1, nz = Math.ceil((max[2] - min[2]) / cell) + 1;
    const id = (i, j, k) => i + nx * (j + ny * k);
    const val = new Float32Array(nx * ny * nz);
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) val[id(i, j, k)] = f(min[0] + i * cell, min[1] + j * cell, min[2] + k * cell);
    const cellV = new Int32Array(nx * ny * nz).fill(-1);
    const P = [], C = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]];
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      let mask = 0; const v = [];
      for (let c = 0; c < 8; c++) { const a = val[id(i + C[c][0], j + C[c][1], k + C[c][2])]; v.push(a); if (a < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [a, b] of E) {
        if ((v[a] < 0) === (v[b] < 0)) continue;
        const t = v[a] / (v[a] - v[b]);
        sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t; n++;
      }
      cellV[id(i, j, k)] = P.length / 3;
      P.push(min[0] + (i + sx / n) * cell, min[1] + (j + sy / n) * cell, min[2] + (k + sz / n) * cell);
    }
    // caras: una por cada arista de la rejilla que cruza la superficie
    const idx = [];
    const quad = (a, b, c, d, inside) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (inside) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c); };
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = val[id(i, j, k)] < 0;
      if (i < nx - 1 && j > 0 && k > 0 && j < ny - 1 && k < nz - 1 && a !== (val[id(i + 1, j, k)] < 0)) quad(cellV[id(i, j - 1, k - 1)], cellV[id(i, j, k - 1)], cellV[id(i, j, k)], cellV[id(i, j - 1, k)], a);
      if (j < ny - 1 && i > 0 && k > 0 && i < nx - 1 && k < nz - 1 && a !== (val[id(i, j + 1, k)] < 0)) quad(cellV[id(i - 1, j, k - 1)], cellV[id(i - 1, j, k)], cellV[id(i, j, k)], cellV[id(i, j, k - 1)], a);
      if (k < nz - 1 && i > 0 && j > 0 && i < nx - 1 && j < ny - 1 && a !== (val[id(i, j, k + 1)] < 0)) quad(cellV[id(i - 1, j - 1, k)], cellV[id(i, j - 1, k)], cellV[id(i, j, k)], cellV[id(i - 1, j, k)], a);
    }
    // proyección sobre la superficie y normales por gradiente
    const e = cell * 0.5, count = P.length / 3, N = new Float32Array(count * 3), COL = new Float32Array(count * 3), UV = new Float32Array(count * 2);
    const grad = (x, y, z, out) => { out[0] = f(x + e, y, z) - f(x - e, y, z); out[1] = f(x, y + e, z) - f(x, y - e, z); out[2] = f(x, y, z + e) - f(x, y, z - e); const l = H(out[0], out[1], out[2]) || 1; out[0] /= l; out[1] /= l; out[2] /= l; };
    const g = [0, 0, 0];
    for (let v = 0; v < count; v++) {
      let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
      for (let it = 0; it < 2; it++) { const d = f(x, y, z); grad(x, y, z, g); x -= d * g[0] * 0.9; y -= d * g[1] * 0.9; z -= d * g[2] * 0.9; }
      grad(x, y, z, g);
      P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z; N[v * 3] = g[0]; N[v * 3 + 1] = g[1]; N[v * 3 + 2] = g[2];
      const c = colorFn ? colorFn(x, y, z, g) : [1, 1, 1];
      COL[v * 3] = c[0]; COL[v * 3 + 1] = c[1]; COL[v * 3 + 2] = c[2];
      const ax = Math.abs(g[0]), ay = Math.abs(g[1]), az = Math.abs(g[2]);          // uv planares según el eje dominante
      if (ay >= ax && ay >= az) { UV[v * 2] = x * uvScale; UV[v * 2 + 1] = z * uvScale; } else if (ax >= az) { UV[v * 2] = z * uvScale; UV[v * 2 + 1] = y * uvScale; } else { UV[v * 2] = x * uvScale; UV[v * 2 + 1] = y * uvScale; }
    }
    // orientación: la normal geométrica debe coincidir con el gradiente
    let flip = 0, tot = 0;
    for (let t = 0; t < Math.min(idx.length, 600); t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx2 = uy * vz - uz * vy, ny2 = uz * vx - ux * vz, nz2 = ux * vy - uy * vx;
      const d = nx2 * N[a] + ny2 * N[a + 1] + nz2 * N[a + 2]; if (d < 0) flip++; tot++;
    }
    if (flip > tot / 2) for (let t = 0; t < idx.length; t += 3) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(COL, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    return geo;
  };
})();
