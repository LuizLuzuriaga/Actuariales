/* qx 3D — prueba del dormitorio en primera persona (Three.js r128, todo procedural).
   Lo que se quiere comprobar: espejo con reflejo real de tu cuerpo, cámara libre, movimiento con colisiones y calidad de vida. */
(() => {
  const DEBUG = /[?&]debug/.test(location.search);
  const COARSE = matchMedia('(pointer: coarse)').matches;
  const $ = (s) => document.querySelector(s);
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const angDiff = (a, b) => { let d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

  /* ============================== Renderer ============================== */
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  let pr = Math.min(window.devicePixelRatio || 1, COARSE ? 1.5 : 1.75);
  renderer.setPixelRatio(pr);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  /* La cabeza solo existe para el espejo: la cámara principal (capa 0) no la ve, las cámaras virtuales del espejo sí. */
  const mainRender = renderer.render.bind(renderer);
  let mainCamera = null;
  renderer.render = (s, cam) => { if (mainCamera && cam !== mainCamera) cam.layers.enableAll(); return mainRender(s, cam); };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03050a);
  scene.fog = new THREE.FogExp2(0x070a14, 0.07);
  const camera = new THREE.PerspectiveCamera(72, 1, 0.04, 40);
  camera.rotation.order = 'YXZ'; mainCamera = camera;

  /* ============================== Texturas ============================== */
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return t;
  }
  const woodTex = canvasTex(512, 512, (g, w, h) => {
    const plank = h / 8;
    for (let i = 0; i < 8; i++) {
      const base = 38 + Math.random() * 16;
      g.fillStyle = `rgb(${base + 22},${base + 10},${base})`; g.fillRect(0, i * plank, w, plank);
      for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, i * plank + Math.random() * plank, 40 + Math.random() * 160, 1.2); }
      g.fillStyle = '#0006'; g.fillRect(0, i * plank, w, 2);
      g.fillRect(((i * 173) % w), i * plank, 2, plank);
    }
  });
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(3, 2.4);

  const wallTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#1a2440'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(2, 1);

  const nightTex = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#0a1530'); gr.addColorStop(0.65, '#1b2142'); gr.addColorStop(1, '#3a2a30');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#05070f';
    [[0, 150, 50], [60, 120, 60], [130, 160, 50], [190, 110, 70]].forEach(([x, y, ww]) => g.fillRect(x, y, ww, h - y));
    g.fillStyle = '#ffd48a';
    for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, 125 + Math.random() * 120, 3, 4);
    g.fillStyle = '#ff9a3c'; g.beginPath(); g.arc(150, 70, 22, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,154,60,.25)'; g.beginPath(); g.arc(150, 70, 60, 0, 7); g.fill();
  });

  const glowTex = canvasTex(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  const beamTex = canvasTex(64, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,170,80,.55)'); gr.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const gx = g.createLinearGradient(0, 0, w, 0);
    gx.addColorStop(0, 'rgba(0,0,0,.6)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,.6)');
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.fillRect(0, 0, w, h);
  });

  const phoneCanvas = document.createElement('canvas'); phoneCanvas.width = 256; phoneCanvas.height = 512;
  const phoneTex = new THREE.CanvasTexture(phoneCanvas); phoneTex.encoding = THREE.sRGBEncoding;
  function drawPhone(on, t) {
    const g = phoneCanvas.getContext('2d'); g.fillStyle = on ? (Math.sin(t * 9) > 0 ? '#0d4a5e' : '#0a2f40') : '#06141c'; g.fillRect(0, 0, 256, 512);
    g.fillStyle = '#bff6ff'; g.font = '700 74px Segoe UI, Arial'; g.textAlign = 'center'; g.fillText(S.time, 128, 230);
    g.font = '24px Segoe UI, Arial'; g.fillStyle = '#6fe8ff'; g.fillText(on ? '⏰ DESPERTADOR' : 'Alarma apagada', 128, 280);
    if (on) { g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(128, 380, 44, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = '22px Segoe UI'; g.fillText('Parar', 128, 388); }
    phoneTex.needsUpdate = true;
  }

  /* ============================== Helpers ============================== */
  const mat = (color, rough = 0.85, metal = 0, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, extra));
  function box(w, h, d, material, x, y, z, parent = scene, shadow = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
  }
  const W = 4.4, D = 3.6, H = 2.6;
  const ROOM = { minX: -W / 2, maxX: W / 2, minZ: -D / 2, maxZ: D / 2 };

  /* ============================== Habitación ============================== */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat(0xffffff, 0.5, 0, { map: woodTex }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat(0x10151f, 1));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H; scene.add(ceil);

  const wallM = mat(0xffffff, 0.95, 0, { map: wallTex });
  const T = 0.2;
  box(T, H, D + 2 * T, wallM, -W / 2 - T / 2, H / 2, 0);                  // oeste
  box(T, H, D + 2 * T, wallM, W / 2 + T / 2, H / 2, 0);                   // este
  box(W, H, T, wallM, 0, H / 2, D / 2 + T / 2);                           // sur
  // norte con hueco de ventana x 0.2..1.6, y 1.0..2.1
  box(2.4, H, T, wallM, -W / 2 + 1.2, H / 2, -D / 2 - T / 2);
  box(0.6, H, T, wallM, 1.9 + 0.0, H / 2, -D / 2 - T / 2);
  box(1.4, 1.0, T, wallM, 0.9, 0.5, -D / 2 - T / 2);
  box(1.4, 0.5, T, wallM, 0.9, 2.35, -D / 2 - T / 2);
  // rodapié
  const skirt = mat(0x0c111d, 0.6);
  box(W, 0.1, 0.03, skirt, 0, 0.05, D / 2 - 0.015, scene, false); box(0.03, 0.1, D, skirt, -W / 2 + 0.015, 0.05, 0, scene, false);
  box(0.03, 0.1, D, skirt, W / 2 - 0.015, 0.05, 0, scene, false); box(W, 0.1, 0.03, skirt, 0, 0.05, -D / 2 + 0.015, scene, false);

  // ventana: cristal con la calle de noche, marco y cortinas
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), new THREE.MeshBasicMaterial({ map: nightTex, fog: false }));
  glass.position.set(0.9, 1.55, -D / 2 - 0.12); scene.add(glass);
  const frameM = mat(0x0b0e16, 0.5);
  box(1.46, 0.05, 0.08, frameM, 0.9, 1.0, -D / 2 + 0.02); box(1.46, 0.05, 0.08, frameM, 0.9, 2.1, -D / 2 + 0.02);
  box(0.05, 1.1, 0.08, frameM, 0.2, 1.55, -D / 2 + 0.02); box(0.05, 1.1, 0.08, frameM, 1.6, 1.55, -D / 2 + 0.02);
  box(0.04, 1.1, 0.06, frameM, 0.9, 1.55, -D / 2 + 0.02); box(1.4, 0.04, 0.06, frameM, 0.9, 1.55, -D / 2 + 0.02);
  box(1.6, 0.04, 0.2, mat(0x151a26, 0.6), 0.9, 0.98, -D / 2 + 0.1);
  const curtain = mat(0x0b0f1c, 1);
  box(0.28, 1.55, 0.08, curtain, 0.06, 1.55, -D / 2 + 0.12); box(0.28, 1.55, 0.08, curtain, 1.74, 1.55, -D / 2 + 0.12);
  // farola de la calle
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff9a3c, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  lampGlow.scale.set(1.8, 1.8, 1); lampGlow.position.set(1.15, 1.9, -D / 2 - 0.1); scene.add(lampGlow);

  /* ---- Cama ---- */
  const bed = new THREE.Group(); scene.add(bed);
  box(1.4, 0.3, 2.0, mat(0x1b140f, 0.7), -1.5, 0.15, -0.8, bed);
  box(1.34, 0.22, 1.92, mat(0x28324d, 0.95), -1.5, 0.41, -0.8, bed);
  box(1.36, 0.1, 1.2, mat(0x1b2a4b, 0.95), -1.5, 0.56, -0.28, bed).rotation.y = 0.03;
  const pillow = box(0.55, 0.13, 0.32, mat(0x8993a8, 0.95), -1.5, 0.58, -1.58, bed); pillow.rotation.y = 0.05;
  box(1.5, 0.9, 0.08, mat(0x120d09, 0.7), -1.5, 0.75, -D / 2 + 0.06, bed);

  /* ---- Mesilla y móvil ---- */
  const nightstand = new THREE.Group(); scene.add(nightstand);
  box(0.4, 0.5, 0.4, mat(0x2d2218, 0.7), -0.55, 0.25, -1.6, nightstand);
  const phone = new THREE.Group(); phone.position.set(-0.55, 0.512, -1.58); phone.rotation.y = 0.5; nightstand.add(phone);
  box(0.075, 0.012, 0.15, mat(0x05070c, 0.3, 0.5), 0, 0, 0, phone, false);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.065, 0.135), new THREE.MeshBasicMaterial({ map: phoneTex, fog: false }));
  screen.rotation.x = -Math.PI / 2; screen.position.y = 0.0075; phone.add(screen);
  const phoneLight = new THREE.PointLight(0x6fe8ff, 0.6, 1.8, 2); phoneLight.position.set(-0.55, 0.7, -1.55); scene.add(phoneLight);
  const phoneHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x6fe8ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.7 }));
  phoneHalo.scale.set(0.7, 0.7, 1); phoneHalo.position.set(-0.55, 0.56, -1.58); scene.add(phoneHalo);
  box(0.09, 0.12, 0.09, mat(0x203446, 0.2, 0.0, { transparent: true, opacity: 0.7 }), -0.4, 0.56, -1.7, nightstand);   // vaso de agua

  /* ---- Armario (la puerta norte se abre) ---- */
  const wardrobe = new THREE.Group(); scene.add(wardrobe);
  const woodDark = mat(0x16100c, 0.6);
  box(0.6, 2.2, 1.6, mat(0x0a0809, 0.9), 1.9, 1.1, -0.2, wardrobe);              // cuerpo / interior oscuro
  const shirt = new THREE.Group(); shirt.position.set(1.95, 1.5, -0.8); wardrobe.add(shirt);
  box(0.04, 0.62, 0.4, mat(0x2f63b8, 0.9), 0, 0, 0, shirt); box(0.04, 0.2, 0.62, mat(0x2f63b8, 0.9), 0, 0.2, 0, shirt, false);
  const pants = box(0.05, 0.72, 0.3, mat(0x3b3f48, 0.9), 1.95, 0.95, -0.62, wardrobe);
  const wInside = new THREE.PointLight(0xbfd8ff, 0, 1.6, 2); wInside.position.set(1.8, 1.7, -0.6); scene.add(wInside);
  const doorN = new THREE.Group(); doorN.position.set(1.585, 1.1, -1.0); wardrobe.add(doorN);
  box(0.03, 2.16, 0.78, woodDark, 0, 0, 0.39, doorN);
  box(0.02, 2.0, 0.04, mat(0x30261c, 0.5), -0.03, 0, 0.7, doorN, false);
  box(0.03, 2.16, 0.78, woodDark, 1.585, 1.1, 0.2, wardrobe);                    // puerta sur (fija)
  const wdoorHandle = box(0.03, 0.3, 0.02, mat(0x9a8450, 0.3, 0.8), 1.565, 1.1, -0.9, wardrobe, false);

  /* ---- Espejo (Reflector) ---- */
  const MIRROR = { x: 2.19, y: 1.28, z: 1.2, w: 0.62, h: 1.5 };
  const mirror = new THREE.Reflector(new THREE.PlaneGeometry(MIRROR.w, MIRROR.h), {
    clipBias: 0.003, textureWidth: Math.floor(512 * Math.min(pr, 1.25)), textureHeight: Math.floor(1100 * Math.min(pr, 1.25)), color: 0x9aa4b4,
  });
  mirror.position.set(MIRROR.x - 0.002, MIRROR.y, MIRROR.z); mirror.rotation.y = -Math.PI / 2; scene.add(mirror);
  const mirrorFrame = new THREE.Group(); scene.add(mirrorFrame);
  const fm = mat(0x6b5326, 0.4, 0.5), fx = MIRROR.x + 0.012, fh = MIRROR.h + 0.16, fw = MIRROR.w + 0.16;
  box(0.03, 0.08, fw, fm, fx, MIRROR.y + MIRROR.h / 2 + 0.04, MIRROR.z, mirrorFrame);                // arriba
  box(0.03, 0.08, fw, fm, fx, MIRROR.y - MIRROR.h / 2 - 0.04, MIRROR.z, mirrorFrame);                // abajo
  box(0.03, fh, 0.08, fm, fx, MIRROR.y, MIRROR.z - MIRROR.w / 2 - 0.04, mirrorFrame);                // lados
  box(0.03, fh, 0.08, fm, fx, MIRROR.y, MIRROR.z + MIRROR.w / 2 + 0.04, mirrorFrame);

  /* ---- Puerta ---- */
  const doorG = new THREE.Group(); scene.add(doorG);
  box(1.0, 2.1, 0.06, mat(0x0d0a09, 0.7), 0.05, 1.05, D / 2 - 0.03, doorG, false);
  box(0.9, 2.05, 0.05, mat(0x33261b, 0.65), 0.05, 1.025, D / 2 - 0.06, doorG);
  box(0.7, 0.8, 0.02, mat(0x2a1f16, 0.7), 0.05, 1.5, D / 2 - 0.09, doorG, false); box(0.7, 0.8, 0.02, mat(0x2a1f16, 0.7), 0.05, 0.55, D / 2 - 0.09, doorG, false);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), mat(0xb8a05a, 0.25, 0.9)); knob.position.set(0.42, 1.0, D / 2 - 0.12); doorG.add(knob);
  const crack = new THREE.PointLight(0xffe2a0, 0.9, 3.2, 2); crack.position.set(0.05, 0.12, D / 2 - 0.25); scene.add(crack);

  /* ---- Silla con mochila y bolso ---- */
  const chair = new THREE.Group(); scene.add(chair);
  const chairM = mat(0x14100d, 0.7);
  box(0.46, 0.05, 0.46, chairM, -1.7, 0.45, 1.35, chair); box(0.46, 0.55, 0.04, chairM, -1.7, 0.75, 1.56, chair);
  [[-1.9, 1.15], [-1.5, 1.15], [-1.9, 1.55], [-1.5, 1.55]].forEach(([x, z]) => box(0.04, 0.45, 0.04, chairM, x, 0.225, z, chair));
  const chairBags = new THREE.Group(); chair.add(chairBags);
  const backpackM = mat(0x0a0b10, 0.75);
  const cb = box(0.34, 0.46, 0.2, backpackM, -1.7, 0.7, 1.32, chairBags); cb.rotation.x = -0.12;
  box(0.2, 0.2, 0.06, mat(0x12141c, 0.8), -1.7, 0.62, 1.2, chairBags);
  const bagM = mat(0x56361f, 0.6);
  const cbag = box(0.34, 0.24, 0.1, bagM, -1.7, 0.6, 1.6, chairBags);

  /* ---- Alfombra ---- */
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), mat(0x1c1a36, 1)); rug.rotation.x = -Math.PI / 2; rug.position.set(0.5, 0.006, 0.4); rug.receiveShadow = true; scene.add(rug);

  /* ---- Luces ---- */
  scene.add(new THREE.HemisphereLight(0x4a5c90, 0x0a0a12, 0.75));
  const moon = new THREE.DirectionalLight(0x5878b8, 0.35); moon.position.set(2, 3, -4); scene.add(moon);
  const street = new THREE.SpotLight(0xff9a50, 14, 12, 0.34, 0.6, 1.2);
  street.position.set(0.9, 4.5, -4.0); street.target.position.set(0.9, 0, -0.4); street.castShadow = true;
  street.shadow.mapSize.set(1024, 1024); street.shadow.bias = -0.0006; street.shadow.camera.near = 1; street.shadow.camera.layers.enable(1);
  scene.add(street, street.target);

  /* ---- Haces de luz y polvo ---- */
  const beamM = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.55, fog: false });
  function quad(a, b, c, d) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], 2));
    const m = new THREE.Mesh(g, beamM); m.renderOrder = 5; scene.add(m); return m;
  }
  const zWin = -D / 2 + 0.05;
  quad([0.2, 2.1, zWin], [0.2, 1.0, zWin], [0.2, 0, -1.15], [0.2, 0, 0.15]);   // lado izquierdo
  quad([1.6, 2.1, zWin], [1.6, 1.0, zWin], [1.6, 0, -1.15], [1.6, 0, 0.15]);   // lado derecho
  quad([0.2, 2.1, zWin], [1.6, 2.1, zWin], [1.6, 0, 0.15], [0.2, 0, 0.15]);    // cara superior
  const DUST = 140;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(DUST * 3), dustSeed = [];
  for (let i = 0; i < DUST; i++) { dustPos[i * 3] = lerp(0.1, 1.7, Math.random()); dustPos[i * 3 + 1] = lerp(0.2, 2.1, Math.random()); dustPos[i * 3 + 2] = lerp(-1.7, 0.1, Math.random()); dustSeed.push(Math.random() * 6.28); }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: glowTex, color: 0xffd9a0, size: 0.028, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(dust);

  /* ============================== Avatar (tu cuerpo) ============================== */
  const SKIN = 0xc4906c;
  const avatar = new THREE.Group(); scene.add(avatar);
  const clothes = {
    top: mat(0x59607a, 0.9), pants: mat(0x2c3150, 0.9), shoes: mat(0x1a1a20, 0.6),
  };
  const skin = mat(SKIN, 0.7);
  const legs = [];
  [-0.09, 0.09].forEach((x) => {
    const g = new THREE.Group(); g.position.set(x, 0.92, 0); avatar.add(g);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.062, 0.84, 12), clothes.pants); leg.position.y = -0.42; leg.castShadow = true; g.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.28), clothes.shoes); shoe.position.set(0, -0.88, -0.05); shoe.castShadow = true; g.add(shoe);
    legs.push(g);
  });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.58, 16), clothes.top); torso.scale.z = 0.62; torso.position.y = 1.2; torso.castShadow = true; avatar.add(torso);
  const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 16), clothes.pants); hips.scale.z = 0.65; hips.position.y = 0.93; avatar.add(hips);
  const arms = [];
  [-1, 1].forEach((s) => {
    const g = new THREE.Group(); g.position.set(0.255 * s, 1.43, 0); avatar.add(g);
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 10), clothes.top); g.add(shoulder);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.045, 0.36, 10), clothes.top); sleeve.position.y = -0.18; sleeve.castShadow = true; g.add(sleeve);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.036, 0.3, 10), clothes.top); fore.position.y = -0.5; g.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), skin); hand.scale.set(1, 1.35, 0.8); hand.position.y = -0.69; g.add(hand);
    arms.push(g);
  });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.12, 10), skin); neck.position.y = 1.52; avatar.add(neck);
  const headPivot = new THREE.Group(); headPivot.position.set(0, 1.52, 0); headPivot.rotation.order = 'YXZ'; avatar.add(headPivot);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 16), skin); head.scale.set(1, 1.18, 1.08); head.position.y = 0.1; head.castShadow = true; headPivot.add(head);
  const hairM = mat(0x1c120b, 0.9);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.118, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hairM); hair.scale.set(1, 1.18, 1.1); hair.position.y = 0.1; headPivot.add(hair);
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.114, 20, 12, Math.PI * 0.62, Math.PI * 0.76, Math.PI * 0.52, Math.PI * 0.4), hairM); beard.scale.set(1, 1.18, 1.1); beard.position.y = 0.1; headPivot.add(beard);
  [-0.04, 0.04].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({ color: 0x0a0a10 })); eye.position.set(x, 0.12, -0.115); headPivot.add(eye);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), skin); nose.scale.set(1, 1.2, 1.2); nose.position.set(0, 0.095, -0.118); headPivot.add(nose);
  [neck, head, hair, beard, nose].forEach((m) => m.layers.set(1));
  headPivot.traverse((o) => { if (o.isMesh) o.layers.set(1); });
  const backpack = new THREE.Group(); backpack.visible = false; avatar.add(backpack);
  box(0.3, 0.42, 0.17, backpackM, 0, 1.26, 0.17, backpack, false);
  box(0.06, 0.4, 0.02, mat(0x14161e, 0.8), -0.1, 1.28, -0.0, backpack, false); box(0.06, 0.4, 0.02, mat(0x14161e, 0.8), 0.1, 1.28, -0.0, backpack, false);
  const sideBag = new THREE.Group(); sideBag.visible = false; avatar.add(sideBag);
  box(0.28, 0.2, 0.09, bagM, -0.27, 0.9, -0.02, sideBag, false);
  const strap = box(0.04, 0.78, 0.02, mat(0x3a2414, 0.7), -0.03, 1.2, -0.115, sideBag, false); strap.rotation.z = 0.35;
  avatar.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });

  function dress(on) {
    clothes.top.color.setHex(on ? 0x2f63b8 : 0x59607a);
    clothes.pants.color.setHex(on ? 0x3b3f48 : 0x2c3150);
    clothes.shoes.color.setHex(on ? 0x0a0a0d : 0x1a1a20);
  }

  /* ============================== Estado ============================== */
  const S = { time: '05:45', alarmOn: true, dressed: false, bag: false, mirror: false, busy: true, started: false, tasks: { alarm: false, dress: false, bag: false, out: false } };
  const P = { x: -0.35, z: -0.55, yaw: 0, pitch: 0, bodyYaw: 0, vx: 0, vz: 0, walk: 0, bob: 0 };
  function lookAngles(fx, fy, fz, tx, ty, tz) {
    const dx = tx - fx, dz = tz - fz, dy = ty - fy;
    return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) };
  }
  { const a = lookAngles(P.x, 1.62, P.z, -0.55, 0.55, -1.6); P.yaw = P.bodyYaw = a.yaw; P.pitch = a.pitch; }

  /* Obstáculos (AABB en planta) */
  const OBST = [
    { minX: -2.2, maxX: -0.8, minZ: -1.8, maxZ: 0.2 },    // cama
    { minX: -0.75, maxX: -0.35, minZ: -1.8, maxZ: -1.4 }, // mesilla
    { minX: 1.6, maxX: 2.2, minZ: -1.0, maxZ: 0.6 },      // armario
    { minX: -1.95, maxX: -1.45, minZ: 1.12, maxZ: 1.62 }, // silla
  ];
  const RAD = 0.24;
  function collide(x, z) {
    x = clamp(x, ROOM.minX + RAD, ROOM.maxX - RAD); z = clamp(z, ROOM.minZ + RAD, ROOM.maxZ - RAD);
    for (const o of OBST) {
      const cx = clamp(x, o.minX, o.maxX), cz = clamp(z, o.minZ, o.maxZ);
      const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
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
  tag(nightstand, 'movil'); tag(wardrobe, 'armario'); tag(mirror, 'espejo'); tag(mirrorFrame, 'espejo'); tag(doorG, 'puerta'); tag(chair, 'bolsos'); tag(bed, 'cama');
  const ACTS = {
    movil: { label: 'Apagar el despertador', stand: [-0.4, -0.85], look: [-0.55, 0.52, -1.58], enabled: () => S.alarmOn, run: actMovil },
    armario: { label: 'Abrir el armario y vestirte', stand: [1.0, -0.4], look: [2.0, 1.35, -0.7], enabled: () => !S.dressed, run: actArmario },
    espejo: { label: 'Mirarte al espejo', stand: [0.85, 1.2], look: [2.19, 1.45, 1.2], enabled: () => true, run: actEspejo },
    bolsos: { label: 'Cargar la mochila y el bolso', stand: [-0.9, 0.95], look: [-1.7, 0.65, 1.4], enabled: () => !S.bag, run: actBolsos },
    puerta: { label: 'Salir de casa', stand: [0.05, 1.0], look: [0.05, 1.15, 1.8], enabled: () => true, run: actPuerta },
    cama: { label: 'Mirar la cama', stand: [-0.4, 0.0], look: [-1.5, 0.5, -0.4], enabled: () => true, run: async () => { await say(['Tu cama, todavía caliente. Tiene un 100 % de retención y cero rentabilidad.']); } },
  };

  /* ---- Mensajes ---- */
  const msg = $('#msg');
  let typingId = 0;
  function say(lines) {
    if (!Array.isArray(lines)) lines = [lines];
    S.busy = true;
    return (async () => { for (const l of lines) await sayOne(typeof l === 'string' ? { text: l } : l); S.busy = false; })();
  }
  function sayOne({ text, think }) {
    return new Promise((resolve) => {
      const id = ++typingId;
      msg.hidden = false; msg.innerHTML = `<p class="${think ? 'think' : ''}"></p>`;
      const p = msg.firstChild; let i = 0, done = false;
      const tick = () => { if (done || id !== typingId) return; i += 2; p.textContent = text.slice(0, i); if (i >= text.length) { done = true; return; } setTimeout(tick, 13); };
      tick();
      const advance = (e) => {
        if (e && e.type === 'keydown' && !['Enter', ' ', 'e', 'E'].includes(e.key)) return;
        if (e && e.type === 'keydown') e.preventDefault();
        if (!done) { done = true; p.textContent = text; return; }
        msg.removeEventListener('pointerup', advance); window.removeEventListener('keydown', advance);
        msg.hidden = true; resolve();
      };
      msg.addEventListener('pointerup', advance); window.addEventListener('keydown', advance);
    });
  }

  /* ---- Movimiento guiado ---- */
  function tween(dur, fn) {
    return new Promise((res) => { const t0 = performance.now(); (function step(now) { const k = clamp((now - t0) / dur, 0, 1); fn(ease(k), k); if (k < 1) requestAnimationFrame(step); else res(); })(t0); });
  }
  async function walkTo(stand, look, dur = 1100) {
    const sx = P.x, sz = P.z, sy = P.yaw, sp = P.pitch;
    const a = lookAngles(stand[0], 1.62, stand[1], look[0], look[1], look[2]);
    const dist = Math.hypot(stand[0] - sx, stand[1] - sz);
    const d = clamp(dist * 520, 500, dur * 1.6);
    await tween(d, (e) => {
      P.x = lerp(sx, stand[0], e); P.z = lerp(sz, stand[1], e);
      P.yaw = sy + angDiff(a.yaw, sy) * e; P.pitch = lerp(sp, a.pitch, e);
      P.walk = dist > 0.05 ? 1 - Math.abs(e * 2 - 1) * 0.0 : 0;
    });
    P.walk = 0;
  }

  async function interact(id) {
    const a = ACTS[id]; if (!a || S.busy) return;
    if (!a.enabled()) { await say('Eso ya está hecho.'); return; }
    S.busy = true;
    $('#prompt').hidden = true;
    await walkTo(a.stand, a.look);
    await a.run();
    S.busy = false;
  }

  /* ---- Acciones ---- */
  async function actMovil() {
    await say(['Apagas la alarma. Silencio. Por fin una variable que controlas.']);
    S.alarmOn = false; S.tasks.alarm = true; S.time = '05:47'; renderTasks();
    phoneLight.intensity = 0.25; phoneHalo.material.opacity = 0.35;
  }
  async function actArmario() {
    wInside.intensity = 0.7;
    await tween(900, (e) => { doorN.rotation.y = e * 1.9; });
    await say(['Camisa azul, pantalón gris oscuro, zapatos negros. El uniforme de quien no tiene uniforme.']);
    await tween(500, (e) => { clothes.top.color.lerp(new THREE.Color(0x2f63b8), e); });
    S.dressed = true; dress(true); shirt.visible = false; pants.visible = false; S.tasks.dress = true; S.time = '05:55'; renderTasks();
    await say([{ text: 'Mírate al espejo si quieres comprobar el resultado. Es la única reunión en la que estás seguro de quién va a estar.', think: true }]);
  }
  async function actBolsos() {
    await say(['Mochila negra, pesadísima: portátil, apuntes, ropa de gimnasio. Bolso marrón de los de hombre, con el tupper. Llevas media vida a cuestas, de forma literal.']);
    S.bag = true; chairBags.visible = false; backpack.visible = true; sideBag.visible = true; S.tasks.bag = true; S.time = '06:00'; renderTasks();
  }
  async function actEspejo() {
    S.mirror = true;
    if (!S.dressed) {
      await say(['Pijama arrugado, pelo de almohada y ojeras de actuario junior. El espejo no miente: solo redondea hacia abajo.']);
    } else if (!S.bag) {
      await say(['Camisa azul, pantalón gris oscuro, barba de semanas. Falta la mochila para parecer el que realmente eres.']);
    } else {
      await say(['Camisa azul, pantalón gris, mochila negra a la espalda y bolso marrón al costado: el tupper ya viaja contigo. Te reconoces, pero con más peso del que marca la báscula.']);
    }
  }
  async function actPuerta() {
    const ok = S.tasks.alarm && S.tasks.dress && S.tasks.bag;
    if (!ok) { await say('Todavía no. En pijama, con el despertador sonando y sin mochila no llegas ni al portal.'); return; }
    S.tasks.out = true; renderTasks();
    await say(['Cierras la puerta con cuidado. La escalera huele a lunes. Fuera, el andén te espera con ochocientas personas y ninguna ganas de ser tu amigo.']);
    $('#hud').hidden = true; if (document.pointerLockElement) document.exitPointerLock();
    const end = document.createElement('div'); end.id = 'end';
    end.innerHTML = '<div><h2>Fin de la prueba 3D</h2><p>Aquí seguiría la historia: el andén, el tren, Azca, la oficina y el café. Dime si el espejo, el movimiento y la sensación de estar dentro valen la pena frente a la versión de ilustración.</p><button class="btn primary" id="again">↻ Volver a probar</button></div>';
    document.body.appendChild(end);
    end.querySelector('#again').addEventListener('click', () => location.reload());
  }

  /* ============================== Entrada ============================== */
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (!S.started || S.busy) return;
    if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') { if (current) interact(current); }
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  const touches = new Map();
  let mouse = null;
  const stickEl = $('#stickL'), stickDot = stickEl.querySelector('i');
  let moveVec = { x: 0, y: 0 };
  const LOOK_SENS = COARSE ? 0.0052 : 0.0034;
  function look(dx, dy) { P.yaw -= dx * LOOK_SENS; P.pitch = clamp(P.pitch - dy * LOOK_SENS, -1.35, 1.35); }

  canvas.addEventListener('pointerdown', (e) => {
    if (!S.started) return;
    if (e.pointerType === 'touch') {
      const left = e.clientX < innerWidth * 0.45;
      touches.set(e.pointerId, { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), mode: left ? 'move' : 'look', moved: 0 });
      if (left) { stickEl.hidden = false; stickEl.style.left = e.clientX + 'px'; stickEl.style.top = e.clientY + 'px'; stickDot.style.transform = ''; }
      canvas.setPointerCapture(e.pointerId);
    } else {
      mouse = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: 0 };
      if (!document.pointerLockElement) canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      const t = touches.get(e.pointerId); if (!t) return;
      const dx = e.clientX - t.x, dy = e.clientY - t.y; t.x = e.clientX; t.y = e.clientY; t.moved = Math.hypot(e.clientX - t.x0, e.clientY - t.y0);
      if (S.busy) return;
      if (t.mode === 'look') look(dx, dy);
      else {
        const vx = clamp((t.x - t.x0) / 50, -1, 1), vy = clamp((t.y - t.y0) / 50, -1, 1);
        moveVec = { x: vx, y: vy };
        stickDot.style.transform = `translate(${vx * 32}px, ${vy * 32}px)`;
      }
    } else if (document.pointerLockElement === canvas) {
      if (!S.busy) look(e.movementX, e.movementY);
    } else if (mouse) {
      const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y; mouse.x = e.clientX; mouse.y = e.clientY;
      mouse.moved = Math.hypot(e.clientX - mouse.x0, e.clientY - mouse.y0);
      if (!S.busy && mouse.moved > 4) look(dx, dy);
    }
  });
  const endPtr = (e) => {
    if (e.pointerType === 'touch') {
      const t = touches.get(e.pointerId); if (!t) return;
      touches.delete(e.pointerId);
      if (t.mode === 'move') { stickEl.hidden = true; moveVec = { x: 0, y: 0 }; }
      if (t.moved < 10 && performance.now() - t.t0 < 400 && !S.busy) tapAt(e.clientX, e.clientY);
    } else {
      if (document.pointerLockElement === canvas) { if (!S.busy && current) interact(current); }
      else if (mouse && mouse.moved < 5 && !S.busy) {
        tapAt(e.clientX, e.clientY);
        if (!COARSE && canvas.requestPointerLock && !picked(e.clientX, e.clientY)) canvas.requestPointerLock();
      }
      mouse = null;
    }
  };
  canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
  document.addEventListener('pointerlockchange', () => { $('#cross').classList.toggle('on', false); });

  /* ---- Selección por rayo ---- */
  const ray = new THREE.Raycaster(); ray.far = 6;
  const ACT_ROOTS = [nightstand, wardrobe, mirror, mirrorFrame, doorG, chair, bed];
  function pickRay(ndc) {
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(ACT_ROOTS, true).filter((h) => h.object.userData.act);
    return hits.length ? hits[0].object.userData.act : null;
  }
  function picked(cx, cy) { return pickRay(new THREE.Vector2((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1)); }
  function tapAt(cx, cy) { const id = picked(cx, cy); if (id) interact(id); }

  let current = null;
  const promptEl = $('#prompt'), cross = $('#cross');
  function updatePrompt() {
    if (S.busy || !S.started) { promptEl.hidden = true; cross.classList.remove('on'); current = null; return; }
    const id = pickRay(new THREE.Vector2(0, 0));
    current = id && ACTS[id] && ACTS[id].enabled() ? id : null;
    if (current) { promptEl.hidden = false; promptEl.textContent = (COARSE ? '' : 'E · ') + ACTS[current].label; cross.classList.add('on'); }
    else { promptEl.hidden = true; cross.classList.remove('on'); }
  }

  /* ============================== Bucle ============================== */
  function resize() {
    renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < innerHeight ? 80 : 72; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  const clock = new THREE.Clock(); let acc = 0, frames = 0, tAdapt = 0, fpsT = 0, fpsN = 0;
  const fpsEl = $('#fps');
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;

    // movimiento libre
    if (S.started && !S.busy) {
      let fx = 0, fz = 0;
      if (keys['w'] || keys['arrowup']) fz += 1; if (keys['s'] || keys['arrowdown']) fz -= 1;
      if (keys['a']) fx -= 1; if (keys['d']) fx += 1;
      if (keys['arrowleft']) P.yaw += 1.8 * dt; if (keys['arrowright']) P.yaw -= 1.8 * dt;
      fx += moveVec.x; fz -= moveVec.y;
      const len = Math.hypot(fx, fz); if (len > 1) { fx /= len; fz /= len; }
      const sp = (keys['shift'] ? 3.0 : 1.7);
      const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      const tvx = (-sy * fz + cy * fx) * sp, tvz = (-cy * fz - sy * fx) * sp;
      P.vx = lerp(P.vx, tvx, Math.min(1, dt * 9)); P.vz = lerp(P.vz, tvz, Math.min(1, dt * 9));
      const [nx, nz] = collide(P.x + P.vx * dt, P.z + P.vz * dt); P.x = nx; P.z = nz;
      P.walk = Math.min(1, Math.hypot(P.vx, P.vz) / 1.5);
    } else if (!S.busy) { P.vx = P.vz = 0; }

    // cuerpo: gira detrás de la cabeza
    const diff = angDiff(P.yaw, P.bodyYaw);
    if (P.walk > 0.2) P.bodyYaw += diff * Math.min(1, dt * 8);
    else if (Math.abs(diff) > 0.9) P.bodyYaw += (diff - Math.sign(diff) * 0.9) * Math.min(1, dt * 6);
    avatar.position.set(P.x + Math.sin(P.bodyYaw) * 0.11, 0, P.z + Math.cos(P.bodyYaw) * 0.11); avatar.rotation.y = P.bodyYaw;   // los ojos van delante del cuerpo
    headPivot.rotation.set(clamp(P.pitch, -1.0, 1.0) * 0.9, angDiff(P.yaw, P.bodyYaw), 0);
    const ph = t * 8.5;
    legs[0].rotation.x = Math.sin(ph) * 0.55 * P.walk; legs[1].rotation.x = -Math.sin(ph) * 0.55 * P.walk;
    arms[0].rotation.x = -Math.sin(ph) * 0.4 * P.walk - 0.12; arms[1].rotation.x = Math.sin(ph) * 0.4 * P.walk - 0.12;
    arms[0].rotation.z = 0.06; arms[1].rotation.z = -0.06;
    const breath = Math.sin(t * 1.6) * 0.004;
    torso.scale.y = 1 + breath * 4;

    // cámara en los ojos, con balanceo al andar
    P.bob += dt * 8.5 * P.walk;
    const bobY = Math.abs(Math.sin(P.bob)) * 0.028 * P.walk + Math.sin(t * 1.6) * 0.004;
    const bobX = Math.cos(P.bob) * 0.012 * P.walk;
    camera.position.set(P.x + Math.cos(P.yaw) * bobX, 1.62 + bobY - Math.max(0, -P.pitch) * 0.0, P.z - Math.sin(P.yaw) * bobX);
    camera.rotation.set(P.pitch, P.yaw, Math.sin(P.bob) * 0.004 * P.walk);

    // despertador
    drawPhone(S.alarmOn, t);
    if (S.alarmOn) {
      phoneLight.intensity = 0.55 + Math.max(0, Math.sin(t * 9)) * 0.8; phoneHalo.material.opacity = 0.5 + Math.max(0, Math.sin(t * 9)) * 0.4;
      phone.position.x = -0.55 + Math.sin(t * 60) * 0.0012;
    }
    acc += dt; if (S.alarmOn && S.started && acc > 3.4 && Sound.on) { acc = 0; Sound.alarm(3); }
    lampGlow.material.opacity = 0.85 + Math.sin(t * 2.1) * 0.05;

    // polvo
    const pos = dustGeo.attributes.position;
    for (let i = 0; i < DUST; i++) {
      pos.array[i * 3 + 1] += Math.sin(t * 0.3 + dustSeed[i]) * 0.0008 - 0.0002;
      pos.array[i * 3] += Math.cos(t * 0.2 + dustSeed[i]) * 0.0006;
      if (pos.array[i * 3 + 1] < 0.15) pos.array[i * 3 + 1] = 2.1;
    }
    pos.needsUpdate = true;

    updatePrompt();
    renderer.render(scene, camera);

    // calidad adaptable
    frames++; tAdapt += dt; fpsT += dt; fpsN++;
    if (tAdapt > 2.5) {
      const avg = tAdapt / frames;
      if (avg > 0.034 && pr > 0.7) { pr = Math.max(0.65, pr * 0.8); resize(); }
      tAdapt = 0; frames = 0;
    }
    if (DEBUG && fpsT > 0.5) { fpsEl.hidden = false; fpsEl.textContent = `${Math.round(fpsN / fpsT)} fps · ratio ${pr.toFixed(2)}`; fpsT = 0; fpsN = 0; }
  }

  /* ============================== Arranque ============================== */
  renderTasks();
  drawPhone(true, 0);
  frame();
  $('#snd').addEventListener('click', () => { const on = Sound.toggle(); $('#snd').textContent = on ? '🔊' : '🔇'; $('#snd').setAttribute('aria-pressed', on); if (on) Sound.ambience('room'); });
  $('#go').addEventListener('click', async () => {
    $('#start').style.display = 'none'; $('#hud').hidden = false; S.started = true; S.busy = true;
    if (!COARSE && canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch (e) {} }
    await say(['05:45. Fuera todavía es de noche y una farola pinta la pared de naranja. El despertador cree que es una buena hora para vivir.',
      { text: 'Primera estimación del día: probabilidad de que el tren vaya vacío. Estimador puntual: cero.', think: true },
      COARSE ? 'Arrastra el pulgar izquierdo para andar y el derecho para mirar. Toca lo que quieras usar.' : 'Mueve el ratón para mirar, W A S D para andar, y E sobre lo que brille.']);
  });
  window.__qx = { S, P, ACTS, interact, camera, avatar, scene, renderer, say };
})();
