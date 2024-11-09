const socket = io();

let gameState = {}; // Start with an empty game state

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

socket.on('gameState', (state) => {
  gameState = state;
  console.log('Received gameState from server:', JSON.stringify(gameState)); // Log the received game state
  drawPlayers();
});

function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  Object.entries(gameState.players || {}).forEach(([color, player]) => {
    console.log(`Drawing ${color} player at position x: ${player.x}, y: ${player.y}`); // Log player positions
    ctx.fillStyle = color;
    ctx.fillRect(player.x, player.y, 20, 20);
  });
}
