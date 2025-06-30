const DIE_SIZES = [4, 6, 8, 10, 12, 20, 100];
const DIE_ORDER = ["D4", "D6", "D8", "D10", "D12", "D20", "D100"];
const DIE_COLORS = ['#f00', '#0f0', '#00f'];
const SCHRITTE = [1, 2, 3];
const BOARD_LENGTH = 10;
const NUM_DICE_ROWS = 3;

let diceMatrix; // Will be initialized once
let currentPosition;
let currentPlayer;
let agentMoves = [];
let trainingDone = false;
let trainingDoneOnce = false;
let autoHuman = false;
let autoRestart = false;
let autoHumanDelay = 500;
let agentWins = 0;
let humanWins = 0;
let winChart;

// DOM Elements
const trackEl = document.getElementById('track');
const diceGridEl = document.getElementById('dice-grid');
const logEl = document.getElementById('log');
const turnIndicatorEl = document.getElementById('turnIndicator');
const moveButtons = SCHRITTE.map(n => document.getElementById(`move${n}`));
const restartBtn = document.getElementById('restart');
const autoHumanCheckbox = document.getElementById('autoHuman');
const autoRestartCheckbox = document.getElementById('autoRestart');
const autoHumanDelaySlider = document.getElementById('autoHumanDelay');
const autoHumanDelayValueEl = document.getElementById('autoHumanDelayValue');
const agentMovesRowEl = document.getElementById('agent-moves-row');
const winChartCanvas = document.getElementById('winChart');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initDiceMatrix(); // Initialize diceMatrix once on DOM load
  initGame();
  initWinChart();
  setupEventListeners();
});

function initGame() {
  trainingDone = false;
  currentPosition = 0;
  currentPlayer = Math.random() < 0.5 ? 'human' : 'agent';
  agentMoves = [];
  logEl.innerHTML = '';
  // initDiceMatrix(); // REMOVED: This was causing the dice to reset every game
  renderGame();
  log(`Spiel startet: ${currentPlayer === 'human' ? 'Mensch' : 'Agent'} beginnt.`);
  updateTurnDisplay();
  updateControlsState();
  if (currentPlayer === 'agent') {
    setTimeout(agentTurn, autoHumanDelay);
  } else if (autoHuman) {
    setTimeout(autoHumanTurn, autoHumanDelay);
  }
}

function initDiceMatrix() {
  diceMatrix = Array(BOARD_LENGTH).fill(0).map((_, colIdx) => {
    const fromBottom = BOARD_LENGTH - colIdx;
    return Array(NUM_DICE_ROWS).fill(0).map((_, rowIdx) =>
      rowIdx >= (fromBottom - 1) ? 0 : 6
    );
  });
}

function setupEventListeners() {
  restartBtn.addEventListener('click', initGame);

  autoHumanDelaySlider.addEventListener('input', () => {
    autoHumanDelay = parseInt(autoHumanDelaySlider.value, 10);
    autoHumanDelayValueEl.textContent = autoHumanDelay;
  });

  autoHumanCheckbox.addEventListener('change', () => {
    autoHuman = autoHumanCheckbox.checked;
    updateControlsState();
    if (autoHuman && currentPlayer === 'human' && currentPosition !== BOARD_LENGTH - 1) {
      setTimeout(autoHumanTurn, autoHumanDelay);
    }
  });

  autoRestartCheckbox.addEventListener('change', () => {
    autoRestart = autoRestartCheckbox.checked;
    updateControlsState();
  });

  moveButtons.forEach((btn, index) => {
    btn.addEventListener('click', () => handleHumanMove(index + 1));
  });
}

// --- Rendering Functions ---
function renderGame() {
  renderTrack();
  renderDiceGrid();
  renderAgentMovesDisplay();
}

function renderTrack() {
  trackEl.innerHTML = '';
  for (let i = 0; i < BOARD_LENGTH; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell-track';

    if (i === 0) {
      createLabel(cell, 'Start');
    }
    if (i === BOARD_LENGTH - 1) {
      createLabel(cell, 'Ziel');
    }
    if (i === currentPosition) {
      const piece = document.createElement('div');
      piece.className = 'piece';
      cell.appendChild(piece);
    }
    trackEl.appendChild(cell);
  }
}

function createLabel(parentEl, text) {
  const label = document.createElement('span');
  label.textContent = text;
  parentEl.appendChild(label);
}

function renderDiceGrid() {
  diceGridEl.innerHTML = '';
  // The original structure of the HTML grid is 10 columns by 3 rows.
  // We need to iterate over rows first for correct coloring,
  // then over columns to populate the grid.
  for (let row = 0; row < NUM_DICE_ROWS; row++) { // Iterate through rows
    for (let col = 0; col < BOARD_LENGTH; col++) { // Iterate through columns
      const cell = document.createElement('div');
      cell.className = 'cell';
      const dieSize = diceMatrix[col][row]; // Access diceMatrix correctly: [column][row]
      cell.textContent = dieSize === 0 ? '' : `D${dieSize}`;
      if (dieSize !== 0) {
        cell.style.color = DIE_COLORS[row]; // Apply color based on the row index
      }
      diceGridEl.appendChild(cell);
    }
  }
}


function renderAgentMovesDisplay() {
  agentMovesRowEl.innerHTML = '';
  for (let col = 0; col < BOARD_LENGTH; col++) {
    const cell = document.createElement('div');
    cell.className = 'cell agent-move-cell';
    const move = agentMoves.find(m => m.pos === col);
    if (move) {
      cell.textContent = `${move.idx + 1} Schritte`;
      cell.style.color = DIE_COLORS[move.idx];
    }
    agentMovesRowEl.appendChild(cell);
  }
}

function updateTurnDisplay() {
  turnIndicatorEl.textContent = currentPlayer === 'human'
    ? 'Mensch am Zug: Wähle 1, 2 oder 3 Schritte.'
    : 'Agent am Zug...';
}

function updateControlsState() {
  const isHumanTurn = currentPlayer === 'human' && currentPosition !== BOARD_LENGTH - 1 && !autoHuman;
  moveButtons.forEach(btn => btn.disabled = !isHumanTurn);
  autoHumanCheckbox.disabled = currentPosition === BOARD_LENGTH - 1 || currentPlayer === null;
}

function log(msg, color = 'black') {
  const p = document.createElement('div');
  p.style.color = color;
  p.innerHTML = msg; // Use innerHTML to allow for styled spans
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

// --- Game Logic ---
function handleHumanMove(step) {
  if (currentPlayer !== 'human') return;
  log(`Mensch zieht ${step} Schritte.`);
  movePiece(step, null, 'human');
}

function agentTurn() {
  const currentDice = diceMatrix[currentPosition].filter(s => s !== 0);
  const rolls = currentDice.map(s => Math.floor(Math.random() * s) + 1);

  rolls.forEach((roll, index) => {
    const dieSize = diceMatrix[currentPosition][index];
    log(`Agent würfelt <span style="color: ${DIE_COLORS[index]}">D${dieSize}</span> (${index + 1} Schritte) → ${roll}`);
  });

  const maxRoll = Math.max(...rolls);
  const chosenDieIndex = rolls.indexOf(maxRoll);
  const chosenStep = chosenDieIndex + 1;

  log(`<span style="color: ${DIE_COLORS[chosenDieIndex]}">D${diceMatrix[currentPosition][chosenDieIndex]}</span> ist am größten. Agent zieht ${chosenStep} Schritte.`);
  agentMoves.push({ pos: currentPosition, idx: chosenDieIndex });
  movePiece(chosenStep, chosenDieIndex, 'agent');
}

function movePiece(step, dieIndex, who) {
  currentPosition = Math.min(currentPosition + step, BOARD_LENGTH - 1);
  renderGame();

  if (currentPosition === BOARD_LENGTH - 1) {
    endGame(who);
    return;
  }

  currentPlayer = (who === 'human' ? 'agent' : 'human');
  updateTurnDisplay();
  updateControlsState();

  if (currentPlayer === 'agent') {
    setTimeout(agentTurn, autoHumanDelay);
  } else if (autoHuman) {
    setTimeout(autoHumanTurn, autoHumanDelay);
  }
}

function endGame(winner) {
  adjustDiceAfterGame(winner);
  log(`Spielende – Gewinner: ${winner === 'human' ? 'Mensch' : 'Agent'}`);

  if (winner === 'human') {
    humanWins++;
  } else {
    agentWins++;
  }
  updateWinChart();
  currentPlayer = null;
  updateTurnDisplay();
  updateControlsState();

  if (!trainingDone && autoRestart) {
    setTimeout(initGame, autoHumanDelay);
  }
}

function autoHumanTurn() {
  if (currentPlayer !== 'human' || currentPosition === BOARD_LENGTH - 1 || !autoHuman) return;
  const step = SCHRITTE[Math.floor(Math.random() * SCHRITTE.length)];
  log(`(Auto) Mensch zieht ${step} Schritte.`);
  movePiece(step, null, 'human');
}

// --- Dice Adjustment Logic ---
function adjustDiceAfterGame(winner) {
  if (agentMoves.length === 0 || trainingDone) return;

  agentMoves.reverse(); // Process moves in reverse order (from last to first)

  const isAgentWinner = (winner === 'agent');
  log(`${isAgentWinner ? 'Agent' : 'Mensch'} hat gewonnen! Würfel werden ${isAgentWinner ? 'vergrößert' : 'verkleinert'}.`);

  const targetDieTypeFn = isAgentWinner ? getNextDieType : getPrevDieType;
  const adjustFn = isAgentWinner ? incDie : decDie;

  for (let i = 0; i < agentMoves.length; i++) {
    const { pos, idx } = agentMoves[i];
    const currentDieSize = diceMatrix[pos][idx];
    const currentDieType = `D${currentDieSize}`;
    const newDieType = targetDieTypeFn(currentDieType);

    if (newDieType) {
      adjustFn(pos, idx);
    }
  }

}

function getNextDieType(currentType) {
  const idx = DIE_ORDER.indexOf(currentType);
  return idx >= 0 && idx < DIE_ORDER.length - 1 ? DIE_ORDER[idx + 1] : null;
}

function getPrevDieType(currentType) {
  const idx = DIE_ORDER.indexOf(currentType);
  return idx > 0 ? DIE_ORDER[idx - 1] : null;
}

function updateDie(pos, idx, increment) {
  if (diceMatrix[pos][idx] === 0) return;

  const oldSize = diceMatrix[pos][idx];
  const currentIndex = DIE_SIZES.indexOf(oldSize);

  let newIndex = currentIndex + (increment ? 1 : -1);

  if (newIndex >= 0 && newIndex < DIE_SIZES.length) {
    const newSize = DIE_SIZES[newIndex];
    diceMatrix[pos][idx] = newSize;
    log(`Aktualisiere Würfel Feld ${pos}, Reihe ${idx + 1}: ${oldSize} → ${newSize}`);
    renderDiceGrid();
  } else {
    log(`Würfel Feld ${pos}, Reihe ${idx + 1} ist bereits ${increment ? 'D100' : 'D4'} und kann nicht weiter ${increment ? 'erhöht' : 'verringert'} werden.`);
  }
}

const incDie = (pos, idx) => updateDie(pos, idx, true);
const decDie = (pos, idx) => updateDie(pos, idx, false);

// --- Chart Functions ---
function initWinChart() {
  const ctx = winChartCanvas.getContext('2d');
  winChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Agent', 'Mensch'],
      datasets: [{
        label: 'Siege',
        data: [agentWins, humanWins],
        backgroundColor: ['#888', '#0f0']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, precision: 0 }
      }
    }
  });
}

function updateWinChart() {
  if (winChart) {
    winChart.data.datasets[0].data = [agentWins, humanWins];
    winChart.update();
  }
}