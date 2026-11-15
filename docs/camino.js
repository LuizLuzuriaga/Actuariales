/* camino.js — el trayecto a pie por las calles de Vallecas hasta la estación. Una pantalla de transición corta (unos 15 s, saltable con Espacio o clic):
   un cartel con la ruta y comentarios que mezclan estadística, economía, psicología y filosofía; cuanto más nivel de pista, más cosas raras por la calle. */
(() => {
  const Q = window.QX;
  const BASE = [
    'Calle de la Albufera, 06:05. A esta hora la demanda de café es perfectamente inelástica: nadie pregunta el precio, solo el tamaño.',
    'Un hombre pasea a su perro; el perro pasea al hombre. Equilibrio de Nash: nadie cede la acera.',
    'Tu novia diría que caminas deprisa para no oír tus pensamientos. Tú dirías que es cardio. Los dos tenéis sesgo de confirmación.',
    'Nueve viandantes. Muestra diminuta, perfecta para sacar conclusiones, como en toda red social que se precie.',
    'Camus pedía imaginar a Sísifo feliz. Sísifo no pagaba abono transporte.',
    'Riesgo de morir esta mañana, por persona: 0,00002 %. Riesgo de llegar tarde: 38 %. El ser humano es muy de ordenar mal sus miedos.',
    'El café con tostada ha subido un 4 %. Tu sueldo, un 0 %. La correlación es espuria; la causalidad, el jefe.',
    'Freud explicaría por qué cruzas en rojo. Tu novia lo explicaría mejor, aunque te cobraría por sesión.'];
  const WEIRD = [
    [],
    ['Una persiana cerrada a golpes. Desde dentro. Habrá sido el viento. Dentro de la casa.', 'Pasa una ambulancia sin sirena. Es lo único en Madrid que llega rápido y nadie quiere ver llegar.'],
    ['Un coche con las llaves puestas y la puerta abierta, en Vallecas. O es un milagro o es una señal; las dos son mal diagnóstico.', 'Una señora arrastra los pies, sin prisa. Primera persona sin prisa a las seis de la mañana: valor atípico, mírala con cariño.'],
    ['Pintada en un muro: «NO SALGAS». Debajo, más pequeña: «ya». Heterocedasticidad textual.', 'Lejos, junto a un contenedor, alguien muerde a alguien. Tu cerebro lo archiva como «conducta social madrileña».'],
    ['Las calles están llenas de gente que camina torcida. No hay un solo repartidor con prisa. Eso es lo más grave que has visto en Madrid.', 'Humo sobre Vallecas. En el aire, un olor dulce y raro: como a ansiedad bien cocinada.']];
  const FIN = 'Estación de Entrevías. Los tornos están abiertos. Eso no pasa nunca. Sigue siendo lunes.';

  Q.caminoVallecas = (level = 0) => new Promise((resolve) => {
    const lines = [BASE[0], BASE[1]];
    if (level >= 1) lines.push(WEIRD[Math.min(level, 4)][0] || WEIRD[1][0]);
    lines.push(BASE[2 + (level % 3)]);
    if (level >= 2) lines.push(WEIRD[Math.min(level, 4)][1] || WEIRD[2][1]);
    lines.push(BASE[5 - (level > 2 ? 0 : 0)]); lines.push(FIN);
    const el = document.createElement('div'); el.id = 'camino'; el.setAttribute('role', 'dialog');
    el.innerHTML = '<div class="cm-top"><small>Hacia la estación · a pie</small><h2>Calles de Vallecas</h2></div><div class="cm-bar"><i></i><span class="cm-dot"></span></div><p class="cm-txt" aria-live="polite"></p><button type="button" class="cm-skip">Saltar ▸</button>';
    document.body.appendChild(el);
    const txt = el.querySelector('.cm-txt'), bar = el.querySelector('.cm-bar i'), dot = el.querySelector('.cm-dot');
    let i = 0, timer = 0, done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); window.removeEventListener('keydown', onKey); el.classList.add('out'); setTimeout(() => { el.remove(); resolve(); }, 450); };
    const show = () => {
      if (i >= lines.length) { finish(); return; }
      txt.classList.remove('in'); void txt.offsetWidth; txt.textContent = lines[i]; txt.classList.add('in');
      const p = (i + 1) / lines.length; bar.style.width = (p * 100) + '%'; dot.style.left = (p * 100) + '%';
      if (window.Sound && Sound.on) { if (i === 2 && level >= 1) Sound.siren(3); if (i === 4 && level >= 3) Sound.shout(0.05); }
      i++; timer = setTimeout(show, Math.min(4200, 1700 + lines[i - 1].length * 28));
    };
    const onKey = (e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); show(); } };
    window.addEventListener('keydown', onKey); el.addEventListener('click', () => { clearTimeout(timer); show(); }); el.querySelector('.cm-skip').addEventListener('click', (e) => { e.stopPropagation(); finish(); });
    show();
  });
})();

/* Pantalla de carga genérica: título, subtítulo y líneas que se suceden (saltable con Espacio o clic). */
(() => {
  const Q = window.QX;
  Q.pantallaCarga = (titulo, sub, lineas, porLinea = 2300) => new Promise((resolve) => {
    const el = document.createElement('div'); el.id = 'camino'; el.setAttribute('role', 'dialog');
    el.innerHTML = '<div class="cm-top"><small></small><h2></h2></div><div class="cm-bar"><i></i><span class="cm-dot"></span></div><p class="cm-txt" aria-live="polite"></p><button type="button" class="cm-skip">Saltar ▸</button>';
    el.querySelector('small').textContent = sub; el.querySelector('h2').textContent = titulo; document.body.appendChild(el);
    const txt = el.querySelector('.cm-txt'), bar = el.querySelector('.cm-bar i'), dot = el.querySelector('.cm-dot'); let i = 0, timer = 0, done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); window.removeEventListener('keydown', onKey); el.classList.add('out'); setTimeout(() => { el.remove(); resolve(); }, 450); };
    const show = () => { if (i >= lineas.length) { finish(); return; } txt.classList.remove('in'); void txt.offsetWidth; txt.textContent = lineas[i]; txt.classList.add('in'); const p = (i + 1) / lineas.length; bar.style.width = (p * 100) + '%'; dot.style.left = (p * 100) + '%'; i++; timer = setTimeout(show, Math.min(4000, porLinea + lineas[i - 1].length * 12)); };
    const onKey = (e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); show(); } };
    window.addEventListener('keydown', onKey); el.addEventListener('click', () => { clearTimeout(timer); show(); }); el.querySelector('.cm-skip').addEventListener('click', (e) => { e.stopPropagation(); finish(); }); show();
  });
})();
