const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Persistent game state with initial positions
let gameState = {
  players: {
    blue: { x: 50, y: 50, claimedBy: null },
    red: { x: 150, y: 150, claimedBy: null }
  }
};

// Serve static files (e.g., index.html, script.js, style.css)
app.use(express.static(path.join(__dirname, '/')));

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send the current game state to the newly connected client
  socket.emit('gameState', gameState);
  console.log('Sending initial gameState to client:', JSON.stringify(gameState));

  // Listen for a player claiming a character
  socket.on('claimCharacter', ({ color, userId }) => {
    console.log(`User ${userId} attempting to claim ${color} character`);

    // Release any previously claimed character by this user
    Object.keys(gameState.players).forEach(player => {
      if (gameState.players[player].claimedBy === userId) {
        gameState.players[player].claimedBy = null;
      }
    });

    // Claim the character if it's not already claimed
    if (gameState.players[color].claimedBy === null) {
      gameState.players[color].claimedBy = userId;
      console.log(`Character ${color} claimed by user ${userId}`);
      io.emit('gameState', gameState); // Broadcast updated game state
    }
  });

  // Listen for player movement
  socket.on('move', ({ color, x, y }) => {
    if (gameState.players[color]) {
      gameState.players[color].x = x;
      gameState.players[color].y = y;
      console.log(`Updated position of ${color} player to (${x}, ${y})`);
      io.emit('gameState', gameState); // Broadcast updated game state
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
