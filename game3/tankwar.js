const canvas = document.getElementById('game');
const container = document.getElementById('game-container');
const ctx     = canvas.getContext('2d');

const CANVAS_W = container.offsetWidth, CANVAS_H = container.offsetHeight;
const CELL_SIZE = 20;
const MAP_W = Math.floor(CANVAS_W / CELL_SIZE);
const MAP_H = Math.floor(CANVAS_H / CELL_SIZE);
const OBSTACLE_RATIO = 0.18;

const MOVE_KEYS_P1 = ['KeyW', 'KeyD', 'KeyS', 'KeyA'];
const MOVE_KEYS_P2 = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];

canvas.width  = CANVAS_W;
canvas.height = CANVAS_H;

// ------------------ 地圖工具 ------------------
function createEmptyMap() {
  return Array.from({ length: MAP_H }, () => Array(MAP_W).fill(0));
}
function isMapConnected(map) {
  const visited = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(false));
  let q = [], found = false;
  for (let y = 0; y < MAP_H && !found; y++)
    for (let x = 0; x < MAP_W && !found; x++)
      if (map[y][x] === 0) { visited[y][x] = true; q.push([x,y]); found = true; }
  if (!found) return false;

  let cnt = 1;
  const DIRS = [[0,1],[1,0],[0,-1],[-1,0]];
  while (q.length) {
    const [x,y] = q.shift();
    for (const [dx,dy] of DIRS) {
      const nx = x+dx, ny = y+dy;
      if (nx>=0 && nx<MAP_W && ny>=0 && ny<MAP_H &&
          !visited[ny][nx] && map[ny][nx]===0){
        visited[ny][nx] = true; q.push([nx,ny]); cnt++;
      }
    }
  }
  let total = 0;
  for (let y=0;y<MAP_H;y++) for (let x=0;x<MAP_W;x++) if (map[y][x]===0) total++;
  return cnt === total;
}
function generateObstacles() {
  const map = createEmptyMap();
  const empty = [];
  const playerStart = [1,1];
  for (let y=0;y<MAP_H;y++)
    for (let x=0;x<MAP_W;x++)
      if (!(x===playerStart[0] && y===playerStart[1])) empty.push([x,y]);
  for (let i = empty.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [empty[i],empty[j]] = [empty[j],empty[i]];
  }
  let obstacles = Math.floor(MAP_W*MAP_H*OBSTACLE_RATIO);
  for (let [x,y] of empty){
    if (!obstacles) break;
    map[y][x] = 1;
    if (isMapConnected(map)) obstacles--;
    else map[y][x] = 0;
  }
  return map;
}
function drawMap(map){
  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  ctx.fillStyle = '#666';
  for (let y=0;y<MAP_H;y++)
    for (let x=0;x<MAP_W;x++)
      if (map[y][x]===1)
        ctx.fillRect(x*CELL_SIZE,y*CELL_SIZE,CELL_SIZE,CELL_SIZE);
}

// ------------------ 坦克 / 子彈 ------------------
class Tank{
  constructor(x,y,dir,color='green'){
    this.x=x; this.y=y; this.dir=dir; this.color=color; this.alive=true;
  }
  draw(){
    ctx.save();
    ctx.translate(this.x*CELL_SIZE+CELL_SIZE/2, this.y*CELL_SIZE+CELL_SIZE/2);
    ctx.rotate(this.dir*Math.PI/2);
    ctx.fillStyle=this.color;
    ctx.fillRect(-CELL_SIZE/2+2,-CELL_SIZE/2+2,CELL_SIZE-4,CELL_SIZE-4);
    ctx.fillStyle='#222';
    ctx.fillRect(-3,-CELL_SIZE/2,6,CELL_SIZE/2);
    ctx.restore();
  }
}
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
class Bullet{
  constructor(x,y,dir,owner){
    this.x=x; this.y=y; this.dir=dir; this.owner=owner;
    this.active=true; this.speed=CELL_SIZE/0.25;
    this.fx=x*CELL_SIZE+CELL_SIZE/2;
    this.fy=y*CELL_SIZE+CELL_SIZE/2;
  }
  move(dt){
    if(!this.active) return;
    const [dx,dy]=DIRS[this.dir];
    this.fx+=dx*this.speed*dt;
    this.fy+=dy*this.speed*dt;
    const nx=Math.floor(this.fx/CELL_SIZE);
    const ny=Math.floor(this.fy/CELL_SIZE);
    if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H||map[ny][nx]===1){
      this.active=false; return;
    }
    this.x=nx; this.y=ny;
  }
  draw(){
    if(!this.active) return;
    ctx.save();
    ctx.fillStyle=(this.owner==='player1')?'orange':'purple';
    ctx.beginPath();
    ctx.arc(this.fx,this.fy,CELL_SIZE/5,0,2*Math.PI);
    ctx.fill(); ctx.restore();
  }
}

// ------------------ 初始化 ------------------
const map = generateObstacles();
drawMap(map);

const player1 = new Tank(1,1,1,'blue');            // 玩家一
const player2 = new Tank(MAP_W-2, MAP_H-2, 3,'red'); // 玩家二

let bullets=[];
let keyState={};

// ------------------ 事件監聽 ------------------
document.addEventListener('keydown',e=>{ keyState[e.code]=true; });
document.addEventListener('keyup'  ,e=>{ keyState[e.code]=false; });

// ------------------ 移動 / 射擊 ------------------
function canMove(x,y){ return x>=0&&x<MAP_W&&y>=0&&y<MAP_H&&map[y][x]===0; }

let moveCd1=0, moveCd2=0;
let shootCd1=0, shootCd2=0;

function handleMove(player, keysDir) {
  // 1. 先找「目前有被按下的方向鍵」
  let pressedDir = null;
  for (const [code, d] of keysDir) {
    if (keyState[code]) {
      pressedDir = d;
      break;
    }
  }
  // 若沒有任何方向鍵被按住，就直接返回 false（不移動、不轉向）
  if (pressedDir === null) return false;

  // 2. 若方向不同，先轉向再結束（耗掉一次 cooldown）
  if (pressedDir !== player.dir) {
    player.dir = pressedDir;
    return true;
  }

  // 3. 方向相同才真正嘗試往前走一格
  const [dx, dy] = DIRS[player.dir];
  const nx = player.x + dx,
        ny = player.y + dy;
  if (canMove(nx, ny)) {
    player.x = nx;
    player.y = ny;
    return true;
  }
  return false;
}

function handleShoot(player, keyCode, owner){
  if(owner==='player1' && shootCd1>0) return;
  if(owner==='player2' && shootCd2>0) return;
  if(!keyState[keyCode]) return;
  const [dx,dy]=DIRS[player.dir];
  const bx=player.x+dx, by=player.y+dy;
  if(canMove(bx,by)){
    bullets.push(new Bullet(bx,by,player.dir,owner));
    if(owner==='player1') shootCd1=1; else shootCd2=1;
  }
}

function anyKeyPressed(keys) {
  return keys.some(code => keyState[code]);
}

// ------------------ 碰撞判定 ------------------
function checkBulletHit(){
  for(const b of bullets){
    if(!b.active) continue;
    if(player1.alive && b.owner!=='player1' && b.x===player1.x && b.y===player1.y){
      player1.alive=false; b.active=false;
    }
    if(player2.alive && b.owner!=='player2' && b.x===player2.x && b.y===player2.y){
      player2.alive=false; b.active=false;
    }
  }
}

// ------------------ 結束畫面 ------------------
function showEnd(msg){
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
  ctx.fillStyle='white';
  ctx.font='28px Arial'; ctx.textAlign='center';
  ctx.fillText(msg, CANVAS_W/2, CANVAS_H/2-10);
  ctx.font='20px Arial';
  ctx.fillText('點擊重新開始', CANVAS_W/2, CANVAS_H/2+25);
  canvas.style.cursor='pointer';
  canvas.onclick=()=>{ restartGame(); canvas.onclick=null; };
}

// ------------------ 重新開始 ------------------
function restartGame(){
  bullets=[]; keyState={};
  Object.assign(player1,{x:1,y:1,dir:1,alive:true});
  Object.assign(player2,{x:MAP_W-2,y:MAP_H-2,dir:3,alive:true});
  for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)map[y][x]=0;
  const newMap=generateObstacles();
  for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)map[y][x]=newMap[y][x];
  lastTime=performance.now(); requestAnimationFrame(gameLoop);
  canvas.style.cursor='default';
}

// ------------------ 畫面 ------------------
function drawAll(){
  drawMap(map);
  if(player1.alive) player1.draw();
  if(player2.alive) player2.draw();
  bullets.forEach(b=>b.draw());
}

// ------------------ 主迴圈 ------------------
let lastTime=performance.now();
function gameLoop(now){
  let dt=(now-lastTime)/1000; lastTime=now;

  // 若遊戲結束
  if(!player1.alive || !player2.alive){
    drawAll();
    if(!player1.alive && !player2.alive)      showEnd('平手！');
    else if(!player1.alive)                   showEnd('玩家二獲勝！');
    else                                      showEnd('玩家一獲勝！');
    return;
  }

  // 移動
  moveCd1-=dt; moveCd2-=dt;
  
  if(moveCd1<=0 && handleMove(player1,[['ArrowUp',0],['ArrowRight',1],['ArrowDown',2],['ArrowLeft',3]])){ moveCd1=0.2; }
  if(moveCd2<=0 && handleMove(player2,[['KeyW',0],['KeyD',1],['KeyS',2],['KeyA',3]])){ moveCd2=0.2; }

  // 射擊
  shootCd1-=dt; shootCd2-=dt;
  handleShoot(player1,'ControlRight','player1');
  handleShoot(player2,'Space','player2');

  // 子彈
  bullets.forEach(b=>{ if(b.active) b.move(dt); });
  bullets=bullets.filter(b=>b.active);

  // 碰撞
  checkBulletHit();

  drawAll();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);