// ai.js – Improved AI with advanced heuristics and lookahead

// Constants needed for the AI
const COLS = 10, ROWS = 20;

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
function pickCleanestMove(board, pieceId, gameState) {
  try {
    // Extract game state variables
    const { held, next, nextQueue } = gameState || {};
    
    // Convert board to binary format for the improved AI
    const boardArr = board.map(row => row.map(cell => (cell ? 1 : 0)));
    
    // Use the improved AI if available
    if (window.findBestMove) {
      const currentPiece = { shape: PIECES[pieceId] };
      const heldPiece = held ? { shape: held.shape } : null;
      const nextPieces = next && nextQueue ? [next, ...nextQueue].map(p => ({ shape: p.shape })) : [];
      
      console.log('AI Debug: Calling findBestMove with:', {
        boardArr: boardArr.length + 'x' + boardArr[0].length,
        currentPiece,
        heldPiece,
        nextPieces: nextPieces.length
      });
      
      const bestMove = window.findBestMove(boardArr, currentPiece, heldPiece, nextPieces);
      
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
    } else {
      console.log('AI Debug: findBestMove not available, using fallback');
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
  } catch (error) {
    console.error('AI Debug: Error in pickCleanestMove:', error);
    console.error('AI Debug: Error stack:', error.stack);
    return null;
  }
}

function toggleAI(gameState) {
  const { aiPlaying, aiMoveInterval, aiMoveSequence, aiMoveStep } = gameState || {};
  
  const newAiPlaying = !aiPlaying;
  if(newAiPlaying) {
    document.getElementById('aiSolveButton').textContent = 'Stop AI';
    document.getElementById('aiSolveButton').style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
    const newAiMoveInterval = setInterval(() => executeAIMoveStep(gameState), 50);
    if (window.addToConsole) window.addToConsole('AI Started - Using Improved Heuristics');
    return { aiPlaying: newAiPlaying, aiMoveInterval: newAiMoveInterval, aiMoveSequence: [], aiMoveStep: 0 };
  } else {
    document.getElementById('aiSolveButton').textContent = 'AI Solve';
    document.getElementById('aiSolveButton').style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    if(aiMoveInterval) {
      clearInterval(aiMoveInterval);
    }
    if (window.addToConsole) window.addToConsole('AI Stopped');
    return { aiPlaying: newAiPlaying, aiMoveInterval: null, aiMoveSequence: [], aiMoveStep: 0 };
  }
}

function executeAIMoveStep(gameState) {
  const { current, aiPlaying, aiMoveSequence, aiMoveStep, board, held, canHold, next, nextQueue } = gameState || {};
  
  if(!current || !aiPlaying) return gameState;

  if(aiMoveStep < aiMoveSequence.length) {
    const move = aiMoveSequence[aiMoveStep];
    let newState = { ...gameState, aiMoveStep: aiMoveStep + 1 };
    
    switch(move) {
      case 'left':
        if(window.isValidMove && isValidMove(current, -1, 0)) current.x--;
        break;
      case 'right':
        if(window.isValidMove && isValidMove(current, 1, 0)) current.x++;
        break;
      case 'rotate': {
        if(window.rotate && isValidMove(current, 0, 0, rotate(current.shape))) current.shape = rotate(current.shape);
        break;
      }
      case 'hold':
        if (window.addToConsole) addToConsole(`🔧 EXECUTING HOLD: held=${held ? 'yes' : 'no'}, canHold=${canHold}`);
        if (window.holdPiece) holdPiece();
        break;
      case 'hardDrop':
        if(window.isValidMove && window.placePiece && window.spawnNewPiece) {
          while(isValidMove(current, 0, 1)) current.y++;
          placePiece(current);
          spawnNewPiece();
          if(!isValidMove(current, 0, 0)) {
            if (window.resetGame) resetGame();
          }
        }
        break;
    }
    
    if (window.draw) draw();
    return newState;
  } else {
    const boardArr = board.map(row => row.map(cell => (cell ? 1 : 0)));
    
    // Test if improved AI is available
    if (!window.findBestMove) {
      if (window.addToConsole) addToConsole(`❌ ERROR: Improved AI not loaded!`);
      return gameState;
    }
    
    if (window.addToConsole) addToConsole(`🔍 Calling improved AI function...`);
    const bestMove = pickCleanestMove(boardArr, window.getHelperId ? getHelperId(current) : 0, { held, next, nextQueue });
    if(!bestMove) {
      if (window.addToConsole) addToConsole(`❌ ERROR: No move returned from AI!`);
      return gameState;
    }
    
    const newAiMoveSequence = [];

    // Enhanced debug logging
    if (window.addToConsole) {
      addToConsole(`🔍 AI Decision: useHold=${bestMove.useHold}, canHold=${canHold}, held=${held ? 'yes' : 'no'}`);
      addToConsole(`🔍 Move details: x=${bestMove.x}, y=${bestMove.y}, rot=${bestMove.rot}`);
      if (bestMove.linesCleared) addToConsole(`🔍 Lines to clear: ${bestMove.linesCleared}`);
      if (bestMove.wellFilling) addToConsole(`🔍 Well filling: yes`);
      if (bestMove.forcedHold) addToConsole(`🔍 Forced hold: yes`);
    }

    // Handle hold if the improved AI suggests it
    if (bestMove.useHold && canHold) {
      newAiMoveSequence.push('hold');
      if (window.addToConsole) {
        if (bestMove.firstMoveTest) {
          addToConsole(`🚨 FIRST MOVE TEST: AI forced to use HOLD on first move`);
        } else if (bestMove.simpleOverride) {
          addToConsole(`🔄 SIMPLE OVERRIDE: AI using HOLD every other move`);
        } else if (bestMove.testHold) {
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
      }
    } else if (bestMove.useHold && !canHold) {
      if (window.addToConsole) addToConsole(`⚠️ AI wanted to use HOLD but can't (already used)`);
    } else if (!bestMove.useHold) {
      if (window.addToConsole) addToConsole(`❌ AI decided NOT to use hold`);
    }

    const horizontalSteps = bestMove.x - current.x;
    if(horizontalSteps > 0) {
      for(let i = 0; i < horizontalSteps; i++) newAiMoveSequence.push('right');
    } else if(horizontalSteps < 0) {
      for(let i = 0; i < Math.abs(horizontalSteps); i++) newAiMoveSequence.push('left');
    }
    for(let i = 0; i < bestMove.rot; i++) newAiMoveSequence.push('rotate');
    newAiMoveSequence.push('hardDrop');
    
    // Log scoring information if available
    if (window.addToConsole) {
      if (bestMove.linesCleared) {
        addToConsole(`🎯 AI targeting ${bestMove.linesCleared} line(s) clear!`);
      } else if (bestMove.wellFilling) {
        addToConsole(`🕳️ AI filling well for better board structure`);
      }
    }
    
    return { ...gameState, aiMoveSequence: newAiMoveSequence, aiMoveStep: 0 };
  }
}

// Export for use in main.js
window.toggleAI = toggleAI;
window.executeAIMoveStep = executeAIMoveStep;
window.pickCleanestMove = pickCleanestMove;

// Debug: Confirm AI module is loaded
console.log('🎮 AI module loaded successfully!');
console.log('🔧 Available functions: toggleAI, executeAIMoveStep, pickCleanestMove');