/* notif.js — las notificaciones del móvil: llegan solas, a la vista, con su sonido. Chelu, Mario, Amor, el trabajo, el banco, las noticias y las alertas.
   Lo que cuentan depende del escenario y del nivel de pista: cuanto peor va el día, más raras (y más serias) se vuelven. */
(() => {
  const Q = window.QX;
  const M = {
    Amor: ['Buenos días, bicho 💚 Hoy salgo tarde de la consulta. ¿Cenamos?', '¿Has dormido? Yo he soñado que me analizabas la póliza. Qué poco romántico.', 'Dice mi profesora que lo que huye de la rutina acaba huyendo de uno mismo. Yo solo quiero que llegues a tiempo.'],
    Chelu: ['¿Cañas esta tarde? Invito yo (mentira, invitas tú).', 'Tío, ¿tú sabes que Mario ha puesto el despertador a las 4? Ese hombre no es un actuario, es un reloj suizo con ansiedad.', 'Hoy me han dicho que mi trabajo es «estratégico». Traducción: no se sabe qué hago.'],
    Mario: ['¿Has revisado el triángulo? Hay un hueco en el 2023 que me mira mal.', 'Reunión a las 9:30. Puntualidad. «Cinco minutos antes» es llegar a tiempo; «a tiempo» es llegar tarde.'],
    Trabajo: ['Recordatorio: cierre de reservas el viernes. Sí, este viernes. Sí, también el tuyo.', 'Reunión adelantada a las 9:00. Se agradece puntualidad y buena cara.'],
    Banco: ['Cargo: 4,20 € · Cafetería. Saldo disponible: el que usted prefiera ignorar.', 'Su cuenta ha generado un interés de 0,00 €. Es un rendimiento muy estable.'],
    Noticias: ['Última hora: la prima de riesgo sube. Tu ánimo, también, pero en sentido contrario.', 'El IPC cierra en el 3,2 %. Tu café con tostada, en un 4. Hay modelos que lo explican; ninguno consuela.'],
    Alerta: ['Aviso a la población: se recomienda evitar aglomeraciones y mantener la calma. Madrid, 06:02.', 'Protección Civil: incidentes en el sur de la ciudad. Se pide no acercarse a personas con comportamiento agresivo.'],
    Noticias2: ['Fuentes oficiales hablan de «brote de causa desconocida». Las no oficiales hablan menos y corren más.', 'Se suspenden clases, consultas y todo lo que lleve lunes. Servicios mínimos en todo menos en los problemas.'],
    Amor2: ['No salgas de casa. En serio. Llámame ya.', 'Hay gente rara en mi portal. Si lees esto, dime algo, aunque sea un chiste malo.'],
    Chelu2: ['Tío, hay gente rara en Vallecas. ¿Sigues vivo? Contesta.', 'Si esto es el apocalipsis, quiero que conste que invité yo.']
  };
  const AV = { Amor: '💚', Amor2: '💚', Chelu: '🍺', Chelu2: '🍺', Mario: '📐', Trabajo: '💼', Banco: '🏦', Noticias: '📰', Noticias2: '📰', Alerta: '⚠️' };
  const NAME = { Amor2: 'Amor', Chelu2: 'Chelu', Noticias2: 'Noticias' };
  const used = new Set();
  let host = null, last = 0, next = 14000;

  const pool = (world, clue) => {
    const base = ['Amor', 'Chelu', 'Banco', 'Noticias'];
    if (world !== 'bed') base.push('Mario', 'Trabajo');
    if (world === 'cafe') return ['Amor', 'Mario', 'Chelu', 'Trabajo'];
    if (world === 'sol') return ['Amor', 'Banco', 'Trabajo'];
    if (clue >= 2) base.push('Alerta');
    if (clue >= 3) base.push('Noticias2', 'Chelu2');
    if (clue >= 4) base.push('Amor2');
    return base;
  };
  const show = (who, text) => {
    if (!host) { host = document.createElement('div'); host.id = 'notifs'; host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    const c = document.createElement('button'); c.type = 'button'; c.className = 'notif' + (/Alerta|Noticias2|Amor2|Chelu2/.test(who) ? ' urgent' : '');
    c.innerHTML = `<span class="n-av">${AV[who] || '📱'}</span><span class="n-b"><b>${NAME[who] || who}</b><i>${text.replace(/[<>&]/g, '')}</i></span>`;
    host.prepend(c); while (host.children.length > 3) host.lastChild.remove();
    const kill = () => { c.classList.add('out'); setTimeout(() => c.remove(), 350); };
    c.addEventListener('click', kill); setTimeout(kill, 7500);
    if (window.Sound && Sound.on && Sound.notify) Sound.notify();
  };
  Q.notify = show;

  const tick = () => {
    const H = Q.hooks; if (!H || !H.started()) return;
    const now = performance.now(); if (now - last < next || H.busy()) return;
    const world = H.world(), clue = H.clue(), p = pool(world, clue).filter((k) => !used.has(k + ':' + (M[k] || []).length));
    const cand = []; pool(world, clue).forEach((k) => (M[k] || []).forEach((t, i) => { if (!used.has(k + i)) cand.push([k, i, t]); }));
    if (!cand.length) return;
    // lo urgente tiene prioridad cuando el día se tuerce
    const urgent = cand.filter(([k]) => /Alerta|Noticias2|Amor2|Chelu2/.test(k)), sel = (clue >= 2 && urgent.length && Math.random() < 0.6) ? urgent : cand;
    const [k, i, t] = sel[Math.floor(Math.random() * sel.length)]; used.add(k + i); show(k, t);
    last = now; next = (clue >= 3 ? 11000 : 18000) + Math.random() * 9000;
  };
  setInterval(tick, 1500);
})();
