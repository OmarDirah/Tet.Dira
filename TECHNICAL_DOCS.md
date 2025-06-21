# TET.DIRA Technical Documentation

## 🤖 AI Algorithm Deep Dive

### Overview
The TET.DIRA AI system uses a sophisticated multi-layered approach combining classic Tetris heuristics with modern scoring optimization techniques.

### Core AI Components

#### 1. Improved AI (`improved_ai.js`)

**Primary Function**: `findBestMove(board, current, held, nextQueue)`

**Algorithm Flow**:
```javascript
1. Check for immediate line clearing opportunities
2. Evaluate hold piece for better scoring
3. Use lookahead evaluation for optimal placement
4. Apply weighted board evaluation
5. Return best move with metadata
```

**Key Features**:
- **Scoring Priority**: Actively seeks line clearing moves
- **2-Piece Lookahead**: Considers future pieces
- **Hold Optimization**: Strategic use of hold piece
- **Advanced Heuristics**: 9-factor board evaluation

#### 2. Board Evaluation Algorithm

**Function**: `evaluateBoard(board, linesCleared)`

**Evaluation Factors**:

| Factor | Calculation | Weight | Purpose |
|--------|-------------|--------|---------|
| **Lines Cleared** | Direct count | 2.0 | Primary objective |
| **Potential Lines** | Nearly complete rows | 1.5 | Future scoring |
| **Aggregate Height** | Sum of column heights | -0.3 | Stack management |
| **Holes** | Empty spaces below blocks | -0.2 | Board cleanliness |
| **Bumpiness** | Height differences | -0.1 | Surface smoothness |
| **Row Transitions** | Horizontal changes | -0.1 | Edge complexity |
| **Column Transitions** | Vertical changes | -0.1 | Vertical complexity |
| **Wells** | Empty columns | -0.05 | Column efficiency |
| **Holes Below Blocks** | Gaps under pieces | -0.2 | Immediate holes |

**Mathematical Formula**:
```
Score = (2.0 × linesCleared) + (1.5 × potentialLines) + 
        (-0.3 × aggregateHeight) + (-0.2 × holes) + 
        (-0.1 × bumpiness) + (-0.1 × rowTransitions) + 
        (-0.1 × colTransitions) + (-0.05 × wells) + 
        (-0.2 × holesBelowBlocks)
```

#### 3. Lookahead System

**Function**: `evaluateWithLookahead(board, currentId, holdId, nextIds, depth)`

**Process**:
1. **Recursive Evaluation**: Evaluates moves up to specified depth
2. **Future Weighting**: Weights future moves at 0.8× current value
3. **Hold Integration**: Considers hold piece in future calculations
4. **Early Termination**: Stops at depth limit or no more pieces

**Lookahead Depth**: 2 pieces (configurable)

#### 4. Scoring Detection

**Function**: `findScoringMoves(board, pieceId)`

**Process**:
1. Generate all legal moves for piece
2. Simulate each move on board
3. Check for line clears
4. Sort by number of lines cleared
5. Return prioritized scoring opportunities

### AI Decision Making Process

#### Step 1: Immediate Scoring Check
```javascript
let currentScoringMoves = findScoringMoves(board, currentId);
if (currentScoringMoves.length > 0) {
    return best scoring move;
}
```

#### Step 2: Hold Piece Evaluation
```javascript
if (holdId !== null) {
    let holdScoringMoves = findScoringMoves(board, holdId);
    if (holdScoringMoves[0].linesCleared > currentBest) {
        return hold move;
    }
}
```

#### Step 3: Regular Evaluation with Scoring Bias
```javascript
let score = evaluateWithLookahead(board, currentId, holdId, nextIds, 2);
score += clearedData.linesCleared * 500; // Scoring bonus
```

### Performance Optimizations

#### 1. Move Generation
- **Efficient Rotation**: Pre-calculated rotation matrices
- **Boundary Checking**: Early termination for invalid positions
- **Legal Move Caching**: Reuse valid move calculations

#### 2. Board Evaluation
- **Single Pass Analysis**: Calculate all factors in one iteration
- **Early Termination**: Stop evaluation if board is clearly bad
- **Memory Reuse**: Minimize object creation

#### 3. Lookahead Optimization
- **Depth Limiting**: Configurable lookahead depth
- **Move Pruning**: Eliminate obviously bad moves early
- **Score Caching**: Cache evaluation results

### AI Integration (`ai.js`)

#### Execution Flow
```javascript
function executeAIMoveStep() {
    1. Check if move sequence exists
    2. Execute next move in sequence
    3. If sequence complete, calculate new move
    4. Generate move sequence from AI decision
    5. Start executing new sequence
}
```

#### Move Sequence Generation
```javascript
// Horizontal movement
for (let i = 0; i < horizontalSteps; i++) {
    aiMoveSequence.push('right' or 'left');
}

// Rotation
for (let i = 0; i < bestMove.rot; i++) {
    aiMoveSequence.push('rotate');
}

// Hold (if needed)
if (bestMove.useHold && canHold) {
    aiMoveSequence.push('hold');
}

// Final placement
aiMoveSequence.push('hardDrop');
```

### Configuration Options

#### AI Behavior Tuning
```javascript
// In improved_ai.js
const weights = {
    linesCleared: 2.0,        // Scoring aggressiveness
    aggregateHeight: -0.3,     // Height tolerance
    holes: -0.2,              // Hole tolerance
    // ... other weights
};

// Lookahead depth
const LOOKAHEAD_DEPTH = 2;    // Number of future pieces to consider
```

#### Performance Settings
```javascript
// In ai.js
const AI_MOVE_DELAY = 50;     // Milliseconds between AI moves
const AI_UPDATE_INTERVAL = 50; // AI calculation frequency
```

### Debugging and Monitoring

#### Console Output
```javascript
// AI decision logging
addToConsole(`🎯 AI targeting ${linesCleared} line(s) clear!`);
addToConsole(`AI using HOLD for better scoring opportunity`);

// Performance monitoring
console.log(`AI decision time: ${performance.now() - startTime}ms`);
```

#### Debug Mode
```javascript
// Enable detailed logging
window.debugAI = true;

// Monitor AI decisions
window.aiDebugInfo = {
    moveCount: 0,
    averageDecisionTime: 0,
    scoringMoves: 0,
    holdUsage: 0
};
```

### Algorithm Comparison

| Algorithm | Focus | Lookahead | Hold Usage | Performance |
|-----------|-------|-----------|------------|-------------|
| **Improved AI** | Scoring | 2 pieces | High | Fast |
| **Helper AI** | Survival | None | Low | Very Fast |
| **StackRabbit** | Balance | 1 piece | Medium | Medium |

### Future Improvements

#### Potential Enhancements
1. **Machine Learning Integration**: Train AI on human gameplay data
2. **Opening Book**: Pre-calculated optimal opening moves
3. **Endgame Optimization**: Special handling for high-stack situations
4. **Multi-threading**: Parallel evaluation of different move paths
5. **Adaptive Weights**: Dynamic weight adjustment based on game state

#### Performance Targets
- **Decision Time**: <0.5ms per move
- **Memory Usage**: <1MB total
- **Lines per Game**: 200+ average
- **Tetris Rate**: 30%+ of line clears

### Testing and Validation

#### Test Scenarios
1. **Empty Board**: Verify AI builds efficiently
2. **High Stack**: Test survival capabilities
3. **Scoring Opportunities**: Validate line clearing detection
4. **Hold Usage**: Confirm strategic hold decisions
5. **Lookahead**: Test future piece consideration

#### Performance Benchmarks
```javascript
// Run performance test
function benchmarkAI() {
    const startTime = performance.now();
    for (let i = 0; i < 1000; i++) {
        findBestMove(testBoard, testPiece, testHeld, testNext);
    }
    const avgTime = (performance.now() - startTime) / 1000;
    console.log(`Average decision time: ${avgTime}ms`);
}
```

---

*This documentation is maintained alongside the codebase. For questions or contributions, please refer to the main README.md file.* 