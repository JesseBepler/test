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

  // Log and send the current game state to the newly connected client
  console.log('Sending initial gameState to client:', JSON.stringify(gameState));
  socket.emit('gameState', gameState);
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
