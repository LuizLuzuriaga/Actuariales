/* minigames.js — pensamientos y tareas del día. Matemática real pero ligera.
   Cada función monta su interfaz en `card` y llama a done(valor) al terminar. */
const Games = (() => {

  /* ---------- Utilidades ---------- */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function seeded(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function poissonSample(rand, lambda) {
    const L = Math.exp(-lambda); let k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  }
  function slider(id, label, min, max, step, val, show) {
    return `<div class="ctl"><label for="${id}">${label}</label><output id="${id}-o">${show ? show(val) : val}</output>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  }

  /* ======================================================================
     1) ANDÉN — la curva de mortalidad que no se mueve (datos INE 2024)
     ====================================================================== */
  function mortalidad(card, done) {
    let sexo = 'total', vista = 'dx', shift = 0;
    card.innerHTML = `
      <p class="lead">Llevas tres trenes viendo el mismo andén: gente de 40 a 50 años apilada contra las puertas.
        Y piensas: <i>si la hora punta fuera una tabla de mortalidad, ¿dónde estaría el pico?</i>
        Mueve la curva real de España ${INE.anio} y mira qué pasaría si las muertes ocurrieran antes.</p>
      <div class="tabs" role="group" aria-label="Sexo">
        <button class="tab" data-sx="total" aria-pressed="true">Total</button><button class="tab" data-sx="hombres" aria-pressed="false">Hombres</button><button class="tab" data-sx="mujeres" aria-pressed="false">Mujeres</button>
        <span style="flex:1"></span>
        <button class="tab" data-vw="dx" aria-pressed="true">Muertes por edad (dₓ)</button><button class="tab" data-vw="qx" aria-pressed="false">Riesgo qₓ (log)</button>
      </div>
      <svg class="chart" id="mg-chart" viewBox="0 0 640 300" role="img" aria-label="Curva de mortalidad de España"></svg>
      ${slider('mg-shift', 'Desplazar la curva hacia edades más jóvenes', 0, 45, 1, 0, v => v + ' años')}
      <div class="stats" id="mg-stats"></div>
      <p class="note" id="mg-cap"></p>
      <p class="note">Fuente: ${INE.fuente}. dₓ = lₓ − lₓ₊₁ (de 100.000 nacidos). El desplazamiento es una broma de andén: mueve toda la curva sin tocar la forma.</p>
      <div class="actions"><button class="btn primary" id="mg-ok">Dejar de pensar (llega otro tren)</button></div>`;

    const chart = card.querySelector('#mg-chart');
    const stats = card.querySelector('#mg-stats');
    const cap = card.querySelector('#mg-cap');

    function series() {
      const T = INE[sexo], l = T.l;
      const dx = l.slice(0, 100).map((v, i) => (v - l[i + 1]) / l[0]);
      /* El INE agrupa «100 y más»: reparto esa cola (50 % de salida anual aprox.) para no dibujar un pico falso */
      let resto = l[100];
      for (let k = 0; k < 10; k++) { const d = k < 9 ? resto * 0.35 : resto; dx.push(d / l[0]); resto -= d; }
      return { dx, q: T.q.slice(0, 100).map(v => v / 1000) };
    }
    function shifted(arr, s) { return arr.map((_, x) => (x + s < arr.length ? arr[x + s] : 0)); }

    function draw() {
      const { dx, q } = series();
      const X = (a) => 36 + a * 5.36, Yd = (v, m) => 260 - (v / m) * 220;
      let g = '';
      if (vista === 'dx') {
        const m = Math.max(...dx) * 1.1, s = shifted(dx, shift);
        const area = (arr) => `M${X(0)} 260 ${arr.map((v, a) => `L${X(a).toFixed(1)} ${Yd(v, m).toFixed(1)}`).join(' ')} L${X(100)} 260Z`;
        g += `<rect x="${X(40)}" y="30" width="${X(50) - X(40)}" height="230" fill="#ffb454" opacity=".13"/><text x="${(X(40) + X(50)) / 2}" y="46" text-anchor="middle" font-size="11" fill="#ffb454">40-50 años</text>`;
        g += `<path d="${area(dx)}" fill="#6aa8ff" opacity="${shift ? 0.18 : 0.55}"/>`;
        if (shift) g += `<path d="${area(s)}" fill="#ffb454" opacity=".6"/>`;
        [0, 20, 40, 60, 80, 100].forEach(a => { g += `<text x="${X(a)}" y="280" text-anchor="middle" font-size="11" fill="#9aa6bd">${a}</text>`; });
        g += `<text x="12" y="24" font-size="11" fill="#9aa6bd">muertes por edad</text>`;
      } else {
        const lo = Math.log10(1e-5), hi = 0, Yq = (v) => 260 - ((Math.log10(Math.max(v, 1e-5)) - lo) / (hi - lo)) * 220;
        const line = (arr, c, w) => `<polyline fill="none" stroke="${c}" stroke-width="${w}" points="${arr.map((v, a) => `${X(a).toFixed(1)},${Yq(v).toFixed(1)}`).join(' ')}"/>`;
        [1e-5, 1e-4, 1e-3, 1e-2, 1e-1, 1].forEach(v => { g += `<line x1="36" x2="626" y1="${Yq(v)}" y2="${Yq(v)}" stroke="#1d2640"/><text x="30" y="${Yq(v) + 4}" text-anchor="end" font-size="10" fill="#6c7892">${v >= 0.1 ? v * 100 + '%' : '1e' + Math.round(Math.log10(v))}</text>`; });
        g += `<rect x="${X(40)}" y="30" width="${X(50) - X(40)}" height="230" fill="#ffb454" opacity=".13"/>`;
        g += line(q, '#6aa8ff', shift ? 2 : 4);
        if (shift) g += line(shifted(q, shift).map((v, a) => (a + shift <= 99 ? v : 1)), '#ffb454', 4);
        [0, 20, 40, 60, 80, 100].forEach(a => { g += `<text x="${X(a)}" y="280" text-anchor="middle" font-size="11" fill="#9aa6bd">${a}</text>`; });
        g += `<text x="12" y="24" font-size="11" fill="#9aa6bd">probabilidad de morir en el año (escala log)</text>`;
      }
      chart.innerHTML = g;

      const s = shifted(dx, shift), tot = s.reduce((a, b) => a + b, 0);
      const mean = s.reduce((acc, v, a) => acc + v * (a + 0.5), 0) / tot;
      const modal = s.indexOf(Math.max(...s));
      const antes65 = s.slice(0, 65).reduce((a, b) => a + b, 0) / tot;
      const en4050 = s.slice(40, 51).reduce((a, b) => a + b, 0) / tot;
      stats.innerHTML = [
        ['Edad media al morir', fmt(mean) + ' años'], ['Edad modal', modal + ' años'],
        ['Muertes antes de los 65', fmt(antes65 * 100) + ' %'], ['Muertes a los 40-50', fmt(en4050 * 100) + ' %'],
      ].map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
      cap.textContent = shift === 0
        ? 'Hoy: casi nadie muere en el andén. El pico está en los 85-90 años y los de 40-50 solo asoman por la derecha de la nada.'
        : shift < 30 ? 'La curva se acerca a la hora punta. El comité de riesgos empieza a mirarte raro.'
        : 'Con el pico a los ~50, el andén sería la tabla de mortalidad. Por suerte (y por Solvencia II) sigue siendo solo un tren lleno.';
    }

    card.querySelectorAll('[data-sx]').forEach(b => b.addEventListener('click', () => {
      sexo = b.dataset.sx; card.querySelectorAll('[data-sx]').forEach(x => x.setAttribute('aria-pressed', x === b)); draw();
    }));
    card.querySelectorAll('[data-vw]').forEach(b => b.addEventListener('click', () => {
      vista = b.dataset.vw; card.querySelectorAll('[data-vw]').forEach(x => x.setAttribute('aria-pressed', x === b)); draw();
    }));
    card.querySelector('#mg-shift').addEventListener('input', (e) => {
      shift = +e.target.value; card.querySelector('#mg-shift-o').textContent = shift + ' años'; draw();
    });
    card.querySelector('#mg-ok').addEventListener('click', () => done(shift));
    draw();
  }

  /* ======================================================================
     2) OFICINA — Pricing: ajustar a mano un GLM de Poisson
     ====================================================================== */
  function glm(card, done) {
    const ages = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70];
    const rand = seeded(2024);
    const E = ages.map((a) => Math.round(900 + rand() * 1400));
    const trueF = (a) => 0.15 * Math.exp(-0.018 * (a - 20));
    const Y = ages.map((a, i) => poissonSample(rand, E[i] * trueF(a)));
    const x = ages.map(a => a - 20);
    const mu = (b0, b1) => x.map((xi, i) => E[i] * Math.exp(b0 + b1 * xi));
    const dev = (b0, b1) => { const m = mu(b0, b1); return 2 * Y.reduce((s, y, i) => s + (y > 0 ? y * Math.log(y / m[i]) : 0) - (y - m[i]), 0); };

    function ajuste() {                      // Newton-Raphson (lo que hace glm() por dentro)
      let b0 = Math.log(Y.reduce((a, b) => a + b, 0) / E.reduce((a, b) => a + b, 0)), b1 = 0;
      for (let it = 0; it < 30; it++) {
        const m = mu(b0, b1);
        const U0 = Y.reduce((s, y, i) => s + y - m[i], 0), U1 = Y.reduce((s, y, i) => s + (y - m[i]) * x[i], 0);
        const H00 = m.reduce((a, b) => a + b, 0), H01 = m.reduce((s, v, i) => s + v * x[i], 0), H11 = m.reduce((s, v, i) => s + v * x[i] * x[i], 0);
        const det = H00 * H11 - H01 * H01;
        b0 += (H11 * U0 - H01 * U1) / det; b1 += (-H01 * U0 + H00 * U1) / det;
      }
      return { b0, b1 };
    }
    const opt = ajuste(), devOpt = dev(opt.b0, opt.b1);
    let b0 = -1.5, b1 = 0.0, t0 = performance.now(), usedGlm = false;

    card.innerHTML = `
      <p class="lead">Frecuencia de siniestros por edad del conductor. Tienes un software privado de pricing con una premisa muy seria:
        <b>ajustar un GLM arrastrando dos puntos</b>. Sí, también existe una función que lo hace sola. No se lo digas al jefe.</p>
      <svg class="chart" id="gl-chart" viewBox="0 0 640 300" role="img" aria-label="Frecuencia de siniestros por edad y curva ajustada a mano"></svg>
      ${slider('gl-b0', 'Nivel (β₀)', -3.5, -0.5, 0.01, b0, v => (+v).toFixed(2))}
      ${slider('gl-b1', 'Pendiente (β₁)', -0.06, 0.02, 0.0005, b1, v => (+v).toFixed(4))}
      <div class="stats" id="gl-stats"></div>
      <div class="code">proc genmod data=siniestros;
  model n = edad / dist=poisson link=log offset=lnE;
run;</div>
      <p class="note" id="gl-msg">Arrastra los puntos naranjas de los extremos o usa los deslizadores. El objetivo: bajar la devianza.</p>
      <div class="actions"><button class="btn" id="gl-auto">⚡ Ajustar con el GLM (1 clic)</button><button class="btn primary" id="gl-ok">Entregar el modelo</button></div>`;

    const chart = card.querySelector('#gl-chart'), stats = card.querySelector('#gl-stats'), msg = card.querySelector('#gl-msg');
    const X = (a) => 46 + (a - 20) * 11.4, Y_ = (f) => 262 - f * 1100;       // f ∈ [0, 0.22]
    const f0 = () => Math.exp(b0), f1 = () => Math.exp(b0 + b1 * 50);

    function draw() {
      let g = '';
      [0, 0.05, 0.1, 0.15, 0.2].forEach(f => { g += `<line x1="46" x2="626" y1="${Y_(f)}" y2="${Y_(f)}" stroke="#1d2640"/><text x="40" y="${Y_(f) + 4}" text-anchor="end" font-size="10" fill="#6c7892">${(f * 100).toFixed(0)} %</text>`; });
      ages.forEach(a => { g += `<text x="${X(a)}" y="284" text-anchor="middle" font-size="11" fill="#9aa6bd">${a}</text>`; });
      const pts = [];
      for (let a = 20; a <= 70; a += 2) pts.push(`${X(a).toFixed(1)},${Y_(Math.exp(b0 + b1 * (a - 20))).toFixed(1)}`);
      g += `<polyline fill="none" stroke="#ffb454" stroke-width="4" points="${pts.join(' ')}"/>`;
      if (usedGlm) g += `<polyline fill="none" stroke="#6ee7a0" stroke-width="2" stroke-dasharray="6 5" points="${ages.concat([]).map((a) => `${X(a).toFixed(1)},${Y_(Math.exp(opt.b0 + opt.b1 * (a - 20))).toFixed(1)}`).join(' ')}"/>`;
      ages.forEach((a, i) => { g += `<circle cx="${X(a)}" cy="${Y_(Y[i] / E[i])}" r="${4 + E[i] / 400}" fill="#6aa8ff" opacity=".85"/>`; });
      g += `<g id="h0" style="cursor:ns-resize"><circle cx="${X(20)}" cy="${Y_(f0())}" r="16" fill="#ffb454" stroke="#fff" stroke-width="2"/></g>`;
      g += `<g id="h1" style="cursor:ns-resize"><circle cx="${X(70)}" cy="${Y_(f1())}" r="16" fill="#ffb454" stroke="#fff" stroke-width="2"/></g>`;
      chart.innerHTML = g;
      const d = dev(b0, b1);
      stats.innerHTML = `<div class="stat"><b>${fmt(d, 1)}</b><span>Tu devianza</span></div><div class="stat"><b>${fmt(devOpt, 1)}</b><span>Óptimo del GLM</span></div>
        <div class="stat"><b>${fmt(d - devOpt, 1)}</b><span>Diferencia (menos es mejor)</span></div>`;
      card.querySelector('#gl-b0').value = b0; card.querySelector('#gl-b1').value = b1;
      card.querySelector('#gl-b0-o').textContent = b0.toFixed(2); card.querySelector('#gl-b1-o').textContent = b1.toFixed(4);
    }
    function fromHandles(which, yPx) {
      const f = Math.max(0.004, Math.min(0.21, (262 - yPx) / 1100));
      if (which === 0) { const keep1 = f1(); b0 = Math.log(f); b1 = (Math.log(keep1) - b0) / 50; }
      else b1 = (Math.log(f) - b0) / 50;
      b1 = Math.max(-0.06, Math.min(0.02, b1)); b0 = Math.max(-3.5, Math.min(-0.5, b0));
    }
    let drag = null;
    chart.addEventListener('pointerdown', (e) => {
      const h = e.target.closest('#h0, #h1'); if (!h) return;
      drag = h.id === 'h0' ? 0 : 1; chart.setPointerCapture(e.pointerId); e.preventDefault();
    });
    chart.addEventListener('pointermove', (e) => {
      if (drag === null) return;
      const r = chart.getBoundingClientRect();
      fromHandles(drag, (e.clientY - r.top) * (300 / r.height)); draw();
    });
    ['pointerup', 'pointercancel'].forEach(t => chart.addEventListener(t, () => { drag = null; }));
    card.querySelector('#gl-b0').addEventListener('input', (e) => { b0 = +e.target.value; draw(); });
    card.querySelector('#gl-b1').addEventListener('input', (e) => { b1 = +e.target.value; draw(); });
    card.querySelector('#gl-auto').addEventListener('click', () => {
      usedGlm = true; b0 = opt.b0; b1 = opt.b1; draw();
      msg.textContent = `glm() lo resolvió en 0,003 s. Tú llevabas ${Math.round((performance.now() - t0) / 1000)} s arrastrando puntos. Pero hay que parecer ocupado.`;
    });
    card.querySelector('#gl-ok').addEventListener('click', () => {
      const gap = dev(b0, b1) - devOpt;
      Sound.ok();
      msg.textContent = gap < 3 ? 'Casi idéntico al óptimo: o eres un solver con barba o has tenido suerte.' :
        gap < 15 ? 'Aceptable. El jefe nunca abrirá el fichero.' : 'Entregado. Ese ajuste a mano aguanta hasta que alguien lo mire.';
      card.querySelector('#gl-ok').disabled = true;
      setTimeout(() => done(gap), 1500);
    });
    draw();
  }

  /* ======================================================================
     3) OFICINA — Reservas: chain-ladder
     ====================================================================== */
  function chainLadder(card, done) {
    const T = [[1000, 1800, 2200, 2400, 2500], [1100, 2000, 2450, 2650], [1200, 2150, 2600], [1300, 2300], [1400]];
    const N = 5;
    const f = [];
    for (let j = 0; j < N - 1; j++) {
      let a = 0, b = 0;
      for (let i = 0; i < N - 1 - j; i++) { a += T[i][j + 1]; b += T[i][j]; }
      f.push(a / b);
    }
    const order = [];
    for (let i = 1; i < N; i++) for (let j = N - i; j < N; j++) order.push([i, j]);
    const C = T.map(r => r.slice());
    let step = 0, factors = false;

    card.innerHTML = `
      <p class="lead">Siniestros pagados acumulados por año de ocurrencia (miles de €). Falta la mitad del triángulo, como siempre.
        Primero, los factores de desarrollo; luego rellena lo que falta tocando la casilla que parpadea.</p>
      <div id="cl-tbl"></div>
      <p class="note" id="cl-msg">Pulsa «Calcular factores» para empezar.</p>
      <div class="actions"><button class="btn" id="cl-f">Σ. Calcular factores fⱼ</button><button class="btn primary" id="cl-ok" disabled>Dar por buenas las reservas</button></div>`;
    const tbl = card.querySelector('#cl-tbl'), msg = card.querySelector('#cl-msg'), btnF = card.querySelector('#cl-f'), btnOk = card.querySelector('#cl-ok');

    function render() {
      let h = '<table class="tri"><thead><tr><th>Año</th>' + [0, 1, 2, 3, 4].map(j => `<th>${j}</th>`).join('') + '<th>Última</th><th>Reserva</th></tr></thead><tbody>';
      for (let i = 0; i < N; i++) {
        h += `<tr><th>${2021 + i}</th>`;
        for (let j = 0; j < N; j++) {
          const known = j < N - i;
          const idx = order.findIndex(([a, b]) => a === i && b === j);
          if (known) h += `<td>${fmt(T[i][j], 0)}</td>`;
          else if (idx < step) h += `<td class="fill">${fmt(C[i][j], 0)}</td>`;
          else if (factors && idx === step) h += `<td class="next" tabindex="0" role="button" data-i="${i}" data-j="${j}" aria-label="Proyectar año ${2021 + i}, desarrollo ${j}">?</td>`;
          else h += '<td class="empty">·</td>';
        }
        const full = step >= order.length;
        h += `<td>${full ? fmt(C[i][N - 1], 0) : '—'}</td><td>${full ? fmt(C[i][N - 1] - T[i][N - 1 - i], 0) : '—'}</td></tr>`;
      }
      h += '<tr><th>f</th>' + f.map((v, j) => `<td class="factor" colspan="1">${factors ? fmt(v, 4) : '·'}</td>`).join('') + '<td></td><td></td><td></td></tr></tbody></table>';
      if (step >= order.length) {
        const res = C.reduce((s, r, i) => s + r[N - 1] - T[i][N - 1 - i], 0);
        h += `<div class="stats"><div class="stat"><b>${fmt(res, 0)} mil €</b><span>Reserva total (chain-ladder)</span></div></div>`;
      }
      tbl.innerHTML = h;
      tbl.querySelectorAll('.next').forEach(td => {
        const go = () => fill(+td.dataset.i, +td.dataset.j);
        td.addEventListener('click', go);
        td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
    }
    function fill(i, j) {
      C[i][j] = C[i][j - 1] * f[j - 1];
      msg.textContent = `C(${2021 + i}, ${j}) = ${fmt(C[i][j - 1], 0)} × ${fmt(f[j - 1], 4)} = ${fmt(C[i][j], 1)}`;
      Sound.click(); step++;
      if (step >= order.length) {
        msg.textContent += ' · Triángulo completo. Lo difícil ahora es explicarlo en el comité.';
        btnOk.disabled = false; btnOk.focus();
      }
      render();
      const n = tbl.querySelector('.next'); if (n) n.focus();
    }
    btnF.addEventListener('click', () => {
      factors = true; btnF.disabled = true; Sound.ok();
      msg.textContent = 'fⱼ = Σ C(i,j+1) / Σ C(i,j) sobre los años con ambos datos. Ahora proyecta casilla a casilla.';
      render(); const n = tbl.querySelector('.next'); if (n) n.focus();
    });
    btnOk.addEventListener('click', () => { Sound.ok(); done(true); });
    render();
  }

  /* ======================================================================
     4) CAFÉ — la distribución de la próxima tontería
     ====================================================================== */
  function poisson(card, done) {
    let lambda = 3, K = 6;
    card.innerHTML = `
      <p class="lead">Mientras te cuentan la vida resuelta, tu cabeza hace lo que sabe: modelizar. Si las tonterías de un café llegan de forma independiente,
        el número por café sigue una <b>Poisson(λ)</b>. La cola derecha es lo interesante.</p>
      ${slider('po-l', 'λ: tonterías esperadas por café', 0.5, 10, 0.5, lambda, v => (+v).toFixed(1))}
      ${slider('po-k', 'Umbral de «tontería rara»: k o más', 2, 14, 1, K, v => v)}
      <div class="bars" id="po-bars" aria-hidden="true"></div>
      <div class="stats" id="po-stats" style="margin-top:26px"></div>
      <p class="note" id="po-msg"></p>
      <div class="actions"><button class="btn primary" id="po-ok">Anotarlo y volver al café</button></div>`;
    const bars = card.querySelector('#po-bars'), stats = card.querySelector('#po-stats'), msg = card.querySelector('#po-msg');
    function draw() {
      const p = [Math.exp(-lambda)]; for (let k = 1; k <= 14; k++) p.push(p[k - 1] * lambda / k);
      const m = Math.max(...p);
      bars.innerHTML = p.map((v, k) => `<div class="${k >= K ? 'hl' : ''}" style="height:${(v / m * 100).toFixed(1)}%" title="P(N=${k}) = ${(v * 100).toFixed(1)} %"><span>${k}</span></div>`).join('');
      const cola = 1 - p.slice(0, K).reduce((a, b) => a + b, 0);
      const cada = 15 / lambda;
      stats.innerHTML = [
        [fmt(p[0] * 100) + ' %', 'Café sin ninguna tontería'], [fmt(cola * 100, cola < 0.01 ? 2 : 1) + ' %', `P(N ≥ ${K}) · tontería rara`],
        [fmt(cada, 1) + ' min', 'Espera media a la siguiente (exp.)'], [fmt((1 - Math.exp(-lambda / 15)) * 100) + ' %', 'La próxima llega en <1 min'],
      ].map(([v, k]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
      msg.textContent = cola < 0.02 ? 'Un café con ese nivel de tonterías es un suceso raro. Suele pasar justo cuando tienes prisa.'
        : lambda >= 6 ? 'Con ese λ ya no es un café, es un evento corporativo.' : 'Modelo razonable. Falta calibrarlo con datos reales: te los dan gratis cada día a las once.';
    }
    card.querySelector('#po-l').addEventListener('input', (e) => { lambda = +e.target.value; card.querySelector('#po-l-o').textContent = lambda.toFixed(1); draw(); });
    card.querySelector('#po-k').addEventListener('input', (e) => { K = +e.target.value; card.querySelector('#po-k-o').textContent = K; draw(); });
    card.querySelector('#po-ok').addEventListener('click', () => done(true));
    draw();
  }

  /* ======================================================================
     Ficha plana (saltar la historia / CV)
     ====================================================================== */
  const FICHA = {
    nombre: 'Luiz Alberto Luzuriaga Izquierdo',
    rol: 'Estudiante de Máster en Ciencias Actuariales y Financieras (UAH) · Madrid',
    habilidades: [['Análisis de datos / Estadística', 85], ['Excel avanzado / Stata', 82], ['R (tidyverse, ggplot2)', 72], ['Python (Pandas, NumPy)', 70], ['Salesforce CRM', 75], ['Power BI', 68], ['LaTeX', 65], ['SQL (básico)', 55]],
    trayectoria: [
      ['Máster en Ciencias Actuariales y Financieras', 'UAH · sept. 2025 – actualidad', 'Modelos de solvencia, estadística avanzada, gestión de riesgos.'],
      ['Grado en Economía', 'UAH · 2021 – 2025 · nota media 8,6', 'Econometría y análisis macroeconómico.'],
      ['Gestor de operaciones bancarias', 'EVO Banco (Covisian) · 2023 – 2024', 'Prevención de blanqueo, Salesforce, KPIs en Excel.'],
      ['Team leader en hostelería', '2017 – 2021', 'Equipos de hasta 5 personas, inventarios, presión alta.'],
    ],
    proyectos: [
      ['Gedankenpalast — Atlas 3D de estudio', 'Atlas interactivo del temario actuarial y cuantitativo con fórmulas y código ejecutable en el navegador.', ['JavaScript', 'Three.js', 'KaTeX', 'Pyodide'], 'https://luizluzuriaga.github.io/Gedankenpalast/'],
      ['Modelización de riesgo crediticio', 'Patrones de riesgo sobre datos transaccionales bancarios.', ['Python', 'Pandas', 'Excel']],
      ['Reporting de KPIs operativos', 'Cuadros de mando con integración en un CRM.', ['Salesforce', 'Power Query']],
      ['TFG — Econometría aplicada', 'Regresión y series temporales sobre datos macroeconómicos.', ['R', 'Stata', 'LaTeX']],
      ['R avanzado + Power BI', 'Formación de la UAH (2026) en análisis estadístico y visualización.', ['R', 'ggplot2', 'Power BI']],
    ],
  };
  function ficha(card) {
    const F = FICHA;
    card.innerHTML = `<div class="ficha">
      <p class="who"><b>${esc(F.nombre)}</b><br>${esc(F.rol)}</p>
      <div class="links"><a href="https://www.linkedin.com/in/luiz-luzuriaga-izquierdo" target="_blank" rel="noopener">LinkedIn ↗</a>
        <a href="https://github.com/LuizLuzuriaga" target="_blank" rel="noopener">GitHub ↗</a>
        <a href="mailto:luzuriagaluiz@gmail.com">Email ↗</a></div>
      <h3>Trayectoria</h3>${F.trayectoria.map(([t, w, d]) => `<div class="tl"><b>${esc(t)}</b><span>${esc(w)}</span><div class="muted" style="font-size:13.5px">${esc(d)}</div></div>`).join('')}
      <h3>Proyectos</h3>${F.proyectos.map(([t, d, tags, url]) => `<div class="proj"><b>${esc(t)}</b><p>${esc(d)}</p>${tags.map(g => `<span class="tag">${esc(g)}</span>`).join('')}${url ? `<p><a style="color:#ffb454" href="${url}" target="_blank" rel="noopener">Abrir proyecto ↗</a></p>` : ''}</div>`).join('')}
      <h3>Herramientas</h3>${F.habilidades.map(([k, v]) => `<div class="skill"><span>${esc(k)}</span><span class="muted">${v}%</span></div><div class="bar"><i style="width:${v}%"></i></div>`).join('')}
      <p class="note">Los datos de mortalidad del juego son del INE (Tablas de mortalidad 2024).</p></div>`;
  }

  return { mortalidad, glm, chainLadder, poisson, ficha };
})();
