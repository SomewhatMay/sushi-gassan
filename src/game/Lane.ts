// One conveyor lane: a scrolling belt that carries ingredient plates and served dishes.
import Phaser from 'phaser';
import { MAX_WRAPS, type Ingredient } from '../data';
import { BELT_H, DEPTH, LANE_DIRS, LANE_H, NATIVE, SEAT_X, W, beltY, laneTop } from '../layout';
import { INK, jp, txt } from '../ui';
import { plateVisual, type Payload } from './visuals';

export interface BeltItem {
  c: Phaser.GameObjects.Container;
  x: number;
  payload: Payload;
  wraps: number;
}

export interface LaneHooks {
  nextIng(lane: Lane): Ingredient;
  tryServe(lane: Lane, item: BeltItem): boolean; // true if a customer took it
}

const EDGE = 44; // plates spawn/vanish this far off screen

export class Lane {
  readonly dir: number;
  readonly y: number;
  items: BeltItem[] = [];
  private belt: Phaser.GameObjects.TileSprite;
  private glow: Phaser.GameObjects.Graphics;
  private spawnIn = 0;

  constructor(
    private scene: Phaser.Scene,
    readonly index: number,
    readonly active: boolean,
    private spawnRange: [number, number],
    private hooks: LaneHooks,
  ) {
    this.dir = LANE_DIRS[index];
    this.y = beltY(index);
    this.belt = scene.add.tileSprite(W / 2, this.y, W / NATIVE, BELT_H / NATIVE, 'belt_lane')
      .setScale(NATIVE * this.dir, NATIVE).setDepth(DEPTH.belt);
    this.glow = scene.add.graphics().setDepth(DEPTH.belt + 1);
    if (active) {
      for (const x of SEAT_X) scene.add.image(x, laneTop(index) + 78, 'stool').setScale(NATIVE).setDepth(DEPTH.customer - 1);
    } else {
      this.belt.setAlpha(0.4);
      const cy = laneTop(index) + LANE_H / 2;
      txt(scene, W / 2, cy - 10, 'Closed today', 30, '#ffffff', { fontStyle: 'bold', stroke: INK, strokeThickness: 7 })
        .setOrigin(0.5).setDepth(DEPTH.beltItem);
      jp(scene, W / 2, cy + 20, 'おやすみ', 16, '#ffffff').setOrigin(0.5).setStroke(INK, 5).setDepth(DEPTH.beltItem);
    }
  }

  get entryX() { return this.dir > 0 ? -EDGE : W + EDGE; }

  // Generous drop zone: the whole lane band, seats included.
  contains(x: number, y: number) {
    const t = laneTop(this.index);
    return this.active && x >= 0 && x <= W && y >= t && y < t + LANE_H;
  }

  // Ingredient plate under the pointer (only raw ingredients can be grabbed back off a belt).
  pickAt(x: number, y: number): BeltItem | null {
    if (!this.active || Math.abs(y - this.y) > 44) return null;
    let best: BeltItem | null = null, bestD = 42;
    for (const it of this.items) {
      const d = Math.abs(it.x - x);
      if (it.payload.t === 'ing' && d < bestD) { best = it; bestD = d; }
    }
    return best;
  }

  take(item: BeltItem) {
    this.items = this.items.filter((i) => i !== item);
  }

  add(payload: Payload, x: number, bounce = false): BeltItem {
    const c = plateVisual(this.scene, payload).setPosition(x, this.y).setDepth(DEPTH.beltItem);
    const item = { c, x, payload, wraps: 0 };
    this.items.push(item);
    if (bounce) {
      c.setScale(1.3);
      this.scene.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.easeOut' });
    }
    return item;
  }

  // Spread ingredients along the belt so it isn't empty at opening.
  prefill(speed: number) {
    if (!this.active) return;
    const gap = speed * (this.spawnRange[0] + this.spawnRange[1]) / 2;
    for (let d = gap; d < W; d += gap) this.add({ t: 'ing', ing: this.hooks.nextIng(this) }, this.entryX + d * this.dir);
    this.spawnIn = this.spawnRange[0];
  }

  setHover(on: boolean) {
    this.glow.clear();
    if (!on) return;
    const top = this.y - BELT_H / 2;
    this.glow.fillStyle(0xffffff, 0.18).fillRect(0, top, W, BELT_H);
    this.glow.lineStyle(5, 0xffd23f, 1).strokeRect(2, top - 2, W - 4, BELT_H + 4);
  }

  update(dt: number, speed: number) {
    if (!this.active) return;
    this.belt.tilePositionX -= (speed * dt) / NATIVE;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.add({ t: 'ing', ing: this.hooks.nextIng(this) }, this.entryX);
      this.spawnIn = Phaser.Math.FloatBetween(...this.spawnRange);
    }
    const exit = this.dir > 0 ? W + EDGE : -EDGE;
    for (const it of [...this.items]) {
      it.x += speed * dt * this.dir;
      it.c.x = it.x;
      if (it.payload.t === 'plate' && this.hooks.tryServe(this, it)) {
        this.take(it);
        continue;
      }
      if ((it.x - exit) * this.dir < 0) continue;
      if (it.payload.t === 'plate' && it.wraps < MAX_WRAPS) {
        it.wraps++;
        it.x = this.entryX;
      } else {
        this.take(it);
        it.c.destroy();
      }
    }
  }

  clear() {
    for (const it of this.items) it.c.destroy();
    this.items = [];
  }
}
