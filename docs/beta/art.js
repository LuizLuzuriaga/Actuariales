/* art.js — escenas ilustradas en SVG (1920×1080), cinematográficas, con capas de parallax (data-d).
   Regla: lo interactivo vive en capas con d=0; el fondo lejano usa d>0 y el primer plano d<0.
   Cada escena devuelve { art, box } donde box son las cajas de los hotspots. */
const Art = (() => {
  const W = 1920, H = 1080;

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const L = (d, inner, extra = '') => `<g data-d="${d}" ${extra}>${inner}</g>`;

  const DEFS = `<defs>
    <filter id="b3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="b8" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
    <filter id="b50" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="50"/></filter>
    <linearGradient id="shW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".55"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0"/></linearGradient>
    <linearGradient id="shO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".5"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></linearGradient>
    <linearGradient id="shC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8dcff" stop-opacity=".5"/><stop offset="1" stop-color="#b8dcff" stop-opacity="0"/></linearGradient>
    <radialGradient id="glC"><stop offset="0" stop-color="#6fe8ff" stop-opacity=".9"/><stop offset="1" stop-color="#6fe8ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="glO"><stop offset="0" stop-color="#ffb060" stop-opacity=".95"/><stop offset="1" stop-color="#ff8a30" stop-opacity="0"/></radialGradient>
    <radialGradient id="glW"><stop offset="0" stop-color="#fff2d0" stop-opacity=".95"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
  </defs>`;
  const svgWrap = (inner) => DEFS + inner;
  const SCREEN = 'style="mix-blend-mode:screen"';

  /* ---------- Piezas reutilizables ---------- */
  function person(x, y, s, o = {}) {
    const c = o.color || '#080b12', hr = 34 * s, sw = 118 * s, bh = 215 * s;
    const hy = y - bh - hr * 0.85;
    let g = `<g${o.blur ? ` filter="url(#${o.blur})"` : ''}${o.op ? ` opacity="${o.op}"` : ''}>`;
    if (o.pack) g += `<rect x="${x + sw * 0.35}" y="${y - bh * 0.85}" width="${sw * 0.7}" height="${bh * 0.7}" rx="${14 * s}" fill="${o.pack}"/>`;
    g += `<path d="M${x - sw} ${y} C${x - sw} ${y - bh * 0.72} ${x - sw * 0.5} ${y - bh} ${x} ${y - bh} C${x + sw * 0.5} ${y - bh} ${x + sw} ${y - bh * 0.72} ${x + sw} ${y} Z" fill="${c}" ${o.rim ? `stroke="${o.rim}" stroke-opacity=".35" stroke-width="${2.5 * s}"` : ''}/>`;
    g += `<rect x="${x - 15 * s}" y="${y - bh - 14 * s}" width="${30 * s}" height="${34 * s}" fill="${c}"/>`;
    g += `<ellipse cx="${x}" cy="${hy}" rx="${hr}" ry="${hr * 1.15}" fill="${c}" ${o.rim ? `stroke="${o.rim}" stroke-opacity=".5" stroke-width="${2.5 * s}"` : ''}/>`;
    if (o.hair) g += `<path d="M${x - hr} ${hy} Q${x} ${hy - hr * 1.7} ${x + hr} ${hy} Q${x} ${hy - hr * 0.5} ${x - hr} ${hy}Z" fill="${o.hair}"/>`;
    return g + '</g>';
  }
  function crowd(r, x0, x1, base, sMin, sMax, step, o = {}) {
    let g = '';
    for (let x = x0; x < x1; x += step * (0.7 + r() * 0.6)) {
      const s = sMin + r() * (sMax - sMin);
      const shade = 8 + Math.floor(r() * 10);
      g += person(x, base + r() * 24, s, { color: `rgb(${shade},${shade + 3},${shade + 10})`, rim: o.rim, pack: r() < 0.3 ? `rgb(${shade + 6},${shade + 8},${shade + 16})` : null, blur: o.blur, hair: r() < 0.5 ? `rgb(${shade - 3},${shade - 3},${shade})` : null });
    }
    return g;
  }
  function winGrid(r, x, y, w, h, cols, rows, lit, on = ['#ffd48a', '#cfeaff', '#fff0c0']) {
    const cw = w / cols, ch = h / rows; let s = '';
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (r() < lit) s += `<rect x="${(x + i * cw).toFixed(0)}" y="${(y + j * ch).toFixed(0)}" width="${(cw - 4).toFixed(0)}" height="${(ch - 6).toFixed(0)}" fill="${on[Math.floor(r() * on.length)]}" opacity="${(0.35 + r() * 0.65).toFixed(2)}"/>`;
    }
    return s;
  }
  /* Antebrazos en primera persona (manga azul), con mano; desde (x, y) hacia el centro */
  function arm(x, y, side, o = {}) {
    const f = side === 'l' ? 1 : -1;
    return `<g transform="translate(${x} ${y}) scale(${f} 1)">
      <path d="M0 0 C70 -40 210 -120 330 -150 L360 -90 C250 -50 130 30 40 120 L0 120 Z" fill="#274a82"/>
      <path d="M330 -150 C370 -158 410 -150 430 -128 C446 -108 440 -84 418 -76 L360 -90 Z" fill="#c4906c"/>
      <path d="M0 0 C70 -40 210 -120 330 -150" fill="none" stroke="#6aa8ff" stroke-opacity=".35" stroke-width="3"/>
    </g>`;
  }

  /* ============================== DORMITORIO ============================== */
  function bedroom() {
    const r = rng(11);
    const art = svgWrap(`
      <rect width="${W}" height="${H}" fill="#04060b"/>
      ${L(0.1, `
        <defs><linearGradient id="bw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1424"/><stop offset="1" stop-color="#05080f"/></linearGradient>
        <linearGradient id="skyB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1428"/><stop offset="1" stop-color="#1b1f36"/></linearGradient></defs>
        <rect x="-100" y="0" width="2120" height="800" fill="url(#bw)"/>
        <rect x="-100" y="640" width="2120" height="14" fill="#0a0f1a"/>
        <!-- ventana -->
        <rect x="1220" y="100" width="420" height="430" fill="#02030a"/>
        <rect x="1236" y="116" width="388" height="398" fill="url(#skyB)"/>
        <g opacity=".9">${[0, 1, 2, 3, 4].map(i => `<rect x="${1236 + i * 80}" y="${360 - r() * 120}" width="70" height="250" fill="#070a14"/>`).join('')}</g>
        <circle cx="1500" cy="330" r="150" fill="url(#glO)" opacity=".9"/>
        <circle cx="1500" cy="330" r="20" fill="#ffd9a0"/>
        <rect x="1426" y="116" width="8" height="398" fill="#02030a"/>
        <rect x="1236" y="304" width="388" height="8" fill="#02030a"/>
        <path d="M1180 90 L1290 90 L1260 580 L1190 580Z" fill="#0b0f1c"/><path d="M1610 90 L1700 90 L1690 580 L1630 580Z" fill="#0b0f1c"/>
      `)}
      ${L(0.12, `<polygon points="1236,514 1624,514 1020,1080 360,1080" fill="url(#shO)" filter="url(#b20)" ${SCREEN}/>
        <polygon points="1300,514 1380,514 900,1080 760,1080" fill="url(#shO)" opacity=".5" filter="url(#b8)" ${SCREEN}/>`)}
      ${L(0, `
        <!-- suelo -->
        <rect x="-100" y="780" width="2120" height="320" fill="#090b11"/>
        <rect x="-100" y="780" width="2120" height="5" fill="#141a28"/>
        <!-- armario -->
        <rect x="70" y="150" width="470" height="650" rx="6" fill="#0c0f18" stroke="#1b2438" stroke-width="3"/>
        <rect x="302" y="168" width="4" height="612" fill="#06080e"/>
        <path d="M110 230 L210 210 L260 230 L248 540 L120 540Z" fill="#1c3a6e"/><path d="M120 214 L168 244 L216 212" fill="none" stroke="#4a78c0" stroke-width="3"/>
        <path d="M350 230 L450 210 L500 230 L490 540 L360 540Z" fill="#2c2f3a"/>
        <rect x="100" y="206" width="420" height="5" fill="#2a3550"/>
        <rect x="120" y="580" width="140" height="170" fill="#161a27"/><rect x="330" y="600" width="170" height="70" fill="#242a3a"/>
        <!-- espejo -->
        <rect x="640" y="200" width="190" height="340" rx="10" fill="#1a1710" stroke="#8a6a2e" stroke-width="5"/>
        <rect x="652" y="212" width="166" height="316" rx="6" fill="#0b1018"/>
        <ellipse cx="735" cy="350" rx="48" ry="62" fill="#1b232f"/><path d="M690 350 Q735 440 780 350 Q770 420 735 440 Q700 420 690 350Z" fill="#0a0d12"/>
        <path d="M688 330 Q735 270 782 330 Q770 296 735 290 Q700 296 688 330Z" fill="#06080b"/>
        <path d="M652 528 L700 212 L740 212 L690 528Z" fill="#ffffff" opacity=".05"/>
        <!-- puerta -->
        <rect x="900" y="170" width="220" height="640" rx="4" fill="#121523" stroke="#222c44" stroke-width="4"/>
        <rect x="925" y="210" width="170" height="250" fill="none" stroke="#1f2740" stroke-width="3"/><rect x="925" y="500" width="170" height="260" fill="none" stroke="#1f2740" stroke-width="3"/>
        <circle cx="1080" cy="520" r="9" fill="#9a8450"/>
        <rect x="905" y="800" width="210" height="10" fill="#ffe2a0" opacity=".55" filter="url(#b3)"/>
        <!-- mesilla + móvil -->
        <rect x="1170" y="680" width="260" height="190" rx="8" fill="#0d111c" stroke="#1b2438" stroke-width="3"/>
        <rect x="1190" y="740" width="220" height="6" fill="#06080e"/>
        <circle cx="1300" cy="640" r="170" fill="url(#glC)" opacity=".55" ${SCREEN}/>
        <g transform="rotate(-8 1300 650)"><rect x="1240" y="580" width="120" height="190" rx="14" fill="#04070d" stroke="#0a1a24" stroke-width="3"/>
          <rect x="1250" y="592" width="100" height="166" rx="8" fill="#0d3a4a"/>
          <text id="alarm-txt" x="1300" y="670" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="700" font-size="34" fill="#9ff3ff">05:45</text>
          <text x="1300" y="702" text-anchor="middle" font-family="Segoe UI,Arial" font-size="13" fill="#6fe8ff">⏰ DESPERTADOR</text>
          <rect x="1272" y="718" width="56" height="22" rx="11" fill="#ff6b6b"/></g>
        <rect x="1370" y="622" width="40" height="58" rx="6" fill="#16314a" opacity=".7"/>
        <!-- silla con bolsos -->
        <rect x="1560" y="780" width="12" height="130" fill="#0a0d16"/><rect x="1810" y="780" width="12" height="130" fill="#0a0d16"/>
        <rect x="1540" y="770" width="310" height="22" rx="4" fill="#10141f"/>
        <rect x="1565" y="470" width="200" height="300" rx="34" fill="#0a0c12" stroke="#222a3c" stroke-width="3"/>
        <rect x="1600" y="520" width="130" height="90" rx="14" fill="#0e121b" stroke="#222a3c" stroke-width="2"/>
        <path d="M1585 480 C1555 560 1555 690 1590 770" stroke="#222a3c" stroke-width="8" fill="none"/>
        <path d="M1690 640 h40" stroke="#3a4560" stroke-width="3"/>
        <path d="M1770 560 L1860 560 L1880 770 L1760 770Z" fill="#4a2f1c" stroke="#7a5333" stroke-width="3"/>
        <path d="M1760 600 Q1815 650 1870 600" fill="none" stroke="#7a5333" stroke-width="3"/><rect x="1805" y="640" width="22" height="26" rx="3" fill="#a88a4a"/>
      `)}
      ${L(-0.28, `<path d="M-120 1080 L-120 930 C150 880 360 940 640 910 C920 880 1240 960 1500 930 C1700 910 1900 940 2040 960 L2040 1080Z" fill="#05070c"/>
        <path d="M-120 960 C150 910 360 970 640 940" fill="none" stroke="#18213a" stroke-width="3"/>`)}
      <g class="dust" data-d="-0.1">${Array.from({ length: 16 }, () => `<circle cx="${400 + r() * 1100}" cy="${200 + r() * 700}" r="${1.2 + r() * 2.2}" fill="#ffd9a0" opacity="${0.25 + r() * 0.5}" style="animation-delay:-${(r() * 8).toFixed(1)}s"/>`).join('')}</g>
    `);
    return { art, box: { movil: [1210, 560, 190, 230], ropa: [70, 150, 480, 650], espejo: [630, 190, 210, 360], bolsos: [1540, 450, 360, 360], puerta: [890, 160, 240, 660], cama: [-80, 880, 760, 200] } };
  }

  /* ================================ ANDÉN ================================ */
  function platform() {
    const r = rng(23), r2 = rng(5);
    const poles = [200, 640, 1080, 1520, 1960].map(x => `<rect x="${x}" y="0" width="14" height="560" fill="#0a0f1a"/>`).join('');
    const lights = [260, 620, 980, 1340, 1700].map(x => `
      <rect x="${x}" y="150" width="240" height="14" rx="6" fill="#d6f2ff"/>
      <polygon points="${x},164 ${x + 240},164 ${x + 360},760 ${x - 120},760" fill="url(#shC)" opacity=".55" filter="url(#b20)" ${SCREEN}/>`).join('');
    const train = `<g id="train" style="transform:translateX(2700px)">
      <rect x="-300" y="300" width="2900" height="470" rx="26" fill="#12192b" stroke="#2a3552" stroke-width="4"/>
      <rect x="-300" y="650" width="2900" height="28" fill="#2d63a8"/>
      <rect x="-300" y="690" width="2900" height="8" fill="#05080f"/>
      ${[0, 1, 2, 3, 4].map(i => {
        const dx = 80 + i * 560;
        return `<rect x="${dx}" y="338" width="170" height="320" rx="8" fill="#ffd9a0" opacity=".92"/>
          <g clip-path="inset(0)">${[0, 1, 2].map(k => person(dx + 30 + k * 55, 650, 0.62, { color: '#2b2118', rim: '#ffe2b0' })).join('')}</g>
          <rect x="${dx + 183}" y="338" width="170" height="320" rx="8" fill="#ffd9a0" opacity=".92"/>
          <g>${[0, 1, 2].map(k => person(dx + 215 + k * 55, 650, 0.6, { color: '#2b2118', rim: '#ffe2b0' })).join('')}</g>
          <rect x="${dx + 366}" y="338" width="100" height="320" fill="#0a0f1c"/>
          <rect x="${dx - 6}" y="334" width="480" height="8" fill="#05080f"/>`;
      }).join('')}
      <rect x="-300" y="336" width="2900" height="4" fill="#5d7bb0" opacity=".5"/>
      <rect x="2380" y="520" width="14" height="14" fill="#ff6b6b"/>
    </g>`;
    const art = svgWrap(`
      <defs><linearGradient id="plSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050912"/><stop offset="1" stop-color="#0f1b30"/></linearGradient>
      <linearGradient id="plFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101827"/><stop offset="1" stop-color="#05080f"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#plSky)"/>
      ${L(0.14, `<g opacity=".9">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 260 - 100} 560 L${i * 260 - 100} ${420 - r() * 110} L${i * 260 + 70} ${420 - r() * 110} L${i * 260 + 70} 560Z" fill="#070b15"/>`).join('')}</g>
        <ellipse cx="1000" cy="540" rx="1100" ry="50" fill="#27406a" opacity=".35" filter="url(#b20)"/>`)}
      ${L(0.06, `${poles}<rect x="-100" y="120" width="2200" height="40" fill="#07090f"/>${lights}`)}
      ${L(0, `
        <rect x="-100" y="540" width="2200" height="230" fill="#070a12"/>
        ${[580, 620, 700, 740].map(y => `<rect x="-100" y="${y}" width="2200" height="4" fill="#1a2436"/>`).join('')}
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<rect x="${i * 300 - 40}" y="620" width="14" height="150" fill="#0b101a"/>`).join('')}
        ${train}
        <rect x="-100" y="760" width="2200" height="330" fill="url(#plFloor)"/>
        <rect x="-100" y="772" width="2200" height="18" fill="#d9ad2a" opacity=".85"/>
        <rect x="-100" y="772" width="2200" height="4" fill="#fff0a0" opacity=".7"/>
        <!-- panel de llegadas -->
        <rect x="740" y="150" width="480" height="170" rx="10" fill="#05070c" stroke="#1f2a40" stroke-width="4"/>
        <text id="board-l1" x="770" y="206" font-family="Consolas,monospace" font-size="38" font-weight="700" fill="#ffb454">C-3  PRÓXIMO TREN</text>
        <text id="board-l2" x="770" y="262" font-family="Consolas,monospace" font-size="38" font-weight="700" fill="#ff6b6b">2 min · COMPLETO</text>
        <text x="770" y="300" font-family="Consolas,monospace" font-size="22" fill="#6c7892">Rogamos avancen hacia el fondo</text>
        <rect x="-100" y="810" width="2200" height="130" fill="#0b121e" opacity=".5"/>
        ${crowd(r2, 80, 1900, 880, 0.52, 0.78, 130, { rim: '#6aa8ff' })}
      `)}
      ${L(-0.3, `${crowd(rng(77), -60, 2000, 1110, 1.3, 1.75, 330, { blur: 'b8' })}`)}
      <g class="dust" data-d="-0.1">${Array.from({ length: 10 }, () => `<circle cx="${r() * 1900}" cy="${200 + r() * 600}" r="${1 + r() * 2}" fill="#cfe6ff" opacity="${0.15 + r() * 0.3}" style="animation-delay:-${(r() * 8).toFixed(1)}s"/>`).join('')}</g>
    `);
    return { art, box: { panel: [730, 140, 500, 190], gente: [60, 560, 1800, 520] } };
  }

  /* ============================ INTERIOR DEL TREN ============================ */
  function train() {
    const r = rng(41);
    const streaks = Array.from({ length: 26 }, () => `<rect x="${r() * 2400 - 200}" y="${230 + r() * 260}" width="${80 + r() * 260}" height="${2 + r() * 5}" rx="3" fill="${r() < 0.5 ? '#ffd48a' : '#8fd0ff'}" opacity="${0.25 + r() * 0.6}"/>`).join('');
    const art = svgWrap(`
      <defs><linearGradient id="trWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18213a"/><stop offset="1" stop-color="#090d18"/></linearGradient>
      <clipPath id="trWin"><rect x="760" y="150" width="1100" height="400" rx="20"/></clipPath></defs>
      <rect width="${W}" height="${H}" fill="url(#trWall)"/>
      ${L(0.05, `
        <rect x="-100" y="40" width="2200" height="70" fill="#0a0f1c"/>
        ${[120, 520, 920, 1320, 1720].map(x => `<rect x="${x}" y="64" width="260" height="14" rx="6" fill="#e6f6ff"/><polygon points="${x},78 ${x + 260},78 ${x + 380},800 ${x - 120},800" fill="url(#shC)" opacity=".35" filter="url(#b20)" ${SCREEN}/>`).join('')}
      `)}
      ${L(0.04, `
        <rect x="740" y="130" width="1140" height="440" rx="26" fill="#05070d" stroke="#2a3552" stroke-width="6"/>
        <g clip-path="url(#trWin)"><rect x="760" y="150" width="1100" height="400" fill="#0a1222"/>
          <g class="streaks">${streaks}</g>
          <rect x="760" y="360" width="1100" height="190" fill="#05070d" opacity=".5"/></g>
        <rect x="1300" y="130" width="14" height="440" fill="#0a0f1c"/>
      `)}
      ${L(0, `
        <rect x="-100" y="580" width="2200" height="520" fill="#0b101b"/>
        <rect x="-100" y="575" width="2200" height="10" fill="#2d63a8" opacity=".7"/>
        <rect x="1180" y="40" width="22" height="1040" fill="#9aa6bd" opacity=".55"/>
        <rect x="1166" y="40" width="6" height="1040" fill="#e6f0ff" opacity=".25"/>
        ${crowd(rng(9), 80, 1900, 1040, 0.8, 1.15, 210, { rim: '#ffd48a' })}
        <!-- vecino pegado -->
        ${person(330, 1130, 2.1, { color: '#06080d', rim: '#ffd48a', hair: '#0b0b0e' })}
        ${person(1560, 1140, 2.0, { color: '#0a0c14', rim: '#6aa8ff', hair: '#1a1410' })}
        <path d="M540 590 C520 800 560 980 600 1080 L760 1080 C730 960 720 760 760 590Z" fill="#0a0d16" opacity=".0"/>
        <!-- móvil en tu mano -->
        <g transform="rotate(-4 960 860)"><rect x="840" y="660" width="250" height="400" rx="30" fill="#04070d" stroke="#0e1a28" stroke-width="5"/>
          <rect x="858" y="684" width="214" height="350" rx="18" fill="#0d2b44"/>
          <text x="965" y="752" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="700" font-size="26" fill="#bfe6ff">CURRÍCULUM</text>
          ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="882" y="${790 + i * 34}" width="${i % 2 ? 130 : 166}" height="10" rx="5" fill="#6fe8ff" opacity=".55"/>`).join('')}</g>
        <circle cx="965" cy="860" r="260" fill="url(#glC)" opacity=".35" ${SCREEN}/>
        ${arm(560, 1080, 'l')}${arm(1380, 1080, 'r')}
      `)}
      ${L(-0.25, `${person(60, 1260, 3.0, { color: '#04050a', blur: 'b8' })}${person(1900, 1260, 3.0, { color: '#04050a', blur: 'b8' })}`)}
    `);
    return { art, box: { movil: [820, 640, 290, 440], ventana: [740, 130, 1140, 440], vecino: [140, 260, 480, 800], puertas: [1580, 130, 300, 440] } };
  }

  /* ================================= AZCA ================================= */
  function azca() {
    const r = rng(7);
    const tower = (x, w, h, base, lit, seed) => {
      const rr = rng(seed);
      return `<g><rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="#070b16"/>
        <rect x="${x}" y="${base - h}" width="6" height="${h}" fill="#4a78c0" opacity=".25"/>
        ${winGrid(rr, x + 14, base - h + 20, w - 28, h - 40, Math.max(4, Math.round(w / 24)), Math.round(h / 28), lit)}</g>`;
    };
    const art = svgWrap(`
      <defs><linearGradient id="azSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070d22"/><stop offset=".55" stop-color="#2a2a52"/><stop offset=".82" stop-color="#c4603c"/><stop offset="1" stop-color="#ffb070"/></linearGradient>
      <linearGradient id="azGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17142a"/><stop offset="1" stop-color="#05070e"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#azSky)"/>
      ${L(0.02, `<circle cx="1300" cy="780" r="320" fill="url(#glO)" opacity=".75"/>
        ${Array.from({ length: 30 }, () => `<circle cx="${r() * 1900}" cy="${r() * 420}" r="${0.8 + r() * 1.4}" fill="#fff" opacity="${0.2 + r() * 0.6}"/>`).join('')}`)}
      ${L(0.22, `${tower(-60, 150, 360, 800, 0.18, 1)}${tower(180, 120, 460, 800, 0.2, 2)}${tower(520, 160, 330, 800, 0.2, 3)}${tower(1500, 140, 430, 800, 0.18, 4)}${tower(1790, 150, 380, 800, 0.2, 5)}`.replace(/#070b16/g, '#1a1a3a'))}
      ${L(0.12, `${tower(30, 250, 470, 840, 0.34, 11)}${tower(330, 190, 380, 840, 0.34, 12)}${tower(1230, 220, 430, 840, 0.34, 13)}
        <rect x="120" y="290" width="6" height="80" fill="#0a0e1c"/><circle cx="123" cy="288" r="8" fill="#ff4a4a" class="blink"/>`)}
      ${L(0, `
        <rect x="-100" y="830" width="2200" height="300" fill="url(#azGround)"/>
        <rect x="-100" y="826" width="2200" height="6" fill="#ffb070" opacity=".35"/>
        <ellipse cx="1200" cy="930" rx="900" ry="60" fill="#ff9a50" opacity=".14" filter="url(#b20)"/>
        ${tower(560, 480, 560, 840, 0.36, 21)}
        <!-- el edificio de la aseguradora -->
        <rect x="1060" y="300" width="610" height="560" fill="#0a1020" stroke="#2a3a5e" stroke-width="3"/>
        <rect x="1060" y="300" width="610" height="8" fill="#7fb4ff" opacity=".5"/>
        ${winGrid(rng(33), 1080, 330, 570, 290, 28, 14, 0.6)}
        <rect x="1100" y="660" width="530" height="200" fill="#07101c"/>
        <rect x="1150" y="690" width="140" height="170" fill="#ffd9a0" opacity=".85"/><rect x="1300" y="690" width="140" height="170" fill="#ffd9a0" opacity=".85"/><rect x="1450" y="690" width="140" height="170" fill="#ffd9a0" opacity=".85"/>
        <rect x="1100" y="640" width="530" height="26" fill="#0a0d16"/><rect x="1100" y="662" width="530" height="6" fill="#ffe2b0" opacity=".6"/>
        <rect x="1210" y="590" width="310" height="40" rx="4" fill="#05080f" opacity=".85"/><text x="1365" y="620" text-anchor="middle" font-family="Segoe UI,Arial" font-weight="700" font-size="26" letter-spacing="7" fill="#cfe0ff">LA ASEGURADORA</text>
        ${[1215, 1365, 1515].map((x, i) => person(x, 860, 0.3 + i * 0.01, { color: '#07090f', rim: '#ffe2b0' })).join('')}
        <circle cx="1365" cy="780" r="260" fill="url(#glW)" opacity=".3" ${SCREEN}/>
        <!-- quiosco -->
        <rect x="1740" y="620" width="160" height="220" rx="8" fill="#10131f" stroke="#2a3558" stroke-width="3"/>
        <rect x="1756" y="640" width="128" height="80" fill="#ffd9a0" opacity=".65"/>
        <text x="1820" y="690" text-anchor="middle" font-family="Segoe UI,Arial" font-size="20" font-weight="700" fill="#3a2410">CAFÉ</text>
        <!-- banco -->
        <rect x="120" y="800" width="300" height="14" fill="#1a2030"/><rect x="130" y="814" width="10" height="40" fill="#1a2030"/><rect x="400" y="814" width="10" height="40" fill="#1a2030"/>
        ${crowd(rng(55), 440, 1020, 884, 0.26, 0.36, 80, { rim: '#ffb070' })}
      `)}
      ${L(-0.25, `<rect x="-30" y="140" width="20" height="940" fill="#05070d"/><rect x="-30" y="140" width="140" height="16" rx="8" fill="#05070d"/>
        <circle cx="120" cy="160" r="140" fill="url(#glO)" opacity=".5" ${SCREEN}/><circle cx="120" cy="164" r="12" fill="#fff0c0"/>`)}
    `);
    return { art, box: { torres: [30, 40, 1000, 780], entrada: [1090, 640, 560, 230], cafe: [1730, 610, 180, 240], banco: [100, 780, 340, 100] } };
  }

  /* ================================ OFICINA ================================ */
  function office() {
    const r = rng(61);
    const slats = Array.from({ length: 12 }, (_, i) => `<rect x="180" y="${100 + i * 34}" width="1560" height="18" fill="#0d0f18"/>`).join('');
    const shafts = [0, 1, 2, 3].map(i => `<polygon points="${300 + i * 380},430 ${420 + i * 380},430 ${60 + i * 380},1000 ${-120 + i * 380},1000" fill="url(#shW)" opacity=".5" filter="url(#b20)" ${SCREEN}/>`).join('');
    const deskRow = (y, s, op) => [0, 1, 2, 3, 4, 5, 6].map(i => `<g opacity="${op}">${person(120 + i * 290, y, s, { color: '#0a0d16', rim: '#ffd48a' })}<rect x="${20 + i * 290}" y="${y - 20}" width="200" height="12" fill="#161c2c"/><rect x="${70 + i * 290}" y="${y - 120 * s * 1.6}" width="${90 * s * 1.4}" height="${60 * s * 1.4}" fill="#6fa8d8" opacity=".5"/></g>`).join('');
    const art = svgWrap(`
      <defs><linearGradient id="ofWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121a2c"/><stop offset="1" stop-color="#080b14"/></linearGradient>
      <linearGradient id="ofSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4a7a"/><stop offset=".6" stop-color="#ff9a5a"/><stop offset="1" stop-color="#ffd0a0"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#ofWall)"/>
      ${L(0.15, `
        <rect x="160" y="80" width="1600" height="400" fill="url(#ofSky)"/>
        <g opacity=".9">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<rect x="${170 + i * 150}" y="${300 - r() * 130}" width="${90 + r() * 60}" height="300" fill="#2a2640"/>`).join('')}</g>
        ${slats}
        <rect x="160" y="80" width="1600" height="400" fill="none" stroke="#05070d" stroke-width="12"/>
        ${[580, 1000, 1420].map(x => `<rect x="${x}" y="80" width="10" height="400" fill="#05070d"/>`).join('')}
      `)}
      ${L(0.1, `${shafts}`)}
      ${L(0.06, `<rect x="-100" y="470" width="2200" height="12" fill="#06080e"/>${deskRow(640, 0.62, 0.8)}${deskRow(720, 0.78, 0.9)}`)}
      ${L(0, `
        <!-- puerta de la cocina -->
        <rect x="1740" y="340" width="180" height="380" fill="#0a0f1a" stroke="#223052" stroke-width="3"/>
        <rect x="1768" y="380" width="124" height="46" rx="6" fill="#103a2c"/><text id="ofdoor" x="1830" y="412" text-anchor="middle" font-family="Segoe UI,Arial" font-size="22" font-weight="700" fill="#6ee7a0">☕ CAFÉ</text>
        <!-- mesa -->
        <rect x="-100" y="760" width="2200" height="340" fill="#080b13"/>
        <rect x="-100" y="760" width="2200" height="8" fill="#1c2640"/>
        <!-- monitor izquierdo: pricing -->
        <rect x="170" y="290" width="660" height="400" rx="14" fill="#04060b" stroke="#222c46" stroke-width="6"/>
        <rect x="186" y="306" width="628" height="368" rx="6" fill="#0d1a2c"/>
        <rect x="186" y="306" width="628" height="30" fill="#17406e"/><text x="200" y="327" font-family="Segoe UI,Arial" font-size="17" fill="#cfe6ff">Pricing · Ajuste manual de GLM</text>
        <path d="M230 600 C340 590 420 520 520 480 S700 420 780 410" fill="none" stroke="#ffb454" stroke-width="5"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<circle cx="${250 + i * 70}" cy="${590 - i * 24 + (i % 3) * 26 - 10}" r="7" fill="#6fe8ff"/>`).join('')}
        <rect x="230" y="640" width="200" height="8" rx="4" fill="#27406a"/><circle cx="330" cy="644" r="11" fill="#ffb454"/>
        <rect x="560" y="640" width="200" height="8" rx="4" fill="#27406a"/><circle cx="650" cy="644" r="11" fill="#ffb454"/>
        <rect x="470" y="738" width="80" height="30" fill="#05070d"/><rect x="420" y="760" width="180" height="12" rx="6" fill="#0a0d16"/>
        <!-- monitor derecho: reservas -->
        <rect x="900" y="290" width="720" height="400" rx="14" fill="#04060b" stroke="#222c46" stroke-width="6"/>
        <rect x="916" y="306" width="688" height="368" rx="6" fill="#0c2014"/>
        <rect x="916" y="306" width="688" height="30" fill="#1a6a3c"/><text x="930" y="327" font-family="Segoe UI,Arial" font-size="17" fill="#d8ffe6">Reservas.xlsx — Triángulo de siniestros</text>
        ${Array.from({ length: 6 }, (_, j) => Array.from({ length: 7 }, (_, i) => `<rect x="${930 + i * 94}" y="${348 + j * 44}" width="90" height="40" fill="${i < 6 - j && j > 0 ? '#143a22' : '#0a1a10'}" stroke="#1d5a34"/>`).join('')).join('')}
        <text x="1260" y="660" text-anchor="middle" font-family="Consolas,monospace" font-size="16" fill="#6ee7a0" opacity=".7">proc genmod; …  Fabric: cargando 97 %</text>
        <rect x="1230" y="738" width="80" height="30" fill="#05070d"/><rect x="1180" y="760" width="180" height="12" rx="6" fill="#0a0d16"/>
        <circle cx="500" cy="500" r="420" fill="url(#glC)" opacity=".25" ${SCREEN}/>
        <circle cx="1260" cy="500" r="440" fill="url(#glC)" opacity=".18" ${SCREEN}/>
        <!-- teclado, ratón, taza, móvil -->
        <rect x="600" y="880" width="620" height="120" rx="14" fill="#0b0f1a" stroke="#222c46" stroke-width="3"/>
        ${Array.from({ length: 4 }, (_, j) => Array.from({ length: 16 }, (_, i) => `<rect x="${618 + i * 37}" y="${896 + j * 26}" width="30" height="18" rx="3" fill="#161d30"/>`).join('')).join('')}
        <ellipse cx="1330" cy="950" rx="36" ry="22" fill="#10141f" stroke="#222c46" stroke-width="3"/>
        <g><rect x="1560" y="800" width="110" height="130" rx="10" fill="#1a1d2a" stroke="#3a4560" stroke-width="3"/><ellipse cx="1615" cy="802" rx="55" ry="12" fill="#2a1a10"/>
        <path class="steam" d="M1600 780 q-16 -30 0 -52 q16 -24 0 -50" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="6" stroke-linecap="round"/>
        <path class="steam" d="M1640 780 q-16 -30 0 -52 q16 -24 0 -50" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="6" stroke-linecap="round" style="animation-delay:-1.5s"/></g>
        <g transform="rotate(10 190 920)"><rect x="110" y="830" width="150" height="250" rx="22" fill="#04070d" stroke="#1a2a3a" stroke-width="4"/><rect x="122" y="846" width="126" height="218" rx="12" fill="#1b2748"/>
        <rect x="136" y="866" width="90" height="12" rx="6" fill="#ff6b6b"/><rect x="136" y="890" width="60" height="10" rx="5" fill="#6aa8ff" opacity=".6"/></g>
        ${arm(520, 1080, 'l')}${arm(1300, 1080, 'r')}
      `)}
      ${L(-0.2, `<rect x="-60" y="1040" width="2100" height="60" fill="#04060a"/>`)}
    `);
    return { art, box: { pricing: [170, 290, 660, 400], reservas: [900, 290, 720, 400], movil: [90, 820, 200, 260], cafe: [1730, 330, 190, 400] } };
  }

  /* ================================== CAFÉ ================================== */
  function cafe() {
    const art = svgWrap(`
      <defs><linearGradient id="cfWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101626"/><stop offset="1" stop-color="#06080f"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#cfWall)"/>
      ${L(0.06, `<rect x="120" y="140" width="520" height="300" fill="#0a0f1a" stroke="#1d2640" stroke-width="4"/>
        <rect x="140" y="160" width="480" height="260" fill="#173040" opacity=".5"/>
        ${[0, 1, 2, 3].map(i => `<rect x="${1300 + i * 140}" y="120" width="100" height="14" rx="6" fill="#e6f6ff"/><polygon points="${1300 + i * 140},134 ${1400 + i * 140},134 ${1480 + i * 140},900 ${1220 + i * 140},900" fill="url(#shC)" opacity=".3" filter="url(#b20)" ${SCREEN}/>`).join('')}`)}
      ${L(0, `
        <rect x="-100" y="780" width="2200" height="320" fill="#080b12"/>
        <rect x="-100" y="640" width="2200" height="150" fill="#10151f"/>
        <rect x="-100" y="636" width="2200" height="10" fill="#243050"/>
        <!-- máquina de café -->
        <rect x="1380" y="330" width="260" height="330" rx="16" fill="#0a0d14" stroke="#243050" stroke-width="4"/>
        <rect x="1410" y="370" width="200" height="110" rx="8" fill="#02040a"/>
        <circle cx="1510" cy="540" r="260" fill="url(#glO)" opacity=".5" ${SCREEN}/><circle cx="1510" cy="430" r="190" fill="url(#glC)" opacity=".4" ${SCREEN}/>
        <rect x="1470" y="520" width="80" height="12" rx="4" fill="#ffb454"/><rect x="1480" y="560" width="60" height="80" rx="6" fill="#1a1d2a"/>
        <circle cx="1440" cy="400" r="9" fill="#6ee7a0"/><rect x="1560" y="500" width="30" height="40" rx="5" fill="#1a2030"/>
        <!-- compañeros -->
        ${person(560, 1000, 1.18, { color: '#0a0d16', rim: '#6fe8ff', hair: '#16110c' })}
        <g><rect x="470" y="620" width="40" height="64" rx="6" fill="#0c1018"/><circle cx="490" cy="640" r="6" fill="#6aa8ff"/><path d="M470 700 L520 700 L520 720 L470 720Z" fill="#aab4c8" opacity=".0"/></g>
        ${person(940, 1000, 1.1, { color: '#0b0e18', rim: '#ffb454', hair: '#241a12' })}
        <rect x="880" y="700" width="46" height="70" rx="6" fill="#103250"/><rect x="886" y="708" width="34" height="46" fill="#9bd0ff" opacity=".8"/><path d="M886 744 L903 722 L920 744Z" fill="#103250" opacity=".8"/>
        ${person(1230, 1000, 1.14, { color: '#0a0c14', rim: '#6fe8ff', hair: '#0e0e12' })}
        <rect x="1190" y="780" width="70" height="44" rx="6" fill="#e6e8ee" opacity=".7"/>
        <!-- keys -->
        <g transform="translate(500 730)"><circle r="14" fill="none" stroke="#c9d3e6" stroke-width="4"/><rect x="-6" y="14" width="12" height="44" rx="4" fill="#c9d3e6"/><circle cx="0" cy="62" r="9" fill="#ff6b6b"/></g>
        <rect x="-100" y="1000" width="2200" height="140" fill="#05070c"/>
        <!-- tu mano con el vaso -->
        ${arm(720, 1080, 'l')}
        <g transform="translate(1040 920)"><path d="M-60 -150 L60 -150 L44 0 L-44 0Z" fill="#e8e3da"/><rect x="-62" y="-170" width="124" height="24" rx="6" fill="#d8d2c6"/><rect x="-50" y="-100" width="100" height="50" fill="#7a5a3a" opacity=".85"/></g>
      `)}
      ${L(-0.25, `${person(80, 1300, 3.2, { color: '#04050a', blur: 'b8' })}`)}
      <g class="dust" data-d="-0.1">${Array.from({ length: 12 }, (_, i) => `<circle cx="${1300 + (i * 61) % 500}" cy="${300 + (i * 97) % 500}" r="${1 + (i % 3)}" fill="#ffd9a0" opacity=".3" style="animation-delay:-${i % 7}s"/>`).join('')}</g>
    `);
    return { art, box: {} };
  }

  /* ============================ Ilustraciones de finales ============================ */
  function endingArt(kind) {
    const frame = (inner, bg = '#0b1020') => `<svg viewBox="0 0 520 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <defs><radialGradient id="eg"><stop offset="0" stop-color="#ffb454" stop-opacity=".6"/><stop offset="1" stop-color="#ffb454" stop-opacity="0"/></radialGradient></defs>
      <rect width="520" height="330" rx="18" fill="${bg}"/>${inner}</svg>`;
    if (kind === 'cervezas') return frame(`
      <circle cx="260" cy="120" r="200" fill="url(#eg)"/>
      ${[60, 150, 370, 460].map(x => `<rect x="${x}" y="36" width="10" height="${60 + (x % 3) * 18}" fill="#ffb454" opacity=".5"/><circle cx="${x + 5}" cy="${96 + (x % 3) * 18}" r="12" fill="#ffd9a0"/>`).join('')}
      <rect x="0" y="238" width="520" height="92" fill="#1a1208"/><rect x="0" y="232" width="520" height="12" fill="#5a3c1a"/>
      <!-- Chelu: alto, perilla y bigote, pelo castaño -->
      <path d="M170 330 L180 130 Q260 80 340 130 L350 330Z" fill="#17202e"/>
      <ellipse cx="260" cy="82" rx="40" ry="46" fill="#c4906c"/>
      <path d="M220 70 Q260 24 300 70 Q290 44 260 40 Q230 44 220 70Z" fill="#4a2f1c"/>
      <path d="M240 98 Q260 132 280 98 Q272 118 260 120 Q248 118 240 98Z" fill="#4a2f1c"/>
      <path d="M244 98 Q260 90 276 98 Q260 104 244 98Z" fill="#4a2f1c"/>
      <circle cx="244" cy="76" r="4" fill="#1a1205"/><circle cx="276" cy="76" r="4" fill="#1a1205"/>
      <g transform="translate(345 160)"><path d="M0 0 L46 0 L40 90 L6 90Z" fill="#ffcf5a"/><rect x="-2" y="-14" width="50" height="18" rx="9" fill="#fff6dc"/><path d="M46 20 q26 0 26 24 q0 24 -24 24" fill="none" stroke="#ffcf5a" stroke-width="6"/></g>
      <path d="M312 150 L345 190" stroke="#c4906c" stroke-width="14" stroke-linecap="round"/>`);
    if (kind === 'despedido') return frame(`
      <rect x="150" y="150" width="220" height="150" rx="10" fill="#1a1d2a" stroke="#3a4560" stroke-width="4"/>
      <path d="M170 150 L195 100 L325 100 L350 150" fill="#2a3a5a" opacity=".5"/>
      <rect x="190" y="116" width="140" height="30" rx="4" fill="#e8e3da"/><text x="260" y="138" text-anchor="middle" font-family="Georgia,serif" font-size="17" font-weight="700" fill="#1a1205">¡Despedido!</text>
      <path d="M200 100 L260 60 L320 100" fill="#6b4a2a"/><rect x="200" y="100" width="120" height="8" fill="#4a3320"/>
      <circle cx="205" cy="190" r="14" fill="#ffb454"/><rect x="230" y="200" width="100" height="14" rx="6" fill="#6aa8ff" opacity=".5"/>
      <path d="M70 330 L70 190 Q70 160 100 160 Q130 160 130 190 L130 330Z" fill="#05070d"/><circle cx="100" cy="132" r="26" fill="#05070d"/>
      <path d="M126 200 L180 180" stroke="#05070d" stroke-width="14" stroke-linecap="round"/>`);
    if (kind === 'cafe_solo') return frame(`
      <rect x="0" y="230" width="520" height="100" fill="#10141f"/><rect x="0" y="224" width="520" height="10" fill="#243050"/>
      <circle cx="260" cy="150" r="160" fill="url(#eg)"/>
      <path d="M236 150 L284 150 L276 224 L244 224Z" fill="#e8e3da"/><rect x="232" y="140" width="56" height="12" rx="5" fill="#d8d2c6"/>
      <path class="steam" d="M252 128 q-10 -20 0 -34 q10 -16 0 -32" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="5" stroke-linecap="round"/>
      ${[60, 120, 400, 460].map((x, i) => `<g opacity=".55"><ellipse cx="${x}" cy="120" rx="14" ry="16" fill="#05070d"/><path d="M${x - 24} 230 Q${x - 24} 150 ${x} 150 Q${x + 24} 150 ${x + 24} 230Z" fill="#05070d" transform="translate(${i < 2 ? -30 : 30} 0)"/></g>`).join('')}`);
    return frame(`
      <circle cx="400" cy="120" r="130" fill="url(#eg)"/>
      ${[40, 110, 200, 300, 380, 450].map((x, i) => `<rect x="${x}" y="${120 + (i * 37) % 90}" width="${44 + (i % 2) * 20}" height="${210 - ((i * 37) % 90)}" fill="#0a0d18"/>`).join('')}
      <rect x="0" y="278" width="520" height="52" fill="#05070c"/><rect x="0" y="274" width="520" height="4" fill="#ffb454" opacity=".6"/>`);
  }

  return { bedroom, platform, train, azca, office, cafe, endingArt };
})();
