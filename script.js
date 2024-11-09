const socket = io();

let gameState = {}; // Start with an empty game state
let playerColor = 'black'; // Default color

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Receive the initial or updated game state from the server
socket.on('gameState', (state) => {
  gameState = state;
  console.log('Received gameState from server:', JSON.stringify(gameState)); // Log the received game state
  drawPlayers();
});

// Function to select a color
function selectColor(color) {
  playerColor = color;
  console.log(`Selected color: ${color}`);
  // Emit the selected color to the server
  socket.emit('colorSelected', { color });
}

// Listen for key events to move a character
window.addEventListener('keydown', (event) => {
  const player = gameState.players[socket.id];
  if (player) { // Only process movement if player exists
    switch (event.key) {
      case 'ArrowUp': player.y -= 5; break;
      case 'ArrowDown': player.y += 5; break;
      case 'ArrowLeft': player.x -= 5; break;
      case 'ArrowRight': player.x += 5; break;
    }
    // Emit the movement to the server
    socket.emit('move', { x: player.x, y: player.y });
  }
});

// Draw function to render the players
function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  Object.entries(gameState.players || {}).forEach(([id, player]) => {
    ctx.fillStyle = player.color || 'black';
    ctx.fillRect(player.x, player.y, 20, 20);
  });
}
