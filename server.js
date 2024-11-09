const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Persistent game state with no initial players
let gameState = {
  players: {}
};

// Serve static files (e.g., index.html, script.js, style.css)
app.use(express.static(path.join(__dirname, '/')));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Assign a new player with a random position and default color (black)
  gameState.players[socket.id] = {
    x: Math.floor(Math.random() * 780) + 10, // Random x within canvas (10px padding)
    y: Math.floor(Math.random() * 580) + 10, // Random y within canvas (10px padding)
    color: 'black' // Default color
  };

  // Broadcast the updated game state to all clients
  io.emit('gameState', gameState);
  console.log('New player added:', gameState.players[socket.id]);

  // Listen for a color selection from the player
  socket.on('colorSelected', ({ color }) => {
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].color = color;
      console.log(`Player ${socket.id} selected color: ${color}`);
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
