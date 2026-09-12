const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const timeEl = document.getElementById('time');

const world = {
  width: canvas.width,
  height: canvas.height,
  groundY: canvas.height - 54,
  goal: 9,
};

const input = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const state = {
  score: 0,
  lives: 3,
  timeLeft: 45,
  running: true,
  won: false,
  bananas: [],
  enemies: [],
  player: {
    x: 110,
    y: world.groundY - 70,
    radius: 18,
    speed: 230,
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function spawnBanana() {
  const banana = {
    x: 80 + Math.random() * (world.width - 160),
    y: 80 + Math.random() * (world.groundY - 180),
    radius: 12,
  };

  for (const other of state.bananas) {
    const dx = banana.x - other.x;
    const dy = banana.y - other.y;
    if (Math.hypot(dx, dy) < 36) {
      return spawnBanana();
    }
  }

  state.bananas.push(banana);
}

function createEnemies() {
  const enemyCount = 3;
  state.enemies = [];
  for (let i = 0; i < enemyCount; i += 1) {
    state.enemies.push({
      x: 200 + i * 250,
      y: 100 + i * 120,
      radius: 18,
      speed: 80 + i * 20,
      direction: i % 2 === 0 ? 1 : -1,
      drift: Math.random() * Math.PI * 2,
    });
  }
}

function resetRound() {
  state.player.x = 110;
  state.player.y = world.groundY - 70;
  state.score = 0;
  state.lives = 3;
  state.timeLeft = 45;
  state.running = true;
  state.won = false;
  state.bananas = [];
  createEnemies();

  for (let i = 0; i < world.goal; i += 1) {
    spawnBanana();
  }
  updateHud();
}

function updateHud() {
  scoreEl.textContent = state.score;
  livesEl.textContent = state.lives;
  timeEl.textContent = Math.ceil(state.timeLeft);
}

function handleInput() {
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);

  if (dx !== 0 || dy !== 0) {
    const length = Math.hypot(dx, dy) || 1;
    const moveX = (dx / length) * state.player.speed;
    const moveY = (dy / length) * state.player.speed;

    state.player.x += moveX * (1 / 60);
    state.player.y += moveY * (1 / 60);
  }

  state.player.x = clamp(state.player.x, state.player.radius, world.width - state.player.radius);
  state.player.y = clamp(state.player.y, state.player.radius + 30, world.groundY - state.player.radius);
}

function checkBananaCollisions() {
  for (let i = state.bananas.length - 1; i >= 0; i -= 1) {
    const banana = state.bananas[i];
    const distance = Math.hypot(state.player.x - banana.x, state.player.y - banana.y);
    if (distance < state.player.radius + banana.radius) {
      state.bananas.splice(i, 1);
      state.score += 1;
      if (state.score >= world.goal) {
        state.running = false;
        state.won = true;
      } else {
        spawnBanana();
      }
    }
  }
}

function checkEnemyCollisions() {
  for (const enemy of state.enemies) {
    const distance = Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y);
    if (distance < state.player.radius + enemy.radius) {
      state.lives -= 1;
      state.player.x = 110;
      state.player.y = world.groundY - 70;
      if (state.lives <= 0) {
        state.running = false;
        state.won = false;
      }
      break;
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of state.enemies) {
    enemy.x += enemy.speed * enemy.direction * dt;
    enemy.y += Math.sin((enemy.x + enemy.drift) * 0.02) * 25 * dt;

    if (enemy.x <= 60 || enemy.x >= world.width - 60) {
      enemy.direction *= -1;
      enemy.x = clamp(enemy.x, 60, world.width - 60);
    }
  }
}

function update(dt) {
  if (!state.running) {
    return;
  }

  handleInput();
  updateEnemies(dt);
  checkBananaCollisions();
  checkEnemyCollisions();

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.running = false;
    state.won = false;
  }

  updateHud();
}

function drawBackground() {
  ctx.clearRect(0, 0, world.width, world.height);

  const sky = ctx.createLinearGradient(0, 0, 0, world.groundY);
  sky.addColorStop(0, '#8fe0ff');
  sky.addColorStop(1, '#bfeab2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, world.width, world.groundY);

  ctx.fillStyle = '#204f2d';
  for (let i = 0; i < 9; i += 1) {
    const x = i * 130 + 40;
    const trunkHeight = 120 + (i % 3) * 25;
    ctx.fillRect(x, world.groundY - trunkHeight, 24, trunkHeight);
    ctx.beginPath();
    ctx.arc(x + 12, world.groundY - trunkHeight, 40, 0, Math.PI * 2);
    ctx.arc(x + 34, world.groundY - trunkHeight + 10, 36, 0, Math.PI * 2);
    ctx.arc(x - 10, world.groundY - trunkHeight + 12, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#2f9e5e';
    ctx.fill();
    ctx.fillStyle = '#204f2d';
  }

  ctx.fillStyle = '#2c6a34';
  ctx.fillRect(0, world.groundY, world.width, world.height - world.groundY);

  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = '#1d442a';
    ctx.fillRect(i * 80 + 18, world.groundY + 6, 18, 34);
    ctx.fillStyle = '#326f36';
    ctx.fillRect(i * 80 + 12, world.groundY + 22, 30, 10);
  }
}

function drawBanana(banana) {
  ctx.save();
  ctx.translate(banana.x, banana.y);

  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, banana.radius, Math.PI * 0.25, Math.PI * 1.75);
  ctx.stroke();

  ctx.fillStyle = '#f8d14a';
  ctx.beginPath();
  ctx.ellipse(0, 0, banana.radius - 1, banana.radius * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#7d5b04';
  ctx.beginPath();
  ctx.moveTo(-banana.radius + 4, 0);
  ctx.lineTo(banana.radius - 4, 0);
  ctx.stroke();

  ctx.restore();
}

function drawPlayer() {
  const { x, y, radius } = state.player;
  ctx.beginPath();
  ctx.fillStyle = '#8c5f2d';
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f4d7a0';
  ctx.beginPath();
  ctx.arc(x - 6, y - 4, 4, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1f1b18';
  ctx.beginPath();
  ctx.arc(x - 6, y - 4, 2, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 4, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.strokeStyle = '#1f1b18';
  ctx.lineWidth = 2;
  ctx.arc(x, y + 4, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  ctx.strokeStyle = '#2d8a35';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.quadraticCurveTo(-6, -16, 0, 0);
  ctx.quadraticCurveTo(12, 16, 18, 0);
  ctx.stroke();

  ctx.fillStyle = '#7dd66b';
  ctx.beginPath();
  ctx.arc(-10, -6, 5, 0, Math.PI * 2);
  ctx.arc(10, -6, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawStatusOverlay() {
  if (state.running) {
    return;
  }

  ctx.fillStyle = 'rgba(7, 19, 11, 0.68)';
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = '#f4f7d7';
  ctx.textAlign = 'center';
  ctx.font = 'bold 42px Arial';
  ctx.fillText(state.won ? 'You Win!' : 'Game Over', world.width / 2, world.height / 2 - 20);

  ctx.font = '24px Arial';
  ctx.fillText(
    state.won ? 'You collected every banana!' : 'The jungle got you this time.',
    world.width / 2,
    world.height / 2 + 30,
  );

  ctx.font = '18px Arial';
  ctx.fillText('Press R to play again', world.width / 2, world.height / 2 + 72);
}

function draw() {
  drawBackground();

  for (const banana of state.bananas) {
    drawBanana(banana);
  }

  for (const enemy of state.enemies) {
    drawEnemy(enemy);
  }

  drawPlayer();
  drawStatusOverlay();
}

let lastFrame = 0;
function frame(timestamp) {
  const dt = Math.min((timestamp - lastFrame) / 1000 || 0.016, 0.03);
  lastFrame = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') input.up = true;
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') input.down = true;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') input.left = true;
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') input.right = true;

  if (event.key.toLowerCase() === 'r' && !state.running) {
    resetRound();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') input.up = false;
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') input.down = false;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') input.left = false;
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') input.right = false;
});

resetRound();
requestAnimationFrame(frame);
