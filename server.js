const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const players = {};
const bullets = [];

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new player
  players[socket.id] = {
    x: Math.random() * 700 + 50,
    y: Math.random() * 500 + 50,
    angle: 0,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`
  };

  // Handle player movement & aim updates
  socket.on('playerUpdate', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].angle = data.angle;
    }
  });

  // Handle shooting
  socket.on('shoot', (bulletData) => {
    bullets.push({
      id: socket.id,
      x: bulletData.x,
      y: bulletData.y,
      vx: Math.cos(bulletData.angle) * 10,
      vy: Math.sin(bulletData.angle) * 10,
      life: 100 // Frame lifespan
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
  });
});

// Main game loop (60 FPS)
setInterval(() => {
  // Update bullet positions
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx;
    b.y += b.vy;
    b.life--;

    if (b.life <= 0) {
      bullets.splice(i, 1);
    }
  }

  // Broadcast state to all players
  io.emit('stateUpdate', { players, bullets });
}, 1000 / 60);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
