// Pointer drag: lift something up with a shadow, follow the pointer, hand it back on release.
import Phaser from 'phaser';
import { DEPTH } from '../layout';
import { sfx } from '../sfx';

export interface Grab<T> {
  data: T;
  visual: Phaser.GameObjects.Container;
}

export interface DragHandlers<T> {
  pick(x: number, y: number): Grab<T> | null;
  hover(data: T, x: number, y: number): void;
  drop(data: T, x: number, y: number, visual: Phaser.GameObjects.Container): void; // owns the visual now
}

const LIFT = 1.2;
const OFFSET_Y = -10; // keep the item just above the finger

export class DragController<T> {
  enabled = false;
  private held: (Grab<T> & { shadow: Phaser.GameObjects.Ellipse; pointer: number }) | null = null;

  constructor(private scene: Phaser.Scene, private h: DragHandlers<T>) {
    const input = scene.input;
    input.on('pointerdown', (p: Phaser.Input.Pointer, over: unknown[]) => {
      if (!over.length) this.down(p);
    });
    input.on('pointermove', (p: Phaser.Input.Pointer) => this.move(p));
    input.on('pointerup', (p: Phaser.Input.Pointer) => this.up(p));
    input.on('pointerupoutside', (p: Phaser.Input.Pointer) => this.up(p));
  }

  get holding() { return this.held?.data ?? null; }

  private down(p: Phaser.Input.Pointer) {
    if (!this.enabled || this.held) return;
    const g = this.h.pick(p.x, p.y);
    if (!g) return;
    const shadow = this.scene.add.ellipse(p.x, p.y + 30, 64, 18, 0x000000, 0.25).setDepth(DEPTH.held - 1);
    g.visual.setDepth(DEPTH.held);
    this.held = { ...g, shadow, pointer: p.id };
    this.scene.tweens.add({ targets: g.visual, x: p.x, y: p.y + OFFSET_Y, scale: LIFT, duration: 110, ease: 'Back.easeOut' });
    sfx.pop();
    this.h.hover(g.data, p.x, p.y);
  }

  private move(p: Phaser.Input.Pointer) {
    if (!this.held || p.id !== this.held.pointer) return;
    const { visual, shadow } = this.held;
    this.scene.tweens.killTweensOf(visual);
    visual.setPosition(p.x, p.y + OFFSET_Y).setScale(LIFT);
    visual.setAngle(Phaser.Math.Clamp(p.velocity.x * 0.15, -12, 12));
    shadow.setPosition(p.x, p.y + 30);
    this.h.hover(this.held.data, p.x, p.y);
  }

  private up(p: Phaser.Input.Pointer) {
    if (!this.held || p.id !== this.held.pointer) return;
    const { data, visual, shadow } = this.held;
    this.held = null;
    shadow.destroy();
    this.scene.tweens.killTweensOf(visual);
    visual.setAngle(0).setScale(LIFT).setPosition(p.x, p.y + OFFSET_Y);
    this.h.drop(data, p.x, p.y, visual);
  }

  // Release whatever is held at its current spot (pause, end of day).
  cancel() {
    if (!this.held) return;
    const { data, visual, shadow } = this.held;
    this.held = null;
    shadow.destroy();
    this.h.drop(data, -999, -999, visual);
  }
}
