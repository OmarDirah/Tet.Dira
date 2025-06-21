# TET.DIRA - Tetris AI Project

A fully functional Tetris game with an intelligent AI solver, featuring smooth animations, hold functionality, and real-time decision making.

## 🎮 Features

### Game Features
- **Complete Tetris Gameplay**: All standard Tetris mechanics
- **Hold System**: Save pieces for strategic use
- **Next Piece Preview**: See upcoming pieces
- **Score System**: Points, levels, and lines cleared
- **Smooth Controls**: Responsive keyboard input
- **Pause Functionality**: ESC to pause/resume

### AI Features
- **Intelligent Decision Making**: Advanced board evaluation
- **Smooth Movement**: Natural piece animations
- **Hold Optimization**: Strategic use of hold feature
- **Real-time Analysis**: Live board state evaluation
- **Clean Placement**: Organized stacking patterns

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser

### Installation
1. Clone the repository:
```bash
git clone https://github.com/OmarDirah/Tet.Dira.git
cd Tet.Dira
```

2. Start the local server:
```bash
node server.js
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 How to Play

### Manual Controls
- **Arrow Keys**: Move pieces left/right/down
- **Z**: Rotate counter-clockwise
- **X**: Rotate clockwise
- **Space/Up Arrow**: Hard drop
- **Shift**: Hold piece
- **ESC**: Pause/Resume
- **R**: Restart game

### AI Controls
- **AI Solve Button**: Start/Stop AI
- **Console Area**: View AI decisions in real-time

## 🤖 AI System

### Architecture
The AI uses a clean, efficient approach with:
- **Board Evaluation**: Height, holes, bumpiness, and line completion
- **Move Generation**: All valid positions and rotations
- **Simulation**: Future board state prediction
- **Smooth Execution**: Step-by-step movement with animations

### Features
- **Smart Hold Usage**: Saves pieces for optimal placement
- **Line Clearing**: Prioritizes moves that clear lines
- **Height Management**: Keeps board height low
- **Hole Avoidance**: Minimizes gaps in the stack

## 📁 Project Structure

```
Tetris_AI/
├── index.html          # Main game interface
├── main.js             # Game logic and AI integration
├── simple_ai.js        # Clean AI implementation
├── server.js           # Local development server
├── README.md           # This file
├── TECHNICAL_DOCS.md   # Technical documentation
├── API_DOCS.md         # API documentation
└── test_*.html         # Various test pages
```

## 🔧 Development

### Key Files
- **`main.js`**: Core game mechanics, rendering, and AI integration
- **`simple_ai.js`**: Clean, efficient AI decision making
- **`index.html`**: Game interface and styling

### AI Components
- **`findBestMove()`**: Main AI decision function
- **`evaluateBoard()`**: Board state scoring
- **`simulatePlacement()`**: Future state prediction
- **`executeSmoothMovement()`**: Animated piece movement

## 🎨 UI Features

### Game Interface
- **Main Game Board**: 10x20 Tetris grid
- **Hold Area**: Current held piece
- **Next Pieces**: Upcoming pieces preview
- **Score Display**: Points, level, lines
- **AI Console**: Real-time decision logging
- **Controls Panel**: Keyboard shortcuts

### Visual Design
- **Dark Theme**: Modern, easy-on-the-eyes interface
- **Smooth Animations**: Natural piece movement
- **Responsive Layout**: Works on different screen sizes
- **Clear Visual Feedback**: Easy to follow gameplay

## 🧪 Testing

### Test Pages
- **`test_simple.html`**: Basic AI functionality test
- **`debug_canvas.html`**: Canvas rendering diagnostics
- **`minimal_game.html`**: Minimal game version
- **`basic_test.html`**: Core functionality verification

### Debug Features
- **Console Logging**: Detailed AI decision logs
- **Canvas Testing**: Visual rendering verification
- **Error Handling**: Graceful fallbacks and recovery

## 📊 Performance

### Optimizations
- **Efficient Algorithms**: Clean, fast AI decision making
- **Smooth Rendering**: 60fps game loop
- **Memory Management**: Proper cleanup and state management
- **Error Recovery**: Robust error handling

### System Requirements
- **Browser**: Modern browser with Canvas support
- **Performance**: Runs smoothly on most devices
- **Memory**: Low memory footprint

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- **JavaScript**: ES6+ features
- **Comments**: Clear, descriptive comments
- **Error Handling**: Comprehensive error management
- **Performance**: Optimized for smooth gameplay

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Tetris game mechanics and rules
- Canvas API for rendering
- Modern JavaScript features
- Open source community

---

**TET.DIRA** - Where Tetris meets intelligent AI! 🎮🤖
