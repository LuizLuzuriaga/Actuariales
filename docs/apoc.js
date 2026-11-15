/* apoc.js — el apocalipsis jugable (Sol y la cafetería): huir y luchar. Una flecha roja marca el refugio; los infectados te persiguen; F (o el botón) empuja a los
   que tienes cerca (más fuerte si has cogido una silla); tienes 3 vidas. Si llegas al refugio, sobrevives; si las pierdes, te alcanzan. */
(() => {
  const Q = window.QX;
  const S = { on: false };

  Q.apoc = {
    start(W, cfg) {
      this.stop();
      Object.assign(S, { on: true, W, cfg, lives: 3, inv: 0, cool: 0, weapon: false, res: null, t: 0, quip: 0, quips: (cfg.quips || []).slice() });
      S.en = cfg.enemies.map((e) => Object.assign({ stun: 0 }, e));
      S.el = document.createElement('div'); S.el.id = 'flecha';
      S.el.innerHTML = '<svg viewBox="0 0 60 80" width="54" height="72"><path d="M30 2 L58 40 H40 V78 H20 V40 H2 Z" fill="#c4202c" stroke="#2a0508" stroke-width="3"/></svg><b></b>';
      document.body.appendChild(S.el); S.lab = S.el.querySelector('b');
      S.hud = document.createElement('div'); S.hud.id = 'vidas'; S.hud.innerHTML = '<span class="v"></span><button type="button" class="push">F · Empujar</button>'; document.body.appendChild(S.hud);
      S.hud.querySelector('.push').addEventListener('click', () => this.push());
      S.key = (e) => { if ((e.key === 'f' || e.key === 'F') && !e.repeat) this.push(); }; window.addEventListener('keydown', S.key);
      S.tick = (dt, t) => this.tick(dt, t); W.tick.push(S.tick); this.hud();
      W.apocOn = true;
    },
    stop() {
      if (!S.on) return; S.on = false; window.removeEventListener('keydown', S.key);
      if (S.el) S.el.remove(); if (S.hud) S.hud.remove();
      if (S.W) { S.W.apocOn = false; const i = S.W.tick.indexOf(S.tick); if (i >= 0) S.W.tick.splice(i, 1); }
    },
    pick() { S.weapon = true; this.hud(); },
    hud() { if (S.hud) S.hud.querySelector('.v').textContent = '♥'.repeat(Math.max(0, S.lives)) + '♡'.repeat(Math.max(0, 3 - S.lives)) + (S.weapon ? '  🪑' : ''); },
    push() {
      if (!S.on || S.cool > 0 || !S.W.api || S.W.api.S.busy) return; const P = S.W.api.P; S.cool = 0.9; let hit = 0;
      S.en.forEach((e) => { const dx = e.g.position.x - P.x, dz = e.g.position.z - P.z, d = Math.hypot(dx, dz) || 1; if (d < 2.3) { const k = (S.weapon ? 4.2 : 2.4) / d; e.g.position.x += dx * k; e.g.position.z += dz * k; e.stun = S.weapon ? 4.5 : 2.2; hit++; } });
      if (window.Sound && Sound.on) { Sound.knock(1, 1.4); if (hit) Sound.shout(0.05); }
    },
    tick(dt) {
      if (!S.on || S.res || !S.W.api) return; const A = S.W.api; if (A.S.busy) return; const P = A.P, b = S.W.bounds; S.t += dt; S.cool -= dt; S.inv -= dt;
      const rx = S.cfg.refuge[0], rz = S.cfg.refuge[1], rd = Math.hypot(rx - P.x, rz - P.z);
      if (S.t > 1.2 && S.lab) { let rel = Math.atan2(-(rx - P.x), -(rz - P.z)) - P.yaw; rel = ((rel + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; S.el.firstChild.style.transform = 'rotate(' + (-rel) + 'rad)'; S.lab.textContent = Math.round(rd) + ' m · ' + (S.cfg.refugeLabel || 'refugio'); }
      S.en.forEach((e) => {
        if (e.stun > 0) { e.stun -= dt; e.g.rotation.z = 0.5; return; } e.g.rotation.z = Math.sin(S.t * 3 + (e.ph || 0)) * 0.1;
        const dx = P.x - e.g.position.x, dz = P.z - e.g.position.z, d = Math.hypot(dx, dz) || 1;
        if (d > 0.8) { const v = e.v || 1.8; e.g.position.x += dx / d * v * dt; e.g.position.z += dz / d * v * dt; } e.g.rotation.y = Math.atan2(dx, dz);
        if (d < 0.9 && S.inv <= 0) { S.lives--; S.inv = 1.8; this.hud(); P.x = Math.max(b.minX + 0.3, Math.min(b.maxX - 0.3, P.x - dx / d * 0.9)); P.z = Math.max(b.minZ + 0.3, Math.min(b.maxZ - 0.3, P.z - dz / d * 0.9)); if (window.Sound && Sound.on) { Sound.growl(0.9); Sound.bad(); } }
      });
      S.quip -= dt; if (S.quip <= 0 && S.quips.length) { Q.notify && Q.notify(S.quips[0][0], S.quips[0][1]); S.quips.shift(); S.quip = 6; }
      if (rd < (S.cfg.r || 1.7)) this.end('refugio'); else if (S.lives <= 0) this.end('muerto');
    },
    end(res) { S.res = res; this.stop(); S.W.apocRes = res; if (S.cfg.onEnd) S.cfg.onEnd(res); }
  };
})();
