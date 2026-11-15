/* apoc.js — el apocalipsis jugable (Sol y la cafetería): huir y luchar. Una flecha roja marca el refugio; los infectados te persiguen; F (o el botón) empuja a los
   que tienes cerca (más fuerte con una silla); hay una pistola que se puede encontrar y disparar con el clic (12 balas). Marco rojo sangre alrededor de la pantalla,
   número romano de la oleada abajo a la izquierda, vidas y munición. Tres oleadas: si las abates todas, o llegas al refugio, sobrevives; con 3 vidas perdidas, te alcanzan. */
(() => {
  const Q = window.QX;
  const S = { on: false };
  const ROMAN = ['', 'I', 'II', 'III'];

  Q.apoc = {
    start(W, cfg) {
      this.stop();
      Object.assign(S, { on: true, W, cfg, lives: 3, inv: 0, cool: 0, shotCool: 0, weapon: S.weapon || false, gun: S.gun || false, ammo: S.gun ? 12 : 0, res: null, t: 0, quip: 0, wave: 1, quips: (cfg.quips || []).slice() });
      S.en = cfg.enemies.map((e) => Object.assign({ stun: 0, dead: false, dying: 0, v0: e.v || 1.8, p0: [e.g.position.x, e.g.position.z] }, e));
      S.el = document.createElement('div'); S.el.id = 'flecha';
      S.el.innerHTML = '<svg viewBox="0 0 60 80" width="54" height="72"><path d="M30 2 L58 40 H40 V78 H20 V40 H2 Z" fill="#c4202c" stroke="#2a0508" stroke-width="3"/></svg><b></b>';
      document.body.appendChild(S.el); S.lab = S.el.querySelector('b');
      S.hud = document.createElement('div'); S.hud.id = 'vidas'; S.hud.innerHTML = '<span class="v"></span><button type="button" class="push">F · Empujar</button><button type="button" class="shoot" hidden>Clic · Disparar</button>'; document.body.appendChild(S.hud);
      S.hud.querySelector('.push').addEventListener('click', () => this.push()); S.hud.querySelector('.shoot').addEventListener('click', () => this.shoot());
      S.frame = document.createElement('div'); S.frame.id = 'apocframe'; S.frame.innerHTML = '<span class="roman" aria-label="Oleada"></span><span class="ammo"></span>'; document.body.appendChild(S.frame);
      S.key = (e) => { if ((e.key === 'f' || e.key === 'F') && !e.repeat) this.push(); }; window.addEventListener('keydown', S.key);
      S.mouse = (e) => { if (e.button === 0 && S.gun) this.shoot(); }; window.addEventListener('mousedown', S.mouse);
      S.tick = (dt, t) => this.tick(dt, t); W.tick.push(S.tick); this.hud();
      W.apocOn = true;
    },
    stop() {
      if (!S.on) return; S.on = false; window.removeEventListener('keydown', S.key); window.removeEventListener('mousedown', S.mouse);
      [S.el, S.hud, S.frame].forEach((n) => n && n.remove());
      if (S.W) { S.W.apocOn = false; const i = S.W.tick.indexOf(S.tick); if (i >= 0) S.W.tick.splice(i, 1); }
    },
    pick() { S.weapon = true; this.hud(); },
    hasGun() { return !!S.gun; },
    giveGun() { S.gun = true; S.ammo = 12; this.hud(); },
    hud() {
      if (!S.hud) return; S.hud.querySelector('.v').textContent = '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(Math.max(0, 3 - S.lives)) + (S.weapon ? '  🪑' : '');
      S.hud.querySelector('.shoot').hidden = !S.gun; S.frame.querySelector('.roman').textContent = ROMAN[S.wave] || 'III';
      S.frame.querySelector('.ammo').textContent = S.gun ? '▮'.repeat(Math.max(0, S.ammo)) + '▯'.repeat(Math.max(0, 12 - S.ammo)) : '';
    },
    push() {
      if (!S.on || S.cool > 0 || !S.W.api || S.W.api.S.busy) return; const P = S.W.api.P; S.cool = 0.9; let hit = 0;
      S.en.forEach((e) => { if (e.dead) return; const dx = e.g.position.x - P.x, dz = e.g.position.z - P.z, d = Math.hypot(dx, dz) || 1; if (d < 2.3) { const k = (S.weapon ? 4.2 : 2.4) / d; e.g.position.x += dx * k; e.g.position.z += dz * k; e.stun = S.weapon ? 4.5 : 2.2; hit++; } });
      if (window.Sound && Sound.on) { Sound.knock(1, 1.4); if (hit) Sound.shout(0.05); }
    },
    shoot() {
      if (!S.on || !S.gun || S.shotCool > 0 || !S.W.api || S.W.api.S.busy) return;
      if (S.ammo <= 0) { if (window.Sound && Sound.on) Sound.click(); return; }
      S.ammo--; S.shotCool = 0.28; this.hud();
      const cam = window.__qx && window.__qx.camera; if (window.Sound && Sound.on) Sound.shot();
      S.frame.classList.add('flash'); setTimeout(() => S.frame && S.frame.classList.remove('flash'), 90);
      if (!cam) return;
      const o = cam.position.clone(), dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize(); let best = null, bd = 1e9;
      S.en.forEach((e) => { if (e.dead || !e.g.visible) return; const c = new THREE.Vector3(e.g.position.x, 1.0, e.g.position.z), v = c.clone().sub(o), t = v.dot(dir); if (t < 0.3) return; const dist = v.sub(dir.clone().multiplyScalar(t)).length(); if (dist < 0.75 && t < bd) { bd = t; best = e; } });
      if (best) { best.dead = true; best.dying = 0.9; if (window.Sound && Sound.on) Sound.shout(0.06); S.frame.classList.add('hit'); setTimeout(() => S.frame && S.frame.classList.remove('hit'), 160); }
    },
    tick(dt) {
      if (!S.on || S.res || !S.W.api) return; const A = S.W.api; if (A.S.busy) return; const P = A.P, b = S.W.bounds; S.t += dt; S.cool -= dt; S.inv -= dt; S.shotCool -= dt;
      const rx = S.cfg.refuge[0], rz = S.cfg.refuge[1], rd = Math.hypot(rx - P.x, rz - P.z);
      if (S.t > 1.2 && S.lab) { let rel = Math.atan2(-(rx - P.x), -(rz - P.z)) - P.yaw; rel = ((rel + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; S.el.firstChild.style.transform = 'rotate(' + (-rel) + 'rad)'; S.lab.textContent = Math.round(rd) + ' m · ' + (S.cfg.refugeLabel || 'refugio'); }
      S.en.forEach((e) => {
        if (e.dying > 0) { e.dying -= dt; e.g.rotation.x = Math.min(1.5, e.g.rotation.x - 0 + dt * 3.2) * 1; if (e.dying <= 0) e.g.visible = false; return; }
        if (e.dead) return;
        if (e.stun > 0) { e.stun -= dt; e.g.rotation.z = 0.5; return; } e.g.rotation.z = Math.sin(S.t * 3 + (e.ph || 0)) * 0.1; e.g.rotation.x = 0;
        const dx = P.x - e.g.position.x, dz = P.z - e.g.position.z, d = Math.hypot(dx, dz) || 1;
        if (d > 0.8) { const v = e.v || 1.8; e.g.position.x += dx / d * v * dt; e.g.position.z += dz / d * v * dt; } e.g.rotation.y = Math.atan2(dx, dz) + Math.PI;
        if (d < 0.9 && S.inv <= 0) { S.lives--; S.inv = 1.8; this.hud(); P.x = Math.max(b.minX + 0.3, Math.min(b.maxX - 0.3, P.x - dx / d * 0.9)); P.z = Math.max(b.minZ + 0.3, Math.min(b.maxZ - 0.3, P.z - dz / d * 0.9)); if (window.Sound && Sound.on) { Sound.growl(0.9); Sound.bad(); } S.frame.classList.add('hurt'); setTimeout(() => S.frame && S.frame.classList.remove('hurt'), 300); }
      });
      // si abates a todos, llega la siguiente oleada; tras la tercera, has ganado a tiros
      if (S.en.every((e) => e.dead && e.dying <= 0)) {
        if (S.wave >= 3) { this.end('refugio'); return; }
        S.wave++; this.hud(); if (Q.notify) Q.notify('Alerta', 'Oleada ' + ROMAN[S.wave] + ' de infectados. Cargad, si tenéis con qué.');
        S.en.forEach((e, i) => { e.dead = false; e.dying = 0; e.stun = 0; e.v = e.v0 * (1 + 0.1 * (S.wave - 1)); e.g.visible = true; e.g.rotation.x = 0; e.g.position.set(e.p0[0], 0, e.p0[1]); });
      }
      S.quip -= dt; if (S.quip <= 0 && S.quips.length) { Q.notify && Q.notify(S.quips[0][0], S.quips[0][1]); S.quips.shift(); S.quip = 6; }
      if (rd < (S.cfg.r || 1.7)) this.end('refugio'); else if (S.lives <= 0) this.end('muerto');
    },
    end(res) { S.res = res; this.stop(); S.W.apocRes = res; if (S.cfg.onEnd) S.cfg.onEnd(res); }
  };
})();
