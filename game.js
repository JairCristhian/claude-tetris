'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

// ---- Skins ----
// Cada skin define su paleta (índice 1–7) y cómo se dibuja una celda.
const SKINS = {
  retro: {
    label: 'Retro',
    colors: [
      null,
      '#4dd0e1', // I - cyan
      '#ffd54f', // O - yellow
      '#ba68c8', // T - purple
      '#81c784', // S - green
      '#e57373', // Z - red
      '#7986cb', // J - indigo
      '#ffb74d', // L - orange
    ],
    drawCell(context, x, y, size, color) {
      context.fillStyle = color;
      context.fillRect(x + 1, y + 1, size - 2, size - 2);
      // highlight
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.fillRect(x + 1, y + 1, size - 2, 4);
    },
  },
  neon: {
    label: 'Neon',
    colors: [
      null,
      '#00e5ff',
      '#ffea00',
      '#ff40ff',
      '#76ff03',
      '#ff1744',
      '#448aff',
      '#ff9100',
    ],
    drawCell(context, x, y, size, color) {
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.fillStyle = color;
      context.fillRect(x + 3, y + 3, size - 6, size - 6);
      context.shadowBlur = 0;
    },
  },
  pastel: {
    label: 'Pastel',
    colors: [
      null,
      '#a8e6ff',
      '#fff3a3',
      '#d9b8f5',
      '#b5f0c8',
      '#ffb3b3',
      '#b8c4f7',
      '#ffd1a3',
    ],
    drawCell(context, x, y, size, color) {
      context.fillStyle = color;
      roundRect(context, x + 2, y + 2, size - 4, size - 4, 6);
      context.fill();
    },
  },
  pixel: {
    label: 'Pixel art',
    colors: [
      null,
      '#4dd0e1',
      '#ffd54f',
      '#ba68c8',
      '#81c784',
      '#e57373',
      '#7986cb',
      '#ffb74d',
    ],
    drawCell(context, x, y, size, color) {
      context.fillStyle = color;
      context.fillRect(x + 1, y + 1, size - 2, size - 2);
      // textura: cuadrícula de puntos oscuros
      context.fillStyle = 'rgba(0,0,0,0.25)';
      for (let py = 4; py < size - 4; py += 6)
        for (let px = 4; px < size - 4; px += 6)
          context.fillRect(x + px, y + py, 2, 2);
    },
  },
};

function roundRect(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const timeEl = document.getElementById('time');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const pauseMenu = document.getElementById('pause-menu');
const pauseMain = document.getElementById('pause-main');
const pauseControls = document.getElementById('pause-controls');
const resumeBtn = document.getElementById('resume-btn');
const pauseRestartBtn = document.getElementById('pause-restart-btn');
const controlsBtn = document.getElementById('controls-btn');
const backBtn = document.getElementById('back-btn');
const startLevelEl = document.getElementById('start-level');
const recordsSection = document.getElementById('records');
const recordsBody = document.getElementById('records-body');
const recordsStats = document.getElementById('records-stats');
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId, elapsed, shownSecond, startLevel = 1;
let started = false, combo, bestCombo, pendingRecord;

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function updateTime() {
  const sec = Math.floor(elapsed / 1000);
  if (sec === shownSecond) return;
  shownSecond = sec;
  timeEl.textContent = formatTime(elapsed);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function speedFor(lvl) {
  return Math.max(100, 1000 - (lvl - 1) * 90);
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    combo++;
    bestCombo = Math.max(bestCombo, combo);
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = startLevel + Math.floor(lines / 10);
    dropInterval = speedFor(level);
    updateHUD();
  } else {
    combo = 0;
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  context.globalAlpha = alpha ?? 1;
  currentSkin.drawCell(context, x * size, y * size, size, currentSkin.colors[colorIndex]);
  context.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid').trim();
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  const records = loadRecords();
  records.maxCombo = Math.max(records.maxCombo, bestCombo);
  records.maxLines = Math.max(records.maxLines, lines);
  saveRecords(records);
  const qualified = qualifies(records.top, score);
  pendingRecord = qualified ? { score, lines, combo: bestCombo } : null;
  const top = qualified ? ' · ¡Entra en el top 5!' : '';
  showOverlay('GAME OVER', `Puntuación: ${score.toLocaleString()} · Tiempo: ${formatTime(elapsed)}${top}`, { records: true });
}

function togglePause() {
  if (!started || gameOver) return;
  paused = !paused;
  if (!paused) {
    closePauseMenu();
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    pauseMenu.classList.remove('hidden');
  }
}

function closePauseMenu() {
  pauseMenu.classList.add('hidden');
  pauseControls.classList.add('hidden');
  pauseMain.classList.remove('hidden');
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  elapsed += Math.min(dt, 1000); // limita el salto al volver de segundo plano
  updateTime();
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  draw();
  if (!gameOver) animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = startLevel;
  paused = false;
  gameOver = false;
  dropInterval = speedFor(level);
  dropAccum = 0;
  elapsed = 0;
  shownSecond = -1;
  combo = 0;
  bestCombo = 0;
  pendingRecord = null;
  started = true;
  updateTime();
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add('hidden');
  closePauseMenu();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  if (!started || paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

// ---- Menú de pausa ----
resumeBtn.addEventListener('click', togglePause);
pauseRestartBtn.addEventListener('click', init);
controlsBtn.addEventListener('click', () => {
  pauseMain.classList.add('hidden');
  pauseControls.classList.remove('hidden');
});
backBtn.addEventListener('click', () => {
  pauseControls.classList.add('hidden');
  pauseMain.classList.remove('hidden');
});

for (let l = 1; l <= 10; l++) startLevelEl.add(new Option(l, l));
startLevelEl.addEventListener('change', e => {
  startLevel = Number(e.target.value); // se aplica desde la próxima partida
});

// ---- Records ----
const RECORDS_KEY = 'tetris-records';
const MAX_RECORDS = 5;

function loadRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(RECORDS_KEY));
    return {
      top: Array.isArray(data?.top) ? data.top : [],
      maxCombo: data?.maxCombo || 0,
      maxLines: data?.maxLines || 0,
    };
  } catch {
    return { top: [], maxCombo: 0, maxLines: 0 };
  }
}

function saveRecords(records) {
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); } catch {}
}

function qualifies(top, score) {
  return score > 0 && (top.length < MAX_RECORDS || score > top[top.length - 1].score);
}

function insertIndex(top, score) {
  const i = top.findIndex(r => score > r.score);
  return i === -1 ? top.length : i;
}

function renderRecords(highlight = -1) {
  const { top, maxCombo, maxLines } = loadRecords();
  const rows = top.slice();
  if (pendingRecord) rows.splice(insertIndex(top, pendingRecord.score), 0, { ...pendingRecord, name: '—', pending: true });

  const trs = rows.slice(0, MAX_RECORDS).map((r, i) => {
    const tr = document.createElement('tr');
    if (r.pending || i === highlight) tr.className = 'hit';
    for (const value of [i + 1, r.name, r.score.toLocaleString(), r.lines, r.combo]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    return tr;
  });
  if (!trs.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Sin records todavía';
    tr.append(td);
    trs.push(tr);
  }
  recordsBody.replaceChildren(...trs);

  recordsStats.textContent = `Mejor combo: ${maxCombo} · Líneas máx: ${maxLines}`;
  nameForm.classList.toggle('hidden', !pendingRecord);
  if (pendingRecord) nameInput.focus();
}

function saveRecord() {
  if (!pendingRecord) return;
  const name = nameInput.value.trim().slice(0, 12) || 'Anónimo';
  const records = loadRecords();
  const idx = insertIndex(records.top, pendingRecord.score);
  records.top.splice(idx, 0, { name, score: pendingRecord.score, lines: pendingRecord.lines, combo: pendingRecord.combo });
  records.top = records.top.slice(0, MAX_RECORDS);
  saveRecords(records);
  pendingRecord = null;
  nameInput.value = '';
  renderRecords(idx);
}

function resetRecords() {
  if (!confirm('¿Borrar todos los records?')) return;
  saveRecords({ top: [], maxCombo: 0, maxLines: 0 });
  renderRecords();
}

function showOverlay(title, scoreText, { records = false, button = 'Reiniciar' } = {}) {
  overlayTitle.textContent = title;
  overlayScore.textContent = scoreText;
  recordsSection.classList.toggle('hidden', !records);
  restartBtn.textContent = button;
  overlay.classList.remove('hidden');
  if (records) renderRecords();
}

saveBtn.addEventListener('click', saveRecord);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveRecord(); });
resetBtn.addEventListener('click', resetRecords);

// ---- Tema claro/oscuro ----
const themeToggle = document.getElementById('theme-toggle');
const themeText = document.getElementById('theme-text');
const THEME_KEY = 'tetris-theme';
const schemeQuery = window.matchMedia('(prefers-color-scheme: light)');

function storedTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch { return null; }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const isLight = theme === 'light';
  themeToggle.setAttribute('aria-checked', isLight);
  themeText.textContent = isLight ? 'Claro' : 'Oscuro';
  // repintar para que el canvas refleje el tema aun en pausa o game over
  if (board) { draw(); drawNext(); }
}

themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
  applyTheme(theme);
  themeToggle.blur(); // evita que Space/Enter vuelvan a activar el botón
});

schemeQuery.addEventListener('change', e => {
  if (!storedTheme()) applyTheme(e.matches ? 'light' : 'dark');
});

applyTheme(storedTheme() || (schemeQuery.matches ? 'light' : 'dark'));

// ---- Selector de skin ----
const skinSelect = document.getElementById('skin-select');
const SKIN_KEY = 'tetris-skin';
let currentSkin = SKINS.retro;

function storedSkin() {
  try { return localStorage.getItem(SKIN_KEY); } catch { return null; }
}

function applySkin(key) {
  const name = SKINS[key] ? key : 'retro';
  currentSkin = SKINS[name];
  document.documentElement.dataset.skin = name;
  skinSelect.value = name;
  // repintar con la nueva skin sin recargar
  if (board) { draw(); drawNext(); }
}

skinSelect.addEventListener('change', () => {
  try { localStorage.setItem(SKIN_KEY, skinSelect.value); } catch {}
  applySkin(skinSelect.value);
  skinSelect.blur();
});

applySkin(storedSkin() || 'retro');

showOverlay('TETRIS', '', { records: true, button: 'Jugar' });
