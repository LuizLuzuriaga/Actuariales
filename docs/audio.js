/* audio.js — sonido sintetizado con Web Audio. Silenciado por defecto; no hay archivos de audio. */
const Sound = (() => {
  let ctx = null, master = null, noiseBuf = null;
  let on = false, current = null;
  let nodes = [], timers = [], clue = 0;

  function ensure() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  const noise = () => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(); nodes.push(s); return s; };
  function chain(src, type, freq, q, gain) {
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(master);
    nodes.push(f, g);
    return g;
  }
  function osc(type, freq, gain) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.start();
    const g = ctx.createGain(); g.gain.value = gain;
    o.connect(g); g.connect(master);
    nodes.push(o, g);
    return o;
  }
  function lfo(target, freq, depth) {
    const o = ctx.createOscillator(); o.frequency.value = freq; o.start();
    const g = ctx.createGain(); g.gain.value = depth;
    o.connect(g); g.connect(target);
    nodes.push(o, g);
  }
  function every(ms, fn) { timers.push(setInterval(fn, ms)); }

  function blip(freq, dur = 0.08, type = 'square', vol = 0.15, when = 0) {
    if (!on) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function burst(freq, dur, vol) {
    if (!on) return;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2;
    const g = ctx.createGain(); const t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur);
  }


  /* ---------- sonidos puntuales de ambiente, todos sintetizados ---------- */
  function siren(dur = 4, vol = 0.04) {                                   // sirena lejana: dos tonos que suben y bajan, apagada por un paso bajo
    if (!on) return; const t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 1100;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.7); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    for (let k = 0; k < dur / 1.2; k++) { o.frequency.setValueAtTime(680, t + k * 1.2); o.frequency.linearRampToValueAtTime(1080, t + k * 1.2 + 0.6); o.frequency.linearRampToValueAtTime(680, t + k * 1.2 + 1.2); }
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.1);
  }
  function shout(vol = 0.05) {                                            // grito lejano: un tono grave que cae con dos formantes
    if (!on) return; const t = ctx.currentTime, d = 0.5 + Math.random() * 0.6, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(150 + Math.random() * 70, t); o.frequency.exponentialRampToValueAtTime(90 + Math.random() * 30, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    [640, 1120].forEach((fr) => { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fr; f.Q.value = 4; o.connect(f); f.connect(g); });
    g.connect(master); o.start(t); o.stop(t + d + 0.05);
  }
  function carAlarm(dur = 3.5) { for (let i = 0; i < dur * 4; i++) blip(i % 2 ? 1250 : 850, 0.11, 'square', 0.035, i * 0.13); }
  function glass() { burst(3600, 0.35, 0.1); burst(5400, 0.25, 0.07); }
  function dog() { for (let k = 0; k < 3; k++) blip(330 - k * 25, 0.13, 'sawtooth', 0.06, k * 0.26); }
  function cough() { burst(380, 0.12, 0.08); setTimeout(() => burst(520, 0.2, 0.06), 160); }
  function chime() { blip(784, 0.55, 'sine', 0.06); blip(587, 0.8, 'sine', 0.06, 0.45); burst(2600, 1.1, 0.012); }   // aviso de megafonía: ding-dong y siseo, sin voz
  function notify() { blip(90, 0.2, 'square', 0.05); blip(1568, 0.09, 'triangle', 0.09, 0.02); blip(2093, 0.14, 'triangle', 0.09, 0.12); }
  function doorBeep() { [0, 0.2, 0.4].forEach((w) => blip(1100, 0.12, 'square', 0.05, w)); burst(700, 0.8, 0.07); }
  function brake() {                                                       // frenada del tren: chirrido que baja y retumbo grave
    if (!on) return; const t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(2300, t); o.frequency.exponentialRampToValueAtTime(800, t + 2.6); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.7);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 2.8); burst(140, 2.8, 0.2);
  }
  const maybe = (p, fn) => { if (Math.random() < p) fn(); };

  const AMB = {
    room() {
      chain(noise(), 'lowpass', 140, 0.7, 0.07); osc('sine', 50, 0.02);
      every(5200, () => maybe(0.16 + 0.2 * clue, () => { const r = Math.random(); if (clue >= 1 && r < 0.3) siren(3.6 + clue); else if (r < 0.65) shout(0.045); else if (clue >= 2 && r < 0.85) carAlarm(); else if (clue >= 3) glass(); else dog(); }));
    },
    platform() {
      chain(noise(), 'bandpass', 500, 0.5, 0.05);
      chain(noise(), 'lowpass', 110, 0.7, 0.10);
      const m = chain(noise(), 'bandpass', 1000, 0.7, 0.03); lfo(m.gain, 0.4, 0.012);
      every(11000, () => maybe(0.7, chime));
      every(4800, () => maybe(0.18 + 0.18 * clue, cough));
      every(9000, () => maybe(0.1 * clue, () => shout(0.03)));
    },
    train() {
      const g = chain(noise(), 'lowpass', 260, 0.8, 0.22);
      lfo(g.gain, 5.5, 0.08);
      chain(noise(), 'bandpass', 1500, 1, 0.012);
      every(6500, () => maybe(0.25 + 0.15 * clue, cough));
      every(9000, () => maybe(0.5, () => blip(1400, 0.15, 'triangle', 0.03)));
    },
    street() {
      chain(noise(), 'bandpass', 700, 0.4, 0.05); chain(noise(), 'lowpass', 90, 0.7, 0.08);
      every(4500, () => maybe(0.2 + 0.18 * clue, () => { const r = Math.random(); if (r < 0.4) siren(4 + clue); else if (r < 0.7) shout(0.04); else if (clue >= 2) carAlarm(2.5); else dog(); }));
    },
    office() {
      chain(noise(), 'lowpass', 300, 0.6, 0.05); osc('sine', 100, 0.012);
      every(260, () => { if (Math.random() < 0.55) burst(2600 + Math.random() * 900, 0.03, 0.06); });
    },
    cafe() {
      const g = chain(noise(), 'bandpass', 650, 0.9, 0.06);
      lfo(g.gain, 0.6, 0.03);
      chain(noise(), 'highpass', 4500, 0.7, 0.012);
      every(9000, () => burst(1800, 0.7, 0.05));
    },
  };

  function stopAmb() {
    timers.forEach(clearInterval); timers = [];
    nodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    nodes = [];
  }
  function startAmb() {
    stopAmb();
    if (on && current && AMB[current]) AMB[current]();
  }

  return {
    get on() { return on; },
    toggle() {
      if (!on) { if (!ensure()) return false; if (ctx.state === 'suspended') ctx.resume(); on = true; }
      else on = false;
      master && (master.gain.value = on ? 0.7 : 0);
      startAmb();
      return on;
    },
    ambience(name) { current = name; startAmb(); },
    click() { blip(520, 0.05, 'triangle', 0.1); },
    ok() { blip(660, 0.08, 'triangle', 0.12); blip(880, 0.12, 'triangle', 0.12, 0.08); },
    bad() { blip(220, 0.18, 'sawtooth', 0.12); blip(160, 0.3, 'sawtooth', 0.12, 0.15); },
    alarm(n = 6) { for (let i = 0; i < n; i++) { blip(1800, 0.09, 'square', 0.1, i * 0.22); blip(1800, 0.09, 'square', 0.1, i * 0.22 + 0.11); } },
    get clue() { return clue; }, set clue(v) { clue = v; },
    siren, shout, carAlarm, glass, dog, cough, chime, notify, doorBeep, brake,
    whoosh() { burst(400, 1.6, 0.25); burst(1200, 1.2, 0.08); },
    doors() { blip(980, 0.12, 'sine', 0.1); blip(780, 0.2, 'sine', 0.1, 0.14); },
  };
})();
