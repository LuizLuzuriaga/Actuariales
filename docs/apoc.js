/* apoc.js — el apocalipsis jugable (Sol y la cafetería): huir y luchar. Flecha roja al refugio, tres oleadas de infectados (5, 10 y 20; I, II y III en rojo sangre abajo a la
   izquierda), armas que se pueden coger (pistola y escopeta) y disparar con el clic: un disparo mata a cada infectado. F empuja, la silla empuja más. Si abates las tres oleadas
   o llegas al refugio, sobrevives; con las 3 vidas perdidas, te alcanzan. */
(() => {
  const Q = window.QX;
  const S = { on: false };
  const ROMAN = ['', 'I', 'II', 'III'], SIZES = [5, 10, 20], AMMO = { pistola: [8, 14, 24], escopeta: [6, 8, 10] };

  Q.apoc = {
    start(W, cfg) {
      this.stop();
      Object.assign(S, { on: true, W, cfg, lives: 3, inv: 0, cool: 0, shotCool: 0, weapon: S.weapon || false, res: null, t: 0, quip: 0, wave: 1, wait: 0, grace: cfg.grace == null ? 8 : cfg.grace, quips: (cfg.quips || []).slice(), gates: cfg.gates || null });
      S.en = cfg.enemies.map((e) => Object.assign({ stun: 0, dead: true, dying: 0, v0: e.v || 1.8, p0: [e.g.position.x, e.g.position.z] }, e));
      S.el = document.createElement('div'); S.el.id = 'flecha';
      S.el.innerHTML = '<svg viewBox="0 0 60 80" width="54" height="72"><path d="M30 2 L58 40 H40 V78 H20 V40 H2 Z" fill="#c4202c" stroke="#2a0508" stroke-width="3"/></svg><b></b>';
      document.body.appendChild(S.el); S.lab = S.el.querySelector('b');
      S.hud = document.createElement('div'); S.hud.id = 'vidas'; S.hud.innerHTML = '<span class="v"></span><button type="button" class="push">F · Empujar</button><button type="button" class="shoot" hidden>Clic · Disparar</button>'; document.body.appendChild(S.hud);
      S.hud.querySelector('.push').addEventListener('click', () => this.push()); S.hud.querySelector('.shoot').addEventListener('click', () => this.shoot());
      S.frame = document.createElement('div'); S.frame.id = 'apocframe'; S.frame.innerHTML = '<span class="roman" aria-label="Oleada"></span><span class="ammo"></span>'; document.body.appendChild(S.frame);
      S.key = (e) => { if ((e.key === 'f' || e.key === 'F') && !e.repeat) this.push(); }; window.addEventListener('keydown', S.key);
      S.mouse = (e) => { if (e.button === 0 && S.gun) this.shoot(); }; window.addEventListener('mousedown', S.mouse);
      S.tick = (dt, t) => this.tick(dt, t); W.tick.push(S.tick); W.apocOn = true;
      this.spawn(1); this.hud(); if (Q.notify) Q.notify('Alerta', 'Tienes unos segundos antes de que lleguen: busca un arma (pistola o escopeta) y ponte en posición.');
    },
    stop() {
      if (!S.on) return; S.on = false; window.removeEventListener('keydown', S.key); window.removeEventListener('mousedown', S.mouse);
      [S.el, S.hud, S.frame].forEach((n) => n && n.remove());
      if (S.W) { S.W.apocOn = false; const i = S.W.tick.indexOf(S.tick); if (i >= 0) S.W.tick.splice(i, 1); }
    },
    spawn(w) {
      const n = Math.min(SIZES[w - 1], S.en.length);
      S.en.forEach((e, i) => {
        if (i < n) { e.dead = false; e.dying = 0; e.stun = 0; e.v = e.v0 * (1 + 0.06 * (w - 1)); e.g.visible = true; e.g.rotation.set(0, 0, 0); const gp = S.gates ? S.gates[i % S.gates.length] : e.p0; e.g.position.set(gp[0] + ((i * 0.77) % 2.4) - 1.2, 0, gp[1] + ((i * 1.31) % 2.4) - 1.2); }
        else { e.dead = true; e.dying = 0; e.g.visible = false; }
      });
      if (S.gun) S.ammo = AMMO[S.gun][w - 1];
    },
    pick() { S.weapon = true; this.hud(); },
    /* el arma sale de la mesa y vuela hasta ti antes de pasar a tu mano */
    async fly(api, mesh) {
      if (!mesh) return; const P = api.P, p0 = mesh.position.clone(), yaw = P.yaw, tx = P.x - Math.sin(yaw) * 0.45, tz = P.z - Math.cos(yaw) * 0.45;
      if (window.Sound && Sound.on) Sound.click();
      await api.tween(520, (e) => { mesh.position.set(p0.x + (tx - p0.x) * e, p0.y + (1.15 - p0.y) * e + Math.sin(e * Math.PI) * 0.25, p0.z + (tz - p0.z) * e); mesh.rotation.z = e * 1.2; mesh.rotation.y += 0.08; });
      mesh.visible = false; mesh.position.copy(p0); mesh.rotation.set(0, mesh.rotation.y, 0);
    },
    hasGun(type) { return type ? S.gun === type : !!S.gun; },
    giveGun(type = 'pistola') { S.gun = type; S.ammo = AMMO[type][Math.max(0, (S.wave || 1) - 1)]; this.hud(); },
    hud() {
      if (!S.hud) return; S.hud.querySelector('.v').textContent = '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(Math.max(0, 3 - S.lives)) + (S.weapon ? '  🪑' : '');
      S.hud.querySelector('.shoot').hidden = !S.gun; S.hud.querySelector('.shoot').textContent = 'Clic · Disparar' + (S.gun === 'escopeta' ? ' (escopeta)' : '');
      S.frame.querySelector('.roman').textContent = ROMAN[S.wave] || 'III';
      S.frame.querySelector('.ammo').textContent = S.gun ? '▮'.repeat(Math.max(0, Math.min(S.ammo, 12))) + (S.ammo > 12 ? ' ×' + S.ammo : '') : '';
    },
    push() {
      if (!S.on || S.cool > 0 || !S.W.api || S.W.api.S.busy) return; const P = S.W.api.P; S.cool = 0.9; let hit = 0;
      S.en.forEach((e) => { if (e.dead) return; const dx = e.g.position.x - P.x, dz = e.g.position.z - P.z, d = Math.hypot(dx, dz) || 1; if (d < 2.3) { const k = (S.weapon ? 4.2 : 2.4) / d; for (let s = 0; s < 6; s++) Q.npcStep(e.g.position, dx * k / 6, dz * k / 6, 0.34, S.W.obst, S.en.filter((q) => q !== e && !q.dead && q.g.visible).map((q) => q.g.position)); e.stun = S.weapon ? 4.5 : 2.2; hit++; } });
      if (window.Sound && Sound.on) { Sound.knock(1, 1.4); if (hit) Sound.shout(0.05); }
    },
    kill(e) { e.dead = true; e.dying = 0.9; if (window.Sound && Sound.on) Sound.shout(0.06); S.frame.classList.add('hit'); setTimeout(() => S.frame && S.frame.classList.remove('hit'), 160); },
    shoot() {
      if (!S.on || !S.gun || S.shotCool > 0 || !S.W.api || S.W.api.S.busy) return;
      if (S.ammo <= 0) { if (window.Sound && Sound.on) Sound.click(); return; }
      S.ammo--; S.shotCool = S.gun === 'escopeta' ? 0.6 : 0.28; this.hud();
      const cam = window.__qx && window.__qx.camera; if (window.Sound && Sound.on) Sound.shot();
      S.frame.classList.add('flash'); setTimeout(() => S.frame && S.frame.classList.remove('flash'), 90);
      if (!cam) return;
      const o = cam.position.clone(), dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
      if (S.gun === 'escopeta') { S.en.forEach((e) => { if (e.dead || !e.g.visible) return; const v = new THREE.Vector3(e.g.position.x, 1.0, e.g.position.z).sub(o), d = v.length(); if (d < 9 && v.normalize().dot(dir) > 0.93) this.kill(e); }); return; }   // cono ancho: abate a varios
      let best = null, bd = 1e9;
      S.en.forEach((e) => { if (e.dead || !e.g.visible) return; const c = new THREE.Vector3(e.g.position.x, 1.0, e.g.position.z), v = c.clone().sub(o), t = v.dot(dir); if (t < 0.3) return; const dist = v.sub(dir.clone().multiplyScalar(t)).length(); if (dist < 0.75 && t < bd) { bd = t; best = e; } });
      if (best) this.kill(best);
    },
    tick(dt) {
      if (!S.on || S.res || !S.W.api) return; const A = S.W.api; if (A.S.busy) return; const P = A.P, b = S.W.bounds; S.t += dt; S.cool -= dt; S.inv -= dt; S.shotCool -= dt;
      const rx = S.cfg.refuge[0], rz = S.cfg.refuge[1], rd = Math.hypot(rx - P.x, rz - P.z);
      if (S.t > 1.2 && S.lab) { let rel = Math.atan2(-(rx - P.x), -(rz - P.z)) - P.yaw; rel = ((rel + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; S.el.firstChild.style.transform = 'rotate(' + (-rel) + 'rad)'; S.lab.textContent = Math.round(rd) + ' m · ' + (S.cfg.refugeLabel || 'refugio'); }
      if (S.grace > 0) S.grace -= dt;                                                            // margen al empezar cada oleada: tiempo para moverte, coger el arma y apuntar
      S.en.forEach((e) => {
        if (e.dying > 0) { e.dying -= dt; e.g.rotation.x = Math.min(1.5, e.g.rotation.x + dt * 3.2); if (e.dying <= 0) e.g.visible = false; return; }
        if (e.dead) return;
        if (S.grace > 0) { e.g.rotation.y = Math.atan2(P.x - e.g.position.x, P.z - e.g.position.z) + Math.PI; return; }
        if (e.stun > 0) { e.stun -= dt; e.g.rotation.z = 0.5; return; } e.g.rotation.z = Math.sin(S.t * 3 + (e.ph || 0)) * 0.1; e.g.rotation.x = 0;
        const dx = P.x - e.g.position.x, dz = P.z - e.g.position.z, d = Math.hypot(dx, dz) || 1;
        if (d > 0.8) { const v = e.v || 1.8; Q.npcStep(e.g.position, dx / d * v * dt, dz / d * v * dt, 0.34, S.W.obst, S.en.filter((q) => !q.dead && q.g.visible).map((q) => q.g.position)); } e.g.rotation.y = Math.atan2(dx, dz) + Math.PI;
        if (d < 0.9 && S.inv <= 0) { S.lives--; S.inv = 1.8; this.hud(); P.x = Math.max(b.minX + 0.3, Math.min(b.maxX - 0.3, P.x - dx / d * 0.9)); P.z = Math.max(b.minZ + 0.3, Math.min(b.maxZ - 0.3, P.z - dz / d * 0.9)); if (window.Sound && Sound.on) { Sound.growl(0.9); Sound.bad(); } S.frame.classList.add('hurt'); setTimeout(() => S.frame && S.frame.classList.remove('hurt'), 300); }
      });
      // oleada abatida: el número romano titila y llega la siguiente (II con 10, III con 20); tras la III, sobrevives
      if (S.wait > 0) { S.wait -= dt; if (S.wait <= 0) { S.frame.querySelector('.roman').classList.remove('blink'); S.grace = 5; S.wave++; this.spawn(S.wave); this.hud(); if (Q.notify) Q.notify('Alerta', 'Oleada ' + ROMAN[S.wave] + ': ' + SIZES[S.wave - 1] + ' infectados. Recargad.'); } }
      else if (S.en.every((e) => e.dead && e.dying <= 0)) {
        if (S.wave >= 3) { this.end('refugio'); return; }
        S.wait = 2.2; S.frame.querySelector('.roman').classList.add('blink'); if (window.Sound && Sound.on) Sound.ok();
      }
      S.quip -= dt; if (S.quip <= 0 && S.quips.length) { Q.notify && Q.notify(S.quips[0][0], S.quips[0][1]); S.quips.shift(); S.quip = 6; }
      if (rd < (S.cfg.r || 1.7)) this.end('refugio'); else if (S.lives <= 0) this.end('muerto');
    },
    end(res) { S.res = res; this.stop(); S.W.apocRes = res; if (S.cfg.onEnd) S.cfg.onEnd(res); }
  };
})();
