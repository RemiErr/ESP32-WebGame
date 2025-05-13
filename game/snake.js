const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const box = 20;
let snake = [{ x: 200, y: 200 }];
let direction = 'RIGHT';
let food = {
  x: Math.floor(Math.random() * 20) * box,
  y: Math.floor(Math.random() * 20) * box
};

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
  if (e.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
  if (e.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
  if (e.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
});

function draw() {
  ctx.clearRect(0, 0, 400, 400);

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
      x: Math.floor(Math.random() * 20) * box,
      y: Math.floor(Math.random() * 20) * box
    };
  } else {
    snake.pop();
  }

  const newHead = { x: headX, y: headY };

  if (headX < 0 || headX >= 400 || headY < 0 || headY >= 400 || collision(newHead, snake)) {
    clearInterval(game);
    alert('遊戲結束！');
  }

  snake.unshift(newHead);
}

function collision(head, array) {
  for (let i = 0; i < array.length; i++) {
    if (head.x === array[i].x && head.y === array[i].y) {
      return true;
    }
  }
  return false;
}

let game = setInterval(draw, 100);
