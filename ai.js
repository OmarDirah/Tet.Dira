// ai.js – Improved AI with advanced heuristics and lookahead

const PIECES = [
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]]
];

function getHelperId(piece) {
  if (!piece || !piece.shape) return 0;
  let shape = piece.shape;
  if (shape.length === 1 && shape[0].length === 4) return 0;
  if (shape.length === 2 && shape[0].length === 2) return 1;
  if (JSON.stringify(shape) === JSON.stringify([[0,1,1],[1,1,0]])) return 3;
  if (JSON.stringify(shape) === JSON.stringify([[1,1,0],[0,1,1]])) return 4;
  if (JSON.stringify(shape) === JSON.stringify([[1,0,0],[1,1,1]])) return 5;
  if (JSON.stringify(shape) === JSON.stringify([[0,0,1],[1,1,1]])) return 6;
  if (JSON.stringify(shape) === JSON.stringify([[0,1,0],[1,1,1]])) return 2;
  return 0;
}

function getLegalMoves(board, pieceId) {
  const PIECES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,1,0],[0,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]]
  ];

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

  let baseShape = PIECES[pieceId];
  let moves = [];
  for(let rot=0; rot < 4; rot++) {
    let shape = baseShape;
    for(let i=0; i < rot; i++) shape = rotate(shape);
    const width = shape[0].length;
    for(let x = 0; x <= COLS - width; x++) {
      let y = -4;
      while(canPlace(board, shape, x, y+1)) y++;
      if(canPlace(board, shape, x, y)) {
        moves.push({x, y, rot, shape});
      }
    }
  }
  return moves;
}

function countHoles(board) {
  let holes = 0;
  for (let c = 0; c < COLS; c++) {
    let foundBlock = false;
    for (let r = 0; r < ROWS; r++) {
      if (board[r][c]) {
        foundBlock = true;
      } else if (foundBlock) {
        holes++;
      }
    }
  }
  return holes;
}

// Improved move selection using the new AI
function pickCleanestMove(board, pieceId) {
  // Convert board to binary format for the improved AI
  const boardArr = board.map(row => row.map(cell => (cell ? 1 : 0)));
  
  // Use the improved AI if available
  if (window.findBestMove) {
    const currentPiece = { shape: PIECES[pieceId] };
    const bestMove = window.findBestMove(boardArr, currentPiece, held, [next, ...nextQueue]);
    
    if (bestMove) {
      // Return the complete move object with all metadata
      return {
        x: bestMove.x,
        y: bestMove.y,
        rot: bestMove.rot,
        shape: bestMove.shape,
        useHold: bestMove.useHold || false,
        linesCleared: bestMove.linesCleared || 0,
        wellFilling: bestMove.wellFilling || false
      };
    }
  }
  
  // Fallback to original algorithm if improved AI is not available
  const moves = getLegalMoves(board, pieceId);
  let bestMove = null, bestScore = -Infinity;
  for (const move of moves) {
    // Simulate the move
    let newBoard = board.map(row => row.slice());
    let shape = move.shape;
    for(let r=0; r < shape.length; r++) {
      for(let c=0; c < shape[r].length; c++) {
        if(shape[r][c]) {
          const bx = move.x + c;
          const by = move.y + r;
          if(by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            newBoard[by][bx] = 1;
          }
        }
      }
    }
    // Count holes, total height, and leftmost
    let holes = countHoles(newBoard);
    let aggHeight = 0, maxHeight = 0;
    for(let c=0; c<COLS; c++) {
      for(let r=0; r<ROWS; r++) {
        if(newBoard[r][c]) {
          let h = (ROWS - r);
          aggHeight += h;
          if(h > maxHeight) maxHeight = h;
          break;
        }
      }
    }
    // Score: first minimize holes (big negative), then lowest stack, then leftmost
    let score = -1000000*holes - 1000*maxHeight - 5*aggHeight - move.x;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  // Return fallback move with default metadata
  if (bestMove) {
    return {
      x: bestMove.x,
      y: bestMove.y,
      rot: bestMove.rot,
      shape: bestMove.shape,
      useHold: false,
      linesCleared: 0,
      wellFilling: false
    };
  }
  
  return null;
}

function toggleAI() {
  aiPlaying = !aiPlaying;
  if(aiPlaying) {
    document.getElementById('aiSolveButton').textContent = 'Stop AI';
    document.getElementById('aiSolveButton').style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
    aiMoveSequence = [];
    aiMoveStep = 0;
    aiMoveInterval = setInterval(executeAIMoveStep, 50);
    addToConsole('AI Started - Using Improved Heuristics');
  } else {
    document.getElementById('aiSolveButton').textContent = 'AI Solve';
    document.getElementById('aiSolveButton').style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    if(aiMoveInterval) {
      clearInterval(aiMoveInterval);
      aiMoveInterval = null;
    }
    aiMoveSequence = [];
    aiMoveStep = 0;
    addToConsole('AI Stopped');
  }
}

function executeAIMoveStep() {
  if(!current || !aiPlaying) return;

  if(aiMoveStep < aiMoveSequence.length) {
    const move = aiMoveSequence[aiMoveStep];
    switch(move) {
      case 'left':
        if(isValidMove(current, -1, 0)) current.x--;
        break;
      case 'right':
        if(isValidMove(current, 1, 0)) current.x++;
        break;
      case 'rotate': {
        const rotated = rotate(current.shape);
        if(isValidMove(current, 0, 0, rotated)) current.shape = rotated;
        break;
      }
      case 'hold':
        addToConsole(`🔧 EXECUTING HOLD: held=${held ? 'yes' : 'no'}, canHold=${canHold}`);
        holdPiece();
        break;
      case 'hardDrop':
        while(isValidMove(current, 0, 1)) current.y++;
        placePiece(current);
        spawnNewPiece();
        if(!isValidMove(current, 0, 0)) resetGame();
        break;
    }
    aiMoveStep++;
    draw();
  } else {
    aiMoveStep = 0;
    aiMoveSequence = [];
    const boardArr = board.map(row => row.map(cell => (cell ? 1 : 0)));
    const bestMove = pickCleanestMove(boardArr, getHelperId(current));
    if(!bestMove) return;
    aiMoveSequence = [];

    // Enhanced debug logging
    addToConsole(`🔍 AI Decision: useHold=${bestMove.useHold}, canHold=${canHold}, held=${held ? 'yes' : 'no'}`);
    addToConsole(`🔍 Move details: x=${bestMove.x}, y=${bestMove.y}, rot=${bestMove.rot}`);
    if (bestMove.linesCleared) addToConsole(`🔍 Lines to clear: ${bestMove.linesCleared}`);
    if (bestMove.wellFilling) addToConsole(`🔍 Well filling: yes`);
    if (bestMove.forcedHold) addToConsole(`🔍 Forced hold: yes`);

    // Handle hold if the improved AI suggests it
    if (bestMove.useHold && canHold) {
      aiMoveSequence.push('hold');
      if (bestMove.testHold) {
        addToConsole(`🧪 TEST: AI forced to use HOLD for testing`);
      } else if (bestMove.forcedHold) {
        addToConsole(`🔄 AI forced to use HOLD as last resort`);
      } else if (bestMove.wellFilling) {
        addToConsole(`🔧 AI using HOLD for well-filling strategy`);
      } else if (bestMove.linesCleared) {
        addToConsole(`🎯 AI using HOLD to clear ${bestMove.linesCleared} line(s)!`);
      } else {
        addToConsole(`💾 AI using HOLD for better positioning`);
      }
    } else if (bestMove.useHold && !canHold) {
      addToConsole(`⚠️ AI wanted to use HOLD but can't (already used)`);
    } else if (!bestMove.useHold) {
      addToConsole(`❌ AI decided NOT to use hold`);
    }

    const horizontalSteps = bestMove.x - current.x;
    if(horizontalSteps > 0) {
      for(let i = 0; i < horizontalSteps; i++) aiMoveSequence.push('right');
    } else if(horizontalSteps < 0) {
      for(let i = 0; i < Math.abs(horizontalSteps); i++) aiMoveSequence.push('left');
    }
    for(let i = 0; i < bestMove.rot; i++) aiMoveSequence.push('rotate');
    aiMoveSequence.push('hardDrop');
    
    // Log scoring information if available
    if (bestMove.linesCleared) {
      addToConsole(`🎯 AI targeting ${bestMove.linesCleared} line(s) clear!`);
    } else if (bestMove.wellFilling) {
      addToConsole(`🕳️ AI filling well for better board structure`);
    }
    
    aiMoveStep = 0;
  }
}
