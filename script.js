const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define the player as a basic square
let player = { x: 50, y: 50, size: 20, color: 'blue', speed: 5 };

// Function to draw the player
function drawPlayer() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size); // Draw the square
}

// Event listener for keyboard input
window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      player.y -= player.speed;
      break;
    case 'ArrowDown':
      player.y += player.speed;
      break;
    case 'ArrowLeft':
      player.x -= player.speed;
      break;
    case 'ArrowRight':
      player.x += player.speed;
      break;
  }
});

// Game loop to continuously draw the player
function gameLoop() {
  drawPlayer();
  requestAnimationFrame(gameLoop); // Keep the loop going
}

gameLoop(); // Start the game loop
