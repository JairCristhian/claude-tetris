'use strict';

// ---- Menú de pausa ----
// Se carga antes que game.js y usa sus globales (togglePause, init, paused...).

const MAX_START_LEVEL = 15;

const pauseMenu = document.getElementById('pause-menu');
const pauseBox = pauseMenu.querySelector('.pause-box');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const startLevelSel = document.getElementById('start-level');
const controlsBtn = document.getElementById('controls-btn');
const menuControls = document.getElementById('menu-controls');

for (let l = 1; l <= MAX_START_LEVEL; l++) {
  startLevelSel.add(new Option(`Nivel ${l}`, l));
}
function openPauseMenu() {
  pauseMenu.classList.remove('hidden');
  // foco en el contenedor: Space/Enter no deben activar "Reanudar" sin querer
  pauseBox.focus();
}

function closePauseMenu() {
  pauseMenu.classList.add('hidden');
  menuControls.hidden = true;
  controlsBtn.textContent = 'Ver controles';
  controlsBtn.setAttribute('aria-expanded', 'false');
}

// Arrow function: togglePause se define en game.js, que carga después de este archivo
resumeBtn.addEventListener('click', () => togglePause());

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
  nextStartLevel = Number(startLevelSel.value);
});
