const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');

const box = 20;
let canvasWidth = container.offsetWidth;
let canvasHeight = container.offsetHeight;

let snake = [{ x: 200, y: 200 }];
let direction = 'RIGHT';
let food = {
  x: Math.floor(Math.random() * (canvasWidth / box)) * box,
  y: Math.floor(Math.random() * (canvasHeight / box)) * box
};

let isGameStarted = false; // 遊戲是否開始的標誌

// 動態調整 canvas 大小
function resizeCanvas() {
  canvasWidth = container.offsetWidth;
  canvasHeight = container.offsetHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  food = {
    x: Math.floor(Math.random() * (canvasWidth / box)) * box,
    y: Math.floor(Math.random() * (canvasHeight / box)) * box
  };
}

// 監聽視窗大小變化事件
window.addEventListener('resize', resizeCanvas);

// 初始化畫布大小
resizeCanvas();

document.addEventListener('keydown', e => {
  keyPress = e.key;
  if (!isGameStarted && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(keyPress)) {
    isGameStarted = true;
    container.querySelector('#start-screen')?.remove(); // 移除開始畫面
    game = setInterval(draw, 100);
  }

  if (keyPress === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
  if (keyPress === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
  if (keyPress === 'ArrowLeft' && direction !== 'LEFT') direction = 'LEFT';
  if (keyPress === 'ArrowRight' && direction !== 'RIGHT') direction = 'RIGHT';
});

// 顯示開始畫面
showStartScreen();

function draw() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? 'green' : 'lightgreen';
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  ctx.fillStyle = 'red';
  ctx.fillRect(food.x, food.y, box, box);

  let headX = snake[0].x;
  let headY = snake[0].y;

  if (direction === 'LEFT') headX -= box;
  if (direction === 'UP') headY -= box;
  if (direction === 'RIGHT') headX += box;
  if (direction === 'DOWN') headY += box;

  if (headX === food.x && headY === food.y) {
    food = {
      x: Math.floor(Math.random() * (canvasWidth / box)) * box,
      y: Math.floor(Math.random() * (canvasHeight / box)) * box
    };
  } else {
    snake.pop();
  }

  const newHead = { x: headX, y: headY };

  if (headX < 0 || headX >= canvasWidth || headY < 0 || headY >= canvasHeight || collision(newHead, snake)) {
    clearInterval(game);
    gameEndDisplay();
  }

  snake.unshift(newHead);
}

function showStartScreen() {
  const startScreen = document.createElement('div');
  startScreen.id = 'start-screen';
  startScreen.style.position = 'absolute';
  startScreen.style.top = '0';
  startScreen.style.left = '0';
  startScreen.style.width = '100%';
  startScreen.style.height = '100%';
  startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  startScreen.style.display = 'flex';
  startScreen.style.flexDirection = 'column';
  startScreen.style.justifyContent = 'center';
  startScreen.style.alignItems = 'center';
  startScreen.style.color = 'white';
  startScreen.style.fontSize = '36px';
  startScreen.innerHTML = `
      <p class="ts-header is-big">按任意方向鍵開始遊戲</p>
    `;
  container.appendChild(startScreen);

  document.addEventListener('keydown', () => {
    if (!isGameStarted) {
      container.removeChild(startScreen);
    }
  }, { once: true });
}

function gameEndDisplay() {
  // 顯示結束畫面
  const gameOverScreen = document.createElement('div');
  gameOverScreen.id = 'game-over-screen';
  gameOverScreen.style.position = 'absolute';
  gameOverScreen.style.top = '0';
  gameOverScreen.style.left = '0';
  gameOverScreen.style.width = '100%';
  gameOverScreen.style.height = '100%';
  gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  gameOverScreen.style.display = 'flex';
  gameOverScreen.style.flexDirection = 'column';
  gameOverScreen.style.justifyContent = 'center';
  gameOverScreen.style.alignItems = 'center';
  gameOverScreen.style.color = 'white';
  gameOverScreen.style.fontSize = '36px';
  gameOverScreen.innerHTML = `
      <p class="ts-header is-big">遊戲結束</p>
      <button class="ts-button" id="restart-button">重新開始</button>
    `;
  container.appendChild(gameOverScreen);

  // 重新開始按鈕事件
  document.getElementById('restart-button').addEventListener('click', () => {
    container.removeChild(gameOverScreen);
    snake = [{ x: 200, y: 200 }];
    direction = 'RIGHT';
    isGameStarted = false;
    food = {
      x: Math.floor(Math.random() * (canvasWidth / box)) * box,
      y: Math.floor(Math.random() * (canvasHeight / box)) * box
    };
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    showStartScreen();
  });
}

function collision(head, array) {
  for (let i = 0; i < array.length; i++) {
    if (head.x === array[i].x && head.y === array[i].y) {
      return true;
    }
  }
  return false;
}

let game; // 遊戲的 interval，初始為 undefined