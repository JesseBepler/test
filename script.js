const socket = io();

let gameState = {}; // Start with an empty game state

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Receive the initial or updated game state from the server
socket.on('gameState', (state) => {
  gameState = state;
  console.log('Received gameState from server:', JSON.stringify(gameState)); // Log the received game state
  drawPlayers();
});

// Function to claim a character
function claimCharacter(color) {
  socket.emit('claimCharacter', { color, userId: socket.id });
}

// Listen for key events to move a character
window.addEventListener('keydown', (event) => {
  Object.entries(gameState.players || {}).forEach(([color, player]) => {
    if (player.claimedBy === socket.id) {
      // Move the character based on arrow keys
      switch (event.key) {
        case 'ArrowUp': player.y -= 5; break;
        case 'ArrowDown': player.y += 5; break;
        case 'ArrowLeft': player.x -= 5; break;
        case 'ArrowRight': player.x += 5; break;
      }
      // Emit the movement to the server
      socket.emit('move', { color, x: player.x, y: player.y });
    }
  });
});

// Draw function to render the players
function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  Object.entries(gameState.players || {}).forEach(([color, player]) => {
    console.log(`Drawing ${color} player at position x: ${player.x}, y: ${player.y}`); // Log player positions
    ctx.fillStyle = color;
    ctx.fillRect(player.x, player.y, 20, 20);
  });
}
