'use strict';

// Records locales: top 5 puntuaciones, mejor combo y líneas máximas.
// Persistencia en localStorage (clave 'tetris.records'); todo acceso va en try/catch.

const RECORDS_KEY = 'tetris.records';
const RECORDS_SIZE = 5;

function emptyRecords() {
  return { top: [], bestCombo: 0, maxLines: 0 };
}

function isValidEntry(e) {
  return !!e && typeof e.name === 'string' && Number.isFinite(e.score) &&
    Number.isFinite(e.lines) && typeof e.date === 'string';
}

function loadRecords() {
  try {
    const data = JSON.parse(localStorage.getItem(RECORDS_KEY));
    if (!data || typeof data !== 'object') return emptyRecords();
    return {
      top: Array.isArray(data.top)
        ? data.top.filter(isValidEntry).sort((a, b) => b.score - a.score).slice(0, RECORDS_SIZE)
        : [],
      bestCombo: Number.isFinite(data.bestCombo) ? data.bestCombo : 0,
      maxLines: Number.isFinite(data.maxLines) ? data.maxLines : 0,
    };
  } catch {
    return emptyRecords();
  }
}

function saveRecords(records) {
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); } catch {}
}

function resetRecords() {
  try { localStorage.removeItem(RECORDS_KEY); } catch {}
}

// True si la puntuación entra en el top (las puntuaciones de 0 no cuentan).
function isTopScore(score) {
  if (score <= 0) return false;
  const { top } = loadRecords();
  return top.length < RECORDS_SIZE || score > top[RECORDS_SIZE - 1].score;
}

// Inserta una entrada en el top ordenado por puntuación.
// Devuelve la posición (0-based) o -1 si no entra.
function insertRecord(name, score, lines) {
  const records = loadRecords();
  const pos = records.top.findIndex(r => score > r.score);
  const index = pos === -1 ? records.top.length : pos;
  if (index >= RECORDS_SIZE) return -1;
  records.top.splice(index, 0, { name, score, lines, date: new Date().toISOString() });
  records.top = records.top.slice(0, RECORDS_SIZE);
  saveRecords(records);
  return index;
}

// Actualiza el mejor combo y las líneas máximas globales (solo al alza).
function updateRunStats(combo, lines) {
  const records = loadRecords();
  records.bestCombo = Math.max(records.bestCombo, combo);
  records.maxLines = Math.max(records.maxLines, lines);
  saveRecords(records);
}

// Pinta estadísticas y tabla de records dentro de `container`.
// `highlight` es el índice de la fila a resaltar (-1 para ninguna).
function renderRecords(container, highlight = -1) {
  const { top, bestCombo, maxLines } = loadRecords();
  container.replaceChildren();

  const stats = document.createElement('p');
  stats.className = 'records-stats';
  stats.textContent = `Mejor combo: ${bestCombo} · Líneas máx.: ${maxLines}`;
  container.append(stats);

  if (top.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'records-empty';
    empty.textContent = 'Sin records todavía';
    container.append(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'records-table';
  table.innerHTML = '<thead><tr><th>#</th><th>Nombre</th><th>Puntos</th><th>Líneas</th><th>Fecha</th></tr></thead>';
  const tbody = document.createElement('tbody');
  top.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (i === highlight) tr.className = 'records-current';
    const date = new Date(r.date);
    const cells = [
      i + 1,
      r.name,
      r.score.toLocaleString(),
      r.lines,
      Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es'),
    ];
    for (const value of cells) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    }
    tbody.append(tr);
  });
  table.append(tbody);
  container.append(table);
}
