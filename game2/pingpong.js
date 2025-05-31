// select canvas element
const canvas = document.getElementById("game");
const container = document.getElementById("game-container");
const ctx = canvas.getContext('2d');

let gameCountdown = true;
let gameOver = false;
let lastHitter = null;

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 10,
  velocityX: 5,
  velocityY: 5,
  speed: 7,
  color: "rgb(225, 225, 225)"
};

const buffItem = {
  x: -100,
  y: -100,
  radius: 30,
  active: false,
  effect: null,
  color: "rgb(172, 134, 191)",
  spawnTime: null,
  duration: 20000
};

const effects = {
  speedUp: {
    name: "Speed Up",
    duration: 10000,
    apply(paddle) {
      paddle.height = 150;
      paddle.buffSpeed = 5;
    },
    remove(paddle) {
      paddle.height = 100;
      paddle.buffSpeed = 0;
    }
  }
};

const localUser = {
  x: 0,
  y: (canvas.height - 100) / 2,
  width: 10,
  height: 100,
  score: 0,
  speed: 5,
  buffSpeed: 0,
  buffTimer: null,
  color: "rgb(49, 125, 150)"
};

const remoteUser = {
  x: canvas.width - 10,
  y: (canvas.height - 100) / 2,
  width: 10,
  height: 100,
  score: 0,
  speed: 5,
  buffSpeed: 0,
  buffTimer: null,
  color: "rgb(150, 30, 30)"
};

const net = {
  x: (canvas.width - 2) / 2,
  y: 0,
  height: 10,
  width: 2,
  color: "rgba(225, 225, 225, 0.5)"
};

function resizeCanvas() {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  updateObjects();
}

function updateObjects() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  localUser.x = 0;
  localUser.y = (canvas.height - localUser.height) / 2;
  remoteUser.x = canvas.width - remoteUser.width;
  remoteUser.y = (canvas.height - remoteUser.height) / 2;
  net.x = (canvas.width - net.width) / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawArc(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
}

function drawText(text, x, y, color, fontSize = "75px") {
  ctx.fillStyle = color;
  ctx.font = `${fontSize} fantasy`;
  ctx.fillText(text, x, y);
}

const keyState = {};
document.addEventListener('keydown', e => keyState[e.code] = true);
document.addEventListener('keyup', e => keyState[e.code] = false);

function moveLocalUser() {
  const paddleSpeed = localUser.speed + (localUser.buffSpeed || 0);
  if (keyState['KeyW']) localUser.y = Math.max(localUser.y - paddleSpeed, 0);
  if (keyState['KeyS']) localUser.y = Math.min(localUser.y + paddleSpeed, canvas.height - localUser.height);
  requestAnimationFrame(moveLocalUser);
}

function moveRemoteUser() {
  const paddleSpeed = remoteUser.speed + (remoteUser.buffSpeed || 0);
  if (keyState['ArrowUp']) remoteUser.y = Math.max(remoteUser.y - paddleSpeed, 0);
  if (keyState['ArrowDown']) remoteUser.y = Math.min(remoteUser.y + paddleSpeed, canvas.height - remoteUser.height);
  requestAnimationFrame(moveRemoteUser);
}

moveLocalUser();
moveRemoteUser();

function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.velocityX = -ball.velocityX;
  ball.speed = 7;
}

function drawNet() {
  for (let i = 0; i <= canvas.height; i += 15) {
    drawRect(net.x, net.y + i, net.width, net.height, net.color);
  }
}

function collision(b, p) {
  p.top = p.y;
  p.bottom = p.y + p.height;
  p.left = p.x;
  p.right = p.x + p.width;
  b.top = b.y - b.radius;
  b.bottom = b.y + b.radius;
  b.left = b.x - b.radius;
  b.right = b.x + b.radius;
  return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

function spawnBuffInOpponentArea(opponent) {
  buffItem.active = true;
  buffItem.effect = effects.speedUp;
  buffItem.spawnTime = Date.now();
  const areaWidth = canvas.width / 2;
  buffItem.x = (opponent === localUser)
    ? Math.random() * (areaWidth - buffItem.radius * 2 - remoteUser.width) + areaWidth + remoteUser.width
    : Math.random() * (areaWidth - buffItem.radius * 2 - localUser.width) + localUser.width;
  buffItem.y = Math.random() * (canvas.height - buffItem.radius * 2) + buffItem.radius;
}

function checkBuffCollision() {
  if (!buffItem.active || !lastHitter) return;
  const dx = ball.x - buffItem.x;
  const dy = ball.y - buffItem.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < ball.radius + buffItem.radius) {
    buffItem.active = false;
    buffItem.x = -100;
    buffItem.y = -100;
    const effect = buffItem.effect;
    const target = lastHitter;
    if (effect) {
      effect.apply(target);
      clearTimeout(target.buffTimer);
      target.buffTimer = setTimeout(() => {
        effect.remove(target);
      }, effect.duration);
    }
  }
}

function update() {
  if (ball.x - ball.radius < 0) {
    remoteUser.score++;
    if (remoteUser.score % 5 === 0 && !buffItem.active) spawnBuffInOpponentArea(localUser);
    resetBall();
  } else if (ball.x + ball.radius > canvas.width) {
    localUser.score++;
    if (localUser.score % 5 === 0 && !buffItem.active) spawnBuffInOpponentArea(remoteUser);
    resetBall();
  }

  ball.x += ball.velocityX;
  ball.y += ball.velocityY;
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.velocityY = -ball.velocityY;
  }

  let player = (ball.x + ball.radius < canvas.width / 2) ? localUser : remoteUser;
  if (collision(ball, player)) {
    lastHitter = player;
    let collidePoint = (ball.y - (player.y + player.height / 2)) / (player.height / 2);
    let angleRad = (Math.PI / 4) * collidePoint;
    let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1;
    ball.velocityX = direction * ball.speed * Math.cos(angleRad);
    ball.velocityY = ball.speed * Math.sin(angleRad);
    ball.speed += 0.1;
  }

  if (buffItem.active && Date.now() - buffItem.spawnTime > buffItem.duration) {
    buffItem.active = false;
    buffItem.x = -100;
    buffItem.y = -100;
  }

  checkBuffCollision();
}

function render() {
  drawRect(0, 0, canvas.width, canvas.height, "#000");
  drawText(localUser.score, Math.round(canvas.width / 4) - 25, Math.round(canvas.height / 5), localUser.color);
  drawText(remoteUser.score, 3 * Math.round(canvas.width / 4) - 25, Math.round(canvas.height / 5), remoteUser.color);
  drawNet();
  drawRect(localUser.x, localUser.y, localUser.width, localUser.height, localUser.color);
  drawRect(remoteUser.x, remoteUser.y, remoteUser.width, remoteUser.height, remoteUser.color);
  drawArc(ball.x, ball.y, ball.radius, ball.color);
  if (buffItem.active) {
    drawArc(buffItem.x, buffItem.y, buffItem.radius, buffItem.color);
    const timeLeft = Math.ceil((buffItem.duration - (Date.now() - buffItem.spawnTime)) / 1000);
    drawText(`${timeLeft}`, buffItem.x - 8, buffItem.y + 8, "rgb(50, 50, 50)", "20px");
  }
}

function game() {
  if (gameCountdown) {
    let countdown = 3;
    gameCountdown = false;
    let countdownInterval = setInterval(() => {
      drawRect(0, 0, canvas.width, canvas.height, "#000");
      drawText(countdown, canvas.width / 2 - 25, canvas.height / 2, "WHITE");
      countdown--;
      if (countdown < 0) {
        clearInterval(countdownInterval);
        gameLoop();
      }
    }, 1000);
  }
}

function gameLoop() {
  if (!gameOver) {
    update();
    render();
    setTimeout(gameLoop, 1000 / 50);
  } else {
    gameCountdown = true;
  }
}

game();