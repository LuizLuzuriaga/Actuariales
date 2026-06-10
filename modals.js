/* ============================================================
   modals.js — Contenido de todos los minijuegos / paneles
   ============================================================ */
 
let modalOpen = false;
const unlocked = new Set();
 
/* ---------- Abrir modal ---------- */
function openModal(id) {
  const el  = document.getElementById('modal');
  const box = document.getElementById('modal-content');
  el.classList.add('open');
  modalOpen = true;
  box.innerHTML = getContent(id);
  awardBadge(id);
  markMinimap(id);
  /* Inicializar lógica tras render */
  setTimeout(() => {
    if (id === 'dice')    runMonteCarlo();
    if (id === 'kitchen') bindPrima();
    if (id === 'board')   bindMarkov();
  }, 80);
}
 
/* ---------- Cerrar modal ---------- */
function closeModal() {
  document.getElementById('modal').classList.remove('open');
  modalOpen = false;
  requestAnimationFrame(gameLoop);
}
 
/* ---------- Badges ---------- */
function awardBadge(id) {
  if (unlocked.has(id)) return;
  unlocked.add(id);
  const labels = {
    desk:     '📊 Mortalidad',
    computer: '💼 No-Vida',
    board:    '🔗 Markov',
    dice:     '🎲 MonteCarlo',
    bar:      '🏋️ Atleta',
    kitchen:  '📐 Prima Pura',
    window:   '📄 CV',
  };
  const b  = document.getElementById('badges');
  const el = document.createElement('div');
  el.className = 'badge';
  el.textContent = labels[id] || '⭐';
  b.appendChild(el);
}
 
/* ---------- Minimap visitado ---------- */
function markMinimap(id) {
  const z = document.querySelector(`.mm-zone[data-zone="${id}"]`);
  if (z) z.classList.add('visited');
}
 
/* ============================================================
   CONTENIDO DE CADA MODAL
   ============================================================ */
 
function getContent(id) {
  switch (id) {
    case 'desk':     return contentMortality();
    case 'computer': return contentPortfolio();
    case 'board':    return contentMarkov();
    case 'dice':     return contentMonteCarlo();
    case 'bar':      return contentSport();
    case 'kitchen':  return contentPrima();
    case 'window':   return contentCV();
    default:         return '<p>...</p>';
  }
}
 
/* ──────────────────────────────────────────────────────────
   1. TABLA DE MORTALIDAD PROFESIONAL
   ────────────────────────────────────────────────────────── */
function contentMortality() {
  const stages = [
    { period:'2017–2021', label:'Hostelería — Team Leader',            qx:0.020, lx:100000, color:'#5cdc8c' },
    { period:'2021–2025', label:'Grado en Economía (UAH) — 8.6/10',   qx:0.030, lx: 98020, color:'#5cdc8c' },
    { period:'2023–2024', label:'Gestor Bancario — EVO Banco',         qx:0.055, lx: 95079, color:'#ffb830' },
    { period:'2025+',     label:'Máster Ciencias Actuariales (UAH)',   qx:0.008, lx: 89847, color:'#5cdc8c' },
    { period:'Futuro',    label:'Actuario Certificado',                qx:0.001, lx: 89128, color:'#9c6cff' },
  ];
 
  const rows = stages.map(s => {
    const barW = Math.round(s.qx * 1000);
    return `<tr>
      <td>${s.period}</td>
      <td>${s.label}</td>
      <td style="color:${s.color}; font-weight:bold">${s.qx.toFixed(3)}</td>
      <td>${s.lx.toLocaleString('es-ES')}</td>
    </tr>`;
  }).join('');
 
  return `
  <h2>📊 Tabla de Mortalidad Profesional</h2>
  <p style="font-size:11px;color:#8a7ab0;margin-bottom:12px">
    Inspirada en tablas biométricas de vida. <strong style="color:#af8fff">qₓ</strong> = probabilidad de
    abandonar la trayectoria en ese período · <strong style="color:#af8fff">lₓ</strong> = supervivientes
    en escala base 100.000
  </p>
  <table class="mini-table">
    <thead>
      <tr>
        <th>Período</th>
        <th>Etapa</th>
        <th>qₓ</th>
        <th>lₓ</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div style="margin-top:14px">
    <p style="font-size:11px;color:#8a7ab0;margin-bottom:6px">Esperanza de vida profesional:</p>
    ${stages.map(s => `
    <div class="bar-row">
      <span class="bar-label" style="width:145px;font-size:10px">${s.period}</span>
      <div class="bar-bg">
        <div class="bar-fill" style="width:${Math.round((1-s.qx)*100)}%;background:linear-gradient(90deg,${s.color}88,${s.color})"></div>
      </div>
      <span style="font-size:10px;color:${s.color};width:36px;text-align:right">${Math.round((1-s.qx)*100)}%</span>
    </div>`).join('')}
  </div>
  <div class="nota-info">
    💡 <strong>Nota técnica:</strong> El Máster Actuarial presenta el <em>qₓ más bajo</em> de toda la tabla (0.008),
    indicando máxima persistencia y compromiso. El estado "Actuario Certificado" actúa como
    estado absorbente (qₓ → 0).
  </div>`;
}
 
/* ──────────────────────────────────────────────────────────
   2. PORTAFOLIO NO-VIDA
   ────────────────────────────────────────────────────────── */
function contentPortfolio() {
  const projects = [
    {
      name: 'Modelización de Riesgo Crediticio',
      ramo: 'Crédito / Financiero',
      prima: 'Alta complejidad',
      cobertura: 'Análisis datos transaccionales bancarios EVO Banco. Detección de patrones de riesgo en productos (cuentas, préstamos, tarjetas).',
      tools: ['Python','Pandas','NumPy','Excel Avanzado'],
      color: '#6ab8ff'
    },
    {
      name: 'Análisis y Reporting de KPIs Operativos',
      ramo: 'Operacional / CRM',
      prima: 'Media complejidad',
      cobertura: 'Dashboards de seguimiento de KPIs para Grupo Covisian. Integración con Salesforce CRM.',
      tools: ['Salesforce','Excel','Power Query'],
      color: '#8adfff'
    },
    {
      name: 'Econometría Aplicada — TFG Economía',
      ramo: 'Macroeconómico',
      prima: 'Alta complejidad',
      cobertura: 'Análisis macroeconómico con modelos de regresión y series temporales. Nota media del grado: 8.6/10.',
      tools: ['R','tidyverse','Stata','LaTeX'],
      color: '#60a8ff'
    },
    {
      name: 'Certificación R Avanzado + Power BI',
      ramo: 'Analytics / Visualización',
      prima: 'Especialización',
      cobertura: 'Formación avanzada en análisis estadístico con R y visualización de datos con Power BI. UAH 2026.',
      tools: ['R','ggplot2','Power BI','dplyr'],
      color: '#90c8ff'
    },
  ];
 
  return `
  <h2>💼 Portafolio No-Vida — Proyectos como Pólizas</h2>
  <p style="font-size:11px;color:#8a7ab0;margin-bottom:12px">
    En seguros No-Vida cada póliza tiene: <strong style="color:#6ab8ff">Ramo</strong> (área de cobertura) ·
    <strong style="color:#6ab8ff">Prima</strong> (nivel de complejidad requerida) ·
    <strong style="color:#6ab8ff">Cobertura</strong> (problema real resuelto)
  </p>
  ${projects.map(p => `
  <div class="portf-card">
    <h4 style="color:${p.color}">${p.name}</h4>
    <div style="display:flex;gap:16px;margin-bottom:7px;flex-wrap:wrap">
      <span style="font-size:10px;color:#8a9ab0">Ramo: <strong style="color:${p.color}">${p.ramo}</strong></span>
      <span style="font-size:10px;color:#8a9ab0">Prima: <strong style="color:${p.color}">${p.prima}</strong></span>
    </div>
    <p style="font-size:10px;color:#a090c0;margin-bottom:8px;line-height:1.6">${p.cobertura}</p>
    ${p.tools.map(t => `<span class="portf-tag">${t}</span>`).join('')}
  </div>`).join('')}
  <div class="nota-info">
    📋 <strong>Nota actuarial:</strong> La diversificación de ramos (crédito, operacional, macro, analytics) es
    análoga a un portafolio No-Vida equilibrado: reduce la correlación entre riesgos y maximiza la
    estabilidad del perfil profesional.
  </div>`;
}
 
/* ──────────────────────────────────────────────────────────
   3. CADENA DE MARKOV
   ────────────────────────────────────────────────────────── */
function contentMarkov() {
  return `
  <h2>🔗 Cadena de Markov — Trayectoria Profesional</h2>
  <p style="font-size:11px;color:#8a7ab0;margin-bottom:12px">
    Cada etapa es un estado del proceso. Las probabilidades de transición representan la
    coherencia y determinación de la trayectoria. Haz clic en cada nodo para ver detalles.
  </p>
  <div id="markov-chain" style="text-align:center;margin:14px 0;line-height:2.2">
    <span class="chain-node" data-state="hostel">Hostelería<br><span style="font-size:9px;color:#6a5a9a">2017–21</span></span>
    <span class="chain-arrow">→</span>
    <span class="chain-node" data-state="grado">Grado Econ.<br><span style="font-size:9px;color:#6a5a9a">2021–25</span></span>
    <span class="chain-arrow">→</span>
    <span class="chain-node" data-state="banca">Banca EVO<br><span style="font-size:9px;color:#6a5a9a">2023–24</span></span>
    <span class="chain-arrow">→</span>
    <span class="chain-node active" data-state="master">Máster Act.<br><span style="font-size:9px;color:#6a5a9a">2025+</span></span>
    <span class="chain-arrow">→</span>
    <span class="chain-node" data-state="actuario">Actuario<br><span style="font-size:9px;color:#6a5a9a">Objetivo</span></span>
  </div>
  <div id="markov-info"></div>`;
}
 
const markovData = {
  hostel:   { title:'Hostelería (2017–2021)', trans:'P(→ Grado) = 0.85', text:'Liderazgo de equipos de hasta 5 personas en entornos de alta presión. Gestión de inventarios, cuadre de caja. Establecimientos: Pirulo, El Jamón de Gran Vía, Don Jamón.' },
  grado:    { title:'Grado en Economía — UAH (2021–2025)', trans:'P(→ Máster) = 0.80', text:'Nota media: <strong style="color:#af8fff">8.6 / 10</strong>. Especialización en Econometría y Análisis Macroeconómico. Capacidad analítica para grandes volúmenes de datos.' },
  banca:    { title:'Gestor Bancario — EVO Banco (2023–2024)', trans:'P(→ Máster) = 0.75', text:'Análisis financiero de incidencias en productos bancarios. Prevención de blanqueo de capitales (AML). Salesforce CRM + Excel avanzado para KPIs operativos.' },
  master:   { title:'Máster Ciencias Actuariales — UAH (2025+)', trans:'P(→ Actuario) = 0.95 ✨', text:'Estado actual. Modelos de solvencia, estadística avanzada, gestión de riesgos financieros. El máster de referencia en España para la profesión actuarial.' },
  actuario: { title:'Actuario Certificado — Estado destino', trans:'Estado absorbente: P(permanencia) → 1', text:'Valuación de reservas técnicas, pricing de seguros, modelos estocásticos, Solvencia II. Estado absorbente del proceso — una vez alcanzado, la probabilidad de retroceso tiende a cero.' },
};
 
function bindMarkov() {
  const nodes   = document.querySelectorAll('.chain-node[data-state]');
  const infoBox = document.getElementById('markov-info');
  function show(state) {
    const d = markovData[state];
    if (!d || !infoBox) return;
    nodes.forEach(n => n.classList.toggle('active', n.dataset.state === state));
    infoBox.innerHTML = `
      <div class="mc-result">
        <strong style="color:#af8fff">${d.title}</strong><br>
        <span style="color:#5cdc8c;font-size:10px">${d.trans}</span><br><br>
        <span style="font-size:11px;line-height:1.7">${d.text}</span>
      </div>`;
  }
  nodes.forEach(n => n.addEventListener('click', () => show(n.dataset.state)));
  show('master');
}
 
/* ──────────────────────────────────────────────────────────
   4. SIMULACIÓN MONTE CARLO
   ────────────────────────────────────────────────────────── */
function contentMonteCarlo() {
  return `
  <h2>🎲 Simulación Monte Carlo — Éxito Profesional</h2>
  <p style="font-size:11px;color:#8a7ab0;margin-bottom:10px">
    1.000 trayectorias simuladas basadas en las variables reales del perfil de Luiz.
    Cada simulación es aleatoria — pulsa varias veces para ver la distribución.
  </p>
  <button class="modal-btn" onclick="runMonteCarlo()" style="margin-bottom:12px">▶ Nueva simulación</button>
  <canvas id="mc-canvas" width="500" height="160"
    style="width:100%;background:#06060e;border-radius:6px;border:1px solid #1a1a3a;display:block"></canvas>
  <div id="mc-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px"></div>
  <div class="nota-info" style="margin-top:12px">
    📊 <strong>Variables del modelo:</strong> Nota académica (8.6/10) · Experiencia bancaria ·
    Formación actuarial · Python/R/Stata · Inglés B2 · Disciplina deportiva · Habilidades blandas.
    Distribución de resultados: cada línea = una trayectoria posible.
  </div>`;
}
 
function runMonteCarlo() {
  const c = document.getElementById('mc-canvas');
  if (!c) return;
  const ctx2 = c.getContext('2d');
  const CW = 500, CH = 160;
  ctx2.clearRect(0, 0, CW, CH);
  ctx2.fillStyle = '#06060e';
  ctx2.fillRect(0, 0, CW, CH);
 
  /* Ejes */
  ctx2.strokeStyle = '#2a1a4a';
  ctx2.lineWidth = 0.5;
  [0.25, 0.5, 0.75, 1.0].forEach(r => {
    const y = CH - r * (CH - 20) - 10;
    ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(CW, y); ctx2.stroke();
    ctx2.fillStyle = '#4a3a6a';
    ctx2.font = '8px monospace';
    ctx2.fillText(Math.round(r * 100) + '%', 2, y - 2);
  });
 
  const N = 1000;
  const results = [];
 
  for (let i = 0; i < N; i++) {
    let val = 50;
    val += (8.6 / 10) * 18;                      // nota
    val += Math.random() * 12;                    // experiencia bancaria
    val += Math.random() * 10;                    // máster actuarial
    val += Math.random() * 8;                     // python/R
    val += Math.random() * 5;                     // inglés
    val += Math.random() * 4;                     // deporte/disciplina
    val += (Math.random() - 0.4) * 8;             // ruido
    val = Math.max(20, Math.min(100, val));
    results.push(val);
 
    const x = (i / N) * CW;
    const y = CH - (val / 100) * (CH - 20) - 10;
    const hue = 240 + val * 0.8;
    ctx2.strokeStyle = \`hsla(\${hue},70%,60%,0.25)\`;
    ctx2.lineWidth = 0.6;
    ctx2.beginPath(); ctx2.moveTo(x, y); ctx2.lineTo(x + CW/N + 1, y); ctx2.stroke();
  }
 
  /* Percentiles */
  const sorted = [...results].sort((a, b) => a - b);
  const pct = r => sorted[Math.floor(N * r)];
  const mean = results.reduce((s, v) => s + v, 0) / N;
  const over85 = Math.round(results.filter(v => v >= 85).length / N * 100);
 
  /* Línea de la mediana */
  const medY = CH - (pct(0.5) / 100) * (CH - 20) - 10;
  ctx2.strokeStyle = '#af8fff';
  ctx2.lineWidth = 1.5;
  ctx2.setLineDash([4, 3]);
  ctx2.beginPath(); ctx2.moveTo(0, medY); ctx2.lineTo(CW, medY); ctx2.stroke();
  ctx2.setLineDash([]);
  ctx2.fillStyle = '#af8fff';
  ctx2.font = '9px monospace';
  ctx2.fillText('P50 = ' + pct(0.5).toFixed(1) + '%', CW - 90, medY - 3);
 
  const statsEl = document.getElementById('mc-stats');
  if (!statsEl) return;
  statsEl.innerHTML = [
    ['P10 (pesimista)', pct(0.1).toFixed(1) + '%', '#ff6c6c'],
    ['Mediana P50',     pct(0.5).toFixed(1) + '%', '#af8fff'],
    ['P90 (optimista)', pct(0.9).toFixed(1) + '%', '#5cdc8c'],
    ['Media E[X]',      mean.toFixed(1) + '%',     '#ffb830'],
    ['VaR 90%',        (100 - pct(0.1)).toFixed(1) + '% downside', '#ff8c5c'],
    ['P(≥ 85%)',        over85 + '% trayectorias', '#6ab8ff'],
  ].map(([l, v, c]) => \`
    <div style="background:#0a0a1e;border:1px solid #2a1a4a;border-radius:5px;padding:8px;font-size:10px">
      <div style="color:#6a5a9a;margin-bottom:3px">\${l}</div>
      <div style="color:\${c};font-size:14px;font-weight:bold">\${v}</div>
    </div>\`).join('');
}
 
/* ──────────────────────────────────────────────────────────
   5. VIDA DEPORTIVA
   ────────────────────────────────────────────────────────── */
function contentSport() {
  return \`
  <h2>🏋️ Barra de Dominadas — Perfil Deportivo</h2>
  <p style="font-size:11px;color:#8a7ab0;margin-bottom:12px">
    El deporte como disciplina paralela al estudio. La constancia es una variable actuarial de
    largo plazo: reduce el riesgo de burnout (qₓ) y aumenta la esperanza de vida laboral.
  </p>
 
  <div class="diet-card" style="border-color:#1a3a6a">
    <h4 style="color:#6ab8ff">🏃 Running — Carreras populares</h4>
    <div class="sport-stat"><span>San Silvestre Vallecana (Madrid)</span><span class="sport-val" style="color:#6ab8ff">✅ Completada</span></div>
    <div class="sport-stat"><span>Carrera Centralista — Vallecas</span><span class="sport-val" style="color:#6ab8ff">✅ Completada</span></div>
    <div class="sport-stat"><span>Frecuencia de rodaje semanal</span><span class="sport-val" style="color:#6ab8ff">3–4 días</span></div>
    <div class="sport-stat"><span>Disciplina de entrenamiento</span><span class="sport-val" style="color:#6ab8ff">Consistente</span></div>
  </div>
 
  <div class="diet-card" style="border-color:#2a4a2a">
    <h4 style="color:#8fe8a0">💪 Calistenia & Gimnasio</h4>
    <div class="sport-stat"><span>Dominadas — ejercicio principal</span><span class="sport-val">🔥 En progresión</span></div>
    <div class="sport-stat"><span>Sesiones semanales de gimnasio</span><span class="sport-val">4–5 sesiones</span></div>
    <div class="sport-stat"><span>Tipo de entrenamiento</span><span class="sport-val">Fuerza + funcional</span></div>
  </div>
 
  <div class="diet-card" style="border-color:#3a2a4a">
    <h4 style="color:#c9a0ff">🥗 Nutrición & Suplementación</h4>
    <div class="sport-stat"><span>Creatina monohidrato</span><span class="sport-val" style="color:#c9a0ff">✅ Diario</span></div>
    <div class="sport-stat"><span>Proteína de suero (whey)</span><span class="sport-val" style="color:#c9a0ff">✅ Post-entreno</span></div>
    <div class="sport-stat"><span>Omega-3 (EPA/DHA)</span><span class="sport-val" style="color:#c9a0ff">✅ Diario</span></div>
    <div class="sport-stat"><span>Cocina saludable variada</span><span class="sport-val" style="color:#c9a0ff">Alta prioridad</span></div>
  </div>
 
  <p style="font-size:11px;color:#8a7ab0;margin:10px 0 6px">Indicadores actuariales de salud:</p>
  \${[
    ['Consistencia deportiva', 92, '#5cdc8c', 'linear-gradient(90deg,#2a8a4a,#5cdc8c)'],
    ['Nivel de competición',   70, '#6ab8ff', 'linear-gradient(90deg,#2a4a8a,#6ab8ff)'],
    ['Fuerza relativa',        80, '#af8fff', 'linear-gradient(90deg,#5c3cbf,#af8fff)'],
    ['Nutrición optimizada',   88, '#ffb830', 'linear-gradient(90deg,#8a5a10,#ffb830)'],
  ].map(([l, v, c, bg]) => \`
  <div class="bar-row">
    <span class="bar-label" style="width:160px">\${l}</span>
    <div class="bar-bg"><div class="bar-fill" style="width:\${v}%;background:\${bg}"></div></div>
    <span style="color:\${c};font-size:10px;width:34px;text-align:right">\${v}%</span>
  </div>\`).join('')}
 
  <div class="nota-info">
    📊 <strong>Insight actuarial:</strong> Un perfil con hábitos deportivos consistentes presenta
    una tasa de abandono laboral (qₓ) estadísticamente inferior a la media. La disciplina
    deportiva correlaciona positivamente con la gestión del estrés y la productividad a largo plazo.
  </div>\`;
}
 
/* ──────────────────────────────────────────────────────────
   6. CALCULADORA DE PRIMA PURA
   ────────────────────────────────────────────────────────── */
function contentPrima() {
  return \`
  <h2>📐 Calculadora de Prima Pura</h2>
  <p style="font-size:11px;color:#8a7ab0;margin-bottom:12px">
    La prima pura E[X] = Σ (pᵢ · vᵢ · wᵢ) donde pᵢ son las puntuaciones del perfil,
    vᵢ el valor de cada competencia y wᵢ el peso relativo según el puesto buscado.
    Ajusta los parámetros para calcular el valor esperado de contratación.
  </p>
 
  <div class="prima-row"><label>Nota académica (8.6/10)</label>
    <input type="range" id="pr-nota" min="1" max="10" step="1" value="9"><span id="pv-nota">9</span></div>
  <div class="prima-row"><label>Experiencia bancaria</label>
    <input type="range" id="pr-exp" min="1" max="10" step="1" value="7"><span id="pv-exp">7</span></div>
  <div class="prima-row"><label>Python / R / Stata</label>
    <input type="range" id="pr-tech" min="1" max="10" step="1" value="7"><span id="pv-tech">7</span></div>
  <div class="prima-row"><label>Inglés profesional B2</label>
    <input type="range" id="pr-ing" min="1" max="10" step="1" value="7"><span id="pv-ing">7</span></div>
  <div class="prima-row"><label>Formación actuarial</label>
    <input type="range" id="pr-act" min="1" max="10" step="1" value="9"><span id="pv-act">9</span></div>
  <div class="prima-row"><label>Disciplina / soft skills</label>
    <input type="range" id="pr-soft" min="1" max="10" step="1" value="9"><span id="pv-soft">9</span></div>
 
  <div id="prima-result">
    <div class="valor" id="prima-val">--</div>
    <div class="label-small">Prima Pura Calculada E[X]</div>
    <div class="desc" id="prima-desc"></div>
  </div>
 
  <div class="nota-info" style="margin-top:12px">
    ⚖️ <strong>Pesos del modelo:</strong> Formación actuarial (22%) · Nota académica (20%) ·
    Habilidades técnicas (18%) · Experiencia bancaria (15%) · Disciplina/soft skills (15%) · Inglés (10%).
  </div>\`;
}
 
function bindPrima() {
  const ids     = ['nota', 'exp', 'tech', 'ing', 'act', 'soft'];
  const weights = [0.20, 0.15, 0.18, 0.10, 0.22, 0.15];
 
  function calc() {
    const vals = ids.map(i => parseInt(document.getElementById('pr-' + i)?.value || 5));
    ids.forEach((i, j) => {
      const el = document.getElementById('pv-' + i);
      if (el) el.textContent = vals[j];
    });
 
    const prima = vals.reduce((s, v, i) => s + v * weights[i] * 10, 0);
    const valEl  = document.getElementById('prima-val');
    const descEl = document.getElementById('prima-desc');
 
    if (valEl) valEl.textContent = prima.toFixed(1) + ' / 100';
 
    if (descEl) {
      if (prima >= 82)
        descEl.innerHTML = '🟢 <strong>Candidato de alto valor esperado.</strong> Perfil sólido para puestos actuariales. Recomendación: proceso de selección prioritario.';
      else if (prima >= 68)
        descEl.innerHTML = '🟡 <strong>Buen perfil.</strong> Apto para incorporación con plan de desarrollo. Potencial de crecimiento alto.';
      else
        descEl.innerHTML = '🔴 <strong>Perfil en desarrollo.</strong> Ajusta los parámetros de búsqueda o amplía el período de formación.';
    }
  }
 
  ids.forEach(i => {
    const el = document.getElementById('pr-' + i);
    if (el) el.addEventListener('input', calc);
  });
  calc();
}
 
/* ──────────────────────────────────────────────────────────
   7. CV COMPLETO
   ────────────────────────────────────────────────────────── */
function contentCV() {
  return \`
  <h2>📄 Luiz Alberto Luzuriaga Izquierdo</h2>
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;flex-wrap:wrap">
    <div>
      <p style="font-size:12px;color:#af8fff;margin-bottom:2px">Estudiante de Máster en Ciencias Actuariales y Financieras</p>
      <p style="font-size:10px;color:#6a5a9a">📍 Madrid, España · 📧 luzuriagaluiz@gmail.com · 📱 628 102 733</p>
    </div>
  </div>
 
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <a href="https://www.linkedin.com/in/luiz-luzuriaga-izquierdo" target="_blank" rel="noopener"
       style="color:#6ab8ff;font-size:11px;text-decoration:none;border:1px solid #2a4a6a;padding:5px 12px;border-radius:4px">LinkedIn ↗</a>
    <a href="https://github.com/LuizLuzuriaga/Actuariales" target="_blank" rel="noopener"
       style="color:#af8fff;font-size:11px;text-decoration:none;border:1px solid #3a2a6a;padding:5px 12px;border-radius:4px">GitHub ↗</a>
    <a href="mailto:luzuriagaluiz@gmail.com"
       style="color:#5cdc8c;font-size:11px;text-decoration:none;border:1px solid #2a4a2a;padding:5px 12px;border-radius:4px">Email ↗</a>
  </div>
 
  <p style="font-size:11px;color:#8a7ab0;margin-bottom:8px">Habilidades técnicas:</p>
  \${[
    ['Análisis de datos / Estadística', 85],
    ['Excel Avanzado / Stata',          82],
    ['Python (Pandas, NumPy)',          70],
    ['R (tidyverse, ggplot2)',          72],
    ['Salesforce CRM',                  75],
    ['SQL (básico)',                    55],
    ['LaTeX',                           65],
    ['Power BI',                        68],
  ].map(([l, v]) => \`
  <div class="bar-row">
    <span class="bar-label" style="width:185px">\${l}</span>
    <div class="bar-bg"><div class="bar-fill" style="width:\${v}%"></div></div>
    <span style="color:#af8fff;font-size:10px;width:32px;text-align:right">\${v}%</span>
  </div>\`).join('')}
 
  <p style="font-size:11px;color:#8a7ab0;margin:14px 0 8px">Formación y experiencia:</p>
  \${[
    ['🎓', 'Máster Ciencias Actuariales y Financieras', 'UAH · Sept 2025 – actualidad', 'Modelos de solvencia · Estadística avanzada · Gestión de riesgos', '#af8fff'],
    ['🎓', 'Grado en Economía',                          'UAH · Sept 2021 – Jun 2025',  'Nota media: 8.6/10 · Econometría · Análisis macroeconómico', '#9c6cff'],
    ['🏦', 'Gestor de Operaciones Bancarias',             'EVO Banco (Covisian) · Jun 2023 – Sept 2024', 'AML · Salesforce · Excel KPIs · Análisis de riesgo', '#6ab8ff'],
    ['🍽', 'Team Leader / Jefe de Salón',                 'Hostelería · Jun 2017 – Sept 2021', 'Liderazgo hasta 5 personas · Gestión inventarios · Alta presión', '#5cdc8c'],
  ].map(([icon, title, when, desc, c]) => \`
  <div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid #1a1a3a">
    <div style="font-size:20px;line-height:1">\${icon}</div>
    <div>
      <div style="font-size:12px;color:\${c};margin-bottom:2px">\${title}</div>
      <div style="font-size:10px;color:#6a5a9a;margin-bottom:3px">\${when}</div>
      <div style="font-size:10px;color:#a090c0;line-height:1.5">\${desc}</div>
    </div>
  </div>\`).join('')}
 
  <p style="font-size:11px;color:#8a7ab0;margin:14px 0 8px">Idiomas:</p>
  <div class="bar-row"><span class="bar-label">Español (nativo)</span><div class="bar-bg"><div class="bar-fill" style="width:100%"></div></div><span style="color:#af8fff;font-size:10px;width:32px;text-align:right">100%</span></div>
  <div class="bar-row"><span class="bar-label">Inglés (B2)</span><div class="bar-bg"><div class="bar-fill" style="width:72%"></div></div><span style="color:#af8fff;font-size:10px;width:32px;text-align:right">72%</span></div>\`;
}
