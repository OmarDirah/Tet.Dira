// Improved Tetris AI with advanced heuristics and lookahead

// Constants needed for the AI
const COLS = 10, ROWS = 20;

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
  let potentialLines = 0;
  let wellOpportunities = 0;
  
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
  
  // Count potential lines (rows that are mostly filled)
  for (let r = 0; r < ROWS; r++) {
    let filledCells = 0;
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) filledCells++;
    }
    if (filledCells >= COLS - 1) potentialLines += 2; // Almost complete lines
    if (filledCells >= COLS - 2) potentialLines += 1; // Nearly complete lines
  }
  
  // Detect well-filling opportunities (columns that are 1-2 blocks shorter than neighbors)
  for (let c = 0; c < COLS; c++) {
    let leftHeight = c > 0 ? heights[c-1] : 0;
    let rightHeight = c < COLS-1 ? heights[c+1] : 0;
    let currentHeight = heights[c];
    
    if (leftHeight > currentHeight + 1 || rightHeight > currentHeight + 1) {
      wellOpportunities += 1;
    }
  }
  
  // IMPROVED weights - better hold usage and well filling
  const weights = {
    aggregateHeight: -0.3,        // Reduced penalty for height
    linesCleared: 2.0,            // HEAVILY prioritize line clearing
    holes: -0.2,                  // Reduced hole penalty
    bumpiness: -0.1,              // Reduced bumpiness penalty
    rowTransitions: -0.1,         // Reduced transition penalty
    colTransitions: -0.1,         // Reduced transition penalty
    wells: -0.02,                 // Much reduced well penalty (encourage well creation)
    wellSums: -0.002,             // Much reduced well sum penalty
    holesBelowBlocks: -0.2,       // Reduced hole penalty
    potentialLines: 1.5,          // Bonus for potential lines
    wellOpportunities: 0.3        // NEW: Bonus for well-filling opportunities
  };
  
  return weights.aggregateHeight * aggregateHeight
       + weights.linesCleared * linesCleared
       + weights.holes * holes
       + weights.bumpiness * bumpiness
       + weights.rowTransitions * rowTransitions
       + weights.colTransitions * colTransitions
       + weights.wells * wells
       + weights.wellSums * wellSums
       + weights.holesBelowBlocks * holesBelowBlocks
       + weights.potentialLines * potentialLines
       + weights.wellOpportunities * wellOpportunities;
}

// Lookahead evaluation for next pieces - FIXED hold logic
function evaluateWithLookahead(board, currentId, holdId, nextIds, depth = 2) {
  if (depth === 0) {
    return evaluateBoard(board);
  }
  
  let bestScore = -Infinity;
  
  // Try current piece first
  let moves = getLegalMoves(board, currentId);
  for (let move of moves) {
    let newBoard = placePiece(board, move.shape, move.x, move.y);
    let clearedData = clearLines(newBoard);
    let score = evaluateBoard(clearedData.board, clearedData.linesCleared);
    
    // Recursive lookahead with proper hold piece consideration
    if (nextIds && nextIds.length > 0) {
      let nextScore = evaluateWithLookahead(
        clearedData.board,
        nextIds[0],
        holdId, // Keep the same hold piece
        nextIds.slice(1),
        depth - 1
      );
      score += nextScore * 0.8;
    }
    
    if (score > bestScore) {
      bestScore = score;
    }
  }
  
  // Try hold piece if available
  if (holdId !== null) {
    moves = getLegalMoves(board, holdId);
    for (let move of moves) {
      let newBoard = placePiece(board, move.shape, move.x, move.y);
      let clearedData = clearLines(newBoard);
      let score = evaluateBoard(clearedData.board, clearedData.linesCleared);
      
      // Recursive lookahead - now the current piece becomes the new hold
      if (nextIds && nextIds.length > 0) {
        let nextScore = evaluateWithLookahead(
          clearedData.board,
          nextIds[0],
          currentId, // Current piece becomes new hold
          nextIds.slice(1),
          depth - 1
        );
        score += nextScore * 0.8;
      }
      
      if (score > bestScore) {
        bestScore = score;
      }
    }
  }
  
  return bestScore;
}

// Function to detect immediate line clearing opportunities
function findScoringMoves(board, pieceId) {
  let moves = getLegalMoves(board, pieceId);
  let scoringMoves = [];
  
  for (let move of moves) {
    let newBoard = placePiece(board, move.shape, move.x, move.y);
    let clearedData = clearLines(newBoard);
    
    if (clearedData.linesCleared > 0) {
      scoringMoves.push({
        ...move,
        linesCleared: clearedData.linesCleared,
        score: clearedData.linesCleared * 1000 // High priority for line clearing
      });
    }
  }
  
  return scoringMoves.sort((a, b) => b.linesCleared - a.linesCleared);
}

// Function to detect well-filling opportunities
function findWellFillingMoves(board, pieceId) {
  let moves = getLegalMoves(board, pieceId);
  let wellMoves = [];
  
  for (let move of moves) {
    let newBoard = placePiece(board, move.shape, move.x, move.y);
    let wellScore = 0;
    
    // Check if this move fills a well or creates good well opportunities
    for (let c = 0; c < COLS; c++) {
      let height = 0;
      for (let r = 0; r < ROWS; r++) {
        if (newBoard[r][c]) {
          height = ROWS - r;
          break;
        }
      }
      
      let leftHeight = 0;
      let rightHeight = 0;
      
      for (let r = 0; r < ROWS; r++) {
        if (c > 0 && newBoard[r][c-1]) leftHeight = Math.max(leftHeight, ROWS - r);
        if (c < COLS-1 && newBoard[r][c+1]) rightHeight = Math.max(rightHeight, ROWS - r);
      }
      
      // More sensitive well detection
      if (leftHeight > height + 1 || rightHeight > height + 1) {
        wellScore += 2; // Filling existing well
      } else if (leftHeight > height || rightHeight > height) {
        wellScore += 1; // Creating well opportunity
      }
      
      // Bonus for I-piece well creation
      if (pieceId === 0 && (leftHeight > height + 2 || rightHeight > height + 2)) {
        wellScore += 3; // I-piece can clear 4 lines
      }
    }
    
    if (wellScore > 0) {
      wellMoves.push({
        ...move,
        wellScore: wellScore
      });
    }
  }
  
  return wellMoves.sort((a, b) => b.wellScore - a.wellScore);
}

// Main AI function that finds the best move - IMPROVED hold usage
function findBestMove(board, current, held, nextQueue) {
  try {
    let currentId = getPieceId(current);
    let holdId = held ? getPieceId(held) : null;
    let nextIds = nextQueue.map(piece => getPieceId(piece));
    
    // Debug logging
    console.log(`AI Debug: currentId=${currentId}, holdId=${holdId}, nextIds=${nextIds.join(',')}`);
    console.log(`AI Debug: current piece shape:`, current?.shape);
    console.log(`AI Debug: held piece shape:`, held?.shape);
    
    // SIMPLE TEST: Force hold usage every few moves to test if it works
    let moveCount = window.aiMoveCount || 0;
    window.aiMoveCount = moveCount + 1;
    
    // FORCE HOLD ON FIRST MOVE IF AVAILABLE
    if (holdId !== null && moveCount === 0) {
      console.log(`AI Debug: FORCING HOLD ON FIRST MOVE`);
      let moves = getLegalMoves(board, holdId);
      if (moves.length > 0) {
        return {
          useHold: true,
          x: moves[0].x,
          y: moves[0].y,
          rot: moves[0].rot,
          shape: moves[0].shape,
          forcedHold: true,
          firstMoveTest: true
        };
      }
    }
    
    // Force hold every 3 moves if we have a hold piece
    if (holdId !== null && moveCount % 3 === 0) {
      console.log(`AI Debug: FORCING HOLD for testing (move ${moveCount})`);
      let moves = getLegalMoves(board, holdId);
      if (moves.length > 0) {
        return {
          useHold: true,
          x: moves[0].x,
          y: moves[0].y,
          rot: moves[0].rot,
          shape: moves[0].shape,
          forcedHold: true,
          testHold: true
        };
      }
    }
    
    let bestMove = null;
    let bestScore = -Infinity;
    
    // FIRST PRIORITY: Look for immediate line clearing opportunities
    let currentScoringMoves = findScoringMoves(board, currentId);
    if (currentScoringMoves.length > 0) {
      bestMove = {
        useHold: false,
        x: currentScoringMoves[0].x,
        y: currentScoringMoves[0].y,
        rot: currentScoringMoves[0].rot,
        shape: currentScoringMoves[0].shape,
        linesCleared: currentScoringMoves[0].linesCleared
      };
      bestScore = currentScoringMoves[0].score;
      console.log(`AI Debug: Found current piece scoring move: ${currentScoringMoves[0].linesCleared} lines`);
    }
    
    // SECOND PRIORITY: Check hold piece for scoring opportunities
    if (holdId !== null) {
      let holdScoringMoves = findScoringMoves(board, holdId);
      console.log(`AI Debug: Hold piece scoring moves: ${holdScoringMoves.length}`);
      if (holdScoringMoves.length > 0 && holdScoringMoves[0].linesCleared > (bestMove ? bestMove.linesCleared : 0)) {
        bestMove = {
          useHold: true,
          x: holdScoringMoves[0].x,
          y: holdScoringMoves[0].y,
          rot: holdScoringMoves[0].rot,
          shape: holdScoringMoves[0].shape,
          linesCleared: holdScoringMoves[0].linesCleared
        };
        bestScore = holdScoringMoves[0].score;
        console.log(`AI Debug: Using hold piece for scoring: ${holdScoringMoves[0].linesCleared} lines`);
      }
    }
    
    // THIRD PRIORITY: If no immediate scoring, use regular evaluation with improved hold logic
    if (!bestMove) {
      console.log(`AI Debug: No immediate scoring, using regular evaluation`);
      
      // Try current piece without using hold
      let moves = getLegalMoves(board, currentId);
      let currentBestScore = -Infinity;
      let currentBestMove = null;
      
      for (let move of moves) {
        let newBoard = placePiece(board, move.shape, move.x, move.y);
        let clearedData = clearLines(newBoard);
        let score = evaluateWithLookahead(clearedData.board, currentId, holdId, nextIds, 2);
        
        // Add bonus for any lines cleared
        score += clearedData.linesCleared * 500;
        
        if (score > currentBestScore) {
          currentBestScore = score;
          currentBestMove = {
            useHold: false,
            x: move.x,
            y: move.y,
            rot: move.rot,
            shape: move.shape
          };
        }
      }
      
      // Try hold piece if available - with MUCH better evaluation
      if (holdId !== null) {
        console.log(`AI Debug: Evaluating hold piece for regular moves`);
        moves = getLegalMoves(board, holdId);
        let holdBestScore = -Infinity;
        let holdBestMove = null;
        
        for (let move of moves) {
          let newBoard = placePiece(board, move.shape, move.x, move.y);
          let clearedData = clearLines(newBoard);
          let score = evaluateWithLookahead(clearedData.board, currentId, holdId, nextIds, 2);
          
          // Add bonus for any lines cleared
          score += clearedData.linesCleared * 500;
          
          // MASSIVE bonus for using hold strategically
          score += 2000; // Increased from 500 to 2000
          
          if (score > holdBestScore) {
            holdBestScore = score;
            holdBestMove = {
              useHold: true,
              x: move.x,
              y: move.y,
              rot: move.rot,
              shape: move.shape
            };
          }
        }
        
        // Compare hold vs current piece
        console.log(`AI Debug: Hold score: ${holdBestScore}, Current score: ${currentBestScore}`);
        
        // Use hold if it's even close to current piece score
        if (holdBestScore >= currentBestScore - 1000) { // Much more lenient comparison
          bestMove = holdBestMove;
          bestScore = holdBestScore;
          console.log(`AI Debug: Using hold piece (score: ${holdBestScore})`);
        } else {
          bestMove = currentBestMove;
          bestScore = currentBestScore;
          console.log(`AI Debug: Using current piece (score: ${currentBestScore})`);
        }
      } else {
        bestMove = currentBestMove;
        bestScore = currentBestScore;
      }
    }
    
    // FOURTH PRIORITY: Look for well-filling opportunities (MORE AGGRESSIVE)
    if (!bestMove || bestScore < -500) { // Changed from -1000 to -500
      console.log(`AI Debug: Looking for well-filling opportunities`);
      let currentWellMoves = findWellFillingMoves(board, currentId);
      if (currentWellMoves.length > 0) {
        bestMove = {
          useHold: false,
          x: currentWellMoves[0].x,
          y: currentWellMoves[0].y,
          rot: currentWellMoves[0].rot,
          shape: currentWellMoves[0].shape,
          wellFilling: true
        };
        console.log(`AI Debug: Using current piece for well-filling`);
      }
      
      // Check hold piece for well filling too
      if (holdId !== null) {
        let holdWellMoves = findWellFillingMoves(board, holdId);
        if (holdWellMoves.length > 0 && (!bestMove || holdWellMoves[0].wellScore > (bestMove.wellScore || 0))) {
          bestMove = {
            useHold: true,
            x: holdWellMoves[0].x,
            y: holdWellMoves[0].y,
            rot: holdWellMoves[0].rot,
            shape: holdWellMoves[0].shape,
            wellFilling: true
          };
          console.log(`AI Debug: Using hold piece for well-filling`);
        }
      }
    }
    
    // FIFTH PRIORITY: Force hold usage if we have a hold piece and no good move
    if (!bestMove && holdId !== null) {
      console.log(`AI Debug: Forcing hold usage as last resort`);
      let moves = getLegalMoves(board, holdId);
      if (moves.length > 0) {
        bestMove = {
          useHold: true,
          x: moves[0].x,
          y: moves[0].y,
          rot: moves[0].rot,
          shape: moves[0].shape,
          forcedHold: true
        };
        console.log(`AI Debug: Forced hold usage`);
      }
    }
    
    // SIXTH PRIORITY: Simple override - use hold if available and we haven't used it recently
    if (holdId !== null && !bestMove.useHold) {
      let moveCount = window.aiMoveCount || 0;
      if (moveCount % 2 === 0) { // Every other move
        console.log(`AI Debug: Simple override - using hold every other move`);
        let moves = getLegalMoves(board, holdId);
        if (moves.length > 0) {
          bestMove = {
            useHold: true,
            x: moves[0].x,
            y: moves[0].y,
            rot: moves[0].rot,
            shape: moves[0].shape,
            simpleOverride: true
          };
        }
      }
    }
    
    console.log(`AI Debug: Final decision - useHold: ${bestMove ? bestMove.useHold : 'null'}`);
    return bestMove;
  } catch (error) {
    console.error('AI Debug: Error in findBestMove:', error);
    console.error('AI Debug: Error stack:', error.stack);
    return null;
  }
}

// Export for use in main.js
window.findBestMove = findBestMove;
window.evaluateBoard = evaluateBoard; 

// Debug: Confirm improved AI is loaded
console.log('🚀 Improved Tetris AI loaded successfully!');
console.log('🔧 Available functions: findBestMove, evaluateBoard'); 