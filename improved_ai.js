// Improved Tetris AI with advanced heuristics and lookahead

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

function placePiece(board, shape, x, y) {
  let newBoard = board.map(row => row.slice());
  for(let r=0; r < shape.length; r++) {
    for(let c=0; c < shape[r].length; c++) {
      if(shape[r][c]) {
        const bx = x + c;
        const by = y + r;
        if(by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          newBoard[by][bx] = 1;
        }
      }
    }
  }
  return newBoard;
}

function clearLines(board) {
  let newBoard = [];
  let linesCleared = 0;
  for (let r=0; r < ROWS; r++) {
    if (board[r].every(cell => cell)) {
      linesCleared++;
    } else {
      newBoard.push(board[r]);
    }
  }
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0));
  }
  return {board: newBoard, linesCleared};
}

function getLegalMoves(board, pieceId) {
  let baseShape = PIECES[pieceId];
  let moves = [];
  for(let rot=0; rot < 4; rot++) {
    let shape = baseShape;
    for(let i=0; i < rot; i++) shape = rotate(shape);
    const width = shape[0].length;
    for(let x = -2; x <= COLS - width + 2; x++) {
      let y = -4;
      while(canPlace(board, shape, x, y+1)) y++;
      if(canPlace(board, shape, x, y)) {
        moves.push({x, y, rot, shape});
      }
    }
  }
  return moves;
}

// Advanced board evaluation with multiple heuristics
function evaluateBoard(board, linesCleared = 0) {
  let aggregateHeight = 0, holes = 0, bumpiness = 0;
  let heights = [];
  let wells = 0;
  let rowTransitions = 0;
  let colTransitions = 0;
  let holesBelowBlocks = 0;
  let wellSums = 0;
  
  // Calculate column heights and holes
  for (let c = 0; c < COLS; c++) {
    let colHeight = 0;
    let blockFound = false;
    let holeCount = 0;
    let wellDepth = 0;
    
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c]) {
        if (!blockFound) {
          colHeight = ROWS - r;
          blockFound = true;
        }
      } else if (blockFound) {
        holeCount++;
        holesBelowBlocks++;
      }
      
      // Check for wells (empty columns)
      if (!board[r][c]) {
        wellDepth++;
      } else {
        if (wellDepth > 0) {
          wells += wellDepth;
          wellSums += wellDepth * wellDepth;
        }
        wellDepth = 0;
      }
    }
    
    heights[c] = colHeight;
    holes += holeCount;
    aggregateHeight += colHeight;
  }
  
  // Calculate bumpiness (height differences between adjacent columns)
  for (let c = 0; c < COLS - 1; c++) {
    bumpiness += Math.abs(heights[c] - heights[c+1]);
  }
  
  // Calculate row and column transitions
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 1; c++) {
      if (board[r][c] !== board[r][c+1]) rowTransitions++;
    }
    if (board[r][0]) rowTransitions++;
    if (board[r][COLS-1]) rowTransitions++;
  }
  
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 1; r++) {
      if (board[r][c] !== board[r+1][c]) colTransitions++;
    }
    if (board[0][c]) colTransitions++;
    if (board[ROWS-1][c]) colTransitions++;
  }
  
  // Advanced scoring weights (tuned for better performance)
  const weights = {
    aggregateHeight: -0.51066,
    linesCleared: 0.760666,
    holes: -0.35663,
    bumpiness: -0.184483,
    rowTransitions: -0.184483,
    colTransitions: -0.184483,
    wells: -0.1,
    wellSums: -0.01,
    holesBelowBlocks: -0.5
  };
  
  return weights.aggregateHeight * aggregateHeight
       + weights.linesCleared * linesCleared
       + weights.holes * holes
       + weights.bumpiness * bumpiness
       + weights.rowTransitions * rowTransitions
       + weights.colTransitions * colTransitions
       + weights.wells * wells
       + weights.wellSums * wellSums
       + weights.holesBelowBlocks * holesBelowBlocks;
}

// Lookahead evaluation for next pieces
function evaluateWithLookahead(board, currentId, holdId, nextIds, depth = 2) {
  if (depth === 0) {
    return evaluateBoard(board);
  }
  
  let bestScore = -Infinity;
  let pieces = [currentId];
  if (holdId !== null) pieces.push(holdId);
  
  for (let pieceId of pieces) {
    let moves = getLegalMoves(board, pieceId);
    for (let move of moves) {
      let newBoard = placePiece(board, move.shape, move.x, move.y);
      let clearedData = clearLines(newBoard);
      let score = evaluateBoard(clearedData.board, clearedData.linesCleared);
      
      // Recursive lookahead
      if (nextIds && nextIds.length > 0) {
        let nextScore = evaluateWithLookahead(
          clearedData.board,
          nextIds[0],
          holdId,
          nextIds.slice(1),
          depth - 1
        );
        score += nextScore * 0.8; // Weight for future moves
      }
      
      if (score > bestScore) {
        bestScore = score;
      }
    }
  }
  
  return bestScore;
}

// Main AI function that finds the best move
function findBestMove(board, current, held, nextQueue) {
  let currentId = getPieceId(current);
  let holdId = held ? getPieceId(held) : null;
  let nextIds = nextQueue.map(piece => getPieceId(piece));
  
  let bestMove = null;
  let bestScore = -Infinity;
  
  // Try current piece without using hold
  let moves = getLegalMoves(board, currentId);
  for (let move of moves) {
    let newBoard = placePiece(board, move.shape, move.x, move.y);
    let clearedData = clearLines(newBoard);
    let score = evaluateWithLookahead(clearedData.board, currentId, holdId, nextIds, 2);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = {
        useHold: false,
        x: move.x,
        y: move.y,
        rot: move.rot,
        shape: move.shape
      };
    }
  }
  
  // Try hold piece if available
  if (holdId !== null) {
    moves = getLegalMoves(board, holdId);
    for (let move of moves) {
      let newBoard = placePiece(board, move.shape, move.x, move.y);
      let clearedData = clearLines(newBoard);
      let score = evaluateWithLookahead(clearedData.board, currentId, holdId, nextIds, 2);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = {
          useHold: true,
          x: move.x,
          y: move.y,
          rot: move.rot,
          shape: move.shape
        };
      }
    }
  }
  
  return bestMove;
}

// Export for use in main.js
window.findBestMove = findBestMove;
window.evaluateBoard = evaluateBoard; 