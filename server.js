const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// List of available colors
const colors = ['black', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'brown', 'lime', 'magenta'];

// Persistent game state with no initial players or projectiles
let gameState = {
  players: {},
  projectiles: []
};

// Serve static files (e.g., index.html, script.js, style.css)
app.use(express.static(path.join(__dirname, '/')));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle player spawn with name, color, and initial score
  socket.on('spawnPlayer', ({ name, color }) => {
    const randomX = Math.floor(Math.random() * 1580) + 10;
    const randomY = Math.floor(Math.random() * 1180) + 10;
    gameState.players[socket.id] = {
      x: randomX,
      y: randomY,
      color: color || colors[Math.floor(Math.random() * colors.length)],
      name,
      isActive: true,
      score: 0 // Initialize score
    };

    io.emit('gameState', gameState);
    console.log(`Player ${name} spawned with color ${color}`);
  });

  // Handle color selection
  socket.on('colorSelected', ({ color }) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].color = color; // Update the player's color in gameState
      io.emit('gameState', gameState); // Broadcast updated game state to all clients
    }
  });

  // Handle projectile shooting
  socket.on('shoot', (direction) => {
    const player = gameState.players[socket.id];
    if (player && player.isActive) {
      const speed = 10; // Reduced projectile speed (2x player speed)
      gameState.projectiles.push({
        x: player.x + 10, // Offset to start at player’s center
        y: player.y + 10,
        dx: direction.dx * speed,
        dy: direction.dy * speed,
        ownerId: socket.id
      });
    }
  });

  // Update projectiles and check collisions
  setInterval(() => {
    gameState.projectiles.forEach((projectile, index) => {
      projectile.x += projectile.dx;
      projectile.y += projectile.dy;

      // Check if projectile is out of bounds
      if (projectile.x < 0 || projectile.x > 1600 || projectile.y < 0 || projectile.y > 1200) {
        gameState.projectiles.splice(index, 1); // Remove projectile if out of bounds
      } else {
        // Check collision with players
        Object.entries(gameState.players).forEach(([playerId, player]) => {
          if (playerId !== projectile.ownerId && player.isActive) {
            const dist = Math.hypot(player.x + 10 - projectile.x, player.y + 10 - projectile.y);
            if (dist < 15) { // Collision radius
              player.isActive = false; // Deactivate the player
              gameState.projectiles.splice(index, 1); // Remove projectile on hit

              // Increase score for the projectile owner
              const owner = gameState.players[projectile.ownerId];
              if (owner) {
                owner.score += 1;
              }

              // Respawn the player after 1 second
              setTimeout(() => {
                player.x = Math.floor(Math.random() * 1580) + 10;
                player.y = Math.floor(Math.random() * 1180) + 10;
                player.isActive = true; // Reactivate player
                io.emit('gameState', gameState); // Update all clients
              }, 1000);
            }
          }
        });
      }
    });

    io.emit('gameState', gameState); // Broadcast updated game state
  }, 30); // Update every 30ms for a higher frame rate (approx 33 FPS)
  
  // Listen for player movement
  socket.on('move', ({ x, y }) => {
    if (gameState.players[socket.id] && gameState.players[socket.id].isActive) {
      // Apply boundary collision
      gameState.players[socket.id].x = Math.max(0, Math.min(x, 1580));
      gameState.players[socket.id].y = Math.max(0, Math.min(y, 1180));
      io.emit('gameState', gameState); // Broadcast updated game state
    }
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete gameState.players[socket.id]; // Remove the player from game state
    io.emit('gameState', gameState); // Broadcast updated game state
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
