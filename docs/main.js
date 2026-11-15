/* qx 3D — portfolio en el dormitorio, en primera persona. Lógica de juego, cámara, entrada y bucle.
   (Texturas: lib.js · Habitación: room.js · Cuerpo: avatar.js · Posproceso: fx.js) */
(() => {
  const Q = window.QX;
  const DEBUG = /[?&]debug/.test(location.search);
  const COARSE = matchMedia('(pointer: coarse)').matches;
  const QPARAM = (location.search.match(/[?&]q=(low|med|high)/) || [])[1];
  const HIGH = QPARAM ? QPARAM === 'high' : !COARSE;
  const $ = (s) => document.querySelector(s);
  const { clamp, lerp } = Q;
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

  /* ============================== Ajustes y almacenamiento ============================== */
  const CFG = (() => {
    let c = {}; try { c = JSON.parse(localStorage.getItem('qx-cfg') || '{}'); } catch (e) { }
    return Object.assign({ sens: 1, sound: true, quality: 'auto', calm: matchMedia('(prefers-reduced-motion: reduce)').matches }, c);
  })();
  const saveCfg = () => { try { localStorage.setItem('qx-cfg', JSON.stringify(CFG)); } catch (e) { } };
  const store = (k, v) => { try { if (v !== undefined) localStorage.setItem('qx-' + k, v); return localStorage.getItem('qx-' + k); } catch (e) { return null; } };

  /* ============================== Renderer ============================== */
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  let pr = Math.min(window.devicePixelRatio || 1, HIGH ? 1.75 : 1.4);
  renderer.setPixelRatio(pr);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;                  // el mapa de sombras se redibuja un fotograma sí y otro no (casi todo es estático)
  renderer.info.autoReset = false;                        // contamos todas las pasadas del fotograma: sombras, espejo y posproceso

  /* La cabeza solo existe para el espejo: la cámara principal (capa 0) no la ve; las cámaras virtuales del espejo sí. */
  const mainRender = renderer.render.bind(renderer);
  let mainCamera = null;
  renderer.render = (s, cam) => { if (mainCamera && cam !== mainCamera) cam.layers.enableAll(); return mainRender(s, cam); };

  let scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050a);
  scene.fog = new THREE.FogExp2(0x070a14, 0.055);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.04, 40);
  camera.rotation.order = 'YXZ'; mainCamera = camera;

  /* Entorno: un reflejo tenue para que los metales y barnices «lean» la habitación */
  (function env() {
    try {
      const c = Q.cvs(512, 256), g = c.getContext('2d');
      const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#0c1226'); gr.addColorStop(0.5, '#1a2038'); gr.addColorStop(1, '#0a0806'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
      const o = g.createRadialGradient(256, 120, 0, 256, 120, 90); o.addColorStop(0, 'rgba(255,170,90,.9)'); o.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = o; g.fillRect(0, 0, 512, 256);
      const t = Q.toTex(c); t.mapping = THREE.EquirectangularReflectionMapping;
      const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(t).texture; pm.dispose();
    } catch (e) { console.warn('Sin mapa de entorno', e.message); }
  })();
  const envTex = scene.environment;

  /* ============================== Mundo ============================== */
  const R = Q.buildRoom(scene, { pr, high: HIGH });
  Q.attachStreet && Q.attachStreet(scene, R, () => clueLevel());                  // la calle de la ventana, con vida
  const t0Av = performance.now();
  const A = Q.buildAvatar(scene, { high: HIGH });
  window.__avatarMs = Math.round(performance.now() - t0Av);
  scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) m.envMapIntensity = 0.28; }); });
  A.group.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.isMeshStandardMaterial) m.envMapIntensity = 0.08; }); });
  const fx = Q.initFX(renderer, scene, camera, pr);
  if (!fx.on) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputEncoding = THREE.sRGBEncoding; }
  else document.querySelectorAll('.fx').forEach((e) => { e.style.display = 'none'; });

  /* ============================== Estado ============================== */
  const S = { time: '05:45', min: 345, alarmOn: true, dressed: false, bag: false, mirror: false, busy: true, started: false, ended: false, lastProgress: 0, did: new Set(), tasks: { alarm: false, dress: false, bag: false, out: false } };
  const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  /* Nivel de pista 0-4: base por escenario, más el tiempo perdido en casa y +1 por cada 3 de descuido (máx. +2) */
  function clueLevel() { const base = { bed: 0, platform: 1, train: 1, azca: 2 }[WORLD] || 0, slow = WORLD === 'bed' ? clamp(((S.min || 345) - 345) / 30, 0, 1) : 0, extra = Math.min(2, Math.floor((S.descuido || 0) / 3)); return Math.min(4, Math.floor(base + slow + extra + 0.0001)); }
  function advance(min) { S.min += min; Sound.clue = clueLevel(); S.time = fmt(S.min); $('#clock').textContent = S.time; }
  const P = { x: -0.35, z: -0.55, yaw: 0, pitch: 0, bodyYaw: 0, vx: 0, vz: 0, walk: 0, bob: 0 };
  const EYE = Q.EYE;
  function lookAngles(fx0, fy, fz, tx, ty, tz) { const dx = tx - fx0, dz = tz - fz, dy = ty - fy; return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }; }
  { const a = lookAngles(P.x, EYE, P.z, -0.5, 0.55, -1.56); P.yaw = P.bodyYaw = a.yaw; P.pitch = a.pitch; }

  let ROOM = Q.ROOM, OBST = R.obst, TICK = R.tick, WORLD = 'bed'; const RAD = 0.24;
  function collide(x, z) {
    x = clamp(x, ROOM.minX + RAD, ROOM.maxX - RAD); z = clamp(z, ROOM.minZ + RAD, ROOM.maxZ - RAD);
    for (const o of OBST) {
      const cx = clamp(x, o.minX, o.maxX), cz = clamp(z, o.minZ, o.maxZ), dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
      if (d2 < RAD * RAD) {
        if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (RAD - d) / d; x += dx * k; z += dz * k; }
        else { const px = Math.min(x - o.minX, o.maxX - x), pz = Math.min(z - o.minZ, o.maxZ - z); if (px < pz) x += (x - (o.minX + o.maxX) / 2 > 0 ? 1 : -1) * (px + RAD); else z += (z - (o.minZ + o.maxZ) / 2 > 0 ? 1 : -1) * (pz + RAD); }
      }
    }
    return [x, z];
  }

  /* ============================== Interactivos ============================== */
  const tasksEl = $('#tasks');
  const TASKS = [['alarm', 'Apagar el despertador'], ['dress', 'Vestirte para el día'], ['bag', 'Cargar la mochila'], ['out', 'Salir de casa']];
  function renderTasks(flash) { tasksEl.innerHTML = TASKS.map(([k, t]) => `<li class="${S.tasks[k] ? 'done' : ''}${k === flash ? ' flash' : ''}">${t}</li>`).join(''); }
  function completeTask(k) { S.tasks[k] = true; S.lastProgress = performance.now(); renderTasks(k); Sound.ok(); }
  const allReady = () => S.tasks.alarm && S.tasks.dress && S.tasks.bag;
  function setTasks(items) { tasksEl.innerHTML = items.map(([t, d]) => `<li class="${d ? 'done' : ''}">${t}</li>`).join(''); }
  function tag(obj, id) { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); }
  tag(R.g.nightstand, 'movil'); tag(R.g.wardrobe, 'armario'); tag(R.g.mirror, 'espejo'); tag(R.g.mirrorFrame, 'espejo'); tag(R.g.doorG, 'puerta'); tag(R.g.chair, 'bolsos'); tag(R.g.bed, 'cama'); tag(R.g.desk, 'escritorio'); tag(R.g.shelf, 'medalla');
  let ACT_ROOTS = [R.g.nightstand, R.g.wardrobe, R.g.mirror, R.g.mirrorFrame, R.g.doorG, R.g.chair, R.g.bed, R.g.desk, R.g.shelf];
  let ACTS = {
    movil: { label: 'Apagar el despertador', stand: [-0.4, -0.85], look: [-0.5, 0.55, -1.56], reach: true, enabled: () => S.alarmOn, run: actMovil },
    armario: { label: 'Abrir el armario y vestirte', stand: [-0.05, -0.2], look: [2.0, 1.45, -0.55], reach: true, enabled: () => !S.dressed, run: actArmario },
    espejo: { label: 'Mirarte al espejo', stand: [1.2, 1.2], look: [2.19, 1.5, 1.2], enabled: () => true, run: actEspejo },
    bolsos: { label: 'Cargar la mochila', stand: [-0.55, 1.0], look: [-1.2, 0.72, 1.15], reach: true, enabled: () => !S.bag, run: actBolsos },
    puerta: { label: 'Salir de casa', stand: [0.05, 1.0], look: [0.05, 1.15, 1.8], reach: true, enabled: () => true, run: actPuerta },
    cama: { label: 'Mirar la cama', stand: [-0.4, 0.05], look: [-1.5, 0.5, -0.4], enabled: () => true, run: async () => { cost('cama', 3); await say('Tu cama, todavía caliente. Tiene un 100 % de retención y cero rentabilidad.'); } },
    escritorio: { label: 'Mirar el escritorio', stand: [-0.95, 0.3], look: [-1.9, 0.85, 0.85], enabled: () => true, run: actEscritorio },
    medalla: { label: 'Mirar la medalla', stand: [-0.9, 1.5], look: [-2.15, 1.5, 1.62], enabled: () => true, run: async () => { cost('medalla', 2); await say(['La medalla de la San Silvestre. Diez kilómetros a ritmo constante: el único estimador insesgado que tienes.']); } },
  };

  const BED = { scene, bounds: Q.ROOM, obst: R.obst, tick: R.tick, acts: ACTS, actRoots: ACT_ROOTS };
  /* Cada decisión opcional cuesta minutos la primera vez: ese reloj decide la probabilidad de llegar a tiempo */
  function cost(id, min) { if (S.did.has(id)) return; S.did.add(id); advance(min); }

  /* ---- Destellos sobre lo que toca hacer ---- */
  const GLOW_ON = {
    movil: () => S.alarmOn, armario: () => !S.dressed, bolsos: () => !S.bag, puerta: () => allReady(),
    escritorio: () => !S.did.has('escritorio'), espejo: () => S.dressed && !S.did.has('espejo'), medalla: () => !S.did.has('medalla'),
  };
  const GLOWS = [];
  (function () {
    const c = Q.cvs(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,200,130,.95)'); gr.addColorStop(0.35, 'rgba(255,150,70,.35)'); gr.addColorStop(1, 'rgba(255,140,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const tex = Q.toTex(c);
    Object.keys(GLOW_ON).forEach((id, i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 }));
      sp.position.set(...ACTS[id].look); sp.scale.setScalar(0.26); sp.renderOrder = 5; scene.add(sp); GLOWS.push({ id, sp, i });
    });
  })();
  function updateGlows(t) {
    const show = S.started && !S.busy && !S.ended;
    GLOWS.forEach(({ id, sp, i }) => { const on = show && GLOW_ON[id](); sp.visible = on; if (on) { const k = 0.5 + 0.5 * Math.sin(t * 2.2 + i); sp.material.opacity = 0.35 + 0.4 * k; sp.scale.setScalar(0.22 + 0.08 * k); } });
  }

  /* ---- Mensajes ---- */
  const msg = $('#msg'); let typingId = 0;
  let tipId = 0, tipWake = null;
  const tipWait = (ms) => new Promise((r) => { const h = setTimeout(r, ms); tipWake = () => { clearTimeout(h); r(); }; });
  msg.addEventListener('pointerup', () => { if (tipWake) tipWake(); });
  /* Mensajes que no bloquean: pasan solos, se puede andar y se cortan al usar algo */
  async function tip(lines) {
    const id = ++tipId;
    for (const l of lines) {
      if (id !== tipId) return;
      const o = typeof l === 'string' ? { text: l } : l;
      msg.hidden = false; msg.innerHTML = `<p class="${o.think ? 'think' : ''}"></p>`; msg.firstChild.textContent = o.text;
      await tipWait(Math.max(2800, o.text.length * 60));
    }
    if (id === tipId) { msg.hidden = true; tipWake = null; }
  }
  /* Textos: lo clave bloquea hasta pulsar (interactuar, decisiones, pensamientos con block:true); los pensamientos y comentarios de fondo
     (think:true) salen como aviso que no para el juego y se va solo. */
  function say(lines) {
    if (!Array.isArray(lines)) lines = [lines];
    const soft = lines.filter((l) => l && typeof l === 'object' && l.think && !l.block), hard = lines.filter((l) => !soft.includes(l));
    if (!hard.length) { if (soft.length) tip(soft); return Promise.resolve(); }
    tipId++; tipWake = null; S.busy = true;
    return (async () => { for (const l of hard) await sayOne(typeof l === 'string' ? { text: l } : l); S.busy = false; if (soft.length) tip(soft); })();
  }
  function sayOne({ text, think }) {
    return new Promise((resolve) => {
      const id = ++typingId; msg.hidden = false; msg.innerHTML = `<p class="${think ? 'think' : ''}"></p>`;
      const p = msg.firstChild; let i = 0, done = false;
      const tick = () => { if (done || id !== typingId) return; i += 2; p.textContent = text.slice(0, i); if (i >= text.length) { done = true; return; } setTimeout(tick, 13); };
      tick();
      const advance = (e) => {
        if (e && e.type === 'keydown' && !['Enter', ' ', 'e', 'E'].includes(e.key)) return;
        if (e && e.type === 'keydown') e.preventDefault();
        if (!done) { done = true; p.textContent = text; return; }
        msg.removeEventListener('pointerup', advance); window.removeEventListener('keydown', advance); msg.hidden = true; resolve();
      };
      msg.addEventListener('pointerup', advance); window.addEventListener('keydown', advance);
    });
  }

  /* ---- Movimiento guiado ---- */
  function tween(dur, fn) { return new Promise((res) => { const t0 = performance.now(); (function step(now) { const k = clamp((now - t0) / dur, 0, 1); fn(ease(k), k); if (k < 1) requestAnimationFrame(step); else res(); })(t0); }); }
  let walking = false, walkCancel = false;                          // moverte o tocar la pantalla durante el paseo guiado lo cancela
  async function walkTo(stand, look) {
    const sx = P.x, sz = P.z, sy = P.yaw, sp = P.pitch, a = lookAngles(stand[0], EYE, stand[1], look[0], look[1], look[2]);
    const dist = Math.hypot(stand[0] - sx, stand[1] - sz), d = clamp(dist * 560, 500, 1800);
    walking = true; walkCancel = false;
    await new Promise((res) => { const t0 = performance.now(); (function step(now) { const k = clamp((now - t0) / d, 0, 1), e = ease(k); P.x = lerp(sx, stand[0], e); P.z = lerp(sz, stand[1], e); P.yaw = sy + angDiff(a.yaw, sy) * e; P.pitch = lerp(sp, a.pitch, e); P.walk = dist > 0.05 ? 1 : 0; if (walkCancel || k >= 1) res(); else requestAnimationFrame(step); })(t0); });
    walking = false; P.walk = 0; P.bodyYaw = P.yaw;                 // el cuerpo termina mirando a lo mismo que tú
    return !walkCancel;
  }
  async function interact(id) {
    const a = ACTS[id]; if (!a || S.busy) return;
    if (!a.enabled()) { await say('Eso ya está hecho.'); return; }
    S.busy = true; $('#prompt').hidden = true; tipId++; msg.hidden = true; S.lastProgress = performance.now(); Sound.click();
    if (!(await walkTo(a.stand, a.look))) { S.busy = false; return; }
    if (a.reach) await tween(380, (e) => { A.reach = e; });
    await a.run(API);
    if (a.reach) await tween(380, (e) => { A.reach = 1 - e; });
    A.reach = 0; S.busy = false;
  }

  /* ---- Acciones ---- */
  async function actMovil() {
    S.alarmOn = false; advance(2); completeTask('alarm');
    R.ref.phoneLight.intensity = 0.25; R.ref.halo.material.opacity = 0.35;
    await say(['Apagas la alarma. Silencio. Por fin una variable que controlas.']);
  }
  async function actArmario() {
    R.ref.wInside.intensity = 2.4; Sound.doors();
    await tween(900, (e) => { R.ref.doorN.rotation.y = -e * 1.9; });
    await say(['Camisa azul, pantalón gris oscuro, zapatos negros. El uniforme de quien no tiene uniforme.']);
    A.dress(true); R.ref.shirt.visible = false; R.ref.pants.visible = false; S.dressed = true; advance(8); completeTask('dress');
    await say([{ text: 'Mírate al espejo si quieres comprobar el resultado. Es la única reunión en la que estás seguro de quién va a estar.', think: true }]);
  }
  async function actEscritorio() {
    cost('escritorio', 4);
    await say(['Apuntes de Previsión Social, el portátil cerrado y la taza de ayer. El escritorio de quien estudia a trozos y vive de tren en tren.']);
    await openPanel(`<h2>Apuntes y portátil</h2>
      <p>Luiz Alberto Luzuriaga Izquierdo · Madrid. Estudiante del Máster en Ciencias Actuariales y Financieras (Universidad de Alcalá).</p>
      <h3>Lo que hay abierto</h3>
      <ul>
        <li><a href="https://luizluzuriaga.github.io/Gedankenpalast/Fundacion/" target="_blank" rel="noopener">Gedankenpalast</a> · atlas 3D de estudio</li>
        <li><a href="https://luizluzuriaga.github.io/Gedankenpalast/Fundacion/guias/simulacion.html" target="_blank" rel="noopener">Simulación y modelos</a> · guía de estudio</li>
        <li><a href="https://luizluzuriaga.github.io/Gedankenpalast/Fundacion/guias/bayesiana.html" target="_blank" rel="noopener">Estadística bayesiana</a> · guía con laboratorios</li>
        <li><a href="https://luizluzuriaga.github.io/Gedankenpalast/Fundacion/guias/prevision_social.html" target="_blank" rel="noopener">Previsión social</a> · guía con líneas temporales</li>
        <li><a href="https://luizluzuriaga.github.io/Gedankenpalast/Fundacion/guias/seguridad_social.html" target="_blank" rel="noopener">Seguridad Social</a> · tests de práctica</li>
      </ul>
      <h3>Contacto</h3>
      <p><a href="https://www.linkedin.com/in/luiz-luzuriaga-izquierdo" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://github.com/LuizLuzuriaga" target="_blank" rel="noopener">GitHub</a> · <a href="https://luizluzuriaga.github.io/" target="_blank" rel="noopener">Web</a></p>`);
  }
  async function actBolsos() {
    R.ref.chairBags.visible = false; A.carry(); S.bag = true; advance(5); completeTask('bag');
    await say(['Mochila negra, pesadísima: portátil, apuntes, ropa de gimnasio y el tupper en el fondo, aplastado. Llevas media vida a cuestas, de forma literal.']);
  }
  async function actEspejo() {
    S.mirror = true; cost('espejo', 1);
    if (!S.dressed) await say(['Pijama arrugado, pelo de almohada y ojeras de actuario junior. El espejo no miente: solo redondea hacia abajo.']);
    else if (!S.bag) await say(['Camisa azul, pantalón gris oscuro, barba de semanas. Falta la mochila para parecer el que realmente eres.']);
    else await say(['Camisa azul, pantalón gris y la mochila negra a la espalda: el tupper ya viaja contigo. Te reconoces, pero con más peso del que marca la báscula.']);
  }
  async function actPuerta() {
    if (!allReady()) { Sound.bad(); await say('Todavía no: te falta ' + TASKS.filter(([k]) => k !== 'out' && !S.tasks[k]).map(([, t]) => t.charAt(0).toLowerCase() + t.slice(1)).join(' y ') + '.'); return; }
    advance(2); completeTask('out'); Sound.whoosh();
    await say(['Cierras la puerta con cuidado. La escalera huele a lunes. Fuera, el andén te espera con ochocientas personas y ninguna ganas de ser tu amigo.']);
    await startPlatform();
  }


  /* ============================== Mundos, decisiones y finales ============================== */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fadeEl = $('#fade'), choiceEl = $('#choice'), freeHintEl = $('#freehint');
  async function fade(on) { fadeEl.classList.toggle('on', on); await sleep(on ? 900 : 700); }
  let PLAT = null, inScript = false, inFree = false;
  function setTime(t) { S.time = t; clockEl.textContent = t; }
  function enterWorld(w, name) {
    if (A.group.parent) A.group.parent.remove(A.group);
    scene = w.scene; scene.add(A.group);
    if (fx.on && fx.composer.passes[0]) fx.composer.passes[0].scene = scene;
    ROOM = w.bounds; OBST = w.obst; TICK = w.tick; ACTS = w.acts; ACT_ROOTS = w.actRoots; WORLD = name;
    P.x = w.spawn[0]; P.z = w.spawn[1]; P.vx = P.vz = 0; P.walk = 0;
    const a = lookAngles(P.x, EYE, P.z, w.look[0], w.look[1], w.look[2]); P.yaw = P.bodyYaw = a.yaw; P.pitch = a.pitch;
    Sound.clue = clueLevel(); current = null; $('#prompt').hidden = true; renderer.shadowMap.needsUpdate = true;
    const hb = $('#act2'); if (w.hudAct) { hb.textContent = w.hudAct.label; hb.hidden = false; HUDKEY = w.hudAct.key; HUDID = w.hudAct.id; hb.onclick = () => { if (!S.busy) interact(HUDID); }; } else { hb.hidden = true; HUDKEY = null; }
  }
  function choose(options, title) {
    return new Promise((resolve) => {
      S.busy = true; if (document.pointerLockElement) document.exitPointerLock();
      choiceEl.innerHTML = `<h3>${title}</h3>` + options.map((o, i) => `<button type="button" class="opt" data-i="${i}"><kbd>${i + 1}</kbd><span><b>${o.label}</b><small>${o.hint || ''}</small></span></button>`).join('');
      choiceEl.hidden = false;
      const done = (i) => { window.removeEventListener('keydown', onKey); choiceEl.hidden = true; lockPointer(); resolve(options[i].id); };
      const onKey = (e) => { const n = +e.key; if (n >= 1 && n <= options.length) done(n - 1); };
      window.addEventListener('keydown', onKey);
      choiceEl.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => done(+b.dataset.i)));
    });
  }
  async function free(ms, hint, until) {                    // ventana en la que puedes pasear y mirar antes de que siga el guion
    inFree = true; S.busy = false; freeHintEl.hidden = !hint;
    const t0 = performance.now();
    while ((performance.now() - t0 < ms && !(until && until())) || S.busy) {
      if (hint) freeHintEl.textContent = hint.replace('{s}', Math.max(0, Math.ceil((ms - (performance.now() - t0)) / 1000)));
      await sleep(150);
    }
    freeHintEl.hidden = true; inFree = false; S.busy = true;
  }
  const API = { chart: async () => { if (document.pointerLockElement) document.exitPointerLock(); await Q.showMortality(); lockPointer(); }, say: async (l) => { await say(l); if (inScript && !inFree) S.busy = true; }, choose, tween, wait: sleep, setTime, free, P, S };
  function endScreen(title, text) {
    $('#hud').hidden = true; if (document.pointerLockElement) document.exitPointerLock();
    const end = document.createElement('div'); end.id = 'end';
    end.innerHTML = `<div><h2>${title}</h2><p>${text}</p><button class="btn primary" id="again">↻ Volver a probar</button></div>`;
    document.body.appendChild(end); end.querySelector('#again').addEventListener('click', () => location.reload());
  }

  /* Fin del recorrido: lo que antes cerraba la habitación, ahora cierra la mañana entera */
  function finishDay() { S.ended = true; $('#hud').hidden = true; $('#hint').hidden = true; if (document.pointerLockElement) document.exitPointerLock(); showEnd(); }

  /* ---- Final: el día como simulación. Salida a hora X, trayecto ~ N(62, 14²) min, oficina a las 07:35 ---- */
  function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function simulate(depart) {
    const N = 2000, LIMITE = 455, arr = [];
    for (let k = 0; k < N; k++) arr.push(depart + 8 + Math.max(48, 62 + 14 * gauss()));
    arr.sort((a, b) => a - b);
    return { p: arr.filter((x) => x <= LIMITE).length / N, mediana: arr[N >> 1], p90: arr[Math.floor(N * 0.9)] };
  }
  const FINALES = [['impecable', 'Mañana impecable'], ['normal', 'Mañana normal'], ['justo', 'Vas justo']];
  function showEnd() {
    const delay = 6 * (S.descuido || 0), r = simulate(S.min + delay), pct = Math.round(r.p * 100);
    const clave = pct >= 92 ? 'impecable' : pct >= 85 ? 'normal' : 'justo', titulo = FINALES.find(([k]) => k === clave)[1];
    let vistos = []; try { vistos = JSON.parse(store('ends') || '[]'); } catch (e) { }
    if (!vistos.includes(clave)) { vistos.push(clave); store('ends', JSON.stringify(vistos)); }
    const hechos = [['espejo', 'Te miraste al espejo'], ['cama', 'Miraste la cama'], ['escritorio', 'Abriste el portátil'], ['medalla', 'Miraste la medalla']];
    const end = document.createElement('div'); end.id = 'end'; end.setAttribute('role', 'dialog'); end.setAttribute('aria-label', 'Resumen de la mañana');
    end.innerHTML = `<div class="card">
      <h2>${titulo}</h2>
      <p class="lede">Sales de casa a las ${fmt(S.min)}. Con un trayecto que dura 62 min de media (desviación 14) y la oficina a las 07:35, el modelo de 2.000 trayectorias dice:${delay ? ` (Los trenes que dejaste pasar en el andén suman ${delay} min.)` : ''}</p>
      <div class="stats"><div><b>${pct} %</b><span>probabilidad de llegar a tiempo</span></div><div><b>${fmt(Math.round(r.mediana))}</b><span>llegada mediana</span></div><div><b>${fmt(Math.round(r.p90))}</b><span>percentil 90</span></div></div>
      <ul class="did">${hechos.map(([k, t]) => `<li class="${S.did.has(k) ? 'y' : ''}">${t}</li>`).join('')}</ul>
      <p class="fine">Cada detalle que miras cuesta minutos y cambia la probabilidad. Finales vistos: ${vistos.length} de 3.</p>
      <p class="links"><a href="https://www.linkedin.com/in/luiz-luzuriaga-izquierdo" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://github.com/LuizLuzuriaga" target="_blank" rel="noopener">GitHub</a> · <a href="https://luizluzuriaga.github.io/" target="_blank" rel="noopener">Web de Luiz</a></p>
      <button class="btn primary" id="again">↻ Otra mañana</button></div>`;

    document.body.appendChild(end); end.querySelector('#again').addEventListener('click', () => location.reload());
  }
  async function startPlatform() {
    S.busy = true; inScript = true; $('#hud').hidden = false;
    await fade(true);
    if (!PLAT) PLAT = Q.buildPlatform(renderer, envTex);
    enterWorld(PLAT, 'platform'); setTime('06:25'); setTasks([['Subir a un tren', false]]);
    if (window.Sound && Sound.on) Sound.ambience('platform');
    await fade(false);
    const r = await PLAT.play(API); inScript = false;
    if (r === 'subido') {
      setTasks([['Subir a un tren', true]]);
      await sleep(300); await startTrain(); return;
    } else {
      if (window.Sound && Sound.on) Sound.bad();
      await fade(true);
      endScreen('Cervezas con Chelu', 'Dejas pasar el cuarto tren. Miras el panel, miras el móvil y Chelu escribe: «¿Cañas?». La probabilidad de decir que no era del 0,3 %. Esperanza de vida laboral: cero días. Esperanza de vida social: al alza.');
    }
  }


  let TRN = null, HUDKEY = null, HUDID = null;
  async function startTrain() {
    S.busy = true; inScript = true; $('#hud').hidden = false;
    await fade(true);
    if (!TRN) TRN = Q.buildTrain(renderer, envTex);
    enterWorld(TRN, 'train'); setTime('07:20'); setTasks([['Llegar a Nuevos Ministerios', false]]);
    if (window.Sound && Sound.on) Sound.ambience('train');
    await fade(false);
    const r = await TRN.play(API); inScript = false;
    setTasks([['Llegar a Nuevos Ministerios', true]]);
    await fade(true);
    await startAzca();
  }

  let AZC = null;
  async function startAzca() {
    S.busy = true; inScript = true; $('#hud').hidden = false;
    await fade(true);
    if (!AZC) AZC = Q.buildAzca(renderer, envTex);
    enterWorld(AZC, 'azca'); setTime('07:55'); setTasks([['Entrar en la aseguradora', false]]);
    if (window.Sound && Sound.on) Sound.ambience('street');
    await fade(false);
    await AZC.play(API); inScript = false;
    setTasks([['Entrar en la aseguradora', true]]);
    await fade(true);
    finishDay();
  }

  /* ---- Panel de contenido ---- */
  const panelEl = $('#panel');
  function openPanel(html) {
    return new Promise((resolve) => {
      if (document.pointerLockElement) document.exitPointerLock();
      panelEl.innerHTML = `<div class="box" tabindex="-1">${html}<button class="btn" id="pclose">Cerrar</button></div>`; panelEl.hidden = false;
      const close = () => { panelEl.hidden = true; panelEl.innerHTML = ''; window.removeEventListener('keydown', onKey, true); resolve(); };
      const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); } };
      window.addEventListener('keydown', onKey, true);
      panelEl.querySelector('#pclose').addEventListener('click', close); panelEl.querySelector('.box').focus({ preventScroll: true });
    });
  }

  /* ============================== Entrada ============================== */
  function lockPointer() { if (COARSE || !canvas.requestPointerLock) return; try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
  const keys = {};
  window.addEventListener('keydown', (e) => { if ((e.key === 'v' || e.key === 'V') && !e.repeat) toggleCam(); keys[e.key.toLowerCase()] = true; if (walking && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) walkCancel = true; if (e.key === 'Escape' && !cfgEl.hidden) { closeCfg(); return; } if (!S.started || S.busy) return; if (HUDKEY && e.key.toLowerCase() === HUDKEY) { interact(HUDID); return; } if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') { if (current) interact(current); } });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const touches = new Map(); let mouse = null;
  const stickEl = $('#stickL'), stickDot = stickEl.querySelector('i'); let moveVec = { x: 0, y: 0 };
  const LOOK_SENS = () => (COARSE ? 0.0052 : 0.0034) * CFG.sens;
  function look(dx, dy) { const k = LOOK_SENS(); P.yaw -= dx * k; P.pitch = clamp(P.pitch - dy * k, -1.35, 1.35); }

  canvas.addEventListener('pointerdown', (e) => {
    if (!S.started) return;
    if (walking) walkCancel = true;
    if (e.pointerType === 'touch') {
      const left = e.clientX < innerWidth * 0.45;
      touches.set(e.pointerId, { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), mode: left ? 'move' : 'look', moved: 0 });
      if (left) { stickEl.hidden = false; stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; stickDot.style.transform = ''; }
      canvas.setPointerCapture(e.pointerId);
    } else { mouse = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: 0 }; if (!document.pointerLockElement) canvas.setPointerCapture(e.pointerId); }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      const t = touches.get(e.pointerId); if (!t) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y; t.x = e.clientX; t.y = e.clientY; t.moved = Math.hypot(e.clientX - t.x0, e.clientY - t.y0);
      if (S.busy) return;
      if (t.mode === 'look') look(dx, dy);
      else { const vx = clamp((t.x - t.x0) / 50, -1, 1), vy = clamp((t.y - t.y0) / 50, -1, 1); moveVec = { x: vx, y: vy }; stickDot.style.transform = `translate(${vx * 32}px, ${vy * 32}px)`; }
    } else if (document.pointerLockElement === canvas) { if (!S.busy) look(e.movementX, e.movementY); }
    else if (mouse) { const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y; mouse.x = e.clientX; mouse.y = e.clientY; mouse.moved = Math.hypot(e.clientX - mouse.x0, e.clientY - mouse.y0); if (!S.busy && mouse.moved > 4) look(dx, dy); }
  });
  const endPtr = (e) => {
    if (S.busy && !msg.hidden && !S.ended) { msg.dispatchEvent(new Event('pointerup')); mouse = null; touches.delete(e.pointerId); stickEl.hidden = true; moveVec = { x: 0, y: 0 }; return; }
    if (e.pointerType === 'touch') {
      const t = touches.get(e.pointerId); if (!t) return; touches.delete(e.pointerId);
      if (t.mode === 'move') { stickEl.hidden = true; moveVec = { x: 0, y: 0 }; }
      if (t.moved < 10 && performance.now() - t.t0 < 400 && !S.busy) tapAt(e.clientX, e.clientY);
    } else {
      if (document.pointerLockElement === canvas) { if (!S.busy && current) interact(current); }
      else if (mouse && mouse.moved < 5 && !S.busy) { const hit = picked(e.clientX, e.clientY); if (hit) interact(hit); else lockPointer(); }
      mouse = null;
    }
  };
  canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);

  /* ---- Selección por rayo ---- */
  const ray = new THREE.Raycaster(); ray.far = 6;
  function pickRay(ndc) { ray.setFromCamera(ndc, camera); if (camK > 0.05) ray.ray.origin.set(P.x, EYE, P.z); const hits = ray.intersectObjects(ACT_ROOTS, true).filter((h) => h.object.userData.act); return hits.length ? hits[0].object.userData.act : null; }
  function picked(cx, cy) { return pickRay(new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1)); }
  function tapAt(cx, cy) { const id = picked(cx, cy); if (id) interact(id); }
  let current = null; const promptEl = $('#prompt'), cross = $('#cross');
  let rayTick = 0;
  function updatePrompt() {
    if (S.busy || !S.started) { promptEl.hidden = true; cross.classList.remove('on'); current = null; return; }
    if (rayTick++ % 3 === 0) { const id = pickRay(new THREE.Vector2(0, 0)); current = id && ACTS[id] && ACTS[id].enabled() ? id : null; }   // el rayo no hace falta cada fotograma
    if (current) { promptEl.hidden = false; promptEl.textContent = (COARSE ? '' : 'E · ') + ACTS[current].label; cross.classList.add('on'); } else { promptEl.hidden = true; cross.classList.remove('on'); }
  }

  /* ============================== Bucle ============================== */
  function resize() {
    renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 80 : 72; camera.updateProjectionMatrix();
    fx.resize(innerWidth, innerHeight, pr);
  }
  window.addEventListener('resize', resize); resize();

  let frameN = 0, lastCalls = 0, lastTris = 0, third = false, camK = 0;
  function toggleCam() { third = !third; const b = $('#cam'); b.setAttribute('aria-pressed', third); b.textContent = third ? '🧍' : '🎥'; try { localStorage.setItem('qx3dCam', third ? '3' : '1'); } catch (e) { } }
  try { if (localStorage.getItem('qx3dCam') === '3') { third = true; camK = 1; } } catch (e) { }
  const clock = new THREE.Clock(); let alarmT = 0, frames = 0, tAdapt = 0, fpsT = 0, fpsN = 0, tier = 0;
  const fpsEl = $('#fps'), clockEl = $('#clock');
  function drawPhone(on, t) {
    const g = R.ref.phoneCanvas.getContext('2d');
    g.fillStyle = on ? (Math.sin(t * 9) > 0 ? '#0d4a5e' : '#0a2f40') : '#05121a'; g.fillRect(0, 0, 256, 512);
    g.fillStyle = '#d6fbff'; g.font = '700 74px Segoe UI, Arial'; g.textAlign = 'center'; g.fillText(S.time, 128, 230);
    g.font = '24px Segoe UI, Arial'; g.fillStyle = '#6fe8ff'; g.fillText(on ? '⏰ DESPERTADOR' : 'Alarma apagada', 128, 280);
    if (on) { g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(128, 380, 44, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '22px Segoe UI'; g.fillText('Parar', 128, 388); }
    R.ref.phoneTex.needsUpdate = true;
  }
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    if (S.started && !S.busy && cfgEl.hidden) {
      let fx0 = 0, fz = 0;
      if (keys['w'] || keys['arrowup']) fz += 1; if (keys['s'] || keys['arrowdown']) fz -= 1; if (keys['a']) fx0 -= 1; if (keys['d']) fx0 += 1;
      if (keys['arrowleft']) P.yaw += 1.8 * dt; if (keys['arrowright']) P.yaw -= 1.8 * dt;
      fx0 += moveVec.x; fz -= moveVec.y;
      const len = Math.hypot(fx0, fz); if (len > 1) { fx0 /= len; fz /= len; }
      const sp = keys['shift'] ? 3.0 : 1.7, sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      const tvx = (-sy * fz + cy * fx0) * sp, tvz = (-cy * fz - sy * fx0) * sp;
      P.vx = lerp(P.vx, tvx, Math.min(1, dt * 9)); P.vz = lerp(P.vz, tvz, Math.min(1, dt * 9));
      const [nx, nz] = collide(P.x + P.vx * dt, P.z + P.vz * dt); P.x = nx; P.z = nz; P.walk = Math.min(1, Math.hypot(P.vx, P.vz) / 1.5);
    } else if (!S.busy) { P.vx = P.vz = 0; }

    const diff = angDiff(P.yaw, P.bodyYaw);
    if (P.walk > 0.2) P.bodyYaw += diff * Math.min(1, dt * 8); else if (Math.abs(diff) > 0.9) P.bodyYaw += (diff - Math.sign(diff) * 0.9) * Math.min(1, dt * 6);
    A.group.position.set(P.x + Math.sin(P.bodyYaw) * 0.12, 0, P.z + Math.cos(P.bodyYaw) * 0.12); A.group.rotation.y = P.bodyYaw;
    A.headPivot.rotation.set(clamp(P.pitch, -1.0, 1.0) * 0.9, angDiff(P.yaw, P.bodyYaw), 0);
    A.update(dt, t, P.walk, P.pitch);

    P.bob += dt * 8.5 * P.walk;
    const calm = CFG.calm ? 0 : 1, bobY = Math.abs(Math.sin(P.bob)) * 0.028 * P.walk * calm + Math.sin(t * 1.6) * 0.004 * calm, bobX = Math.cos(P.bob) * 0.012 * P.walk * calm;
    camK = lerp(camK, third ? 1 : 0, Math.min(1, dt * 7));
    let ex = P.x + Math.cos(P.yaw) * bobX, ey = EYE + bobY, ez = P.z - Math.sin(P.yaw) * bobX;
    if (camK > 0.01) {                                          // tercera persona: detrás y algo por encima, sin atravesar paredes ni techo
      const cp = Math.cos(P.pitch), fx1 = -Math.sin(P.yaw) * cp, fy1 = Math.sin(P.pitch), fz1 = -Math.cos(P.yaw) * cp;
      const zMin = ROOM.minZ + (WORLD === 'bed' ? 0.2 : -0.4), top = WORLD === 'bed' ? 2.4 : WORLD === 'azca' ? 30 : 3.1;
      let d = 2.6 * camK, cx = ex, cy = ey, cz = ez;
      for (let i = 0; i < 40; i++) { cx = ex - fx1 * d; cy = ey - fy1 * d + 0.35 * camK; cz = ez - fz1 * d; if (cx > ROOM.minX + 0.2 && cx < ROOM.maxX - 0.2 && cz > zMin && cz < ROOM.maxZ - 0.2 && cy > 0.25 && cy < top) break; d *= 0.9; }
      ex = cx; ey = cy; ez = cz;
    }
    camera.position.set(ex, ey, ez);
    camera.rotation.set(P.pitch, P.yaw, Math.sin(P.bob) * 0.004 * P.walk * calm * (1 - camK));
    if (WORLD === 'train' && TRN) { camera.position.y += TRN.sway.y; camera.rotation.z += TRN.sway.roll; }
    if (camK > 0.05) camera.layers.enable(1); else camera.layers.disable(1);     // la cabeza (capa 1) solo se ve en el espejo y en tercera persona

    if (WORLD === 'bed') drawPhone(S.alarmOn, t);
    if (clockEl.textContent !== S.time) clockEl.textContent = S.time;
    if (WORLD === 'bed' && S.alarmOn) { const k = Math.max(0, Math.sin(t * 9)); R.ref.phoneLight.intensity = 0.5 + k * 0.9; R.ref.halo.material.opacity = 0.45 + k * 0.45; R.ref.phone.position.x = -0.5 + Math.sin(t * 60) * 0.0012; }
    alarmT += dt; if (WORLD === 'bed' && S.alarmOn && S.started && alarmT > 3.4 && Sound.on) { alarmT = 0; Sound.alarm(3); }
    TICK.forEach((f) => f(dt, t));

    updatePrompt(); updateGlows(t); updateHint();
    renderer.shadowMap.needsUpdate = (frameN++ % 2 === 0);
    if (!fx.render(t)) renderer.render(scene, camera);
    lastCalls = renderer.info.render.calls; lastTris = renderer.info.render.triangles; renderer.info.reset();

    // calidad adaptable: primero resolución, luego bloom
    frames++; tAdapt += dt; fpsT += dt; fpsN++;
    if (tAdapt > 2.5) {
      const avg = tAdapt / frames;
      if (adapt && avg > 0.036) {
        if (pr > 0.8) { pr = Math.max(0.7, pr * 0.82); resize(); toast('Bajé la resolución para que vaya fluido. Puedes cambiarlo en ⚙ Ajustes.'); }
        else if (tier < 1 && fx.on) { fx.bloom.enabled = false; tier = 1; }
        else if (pr > 0.55) { pr = 0.55; resize(); }
      }
      tAdapt = 0; frames = 0;
    }
    if (DEBUG && fpsT > 0.5) { fpsEl.hidden = false; fpsEl.textContent = `${Math.round(fpsN / fpsT)} fps · ${lastCalls} llamadas · ${Math.round(lastTris / 1000)}k tri · ratio ${pr.toFixed(2)} · ${fx.on ? 'HDR+bloom' : 'directo'}${fx.bloom && !fx.bloom.enabled ? ' (sin bloom)' : ''}`; fpsT = 0; fpsN = 0; }
  }

  /* ============================== Pistas, avisos y ajustes ============================== */
  const hintEl = $('#hint'), toastEl = $('#toast'); let toastT = 0, toasted = false;
  function toast(text) { if (toasted) return; toasted = true; toastEl.textContent = text; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 6000); }
  const NEXT = [['alarm', 'el móvil de la mesilla, que suena y brilla'], ['dress', 'el armario'], ['bag', 'la silla con la mochila y el bolso'], ['out', 'la puerta']];
  function updateHint() {
    if (!S.started || S.busy || S.ended || !cfgEl.hidden || performance.now() - S.lastProgress < 30000) { hintEl.hidden = true; return; }
    const n = NEXT.find(([k]) => !S.tasks[k]); if (!n) { hintEl.hidden = true; return; }
    hintEl.textContent = 'Pista: mira hacia ' + n[1] + '.'; hintEl.hidden = false;
  }
  const cfgEl = $('#cfg');
  function closeCfg() { cfgEl.hidden = true; $('#cfgBtn').focus(); }
  function openCfg() { cfgEl.hidden = false; if (document.pointerLockElement) document.exitPointerLock(); $('#cfgSens').focus(); }
  function setSound(on) {
    if (on !== Sound.on) Sound.toggle();
    const e = $('#snd'); e.textContent = Sound.on ? '🔊' : '🔇'; e.setAttribute('aria-pressed', Sound.on); $('#cfgSound').checked = Sound.on;
    if (Sound.on) Sound.ambience('room');
  }
  function applyQuality(q) {
    CFG.quality = q; adapt = q === 'auto'; tier = 0;
    if (q === 'baja') { pr = 0.7; tier = 1; } else pr = Math.min(window.devicePixelRatio || 1, q === 'alta' ? 1.75 : (HIGH ? 1.75 : 1.4));
    if (fx.on && fx.bloom) fx.bloom.enabled = q !== 'baja';
    resize();
  }
  let adapt = CFG.quality === 'auto';
  $('#cfgBtn').addEventListener('click', () => (cfgEl.hidden ? openCfg() : closeCfg())); $('#cfgClose').addEventListener('click', closeCfg);
  $('#cfgSens').value = CFG.sens; $('#cfgSens').addEventListener('input', (e) => { CFG.sens = +e.target.value; saveCfg(); });
  $('#cfgSound').addEventListener('change', (e) => { CFG.sound = e.target.checked; setSound(CFG.sound); saveCfg(); });
  $('#cfgCalm').checked = CFG.calm; $('#cfgCalm').addEventListener('change', (e) => { CFG.calm = e.target.checked; saveCfg(); });
  $('#cfgQ').value = CFG.quality; $('#cfgQ').addEventListener('change', (e) => { applyQuality(e.target.value); saveCfg(); });

  /* ============================== Arranque ============================== */
  renderTasks(); frame();
  $('#cam').addEventListener('click', toggleCam); if (third) $('#cam').textContent = '🧍';
  $('#snd').addEventListener('click', () => { CFG.sound = !Sound.on; saveCfg(); setSound(CFG.sound); });
  if (CFG.quality !== 'auto') applyQuality(CFG.quality);
  const go = $('#go');
  requestAnimationFrame(() => requestAnimationFrame(() => { go.disabled = false; go.textContent = '▶ Despertar'; go.focus(); }));   // el botón se activa cuando ya hay un fotograma dibujado
  go.addEventListener('click', () => {
    $('#start').style.display = 'none'; $('#hud').hidden = false; S.started = true; S.busy = false; S.lastProgress = performance.now();
    lockPointer(); if (CFG.sound) setSound(true);
    if (/[?&]anden/.test(location.search)) { S.alarmOn = false; startPlatform(); return; }
    if (/[?&]tren/.test(location.search)) { S.alarmOn = false; startTrain(); return; }
    if (/[?&]azca/.test(location.search)) { S.alarmOn = false; startAzca(); return; }
    const how = COARSE ? 'Arrastra el pulgar izquierdo para andar y el derecho para mirar. Toca lo que quieras usar.' : 'Mueve el ratón para mirar, W A S D para andar y E sobre lo que brille.';
    if (store('intro')) tip([how]);
    else { store('intro', '1'); tip(['05:45. Fuera todavía es de noche y una farola pinta la pared de naranja. El despertador cree que es una buena hora para vivir.', { text: 'Primera estimación del día: probabilidad de que el tren vaya vacío. Estimador puntual: cero.', think: true }, how]); }
  });
  window.__qx = { get plat() { return PLAT; }, toggleCam, startPlatform, enterWorld, S, P, ACTS, interact, camera, scene, renderer, say, fx, R, A };
})();
