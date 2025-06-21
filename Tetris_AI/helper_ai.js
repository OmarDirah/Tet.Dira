// Cleanest-stacking Tetris AI (classic heuristics) adapted for browser

(function (window) {

  var PIECES = [
    [[1, 1, 1, 1]],          // I
    [[1, 1], [1, 1]],        // O
    [[0,1,0],[1,1,1]],       // T
    [[0,1,1],[1,1,0]],       // S
    [[1,1,0],[0,1,1]],       // Z
    [[1,0,0],[1,1,1]],       // J
    [[0,0,1],[1,1,1]]        // L
  ];

  function cloneBoard(board) {
    return board.map(row => row.slice());
  }

  function placePiece(board, piece, x, y) {
    var newBoard = cloneBoard(board);
    var shape = PIECES[piece];
    for (var r = 0; r < shape.length; r++) {
      for (var c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          var by = y + r, bx = x + c;
          if (by >= 0 && by < 20 && bx >= 0 && bx < 10)
            newBoard[by][bx] = piece + 1;
        }
      }
    }
    return newBoard;
  }

  function getLegalPlacements(board, piece) {
    var shape = PIECES[piece];
    var placements = [];
    for (var rot = 0; rot < 4; rot++) {
      var w = shape[0].length, h = shape.length;
      for (var x = -2; x <= 10 - w + 2; x++) {
        var y = 0;
        while (canMove(board, shape, x, y+1)) y++;
        if (canMove(board, shape, x, y))
          placements.push({x: x, y: y, rot: rot});
      }
      shape = rotate(shape);
    }
    return placements;
  }

  function canMove(board, shape, x, y) {
    for (var r = 0; r < shape.length; r++) {
      for (var c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          var by = y + r, bx = x + c;
          if (bx < 0 || bx >= 10 || by >= 20) return false;
          if (by >= 0 && board[by][bx]) return false;
        }
      }
    }
    return true;
  }

  function rotate(shape) {
    var w = shape[0].length, h = shape.length;
    var out = Array.from({length: w}, () => Array(h).fill(0));
    for (var r = 0; r < h; r++)
      for (var c = 0; c < w; c++)
        out[c][h-1-r] = shape[r][c];
    return out;
  }

  function linesCleared(board) {
    return board.filter(row => row.every(cell => cell)).length;
  }

  function evalBoard(board) {
    let aggregateHeight = 0, holes = 0, bumpiness = 0, leftFlatBonus = 0;
    let prevHeight = -1;
    let rightWellPenalty = 0;
    let heights = [];
    for (let c = 0; c < 10; c++) {
      let h = 0;
      while (h < 20 && !board[h][c]) h++;
      heights[c] = 20 - h;
      aggregateHeight += heights[c];
      if (prevHeight >= 0) bumpiness += Math.abs(heights[c] - prevHeight);
      prevHeight = heights[c];
      for (let r = h+1; r < 20; r++) {
        if (!board[r][c]) holes++;
      }
      if (c === 9) {
        for (let r = 0; r < 20; r++) {
          if (board[r][9]) rightWellPenalty += 1;
        }
      }
    }
    // Encourage left-side flatness (columns 0-7, check against next col)
    for (let c = 0; c < 8; c++) {
      if (Math.abs(heights[c] - heights[c+1]) <= 1) leftFlatBonus += 1;
    }
    return -0.51066 * aggregateHeight
         + 0.2 * linesCleared(board)
         - 3.0 * holes
         - 1.3 * bumpiness
         - 3.0 * rightWellPenalty
         + 2.0 * leftFlatBonus;
  }

  function find_best_move(board, currentId, holdId, nextIds) {
    let best = null, bestScore = -1e9;
    let pieces = [currentId, holdId].filter(x => x !== null);
    for (let useHeld = 0; useHeld < pieces.length; useHeld++) {
      let piece = pieces[useHeld];
      let placements = getLegalPlacements(board, piece);
      for (let place of placements) {
        let newBoard = placePiece(board, piece, place.x, place.y);
        let score = evalBoard(newBoard);
        if (score > bestScore) {
          bestScore = score;
          best = {
            pieceId: piece,
            useHold: useHeld === 1,
            x: place.x,
            y: place.y,
            rot: place.rot
          };
        }
      }
    }
    return best;
  }

  window.find_best_move = find_best_move;

})(typeof window !== "undefined" ? window : globalThis);
