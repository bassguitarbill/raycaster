import { Controls, isControlPressed } from './input.js';
import { checkerboard, brick, door } from './textures.js';

window.addEventListener("load", () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 600;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const game = new Game(ctx);
  game.start();
});

const MAP: Array<number> = [
  1, 1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 0, 0, 0, 1, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 0, 0, 1, 1, 1, 1,
  1, 0, 0, 0, 1, 0, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1, 1,
];
const MAP_WIDTH = 8;
const TILE_DRAW_SIZE = 50;
class Game {
  player: Player;
  prevTimestamp = 0;
  constructor(readonly ctx: CanvasRenderingContext2D) {
    this.player = new Player();
  }

  start() {
    this.run = this.run.bind(this);
    window.requestAnimationFrame(this.run);
  }

  run(timestamp: number) {
    const dt = timestamp - this.prevTimestamp;
    this.prevTimestamp = timestamp;

    const { width, height } = this.ctx.canvas;
    this.ctx.clearRect(0, 0, width, height);

    this.processInput();

    this.drawMap();
    this.ctx.strokeStyle = 'black';
    this.ctx.strokeRect(450, 100, 400, 400);
    for (let i = -0.5; i < 0.5; i += 0.005) {
      let dist = 20000 / this.drawRay(i);
      if (dist > 400) dist = 400;
      if (dist < 0) dist = 0;
      this.ctx.fillRect(650 + (400 * i), 300 - (dist / 2), 2, dist);
    }
    this.drawPlayer();

    this.ctx.fillStyle = 'black';
    this.ctx.fillText(`${Math.floor(1000 / dt)}`, 25, 25);

    window.requestAnimationFrame(this.run);
  }

  drawRay(offset: number): number {
    const { ctx, player: { x, y } } = this;
    let angle = this.player.angle - offset;
    if (angle < 0) angle += Math.PI * 2;
    if (angle > Math.PI * 2) angle -= Math.PI * 2;

    const atan = Math.tan(angle);
    let ry, rx, yo, xo;
    let dof = 0;
    if (angle < Math.PI) {
      ry = Math.floor(y / TILE_DRAW_SIZE) * TILE_DRAW_SIZE - 0.0001;
      rx = ((y - ry) / atan) + x; yo = -TILE_DRAW_SIZE; xo = -yo / atan;
    } else if(angle > Math.PI) {
      ry = (1 + Math.floor(y / TILE_DRAW_SIZE)) * TILE_DRAW_SIZE;
      rx = ((y - ry) / atan) + x; yo = TILE_DRAW_SIZE; xo = -yo / atan;
    } else {
      ry = y; rx = x; yo = 0; xo = 0; dof = MAP_WIDTH;
    }

    while (dof < MAP_WIDTH) {
      const mx = Math.floor(rx / TILE_DRAW_SIZE);
      const my = Math.floor(ry / TILE_DRAW_SIZE);
      const mp = (my * MAP_WIDTH) + mx;
      if (mp > 0 && mp < MAP.length && MAP[mp]) dof = 8;
      else { rx += xo; ry += yo; dof++; }
    }

    const vrx = rx, vry = ry;
    const dv = ((x - rx) * (x - rx)) + ((y - ry) * (y - ry));

    dof = 0;
    if (angle > Math.PI / 2 && angle < Math.PI * (3 / 2)) {
      rx = Math.floor(x / TILE_DRAW_SIZE) * TILE_DRAW_SIZE - 0.0001;
      ry = ((x - rx) * atan) + y; xo = -TILE_DRAW_SIZE; yo = -xo * atan;
    } else if (angle < Math.PI / 2 || angle > Math.PI * (3 / 2)) {
      rx = (1 + Math.floor(x / TILE_DRAW_SIZE)) * TILE_DRAW_SIZE;
      ry = ((x - rx) * atan) + y; xo = TILE_DRAW_SIZE; yo = -xo * atan;
    } else {
      ry = y; rx = x; yo = 0; xo = 0; dof = MAP_WIDTH;
    }

    while (dof < MAP_WIDTH) {
      const mx = Math.floor(rx / TILE_DRAW_SIZE);
      const my = Math.floor(ry / TILE_DRAW_SIZE);
      const mp = (my * MAP_WIDTH) + mx;
      if (mp > 0 && mp < MAP.length && MAP[mp]) dof = 8;
      else { rx += xo; ry += yo; dof++; }
    }
    const dh = ((x - rx) * (x - rx)) + ((y - ry) * (y - ry));

    ctx.fillStyle = 'grey';
    if (dv < dh) { rx = vrx; ry = vry; ctx.fillStyle = 'lightgrey'; }

    const dist = Math.sqrt(Math.min(dv, dh)) * Math.cos(this.player.angle - angle);
    ctx.beginPath();
    ctx.strokeStyle = dist > 200 ? 'red' : dist > 100 ? 'orange' : 'green';
    ctx.moveTo(x, y);
    ctx.lineTo(rx, ry);
    ctx.stroke();

    return dist;
  }

  processInput() {
    const PLAYER_TURN_SPEED = 0.11;
    if (isControlPressed(Controls.LEFT)) {
      this.player.angle += PLAYER_TURN_SPEED;
      if (this.player.angle > Math.PI * 2) this.player.angle -= Math.PI * 2;
    }
    if (isControlPressed(Controls.RIGHT)) {
      this.player.angle -= PLAYER_TURN_SPEED;
      if (this.player.angle < 0) this.player.angle += Math.PI * 2;
    }

    const PLAYER_SPEED = 2;
    const pdx = PLAYER_SPEED * Math.cos(this.player.angle);
    const xo = pdx > 0 ? 10 : -10;
    const pdy = PLAYER_SPEED * Math.sin(this.player.angle);
    const yo = pdy > 0 ? 10 : -10;

    if (isControlPressed(Controls.FORWARD)) {
      const mx = Math.floor((this.player.x + pdx + xo) / TILE_DRAW_SIZE);
      const my = Math.floor((this.player.y - pdy - yo) / TILE_DRAW_SIZE);
      if (MAP[my * 8 + mx] === 0) {
        this.player.x += pdx;
        this.player.y -= pdy;
      }
    }
    if (isControlPressed(Controls.BACK)) {
      const mx = Math.floor((this.player.x - pdx - xo) / TILE_DRAW_SIZE);
      const my = Math.floor((this.player.y + pdy + yo) / TILE_DRAW_SIZE);
      if (MAP[my * 8 + mx] === 0) {
        this.player.x -= pdx;
        this.player.y += pdy;
      }
    }
  }

  drawPlayer() {
    const { ctx, player: { x, y, angle } } = this;

    ctx.fillStyle = 'yellow';
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();

    const AIMER_LENGTH = 25;
    const aimer = [x + (AIMER_LENGTH * Math.cos(angle)), y - (AIMER_LENGTH * Math.sin(angle))];
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(aimer[0], aimer[1]);
    ctx.stroke();
  }

  drawMap() {
    MAP.forEach((t, i) => {
      this.ctx.fillStyle = t === 1 ? 'white' : 'gray';
      this.ctx.strokeStyle = 'black';
      this.ctx.fillRect((i % MAP_WIDTH) * TILE_DRAW_SIZE, Math.floor(i / MAP_WIDTH) * TILE_DRAW_SIZE, TILE_DRAW_SIZE, TILE_DRAW_SIZE);
      this.ctx.strokeRect((i % MAP_WIDTH) * TILE_DRAW_SIZE, Math.floor(i / MAP_WIDTH) * TILE_DRAW_SIZE, TILE_DRAW_SIZE, TILE_DRAW_SIZE);
    });
  }
}

class Player {
  x = 100;
  y = 100;
  angle = 0;
}
