# TET.DIRA API Documentation

## 🚀 Quick Start

### Basic Integration
```javascript
// Include the AI scripts
<script src="improved_ai.js"></script>
<script src="ai.js"></script>

// Initialize AI
const ai = new TetrisAI();
```

## 📚 Core API Reference

### AI Functions

#### `findBestMove(board, current, held, nextQueue)`
Finds the optimal move for the current game state.

**Parameters:**
- `board` (Array): 2D array representing the game board (0 = empty, 1 = filled)
- `current` (Object): Current piece object with shape property
- `held` (Object|null): Held piece object or null
- `nextQueue` (Array): Array of upcoming pieces

**Returns:**
```javascript
{
  useHold: boolean,      // Whether to use hold piece
  x: number,            // Target X position
  y: number,            // Target Y position
  rot: number,          // Number of rotations needed
  shape: Array,         // Final piece shape
  linesCleared?: number // Lines that will be cleared (if any)
}
```

**Example:**
```javascript
const board = Array(20).fill().map(() => Array(10).fill(0));
const current = { shape: [[1,1,1,1]] };
const held = null;
const nextQueue = [{ shape: [[1,1],[1,1]] }];

const bestMove = findBestMove(board, current, held, nextQueue);
console.log(`Move to position (${bestMove.x}, ${bestMove.y}) with ${bestMove.rot} rotations`);
```

#### `evaluateBoard(board, linesCleared)`
Evaluates a board state and returns a score.

**Parameters:**
- `board` (Array): 2D array representing the game board
- `linesCleared` (number): Number of lines cleared (optional, default: 0)

**Returns:**
- `number`: Board evaluation score (higher is better)

**Example:**
```javascript
const score = evaluateBoard(board, 2);
console.log(`Board score: ${score}`);
```

#### `findScoringMoves(board, pieceId)`
Finds all moves that clear lines for a given piece.

**Parameters:**
- `board` (Array): 2D array representing the game board
- `pieceId` (number): Index of the piece (0-6)

**Returns:**
```javascript
[
  {
    x: number,
    y: number,
    rot: number,
    shape: Array,
    linesCleared: number,
    score: number
  }
]
```

### Game Integration Functions

#### `toggleAI()`
Starts or stops the AI mode.

**Example:**
```javascript
// Start AI
toggleAI();

// Stop AI
toggleAI();
```

#### `executeAIMoveStep()`
Executes one step of the AI move sequence.

**Example:**
```javascript
// Manual AI step execution
setInterval(executeAIMoveStep, 100);
```

### Utility Functions

#### `getPieceId(piece)`
Converts a piece object to its ID.

**Parameters:**
- `piece` (Object): Piece object with shape property

**Returns:**
- `number`: Piece ID (0-6)

#### `rotate(shape)`
Rotates a piece shape clockwise.

**Parameters:**
- `shape` (Array): 2D array representing piece shape

**Returns:**
- `Array`: Rotated piece shape

#### `getLegalMoves(board, pieceId)`
Gets all legal moves for a piece.

**Parameters:**
- `board` (Array): 2D array representing the game board
- `pieceId` (number): Index of the piece (0-6)

**Returns:**
```javascript
[
  {
    x: number,
    y: number,
    rot: number,
    shape: Array
  }
]
```

## 🎮 Game State Management

### Board Representation
```javascript
// Empty board (20 rows × 10 columns)
const board = Array(20).fill().map(() => Array(10).fill(0));

// Filled cell
board[row][col] = 1;

// Check if cell is filled
if (board[row][col]) {
  // Cell is occupied
}
```

### Piece Objects
```javascript
const piece = {
  shape: [[1,1,1,1]],  // 2D array representing piece shape
  x: 3,                // X position on board
  y: 0,                // Y position on board
  color: '#00ffff'     // Piece color (optional)
};
```

### Game Constants
```javascript
const COLS = 10;        // Board width
const ROWS = 20;        // Board height
const PIECES = [        // All piece shapes
  [[1,1,1,1]],         // I piece
  [[1,1],[1,1]],       // O piece
  [[0,1,0],[1,1,1]],   // T piece
  [[0,1,1],[1,1,0]],   // S piece
  [[1,1,0],[0,1,1]],   // Z piece
  [[1,0,0],[1,1,1]],   // J piece
  [[0,0,1],[1,1,1]]    // L piece
];
```

## 🔧 Configuration

### AI Weights
```javascript
// Modify AI behavior by adjusting weights
const weights = {
  linesCleared: 2.0,        // Line clearing priority
  potentialLines: 1.5,      // Nearly complete lines
  aggregateHeight: -0.3,    // Height penalty
  holes: -0.2,              // Hole penalty
  bumpiness: -0.1,          // Surface smoothness
  rowTransitions: -0.1,     // Horizontal complexity
  colTransitions: -0.1,     // Vertical complexity
  wells: -0.05,             // Empty columns
  holesBelowBlocks: -0.2    // Immediate holes
};
```

### Performance Settings
```javascript
// AI timing configuration
const AI_MOVE_DELAY = 50;        // Milliseconds between moves
const AI_UPDATE_INTERVAL = 50;   // AI calculation frequency
const LOOKAHEAD_DEPTH = 2;       // Future pieces to consider
```

## 🎯 Advanced Usage

### Custom AI Integration
```javascript
// Create custom AI function
function customAI(board, current, held, nextQueue) {
  // Your custom logic here
  const bestMove = findBestMove(board, current, held, nextQueue);
  
  // Modify the move based on your requirements
  if (someCondition) {
    bestMove.x += 1; // Adjust position
  }
  
  return bestMove;
}

// Use custom AI
const move = customAI(board, current, held, nextQueue);
```

### AI Performance Monitoring
```javascript
// Monitor AI performance
let aiStats = {
  moveCount: 0,
  totalTime: 0,
  averageTime: 0
};

function monitoredAI(board, current, held, nextQueue) {
  const startTime = performance.now();
  const move = findBestMove(board, current, held, nextQueue);
  const endTime = performance.now();
  
  aiStats.moveCount++;
  aiStats.totalTime += (endTime - startTime);
  aiStats.averageTime = aiStats.totalTime / aiStats.moveCount;
  
  console.log(`AI move ${aiStats.moveCount}: ${aiStats.averageTime.toFixed(2)}ms`);
  
  return move;
}
```

### Multi-AI System
```javascript
// Use multiple AI algorithms
const aiAlgorithms = {
  scoring: findBestMove,           // Improved AI
  survival: helperAI,              // Helper AI
  balanced: stackrabbitAI          // StackRabbit AI
};

function adaptiveAI(board, current, held, nextQueue) {
  // Choose AI based on game state
  const boardHeight = getBoardHeight(board);
  
  if (boardHeight > 15) {
    return aiAlgorithms.survival(board, current, held, nextQueue);
  } else if (hasScoringOpportunity(board)) {
    return aiAlgorithms.scoring(board, current, held, nextQueue);
  } else {
    return aiAlgorithms.balanced(board, current, held, nextQueue);
  }
}
```

## 🐛 Error Handling

### Common Errors
```javascript
// Invalid board dimensions
if (board.length !== ROWS || board[0].length !== COLS) {
  throw new Error('Invalid board dimensions');
}

// Invalid piece ID
if (pieceId < 0 || pieceId >= PIECES.length) {
  throw new Error('Invalid piece ID');
}

// No legal moves available
const moves = getLegalMoves(board, pieceId);
if (moves.length === 0) {
  console.warn('No legal moves available');
  return null;
}
```

### Debug Mode
```javascript
// Enable debug logging
window.debugAI = true;

// Check if AI functions are available
if (typeof findBestMove === 'undefined') {
  console.error('AI functions not loaded');
}
```

## 📊 Performance Tips

### Optimization Guidelines
1. **Reuse board objects** when possible
2. **Cache piece rotations** for repeated calculations
3. **Limit lookahead depth** for better performance
4. **Use Web Workers** for heavy AI calculations
5. **Profile AI performance** regularly

### Memory Management
```javascript
// Clear AI state when not needed
function cleanupAI() {
  aiMoveSequence = [];
  aiMoveStep = 0;
  if (aiMoveInterval) {
    clearInterval(aiMoveInterval);
    aiMoveInterval = null;
  }
}
```

---

*For more detailed information, see the [Technical Documentation](TECHNICAL_DOCS.md) and [README](README.md).* 