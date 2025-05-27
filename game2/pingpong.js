// select canvas element
const canvas = document.getElementById("game");
const container = document.getElementById("game-container");

// getContext of canvas = methods and properties to draw and do a lot of thing to the canvas
const ctx = canvas.getContext('2d');

// socket
const socket = new WebSocket(`ws://${location.host}/ws`);

socket.onmessage = e = (event) => {
  
}

// load sounds
let hit = new Audio("sounds/hit.mp3");
let wall = new Audio("sounds/wall.mp3");
let userScore = new Audio("sounds/comScore.mp3");
let comScore = new Audio("sounds/userScore.mp3");

// Ball object
const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 10,
  velocityX: 5,
  velocityY: 5,
  speed: 7,
  color: "WHITE"
}

// User Paddle
const user = {
  x: 0,
  y: (canvas.height - 100) / 2,
  width: 10,
  height: 100,
  score: 0,
  color: "WHITE"
}

// COM Paddle
const com = {
  x: canvas.width - 10,
  y: (canvas.height - 100) / 2,
  width: 10,
  height: 100,
  score: 0,
  color: "rgb(150, 30, 30)"
}

// NET
const net = {
  x: (canvas.width - 2) / 2,
  y: 0,
  height: 10,
  width: 2,
  color: "WHITE"
}

// 適應畫布大小
function resizeCanvas() {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
  updateObjects();
}

// 更新物件
function updateObjects() {
  // Update ball position
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;

  // Update user paddle position
  user.x = 0;
  user.y = (canvas.height - user.height) / 2;

  // Update COM paddle position
  com.x = canvas.width - com.width;
  com.y = (canvas.height - com.height) / 2;

  // Update net position
  net.x = (canvas.width - net.width) / 2;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// draw a rectangle, will be used to draw paddles
function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// draw circle, will be used to draw the ball
function drawArc(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
}

// listening to the keyboard
const keyState = {}

document.addEventListener('keydown', (e) => {
  keyState[e.code] = true
})

document.addEventListener('keyup', (e) => {
  keyState[e.code] = false
})

function move() {
  const paddleSpeed = 5;
  if (keyState['ArrowUp']) user.y = user.y = Math.max(user.y - paddleSpeed, 0);
  if (keyState['ArrowDown']) user.y = Math.min(user.y + paddleSpeed, canvas.height - user.height);

  requestAnimationFrame(move)
}

move()

// when COM or USER scores, we reset the ball
function resetBall() {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  ball.velocityX = -ball.velocityX;
  ball.speed = 7;
}

// draw the net
function drawNet() {
  for (let i = 0; i <= canvas.height; i += 15) {
    drawRect(net.x, net.y + i, net.width, net.height, net.color);
  }
}

// draw text
function drawText(text, x, y, color) {
  ctx.fillStyle = color;
  ctx.font = "75px fantasy";
  ctx.fillText(text, x, y);
}

// collision detection
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

// update function, the function that does all calculations
function update() {

  // change the score of players, if the ball goes to the left "ball.x<0" computer win, else if "ball.x > canvas.width" the user win
  if (ball.x - ball.radius < 0) {
    com.score++;
    comScore.play();
    resetBall();
  } else if (ball.x + ball.radius > canvas.width) {
    user.score++;
    userScore.play();
    resetBall();  
  }

  // the ball has a velocity
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;

  // computer plays for itself, and we must be able to beat it
  // simple AI
  com.y += ((ball.y - (com.y + com.height / 2))) * 0.1;

  // when the ball collides with bottom and top walls we inverse the y velocity.
  if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
    ball.velocityY = -ball.velocityY;
    wall.play();
  }

  // we check if the paddle hit the user or the com paddle
  let player = (ball.x + ball.radius < canvas.width / 2) ? user : com;

  // if the ball hits a paddle
  if (collision(ball, player)) {
    // play sound
    hit.play();
    // we check where the ball hits the paddle
    let collidePoint = (ball.y - (player.y + player.height / 2));
    // normalize the value of collidePoint, we need to get numbers between -1 and 1.
    // -player.height/2 < collide Point < player.height/2
    collidePoint = collidePoint / (player.height / 2);

    // when the ball hits the top of a paddle we want the ball, to take a -45degees angle
    // when the ball hits the center of the paddle we want the ball to take a 0degrees angle
    // when the ball hits the bottom of the paddle we want the ball to take a 45degrees
    // Math.PI/4 = 45degrees
    let angleRad = (Math.PI / 4) * collidePoint;

    // change the X and Y velocity direction
    let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1;
    ball.velocityX = direction * ball.speed * Math.cos(angleRad);
    ball.velocityY = ball.speed * Math.sin(angleRad);

    // speed up the ball everytime a paddle hits it.
    ball.speed += 0.1;
  }
}

// render function, the function that does al the drawing
function render() {

  // clear the canvas
  drawRect(0, 0, canvas.width, canvas.height, "#000");

  // draw the user score to the left
  drawText(user.score, Math.round(canvas.width / 4) - 25, Math.round(canvas.height / 5), user.color);

  // draw the COM score to the right
  drawText(com.score, 3 * Math.round(canvas.width / 4) - 25, Math.round(canvas.height / 5), com.color);

  // draw the net
  drawNet();

  // draw the user's paddle
  drawRect(user.x, user.y, user.width, user.height, user.color);

  // draw the COM's paddle
  drawRect(com.x, com.y, com.width, com.height, com.color);

  // draw the ball
  drawArc(ball.x, ball.y, ball.radius, ball.color);
}
function game() {
  update();
  render();
}
// number of frames per second
let framePerSecond = 50;

//call the game function 50 times every 1 Sec
let loop = setInterval(game, 1000 / framePerSecond);

