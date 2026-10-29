import Phaser from 'phaser';
import {
  CUSTOMERS, DAYS, DISHES, INGREDIENTS, NEED_BIAS, PREP_SLOTS, START_STARS, poolFor,
  type DayDef, type DishKind, type Ingredient,
} from '../data';
import { Customers, type Customer, type ServeResult } from '../game/Customers';
import { DragController, type Grab } from '../game/Drag';
import { Lane } from '../game/Lane';
import { PrepStation, type PrepPlate } from '../game/PrepStation';
import { Trash } from '../game/Trash';
import { plateVisual } from '../game/visuals';
import { COUNTER_Y, DEPTH, H, LANE_H, MENU, NATIVE, SEAT_H, TOP, W, laneTop } from '../layout';
import { sfx } from '../sfx';
import { debug, hasUpgrade, restoreSnapshot, run, saveSnapshot, type DayStats } from '../state';
import { COLORS, INK, button, floatText, jp, panel, txt } from '../ui';

type Phase = 'intro' | 'open' | 'done';
type Held = { from: 'belt'; ing: Ingredient } | { from: 'prep'; plate: PrepPlate };

const SNAP_RANGE = 110; // px either side of a seat where a dropped dish goes straight to that customer

export class GameScene extends Phaser.Scene {
  private day!: DayDef;
  private lanes: Lane[] = [];
  private prep!: PrepStation;
  private trash!: Trash;
  private customers!: Customers;
  private drag!: DragController<Held>;
  private pool: Ingredient[] = [];
  private phase: Phase = 'intro';
  private paused = false;
  private timeLeft = 0;
  private stars = START_STARS;
  private stats = { served: 0, missed: 0, earned: 0 };

  private yenText!: Phaser.GameObjects.Text;
  private timerG!: Phaser.GameObjects.Graphics;
  private timerText!: Phaser.GameObjects.Text;
  private starImgs: Phaser.GameObjects.Image[] = [];
  private pauseLayer?: Phaser.GameObjects.Container;

  constructor() {
    super('Game');
  }

  init(data: { replay?: boolean }) {
    if (data.replay) restoreSnapshot();
    else saveSnapshot();
    this.day = debug.dur ? { ...DAYS[run.day], duration: debug.dur } : DAYS[run.day];
    this.pool = poolFor(this.day.menu);
    this.phase = 'intro';
    this.paused = false;
    this.timeLeft = this.day.duration;
    this.stars = START_STARS;
    this.stats = { served: 0, missed: 0, earned: 0 };
    this.lanes = [];
    this.starImgs = [];
    this.pauseLayer = undefined;
  }

  create() {
    this.drawBackground();
    this.customers = new Customers(this, this.day, hasUpgrade('furin') ? 1.3 : 1, {
      served: (c, f) => this.onServed(c, f),
      missed: () => this.onMissed(),
    });
    for (let i = 0; i < 3; i++) {
      this.lanes.push(new Lane(this, i, i < this.day.lanes, this.day.ingSpawn, {
        nextIng: (lane) => this.nextIng(lane),
        tryServe: (lane, item) => this.customers.tryServe(lane.index, item),
      }));
    }
    for (const l of this.lanes) l.prefill(this.beltSpeed);
    this.prep = new PrepStation(this, PREP_SLOTS + (hasUpgrade('plate') ? 1 : 0), this.day.menu);
    this.trash = new Trash(this);
    this.drag = new DragController<Held>(this, {
      pick: (x, y) => this.pick(x, y),
      hover: (h, x, y) => this.hover(h, x, y),
      drop: (h, x, y, v) => this.drop(h, x, y, v),
    });

    this.buildHud();
    this.buildMenuCard();
    const kb = this.input.keyboard!;
    kb.on('keydown-SPACE', () => this.togglePause());
    kb.on('keydown-ESC', () => this.togglePause());
    // Auto-pause if the tab is hidden mid-shift.
    const onHidden = () => { if (!this.paused) this.togglePause(); };
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden));
    this.showIntro();
  }

  private get beltSpeed() {
    return this.day.beltSpeed * (hasUpgrade('slow') ? 0.85 : 1);
  }

  update(_time: number, delta: number) {
    if (this.phase !== 'open' || this.paused) return;
    const dt = Math.min(delta / 1000, 0.05);
    for (const l of this.lanes) l.update(dt, this.beltSpeed);
    this.customers.update(dt);
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    this.drawTimer();
    if (this.timeLeft <= 0) this.endDay(false);
  }

  // Belts favour what their own lane's customers are waiting for.
  private nextIng(lane: Lane): Ingredient {
    const needs = this.customers.needs(lane.index);
    const from = needs.length && Math.random() < NEED_BIAS ? needs : this.pool;
    return Phaser.Utils.Array.GetRandom(from);
  }

  // ---------- drag & drop ----------

  private pick(x: number, y: number): Grab<Held> | null {
    for (const lane of this.lanes) {
      const it = lane.pickAt(x, y);
      if (!it || it.payload.t !== 'ing') continue;
      lane.take(it);
      return { data: { from: 'belt', ing: it.payload.ing }, visual: it.c };
    }
    const plate = this.prep.at(x, y);
    if (!plate || plate.empty) return null;
    const visual = plateVisual(this, plate.payload()).setPosition(plate.x, plate.y);
    plate.setLifted(true);
    return { data: { from: 'prep', plate }, visual };
  }

  private hover(h: Held, x: number, y: number) {
    this.trash.setOpen(this.trash.contains(x, y));
    if (h.from === 'belt') {
      this.prep.hintFor(h.ing, x, y);
    } else {
      const servable = this.isDish(h.plate);
      for (const l of this.lanes) l.setHover(servable && l.contains(x, y));
    }
  }

  private isDish(p: PrepPlate) {
    return p.dish !== null && p.dish !== 'mess';
  }

  private drop(h: Held, x: number, y: number, v: Phaser.GameObjects.Container) {
    this.prep.clearHints();
    for (const l of this.lanes) l.setHover(false);
    // Cancelled (pause / closing time): put things back instantly.
    if (x < -900) {
      v.destroy();
      if (h.from === 'prep') h.plate.setLifted(false);
      return;
    }
    const inTrash = this.trash.contains(x, y);
    if (h.from === 'belt') {
      const plate = this.prep.hintFor(h.ing, x, y);
      this.prep.clearHints();
      if (plate) {
        // Add right away so a quick follow-up grab of the plate sees it.
        plate.add(h.ing);
        this.tweens.add({ targets: v, x: plate.x, y: plate.y, scale: 0.5, alpha: 0, duration: 90, onComplete: () => v.destroy() });
      } else if (inTrash) {
        this.trash.eat(v);
      } else {
        const over = this.prep.at(x, y);
        if (over?.dish) floatText(this, x, y - 30, over.dish === 'mess' ? 'Trash the mess first!' : 'Dish is done, serve it!', '#ffe08a', 17);
        else if (over?.ings.includes(h.ing)) floatText(this, x, y - 30, `Already has ${INGREDIENTS[h.ing].name}!`, '#ffe08a', 17);
        this.poof(v);
      }
      return;
    }
    const plate = h.plate;
    const lane = this.lanes.find((l) => l.contains(x, y));
    if (lane && this.phase === 'open' && this.isDish(plate)) {
      v.destroy();
      const dish = plate.dish as DishKind;
      // Forgiving drop: landing near a customer who ordered it hands it straight over.
      const seat = this.customers.seats.find((st) => st.lane === lane.index && st.who?.state === 'waiting'
        && st.who.order === dish && Math.abs(st.x - x) <= SNAP_RANGE);
      lane.add(plate.payload(), seat ? seat.x : Phaser.Math.Clamp(x, 0, W), true);
      if (!seat && !this.customers.waiting(lane.index).some((c) => c.order === dish)) {
        floatText(this, x, lane.y - 40, 'Nobody in this lane ordered that', '#ffe08a', 16);
      }
      sfx.place();
      plate.clear();
    } else if (inTrash) {
      this.trash.eat(v);
      plate.clear();
    } else {
      if (lane) {
        floatText(this, x, y - 30, plate.dish === 'mess' ? 'Mess! Drag it to the trash' : 'Not finished yet!', '#ffe08a', 17);
        sfx.bad();
      }
      this.tweens.add({
        targets: v, x: plate.x, y: plate.y, scale: 1, duration: 200, ease: 'Quad.easeOut',
        onComplete: () => {
          v.destroy();
          // Don't un-hide the slot if the player already grabbed this plate again.
          const held = this.drag.holding;
          if (!(held?.from === 'prep' && held.plate === plate)) plate.setLifted(false);
        },
      });
    }
  }

  private poof(v: Phaser.GameObjects.Container) {
    const puff = this.add.image(v.x, v.y, 'puff').setScale(0.2).setDepth(DEPTH.held);
    this.tweens.add({ targets: puff, scale: NATIVE, alpha: 0, duration: 400, onComplete: () => puff.destroy() });
    this.tweens.add({ targets: v, scale: 0, alpha: 0, duration: 160, onComplete: () => v.destroy() });
    sfx.remove();
  }

  // ---------- scoring ----------

  private onServed(c: Customer, f: number): ServeResult {
    const def = CUSTOMERS[c.kind];
    const mul = def.payMul * (hasUpgrade('neko') ? 1.25 : 1);
    const yen = Math.round(DISHES[c.order].price * mul * (0.6 + 0.6 * f));
    let stars = 0.15, label = f > 0.5 ? 'Super fast! はやい!' : 'Yum! おいしい';
    if (def.critic) {
      if (f > 0.5) { stars = 0.4; label = 'Superb! すばらしい!'; }
      else if (f < 0.25) { stars = -0.2; label = 'Too slow… おそい'; }
      else label = 'Not bad. まあまあ';
    }
    this.stats.served++;
    this.addYen(yen);
    this.addStars(stars);
    return { yen, label };
  }

  private onMissed() {
    this.stats.missed++;
    this.addStars(-0.35);
  }

  private addYen(n: number) {
    run.yen += n;
    this.stats.earned += n;
    this.yenText.setText(`¥${run.yen}`);
    this.tweens.add({ targets: this.yenText, scale: 1.25, duration: 100, yoyo: true });
  }

  private addStars(d: number) {
    this.stars = Phaser.Math.Clamp(this.stars + d, 0, 5);
    this.drawStars();
    if (this.stars <= 0 && this.phase === 'open') this.endDay(true);
  }

  private endDay(failed: boolean) {
    if (this.phase === 'done') return;
    this.phase = 'done';
    this.drag.enabled = false;
    this.drag.cancel();
    this.customers.closeShop();
    const c = this.add.container(W / 2, H / 2).setDepth(DEPTH.modal).setScale(0);
    c.add(txt(this, 0, -16, failed ? 'Oh no! No stars left…' : 'Closing time!', 56, '#ffffff', { fontStyle: 'bold', stroke: INK, strokeThickness: 10 }).setOrigin(0.5));
    c.add(jp(this, 0, 36, failed ? 'ざんねん…' : 'おしまい!', 24, '#ffffff').setOrigin(0.5).setStroke(INK, 7));
    this.tweens.add({ targets: c, scale: 1, duration: 400, ease: 'Back.easeOut' });
    if (failed) sfx.bad(); else sfx.fanfare();
    const stats: DayStats = { ...this.stats, stars: this.stars, failed };
    this.time.delayedCall(2000, () => this.scene.start('Results', stats));
  }

  // ---------- drawing ----------

  private drawBackground() {
    this.cameras.main.setBackgroundColor('#f6e7cf');
    const g = this.add.graphics().setDepth(DEPTH.floor);
    for (let i = 0; i < 3; i++) {
      const t = laneTop(i), on = i < this.day.lanes;
      // shoji wall behind the seats
      g.fillStyle(on ? 0xfbf5ea : 0xe9dcc6, 1).fillRect(0, t, W, SEAT_H);
      g.lineStyle(2, 0xe2cba4, 1);
      for (let x = 0; x <= W; x += 64) g.lineBetween(x, t, x, t + SEAT_H);
      g.lineBetween(0, t + SEAT_H / 2, W, t + SEAT_H / 2);
      // wooden counter edge and belt frame
      g.fillStyle(COLORS.woodDark, 1).fillRect(0, t + SEAT_H - 6, W, 6);
      g.fillStyle(COLORS.ink, 1).fillRect(0, t + LANE_H - 2, W, 4);
      txt(this, 10, t + 6, `Lane ${i + 1}`, 14, '#8a6a4a', { fontStyle: 'bold' }).setDepth(DEPTH.floor + 1);
    }
    // bottom counter
    g.fillStyle(COLORS.wood, 1).fillRect(0, COUNTER_Y, W, H - COUNTER_Y);
    g.fillStyle(COLORS.woodDark, 1).fillRect(0, COUNTER_Y, W, 8);
    g.lineStyle(2, COLORS.woodDark, 0.5);
    for (let y = COUNTER_Y + 40; y < H; y += 44) g.lineBetween(0, y, W, y);
    // HUD bar
    g.fillStyle(0x5a3a2a, 1).fillRect(0, 0, W, TOP);
    g.fillStyle(COLORS.ink, 1).fillRect(0, TOP - 4, W, 4);
  }

  private buildHud() {
    const d = DEPTH.ui;
    this.add.image(26, TOP / 2, 'petal').setScale(0.6).setDepth(d);
    const season = txt(this, 46, TOP / 2, this.day.season, 24, '#fff6e6', { fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(d);
    const kana = jp(this, season.x + season.width + 6, TOP / 2 + 2, this.day.seasonKana, 14, '#ffb3c6').setOrigin(0, 0.5).setDepth(d);
    txt(this, kana.x + kana.width + 10, TOP / 2, `· Day ${run.day + 1}/${DAYS.length}`, 22, '#fff6e6', { fontStyle: 'bold' })
      .setOrigin(0, 0.5).setDepth(d);

    button(this, 440, TOP / 2, 'II', () => this.togglePause(), { w: 44, h: 34, size: 18, fill: 0x9a7a5c }).setDepth(d);
    this.timerG = this.add.graphics().setDepth(d);
    this.timerText = txt(this, 812, TOP / 2, '', 20, '#fff6e6', { fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(d);
    this.drawTimer();

    this.add.image(940, TOP / 2, 'coin').setScale(0.6).setDepth(d);
    this.yenText = txt(this, 958, TOP / 2, `¥${run.yen}`, 22, '#ffd23f', { fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(d);
    for (let i = 0; i < 5; i++) {
      this.starImgs.push(this.add.image(1110 + i * 34, TOP / 2, 'star_off').setScale(0.5).setDepth(d));
    }
    this.drawStars();
  }

  private drawStars() {
    this.starImgs.forEach((s, i) => {
      const key = this.stars >= i + 0.5 ? 'star_on' : 'star_off';
      if (s.texture.key !== key) {
        s.setTexture(key);
        this.tweens.add({ targets: s, scale: 0.7, duration: 120, yoyo: true });
      }
    });
  }

  private drawTimer() {
    const g = this.timerG;
    const f = this.timeLeft / this.day.duration;
    g.clear();
    g.fillStyle(COLORS.ink, 1).fillRoundedRect(480, 14, 320, 24, 12);
    g.fillStyle(0x3d2a20, 1).fillRoundedRect(484, 18, 312, 16, 8);
    g.fillStyle(f > 0.25 ? 0xff9fb3 : 0xff5c5c, 1).fillRoundedRect(484, 18, Math.max(8, 312 * f), 16, 8);
    const s = Math.ceil(this.timeLeft);
    this.timerText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
  }

  // Today's recipes: dish, name, = ingredients, price.
  private buildMenuCard() {
    const { x, y, w, h } = MENU;
    const d = DEPTH.prep;
    panel(this, x, y, w, h, 0xfbf0dc, 14).setDepth(d);
    const head = txt(this, x + 14, y + 16, 'Menu', 18, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(d);
    jp(this, head.x + head.width + 8, y + 17, 'おしながき', 12, '#c0392b').setOrigin(0, 0.5).setDepth(d);
    const menu = this.day.menu;
    const rowH = Math.min(44, (h - 36) / menu.length);
    const tall = rowH >= 36; // room for kana on its own line
    menu.forEach((k, i) => {
      const dish = DISHES[k];
      const cy = y + 34 + rowH * (i + 0.5);
      const g = this.add.graphics().setDepth(d);
      g.fillStyle(i % 2 ? 0xf3e2c4 : 0xf8ebd4, 1).fillRoundedRect(x + 8, cy - rowH / 2 + 1, w - 16, rowH - 2, 7);
      this.add.image(x + 28, cy, `dish_${k}`).setScale(NATIVE * Math.min(0.62, rowH / 60)).setDepth(d);
      if (tall) {
        txt(this, x + 50, cy - 8, dish.name, 16, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(d);
        jp(this, x + 50, cy + 11, dish.kana, 12, '#a0281c').setOrigin(0, 0.5).setDepth(d);
      } else {
        const name = txt(this, x + 48, cy, dish.name, 15, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(d);
        jp(this, name.x + name.width + 5, cy + 1, dish.kana, 11, '#a0281c').setOrigin(0, 0.5).setDepth(d);
      }
      let cx = x + 230;
      txt(this, cx, cy, '=', 16, INK, { fontStyle: 'bold' }).setOrigin(0.5).setDepth(d);
      dish.set.forEach((ing, j) => {
        cx += 22;
        this.add.image(cx, cy, `ing_${ing}`).setScale(NATIVE * Math.min(0.5, rowH / 62)).setDepth(d);
        if (j < dish.set.length - 1) {
          cx += 15;
          txt(this, cx, cy, '+', 14, INK, { fontStyle: 'bold' }).setOrigin(0.5).setDepth(d);
        }
      });
      txt(this, x + w - 14, cy, `¥${dish.price}`, 15, '#8a5a08', { fontStyle: 'bold' }).setOrigin(1, 0.5).setDepth(d);
    });
  }

  // ---------- flow ----------

  private togglePause() {
    if (this.phase !== 'open') return;
    this.paused = !this.paused;
    if (this.paused) {
      this.drag.cancel();
      this.drag.enabled = false;
      this.tweens.pauseAll();
      this.time.paused = true;
      const c = this.add.container(0, 0).setDepth(DEPTH.modal);
      c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x2b1d1a, 0.5).setInteractive());
      c.add(txt(this, W / 2, H / 2 - 40, 'Paused', 56, '#ffffff', { fontStyle: 'bold', stroke: INK, strokeThickness: 10 }).setOrigin(0.5));
      c.add(jp(this, W / 2, H / 2 + 6, 'いちじていし', 18, '#fff6e6').setOrigin(0.5));
      c.add(button(this, W / 2, H / 2 + 70, 'Resume', () => this.togglePause(), { sub: 'つづける', w: 220, h: 60, fill: 0x4fbf6a }));
      this.pauseLayer = c;
    } else {
      this.tweens.resumeAll();
      this.time.paused = false;
      this.pauseLayer?.destroy();
      this.drag.enabled = true;
    }
  }

  private showIntro() {
    const c = this.add.container(0, 0).setDepth(DEPTH.modal);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x2b1d1a, 0.55).setInteractive());
    const pw = 700, ph = 540;
    const px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    c.add(panel(this, px, py, pw, ph));
    c.add(txt(this, W / 2, py + 44, `Day ${run.day + 1}`, 42, INK, { fontStyle: 'bold' }).setOrigin(0.5));
    c.add(txt(this, W / 2 - 6, py + 84, this.day.season, 20, '#c0392b', { fontStyle: 'bold' }).setOrigin(1, 0.5));
    c.add(jp(this, W / 2 + 6, py + 85, this.day.seasonKana, 14, '#c0392b').setOrigin(0, 0.5));
    c.add(txt(this, W / 2, py + 132, this.day.intro, 18, '#5a4030', { align: 'center', wordWrap: { width: pw - 80 } }).setOrigin(0.5));

    const mh = txt(this, W / 2 - 4, py + 182, "Today's menu", 17, INK, { fontStyle: 'bold' }).setOrigin(1, 0.5);
    c.add([mh, jp(this, W / 2 + 4, py + 183, 'きょうのメニュー', 12, '#c0392b').setOrigin(0, 0.5)]);
    const menu = this.day.menu;
    const gap = Math.min(130, (pw - 60) / menu.length);
    menu.forEach((k, i) => {
      const x = W / 2 + (i - (menu.length - 1) / 2) * gap;
      const img = this.add.image(x, py + 228, `dish_${k}`).setScale(NATIVE * 0.9);
      c.add(img);
      this.tweens.add({ targets: img, y: img.y - 6, duration: 500 + i * 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const name = txt(this, x, py + 268, DISHES[k].name, 14, INK, { fontStyle: 'bold' }).setOrigin(0.5);
      if (name.width > gap - 8) name.setScale((gap - 8) / name.width);
      c.add([name, jp(this, x, py + 286, DISHES[k].kana, 11, '#c0392b').setOrigin(0.5)]);
    });

    const steps = [
      '1. Drag food off a belt onto a prep plate',
      '2. Match a menu recipe and it becomes a dish',
      '3. Drag the dish onto the belt below the customer who ordered it',
      'Messy plate? Drag it to the trash.   Space = pause',
    ];
    c.add(txt(this, px + 70, py + 318, steps.join('\n'), 16, '#7a5a40', { lineSpacing: 8 }));
    c.add(button(this, W / 2, py + ph - 52, "Let's cook!", () => {
      c.destroy();
      this.phase = 'open';
      this.drag.enabled = true;
      sfx.fanfare();
      floatText(this, W / 2, 120, 'Open! かいてん!', '#ffffff', 30);
    }, { sub: 'はじめよう', w: 240, h: 60 }));
  }
}
