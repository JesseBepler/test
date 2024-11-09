const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const colors = ['black', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'brown', 'lime', 'magenta'];
const powerUpTypes = ['SPEED', 'MACHINE GUN'];
const maxPowerUps = 2;
const gameArea = { width: 1600, height: 1200 };
const winningKillCount = 3;

let gameState = {
  players: {},
  projectiles: [],
  terrain: [],
  powerUps: []
};

// Generate terrain blocks as squares
function generateTerrain() {
  const terrainCount = 20;
  const minSize = 100;
  const maxSize = 150;

  for (let i = 0; i < terrainCount; i++) {
    const width = Math.floor(Math.random() * (maxSize - minSize) + minSize);
    const height = Math.floor(Math.random() * (maxSize - minSize) + minSize);
    const x = Math.floor(Math.random() * (gameArea.width - width));
    const y = Math.floor(Math.random() * (gameArea.height - height));

    gameState.terrain.push({ x, y, width, height });
  }
}

// Check if a position collides with any terrain
function isPositionCollidingWithTerrain(x, y, width = 20, height = 20) {
  return gameState.terrain.some(block =>
    x < block.x + block.width &&
    x + width > block.x &&
    y < block.y + block.height &&
    y + height > block.y
  );
}

// Generate a valid spawn position that doesn’t collide with terrain
function getValidSpawnPosition() {
  let x, y;
  do {
    x = Math.floor(Math.random() * (gameArea.width - 20));
    y = Math.floor(Math.random() * (gameArea.height - 20));
  } while (isPositionCollidingWithTerrain(x, y));
  return { x, y };
}

// Spawn a power-up in a terrain-free location
function spawnPowerUp() {
  if (gameState.powerUps.length >= maxPowerUps) return;

  const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  const { x, y } = getValidSpawnPosition();

  gameState.powerUps.push({ type, x, y });
  io.emit('powerUps', gameState.powerUps);
}

// Reset game state and generate new terrain
function resetGameState() {
  gameState = {
    players: {},
    projectiles: [],
    terrain: [],
    powerUps: []
  };
  generateTerrain();
}

// Broadcast a winning message and reset the game
function handleWin(winnerName) {
  io.emit('showWinner', winnerName);
  console.log(`${winnerName} has won the game!`);

  setTimeout(() => {
    resetGameState();
    io.emit('gameState', gameState);
  }, 5000);
}

// Generate initial terrain when server starts
generateTerrain();

app.use(express.static(path.join(__dirname, '/')));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.emit('terrain', gameState.terrain);
  socket.emit('powerUps', gameState.powerUps);

  socket.on('spawnPlayer', ({ name, color }) => {
    const { x, y } = getValidSpawnPosition();
    gameState.players[socket.id] = {
      x,
      y,
      color: color || colors[Math.floor(Math.random() * colors.length)],
      name,
      isActive: true,
      score: 0,
      speed: 7.5,
      fireRate: 500,
      kills: 0
    };
    io.emit('gameState', gameState);
  });

  socket.on('colorSelected', ({ color }) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].color = color;
      io.emit('gameState', gameState);
    }
  });

  socket.on('shoot', (direction) => {
    const player = gameState.players[socket.id];
    if (player && player.isActive) {
      gameState.projectiles.push({
        x: player.x + 10,
        y: player.y + 10,
        dx: direction.dx * 8.5,
        dy: direction.dy * 8.5,
        ownerId: socket.id
      });
    }
  });

  function handleProjectileHit(targetPlayerId, shooterId) {
    const targetPlayer = gameState.players[targetPlayerId];
    const shooter = gameState.players[shooterId];
    
    if (targetPlayer && shooter) {
      targetPlayer.isActive = false;
      shooter.score += 1;
      shooter.kills += 1;

      if (shooter.kills >= winningKillCount) {
        handleWin(shooter.name);
      }

      setTimeout(() => {
        const { x, y } = getValidSpawnPosition();
        targetPlayer.x = x;
        targetPlayer.y = y;
        targetPlayer.isActive = true;
        io.emit('gameState', gameState);
      }, 1000);
    }
  }

  function isProjectileCollidingWithTerrain(projectile) {
    return gameState.terrain.some(block =>
      projectile.x < block.x + block.width &&
      projectile.x + 5 > block.x &&
      projectile.y < block.y + block.height &&
      projectile.y + 5 > block.y
    );
  }

  // Check for player collision with power-ups
  function handlePlayerPowerUpCollision(playerId) {
    const player = gameState.players[playerId];
    if (!player) return;

    gameState.powerUps = gameState.powerUps.filter(powerUp => {
      const distance = Math.hypot(player.x + 10 - powerUp.x, player.y + 10 - powerUp.y);
      const isColliding = distance < 20;

      if (isColliding) {
        if (powerUp.type === 'SPEED') {
          player.speed = Math.min(player.speed * 2, 15); // Set max speed
        } else if (powerUp.type === 'MACHINE GUN') {
          player.fireRate = Math.max(player.fireRate / 2, 200); // Set min fire rate
        }
        io.emit('gameState', gameState); // Broadcast updated player state
      }

      return !isColliding; // Remove power-up if it was picked up
    });

    io.emit('powerUps', gameState.powerUps); // Broadcast updated power-ups
  }

  setInterval(() => {
    gameState.projectiles.forEach((projectile, index) => {
      projectile.x += projectile.dx;
      projectile.y += projectile.dy;

      if (
        projectile.x < 0 ||
        projectile.x > gameArea.width ||
        projectile.y < 0 ||
        projectile.y > gameArea.height ||
        isProjectileCollidingWithTerrain(projectile)
      ) {
        gameState.projectiles.splice(index, 1);
      } else {
        Object.entries(gameState.players).forEach(([playerId, player]) => {
          if (playerId !== projectile.ownerId && player.isActive) {
            const dist = Math.hypot(player.x + 10 - projectile.x, player.y + 10 - projectile.y);
            if (dist < 15) {
              handleProjectileHit(playerId, projectile.ownerId);
              gameState.projectiles.splice(index, 1);
            }
          }
        });
      }
    });
    io.emit('gameState', gameState);
  }, 30);

  // Handle player movement and power-up collision check
  socket.on('move', ({ x, y }) => {
    const player = gameState.players[socket.id];
    if (player && player.isActive) {
      const newX = Math.max(0, Math.min(x, gameArea.width - 20));
      const newY = Math.max(0, Math.min(y, gameArea.height - 20));

      if (!isPositionCollidingWithTerrain(newX, newY)) {
        player.x = newX;
        player.y = newY;
        handlePlayerPowerUpCollision(socket.id); // Check for power-up collision on movement
        io.emit('gameState', gameState);
      }
    }
  });

  socket.on('disconnect', () => {
    delete gameState.players[socket.id];
    io.emit('gameState', gameState);
  });
});

// Periodically spawn power-ups if below the maximum limit
setInterval(() => {
  spawnPowerUp();
}, 20000);

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
