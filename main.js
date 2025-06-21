const COLS = 10, ROWS = 20, BLOCK_SIZE = 30, DROP_INTERVAL = 1000;

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let current, next, nextQueue;
let held = null, canHold = true, lastDrop = Date.now(), softDropping = false, isPaused = false, showPauseMenu = false;
let score = 0, level = 1, linesCleared = 0;

let aiPlaying = false, aiMoveInterval = null, aiMoveSequence = [], aiMoveStep = 0, aiMoveDelay = 50, aiExecuting = false;

// Canvas variables - will be initialized after DOM loads
let canvas, ctx, holdCanvas, holdCtx, nextCanvas, nextCtx;

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
  const scoreElement = document.getElementById('scoreValue');
  const levelElement = document.getElementById('levelValue');
  const linesElement = document.getElementById('linesValue');
  
  if (scoreElement) scoreElement.textContent = score;
  if (levelElement) levelElement.textContent = level;
  if (linesElement) linesElement.textContent = linesCleared;
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
  try {
    if (!ctx) {
      console.error('❌ No canvas context in drawGrid');
      return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000'; // background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Draw horizontal lines
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); 
      ctx.moveTo(0, r * BLOCK_SIZE); 
      ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE); 
      ctx.stroke();
    }
    
    // Draw vertical lines
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); 
      ctx.moveTo(c * BLOCK_SIZE, 0); 
      ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE); 
      ctx.stroke();
    }
  } catch (error) {
    console.error('❌ Error in drawGrid:', error);
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
  try {
    if (!canvas || !ctx) {
      console.error('❌ Canvas or context not available for drawing');
      return;
    }
    
    drawGrid();
    drawBoard();
    if (current) drawPiece(current);
    drawHoldArea();
    drawNextArea();
    if (isPaused && showPauseMenu) drawPauseMenu();
  } catch (error) {
    console.error('❌ Error in draw function:', error);
  }
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
  try {
    if (canvas && ctx) {
      update();
      draw();
      updateScoreDisplay();
    }
    requestAnimationFrame(gameLoop);
  } catch (error) {
    console.error('Game loop error:', error);
    // Continue the loop even if there's an error
    requestAnimationFrame(gameLoop);
  }
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

// AI integration
let aiInterval = null;
let aiTargetX = 0;
let aiTargetRot = 0;
let aiUseHold = false;

function toggleAI() {
  aiPlaying = !aiPlaying;
  if (aiPlaying) {
    document.getElementById('aiSolveButton').textContent = 'Stop AI';
    document.getElementById('aiSolveButton').style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
    aiInterval = setInterval(executeAIMove, 1000); // 1 second between moves
    addToConsole('🤖 AI Started - Clean and smooth');
  } else {
    document.getElementById('aiSolveButton').textContent = 'AI Solve';
    document.getElementById('aiSolveButton').style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    if (aiInterval) {
      clearInterval(aiInterval);
      aiInterval = null;
    }
    aiExecuting = false;
    addToConsole('🤖 AI Stopped');
  }
}

function executeAIMove() {
  if (!current || !aiPlaying || aiExecuting) return;
  
  try {
    aiExecuting = true;
    
    // Convert board to binary format
    const boardArr = board.map(row => row.map(cell => (cell ? 1 : 0)));
    
    // Get next pieces
    const nextPieces = [next, ...nextQueue];
    
    // Call AI
    const bestMove = window.findBestMove(boardArr, current, held, nextPieces);
    
    if (bestMove) {
      addToConsole(`🤖 AI: ${bestMove.useHold ? 'HOLD' : 'CURRENT'} → x:${bestMove.x}, rot:${bestMove.rot}`);
      
      // Store target for smooth movement
      aiTargetX = bestMove.x;
      aiTargetRot = bestMove.rot;
      aiUseHold = bestMove.useHold;
      
      // Execute hold if needed
      if (bestMove.useHold && canHold) {
        holdPiece();
        addToConsole('🔧 Hold executed');
      }
      
      // Start smooth movement
      executeSmoothMovement();
      
    } else {
      addToConsole('❌ No valid move - dropping piece');
      // Fallback: just drop the piece
      while (isValidMove(current, 0, 1)) current.y++;
      placePiece(current);
      spawnNewPiece();
      draw();
      aiExecuting = false;
    }
  } catch (error) {
    console.error('AI Error:', error);
    addToConsole(`❌ AI Error: ${error.message}`);
    aiExecuting = false;
  }
}

function executeSmoothMovement() {
  if (!aiExecuting) return;
  
  let moved = false;
  
  // Rotate piece if needed
  if (aiTargetRot > 0) {
    const rotated = rotate(current.shape);
    if (isValidMove(current, 0, 0, rotated)) {
      current.shape = rotated;
      aiTargetRot--;
      moved = true;
      addToConsole('🔄 Rotated piece');
    }
  }
  
  // Move horizontally if needed
  if (!moved && aiTargetX !== current.x) {
    if (aiTargetX > current.x && isValidMove(current, 1, 0)) {
      current.x++;
      moved = true;
    } else if (aiTargetX < current.x && isValidMove(current, -1, 0)) {
      current.x--;
      moved = true;
    }
  }
  
  // If no more movement needed, drop the piece
  if (!moved && aiTargetRot === 0 && aiTargetX === current.x) {
    // Hard drop
    while (isValidMove(current, 0, 1)) current.y++;
    placePiece(current);
    spawnNewPiece();
    
    if (!isValidMove(current, 0, 0)) {
      addToConsole('GAME OVER - restarting game');
      resetGame();
    }
    
    draw();
    aiExecuting = false;
    return;
  }
  
  // Continue movement
  draw();
  setTimeout(executeSmoothMovement, 100); // 100ms between steps
}

// AI button event listener - add when DOM is ready
function setupAIButton() {
  const aiButton = document.getElementById('aiSolveButton');
  if (aiButton) {
    aiButton.addEventListener('click', toggleAI);
    console.log('✅ AI button event listener added');
  } else {
    console.error('❌ AI button not found');
  }
}

// Debug: Confirm main.js is loaded and functions are available
console.log('🎯 Main.js loaded successfully!');
console.log('🔧 findBestMove available:', typeof window.findBestMove);
console.log('🔧 evaluateBoard available:', typeof window.evaluateBoard);

// Diagnostic function
function runDiagnostics() {
  console.log('🔍 Running diagnostics...');
  console.log('Canvas elements:');
  console.log('- gameCanvas:', !!document.getElementById('gameCanvas'));
  console.log('- holdCanvas:', !!document.getElementById('holdCanvas'));
  console.log('- nextCanvas:', !!document.getElementById('nextCanvas'));
  console.log('- aiSolveButton:', !!document.getElementById('aiSolveButton'));
  console.log('- consoleOutput:', !!document.getElementById('consoleOutput'));
  
  console.log('Game state:');
  console.log('- canvas:', !!canvas);
  console.log('- ctx:', !!ctx);
  console.log('- current:', !!current);
  console.log('- board:', board ? board.length : 'null');
  
  console.log('AI state:');
  console.log('- findBestMove:', typeof window.findBestMove);
  console.log('- evaluateBoard:', typeof window.evaluateBoard);
}

// Initialize game when DOM is ready
function startGame() {
  console.log('🚀 Starting game initialization...');
  runDiagnostics();
  
  if (initializeCanvas()) {
    console.log('✅ Canvas initialized, testing...');
    
    // Test canvas functionality
    if (!testCanvas()) {
      console.error('❌ Canvas test failed - game cannot start');
      addToConsole('❌ ERROR: Canvas test failed - game cannot start');
      return;
    }
    
    // Initialize game pieces
    initializeGamePieces();
    
    // Setup AI button
    setupAIButton();
    
    addToConsole('TET.DIRA AI Console initialized');
    addToConsole('Press AI Solve to start the AI');
    addToConsole('Press R to restart game manually');
    addToConsole('Game starting...');
    addToConsole(`Initial piece: ${current.color} at (${current.x}, ${current.y})`);
    
    // Start the game loop
    gameLoop();
    console.log('✅ Game started successfully!');
  } else {
    console.error('❌ Failed to initialize canvas - game cannot start');
    addToConsole('❌ ERROR: Canvas initialization failed - game cannot start');
  }
}

// Initialize game pieces after all functions are defined
function initializeGamePieces() {
  current = randomPiece();
  next = randomPiece();
  nextQueue = [randomPiece(), randomPiece()];
  console.log('✅ Game pieces initialized');
}

// Start game when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}

// Initialize canvas elements after DOM loads
function initializeCanvas() {
  try {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('Game canvas not found!');
      return false;
    }
    ctx = canvas.getContext('2d');
    
    holdCanvas = document.getElementById('holdCanvas');
    if (!holdCanvas) {
      console.error('Hold canvas not found!');
      return false;
    }
    holdCtx = holdCanvas.getContext('2d');
    
    nextCanvas = document.getElementById('nextCanvas');
    if (!nextCanvas) {
      console.error('Next canvas not found!');
      return false;
    }
    nextCtx = nextCanvas.getContext('2d');
    
    console.log('✅ Canvas elements initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing canvas:', error);
    return false;
  }
}

// Test canvas functionality
function testCanvas() {
  try {
    if (!canvas || !ctx) {
      console.error('❌ Canvas not available for testing');
      return false;
    }
    
    // Draw a test rectangle
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 100, 100);
    console.log('✅ Canvas test: Red rectangle drawn');
    
    // Clear it
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('✅ Canvas test: Canvas cleared');
    
    return true;
  } catch (error) {
    console.error('❌ Canvas test failed:', error);
    return false;
  }
}
