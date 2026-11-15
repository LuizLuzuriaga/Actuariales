/* minijuegos.js — los dos trabajos de tu mesa: Q.miniGLM() (tarificación con un modelo lineal generalizado) y Q.miniReservas() (triángulo de
   desarrollo y chain-ladder). Cada uno es una serie de pasos con respuesta inmediata y devuelve { score, max }. */
(() => {
  const Q = window.QX;
  let el = null;
  const fmt = (x, d = 3) => x.toFixed(d).replace('.', ',');
  const open = (html) => {
    if (document.pointerLockElement) document.exitPointerLock();
    if (!el) { el = document.createElement('div'); el.id = 'mini'; el.setAttribute('role', 'dialog'); document.body.appendChild(el); }
    el.innerHTML = '<div class="mcard">' + html + '</div>'; el.hidden = false; return el;
  };
  const close = () => { if (el) el.hidden = true; };
  const waitNext = (root) => new Promise((res) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'mnext'; b.textContent = 'Continuar  ▸'; root.querySelector('.mcard').appendChild(b);
    const done = () => { window.removeEventListener('keydown', onKey); res(); };
    const onKey = (e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); done(); } };
    window.addEventListener('keydown', onKey); b.addEventListener('click', done); b.focus();
  });
  /* pregunta con opciones: { t, ok, fb } */
  const pick = async (head, q, extra, opts) => {
    const root = open(`<small>${head}</small><h3>${q}</h3>${extra || ''}` + opts.map((o, i) => `<button type="button" class="mopt" data-i="${i}"><kbd>${i + 1}</kbd>${o.t}</button>`).join('') + '<p class="mfb" aria-live="polite"></p>');
    const i = await new Promise((res) => {
      const done = (k) => { window.removeEventListener('keydown', onKey); res(k); };
      const onKey = (e) => { const n = +e.key; if (n >= 1 && n <= opts.length) done(n - 1); };
      window.addEventListener('keydown', onKey); root.querySelectorAll('.mopt').forEach((b) => b.addEventListener('click', () => done(+b.dataset.i)));
    });
    root.querySelectorAll('.mopt').forEach((b, k) => { b.disabled = true; if (opts[k].ok) b.classList.add('ok'); else if (k === i) b.classList.add('no'); });
    root.querySelector('.mfb').textContent = (opts[i].ok ? '✔ ' : '✘ ') + opts[i].fb;
    if (window.Sound && Sound.on) opts[i].ok ? Sound.ok() : Sound.bad();
    await waitNext(root); return !!opts[i].ok;
  };
  /* deslizador: { min, max, step, val, show(x) -> html, good(x) -> bool, fb(ok) } */
  const slide = async (head, q, extra, c) => {
    const root = open(`<small>${head}</small><h3>${q}</h3>${extra || ''}<input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.val}" aria-label="valor"><div class="mlive"></div><button type="button" class="mnext" id="mok">Fijar este valor</button><p class="mfb" aria-live="polite"></p>`);
    const r = root.querySelector('input'), live = root.querySelector('.mlive'), upd = () => { live.innerHTML = c.show(+r.value); }; r.addEventListener('input', upd); upd(); r.focus();
    await new Promise((res) => root.querySelector('#mok').addEventListener('click', res));
    const ok = c.good(+r.value); r.disabled = true; root.querySelector('#mok').remove(); root.querySelector('.mfb').textContent = (ok ? '✔ ' : '✘ ') + c.fb(ok, +r.value);
    if (window.Sound && Sound.on) ok ? Sound.ok() : Sound.bad();
    await waitNext(root); return ok;
  };
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- 1) Tarificación: GLM ---------- */
  Q.miniGLM = async () => {
    const H = 'Tarificación · modelo lineal generalizado';
    const cartera = '<p>Cartera de auto: 50.000 pólizas-año. Siniestros por póliza-año: <b>0,09</b> en mayores de 25 y <b>0,14</b> en menores de 25. Coste medio por siniestro: asimétrico y siempre positivo.</p>';
    let s = 0;
    s += await pick(H, '¿Qué distribución usas para la <b>frecuencia</b> de siniestros?', cartera, shuffle([
      { t: 'Poisson, con la exposición como offset', ok: true, fb: 'Son conteos con distinta exposición: Poisson con offset log(exposición).' },
      { t: 'Normal', fb: 'La normal admite valores negativos y no respeta que un conteo es entero. Mala base para frecuencias.' },
      { t: 'Gamma', fb: 'La gamma es continua y positiva: sirve para importes, no para conteos.' }]));
    s += await pick(H, '¿Y para la <b>severidad</b> (coste medio por siniestro)?', cartera, shuffle([
      { t: 'Gamma', ok: true, fb: 'Positiva, asimétrica, y con la varianza proporcional al cuadrado de la media: es lo que hace el coste medio.' },
      { t: 'Poisson', fb: 'Poisson es para conteos. El coste es continuo.' },
      { t: 'Normal', fb: 'Admite costes negativos y no refleja la cola derecha larga.' }]));
    s += await pick(H, '¿Qué función de enlace eliges para que los factores de tarifa <b>se multipliquen</b>?', '', shuffle([
      { t: 'Logarítmica', ok: true, fb: 'Con enlace log, cada variable es un factor multiplicativo (relatividad) y la prima nunca sale negativa.' },
      { t: 'Identidad', fb: 'Con identidad los efectos se suman y una combinación de variables puede dar frecuencia negativa.' },
      { t: 'Inversa', fb: 'El enlace inverso es el canónico de la gamma, pero no da relatividades multiplicativas manejables en tarifa.' }]));
    const T = 0.14 / 0.09;
    s += await slide(H, 'Fija la <b>relatividad de los menores de 25</b> respecto a los mayores', cartera + '<p>La devianza baja a medida que te acercas al ajuste. Si no tocas nada, tarifas a todos igual.</p>', {
      min: 1.0, max: 2.5, step: 0.01, val: 1.0,
      show: (x) => { const dev = Math.min(100, (Math.abs(x - T) / 0.8) * 100); return `<p>Relatividad: <b>${fmt(x, 2)}</b> · Frecuencia que predices en menores de 25: <b>${fmt(0.09 * x, 3)}</b></p><div class="mbar" aria-hidden="true"><i style="width:${dev}%"></i></div><small>devianza relativa</small>`; },
      good: (x) => Math.abs(x - T) <= 0.07,
      fb: (ok, x) => ok ? `Relatividad ${fmt(x, 2)}: casi exacta (0,14 / 0,09 = ${fmt(T, 2)}).` : `La relatividad observada es 0,14 / 0,09 = ${fmt(T, 2)}. Con ${fmt(x, 2)} los jóvenes quedan mal tarificados.` });
    close(); return { score: s, max: 4 };
  };

  /* ---------- 2) Reservas: chain-ladder ---------- */
  Q.miniReservas = async () => {
    const H = 'Reservas · método chain-ladder';
    const tri = [[100, 150, 175, 180], [110, 168, 192, null], [120, 175, null, null], [130, null, null, null]];
    const tabla = '<table><tr><th></th><th>12m</th><th>24m</th><th>36m</th><th>48m</th></tr>' + tri.map((r, i) => `<tr><th>AY${i + 1}</th>` + r.map((v) => `<td>${v == null ? '·' : v}</td>`).join('') + '</tr>').join('') + '</table><p>Pagos acumulados por año de accidente (AY).</p>';
    const f = []; for (let k = 0; k < 3; k++) { let n = 0, d = 0; tri.forEach((r) => { if (r[k + 1] != null) { n += r[k + 1]; d += r[k]; } }); f.push(n / d); }
    const inv = f.map((x) => 1 / x);
    let s = 0;
    const lbl = ['12→24', '24→36', '36→48'];
    const wrong = [[fmt(493 / 460), 'Metiste en el denominador un año que aún no tiene dato siguiente.'], [fmt(1.9, 3), 'Eso no sale de los datos: multiplica por 12 meses o por la columna equivocada.'], [fmt(1.5, 3), 'Es solo la media del primer ratio aproximada, sin ponderar por volumen.']];
    for (let k = 0; k < 3; k++) {
      const bad = [{ t: fmt(inv[k]), fb: 'Lo has puesto del revés: el factor de desarrollo es (siguiente columna) / (actual), y es mayor que 1.' }, { t: k === 0 ? wrong[0][0] : k === 1 ? fmt(f[k] + 0.14) : fmt(f[k] + 0.07), fb: k === 0 ? wrong[0][1] : 'Se aleja del cociente de las sumas, que es lo que pidel factor ponderado.' }];
      s += await pick(H, `Factor de desarrollo <b>${lbl[k]}</b>`, tabla + '<p>Pondera por volumen: suma de la columna siguiente entre suma de la actual, solo con los años que tienen ambos datos.</p>', shuffle([{ t: fmt(f[k]), ok: true, fb: `Correcto: ${fmt(f[k])}.` }, ...bad]));
    }
    const lat = tri.map((r) => r.filter((v) => v != null).pop()), cum = [f[0] * f[1] * f[2], f[1] * f[2], f[2], 1], ult = [180, 192 * f[2], 175 * f[1] * f[2], 130 * f[0] * f[1] * f[2]], res = ult.reduce((a, b) => a + b, 0) - lat.reduce((a, b) => a + b, 0);
    const ayuda = '<table><tr><th></th><th>Último dato</th><th>Ultimate</th></tr>' + ult.map((u, i) => `<tr><th>AY${i + 1}</th><td>${lat[i]}</td><td>${fmt(u, 1)}</td></tr>`).join('') + '</table><p>Reserva = suma de ultimates − suma de pagos hasta hoy.</p>';
    s += await slide(H, '¿Qué <b>reserva total</b> constituyes?', ayuda, {
      min: 80, max: 220, step: 1, val: 100,
      show: (x) => `<p>Reserva que fijas: <b>${x}</b> · Ultimate total: <b>${fmt(ult.reduce((a, b) => a + b, 0), 1)}</b></p>`,
      good: (x) => Math.abs(x - res) <= 6,
      fb: (ok, x) => ok ? `Reserva ${x}: dentro del margen. Cálculo: ${fmt(ult.reduce((a, b) => a + b, 0), 1)} − ${lat.reduce((a, b) => a + b, 0)} = ${fmt(res, 1)}.` : `Salen ${fmt(res, 1)}: ${fmt(ult.reduce((a, b) => a + b, 0), 1)} de ultimate menos ${lat.reduce((a, b) => a + b, 0)} pagados. Con ${x} estás reservando de menos o de más.` });
    close(); return { score: s, max: 4 };
  };
})();
