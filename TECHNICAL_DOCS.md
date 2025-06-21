# TET.DIRA Technical Documentation

## 🏗️ Architecture Overview

TET.DIRA is built with a clean, modular architecture focusing on performance and maintainability.

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Game Engine   │    │   AI System     │    │   UI Layer      │
│   (main.js)     │◄──►│  (simple_ai.js) │◄──►│  (index.html)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎮 Game Engine (main.js)

### Core Systems

#### 1. **Game State Management**
```javascript
// Game state variables
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let current, next, nextQueue;
let held = null, canHold = true;
let score = 0, level = 1, linesCleared = 0;
```

#### 2. **Rendering System**
- **Canvas Management**: Multiple canvases for game, hold, and next areas
- **60fps Game Loop**: Smooth animation with `requestAnimationFrame`
- **Error Handling**: Robust canvas initialization and fallbacks

#### 3. **Input System**
- **Keyboard Events**: Responsive control handling
- **AI Integration**: Seamless switching between manual and AI modes
- **State Validation**: Prevents invalid moves

### Key Functions

#### `gameLoop()`
```javascript
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
    requestAnimationFrame(gameLoop);
  }
}
```

#### `executeSmoothMovement()`
```javascript
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
  
  // Continue or complete
  if (!moved && aiTargetRot === 0 && aiTargetX === current.x) {
    // Hard drop and complete
    while (isValidMove(current, 0, 1)) current.y++;
    placePiece(current);
    spawnNewPiece();
    aiExecuting = false;
  } else {
    // Continue movement
    draw();
    setTimeout(executeSmoothMovement, 100);
  }
}
```

## 🤖 AI System (simple_ai.js)

### Architecture

The AI uses a clean, efficient approach with three main components:

1. **Move Generation**: Find all valid positions
2. **Board Evaluation**: Score board states
3. **Decision Making**: Choose optimal moves

### Core Algorithms

#### 1. **Move Generation**
```javascript
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
```

#### 2. **Board Evaluation**
```javascript
function evaluateBoard(board) {
  const { COLS, ROWS } = getGameConstants();
  let height = 0, holes = 0, bumpiness = 0, completeLines = 0;
  let heights = [];
  
  // Calculate metrics
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
  
  return -0.5 * height - 0.4 * holes - 0.2 * bumpiness + 0.8 * completeLines;
}
```

#### 3. **Move Simulation**
```javascript
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
```

### Decision Making Process

1. **Generate Moves**: Find all valid positions for current and hold pieces
2. **Simulate Placement**: Test each move and evaluate resulting board
3. **Compare Scores**: Choose move with highest evaluation score
4. **Execute Move**: Convert decision to game actions

## 🎨 UI Layer (index.html)

### Layout Structure

```html
<div id="gameContainer">
  <div id="holdArea">      <!-- Hold piece display -->
  <canvas id="gameCanvas"> <!-- Main game board -->
  <div id="rightColumn">   <!-- Next pieces + console -->
  <div id="scoreArea">     <!-- Score display -->
</div>
```

### Styling Features

- **CSS Grid/Flexbox**: Responsive layout
- **Dark Theme**: Modern, easy-on-the-eyes design
- **Smooth Transitions**: CSS animations for interactions
- **Mobile-Friendly**: Responsive design principles

## 🔧 Performance Optimizations

### 1. **Efficient Rendering**
- **Canvas Optimization**: Minimal redraws
- **State Management**: Only update when necessary
- **Memory Management**: Proper cleanup of intervals and timeouts

### 2. **AI Performance**
- **Move Caching**: Avoid recalculating valid moves
- **Early Termination**: Stop evaluation when optimal move found
- **Efficient Algorithms**: O(n) complexity for board evaluation

### 3. **Smooth Animation**
- **RequestAnimationFrame**: 60fps game loop
- **Throttled Updates**: Prevent excessive redraws
- **Error Recovery**: Graceful handling of animation errors

## 🧪 Testing & Debugging

### Test Pages

1. **`test_simple.html`**: Basic AI functionality
2. **`debug_canvas.html`**: Canvas rendering diagnostics
3. **`minimal_game.html`**: Minimal game version
4. **`basic_test.html`**: Core functionality verification

### Debug Features

```javascript
// Enable debug logging
console.log('🎯 Main.js loaded successfully!');
console.log('🔧 findBestMove available:', typeof window.findBestMove);

// Run diagnostics
function runDiagnostics() {
  console.log('🔍 Running diagnostics...');
  // Check canvas elements, game state, AI functions
}
```

### Error Handling

```javascript
// Robust error handling throughout
try {
  // Game logic
} catch (error) {
  console.error('Error:', error);
  // Graceful fallback
}
```

## 📊 Performance Metrics

### Target Performance
- **Frame Rate**: 60fps consistently
- **AI Decision Time**: <1ms per move
- **Memory Usage**: <10MB total
- **Load Time**: <2 seconds

### Optimization Techniques
- **Lazy Loading**: Load resources as needed
- **Object Pooling**: Reuse objects to reduce GC
- **Efficient Algorithms**: Optimized for speed
- **Minimal DOM**: Reduce DOM manipulation

## 🔄 State Management

### Game States
```javascript
// Main game state
let isPaused = false;
let aiPlaying = false;
let aiExecuting = false;

// Piece states
let current, next, nextQueue;
let held = null, canHold = true;

// Score state
let score = 0, level = 1, linesCleared = 0;
```

### State Transitions
1. **Manual → AI**: Seamless switching
2. **Paused → Playing**: State preservation
3. **Game Over → Restart**: Clean reset
4. **Error → Recovery**: Graceful fallback

## 🚀 Future Enhancements

### Planned Features
- **Multiple AI Algorithms**: Different strategies
- **Difficulty Levels**: Adjustable AI behavior
- **Replay System**: Save and replay games
- **Statistics**: Detailed performance metrics
- **Mobile Support**: Touch controls

### Technical Improvements
- **Web Workers**: Offload AI calculations
- **WebGL**: Hardware-accelerated rendering
- **Service Workers**: Offline support
- **PWA Features**: App-like experience

---

*This documentation reflects the current state of TET.DIRA as of the latest commit.* 