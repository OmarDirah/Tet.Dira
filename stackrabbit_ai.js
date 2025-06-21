// stackrabbit_ai.js - simplified StackRabbit AI core adapted for browser Tetris

const StackRabbitAI = (() => {
  // Tetris constants
  const COLS = 10;
  const ROWS = 20;
  
  // Pieces and rotations (same order as your SHAPES)
  const PIECES = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]], // Z
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]]  // L
  ];
  
  // Rotate function (clockwise)
  function rotate(shape) {
    const h = shape.length;
    const w = shape[0].length;
    let result = Array.from({length: w}, () => Array(h).fill(0));
    for (let r=0; r < h; r++) {
      for (let c=0; c < w; c++) {
        result[c][h-1-r] = shape[r][c];
      }
    }
    return result;
  }

  // Check if piece fits at position
  function canPlace(board, piece, x, y) {
    for (let r=0; r < piece.length; r++) {
      for (let c=0; c < piece[r].length; c++) {
        if (piece[r][c]) {
          let boardX = x + c;
          let boardY = y + r;
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false;
          if (boardY >= 0 && board[boardY][boardX]) return false;
        }
      }
    }
    return true;
  }
  
  // Place piece on board clone, return new board
  function placePiece(board, piece, x, y) {
    let newBoard = board.map(row => row.slice());
    for (let r=0; r < piece.length; r++) {
      for (let c=0; c < piece[r].length; c++) {
        if (piece[r][c]) {
          let boardX = x + c;
          let boardY = y + r;
          if (boardY >= 0 && boardY < ROWS && boardX >=0 && boardX < COLS) {
            newBoard[boardY][boardX] = 1;
          }
        }
      }
    }
    return newBoard;
  }
  
  // Clear completed lines, return {board, linesCleared}
  function clearLines(board) {
    let newBoard = [];
    let linesCleared = 0;
    for (let r=0; r < ROWS; r++) {
      if (board[r].every(cell => cell)) linesCleared++;
      else newBoard.push(board[r]);
    }
    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0));
    }
    return {board: newBoard, linesCleared};
  }

  // Calculate board heuristic score
  function scoreBoard(board, linesCleared) {
    let aggregateHeight = 0, holes = 0, bumpiness = 0;
    let heights = [];
    for (let c=0; c < COLS; c++) {
      let colHeight = 0;
      let blockFound = false;
      let holeCount = 0;
      for (let r=0; r < ROWS; r++) {
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
      aggregateHeight += colHeight;
    }
    for (let c=0; c < COLS - 1; c++) {
      bumpiness += Math.abs(heights[c] - heights[c+1]);
    }
    // Classic weights (you can tune these)
    return -0.51066 * aggregateHeight
         + 0.760666 * linesCleared
         - 0.35663 * holes
         - 0.184483 * bumpiness;
  }
  
  // Get all possible moves for a piece
  function getMoves(board, pieceId) {
    let moves = [];
    let baseShape = PIECES[pieceId];
    for (let rot=0; rot < 4; rot++) {
      let shape = baseShape;
      for(let i=0; i < rot; i++) shape = rotate(shape);
      let w = shape[0].length;
      for (let x=-2; x <= COLS - w + 2; x++) {
        let y = -4;
        while (canPlace(board, shape, x, y+1)) y++;
        if (canPlace(board, shape, x, y)) {
          moves.push({x, y, rot, shape});
        }
      }
    }
    return moves;
  }

  // Find best move given board, current, hold and next pieces
  function find_best_move(board, currentId, holdId, nextIds) {
    let bestScore = -Infinity;
    let bestMove = null;
    
    // Try current piece without hold
    let moves = getMoves(board, currentId);
    for (let m of moves) {
      let newBoard = placePiece(board, m.shape, m.x, m.y);
      let clearedData = clearLines(newBoard);
      let score = scoreBoard(clearedData.board, clearedData.linesCleared);
      
      // Lookahead one piece (next)
      if (nextIds && nextIds.length) {
        let nextMoves = getMoves(clearedData.board, nextIds[0]);
        let bestNextScore = -Infinity;
        for (let nm of nextMoves) {
          let nextBoard = placePiece(clearedData.board, nm.shape, nm.x, nm.y);
          let nextCleared = clearLines(nextBoard);
          let nextScore = scoreBoard(nextCleared.board, nextCleared.linesCleared);
          if (nextScore > bestNextScore) bestNextScore = nextScore;
        }
        score += bestNextScore * 0.8; // weight for next piece
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = { useHold: false, x: m.x, y: m.y, rot: m.rot };
      }
    }
    
    // Try hold piece if available
    if (holdId !== null) {
      moves = getMoves(board, holdId);
      for (let m of moves) {
        let newBoard = placePiece(board, m.shape, m.x, m.y);
        let clearedData = clearLines(newBoard);
        let score = scoreBoard(clearedData.board, clearedData.linesCleared);
        
        // Lookahead one piece (next)
        if (nextIds && nextIds.length) {
          let nextMoves = getMoves(clearedData.board, nextIds[0]);
          let bestNextScore = -Infinity;
          for (let nm of nextMoves) {
            let nextBoard = placePiece(clearedData.board, nm.shape, nm.x, nm.y);
            let nextCleared = clearLines(nextBoard);
            let nextScore = scoreBoard(nextCleared.board, nextCleared.linesCleared);
            if (nextScore > bestNextScore) bestNextScore = nextScore;
          }
          score += bestNextScore * 0.8;
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMove = { useHold: true, x: m.x, y: m.y, rot: m.rot };
        }
      }
    }
    
    return bestMove;
  }

  global.find_best_move = find_best_move;

})(typeof window !== "undefined" ? window : globalThis);
