const COLS = 10, ROWS = 20, BLOCK_SIZE = 30, DROP_INTERVAL = 1000;

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let current = randomPiece(), next = randomPiece(), nextQueue = [randomPiece(), randomPiece()];
let held = null, canHold = true, lastDrop = Date.now(), softDropping = false, isPaused = false, showPauseMenu = false;
let score = 0, level = 1, linesCleared = 0;

let aiPlaying = false, aiMoveInterval = null, aiMoveSequence = [], aiMoveStep = 0, aiMoveDelay = 50;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

let consoleOutput = [];
const MAX_CONSOLE_LINES = 50;
function addToConsole(message) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMessage = `[${timestamp}] ${message}`;
  consoleOutput.push(formattedMessage);
  if (consoleOutput.length > MAX_CONSOLE_LINES) consoleOutput.shift();
  updateConsoleDisplay();
  console.log(message);
}
function updateConsoleDisplay() {
  const consoleElement = document.getElementById('consoleOutput');
  if (consoleElement) {
    consoleElement.value = consoleOutput.join('\n');
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }
}
function updateScoreDisplay() {
  document.getElementById('scoreValue').textContent = score;
  document.getElementById('levelValue').textContent = level;
  document.getElementById('linesValue').textContent = linesCleared;
}
function randomPiece() {
  const SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,1],[1,1,0]],
    [[1,1,0],[0,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[0,1,0],[1,1,1]]
  ];
  const COLORS = ['#00ffff','#ffff00','#00ff00','#ff0000','#0000ff','#ff8800','#ff00ff'];
  const idx = Math.floor(Math.random() * SHAPES.length);
  return { x: 3, y: 0, shape: SHAPES[idx], color: COLORS[idx] };
}
// Rotate matrix clockwise
function rotate(matrix) { 
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse()); 
}
// Rotate matrix counter-clockwise
function rotateCCW(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  let result = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[cols - 1 - c][r] = matrix[r][c];
    }
  }
  return result;
}
function isValidMove(piece, dx = 0, dy = 0, newShape = null, useBoard = null) {
  const shape = newShape || piece.shape;
  const newX = piece.x + dx, newY = piece.y + dy, boardToUse = useBoard || board;
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardX = newX + col, boardY = newY + row;
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false;
        if (boardY >= 0 && boardToUse[boardY][boardX]) return false;
      }
    }
  }
  return true;
}
function placePiece(piece) {
  piece.shape.forEach((row, dy) => {
    row.forEach((value, dx) => {
      if (value) {
        const boardY = piece.y + dy, boardX = piece.x + dx;
        if (boardY >= 0) board[boardY][boardX] = piece.color;
      }
    });
  });
  clearLinesImmediate();
  draw(); // redraw immediately after clearing lines
}
function clearLinesImmediate() {
  let linesToClear = [];
  for (let row = 0; row < ROWS; row++) {
    if (board[row].every(cell => cell !== 0)) {
      linesToClear.push(row);
    }
  }
  if (linesToClear.length === 0) return;
  linesToClear.sort((a, b) => b - a);
  linesToClear.forEach(row => {
    board.splice(row, 1);
    board.unshift(Array(COLS).fill(0));
  });
  let linesClearedThisTime = linesToClear.length;
  linesCleared += linesClearedThisTime;
  let points = 0;
  switch (linesClearedThisTime) {
    case 1: points = 100 * level; break;
    case 2: points = 300 * level; break;
    case 3: points = 500 * level; break;
    case 4: points = 800 * level; break;
  }
  score += points;
  level = Math.floor(linesCleared / 10) + 1;
}
function holdPiece() {
  if (!canHold) return;
  if (held === null) {
    held = { ...current, x: 0, y: 0 };
    current = { ...next, x: 3, y: 0 };
    next = nextQueue.shift();
    nextQueue.push(randomPiece());
  } else {
    const temp = { ...current, x: 0, y: 0 };
    current = { ...held, x: 3, y: 0 };
    held = temp;
  }
  canHold = false;
}
function spawnNewPiece() {
  current = { ...next, x: 3, y: 0 };
  next = nextQueue.shift();
  nextQueue.push(randomPiece());
  canHold = true;
  if (!isValidMove(current, 0, 0)) {
    addToConsole('GAME OVER - restarting game');
    resetGame();
  }
}
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000'; // background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#333';
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * BLOCK_SIZE); ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * BLOCK_SIZE, 0); ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE); ctx.stroke();
  }
}
function drawPiece(piece) {
  ctx.fillStyle = piece.color;
  piece.shape.forEach((row, dy) => {
    row.forEach((value, dx) => {
      if (value) {
        ctx.fillRect(
          (piece.x + dx) * BLOCK_SIZE,
          (piece.y + dy) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });
}
function drawBoard() {
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        ctx.fillStyle = value;
        ctx.fillRect(
          x * BLOCK_SIZE,
          y * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });
}
function drawPieceInArea(piece, ctx, blockSize = 20) {
  if (!piece) return;
  ctx.fillStyle = piece.color;
  piece.shape.forEach((row, dy) => {
    row.forEach((value, dx) => {
      if (value) {
        ctx.fillRect(dx * blockSize, dy * blockSize, blockSize - 1, blockSize - 1);
      }
    });
  });
}
function drawHoldArea() {
  holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (held) {
    const blockSize = 20;
    const pieceWidth = held.shape[0].length * blockSize;
    const pieceHeight = held.shape.length * blockSize;
    const offsetX = (holdCanvas.width - pieceWidth) / 2;
    const offsetY = (holdCanvas.height - pieceHeight) / 2;
    holdCtx.save();
    holdCtx.translate(offsetX, offsetY);
    drawPieceInArea(held, holdCtx, blockSize);
    holdCtx.restore();
  }
}
function drawNextArea() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const pieces = [next, ...nextQueue];
  const blockSize = 12;
  const pieceSpacing = 50;
  pieces.forEach((piece, index) => {
    if (!piece) return;
    const pieceWidth = piece.shape[0].length * blockSize;
    const pieceHeight = piece.shape.length * blockSize;
    const offsetX = (nextCanvas.width - pieceWidth) / 2;
    const offsetY = index * pieceSpacing + 10;
    nextCtx.save();
    nextCtx.translate(offsetX, offsetY);
    drawPieceInArea(piece, nextCtx, blockSize);
    nextCtx.restore();
  });
}
function drawPauseMenu() {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "20px sans-serif";
  ctx.fillText("ESC to Resume", canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("R to Restart", canvas.width / 2, canvas.height / 2 + 40);
  ctx.restore();
}
function draw() {
  drawGrid();
  drawBoard();
  if (current) drawPiece(current);
  drawHoldArea();
  drawNextArea();
  if (isPaused && showPauseMenu) drawPauseMenu();
}
function update() {
  if (isPaused) return;
  const now = Date.now();
  const interval = softDropping ? 50 : DROP_INTERVAL;
  if (now - lastDrop > interval) {
    if (isValidMove(current, 0, 1)) {
      current.y++;
    } else {
      placePiece(current);
      spawnNewPiece();
    }
    lastDrop = now;
  }
}
function gameLoop() {
  update();
  draw();
  updateScoreDisplay();
  requestAnimationFrame(gameLoop);
}
function resetGame() {
  board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  current = randomPiece();
  next = randomPiece();
  nextQueue = [randomPiece(), randomPiece()];
  held = null;
  canHold = true;
  score = 0;
  level = 1;
  linesCleared = 0;
  lastDrop = Date.now();
  isPaused = false;
  showPauseMenu = false;
  if (aiPlaying) {
    aiPlaying = false;
    if (aiMoveInterval) {
      clearInterval(aiMoveInterval);
      aiMoveInterval = null;
    }
    document.getElementById('aiSolveButton').textContent = 'AI Solve';
    document.getElementById('aiSolveButton').style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
  }
}
// Manual Controls (fixed and robust)
document.addEventListener('keydown', e => {
  if (isPaused && showPauseMenu) {
    if (e.key === 'Escape') {
      isPaused = false;
      showPauseMenu = false;
      draw();
    }
    if (e.key === 'r' || e.key === 'R') {
      resetGame();
      isPaused = false;
      showPauseMenu = false;
      draw();
    }
    return;
  }
  if (e.key === 'Escape') {
    isPaused = !isPaused;
    showPauseMenu = isPaused;
    draw();
    return;
  }
  if (isPaused) return;
  if (!current) return;
  switch (e.key) {
    case 'ArrowLeft': if (isValidMove(current, -1, 0)) current.x--; break;
    case 'ArrowRight': if (isValidMove(current, 1, 0)) current.x++; break;
    case 'ArrowDown': softDropping = true; if (isValidMove(current, 0, 1)) current.y++; break;
    case 'z': case 'Z': {
      const rotatedCCW = rotateCCW(current.shape);
      if (isValidMove(current, 0, 0, rotatedCCW)) current.shape = rotatedCCW;
      break;
    }
    case 'x': case 'X': {
      const rotated = rotate(current.shape);
      if (isValidMove(current, 0, 0, rotated)) current.shape = rotated;
      break;
    }
    case ' ': case 'ArrowUp': { // hard drop
      while (isValidMove(current, 0, 1)) current.y++;
      placePiece(current);
      spawnNewPiece();
      if (!isValidMove(current, 0, 0)) {
        addToConsole('GAME OVER - restarting game');
        resetGame();
      }
      break;
    }
    case 'Shift': holdPiece(); break;
  }
  draw();
});
document.addEventListener('keyup', e => { if (e.key === 'ArrowDown') softDropping = false; });
document.getElementById('aiSolveButton').addEventListener('click', toggleAI);
addToConsole('TET.DIRA AI Console initialized');
addToConsole('Press AI Solve to start the AI');
addToConsole('Press R to restart game manually');
addToConsole('Game starting...');
addToConsole(`Initial piece: ${current.color} at (${current.x}, ${current.y})`);
gameLoop();
