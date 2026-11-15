/* audio.js — sonido sintetizado con Web Audio. Silenciado por defecto; no hay archivos de audio. */
const Sound = (() => {
  let ctx = null, master = null, noiseBuf = null;
  let on = false, current = null;
  let nodes = [], timers = [];

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

  const AMB = {
    room() { chain(noise(), 'lowpass', 140, 0.7, 0.07); osc('sine', 50, 0.02); },
    platform() {
      chain(noise(), 'bandpass', 500, 0.5, 0.05);
      chain(noise(), 'lowpass', 110, 0.7, 0.10);
      every(7000, () => blip(660, 0.35, 'sine', 0.05));
    },
    train() {
      const g = chain(noise(), 'lowpass', 260, 0.8, 0.22);
      lfo(g.gain, 5.5, 0.08);
      chain(noise(), 'bandpass', 1500, 1, 0.012);
    },
    street() { chain(noise(), 'bandpass', 700, 0.4, 0.05); chain(noise(), 'lowpass', 90, 0.7, 0.08); },
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
    whoosh() { burst(400, 1.6, 0.25); burst(1200, 1.2, 0.08); },
    doors() { blip(980, 0.12, 'sine', 0.1); blip(780, 0.2, 'sine', 0.1, 0.14); },
  };
})();
