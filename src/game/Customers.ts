// Customers sit above the belts, order a dish and grab it as it rides past.
import Phaser from 'phaser';
import { CUSTOMERS, DISHES, SERVE_RANGE, type CustomerKind, type DayDef, type DishKind, type Face, type Ingredient } from '../data';
import { DEPTH, NATIVE, SEAT_X, seatY } from '../layout';
import { sfx } from '../sfx';
import { COLORS, INK, floatText, jp, txt } from '../ui';
import type { BeltItem } from './Lane';
import { dishOf } from './visuals';

export interface Seat {
  lane: number;
  x: number;
  y: number;
  who: Customer | null;
  cooldown: number;
}

export interface ServeResult {
  yen: number;
  label: string;
}

export interface CustomerHooks {
  served(c: Customer, frac: number): ServeResult;
  missed(c: Customer): void;
}

const BUBBLE_W = 164;

export const faceFor = (frac: number): Face => (frac > 0.5 ? 'happy' : frac >= 0.25 ? 'waiting' : 'angry');

export class Customer {
  head: Phaser.GameObjects.Image;
  bubble: Phaser.GameObjects.Container;
  bar: Phaser.GameObjects.Graphics;
  state: 'waiting' | 'eating' | 'leaving' = 'waiting';
  patience: number;
  face: Face = 'happy';

  constructor(
    private scene: Phaser.Scene,
    public kind: CustomerKind,
    public order: DishKind,
    public seat: Seat,
    public maxPatience: number,
  ) {
    this.patience = maxPatience;
    this.head = scene.add.image(seat.x, seat.y, this.tex()).setScale(0).setDepth(DEPTH.customer);
    scene.tweens.add({ targets: this.head, scale: NATIVE, duration: 280, ease: 'Back.easeOut' });

    // Order bubble: dish icon, English name, kana beneath.
    this.bubble = scene.add.container(seat.x + 46, seat.y - 6).setDepth(DEPTH.customer + 1);
    const g = scene.add.graphics();
    g.fillStyle(COLORS.ink, 1).fillRoundedRect(-3, -29, BUBBLE_W + 6, 58, 14).fillTriangle(-10, 4, 0, -8, 0, 14);
    g.fillStyle(0xffffff, 1).fillRoundedRect(0, -26, BUBBLE_W, 52, 12).fillTriangle(-4, 4, 3, -5, 3, 12);
    const icon = scene.add.image(26, 0, `dish_${order}`).setScale(NATIVE * 0.62);
    const name = txt(scene, 50, -9, DISHES[order].name, 16, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5);
    if (name.width > BUBBLE_W - 56) name.setScale((BUBBLE_W - 56) / name.width);
    const kana = jp(scene, 50, 11, DISHES[order].kana, 11, '#c0392b').setOrigin(0, 0.5);
    this.bubble.add([g, icon, name, kana]);
    if (CUSTOMERS[kind].critic) {
      const tag = txt(scene, 8, -36, 'Critic', 12, '#ffffff', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      const tagJp = jp(scene, 12 + tag.width, -36, 'ひょうろんか', 10, '#ffffff').setOrigin(0, 0.5);
      const tg = scene.add.graphics().fillStyle(0x7a4fd6, 1).fillRoundedRect(2, -45, tag.width + tagJp.width + 16, 18, 7);
      this.bubble.add([tg, tag, tagJp]);
    }
    this.bubble.setScale(0);
    scene.tweens.add({ targets: this.bubble, scale: 1, duration: 240, delay: 180, ease: 'Back.easeOut' });
    this.bar = scene.add.graphics().setDepth(DEPTH.customer + 2);
    this.drawBar();
  }

  get frac() { return Phaser.Math.Clamp(this.patience / this.maxPatience, 0, 1); }

  private tex() { return `cust_${this.kind}_${this.face}`; }

  setFace(f: Face) {
    if (f === this.face) return;
    this.face = f;
    this.head.setTexture(this.tex());
    this.scene.tweens.add({ targets: this.head, scaleY: NATIVE * 0.85, scaleX: NATIVE * 1.1, duration: 90, yoyo: true });
    if (f === 'angry') this.scene.tweens.add({ targets: this.head, angle: { from: -6, to: 6 }, duration: 70, yoyo: true, repeat: 3, onComplete: () => this.head.setAngle(0) });
  }

  drawBar() {
    const f = this.frac;
    const x = this.bubble.x + 8, y = this.bubble.y + 33, w = BUBBLE_W - 16;
    this.bar.clear();
    this.bar.fillStyle(COLORS.ink, 1).fillRoundedRect(x - 2, y - 2, w + 4, 11, 5);
    this.bar.fillStyle(f > 0.5 ? 0x5cc27a : f >= 0.25 ? 0xf5b82e : 0xe8434b, 1).fillRoundedRect(x, y, Math.max(6, w * f), 7, 3);
  }

  update(dt: number) {
    if (this.state !== 'waiting') return;
    this.patience -= dt;
    this.setFace(faceFor(this.frac));
    this.drawBar();
  }

  // Grab the dish off the belt and munch it.
  eat(item: BeltItem, res: ServeResult, done: () => void) {
    this.state = 'eating';
    this.setFace('happy');
    this.bubble.destroy();
    this.bar.destroy();
    const s = this.scene;
    s.tweens.add({
      targets: item.c, x: this.seat.x, y: this.seat.y + 14, scale: 0.6, duration: 220, ease: 'Quad.easeOut',
      onComplete: () => s.tweens.add({ targets: item.c, scale: 0, alpha: 0, duration: 260, delay: 200, onComplete: () => item.c.destroy() }),
    });
    s.tweens.add({ targets: this.head, y: this.seat.y - 10, duration: 140, yoyo: true, repeat: 2 });
    const heart = s.add.image(this.seat.x - 26, this.seat.y - 30, 'heart').setScale(0).setDepth(DEPTH.ui);
    s.tweens.add({ targets: heart, scale: NATIVE, y: heart.y - 34, duration: 400, ease: 'Back.easeOut' });
    s.tweens.add({ targets: heart, alpha: 0, duration: 300, delay: 700, onComplete: () => heart.destroy() });
    const coin = s.add.image(this.seat.x + 24, this.seat.y - 10, 'coin').setScale(NATIVE * 0.8).setDepth(DEPTH.ui);
    s.tweens.add({ targets: coin, y: coin.y - 46, alpha: 0, duration: 1000, ease: 'Cubic.easeOut', onComplete: () => coin.destroy() });
    floatText(s, this.seat.x + 70, this.seat.y - 18, `+¥${res.yen}`, '#ffd23f', 24);
    floatText(s, this.seat.x, this.seat.y + 36, res.label, '#ffffff', 18);
    sfx.coin();
    sfx.happy();
    s.time.delayedCall(1100, () => this.leave(done));
  }

  storm(done: () => void) {
    this.state = 'leaving';
    this.bubble.destroy();
    this.bar.destroy();
    const s = this.scene;
    const puff = s.add.image(this.seat.x, this.seat.y, 'puff').setScale(0.2).setDepth(DEPTH.customer + 3);
    s.tweens.add({ targets: puff, scale: NATIVE * 1.4, alpha: 0, duration: 600, onComplete: () => puff.destroy() });
    floatText(s, this.seat.x, this.seat.y - 30, 'Too slow! おそい…', '#ff9a9a', 18);
    sfx.bad();
    this.leave(done, 250);
  }

  private leave(done: () => void, delay = 0) {
    this.state = 'leaving';
    this.scene.tweens.add({
      targets: this.head, scale: 0, y: this.seat.y + 20, duration: 260, delay, ease: 'Back.easeIn',
      onComplete: () => { this.head.destroy(); done(); },
    });
  }

  destroy() {
    this.head.destroy();
    this.bubble.destroy();
    this.bar.destroy();
  }
}

export class Customers {
  seats: Seat[] = [];
  private nextIn = 1;
  private open = true;

  constructor(
    private scene: Phaser.Scene,
    private day: DayDef,
    private patienceMul: number,
    private hooks: CustomerHooks,
  ) {
    for (let lane = 0; lane < day.lanes; lane++) {
      for (const x of SEAT_X) this.seats.push({ lane, x, y: seatY(lane), who: null, cooldown: 0 });
    }
  }

  waiting(lane?: number) {
    return this.seats.filter((s) => s.who?.state === 'waiting' && (lane === undefined || s.lane === lane)).map((s) => s.who!);
  }

  // Ingredients still wanted by waiting customers in a lane (repeats = more weight).
  needs(lane: number): Ingredient[] {
    return this.waiting(lane).flatMap((c) => DISHES[c.order].set);
  }

  update(dt: number) {
    for (const s of this.seats) {
      if (!s.who) s.cooldown -= dt;
      const c = s.who;
      if (!c) continue;
      c.update(dt);
      if (c.state === 'waiting' && c.patience <= 0) {
        this.hooks.missed(c);
        c.storm(() => this.free(s));
      }
    }
    if (!this.open) return;
    this.nextIn -= dt;
    if (this.nextIn <= 0) {
      this.spawn();
      this.nextIn = Phaser.Math.FloatBetween(...this.day.custSpawn);
    }
  }

  private free(s: Seat) {
    s.who = null;
    s.cooldown = 1.5;
  }

  private spawn() {
    const free = this.seats.filter((s) => !s.who && s.cooldown <= 0);
    if (!free.length) return;
    const seat = Phaser.Utils.Array.GetRandom(free);
    const kinds = Object.entries(this.day.customers) as [CustomerKind, number][];
    let r = Math.random() * kinds.reduce((a, [, w]) => a + w, 0);
    const kind = (kinds.find(([, w]) => (r -= w) < 0) ?? kinds[0])[0];
    const order = Phaser.Utils.Array.GetRandom(this.day.menu);
    seat.who = new Customer(this.scene, kind, order, seat, CUSTOMERS[kind].patience * this.patienceMul);
    floatText(this.scene, seat.x, seat.y - 16, 'Welcome! いらっしゃいませ', '#ffffff', 15);
    sfx.bell();
  }

  // Called each frame for every dish riding a lane.
  tryServe(lane: number, item: BeltItem): boolean {
    const dish = dishOf(item.payload);
    if (!dish || dish === 'mess') return false;
    const seat = this.seats.find((s) => s.lane === lane && s.who?.state === 'waiting'
      && s.who.order === dish && Math.abs(item.x - s.x) <= SERVE_RANGE);
    if (!seat) return false;
    const c = seat.who!;
    const res = this.hooks.served(c, c.frac);
    c.eat(item, res, () => this.free(seat));
    return true;
  }

  closeShop() {
    this.open = false;
  }
}
