/* main.js - Lógica de inicio */
document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('intro-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';
    requestAnimationFrame(gameLoop);
});
