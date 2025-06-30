const DIE_SIZES = [4,6,8,10,12,20,100];
const DIE_ORDER = ["D4","D6","D8","D10","D12","D20","D100"];
const DIE_COLORS = ['#f00', '#0f0', '#00f'];
const SCHRITTE = [1, 2, 3];
let diceMatrix, position, currentPlayer;
let agentMoves = []; 
let trainingDone = false; 
const trackEl = document.getElementById('track');
const gridEl = document.getElementById('dice-grid');
const logEl = document.getElementById('log');
const turnEl = document.getElementById('turnIndicator');
const moveBtns = [1,2,3].map(n => document.getElementById(`move${n}`));
const restartBtn = document.getElementById('restart');


const autoHumanDelayEl = document.getElementById('autoHumanDelay');
const autoHumanDelayValueEl = document.getElementById('autoHumanDelayValue');
let autoHumanDelay = parseInt(autoHumanDelayEl.value, 10);

autoHumanDelayEl.addEventListener('input', () => {
  autoHumanDelay = parseInt(autoHumanDelayEl.value, 10);
  autoHumanDelayValueEl.textContent = autoHumanDelay;
});

document.getElementById('restart').addEventListener('click', initGame);
window.onload = () => {
  initGame();
  initWinChart();
};

const autoHumanEl = document.getElementById('autoHuman');
autoHumanEl.checked = false;
let autoHuman = false;

autoHumanEl.addEventListener('change', () => {
  autoHuman = autoHumanEl.checked;
  updateControls();
  if (autoHuman && currentPlayer === 'human' && position !== 9) {
    setTimeout(autoHumanMove, 10);
  }
});

const autoRestartEl = document.getElementById('autoRestart');
autoRestartEl.checked = false;
let autoRestart = false;

autoRestartEl.addEventListener('change', () => {
  autoRestart = autoRestartEl.checked;
  updateControls();
});


diceMatrix = Array(10).fill().map((_, rowIdx, arr) => {
  const fromBottom = arr.length - rowIdx;
  return [6,6,6].map((v, colIdx) =>
    colIdx >= (fromBottom - 1) ? 0 : 6
  );
});

function initGame() {
  position = 0;
  currentPlayer = Math.random() < 0.5 ? 'human' : 'agent';
  agentMoves = [];
  logEl.innerHTML = '';
  renderTrack(); renderGrid();
  renderAgentMovesRow();
  playerText = currentPlayer === 'human'
    ? 'Mensch'
    : 'Agent';
  log(`Spiel startet: ${playerText} beginnt.`);
  updateTurnIndicator(); updateControls();
  if (currentPlayer === 'agent') {
    setTimeout(agentMove, autoHumanDelay);
  } else if(autoHuman){
    autoHumanMove();
  }
}

function renderTrack() {
  trackEl.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell-track';

    if (i === 0) {
      const label = document.createElement('span');
      label.textContent = 'Start';
      cell.appendChild(label);
    }

    if (i === 9) {
      const label = document.createElement('span');
      label.textContent = 'Ziel';
      cell.appendChild(label);
    }

    if (i === position) {
      const piece = document.createElement('div');
      piece.className = 'piece';
      cell.appendChild(piece);
    }

    trackEl.appendChild(cell);
  }
}

function renderGrid() {
  gridEl.innerHTML = '';
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 10; col++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = diceMatrix[col][row] === 0 ? '' : `D${diceMatrix[col][row]}`;
      if (diceMatrix[col][row] !== 0) {
        cell.style.color = DIE_COLORS[row];
      }
      gridEl.appendChild(cell);
    }
  }
}

function updateTurnIndicator() {
  turnEl.textContent = currentPlayer === 'human'
    ? 'Mensch am Zug: Wähle 1, 2 oder 3 Schritte.'
    : 'Agent am Zug...';
}

function updateControls() {
  moveBtns.forEach((btn,i) => {
    btn.disabled = currentPlayer !== 'human' || position === 9 || autoHuman;
  });
  autoHumanEl.disabled = position === 9 || currentPlayer === null;
}

function log(msg) {
  const p = document.createElement('div'); p.textContent = msg;
  logEl.appendChild(p); logEl.scrollTop = logEl.scrollHeight;
}

// Menschenzug über Buttons
moveBtns.forEach((btn,i) => btn.addEventListener('click', () => {
  if (currentPlayer !== 'human') return;
  const step = i+1;
  log(`Mensch zieht ${step}`);
  movePiece(step, null, 'human');
}));

function agentMove() {
  const rolls = diceMatrix[position]
    .filter(s => s !== 0)
    .map(s => Math.floor(Math.random() * s) + 1);
  rolls.forEach((r, i) => {
    const color = DIE_COLORS[i];
    const msg = `Agent würfelt D${diceMatrix[position][i]} (${i + 1} Schritte)→${r}`;
    const p = document.createElement('div');
    const before = document.createTextNode('Agent würfelt ');
    const dieSpan = document.createElement('span');
    dieSpan.textContent = `D${diceMatrix[position][i]}`;
    dieSpan.style.color = color;
    const after = document.createTextNode(` (${i + 1} Schritte)→${r}`);
    p.appendChild(before);
    p.appendChild(dieSpan);
    p.appendChild(after);
    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  });
  const idx = rolls.indexOf(Math.max(...rolls));
  const p = document.createElement('div');
  const before = document.createTextNode('');
  const dieSpan = document.createElement('span');
  dieSpan.textContent = `D${diceMatrix[position][idx]}`;
  dieSpan.style.color = DIE_COLORS[idx];
  const after = document.createTextNode(` ist am größten. Agent zieht ${idx+1} Schritte.`);
  p.appendChild(before);
  p.appendChild(dieSpan);
  p.appendChild(after);
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
  agentMoves.push({ pos: position, idx });
  movePiece(idx+1, idx, 'agent');
}

function movePiece(step, dieIdx, who) {
  position = Math.min(position + step, 9);
  renderTrack(); renderGrid();
  renderAgentMovesRow(); 
  if (position === 9) return endGame(who);
  currentPlayer = who==='human'?'agent':'human';
  updateTurnIndicator(); updateControls();
  if (currentPlayer==='agent') setTimeout(agentMove, autoHumanDelay);
  if (currentPlayer==='human' && autoHuman && position !== 9) setTimeout(autoHumanMove, autoHumanDelay);
}

function incDie(pos, idx) {
  if (diceMatrix[pos][idx] === 0) return;
  const old = diceMatrix[pos][idx];
  const i = DIE_SIZES.indexOf(old);
  if (i < DIE_SIZES.length - 1) {
    const next = DIE_SIZES[i + 1];
    diceMatrix[pos][idx] = next;
    log(`Aktualisiere Würfel Feld ${pos}, Reihe ${idx + 1}: ${old}→${next}`);
    renderGrid();
  } else {
    log(`Würfel Feld ${pos}, Reihe ${idx + 1} ist bereits D100 und kann nicht weiter erhöht werden.`);
  } 
}

function decDie(pos, idx) {
  if (diceMatrix[pos][idx] === 0) return;
  const old = diceMatrix[pos][idx];
  const i = DIE_SIZES.indexOf(old);
  if (i > 0) {
    const next = DIE_SIZES[i - 1];
    diceMatrix[pos][idx] = next;
    log(`Aktualisiere Würfel Feld ${pos}, Reihe ${idx + 1}: ${old}→${next}`);
    renderGrid();
  } else {
    log(`Würfel Feld ${pos}, Reihe ${idx + 1} ist bereits D4 und kann nicht weiter verringert werden.`);
  }
}

function adjustDiceAfterGame(winner) {
  if (agentMoves.length == 0 || trainingDone) return;
  agentMoves.reverse();
 
  if(winner === 'human') {
    adjustDiceAfterWin(agentMoves, false);
  } else {
    adjustDiceAfterWin(agentMoves, true);
  }

}

function getNextDieType(type) {
  const idx = DIE_ORDER.indexOf(type);
  return idx >= 0 && idx < DIE_ORDER.length - 1
    ? DIE_ORDER[idx + 1]
    : null;
}
function getPrevDieType(type) {
  const idx = DIE_ORDER.indexOf(type);
  return idx > 0
    ? DIE_ORDER[idx - 1]
    : null;
}

function adjustDiceAfterWin(moves, isAgent) {
  log(`${isAgent ? 'Agent' : 'Mensch'} hat gewonnen! Würfel werden ${isAgent ? 'vergrößert' : 'verkleinert'}.`);

  // Wähle passende Helfer je nach Gewinner
  const targetTypeFn = isAgent ? getNextDieType : getPrevDieType;
  const actionFn     = isAgent ? incDie         : decDie;
  const extremeType  = isAgent ? "D100"         : "D4";

  // 1. Suche ersten veränderbaren Würfel
  for (let i = 0; i < moves.length; i++) {
    const { pos, idx } = moves[i];
    const currentType  = "D" + diceMatrix[pos][idx];
    const newType      = targetTypeFn(currentType);

    // wenn dieser Würfel noch geändert werden kann...
    if (newType) {
      // 2. verändere ihn
      actionFn(pos, idx);

      // 3. wenn es **nicht** der erste Zug ist, verändere zusätzlich den Nachfolger
      if (i > 0 && i + 1 < moves.length) {
        const { pos: nPos, idx: nIdx } = moves[i + 1];
        const succType = targetTypeFn("D" + diceMatrix[nPos][nIdx]);
        if (succType) {
          actionFn(nPos, nIdx);
        }
      }

      // fertig – abbrechen
      return;
    }
  }

  // 4. Agent-Fall: kein Würfel mehr veränderbar → Training abschließen
  if (isAgent) {
    trainingDone = true;
    log('Training abgeschlossen!');
  }
}

function endGame(who) {
  adjustDiceAfterGame(who);
  const winner = who==='human'?'Mensch':'Agent';
  log(`Spielende – Gewinner: ${winner}`);
  if (who === 'human') {
    humanWins++;
  } else {
    agentWins++;
  }
  updateWinChart();
  currentPlayer = null; updateTurnIndicator(); updateControls();
  if ((autoHuman && !trainingDone) || autoRestart) {
    setTimeout(initGame, autoHumanDelay);
  }
}



function autoHumanMove() {
  if (currentPlayer !== 'human' || position === 9 || !autoHuman) return;
  const step = SCHRITTE[Math.floor(Math.random() * SCHRITTE.length)];
  log(`(Auto) Mensch zieht ${step}`);
  movePiece(step, null, 'human');
}

let agentWins = 0;
let humanWins = 0;

let winChart;
function initWinChart() {
  const ctx = document.getElementById('winChart').getContext('2d');
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

function renderAgentMovesRow() {
  const rowEl = document.getElementById('agent-moves-row');
  rowEl.innerHTML = '';
  for (let col = 0; col < 10; col++) {
    const cell = document.createElement('div');
    cell.className = 'cell agent-move-cell';
    // Find the agent move for this position, if any
    const move = agentMoves.find(m => m.pos === col);
    if (move) {
      cell.textContent = `${move.idx + 1} Schritte`;
      cell.style.color = DIE_COLORS[move.idx];
    } else {
      cell.textContent = '';
    }
    rowEl.appendChild(cell);
  }
}


