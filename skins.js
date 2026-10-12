'use strict';

// ---- Skins (temas visuales de bloques y tablero) ----
// Cada skin define: paleta (índice 0 = null, 1–7 = piezas), color de fondo
// del canvas (null = usa el CSS del tema), color de grilla (null = usa --grid)
// y su función de dibujo de bloque.

const SKIN_KEY = 'tetris.skin';
const SKIN_DEFAULT = 'retro';

function drawRetroBlock(context, x, y, color, size, alpha) {
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

function drawNeonBlock(context, x, y, color, size, alpha) {
  context.globalAlpha = alpha ?? 1;
  context.shadowColor = color;
  context.shadowBlur = size * 0.6;
  context.fillStyle = color;
  context.fillRect(x * size + 3, y * size + 3, size - 6, size - 6);
  // núcleo claro sin glow para dar sensación de tubo de neón
  context.shadowBlur = 0;
  context.fillStyle = 'rgba(255,255,255,0.35)';
  context.fillRect(x * size + 6, y * size + 6, size - 12, size - 12);
  context.globalAlpha = 1;
}

function roundedPath(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

function drawPastelBlock(context, x, y, color, size, alpha) {
  context.globalAlpha = alpha ?? 1;
  roundedPath(context, x * size + 2, y * size + 2, size - 4, size - 4, 7);
  context.fillStyle = color;
  context.fill();
  context.strokeStyle = 'rgba(0,0,0,0.08)';
  context.lineWidth = 1;
  context.stroke();
  // brillo suave interior
  roundedPath(context, x * size + 5, y * size + 5, size - 14, 4, 2);
  context.fillStyle = 'rgba(255,255,255,0.45)';
  context.fill();
  context.globalAlpha = 1;
}

function drawPixelBlock(context, x, y, color, size, alpha) {
  const px = x * size + 1;
  const py = y * size + 1;
  const inner = size - 2;
  context.globalAlpha = alpha ?? 1;
  // base
  context.fillStyle = color;
  context.fillRect(px, py, inner, inner);
  // borde oscuro de 2 px
  context.fillStyle = 'rgba(0,0,0,0.35)';
  context.fillRect(px, py, inner, 2);
  context.fillRect(px, py + inner - 2, inner, 2);
  context.fillRect(px, py, 2, inner);
  context.fillRect(px + inner - 2, py, 2, inner);
  // textura en rejilla de 4x4 píxeles (patrón ajedrez claro)
  const p = Math.floor((inner - 6) / 4); // entero para píxeles nítidos
  context.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++)
      if ((i + j) % 2 === 0)
        context.fillRect(px + 3 + j * p, py + 3 + i * p, p, p);
  context.globalAlpha = 1;
}

const SKINS = {
  retro: {
    name: 'Retro',
    palette: [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#7986cb', '#ffb74d'],
    bg: null,
    grid: null,
    drawBlock: drawRetroBlock,
  },
  neon: {
    name: 'Neon',
    palette: [null, '#00f0ff', '#ffff00', '#d400ff', '#39ff14', '#ff2a4d', '#3d5afe', '#ff9100'],
    bg: '#000000',
    grid: '#16162a',
    drawBlock: drawNeonBlock,
  },
  pastel: {
    name: 'Pastel',
    palette: [null, '#a8e6f0', '#fff3b0', '#d7bde2', '#c8f0c8', '#f7b7b7', '#b8c4f0', '#ffd6a5'],
    bg: null,
    grid: null,
    drawBlock: drawPastelBlock,
  },
  pixel: {
    name: 'Pixel art',
    palette: [null, '#29b6f6', '#fdd835', '#ab47bc', '#66bb6a', '#ef5350', '#5c6bc0', '#ff9800'],
    bg: null,
    grid: null,
    drawBlock: drawPixelBlock,
  },
};

function loadSkinKey() {
  try {
    const key = localStorage.getItem(SKIN_KEY);
    if (key && SKINS[key]) return key;
  } catch {}
  return SKIN_DEFAULT;
}

function saveSkinKey(key) {
  try { localStorage.setItem(SKIN_KEY, key); } catch {}
}
