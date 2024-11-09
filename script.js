const socket = io();

// Local reference to the game state
let gameState = {
  players: {
    blue: { x: 50, y: 50, claimedBy: null },
    red: { x: 150, y: 150, claimedBy: null }
  }
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Receive the initial game state from the server
socket.on('gameState', (state) => {
  gameState = state;
  drawPlayers();
});

// Function to claim a character
function claimCharacter(color) {
  socket.emit('claimCharacter', { color, userId: socket.id });
}

// Listen for key events to move a character
window.addEventListener('keydown', (event) => {
  Object.entries(gameState.players).forEach(([color, player]) => {
    if (player.claimedBy === socket.id) {
      switch (event.key) {
        case 'ArrowUp': player.y -= 5; break;
        case 'ArrowDown': player.y += 5; break;
        case 'ArrowLeft': player.x -= 5; break;
        case 'ArrowRight': player.x += 5; break;
      }
      socket.emit('move', { color, x: player.x, y: player.y });
    }
  });
});

// Draw function to render the players
function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  Object.entries(gameState.players).forEach(([color, player]) => {
    ctx.fillStyle = color;
    ctx.fillRect(player.x, player.y, 20, 20); // Draw each player as a square
  });
}

// Game loop to update the drawing
function gameLoop() {
  drawPlayers();
  requestAnimationFrame(gameLoop);
}

gameLoop();
