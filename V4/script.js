// --- CONSTANTS ---
// No longer need DIE_SIZES or DIE_ORDER
const ROW_COLORS = ['#f00', '#0f0', '#00f'];
const AGENT_COLORS = { agent1: '#d9534f', agent2: '#428bca' };

// --- LEARNING PARAMETERS ---
const MEAN_INCREMENT = 1.0;   // How much the mean increases/decreases
const STDDEV_FACTOR = 0.95; // Factor to shrink/grow std dev (e.g., 5 * 0.95 = 4.75)
const INITIAL_MEAN = 5.0;
const INITIAL_STDDEV = 10.0;
const MIN_MEAN = 1.0; // Prevent mean from becoming negative

// --- STATE ---
let paramMatrix1, paramMatrix2; // Replaces diceMatrix
let agent1Moves, agent2Moves;
let position, currentPlayer;
let agent1Wins = 0;
let agent2Wins = 0;
let isSimulating = false;
let gameDelay = 100;
let winChart;

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
const delaySlider = document.getElementById('delaySlider');
const delayValueEl = document.getElementById('delayValue');

// --- INITIALIZATION ---
window.onload = () => {
  setupControls();
  initGame();
  initWinChart();
};

function setupControls() {
  runPauseBtn.addEventListener('click', toggleSimulation);
  restartBtn.addEventListener('click', () => {
      isSimulating = false;
      runPauseBtn.textContent = 'Simulation starten';
      paramMatrix1 = null; // Force creation of new matrices
      paramMatrix2 = null;
      initGame();
  });
  delaySlider.addEventListener('input', () => {
    gameDelay = parseInt(delaySlider.value, 10);
    delayValueEl.textContent = gameDelay;
  });
  delayValueEl.textContent = delaySlider.value;
  gameDelay = parseInt(delaySlider.value, 10);
}

// NEW: Creates a matrix of distribution parameters
function createInitialParamMatrix() {
  return Array(10).fill(null).map((_, colIdx) => {
    return [0, 1, 2].map(rowIdx => {
      // Fields that are not on the triangle are disabled
      if (rowIdx >= (9 - colIdx)) {
        return { mean: 0, stdDev: 0, enabled: false };
      }
      return { mean: INITIAL_MEAN, stdDev: INITIAL_STDDEV, enabled: true };
    });
  });
}

function initGame() {
  if (!paramMatrix1) {
      paramMatrix1 = createInitialParamMatrix();
      paramMatrix2 = createInitialParamMatrix();
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
    renderGrid(paramMatrix1, gridEl1);
    renderGrid(paramMatrix2, gridEl2);
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

// UPDATED: Renders the distribution parameters
function renderGrid(matrix, gridEl) {
  gridEl.innerHTML = '';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const params = matrix[col][row];
      if (params.enabled) {
        // Display Mean (μ) and Standard Deviation (σ)
        cell.innerHTML = `&mu;: ${params.mean.toFixed(1)}<br>&sigma;: ${params.stdDev.toFixed(1)}`;
        cell.style.color = ROW_COLORS[row];
        // Opacity can reflect confidence (lower stdDev = higher opacity)
        cell.style.opacity = 0.5 + (1 - Math.min(params.stdDev, INITIAL_STDDEV) / INITIAL_STDDEV) * 0.5;
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

// UPDATED: "Rolls" by sampling from the Normal distribution
function gameTurn() {
    if (!isSimulating || currentPlayer === null) return;
    
    const currentAgentId = currentPlayer;
    const currentMatrix = (currentAgentId === 'agent1') ? paramMatrix1 : paramMatrix2;
    const currentMoves = (currentAgentId === 'agent1') ? agent1Moves : agent2Moves;

    // Sample a value for each possible move from its distribution
    const rolls = currentMatrix[position].map(params => {
        if (!params.enabled) return -Infinity; // Disabled moves can't be chosen
        return sampleNormal(params.mean, params.stdDev);
    });

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

// UPDATED: Calls the new learning functions
function endGame(winner) {
  currentPlayer = null; 
  const loser = winner === 'agent1' ? 'agent2' : 'agent1';
  log(`Spielende – <strong style="color:${AGENT_COLORS[winner]}">Gewinner: ${winner}!</strong>`);
  
  if (winner === 'agent1') {
    agent1Wins++;
    adjustParams(paramMatrix1, agent1Moves, true, 'Agent 1'); 
    adjustParams(paramMatrix2, agent2Moves, false, 'Agent 2');
  } else {
    agent2Wins++;
    adjustParams(paramMatrix2, agent2Moves, true, 'Agent 2'); 
    adjustParams(paramMatrix1, agent1Moves, false, 'Agent 1');
  }

  updateWinChart();
  renderAll();
  updateTurnIndicator();
  
  if (isSimulating) {
    setTimeout(initGame, gameDelay > 0 ? gameDelay + 500 : 20);
  }
}

// NEW: Adjusts parameters based on win/loss
function adjustParams(matrix, moves, reinforce, agentId) {
    const actionName = reinforce ? 'verstärkt (μ anheben, σ senken)' : 'schwächt (μ senken, σ anheben)';
    log(`${agentId} ${actionName} seine Züge.`);

    for (const move of moves) {
        const params = matrix[move.pos][move.idx];
        if (reinforce) {
            // Increase mean, decrease std dev (become stronger and more confident)
            params.mean += MEAN_INCREMENT;
            params.stdDev *= STDDEV_FACTOR;
        } else {
            // Decrease mean, increase std dev (become weaker and less confident)
            params.mean = Math.max(MIN_MEAN, params.mean - MEAN_INCREMENT);
            params.stdDev /= STDDEV_FACTOR;
        }
    }
}


// --- UTILITIES ---

// NEW: Generates a random number from a Normal distribution (Box-Muller transform)
function sampleNormal(mean, stdDev) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    // z is a sample from the standard normal distribution N(0,1)
    // Scale and shift to our desired distribution N(mean, stdDev)
    return z * stdDev + mean;
}

function log(msg) {
  const p = document.createElement('div');
  p.innerHTML = msg; 
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

// UPDATED: Logs the continuous roll values
function logMove(agentId, paramSet, rolls, bestMoveIndex) {
    let msg = `<strong style="color:${AGENT_COLORS[agentId]}">${agentId}</strong> sampelt auf Feld ${position}: `;
    const rollParts = rolls.map((r, i) => {
        if (!paramSet[i].enabled) return '';
        const part = `<span style="color:${ROW_COLORS[i]}">Wurf→${r.toFixed(2)}</span>`;
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