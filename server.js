const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// List of available colors
const colors = ['black', 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'brown', 'lime', 'magenta'];

// Persistent game state with no initial players
let gameState = {
  players: {}
};

// Serve static files (e.g., index.html, script.js, style.css)
app.use(express.static(path.join(__dirname, '/')));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle player spawn with name and color
  socket.on('spawnPlayer', ({ name, color }) => {
    const randomX = Math.floor(Math.random() * 780) + 10;
    const randomY = Math.floor(Math.random() * 580) + 10;
    gameState.players[socket.id] = {
      x: randomX,
      y: randomY,
      color: color || colors[Math.floor(Math.random() * colors.length)],
      name
    };

    io.emit('gameState', gameState);
    console.log(`Player ${name} spawned with color ${color}`);
  });

  // Listen for a color selection from the player
  socket.on('colorSelected', ({ color }) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].color = color;
      io.emit('gameState', gameState); // Broadcast updated game state
    }
  });

  // Listen for player movement
  socket.on('move', ({ x, y }) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].x = x;
      gameState.players[socket.id].y = y;
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
