/* main.js - Lógica de inicio */
const introScreen = document.getElementById('intro-screen');
const gameScreen  = document.getElementById('game-screen');

function startGame() {
  introScreen.style.display = 'none';
  gameScreen.style.display = 'flex';
  canvas.focus({ preventScroll: true });
  startLoop();
}

document.getElementById('start-btn').addEventListener('click', startGame);

/* Accesos directos de la pantalla de inicio: entran al juego y abren la sección */
document.querySelectorAll('[data-go]').forEach(b =>
  b.addEventListener('click', () => {
    startGame();
    openModal(b.dataset.go);
  }));

/* Avatar de la pantalla de inicio: el mismo sprite que el jugador, a mayor escala */
(function drawAvatar() {
  const c = document.getElementById('intro-canvas').getContext('2d');
  c.scale(2.3, 2.3);
  drawSprite(c, 7, 4, 2);
})();
