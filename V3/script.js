// --- CONSTANTS ---
const DIE_SIZES = [4, 6, 8, 10, 12, 20, 100];
const DIE_ORDER = ["D4", "D6", "D8", "D10", "D12", "D20", "D100"];
const ROW_COLORS = ['#f00', '#0f0', '#00f']; // Colors for the 3 choices/rows
const AGENT_COLORS = { agent1: '#d9534f', agent2: '#428bca' };
const EVAL_BAR_GAMES = 20;

// --- STATE ---
let diceMatrix1, diceMatrix2;
let agent1Moves, agent2Moves;
let position, currentPlayer;
let agent1Wins = 0;
let agent2Wins = 0;
let isSimulating = false;
let gameDelay = 100;
let winChart;
let lastWinners = []; // Array of 'agent1' or 'agent2'

// --- DOM ELEMENTS ---
const trackEl = document.getElementById('track');
const gridEl1 = document.getElementById('dice-grid-agent1');
const gridEl2 = document.getElementById('dice-grid-agent2');
const movesRowEl1 = document.getElementById('agent-moves-row-1');
const movesRowEl2 = document.getElementById('agent-moves-row-2');
const logEl = document.getElementById('log');
const turnEl = document.getElementById('turnIndicator');
const runPauseBtn = document.getElementById('runPauseBtn');
const restartBtn = document.getElementById('restartBtn');
const trainAgent2Btn = document.getElementById('trainAgent2Btn');
const delaySlider = document.getElementById('delaySlider');
const delayValueEl = document.getElementById('delayValue');

// --- INITIALIZATION ---
window.onload = () => {
  setupControls();
  initGame();
  initWinChart();
  updateEvalBar(); // Initialize bar on load
};

function setupControls() {
  runPauseBtn.addEventListener('click', toggleSimulation);
  trainAgent2Btn.addEventListener('click', () => {
      isSimulating = false;
      runPauseBtn.textContent = 'Simulation starten';
      diceMatrix2 = createTrainedDiceMatrix(); // Create trained matrix for Agent 2
      renderGrid(diceMatrix2, gridEl2);
  });
    trainAgent2Btn.addEventListener('dblclick', () => {
      isSimulating = false;
      runPauseBtn.textContent = 'Simulation starten';
      diceMatrix2 = createCheatDiceMatrix(); // Create trained matrix for Agent 2
      renderGrid(diceMatrix2, gridEl2);
  });
  

  restartBtn.addEventListener('click', () => {
      isSimulating = false;
      runPauseBtn.textContent = 'Simulation starten';
      diceMatrix1 = null; // Force creation of new matrices
      diceMatrix2 = null;
      lastWinners = []; // Reset last winners
      updateEvalBar(); // Reset evaluation bar
      initGame();
  });
  delaySlider.addEventListener('input', () => {
    gameDelay = parseInt(delaySlider.value, 10);
    delayValueEl.textContent = gameDelay;
  });
  delayValueEl.textContent = delaySlider.value;
  gameDelay = parseInt(delaySlider.value, 10);
}

function createInitialDiceMatrix() {
  return Array(10).fill(null).map((_, rowIdx, arr) => {
    const fromBottom = arr.length - rowIdx;
    return [6, 6, 6].map((v, colIdx) =>
      colIdx >= (fromBottom - 1) ? 0 : 6
    );
  });
}

const createTrainedDiceMatrix = () =>
  Array(10).fill(null).map((_, rowIdx) =>
    Array(3).fill(null).map((_, colIdx) =>
      rowIdx >= 9 - colIdx
        ? 0
        : [100, 4, 4, 4][(rowIdx + colIdx) % 4]
    )
  );

const createCheatDiceMatrix = () =>
  Array.from({ length: 10 }, (_, i) =>
    i === 9
      ? [0, 0, 0]
      : [[100, 0,   0],
         [  4, 4,   4],
         [  0, 0, 100],
         [  0,100,   0]][i % 4]
  );

function initGame() {
  // Create new matrices only on first game or manual restart to allow learning across games.
  if (!diceMatrix1) {
      diceMatrix1 = createInitialDiceMatrix();
      diceMatrix2 = createInitialDiceMatrix();
      agent1Wins = 0;
      agent2Wins = 0;
      updateWinChart();
  }
  
  position = 0;
  currentPlayer = Math.random() < 0.5 ? 'agent1' : 'agent2';
  agent1Moves = [];
  agent2Moves = [];

  logEl.innerHTML = '';
  log(`Neues Spiel: <strong>${currentPlayer}</strong> beginnt.`);
  
  renderAll();
  updateTurnIndicator();
  
  if (isSimulating) {
    setTimeout(gameTurn, gameDelay);
  }
}

// --- RENDERING ---
function renderAll() {
    renderTrack();
    renderGrid(diceMatrix1, gridEl1);
    renderGrid(diceMatrix2, gridEl2);
    renderAgentMovesRow(agent1Moves, movesRowEl1);
    renderAgentMovesRow(agent2Moves, movesRowEl2);
}

function renderTrack() {
  trackEl.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell-track';
    if (i === 0) cell.innerHTML = '<span>Start</span>';
    if (i === 9) cell.innerHTML = '<span>Ziel</span>';
    if (i === position) {
      const piece = document.createElement('div');
      piece.className = 'piece';
      //piece.style.backgroundColor = AGENT_COLORS[currentPlayer] || '#888';
      cell.appendChild(piece);
    }
    trackEl.appendChild(cell);
  }
}

function renderGrid(matrix, gridEl) {
  gridEl.innerHTML = '';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = matrix[col][row] === 0 ? '' : `D${matrix[col][row]}`;
      if (matrix[col][row] !== 0) {
        cell.style.color = ROW_COLORS[row];
        cell.style.opacity = 0.5 + (DIE_SIZES.indexOf(matrix[col][row]) / DIE_SIZES.length) * 0.5;
      }
      gridEl.appendChild(cell);
    }
  }
}

function renderAgentMovesRow(moves, rowEl) {
  rowEl.innerHTML = '';
  for (let col = 0; col < 10; col++) {
    const cell = document.createElement('div');
    cell.className = 'agent-move-cell';
    const move = moves.find(m => m.pos === col);
    if (move) {
      cell.textContent = `${move.idx + 1} Schritte`;
      cell.style.color = ROW_COLORS[move.idx];
    }
    rowEl.appendChild(cell);
  }
}

function updateTurnIndicator() {
  if (currentPlayer === null) {
      turnEl.textContent = 'Spiel beendet.';
      turnEl.style.color = '#000';
      return;
  }
  turnEl.textContent = `${currentPlayer} ist am Zug...`;
  turnEl.style.color = AGENT_COLORS[currentPlayer];
}

// --- GAME LOGIC ---

function toggleSimulation() {
    isSimulating = !isSimulating;
    runPauseBtn.textContent = isSimulating ? 'Simulation anhalten' : 'Simulation fortsetzen';
    if (isSimulating) {
        if(currentPlayer === null) {
            initGame();
        } else {
            gameTurn();
        }
    }
}

function gameTurn() {
    if (!isSimulating || currentPlayer === null) return;
    
    const currentAgentId = currentPlayer;
    const currentMatrix = (currentAgentId === 'agent1') ? diceMatrix1 : diceMatrix2;
    const currentMoves = (currentAgentId === 'agent1') ? agent1Moves : agent2Moves;

    const rolls = currentMatrix[position]
        .map(s => s > 0 ? Math.floor(Math.random() * s) + 1 : 0);

    const validRolls = rolls.filter((r, i) => currentMatrix[position][i] !== 0);
    if (validRolls.length === 0) {
        log(`<span style="color:red">FEHLER: ${currentAgentId} kann von Position ${position} nicht ziehen.</span>`);
        setTimeout(initGame, gameDelay > 0 ? 1000: 100);
        return;
    }

    const maxRoll = Math.max(...rolls);
    const bestMoveIndex = rolls.indexOf(maxRoll);
    const steps = bestMoveIndex + 1;

    logMove(currentAgentId, currentMatrix[position], rolls, bestMoveIndex);
    currentMoves.push({ pos: position, idx: bestMoveIndex });
    
    movePiece(steps, currentAgentId);

    renderAll();
}

function movePiece(steps, who) {
  position = Math.min(position + steps, 9);
  
  if (position === 9) {
    renderAll();
    endGame(who);
  } else {
    currentPlayer = (who === 'agent1') ? 'agent2' : 'agent1';
    updateTurnIndicator();
    renderTrack(); 
    if (isSimulating) {
        setTimeout(gameTurn, gameDelay);
    }
  }
}

function updateEvalBar() {
  const evalBar1 = document.getElementById('evalBarAgent1');
  const evalBar2 = document.getElementById('evalBarAgent2');
  const label1 = document.getElementById('evalBarAgent1Label');
  const label2 = document.getElementById('evalBarAgent2Label');
  if (!evalBar1 || !evalBar2 || !label1 || !label2) return;

  if (lastWinners.length === 0) {
    evalBar1.style.width = '50%';
    evalBar2.style.width = '50%';
    evalBar1.style.background = '#222';
    evalBar2.style.background = '#222';
    label1.textContent = '0%';
    label2.textContent = '0%';
    return;
  }

  const count1 = lastWinners.filter(w => w === 'agent1').length;
  const count2 = lastWinners.filter(w => w === 'agent2').length;
  const total = lastWinners.length || 1;
  const pct1 = Math.round((count1 / total) * 100);
  const pct2 = 100 - pct1;

  evalBar1.style.width = pct1 + '%';
  evalBar2.style.width = pct2 + '%';
  evalBar1.style.background = AGENT_COLORS.agent1;
  evalBar2.style.background = AGENT_COLORS.agent2;
  label1.textContent = pct1 + '%';
  label2.textContent = pct2 + '%';
}

function endGame(winner) {
  currentPlayer = null; 
  const loser = winner === 'agent1' ? 'agent2' : 'agent1';
  log(`Spielende – <strong style="color:${AGENT_COLORS[winner]}">Gewinner: ${winner}!</strong>`);
  
  // Track last N games
  lastWinners.push(winner);
  if (lastWinners.length > EVAL_BAR_GAMES) lastWinners.shift();
  updateEvalBar();

  if (winner === 'agent1') {
    agent1Wins++;
    adjustDice(diceMatrix1, agent1Moves, true, 'Agent 1'); 
    adjustDice(diceMatrix2, agent2Moves, false, 'Agent 2');
  } else {
    agent2Wins++;
    adjustDice(diceMatrix2, agent2Moves, true, 'Agent 2'); 
    adjustDice(diceMatrix1, agent1Moves, false, 'Agent 1');
  }

  updateWinChart();
  renderAll();
  updateTurnIndicator();
  
  if (isSimulating) {
    setTimeout(initGame, gameDelay > 0 ? gameDelay + 500 : 20);
  }
}

function adjustDice(matrix, moves, reinforce, agentId) {
    const actionName = reinforce ? 'verstärkt (Würfel vergrößert)' : 'schwächt (Würfel verkleinert)';
    log(`${agentId} ${actionName} seine Züge.`);
    const actionFn = reinforce ? incDie : decDie;

    for (const move of moves) {
        actionFn(matrix, move.pos, move.idx);
    }
}

function incDie(matrix, pos, idx) {
  if (matrix[pos][idx] === 0) return;
  const i = DIE_SIZES.indexOf(matrix[pos][idx]);
  if (i < DIE_SIZES.length - 1) {
    matrix[pos][idx] = DIE_SIZES[i + 1];
  }
}

function decDie(matrix, pos, idx) {
  if (matrix[pos][idx] === 0) return;
  const i = DIE_SIZES.indexOf(matrix[pos][idx]);
  if (i > 0) {
    matrix[pos][idx] = DIE_SIZES[i - 1];
  }
}

// --- UTILITIES ---
function log(msg) {
  const p = document.createElement('div');
  p.innerHTML = msg; 
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

function logMove(agentId, dice, rolls, bestMoveIndex) {
    let msg = `<strong style="color:${AGENT_COLORS[agentId]}">${agentId}</strong> würfelt auf Feld ${position}: `;
    const rollParts = rolls.map((r, i) => {
        if (dice[i] === 0) return '';
        const part = `<span style="color:${ROW_COLORS[i]}">D${dice[i]}→${r}</span>`;
        return i === bestMoveIndex ? `<b>${part}</b>` : part;
    }).filter(p => p);
    msg += rollParts.join(', ');
    msg += `. Zieht ${bestMoveIndex + 1} Schritte.`;
    log(msg);
}

function initWinChart() {
  const ctx = document.getElementById('winChart').getContext('2d');
  winChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Agent 1', 'Agent 2'],
      datasets: [{
        label: 'Siege',
        data: [agent1Wins, agent2Wins],
        backgroundColor: [AGENT_COLORS.agent1, AGENT_COLORS.agent2]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      animation: { duration: 250 }
    }
  });
}

function updateWinChart() {
  if (winChart) {
    winChart.data.datasets[0].data = [agent1Wins, agent2Wins];
    winChart.update();
  }
}