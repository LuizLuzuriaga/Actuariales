/* story.js — el guion del día. Cada rama mala termina en un final con reinicio. */
(() => {
  const S = { snooze: 0, alarmOff: false, dressed: false, bag: false, slack: 0, worked: { pricing: false, reservas: false }, patience: 3 };
  const say = (l, o) => Engine.say(l, o);
  const think = (text) => ({ think: true, text });
  const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const openFicha = () => Engine.sheet(Games.ficha, { title: 'Ficha · saltar la historia', wide: true, closable: true });

  /* ---------------- 1. Dormitorio ---------------- */
  async function dormitorio() {
    const B = Art.bedroom();
    const salida = await Engine.explore({
      art: B.art, time: '05:45', place: 'Mi habitación', sound: 'room', pan: -0.2,
      alt: 'Dormitorio a oscuras, con la luz naranja de una farola entrando por la ventana y el móvil sonando en la mesilla.',
      intro: async () => {
        Sound.alarm(5);
        await say([
          '05:45. Fuera todavía es de noche. El despertador cree que es una buena hora para vivir.',
          think('Primera estimación del día: probabilidad de que el tren vaya vacío. Estimador puntual: cero. Intervalo de confianza: también cero.'),
        ]);
      },
      hotspots: [
        { id: 'movil', label: '⏰ Apagar el despertador', box: B.box.movil, run: async (api) => {
          S.alarmOff = true;
          await say('Silencio. Por fin una variable que controlas.');
          check(api);
        } },
        { id: 'cama', label: '🛏 Dormir 10 minutos más', box: B.box.cama, repeat: true, run: async (api) => {
          S.snooze++;
          const t = 345 + S.snooze * 10;
          Engine.setTime(hhmm(t));
          await say([
            'Diez minutos más. La cama es muy persuasiva y tú, poco resistente.',
            'Tu yo del futuro te odia con una intensidad estadísticamente significativa.',
            'Ya van treinta minutos de colchón. Cada minuto extra es otro cuerpo en el andén: lo vas a pagar en el tren.',
          ][Math.min(S.snooze, 3) - 1]);
          if (S.snooze >= 3) { api.enable('cama', false); }
        } },
        { id: 'ropa', label: '👔 Vestirte (camisa azul, pantalón gris)', box: B.box.ropa, run: async (api) => {
          S.dressed = true;
          await say('Camisa azul, pantalón gris oscuro, zapatos negros. El uniforme de quien no tiene uniforme.');
          check(api);
        } },
        { id: 'espejo', label: '🪞 Mirarte al espejo', box: B.box.espejo, run: async () => {
          await say('Pelo bien cortado, barba de semanas y ojeras de actuario junior. El espejo no miente: solo redondea hacia abajo.');
        } },
        { id: 'bolsos', label: '🎒 Cargar la mochila y el bolso', box: B.box.bolsos, run: async (api) => {
          S.bag = true;
          await say('Mochila negra, pesadísima: portátil, apuntes y ropa de gimnasio. Bolso marrón de los de hombre, con el tupper. Llevas media vida a cuestas, de forma literal.');
          check(api);
        } },
        { id: 'puerta', label: '🚪 Salir de casa', box: B.box.puerta, enabled: false, run: async () => ({ exit: 'salir' }) },
      ],
    });
    return salida;
    function check(api) { if (S.alarmOff && S.dressed && S.bag) api.enable('puerta', true); }
  }

  /* ---------------- 2. Andén ---------------- */
  async function anden() {
    const P = Art.platform();
    const t0 = 6 * 60 + 25 + S.snooze * 10;
    Engine.show({ art: P.art, time: hhmm(t0), place: 'Andén · cercanías', sound: 'platform', pan: 0,
      alt: 'Andén abarrotado de gente en hora punta.' });
    const train = document.getElementById('train');
    const l1 = document.getElementById('board-l1'), l2 = document.getElementById('board-l2');
    await say([
      'Andén de cercanías. Hora punta. Ochocientas personas esperan a un tren que aún no ha llegado y que, cuando llegue, ya irá lleno.',
      'Todos tienen la misma expresión: la de quien ya ha hecho el cálculo y no le sale.',
    ]);
    let pensado = false;
    for (let k = 1; k <= 4; k++) {
      Engine.setTime(hhmm(t0 + k * 6));
      l1.textContent = `C-3  TREN ${k}`; l2.textContent = k < 4 ? 'COMPLETO' : 'AÚN HAY HUECO*';
      Sound.whoosh(); train.classList.add('in');
      await Engine.wait(1900);
      await say([
        [
          'Llega el primero. Va hasta arriba: la gente se pega a los cristales como pegatinas. Dos personas se bajan con la dignidad intacta, y no cabe nadie más.',
          'Segundo tren. Mismo problema, distinta cara en la ventana. La ocupación del cercanías es una constante universal.',
          'Tercer tren. En los cristales, siluetas aplastadas. Alguien ha dejado el codo fuera. Tu mochila ocupa más superficie que tú.',
          'Cuarto tren. Se ve algo de hueco entre un abrigo y una axila. Es tu momento… o tu excusa.',
        ][k - 1],
      ]);
      const base = [0, 0.04, 0.10, 0.22][k - 1];
      const p = k < 4 ? Math.max(0.01, base - 0.012 * S.snooze) : 1;
      const accion = await Engine.choose([
        { id: 'empujar', label: 'Empujar y meterte como puedas', hint: k < 4 ? `Probabilidad de subir ≈ ${(p * 100).toFixed(0)} %` : 'Probabilidad de subir ≈ 100 % (es el último que te sirve)' },
        { id: 'pasar', label: k < 4 ? 'Dejar pasar este tren' : 'Dejar pasar también este y ver qué pasa', hint: k < 4 ? 'Sin riesgo. Con culpa.' : 'Si pierdes este, hoy no llegas a trabajar.' },
      ], `Tren ${k}. ¿Qué haces?`);
      if (accion === 'empujar' && Math.random() < p) {
        Sound.ok();
        await say(k === 1 ? ['¡Has subido a la primera! Era un suceso del 4 %. Hoy has gastado toda la suerte de la semana.'] : ['Entras en el hueco imposible. Las puertas se cierran detrás de tu mochila. Estás dentro.']);
        return;
      }
      if (accion === 'empujar' && k === 4) { /* nunca llega: p = 1 */ }
      if (accion === 'pasar' && k === 4) {
        train.classList.add('out'); Sound.whoosh();
        await Engine.wait(1800);
        return Promise.reject({ ending: 'cervezas' });
      }
      if (accion === 'empujar') {
        Sound.bad();
        await say('Empujas. El tren, no. Un señor con maletín te devuelve a tu sitio con una ligera presión del hombro. Educado, pero firme.');
      } else {
        await say(['Lo dejas pasar. Rezas por una cosa: que el siguiente venga con un poco menos de gente.', 'Spoiler: no. Pero uno siempre reza.', 'Lo dejas pasar. Ya vas por tres. La esperanza de vida de tu paciencia es de unos cuatro minutos.'][Math.min(k, 3) - 1]);
      }
      if (k === 2 && !pensado) {
        pensado = true;
        await say([
          think('Dos trenes seguidos y la misma imagen: el andén lleno de gente de entre 40 y 50 años, pegada a las puertas.'),
          think('¿Por qué la curva de mortalidad no se mueve hacia ahí? Si lo hiciera, este andén sería una tabla de vida.'),
        ]);
        await Engine.sheet(Games.mortalidad, { title: 'Pensamiento · La curva de mortalidad', wide: true });
      }
      train.classList.remove('in'); train.classList.add('out'); Sound.whoosh();
      await Engine.wait(2200);
      train.classList.remove('out'); void train.offsetWidth;
    }
  }

  /* ---------------- 3. Dentro del tren ---------------- */
  async function trenIda() {
    const T = Art.train();
    await Engine.explore({
      art: T.art, time: '07:20', place: 'Cercanías · hacia Nuevos Ministerios', sound: 'train', pan: 0,
      alt: 'Interior del tren abarrotado, visto en primera persona, con el móvil en la mano.',
      intro: async () => { Sound.doors(); await say(['Dentro. «Aplastado» es un verbo suave para esto. Respiras en tandas, por turnos con tu vecino.']); },
      hotspots: [
        { id: 'movil', label: '📱 Sacar el móvil: leer tu currículum', box: T.box.movil, repeat: true, run: async () => {
          await say('Es lo único que puedes sostener sin tocar a nadie. Así que repasas tu propio currículum, como quien relee su propio horóscopo.');
          await openFicha();
        } },
        { id: 'ventana', label: '🪟 Mirar por la ventana', box: T.box.ventana, run: async () => { await say('Madrid pasa en rayas de luz. En las vías, la «velocidad media» y la «velocidad percibida» son dos variables incompatibles.'); } },
        { id: 'vecino', label: '👃 Notar a tu vecino', box: T.box.vecino, run: async () => { await say('El pelo de tu vecino está a dos centímetros de tu cara. No sabes su nombre, pero conoces su champú. Ya hay más intimidad en este vagón que en tu último comité.'); } },
        { id: 'puertas', label: '🚉 Esperar a Nuevos Ministerios', box: T.box.puertas, run: async () => ({ exit: 'bajar' }) },
      ],
    });
  }

  /* ---------------- 4. Azca ---------------- */
  async function azca() {
    const A = Art.azca();
    await Engine.explore({
      art: A.art, time: '07:55', place: 'Azca · el centro financiero', sound: 'street', pan: -0.5,
      alt: 'Plaza rodeada de torres de oficinas al amanecer.',
      intro: async () => {
        Sound.doors();
        await say([
          'Nuevos Ministerios. Sales del tren como quien sale de una lavadora: arrugado y con prisa.',
          'Azca: torres de cristal con empresas grandes dentro. Hay mucho dinero en un radio de cien metros, y ninguno en tu cuenta.',
          'Tu edificio es el de la entrada iluminada: una aseguradora. No diré cuál ni dibujaré su logo. Planta 4.',
        ]);
      },
      hotspots: [
        { id: 'torres', label: '🏙 Mirar las torres', box: A.box.torres, run: async () => { await say('Cuarenta plantas de hojas de cálculo apiladas. Cada ventana encendida es alguien reconciliando algo que no cuadra.'); } },
        { id: 'cafe', label: '☕ El quiosco de café', box: A.box.cafe, run: async () => { await say('Dos euros cuarenta. Arriba hay uno gratis que sabe a deber algo. Tu relación con el dinero es profundamente actuarial.'); } },
        { id: 'banco', label: '🪑 Sentarte un segundo', box: A.box.banco, run: async () => { await say('Un minuto sentado. Reservas de energía: 14 %. No se computan intereses sobre ellas.'); } },
        { id: 'entrada', label: '🏢 Entrar en la aseguradora', box: A.box.entrada, run: async () => ({ exit: 'entrar' }) },
      ],
    });
  }

  /* ---------------- 5. Oficina ---------------- */
  async function oficina() {
    const O = Art.office();
    await Engine.explore({
      art: O.art, time: '08:40', place: 'Planta 4 · mi mesa', sound: 'office', pan: 0,
      alt: 'Mesa de oficina vista en primera persona con dos monitores.',
      intro: async () => {
        await say([
          'Planta 4. Te sientas. Te vas a quedar sentado ocho horas.',
          'En una pantalla, el software de pricing. En la otra, la hoja de reservas y una carga en Fabric al 97 % desde el lunes. El código en SAS aguanta con la paciencia de una piedra.',
          think('Dos tareas: ajustar el modelo y cerrar las reservas. Y una tentación que vibra en la esquina de la mesa.'),
        ]);
      },
      hotspots: [
        { id: 'pricing', label: '📈 Pricing: ajustar el GLM a mano', box: O.box.pricing, run: async (api) => {
          await Engine.sheet(Games.glm, { title: 'Pricing · Frecuencia por edad', wide: true });
          S.worked.pricing = true; Engine.setTime('10:05'); await after(api);
        } },
        { id: 'reservas', label: '🧮 Reservas: chain-ladder', box: O.box.reservas, run: async (api) => {
          await Engine.sheet(Games.chainLadder, { title: 'Reservas · Triángulo de siniestros', wide: true });
          S.worked.reservas = true; Engine.setTime('11:10'); await after(api);
        } },
        { id: 'movil', label: '📱 Mirar el móvil (no trabajar)', box: O.box.movil, repeat: true, run: async () => {
          S.slack++;
          if (S.slack === 1) { await say('Cinco minutos de vídeos de gente que cocina. De pronto, una sombra detrás de ti. Cambias de pestaña a velocidad de Fórmula 1. Esta vez cuela.'); return; }
          return Promise.reject({ ending: 'despedido' });
        } },
        { id: 'cafe', label: '☕ Bajar a por un café', box: O.box.cafe, enabled: false, run: async () => ({ exit: 'cafe' }) },
      ],
    });
    async function after(api) {
      if (S.worked.pricing && S.worked.reservas) {
        api.enable('cafe', true);
        await say('Pricing y reservas cerrados. Son las 11:10. Solo hay un motivo para levantarse: el café de las once.');
      }
    }
  }

  /* ---------------- 6. Café ---------------- */
  async function cafe() {
    const C = Art.cafe();
    Engine.show({ art: C.art, time: '11:20', place: 'Cocina de la planta 4', sound: 'cafe', pan: 0, alt: 'Tres compañeros de pie junto a la máquina de café.' });
    await say([
      'La máquina de café, tres compañeros y tú. Gente a la que apenas conoces y que te va a contar su vida resuelta.',
      'Casas, coches, viajes, cuñados con tercera vivienda. La única variable que no te cuentan es lo que cuesta todo eso.',
    ]);
    await say([think('Mientras hablan, tu cabeza hace lo único útil: modelizar. ¿Con qué probabilidad llega la próxima tontería extraordinaria?')]);
    await Engine.sheet(Games.poisson, { title: 'Pensamiento · La próxima tontería' });
    S.patience = 3;
    const rondas = [
      { who: 'Compañero del SUV', text: '«Me he comprado el SUV nuevo, ¿sabes? A 96 cuotas. Una ganga.»',
        ok: '«¡Qué barbaridad, enhorabuena!»', neutral: '«Mmh.»', bad: '«A 96 meses, el interés implícito se come el ahorro. Es una pérdida esperada.»' },
      { who: 'Compañera de las escapadas', text: '«Este finde, escapada: mi cuñado se ha comprado la tercera casa y nos invita.»',
        ok: '«Qué bien. Que me lo cuentes con fotos, ¿eh?»', neutral: '«Ajá.»', bad: '«Tres casas en un solo suelo: eso es concentración de riesgo inmobiliario.»' },
      { who: 'Compañero del tupper', text: '«¿Y tú qué haces el finde? Dime que algo normal.»',
        ok: '«Gimnasio, estudiar y el tren. Una vida de película: de las malas.»', neutral: '«Lo de siempre.»', bad: '«Os escucho desde hace diez minutos y no he aprendido nada. Cuenta como muestra pequeña.»' },
    ];
    for (const r of rondas) {
      await say({ who: r.who, text: r.text });
      const orden = [['ok', r.ok], ['neutral', r.neutral], ['bad', r.bad]].sort(() => Math.random() - 0.5);
      const e = await Engine.choose(orden.map(([id, label]) => ({ id, label })), `Paciencia: ${'●'.repeat(S.patience)}${'○'.repeat(3 - S.patience)}`);
      if (e === 'bad') return Promise.reject({ ending: 'cafe_solo', variante: 'bad' });
      if (e === 'neutral') {
        S.patience--; Sound.bad();
        if (S.patience <= 0) return Promise.reject({ ending: 'cafe_solo', variante: 'aburrimiento' });
        await say('Se nota que no estás. Ellos siguen: la historia continúa, como los intereses compuestos.');
      } else { Sound.ok(); await say('Se ríen. O te toleran. Difícil de distinguir con una muestra tan pequeña.'); }
    }
  }

  /* ---------------- Finales ---------------- */
  const FINALES = {
    cervezas: ['Cervezas con Chelu', 'Dejas pasar el cuarto tren. Miras el panel, miras el móvil y Chelu —alto, perilla y bigote ya crecidos, pelo castaño— escribe: «¿Cañas?». La probabilidad de decir que no era del 0,3 %. Esperanza de vida laboral: cero días. Esperanza de vida social: al alza.'],
    despedido: ['Despedido por inactividad', 'Tu jefe te encuentra mirando el móvil por segunda vez. Te explica con mucha calma cómo se calcula la esperanza de vida laboral de quien no trabaja: rápido. Recoges tus cosas en una caja con un solo bolígrafo. Era de otro.'],
    cafe_solo: ['Café para uno', null],
    continuara: ['Mañana superada', 'Tren, hojas de cálculo y café con ruido de fondo. Has sobrevivido a la mañana y tus estimaciones del día siguen siendo exactamente las mismas. Aún quedan las clases de conducir, el gimnasio, la profe de Previsión Social, la vuelta y la cama. Esta es solo una versión de prueba.'],
  };

  async function run() {
    try {
      await dormitorio();
      await anden();
      await trenIda();
      await azca();
      await oficina();
      await cafe();
      Engine.end('continuara', FINALES.continuara[0], FINALES.continuara[1], Art.endingArt('continuara'));
    } catch (e) {
      if (e && e.ending) {
        const f = FINALES[e.ending];
        const txt = e.ending === 'cafe_solo'
          ? (e.variante === 'bad'
            ? 'Los compañeros se miran, recogen sus tazas y se van con la dignidad herida. Te quedas solo con tu café y tu intervalo de confianza. La probabilidad de que mañana te inviten era alta; acaba de condicionarse.'
            : 'Se cansan de hablar con una pared y se van, uno a uno, a buscar una conversación con algo más de varianza. Te quedas solo. El café, por lo menos, no pregunta.')
          : f[1];
        Sound.bad();
        Engine.end(e.ending, f[0], txt, Art.endingArt(e.ending));
      } else { console.error(e); throw e; }
    }
  }

  /* ---------------- Arranque ---------------- */
  const title = document.getElementById('title');
  function start() {
    title.style.display = 'none';
    document.getElementById('scene').classList.remove('hide');
    Engine.fit();
    run();
  }
  document.getElementById('go').addEventListener('click', start);
  document.getElementById('ficha-title').addEventListener('click', openFicha);
  document.getElementById('ficha-hud').addEventListener('click', openFicha);
  Engine.init();
  if (location.hash === '#start') { history.replaceState(null, '', location.pathname); start(); }
})();
