/* notif.js — las notificaciones del móvil: llegan solas, a la vista, con su sonido. El Grandullón, el Sheldon, Amor, el trabajo, el banco, las noticias y las alertas.
   Lo que cuentan depende del escenario y del nivel de pista: cuanto peor val día, más raras (y más serias) se vuelven. */
(() => {
  const Q = window.QX;
  const M = {
    Amor: ['Buenos días, bicho 💚 Hoy salgo tarde de la consulta. ¿Cenamos?', '¿Has dormido? Yo he soñado que me analizabas la póliza. Qué poco romántico.', 'Dice mi profesora que lo que huye de la rutina acaba huyendo de uno mismo. Yo solo quiero que llegues a tiempo.', '¿Sabes cuál es el principal factor de riesgo de una pareja? Que uno de los dos sea actuario. Te quiero igual.','He leído que el 90 % de las discusiones son por no haber dormido. El otro 10 %, por el termostato.','Mi supervisor dice que el humor es un mecanismo de defensa. El tuyo, además, es un mecanismo de ataque.', 'El 70 % de lo que llamas intuición es sesgo de disponibilidad con buena prensa. Te lo digo con cariño y con un manual de psicología cognitiva.','Hoy en consulta: un paciente cree que la regresión a la media es un trastorno. Le he dicho que es una terapia.','Disonancia cognitiva: sabes que deberías madrugar y sigues aplazando alarmas. Tranquilo, es tu cerebro defendiendo su postura.','Efecto Dunning-Kruger: tú, ayer, explicándome el modelo de reservas. Con amor.'],
    Chelu: ['¿Cañas esta tarde? Invito yo (mentira, invitas tú).', 'Tío, ¿tú sabes que el Sheldon ha puesto el despertador a las 4? Ese hombre no es un actuario, es un reloj suizo con ansiedad.', 'Hoy me han dicho que mi trabajo es «estratégico». Traducción: no se sabe qué hago.', 'Acabo de descubrir que mi cuñado tiene un máster en «finanzas conductuales». Ha comprado criptomonedas por ansiedad.','Si la vida fuera un seguro, mi franquicia serían cañas.','Regla de Chelu: todo problema se trata con tres cañas; la cuarta es un bien inferior.','Me han dicho que tengo «potencial». En mi empresa, potencial = no te hemos subido el sueldo.', 'He leído que las criptomonedas son «activos de alta volatilidad». Yo digo que son un casino con prólogo en inglés.','Mi estrategia de inversión es diversificar: cerveza rubia, negra y de trigo.','Teorema del Grandullón: si hay barra y hay caña, la probabilidad de que me quede es 1.','He entrenado una red neuronal para predecir cuándo pagas tú. Devuelve siempre NaN.','Mi gato ha hecho overfitting: solo reconoce al repartidor.'],
    Sheldon: ['¿Has revisado el triángulo? Hay un hueco en el 2023 que me mira mal.', 'Reunión a las 9:30. Puntualidad. «Cinco minutos antes» es llegar a tiempo; «a tiempo» es llegar tarde.', 'Recordatorio: el intervalo de confianza no es la probabilidad de que el parámetro esté dentro. Lo digo con cariño y cero margen de error.','He recalculado el triángulo seis veces. Salen seis resultados distintos. Sospecho de mi calculadora y de la existencia.','Hay un hueco en la reserva del 2021 que me mira con ojos de provisión insuficiente.', 'Pregunta retórica: ¿sabías que una variable aleatoria no tiene sentido del humor, solo esperanza y varianza?','He demostrado por inducción que los lunes son infinitos. Caso base: hoy.','Tu modelo tiene un R² de 0,97. Sospecho de ti, no del modelo.','Dato: la probabilidad de que un teorema te sirva en la vida real es del 0,3 %. No te rindas, estudia.'],
    Trabajo: ['Recordatorio: cierre de reservas el viernes. Sí, este viernes. Sí, también el tuyo.', 'Reunión adelantada a las 9:00. Se agradece puntualidad y buena cara.', 'Nueva política: se recomienda sonreír en las reuniones. Sonreír no es obligatorio; no sonreír, tampoco.','Recordatorio: el café de la planta 4 no es gratis. Lo que no se cobra es la culpa.','Se ha reservado la sala «Backrooms 1» para las 10:00. Nadie sabe dónde está, ni quién entró la última vez.', 'Se convoca una reunión para analizar el KPI de la reunión anterior.','Dashboard actualizado. Nadie lo mira, pero está muy actualizado.','Nueva iniciativa de innovación: llamar «sinergias» a lo que antes eran lunes.', 'Huelga de transporte: servicios mínimos del 100 % para quienes no necesitan transporte.','Debate de la reunión: dos horas, cero preguntas respondidas y un acuerdo para volver a reunirse.'],
    Banco: ['Cargo: 4,20 € · Cafetería. Saldo disponible: el que usted prefiera ignorar.', 'Su cuenta ha generado un interés de 0,00 €. Es un rendimiento muy estable.', 'Su cuenta ha recibido la visita de un euro. Se ha marchado enseguida.','Le informamos de que su tipo de interés es tan bajo que ya cuenta como pensamiento intrusivo.', 'Recordatorio: la inflación es un impuesto que no vota nadie. Su cuenta sufre en silencio.','Su inversión ha alcanzado la media histórica: la de la inflación.', 'El alquiler sube otro 8 %. Tu sueldo se mantiene firme, como un monumento a la estabilidad.','Le informamos de que su hipoteca ha cumplido la mayoría de edad y sigue sin independizarse.'],
    Noticias: ['Última hora: la prima de riesgo sube. Tu ánimo, también, pero en sentido contrario.', 'El IPC cierra en el 3,2 %. Tu café con tostada, en un 4. Hay modelos que lo explican; ninguno consuela.', 'Según un estudio, el 73 % de los estudios no se leen enteros. Este tampoco.','Un economista predice la recesión por décima vez consecutiva. Por fin acierta, con un margen de nueve años.','Los expertos aconsejan dormir ocho horas. Los expertos no cogen el cercanías.', 'Un estudio demuestra que el 80 % de los estudios usa «p < 0,05» como pase VIP.','Los economistas debaten si estamos en recesión. Los demás ya tenemos alquiler.','Un algoritmo de inteligencia artificial predice con precisión el pasado. Trabaja aún en el futuro.', 'El Congreso aprueba crear una comisión para estudiar por qué hacen falta tantas comisiones.','Las encuestas dan un empate técnico entre «no sabe» y «no contesta», con una fuerte irrupción de «ya veremos».','Promesa electoral: bajar los precios. Letra pequeña: los de los carteles.','Hacienda te devuelve catorce euros. Con intereses, ninguno; con trámites, nueve.','El IVA del pan baja un punto. El del café con leche, por motivos técnicos, sigue su camino al infinito.','Se aprueba una ley para simplificar trámites. Para recogerla hacen falta cuatro trámites y una cita previa.','Un ministro asegura que la economía va «como un cohete». No aclara si el cohete va de ida o de vuelta.'],
    Mate: ['Mates y vinos: «¿Alguien sabe por qué mi matriz no es invertible?» —Porque tú tampoco lo eres.', 'Mates y vinos: se ha demostrado que 0,999… = 1. El grupo se ha partido en dos.', 'Mates y vinos: «¿Y si el p-valor fuera 0,051?» Silencio sepulcral.', 'Mates y vinos: acabo de ajustar un modelo bayesiano a mi vida. La a priori era mala.', 'Mates y vinos: el gradiente descendente es como yo yendo a trabajar: siempre cuesta abajo y siempre llego a un mínimo local.', 'Cómo funciona el mando del móvil: tu móvil te manda al ordenador, unas treinta veces por segundo, hacia dónde empujas los joysticks. Más datos que un cercanías lleno, y bastante más puntuales.','El QR de la portada guarda una dirección con el nombre de una sala. Con ella, tu móvil y este PC se encuentran y se hablan directamente (WebRTC).','Un QR tiene corrección de errores: aunque se ensucie un 15 %, se sigue leyendo. Ojalá lo tuvieran las reservas.','Mates y vinos: el QR se dibuja con módulos de 21×21 como mínimo. Es una matriz binaria con más disciplina que cualquier hoja de cálculo.'],
    Tiempo: ['Hoy: 14 °C, nublado y probabilidad de existencialismo del 60 %.', 'Se esperan lluvias de ideas, sin mayor trascendencia, y un frente de «ya lo haré mañana».', 'Sensación térmica: la de quien llega tarde. Humedad: la de las excusas.'],
    Salud: ['Has caminado 312 pasos. Los suficientes para huir de un problema, no para resolverlo.', 'Tu frecuencia cardiaca está en 112. O estás corriendo, o has abierto el correo del trabajo.', 'Has dormido 4 h 12 min. Tu cuerpo te escribe: «tenemos que hablar».'],
    Grupo: ['Actuarios sin fronteras: ¿alguien tiene un triángulo que le sobre? Es para un amigo.', 'Actuarios sin fronteras: se ha eliminado un mensaje. Se recomienda eliminar también la reunión de las 9.', 'Actuarios sin fronteras: «¿Poisson o binomial negativa?» Ya van 47 mensajes y nadie ha llegado a casa.'],
    Alerta: ['Aviso a la población: se recomienda evitar aglomeraciones y mantener la calma. Madrid, 06:02.', 'Protección Civil: incidentes en el sur de la ciudad. Se pide no acercarse a personas con comportamiento agresivo.', 'Aviso: las palomas han dejado de volar. Se desconoce el motivo. Se les ha preguntado.','Protección Civil recuerda: si ve a una persona con aspecto de lunes sin café, no se acerque.'],
    Noticias2: ['Fuentes oficiales hablan de «brote de causa desconocida». Las no oficiales hablan menos y corren más.', 'Se suspenden clases, consultas y todo lo que lleve lunes. Servicios mínimos en todo menos en los problemas.'],
    Amor2: ['No salgas de casa. En serio. Llámame ya.', 'Hay gente rara en mi portal. Si lees esto, dime algo, aunque sea un chiste malo.'],
    Chelu2: ['Tío, hay gente rara en Vallecas. ¿Sigues vivo? Contesta.', 'Si esto es el apocalipsis, quiero que conste que invité yo.']
  };
  const AV = { Amor: '💚', Amor2: '💚', Chelu: '🍺', Chelu2: '🍺', Sheldon: '📐', Trabajo: '💼', Banco: '🏦', Noticias: '📰', Mate: '🧮', Tiempo: '⛅', Salud: '🩺', Grupo: '👥', Noticias2: '📰', Alerta: '⚠️' };
  const NAME = { Amor2: 'Amor', Chelu: 'El Grandullón', Chelu2: 'El Grandullón', Sheldon: 'El Sheldon', Noticias2: 'Noticias', Mate: 'Mates y vinos', Tiempo: 'App del tiempo', Salud: 'App de salud', Grupo: 'Actuarios sin fronteras' };
  const used = new Set();
  let host = null, last = 0, next = 14000;

  const pool = (world, clue) => {
    const base = ['Amor', 'Chelu', 'Banco', 'Noticias', 'Tiempo', 'Salud', 'Grupo', 'Mate'];
    if (world !== 'bed') base.push('Sheldon', 'Trabajo');
    if (world === 'cafe') return ['Amor', 'Sheldon', 'Chelu', 'Trabajo'];
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
    last = now; next = (clue >= 3 ? 9000 : 14000) + Math.random() * 8000;
  };

  /* ---------- boletín de última hora: una franja arriba con titulares que van empeorando según el nivel de pistas ---------- */
  const NEWS = [
    ['La Bolsa abre plana: los inversores esperan una señal. Y un café.', 'Un modelo de aprendizaje automático predice lluvia. Falla como siempre: con mucha confianza.', 'Última hora: la prima de riesgo sube dos puntos. Tu ánimo, también.', 'Cercanías: retrasos leves en la línea C-2 por «incidencias en la vía».', 'Meteorología: amanecer despejado y temperatura en descenso.'],
    ['Un economista asegura que el desempleo baja «en términos estructurales». En los coloquiales, no.', 'Sucesos: dos heridos en una pelea en Vallecas. Testigos hablan de «mordiscos».', 'Sanidad pide no acudir a Urgencias salvo gravedad: tres hospitales saturados.', 'Aumentan las llamadas al 112 por «personas desorientadas» en la vía pública.'],
    ['Brote de causa desconocida en el sur de Madrid. Se recomienda evitar aglomeraciones.', 'Servicios mínimos en el transporte por ausencias masivas. Las ausencias no dan explicaciones.', 'Interior aconseja no abrir la puerta a desconocidos con comportamiento agresivo.'],
    ['Aislados varios barrios del sureste. Se pide permanecer en casa.', 'Vídeos virales muestran personas atacando a viandantes. Fuentes oficiales lo niegan con vehemencia.', 'Se aconseja no acercarse a quien tenga la mirada fija y la mandíbula en movimiento.'],
    ['ALERTA MÁXIMA: evacuación del sur de Madrid. No intente llegar a su puesto de trabajo.', 'La Bolsa suspende la cotización. Los actuarios, por primera vez, aciertan: la cola era muy larga.', 'Mensaje oficial: mantenga la calma. Si lo muerden, avise a su aseguradora.']];
  let tkEl = null, tkLast = 0, tkN = 0;
  const ticker = () => {
    const H = Q.hooks; if (!H || !H.started() || document.getElementById('apocframe') || document.getElementById('end')) { if (tkEl) tkEl.hidden = true; return; }
    const now = performance.now(); if (now - tkLast < 24000) return;
    const w = H.world(); if (w === 'sol' || w === 'cafe') { /* aquí ya se vive */ }
    const lvl = Math.min(4, H.clue()), pool = NEWS[lvl], txt = pool[tkN++ % pool.length]; tkLast = now;
    if (!tkEl) { tkEl = document.createElement('div'); tkEl.id = 'ticker'; tkEl.setAttribute('aria-live', 'polite'); document.body.appendChild(tkEl); }
    tkEl.className = lvl >= 3 ? 'hot' : lvl >= 2 ? 'warn' : ''; tkEl.innerHTML = '<b>' + (lvl >= 3 ? 'ALERTA' : 'ÚLTIMA HORA') + '</b><span></span>'; tkEl.lastChild.textContent = txt; tkEl.hidden = false;
    tkEl.classList.remove('show'); void tkEl.offsetWidth; tkEl.classList.add('show'); setTimeout(() => { if (tkEl) tkEl.classList.remove('show'); }, 9000);
  };
  setInterval(ticker, 2000);
  setInterval(tick, 1500);
})();
