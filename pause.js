'use strict';

// ---- Menú de pausa ----
// Se carga antes que game.js y usa sus globales (togglePause, init, paused...).

const MAX_START_LEVEL = 15;
let startLevel = 1; // nivel con el que empieza la próxima partida

const pauseMenu = document.getElementById('pause-menu');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const startLevelSel = document.getElementById('start-level');
const controlsBtn = document.getElementById('controls-btn');
const menuControls = document.getElementById('menu-controls');

for (let l = 1; l <= MAX_START_LEVEL; l++) {
  startLevelSel.add(new Option(`Nivel ${l}`, l));
}
startLevelSel.value = startLevel;

function openPauseMenu() {
  pauseMenu.classList.remove('hidden');
  resumeBtn.focus();
}

function closePauseMenu() {
  pauseMenu.classList.add('hidden');
  menuControls.hidden = true;
  controlsBtn.textContent = 'Ver controles';
  controlsBtn.setAttribute('aria-expanded', 'false');
}

resumeBtn.addEventListener('click', togglePause);

pauseRestartBtn.addEventListener('click', () => {
  closePauseMenu();
  init();
});

controlsBtn.addEventListener('click', () => {
  const show = menuControls.hidden;
  menuControls.hidden = !show;
  controlsBtn.textContent = show ? 'Ocultar controles' : 'Ver controles';
  controlsBtn.setAttribute('aria-expanded', String(show));
});

// Se aplica al reiniciar o empezar la siguiente partida, no a la actual
startLevelSel.addEventListener('change', () => {
  startLevel = Number(startLevelSel.value);
});
