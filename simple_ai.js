// Clean, efficient Tetris AI

// Get global constants safely
function getGameConstants() {
  if (typeof COLS === 'undefined' || typeof ROWS === 'undefined') {
    return { COLS: 10, ROWS: 20 }; // fallback
  }
  return { COLS, ROWS };
}

const PIECES = [
  [[1,1,1,1]],          // I
  [[1,1],[1,1]],        // O
  [[0,1,0],[1,1,1]],    // T
  [[0,1,1],[1,1,0]],    // S
  [[1,1,0],[0,1,1]],    // Z
  [[1,0,0],[1,1,1]],    // J
  [[0,0,1],[1,1,1]]     // L
];

function getPieceId(piece) {
  if (!piece || !piece.shape) return 0;
  const shape = piece.shape;
  for (let i = 0; i < PIECES.length; i++) {
    if (JSON.stringify(shape) === JSON.stringify(PIECES[i])) {
      return i;
    }
  }
  return 0;
}

function rotate(shape) {
  const h = shape.length;
  const w = shape[0].length;
  let out = Array.from({length: w}, () => Array(h).fill(0));
  for(let r=0; r < h; r++) {
    for(let c=0; c < w; c++) {
      out[c][h - 1 - r] = shape[r][c];
    }
  }
  return out;
}

function canPlace(board, shape, x, y) {
  const { COLS, ROWS } = getGameConstants();
  for(let r=0; r < shape.length; r++) {
    for(let c=0; c < shape[r].length; c++) {
      if(shape[r][c]) {
        const bx = x + c;
        const by = y + r;
        if(bx < 0 || bx >= COLS || by >= ROWS) return false;
        if(by >= 0 && board[by][bx]) return false;
      }
    }
  }
  return true;
}

function getDropHeight(board, shape, x) {
  const { ROWS } = getGameConstants();
  let y = 0;
  while(canPlace(board, shape, x, y + 1)) y++;
  return y;
}

function getLegalMoves(board, pieceId) {
  const { COLS } = getGameConstants();
  let baseShape = PIECES[pieceId];
  let moves = [];
  
  for(let rot=0; rot < 4; rot++) {
    let shape = baseShape;
    for(let i=0; i < rot; i++) shape = rotate(shape);
    const width = shape[0].length;
    
    for(let x = 0; x <= COLS - width; x++) {
      const y = getDropHeight(board, shape, x);
      if(canPlace(board, shape, x, y)) {
        moves.push({x, y, rot, shape});
      }
    }
  }
  return moves;
}

// Clean board evaluation
function evaluateBoard(board) {
  const { COLS, ROWS } = getGameConstants();
  let height = 0, holes = 0, bumpiness = 0, completeLines = 0;
  let heights = [];
  
  // Calculate column heights and holes
  for (let c = 0; c < COLS; c++) {
    let colHeight = 0;
    let blockFound = false;
    let holeCount = 0;
    
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c]) {
        if (!blockFound) {
          colHeight = ROWS - r;
          blockFound = true;
        }
      } else if (blockFound) {
        holeCount++;
      }
    }
    
    heights[c] = colHeight;
    holes += holeCount;
    height += colHeight;
  }
  
  // Calculate bumpiness
  for (let c = 0; c < COLS - 1; c++) {
    bumpiness += Math.abs(heights[c] - heights[c+1]);
  }
  
  // Count complete lines
  for (let r = 0; r < ROWS; r++) {
    if (board[r].every(cell => cell !== 0)) {
      completeLines++;
    }
  }
  
  // Simple scoring
  return -0.5 * height - 0.4 * holes - 0.2 * bumpiness + 0.8 * completeLines;
}

// Simulate piece placement
function simulatePlacement(board, piece, x, y, rot) {
  const { COLS, ROWS } = getGameConstants();
  
  // Create board copy
  let newBoard = board.map(row => [...row]);
  
  // Get rotated shape
  let shape = piece.shape;
  for (let i = 0; i < rot; i++) {
    shape = rotate(shape);
  }
  
  // Place piece
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardX = x + c;
        const boardY = y + r;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          newBoard[boardY][boardX] = 1;
        }
      }
    }
  }
  
  // Clear complete lines
  for (let r = ROWS - 1; r >= 0; r--) {
    if (newBoard[r].every(cell => cell !== 0)) {
      newBoard.splice(r, 1);
      newBoard.unshift(Array(COLS).fill(0));
    }
  }
  
  return evaluateBoard(newBoard);
}

function findBestMove(board, current, held, nextQueue) {
  try {
    const { COLS } = getGameConstants();
    
    let currentId = getPieceId(current);
    let holdId = held ? getPieceId(held) : null;
    
    let bestScore = -Infinity;
    let bestMove = null;
    let useHold = false;
    
    // Try current piece
    let currentMoves = getLegalMoves(board, currentId);
    for (let move of currentMoves) {
      const score = simulatePlacement(board, current, move.x, move.y, move.rot);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
        useHold = false;
      }
    }
    
    // Try hold piece if available
    if (holdId !== null) {
      let holdMoves = getLegalMoves(board, holdId);
      for (let move of holdMoves) {
        const score = simulatePlacement(board, held, move.x, move.y, move.rot);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
          useHold = true;
        }
      }
    }
    
    if (bestMove) {
      return {
        useHold: useHold,
        x: bestMove.x,
        y: bestMove.y,
        rot: bestMove.rot,
        shape: bestMove.shape
      };
    }
    
    return null;
  } catch (error) {
    console.error('AI Error:', error);
    return null;
  }
}

// Export functions
window.findBestMove = findBestMove;
window.evaluateBoard = evaluateBoard;

console.log('🚀 Clean AI loaded successfully!'); 