const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define the two players with default positions and colors
let players = {
  blue: { x: 50, y: 50, size: 20, color: 'blue', claimedBy: null },
  red: { x: 150, y: 150, size: 20, color: 'red', claimedBy: null }
};

// Simulate user IP (for demonstration purposes)
let userIP = 'User-' + Math.floor(Math.random() * 1000);

// Function to draw players
function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  Object.values(players).forEach(player => {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
  });
}

// Function to claim a character
function claimCharacter(color) {
  Object.keys(players).forEach(key => {
    if (players[key].claimedBy === userIP) {
      players[key].claimedBy = null; // Release previously claimed character
    }
  });
  
  // Claim the new character if it's not already claimed
  if (players[color].claimedBy === null) {
    players[color].claimedBy = userIP;
    console.log(`${userIP} claimed ${color}`);
  } else {
    console.log(`${color} is already claimed by another user.`);
  }
}

// Listen for keyboard input and move the claimed character
window.addEventListener('keydown', (event) => {
  Object.values(players).forEach(player => {
    if (player.claimedBy === userIP) { // Only move claimed character
      switch (event.key) {
        case 'ArrowUp':
          player.y -= 5;
          break;
        case 'ArrowDown':
          player.y += 5;
          break;
        case 'ArrowLeft':
          player.x -= 5;
          break;
        case 'ArrowRight':
          player.x += 5;
          break;
      }
    }
  });
});

// Game loop to continuously draw players
function gameLoop() {
  drawPlayers();
  requestAnimationFrame(gameLoop); // Keep the loop going
}

gameLoop(); // Start the game loop
