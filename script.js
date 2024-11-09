const socket = io();

let gameState = {};
let playerColor = 'black';
let playerName = '';
let playerSpawned = false;
let isMachineGunActive = false;
let mouseDirection = { dx: 0, dy: 0 };
let winnerMessage = ''; // Store the winner message

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const nameInput = document.getElementById('player-name');
const playerList = document.getElementById('player-list');

let terrain = [];
let powerUps = [];

// Define a color sequence for the rainbow effect
const rainbowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
let colorIndex = 0;

// Receive terrain data from the server
socket.on('terrain', (terrainData) => {
  terrain = terrainData;
  console.log("Received terrain data:", terrain); // Debug to confirm terrain reception
});

// Receive power-up data from the server
socket.on('powerUps', (powerUpData) => {
  powerUps = powerUpData;
  console.log("Received power-ups data:", powerUps); // Debug to confirm power-up reception
});

// Listen for winner announcement from server
socket.on('showWinner', (winnerName) => {
  winnerMessage = `${winnerName.toUpperCase()} WON!!!`; // Set winner message
  setTimeout(() => { winnerMessage = ''; }, 5000); // Clear after 5 seconds
});

// Handle name input and spawn player
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

// Draw terrain
function drawTerrain() {
  terrain.forEach(block => {
    ctx.fillStyle = 'grey';
    ctx.fillRect(block.x, block.y, block.width, block.height);
  });
}

// Draw power-ups with rainbow effect and increased size
function drawPowerUps() {
  colorIndex = (colorIndex + 1) % rainbowColors.length;
  powerUps.forEach(powerUp => {
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = rainbowColors[colorIndex];
    ctx.fillText(powerUp.type[0], powerUp.x + 10, powerUp.y + 30);
  });
}

// Draw players, projectiles, and winner message
function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawTerrain(); // Draw terrain before other elements
  drawPowerUps();

  Object.values(gameState.players || {}).forEach((player) => {
    if (player.isActive) {
      ctx.fillStyle = player.color || 'black';
      ctx.fillRect(player.x, player.y, 20, 20);
    }
  });

  gameState.projectiles.forEach((projectile) => {
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
  });

  // Draw winner message if exists
  if (winnerMessage) {
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = 'green';
    ctx.textAlign = 'center';
    ctx.fillText(winnerMessage, canvas.width / 2, canvas.height / 2);
  }
}

// Update the scoreboard with player names and scores
function updateScoreboard() {
  playerList.innerHTML = '';
  Object.values(gameState.players).forEach(player => {
    const listItem = document.createElement('li');
    listItem.textContent = `${player.name}: ${player.score}`;
    playerList.appendChild(listItem);
  });
}

// Listen for updated game state and update scoreboard
socket.on('gameState', (state) => {
  gameState = state;
  powerUps = state.powerUps;
  updateScoreboard();
  drawPlayers();
});

// Track movement keys and update movement
const keysPressed = { w: false, a: false, s: false, d: false };
setInterval(() => {
  movePlayer();
}, 30);

function movePlayer() {
  const player = gameState.players[socket.id];
  if (!player || !playerSpawned || !player.isActive) return;

  let dx = 0;
  let dy = 0;

  if (keysPressed['w']) dy -= 1;
  if (keysPressed['s']) dy += 1;
  if (keysPressed['a']) dx -= 1;
  if (keysPressed['d']) dx += 1;

  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  const newX = player.x + dx * player.speed;
  const newY = player.y + dy * player.speed;
  socket.emit('move', { x: newX, y: newY });
}

window.addEventListener('keydown', (event) => {
  if (['w', 'a', 's', 'd'].includes(event.key)) {
    keysPressed[event.key] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (['w', 'a', 's', 'd'].includes(event.key)) {
    keysPressed[event.key] = false;
  }
});

// Track mouse movement to update firing direction for MACHINE GUN
canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const player = gameState.players[socket.id];
  if (player && playerSpawned && player.isActive) {
    const angle = Math.atan2(mouseY - (player.y + 10), mouseX - (player.x + 10));
    mouseDirection = { dx: Math.cos(angle), dy: Math.sin(angle) };
  }
});

let lastShotTime = 0;
canvas.addEventListener('mousedown', () => {
  const player = gameState.players[socket.id];
  if (player && playerSpawned && player.isActive) {
    const fireProjectile = () => {
      if (Date.now() - lastShotTime >= player.fireRate) {
        lastShotTime = Date.now();
        socket.emit('shoot', mouseDirection);
      }
    };

    if (player.fireRate < 500) {
      isMachineGunActive = true;
      const autoFire = setInterval(() => {
        if (!isMachineGunActive) {
          clearInterval(autoFire);
          return;
        }
        fireProjectile();
      }, player.fireRate);

      canvas.addEventListener('mouseup', () => {
        isMachineGunActive = false;
      }, { once: true });
    } else {
      fireProjectile();
    }
  }
});
