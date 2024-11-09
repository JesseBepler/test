const socket = io();

let gameState = {}; // Start with an empty game state
let playerColor = 'black'; // Default color
let playerName = ''; // Player name
let playerSpawned = false; // Flag to track if the player has spawned
const keysPressed = {}; // Track which keys are pressed

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const nameInput = document.getElementById('player-name');
const playerList = document.getElementById('player-list');

// Handle name input and spawn player on Enter key
nameInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    playerName = nameInput.value.trim();
    if (playerName.length >= 1 && playerName.length <= 9) {
      nameInput.disabled = true;
      socket.emit('spawnPlayer', { name: playerName, color: playerColor });
      playerSpawned = true;
    }
  }
});

// Handle color selection
function selectColor(color) {
  playerColor = color;
  if (playerSpawned) {
    socket.emit('colorSelected', { color });
  }
}

// Receive the initial or updated game state from the server
socket.on('gameState', (state) => {
  gameState = state;
  updateScoreboard();
  drawPlayers();
});

// Track WASD keys for movement
window.addEventListener('keydown', (event) => {
  keysPressed[event.key] = true;
  movePlayer();
});

window.addEventListener('keyup', (event) => {
  delete keysPressed[event.key];
});

// Move player based on pressed keys
function movePlayer() {
  const player = gameState.players[socket.id];
  if (player && playerSpawned) {
    if (keysPressed['w']) player.y -= 5;
    if (keysPressed['s']) player.y += 5;
    if (keysPressed['a']) player.x -= 5;
    if (keysPressed['d']) player.x += 5;

    // Emit the movement to the server
    socket.emit('move', { x: player.x, y: player.y });
  }
}

// Draw function to render the players
function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  Object.values(gameState.players || {}).forEach((player) => {
    ctx.fillStyle = player.color || 'black';
    ctx.fillRect(player.x, player.y, 20, 20);
  });
}

// Update the scoreboard with player names
function updateScoreboard() {
  playerList.innerHTML = ''; // Clear the current list
  Object.values(gameState.players).forEach(player => {
    const listItem = document.createElement('li');
    listItem.textContent = player.name;
    playerList.appendChild(listItem);
  });
}
