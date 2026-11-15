/* calle.js — la calle y el parque que se ven desde la ventana del dormitorio, en «luces y siluetas»: farola naranja, siluetas que pasan, borrachos que se
   tambalean junto a un banco, luces azules intermitentes, faros que barren el cristal y humo lejano. Una capa de canvas que se redibuja unas 12 veces por
   segundo delante del cielo pintado y detrás del cristal. Todo crece con el nivel de pista (0 a 4): a más tiempo perdido o más descuido, peor la calle. */
(() => {
  const Q = window.QX;
  Q.attachStreet = (scene, R, getClue) => {
    const CW = 560, CH = 440, c = Q.cvs(CW, CH), g = c.getContext('2d'), tex = Q.toTex(c);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, toneMapped: false, depthWrite: false }));
    plane.position.set(0.9, 1.55, -Q.ROOM.D / 2 - 0.135); scene.add(plane);   // sin renderOrder: así se ordena por distancia y se dibuja antes que el cristal, que es transparente y escribe profundidad
    const rnd = Q.rng(77), LAMP = 415;
    const walkers = Array.from({ length: 6 }, (_, i) => ({ x: rnd() * CW, dir: i % 2 ? -1 : 1, v: 14 + rnd() * 12, y: 372 + rnd() * 20, s: 0.9 + rnd() * 0.3, run: rnd() < 0.5, ph: rnd() * 6 }));
    const drunks = [{ x: 118, y: 362, ph: 0 }, { x: 176, y: 366, ph: 2.1 }];
    let acc = 0, carT = -1, carNext = 4;

    const fig = (x, y, s, lean, lamp) => {                                 // silueta con cabeza de cruz; un borde cálido si pasa bajo la farola
      g.save(); g.translate(x, y); g.rotate(lean); g.scale(s, s);
      if (lamp > 0.02) { g.fillStyle = `rgba(255,170,90,${0.38 * lamp})`; g.fillRect(-4.8, -17.5, 9.6, 11); g.beginPath(); g.arc(0.8, -21, 4.6, 0, 7); g.fill(); }
      g.fillStyle = '#05060a'; g.fillRect(-4, -17, 8, 11); g.fillRect(-3.4, -7, 2.8, 7); g.fillRect(0.6, -7, 2.8, 7);
      g.beginPath(); g.arc(0, -21, 4.2, 0, 7); g.fill();
      g.strokeStyle = `rgba(150,160,190,${0.25 + 0.4 * lamp})`; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-2.2, -21); g.lineTo(2.2, -21); g.moveTo(0, -23.4); g.lineTo(0, -18.6); g.stroke();
      g.restore();
    };
    const glow = (x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };

    function draw(t) {
      let clue = 0; try { clue = getClue ? getClue() : 0; } catch (e) { clue = 0; }
      g.clearRect(0, 0, CW, CH); g.globalCompositeOperation = 'source-over'; g.save(); g.translate(0, -84);   // la calle queda a media altura del cristal, por encima del alféizar
      // humo lejano detrás de los edificios (pista alta)
      if (clue >= 3) for (let i = 0; i < 5; i++) { const y = 60 + i * 56 - ((t * 3 + i * 40) % 40), gr = g.createRadialGradient(150 + Math.sin(t * 0.2 + i) * 8, y, 0, 150, y, 46 + i * 7); gr.addColorStop(0, 'rgba(30,26,28,.34)'); gr.addColorStop(1, 'rgba(30,26,28,0)'); g.fillStyle = gr; g.fillRect(40, y - 70, 240, 140); }
      // suelo: parque a la izquierda, acera y calzada a la derecha
      const ground = g.createLinearGradient(0, 330, 0, CH + 100); ground.addColorStop(0, 'rgba(8,10,18,0)'); ground.addColorStop(0.22, 'rgba(8,10,18,.96)'); ground.addColorStop(1, 'rgba(4,5,9,1)'); g.fillStyle = ground; g.fillRect(0, 330, CW, CH - 330 + 100);
      g.fillStyle = 'rgba(30,34,52,.55)'; g.fillRect(0, 398, CW, 3);
      // árboles del parque, siluetas
      g.fillStyle = '#04050a'; [[40, 330, 38], [96, 322, 30], [210, 332, 34], [262, 340, 24]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillRect(x - 3, y, 6, 40); });
      g.fillRect(0, 372, 300, 2); for (let x = 4; x < 300; x += 14) g.fillRect(x, 358, 2, 16);                                            // valla
      g.fillRect(104, 366, 56, 4); g.fillRect(106, 356, 52, 3); g.fillRect(108, 370, 3, 8); g.fillRect(153, 370, 3, 8);                    // banco
      // farola: poste y cono de luz en el suelo
      g.fillStyle = '#05070d'; g.fillRect(LAMP - 8, 330, 16, 110); glow(LAMP, 392, 190, 'rgba(255,170,90,.62)'); glow(LAMP, 386, 70, 'rgba(255,214,150,.6)');
      // luces azules intermitentes, a la izquierda
      if (clue >= 1) { const k = Math.max(0, Math.sin(t * 7)); g.globalCompositeOperation = 'lighter'; glow(62, 352, 96, `rgba(50,100,255,${(0.2 + 0.12 * clue) * k * k})`); glow(110, 338, 60, `rgba(50,100,255,${0.16 * k})`); const k2 = Math.max(0, Math.sin(t * 7 + 3.2)); glow(46, 360, 70, `rgba(255,50,70,${0.1 * clue * k2})`); g.globalCompositeOperation = 'source-over'; }
      // gente que pasa
      const n = Math.min(6, 1 + Math.round(clue * 1.3));
      for (let i = 0; i < n; i++) { const w = walkers[i], sp = (clue >= 2 && w.run ? 5 : 1) * w.v; w.x += w.dir * sp * 0.083; if (w.x > CW + 20) w.x = -20; if (w.x < -20) w.x = CW + 20; const bob = Math.abs(Math.sin(t * (clue >= 2 && w.run ? 11 : 5) + w.ph)) * 1.4; fig(w.x, w.y - bob, w.s * 2.2, (clue >= 2 && w.run ? 0.16 : 0.02) * w.dir, Math.max(0, 1 - Math.abs(w.x - LAMP) / 120)); }
      // borrachos junto al banco: se tambalean; con pista alta uno cae al suelo
      drunks.forEach((d, i) => { const sway = Math.sin(t * 1.3 + d.ph), x = d.x + Math.sin(t * 0.7 + d.ph) * 7, down = clue >= 3 && i === 1;
        if (down) { g.save(); g.translate(x, d.y); g.rotate(Math.PI / 2); g.scale(2.2, 2.2); g.fillStyle = '#05060a'; g.fillRect(-4, -17, 8, 11); g.fillRect(-3, -7, 6, 7); g.beginPath(); g.arc(0, -21, 4.2, 0, 7); g.fill(); g.restore(); }
        else fig(x, d.y, 2.3, sway * 0.3, 0);
        if (!down && i === 0 && Math.sin(t * 2.2) > 0.6) { g.fillStyle = 'rgba(255,230,160,.9)'; g.fillRect(x + 12, d.y - 30, 4, 8); } });          // destello de una botella
      // coches: unos faros barren la calle de vez en cuando; con pista alta uno queda parado con las luces de emergencia
      carNext -= 0.083; if (carNext <= 0 && carT < 0) { carT = 0; carNext = 9 + rnd() * 6; }
      if (carT >= 0) { carT += 0.083; const x = -40 + carT * 110; g.globalCompositeOperation = 'lighter'; glow(x, 392, 38, 'rgba(255,236,190,.55)'); glow(x + 14, 392, 38, 'rgba(255,236,190,.55)'); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#05060a'; g.fillRect(x - 36, 388, 44, 8); if (x > CW + 60) carT = -1; }
      if (clue >= 2) { g.fillStyle = '#05060a'; g.fillRect(300, 388, 46, 10); g.fillRect(310, 382, 24, 7); if (Math.sin(t * 6) > 0) { g.globalCompositeOperation = 'lighter'; glow(302, 394, 22, 'rgba(255,150,40,.7)'); glow(344, 394, 22, 'rgba(255,150,40,.7)'); g.globalCompositeOperation = 'source-over'; } }
      g.restore(); tex.needsUpdate = true;
    }
    draw(0);
    R.tick.push((dt, t) => { acc += dt; if (acc < 0.083) return; acc = 0; draw(t); });
  };
})();
