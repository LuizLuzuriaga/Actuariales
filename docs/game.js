/* ============================================================
   game.js — Motor del juego: dibujado de habitación, jugador,
   detección de hotspots y bucle de animación
   ============================================================ */
 
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');
const W = 680, H = 480;
 
/* ---------- Teclado ---------- */
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup',   e => { keys[e.key] = false; });
 
/* ---------- Jugador ---------- */
const player = {
  x: 340, y: 300,
  w: 20,  h: 28,
  speed: 2.5,
  dir: 2,         // 0=up 1=left 2=down 3=right
  frame: 0,
  frameTimer: 0
};
 
/* ---------- Hotspots (zonas interactivas) ---------- */
const hotspots = [
  { id:'desk',     label:'📚 Mesa de estudio',   x:55,  y:80,  w:170, h:70,  hint:'[E] Tabla de Mortalidad Profesional', color:'#9c6cff' },
  { id:'computer', label:'💻 Ordenador',          x:478, y:78,  w:125, h:75,  hint:'[E] Portafolio No-Vida',              color:'#6ab8ff' },
  { id:'board',    label:'📊 Pizarra',            x:266, y:58,  w:135, h:62,  hint:'[E] Cadena de Markov',                color:'#5cdc8c' },
  { id:'dice',     label:'🎲 Escritorio lateral', x:558, y:195, w:115, h:75,  hint:'[E] Simulación Monte Carlo',          color:'#ffb830' },
  { id:'bar',      label:'🏋️ Barra dominadas',   x:8,   y:55,  w:44,  h:85,  hint:'[E] Vida deportiva',                  color:'#ff8c5c' },
  { id:'kitchen',  label:'🍳 Cocina',             x:278, y:368, w:125, h:92,  hint:'[E] Calculadora Prima Pura',          color:'#ff6c9c' },
  { id:'window',   label:'🪟 Ventana / CV',       x:528, y:18,  w:85,  h:95,  hint:'[E] Sobre mí — CV completo',         color:'#80c8ff' },
];
 
let nearHotspot = null;
 
/* ---------- Paleta de colores de la habitación ---------- */
const P = {
  floor:       '#1e1830',
  floorAccent: '#231d38',
  wall:        '#0d0a1a',
  wallTop:     '#2a1f45',
  rug:         '#1a0f2e',
  rugBorder:   '#3a1f5e',
  desk:        '#3d2a12',
  deskTop:     '#5a3e1a',
  bookColors:  ['#8b1a1a','#1a5c8b','#1a8b3a','#8b7a1a','#6b1a8b','#1a7a8b'],
  computer:    '#1a1a2a',
  screen:      '#0a2a1a',
  screenGlow:  '#00ff88',
  board:       '#0a1a0a',
  boardFrame:  '#3a2a0a',
  barMetal:    '#888899',
  stove:       '#2a2a3a',
  fridge:      '#3a3a4a',
  sky:         '#0a1a3a',
  windowFrame: '#5a3e1a',
  lamp:        '#5a4a0a',
  lampLight:   '#ffe080',
  plant:       '#0a3a0a',
  plantLeaf:   '#1a6a1a',
  pot:         '#5a2a0a',
  door:        '#3a2a10',
  doorKnob:    '#c8a840',
};
 
/* =================== DIBUJO DE LA HABITACIÓN =================== */
 
function drawRoom() {
  /* Suelo con patrón de baldosas */
  for (let x = 0; x < W; x += 32) {
    for (let y = 120; y < H - 55; y += 32) {
      ctx.fillStyle = ((Math.floor(x/32) + Math.floor((y-120)/32)) % 2 === 0)
        ? P.floor : P.floorAccent;
      ctx.fillRect(x, y, 32, 32);
    }
  }
 
  /* Alfombra */
  ctx.fillStyle = P.rug;
  ctx.fillRect(145, 195, 330, 190);
  ctx.strokeStyle = P.rugBorder;
  ctx.lineWidth = 3;
  ctx.strokeRect(153, 203, 314, 174);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#2a1a4e';
  ctx.strokeRect(160, 210, 300, 160);
 
  /* Pared */
  ctx.fillStyle = P.wall;
  ctx.fillRect(0, 0, W, 120);
  ctx.fillStyle = P.wallTop;
  ctx.fillRect(0, 114, W, 8);
 
  /* Listones verticales de la pared */
  ctx.fillStyle = '#1e163a';
  for (let x = 0; x < W; x += 48) {
    ctx.fillRect(x, 0, 1.5, 114);
  }
 
  /* Zócalo inferior */
  ctx.fillStyle = '#1a1230';
  ctx.fillRect(0, H - 55, W, 8);
}
 
function drawDesk() {
  /* Superficie */
  ctx.fillStyle = P.deskTop;
  ctx.fillRect(55, 120, 172, 18);
  ctx.fillStyle = P.desk;
  ctx.fillRect(55, 138, 172, 52);
 
  /* Patas */
  ctx.fillStyle = '#3a2810';
  ctx.fillRect(60, 186, 14, 32);
  ctx.fillRect(203, 186, 14, 32);
 
  /* Libros apilados */
  P.bookColors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(62 + i * 17, 97, 13, 25);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(62 + i * 17, 97, 2, 25);
  });
 
  /* Papel / apuntes en la mesa */
  ctx.fillStyle = '#f5f0e0';
  ctx.fillRect(68, 130, 75, 10);
  ctx.fillStyle = '#c8c0a0';
  ctx.fillRect(68, 132, 55, 2);
  ctx.fillRect(68, 136, 40, 2);
 
  /* Lápiz */
  ctx.fillStyle = '#e8c840';
  ctx.fillRect(155, 128, 4, 22);
  ctx.fillStyle = '#f06060';
  ctx.fillRect(155, 128, 4, 5);
}
 
function drawBoard() {
  /* Marco */
  ctx.fillStyle = P.boardFrame;
  ctx.fillRect(264, 56, 142, 68);
  /* Superficie */
  ctx.fillStyle = P.board;
  ctx.fillRect(269, 60, 132, 58);
 
  /* Texto en la pizarra */
  ctx.fillStyle = '#4a8a4a';
  ctx.font = '8px monospace';
  ctx.fillText('Economía → Banca', 274, 78);
  ctx.fillText('Banca → Máster Act.', 274, 90);
  ctx.fillText('P(éxito) = 0.95', 274, 102);
 
  /* Línea con flecha */
  ctx.strokeStyle = '#ff8c5c66';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(285, 108); ctx.lineTo(370, 108);
  ctx.stroke();
  ctx.lineWidth = 1;
}
 
function drawBar() {
  /* Barra horizontal */
  ctx.fillStyle = P.barMetal;
  ctx.fillRect(10, 56, 32, 5);
  /* Montantes */
  ctx.fillStyle = '#777788';
  ctx.fillRect(10, 56, 4, 70);
  ctx.fillRect(38, 56, 4, 70);
  /* Base */
  ctx.fillStyle = '#555566';
  ctx.fillRect(6, 122, 42, 8);
  /* Tornillos */
  ctx.fillStyle = '#aaa';
  ctx.beginPath(); ctx.arc(14, 59, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(40, 59, 3, 0, Math.PI*2); ctx.fill();
}
 
function drawComputer() {
  /* Monitor */
  ctx.fillStyle = P.computer;
  ctx.fillRect(483, 126, 112, 72);
  /* Pantalla */
  ctx.fillStyle = P.screen;
  ctx.fillRect(488, 131, 102, 58);
  /* Texto terminal */
  ctx.fillStyle = P.screenGlow;
  ctx.font = '7.5px monospace';
  ctx.fillText('$ PORTFOLIO.exe', 492, 145);
  ctx.fillText('> No-Vida.json', 492, 157);
  ctx.fillStyle = '#00cc66';
  ctx.fillText('> Proyectos: 4', 492, 169);
  ctx.fillStyle = '#00ff88';
  ctx.fillText('> OK ■', 492, 181);
  /* Soporte y base */
  ctx.fillStyle = '#252535';
  ctx.fillRect(528, 198, 52, 6);
  ctx.fillRect(523, 204, 62, 8);
}
 
function drawSideDesk() {
  /* Mesa lateral */
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(561, 198, 112, 72);
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(561, 193, 112, 8);
  /* Patas */
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(565, 266, 10, 28);
  ctx.fillRect(657, 266, 10, 28);
  /* Iconos decorativos */
  ctx.font = '18px sans-serif';
  ctx.fillText('🎲', 578, 236);
  ctx.fillText('📈', 622, 230);
}
 
function drawKitchen() {
  /* Encimera */
  ctx.fillStyle = '#222238';
  ctx.fillRect(278, 365, 130, 88);
  /* Vitrocerámica */
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(283, 372, 55, 38);
  /* Quemadores */
  ctx.fillStyle = '#cc3333';
  ctx.beginPath(); ctx.arc(298, 385, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#3333cc';
  ctx.beginPath(); ctx.arc(316, 385, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc3333';
  ctx.beginPath(); ctx.arc(298, 400, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#3333cc';
  ctx.beginPath(); ctx.arc(316, 400, 5, 0, Math.PI*2); ctx.fill();
 
  /* Frigorífico */
  ctx.fillStyle = P.fridge;
  ctx.fillRect(408, 348, 58, 105);
  ctx.fillStyle = '#555566';
  ctx.fillRect(413, 398, 48, 2);
  /* Tirador */
  ctx.fillStyle = '#888';
  ctx.fillRect(418, 368, 4, 20);
  ctx.fillStyle = '#22223a';
  ctx.font = '11px sans-serif';
  ctx.fillText('🥦', 418, 392);
 
  /* Olla */
  ctx.fillStyle = '#666677';
  ctx.fillRect(340, 360, 35, 25);
  ctx.fillRect(335, 358, 45, 5);
}
 
function drawWindow() {
  /* Cielo */
  ctx.fillStyle = P.sky;
  ctx.fillRect(530, 18, 83, 94);
  /* Estrellas */
  ctx.fillStyle = 'rgba(200,220,255,0.7)';
  [[538,28],[560,35],[548,50],[572,24],[585,42],[595,30]].forEach(([x,y]) => {
    ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI*2); ctx.fill();
  });
  /* Luna */
  ctx.fillStyle = '#d4e8ff';
  ctx.beginPath(); ctx.arc(590, 55, 10, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = P.sky;
  ctx.beginPath(); ctx.arc(594, 53, 8, 0, Math.PI*2); ctx.fill();
  /* Marco */
  ctx.strokeStyle = P.windowFrame;
  ctx.lineWidth = 5;
  ctx.strokeRect(530, 18, 83, 94);
  /* Travesaño */
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#6a4a1a';
  ctx.beginPath(); ctx.moveTo(571, 18); ctx.lineTo(571, 112); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(530, 65); ctx.lineTo(613, 65); ctx.stroke();
  ctx.lineWidth = 1;
}
 
function drawDoor() {
  ctx.fillStyle = P.door;
  ctx.fillRect(448, 228, 58, 114);
  ctx.strokeStyle = '#4a3a1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(450, 230, 54, 110);
  /* Panel */
  ctx.strokeStyle = '#5a4a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(455, 235, 44, 46);
  ctx.strokeRect(455, 288, 44, 46);
  /* Pomo */
  ctx.fillStyle = P.doorKnob;
  ctx.beginPath(); ctx.arc(456, 288, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#a88820';
  ctx.fillRect(453, 287, 6, 2);
}
 
function drawLamp() {
  /* Pie */
  ctx.fillStyle = P.lamp;
  ctx.fillRect(232, 178, 7, 85);
  /* Base */
  ctx.fillStyle = '#3a3010';
  ctx.fillRect(224, 260, 23, 6);
  /* Pantalla */
  ctx.fillStyle = '#8a7a20';
  ctx.beginPath();
  ctx.moveTo(218, 178); ctx.lineTo(248, 178);
  ctx.lineTo(242, 155); ctx.lineTo(224, 155);
  ctx.closePath(); ctx.fill();
  /* Bombilla encendida */
  ctx.fillStyle = P.lampLight;
  ctx.beginPath(); ctx.arc(235, 168, 5, 0, Math.PI*2); ctx.fill();
  /* Halo de luz suave */
  ctx.fillStyle = 'rgba(255,230,100,0.05)';
  ctx.beginPath(); ctx.arc(235, 190, 55, 0, Math.PI*2); ctx.fill();
}
 
function drawPlant() {
  /* Maceta */
  ctx.fillStyle = P.pot;
  ctx.fillRect(438, 338, 34, 32);
  ctx.fillStyle = '#6a3a10';
  ctx.fillRect(434, 334, 42, 6);
  /* Tierra */
  ctx.fillStyle = '#2a1a08';
  ctx.fillRect(439, 334, 32, 6);
  /* Tallo */
  ctx.fillStyle = '#1a5a1a';
  ctx.fillRect(453, 300, 3, 36);
  /* Hojas */
  ctx.fillStyle = P.plantLeaf;
  ctx.beginPath(); ctx.ellipse(438, 316, 16, 8, -0.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(470, 312, 16, 8, 0.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(454, 306, 12, 6, 0, 0, Math.PI*2); ctx.fill();
}
 
/* =================== JUGADOR (pixel art) =================== */
 
function drawPlayer() {
  const px = Math.round(player.x - player.w / 2);
  const py = Math.round(player.y - player.h);
 
  /* Sombra */
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 1, 10, 4, 0, 0, Math.PI*2);
  ctx.fill();
 
  /* Zapatos */
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(px + 1,  py + player.h - 5, 8, 5);
  ctx.fillRect(px + 11, py + player.h - 5, 8, 5);
 
  /* Pantalón */
  ctx.fillStyle = '#2a3a5a';
  ctx.fillRect(px + 1,  py + 16, 8, 10);
  ctx.fillRect(px + 11, py + 16, 8, 10);
 
  /* Camisa */
  ctx.fillStyle = '#3a7abf';
  ctx.fillRect(px + 2, py + 8, player.w - 4, 10);
 
  /* Cuello */
  ctx.fillStyle = '#c8926a';
  ctx.fillRect(px + 7, py + 6, 6, 4);
 
  /* Cabeza */
  ctx.fillStyle = '#c8926a';
  ctx.fillRect(px + 4, py, player.w - 8, 9);
 
  /* Pelo */
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(px + 4, py - 3, player.w - 8, 5);
  ctx.fillRect(px + 2, py, 4, 4);
 
  /* Ojos (según dirección) */
  ctx.fillStyle = '#1a1a2a';
  if (player.dir !== 0) {
    ctx.fillRect(px + 6,  py + 2, 2, 2);
    ctx.fillRect(px + 12, py + 2, 2, 2);
  }
 
  /* Indicador de interacción */
  if (nearHotspot) {
    ctx.fillStyle = '#af8fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[E]', player.x, py - 6);
    ctx.textAlign = 'left';
  }
}
 
/* =================== HOTSPOT OUTLINES =================== */
 
function drawHotspotOutlines() {
  hotspots.forEach(h => {
    if (h !== nearHotspot) return;
    ctx.save();
    ctx.strokeStyle = h.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(h.x, h.y, h.w, h.h);
    ctx.setLineDash([]);
    ctx.fillStyle = h.color + 'dd';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(h.label, h.x + h.w / 2, h.y - 5);
    ctx.textAlign = 'left';
    ctx.lineWidth = 1;
    ctx.restore();
  });
}
 
/* =================== DETECCIÓN DE PROXIMIDAD =================== */
 
function checkNear() {
  nearHotspot = null;
  const cx = player.x;
  const cy = player.y - player.h / 2;
 
  hotspots.forEach(h => {
    if (cx > h.x - 22 && cx < h.x + h.w + 22 &&
        cy > h.y - 22 && cy < h.y + h.h + 22) {
      nearHotspot = h;
    }
  });
 
  const hintEl = document.getElementById('hint');
  if (nearHotspot) {
    hintEl.textContent = nearHotspot.hint;
    hintEl.style.borderColor = nearHotspot.color;
  } else {
    hintEl.textContent = '← → ↑ ↓ para moverse · [E] para interactuar · Haz clic en los objetos';
    hintEl.style.borderColor = '#7c5cbf';
  }
}

/* ---------- Controles Móviles ---------- */
const btnUp = document.getElementById('btn-up');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnDown = document.getElementById('btn-down');
const btnE = document.getElementById('btn-e');

function bindTouch(btn, key) {
  if (!btn) return;
  const press = (e) => { e.preventDefault(); keys[key] = true; };
  const release = (e) => { e.preventDefault(); keys[key] = false; };
  btn.addEventListener('touchstart', press, {passive: false});
  btn.addEventListener('touchend', release, {passive: false});
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
}

bindTouch(btnUp, 'ArrowUp');
bindTouch(btnLeft, 'ArrowLeft');
bindTouch(btnRight, 'ArrowRight');
bindTouch(btnDown, 'ArrowDown');

if (btnE) {
  const interact = (e) => {
    e.preventDefault();
    if (!modalOpen && nearHotspot && typeof openModal === 'function') {
      openModal(nearHotspot.id);
    }
  };
  btnE.addEventListener('touchstart', interact, {passive: false});
  btnE.addEventListener('mousedown', interact);
}
 
/* =================== BUCLE PRINCIPAL =================== */
 
let lastTime = 0;
 
function gameLoop(ts) {
  if (typeof modalOpen !== 'undefined' && modalOpen) {
    requestAnimationFrame(gameLoop);
    return;
  }
 
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;
 
  /* Movimiento */
  let moving = false;
  if (keys['ArrowLeft']  || keys['a'] || keys['A']) { player.x -= player.speed; player.dir = 1; moving = true; }
  if (keys['ArrowRight'] || keys['d'] || keys['D']) { player.x += player.speed; player.dir = 3; moving = true; }
  if (keys['ArrowUp']    || keys['w'] || keys['W']) { player.y -= player.speed; player.dir = 0; moving = true; }
  if (keys['ArrowDown']  || keys['s'] || keys['S']) { player.y += player.speed; player.dir = 2; moving = true; }
 
  /* Límites del mapa */
  player.x = Math.max(player.w / 2 + 4,   Math.min(W - player.w / 2 - 4, player.x));
  player.y = Math.max(player.h + 128,      Math.min(H - 62, player.y));
 
  /* Animación de pasos */
  if (moving) player.frameTimer += dt;
  if (player.frameTimer > 100) { player.frame++; player.frameTimer = 0; }
 
  checkNear();
 
  /* Render */
  ctx.clearRect(0, 0, W, H);
  drawRoom();
  drawBar();
  drawDesk();
  drawBoard();
  drawComputer();
  drawSideDesk();
  drawWindow();
  drawKitchen();
  drawDoor();
  drawLamp();
  drawPlant();
  drawHotspotOutlines();
  drawPlayer();
 
  requestAnimationFrame(gameLoop);
}

/* Evento teclado para abrir modales */
window.addEventListener('keydown', e => {
  if (e.key === 'e' || e.key === 'E') {
    if (!modalOpen && nearHotspot && typeof openModal === 'function') {
      openModal(nearHotspot.id);
    }
  }
  if (e.key === 'Escape') {
    if (modalOpen && typeof closeModal === 'function') {
        closeModal();
    }
  }
});
 
/* Clic directo sobre el canvas → abrir modal del objeto clickeado */
canvas.addEventListener('click', e => {
  if (typeof modalOpen !== 'undefined' && modalOpen) return;
  const rect  = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top)  * scaleX;
  hotspots.forEach(h => {
    if (mx > h.x && mx < h.x + h.w && my > h.y && my < h.y + h.h) {
      if (typeof openModal === 'function') openModal(h.id);
    }
  });
});