const socket = io();

let gameState = {}; // Start with an empty game state
let playerColor = 'black'; // Default color
let playerName = ''; // Player name
let playerSpawned = false; // Flag to track if the player has spawned
let moveSpeed = 7.5; // Increased player move speed

let lastShotTime = 0; // Track the last time a shot was fired
const keysPressed = { w: false, a: false, s: false, d: false }; // Track which keys are pressed

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

// Track WASD keys for movement
window.addEventListener('keydown', (event) => {
  if (['w', 'a', 's', 'd'].includes(event.key)) {
    keysPressed[event.key] = true;
    movePlayer();
  }
});

window.addEventListener('keyup', (event) => {
  if (['w', 'a', 's', 'd'].includes(event.key)) {
    keysPressed[event.key] = false;
    movePlayer(); // Check movement state when a key is released
  }
});

// Move player based on pressed keys
function movePlayer() {
  const player = gameState.players[socket.id];
  if (player && playerSpawned && player.isActive) {
    // Determine movement directions
    let dx = 0;
    let dy = 0;

    if (keysPressed['w']) dy -= 1;
    if (keysPressed['s']) dy += 1;
    if (keysPressed['a']) dx -= 1;
    if (keysPressed['d']) dx += 1;

    // Normalize diagonal movement to keep speed consistent
    if (dx !== 0 && dy !== 0) {
      dx *= Math.SQRT1_2;
      dy *= Math.SQRT1_2;
    }

    // Calculate new positions
    const newX = player.x + dx * moveSpeed;
    const newY = player.y + dy * moveSpeed;

    socket.emit('move', { x: newX, y: newY });
  }
}

// Shoot projectile based on mouse click and direction
canvas.addEventListener('mousedown', (event) => {
  const now = Date.now();
  if (now - lastShotTime >= 500) { // Enforce 2 shots per second (1000ms / 2)
    const player = gameState.players[socket.id];
    if (player && playerSpawned && player.isActive) {
      lastShotTime = now;

      // Calculate direction based on mouse position
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const angle = Math.atan2(mouseY - (player.y + 10), mouseX - (player.x + 10));
      const direction = { dx: Math.cos(angle), dy: Math.sin(angle) };

      // Emit the shoot event with direction
      socket.emit('shoot', direction);
    }
  }
});

// Draw function to render the players and projectiles
function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw players
  Object.values(gameState.players || {}).forEach((player) => {
    if (player.isActive) {
      ctx.fillStyle = player.color || 'black';
      ctx.fillRect(player.x, player.y, 20, 20);
    }
  });

  // Draw projectiles
  gameState.projectiles.forEach((projectile) => {
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
  });
}

// Update the scoreboard with player names and scores
function updateScoreboard() {
  playerList.innerHTML = ''; // Clear the current list
  Object.values(gameState.players).forEach(player => {
    const listItem = document.createElement('li');
    listItem.textContent = `${player.name}            ${player.score}`;
    playerList.appendChild(listItem);
  });
}

// Listen for updated game state
socket.on('gameState', (state) => {
  gameState = state;
  updateScoreboard();
  drawPlayers();
});
