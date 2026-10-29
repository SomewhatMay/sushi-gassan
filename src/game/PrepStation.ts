// Prep plates on the counter: drop ingredients in, they pop into a dish when the set matches a recipe.
import Phaser from 'phaser';
import { DISHES, INGREDIENTS, MESS, evaluate, type DishKind, type Ingredient } from '../data';
import { DEPTH, NATIVE, PREP_HIT, PREP_X, PREP_Y } from '../layout';
import { sfx } from '../sfx';
import { INK, drawTag, jp, txt } from '../ui';
import type { Payload } from './visuals';

const BOARD = NATIVE * 1.2; // plate_prep shown at 144x96

export class PrepPlate {
  ings: Ingredient[] = [];
  dish: DishKind | 'mess' | null = null;
  readonly x: number;
  readonly y = PREP_Y;
  private c: Phaser.GameObjects.Container;
  private board: Phaser.GameObjects.Image;
  private food: Phaser.GameObjects.Container;
  private glow: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;
  private kana: Phaser.GameObjects.Text;
  private tag: Phaser.GameObjects.Graphics;
  private wobble?: Phaser.Tweens.Tween;
  private hint = 0;

  constructor(private scene: Phaser.Scene, slot: number, private menu: DishKind[]) {
    this.x = PREP_X[slot];
    this.glow = scene.add.graphics().setDepth(DEPTH.prep - 1);
    this.c = scene.add.container(this.x, this.y).setDepth(DEPTH.prep);
    this.board = scene.add.image(0, 0, 'plate_prep').setScale(BOARD);
    this.food = scene.add.container(0, -4);
    this.c.add([this.board, this.food]);
    this.tag = scene.add.graphics().setDepth(DEPTH.prep);
    this.name = txt(scene, this.x, this.y + 58, '', 15, INK, { fontStyle: 'bold' }).setOrigin(0.5).setDepth(DEPTH.prep);
    this.kana = jp(scene, this.x, this.y + 75, '', 12, '#a0281c').setOrigin(0.5).setDepth(DEPTH.prep);
    this.refreshLabel();
  }

  get empty() { return this.ings.length === 0; }
  get accepts() { return this.dish === null; }

  contains(x: number, y: number) {
    return Math.abs(x - this.x) <= PREP_HIT.w / 2 && Math.abs(y - this.y) <= PREP_HIT.h / 2;
  }

  payload(): Payload {
    return { t: 'plate', ings: [...this.ings], dish: this.dish };
  }

  // 0 = idle, 1 = could take what you're holding, 2 = you're hovering it
  setHint(level: 0 | 1 | 2) {
    if (level === this.hint) return;
    this.hint = level;
    this.glow.clear();
    if (level) {
      const w = 160, h = 112;
      this.glow.fillStyle(0xffd23f, level === 2 ? 0.45 : 0.15).fillRoundedRect(this.x - w / 2, this.y - h / 2, w, h, 22);
      this.glow.lineStyle(level === 2 ? 5 : 3, level === 2 ? 0xffd23f : 0xffffff, level === 2 ? 1 : 0.7)
        .strokeRoundedRect(this.x - w / 2, this.y - h / 2, w, h, 22);
    }
    this.scene.tweens.add({ targets: this.c, scale: level === 2 ? 1.08 : 1, duration: 90 });
  }

  // Returns false if that ingredient is already on the plate.
  add(ing: Ingredient): boolean {
    if (!this.accepts || this.ings.includes(ing)) return false;
    this.ings.push(ing);
    sfx.place();
    this.dish = evaluate(this.ings, this.menu);
    if (this.dish) this.popDish();
    else this.drawIngredients(ing);
    this.refreshLabel();
    return true;
  }

  private drawIngredients(added?: Ingredient) {
    this.food.removeAll(true);
    this.ings.forEach((ing, i) => {
      const img = this.scene.add.image((i - (this.ings.length - 1) / 2) * 40, 0, `ing_${ing}`).setScale(NATIVE * 0.72);
      this.food.add(img);
      if (ing === added) {
        img.y = -40;
        this.scene.tweens.add({ targets: img, y: 0, duration: 260, ease: 'Bounce.easeOut' });
      }
    });
  }

  private popDish() {
    const dish = this.dish!;
    const s = this.scene;
    this.food.removeAll(true);
    const img = s.add.image(0, 0, `dish_${dish}`).setScale(0);
    this.food.add(img);
    s.tweens.add({ targets: img, scale: NATIVE * 1.15, duration: 380, ease: 'Back.easeOut', easeParams: [3] });
    s.tweens.add({ targets: this.board, scaleY: BOARD * 0.85, duration: 90, yoyo: true });
    if (dish === 'mess') {
      sfx.bad();
      this.wobble = s.tweens.add({ targets: img, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return;
    }
    sfx.pop();
    sfx.happy();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const star = s.add.image(this.x, this.y - 4, 'star_on').setScale(NATIVE * 0.4).setDepth(DEPTH.prep + 1);
      s.tweens.add({
        targets: star, x: this.x + Math.cos(a) * 70, y: this.y - 4 + Math.sin(a) * 50, alpha: 0, angle: 180,
        duration: 500, ease: 'Cubic.easeOut', onComplete: () => star.destroy(),
      });
    }
  }

  private refreshLabel() {
    if (this.dish) {
      const d = this.dish === 'mess' ? MESS : DISHES[this.dish];
      this.name.setText(this.dish === 'mess' ? 'Mess! Trash it' : d.name).setColor(this.dish === 'mess' ? '#b0281e' : INK);
      this.kana.setText(d.kana);
    } else if (this.ings.length) {
      this.name.setText(this.ings.map((i) => INGREDIENTS[i].name).join(' + ')).setColor('#4a3020');
      this.kana.setText(this.ings.map((i) => INGREDIENTS[i].kana).join('・'));
    } else {
      this.name.setText('Drop food here').setColor('#5a3a20');
      this.kana.setText('');
    }
    const maxW = PREP_HIT.w - 18;
    if (this.name.width > maxW) this.name.setScale(maxW / this.name.width); else this.name.setScale(1);
    drawTag(this.tag, this.x, this.y + 47, this.name, this.kana);
  }

  // While being dragged, the slot looks empty.
  setLifted(on: boolean) {
    this.food.setVisible(!on);
    this.board.setAlpha(on ? 0.5 : 1);
  }

  // Fresh empty plate drops into the slot.
  clear() {
    this.wobble?.stop();
    this.wobble = undefined;
    this.ings = [];
    this.dish = null;
    this.food.removeAll(true);
    this.setLifted(false);
    this.refreshLabel();
    this.c.y = this.y + 30;
    this.c.setAlpha(0);
    this.scene.tweens.add({ targets: this.c, y: this.y, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  }
}

export class PrepStation {
  plates: PrepPlate[];

  constructor(scene: Phaser.Scene, count: number, menu: DishKind[]) {
    this.plates = Array.from({ length: count }, (_, i) => new PrepPlate(scene, i, menu));
  }

  at(x: number, y: number) {
    return this.plates.find((p) => p.contains(x, y)) ?? null;
  }

  // Highlight plates that could take a held ingredient; returns the one under the pointer.
  hintFor(ing: Ingredient | null, x: number, y: number): PrepPlate | null {
    let target: PrepPlate | null = null;
    for (const p of this.plates) {
      const ok = ing !== null && p.accepts && !p.ings.includes(ing);
      const over = ok && p.contains(x, y);
      if (over) target = p;
      p.setHint(over ? 2 : ok ? 1 : 0);
    }
    return target;
  }

  clearHints() {
    for (const p of this.plates) p.setHint(0);
  }
}
