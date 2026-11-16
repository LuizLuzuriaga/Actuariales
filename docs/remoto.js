/* remoto.js: el móvil como mando. La portada (y ⚙) enseña un QR con una sala; al leerlo, el móvil abre mando.html y se conecta directamente con este navegador
   (WebRTC, con PeerJS como presentador). El móvil envía unas 30 veces por segundo los joysticks y los botones, y el juego los usa como si fueran un mando.
   La conexión solo se abre si abres el panel: no se contacta con ningún servicio hasta entonces. */
(() => {
  const Q = window.QX;
  const R = Q.remote = { on: false, mx: 0, my: 0, lx: 0, ly: 0, run: false, crouch: false, shoot: false, lean: 0, ev: [], id: null, peer: null };
  let peer = null;

  const idCorto = () => { const c = 'abcdefghjkmnpqrstuvwxyz23456789'; let s = 'qx-'; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; };
  const handle = (d) => {
    if (!d || typeof d !== 'object') return;
    if (d.t === 's') { R.mx = +d.mx || 0; R.my = +d.my || 0; R.lx = +d.lx || 0; R.ly = +d.ly || 0; R.run = !!d.run; R.crouch = !!d.cr; R.lean = +d.ln || 0; if (!!d.sh !== R.shoot) { R.shoot = !!d.sh; window.dispatchEvent(new MouseEvent(R.shoot ? 'mousedown' : 'mouseup', { button: 0 })); } }
    else if (d.t === 'e') R.ev.push(d.k);
  };
  const estado = (txt, ok) => document.querySelectorAll('.qrstate').forEach((el) => { el.textContent = txt; el.classList.toggle('ok', !!ok); });

  /* Crea la sala y pinta el QR dentro de los contenedores indicados. Se puede llamar varias veces: la sala se reutiliza. */
  Q.mostrarQR = (boxes) => {
    const pintar = (id) => {
      const url = new URL('mando.html', location.href); url.searchParams.set('id', id);
      boxes.forEach((box) => { box.innerHTML = ''; if (window.QRCode) new QRCode(box, { text: url.href, width: box.dataset.size ? +box.dataset.size : 240, height: box.dataset.size ? +box.dataset.size : 240, colorDark: '#0a0709', colorLight: '#f2ead8', correctLevel: QRCode.CorrectLevel.M }); const a = document.createElement('code'); a.textContent = id; a.className = 'qrid'; box.appendChild(a); });
      estado(R.on ? 'Móvil conectado ✓' : 'Escanea el QR con el móvil (misma wifi o datos).', R.on);
    };
    if (R.id) { pintar(R.id); return; }
    if (!window.Peer) { estado('No se ha podido cargar el servicio de conexión.'); return; }
    estado('Preparando la sala…');
    try {
      R.id = idCorto(); peer = R.peer = new Peer(R.id);
      peer.on('open', (id) => pintar(id));
      peer.on('connection', (conn) => {
        conn.on('open', () => { R.on = true; estado('Móvil conectado ✓  ·  pulsa ✕ en el móvil para empezar', true); document.body.classList.add('mando-on'); if (Q.notify) Q.notify('Mate', 'Mando conectado: tu móvil es ahora un joystick de 30 mensajes por segundo.'); conn.send({ t: 'hello' }); });
        conn.on('data', handle);
        const off = () => { R.on = false; document.body.classList.remove('mando-on'); R.mx = R.my = R.lx = R.ly = 0; R.lean = 0; R.run = R.crouch = false; if (R.shoot) { R.shoot = false; window.dispatchEvent(new MouseEvent('mouseup', { button: 0 })); } estado('Móvil desconectado. Escanea de nuevo.'); };
        conn.on('close', off); conn.on('error', off);
      });
      peer.on('error', (e) => { estado('Error de conexión (' + (e && e.type) + '). Recarga la página.'); R.id = null; });
    } catch (e) { estado('No se pudo crear la sala.'); R.id = null; }
  };

  // portada: en el ordenador el QR aparece grande y la sala se abre sola; en un móvil no tiene sentido, así que no se enseña
  const esMovil = () => matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches || (matchMedia('(hover: none)').matches && matchMedia('(pointer: coarse)').matches);   // móvil o tablet: el puntero principal es táctil
  const qr = document.getElementById('qrmain');
  if (qr) { if (esMovil()) qr.hidden = true; else { qr.hidden = false; Q.mostrarQR([document.getElementById('qrcode')]); } }
  // botón de ajustes dentro del juego
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'cfgQR') { if (esMovil()) return;
      let m = document.getElementById('qrmodal');
      if (!m) { m = document.createElement('div'); m.id = 'qrmodal'; m.innerHTML = '<div class="qrcard"><h3>Móvil como mando</h3><div class="qrbig" data-size="260"></div><p class="qrstate"></p><button type="button" class="btn" id="qrclose">Cerrar</button></div>'; document.body.appendChild(m); m.querySelector('#qrclose').addEventListener('click', () => { m.hidden = true; }); }
      m.hidden = false; Q.mostrarQR([m.querySelector('.qrbig')]);
    }
  });
})();
