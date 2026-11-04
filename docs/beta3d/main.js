/* qx 3D — prueba del dormitorio en primera persona. Lógica de juego, cámara, entrada y bucle.
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

  const scene = new THREE.Scene();
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

  /* ============================== Mundo ============================== */
  const R = Q.buildRoom(scene, { pr, high: HIGH });
  const A = Q.buildAvatar(scene);
  scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) m.envMapIntensity = 0.28; }); });
  A.group.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.isMeshStandardMaterial) m.envMapIntensity = 0.08; }); });
  const fx = Q.initFX(renderer, scene, camera, pr);
  if (!fx.on) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputEncoding = THREE.sRGBEncoding; }
  else document.querySelectorAll('.fx').forEach((e) => { e.style.display = 'none'; });

  /* ============================== Estado ============================== */
  const S = { time: '05:45', alarmOn: true, dressed: false, bag: false, mirror: false, busy: true, started: false, tasks: { alarm: false, dress: false, bag: false, out: false } };
  const P = { x: -0.35, z: -0.55, yaw: 0, pitch: 0, bodyYaw: 0, vx: 0, vz: 0, walk: 0, bob: 0 };
  const EYE = Q.EYE;
  function lookAngles(fx0, fy, fz, tx, ty, tz) { const dx = tx - fx0, dz = tz - fz, dy = ty - fy; return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }; }
  { const a = lookAngles(P.x, EYE, P.z, -0.5, 0.55, -1.56); P.yaw = P.bodyYaw = a.yaw; P.pitch = a.pitch; }

  const ROOM = Q.ROOM, RAD = 0.24;
  function collide(x, z) {
    x = clamp(x, ROOM.minX + RAD, ROOM.maxX - RAD); z = clamp(z, ROOM.minZ + RAD, ROOM.maxZ - RAD);
    for (const o of R.obst) {
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
  const TASKS = [['alarm', 'Apagar el despertador'], ['dress', 'Vestirte para el día'], ['bag', 'Cargar la mochila y el bolso'], ['out', 'Salir de casa']];
  function renderTasks() { tasksEl.innerHTML = TASKS.map(([k, t]) => `<li class="${S.tasks[k] ? 'done' : ''}">${t}</li>`).join(''); }
  function tag(obj, id) { obj.traverse((o) => { if (o.isMesh) o.userData.act = id; }); }
  tag(R.g.nightstand, 'movil'); tag(R.g.wardrobe, 'armario'); tag(R.g.mirror, 'espejo'); tag(R.g.mirrorFrame, 'espejo'); tag(R.g.doorG, 'puerta'); tag(R.g.chair, 'bolsos'); tag(R.g.bed, 'cama'); tag(R.g.desk, 'escritorio'); tag(R.g.shelf, 'medalla');
  const ACT_ROOTS = [R.g.nightstand, R.g.wardrobe, R.g.mirror, R.g.mirrorFrame, R.g.doorG, R.g.chair, R.g.bed, R.g.desk, R.g.shelf];
  const ACTS = {
    movil: { label: 'Apagar el despertador', stand: [-0.4, -0.85], look: [-0.5, 0.55, -1.56], reach: true, enabled: () => S.alarmOn, run: actMovil },
    armario: { label: 'Abrir el armario y vestirte', stand: [-0.05, -0.2], look: [2.0, 1.45, -0.55], reach: true, enabled: () => !S.dressed, run: actArmario },
    espejo: { label: 'Mirarte al espejo', stand: [1.2, 1.2], look: [2.19, 1.5, 1.2], enabled: () => true, run: actEspejo },
    bolsos: { label: 'Cargar la mochila y el bolso', stand: [-0.55, 1.0], look: [-1.2, 0.72, 1.15], reach: true, enabled: () => !S.bag, run: actBolsos },
    puerta: { label: 'Salir de casa', stand: [0.05, 1.0], look: [0.05, 1.15, 1.8], reach: true, enabled: () => true, run: actPuerta },
    cama: { label: 'Mirar la cama', stand: [-0.4, 0.05], look: [-1.5, 0.5, -0.4], enabled: () => true, run: async () => { await say('Tu cama, todavía caliente. Tiene un 100 % de retención y cero rentabilidad.'); } },
    escritorio: { label: 'Mirar el escritorio', stand: [-0.95, 0.3], look: [-1.9, 0.85, 0.85], enabled: () => true, run: async () => { await say(['Apuntes de Previsión Social, el portátil cerrado y la taza de ayer. El escritorio de quien estudia a trozos y vive de tren en tren.']); } },
    medalla: { label: 'Mirar la medalla', stand: [-0.9, 1.5], look: [-2.15, 1.5, 1.62], enabled: () => true, run: async () => { await say(['La medalla de la San Silvestre. Diez kilómetros a ritmo constante: el único estimador insesgado que tienes.']); } },
  };

  /* ---- Mensajes ---- */
  const msg = $('#msg'); let typingId = 0;
  function say(lines) { if (!Array.isArray(lines)) lines = [lines]; S.busy = true; return (async () => { for (const l of lines) await sayOne(typeof l === 'string' ? { text: l } : l); S.busy = false; })(); }
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
  async function walkTo(stand, look) {
    const sx = P.x, sz = P.z, sy = P.yaw, sp = P.pitch, a = lookAngles(stand[0], EYE, stand[1], look[0], look[1], look[2]);
    const dist = Math.hypot(stand[0] - sx, stand[1] - sz), d = clamp(dist * 560, 500, 1800);
    await tween(d, (e) => { P.x = lerp(sx, stand[0], e); P.z = lerp(sz, stand[1], e); P.yaw = sy + angDiff(a.yaw, sy) * e; P.pitch = lerp(sp, a.pitch, e); P.walk = dist > 0.05 ? 1 : 0; });
    P.walk = 0; P.bodyYaw = P.yaw;                                  // el cuerpo termina mirando a lo mismo que tú
  }
  async function interact(id) {
    const a = ACTS[id]; if (!a || S.busy) return;
    if (!a.enabled()) { await say('Eso ya está hecho.'); return; }
    S.busy = true; $('#prompt').hidden = true;
    await walkTo(a.stand, a.look);
    if (a.reach) await tween(380, (e) => { A.reach = e; });
    await a.run();
    if (a.reach) await tween(380, (e) => { A.reach = 1 - e; });
    A.reach = 0; S.busy = false;
  }

  /* ---- Acciones ---- */
  async function actMovil() {
    S.alarmOn = false; S.tasks.alarm = true; S.time = '05:47'; renderTasks();
    R.ref.phoneLight.intensity = 0.25; R.ref.halo.material.opacity = 0.35;
    await say(['Apagas la alarma. Silencio. Por fin una variable que controlas.']);
  }
  async function actArmario() {
    R.ref.wInside.intensity = 2.4;
    await tween(900, (e) => { R.ref.doorN.rotation.y = -e * 1.9; });
    await say(['Camisa azul, pantalón gris oscuro, zapatos negros. El uniforme de quien no tiene uniforme.']);
    A.dress(true); R.ref.shirt.visible = false; R.ref.pants.visible = false; S.dressed = true; S.tasks.dress = true; S.time = '05:55'; renderTasks();
    await say([{ text: 'Mírate al espejo si quieres comprobar el resultado. Es la única reunión en la que estás seguro de quién va a estar.', think: true }]);
  }
  async function actBolsos() {
    R.ref.chairBags.visible = false; A.carry(); S.bag = true; S.tasks.bag = true; S.time = '06:00'; renderTasks();
    await say(['Mochila negra, pesadísima: portátil, apuntes, ropa de gimnasio. Bolso marrón de los de hombre, con el tupper. Llevas media vida a cuestas, de forma literal.']);
  }
  async function actEspejo() {
    S.mirror = true;
    if (!S.dressed) await say(['Pijama arrugado, pelo de almohada y ojeras de actuario junior. El espejo no miente: solo redondea hacia abajo.']);
    else if (!S.bag) await say(['Camisa azul, pantalón gris oscuro, barba de semanas. Falta la mochila para parecer el que realmente eres.']);
    else await say(['Camisa azul, pantalón gris, mochila negra a la espalda y bolso marrón al costado: el tupper ya viaja contigo. Te reconoces, pero con más peso del que marca la báscula.']);
  }
  async function actPuerta() {
    const ok = S.tasks.alarm && S.tasks.dress && S.tasks.bag;
    if (!ok) { await say('Todavía no. En pijama, con el despertador sonando y sin mochila no llegas ni al portal.'); return; }
    S.tasks.out = true; renderTasks();
    await say(['Cierras la puerta con cuidado. La escalera huele a lunes. Fuera, el andén te espera con ochocientas personas y ninguna ganas de ser tu amigo.']);
    $('#hud').hidden = true; if (document.pointerLockElement) document.exitPointerLock();
    const end = document.createElement('div'); end.id = 'end';
    end.innerHTML = '<div><h2>Fin de la prueba 3D</h2><p>Aquí seguiría la historia: el andén, el tren, Azca, la oficina y el café. Dime si el espejo, el movimiento y el nivel de detalle te convencen.</p><button class="btn primary" id="again">↻ Volver a probar</button></div>';
    document.body.appendChild(end); end.querySelector('#again').addEventListener('click', () => location.reload());
  }

  /* ============================== Entrada ============================== */
  function lockPointer() { if (COARSE || !canvas.requestPointerLock) return; try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; if (!S.started || S.busy) return; if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') { if (current) interact(current); } });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  const touches = new Map(); let mouse = null;
  const stickEl = $('#stickL'), stickDot = stickEl.querySelector('i'); let moveVec = { x: 0, y: 0 };
  const LOOK_SENS = COARSE ? 0.0052 : 0.0034;
  function look(dx, dy) { P.yaw -= dx * LOOK_SENS; P.pitch = clamp(P.pitch - dy * LOOK_SENS, -1.35, 1.35); }

  canvas.addEventListener('pointerdown', (e) => {
    if (!S.started) return;
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
  function pickRay(ndc) { ray.setFromCamera(ndc, camera); const hits = ray.intersectObjects(ACT_ROOTS, true).filter((h) => h.object.userData.act); return hits.length ? hits[0].object.userData.act : null; }
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

  let frameN = 0, lastCalls = 0, lastTris = 0;
  const clock = new THREE.Clock(); let alarmT = 0, frames = 0, tAdapt = 0, fpsT = 0, fpsN = 0, tier = 0;
  const fpsEl = $('#fps');
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
    if (S.started && !S.busy) {
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
    const bobY = Math.abs(Math.sin(P.bob)) * 0.028 * P.walk + Math.sin(t * 1.6) * 0.004, bobX = Math.cos(P.bob) * 0.012 * P.walk;
    camera.position.set(P.x + Math.cos(P.yaw) * bobX, EYE + bobY, P.z - Math.sin(P.yaw) * bobX);
    camera.rotation.set(P.pitch, P.yaw, Math.sin(P.bob) * 0.004 * P.walk);

    drawPhone(S.alarmOn, t);
    if (S.alarmOn) { const k = Math.max(0, Math.sin(t * 9)); R.ref.phoneLight.intensity = 0.5 + k * 0.9; R.ref.halo.material.opacity = 0.45 + k * 0.45; R.ref.phone.position.x = -0.5 + Math.sin(t * 60) * 0.0012; }
    alarmT += dt; if (S.alarmOn && S.started && alarmT > 3.4 && Sound.on) { alarmT = 0; Sound.alarm(3); }
    R.tick.forEach((f) => f(dt, t));

    updatePrompt();
    renderer.shadowMap.needsUpdate = (frameN++ % 2 === 0);
    if (!fx.render(t)) renderer.render(scene, camera);
    lastCalls = renderer.info.render.calls; lastTris = renderer.info.render.triangles; renderer.info.reset();

    // calidad adaptable: primero resolución, luego bloom
    frames++; tAdapt += dt; fpsT += dt; fpsN++;
    if (tAdapt > 2.5) {
      const avg = tAdapt / frames;
      if (avg > 0.036) {
        if (pr > 0.8) { pr = Math.max(0.7, pr * 0.82); resize(); }
        else if (tier < 1 && fx.on) { fx.bloom.enabled = false; tier = 1; }
        else if (pr > 0.55) { pr = 0.55; resize(); }
      }
      tAdapt = 0; frames = 0;
    }
    if (DEBUG && fpsT > 0.5) { fpsEl.hidden = false; fpsEl.textContent = `${Math.round(fpsN / fpsT)} fps · ${lastCalls} llamadas · ${Math.round(lastTris / 1000)}k tri · ratio ${pr.toFixed(2)} · ${fx.on ? 'HDR+bloom' : 'directo'}${fx.bloom && !fx.bloom.enabled ? ' (sin bloom)' : ''}`; fpsT = 0; fpsN = 0; }
  }

  /* ============================== Arranque ============================== */
  renderTasks(); frame();
  $('#snd').addEventListener('click', () => { const on = Sound.toggle(); $('#snd').textContent = on ? '🔊' : '🔇'; $('#snd').setAttribute('aria-pressed', on); if (on) Sound.ambience('room'); });
  $('#go').addEventListener('click', async () => {
    $('#start').style.display = 'none'; $('#hud').hidden = false; S.started = true; S.busy = true;
    lockPointer();
    await say(['05:45. Fuera todavía es de noche y una farola pinta la pared de naranja. El despertador cree que es una buena hora para vivir.',
      { text: 'Primera estimación del día: probabilidad de que el tren vaya vacío. Estimador puntual: cero.', think: true },
      COARSE ? 'Arrastra el pulgar izquierdo para andar y el derecho para mirar. Toca lo que quieras usar.' : 'Mueve el ratón para mirar, W A S D para andar y E sobre lo que brille.']);
  });
  window.__qx = { S, P, ACTS, interact, camera, scene, renderer, say, fx, R, A };
})();
