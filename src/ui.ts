// Shared UI helpers: fonts, text, buttons, floating text.
import Phaser from 'phaser';
import { sfx } from './sfx';

export const FONT = '"Fredoka", "M PLUS Rounded 1c", sans-serif';
export const JP = '"M PLUS Rounded 1c", "Fredoka", sans-serif';
export const INK = '#3a2420';

export const COLORS = {
  ink: 0x3a2420,
  cream: 0xfff6e6,
  wood: 0xd9a066,
  woodDark: 0xa86b3c,
  red: 0xe8434b,
  pink: 0xff7aa2,
  mint: 0xd8f3e6,
};

export function txt(
  scene: Phaser.Scene, x: number, y: number, s: string, size = 20,
  color = INK, opts: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
) {
  return scene.add.text(x, y, s, {
    fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2, ...opts,
  });
}

export function jp(scene: Phaser.Scene, x: number, y: number, s: string, size = 16, color = INK) {
  return txt(scene, x, y, s, size, color, { fontFamily: JP });
}

export function button(
  scene: Phaser.Scene, x: number, y: number, label: string, onClick: () => void,
  opts: { w?: number; h?: number; fill?: number; size?: number; sub?: string } = {},
) {
  const w = opts.w ?? 220, h = opts.h ?? 56, fill = opts.fill ?? COLORS.red;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (pressed: boolean) => {
    g.clear();
    g.fillStyle(COLORS.ink, 1).fillRoundedRect(-w / 2, -h / 2 + 5, w, h, 16);
    g.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2 + (pressed ? 4 : 0), w, h, 16);
    g.lineStyle(3.5, COLORS.ink, 1).strokeRoundedRect(-w / 2, -h / 2 + (pressed ? 4 : 0), w, h, 16);
  };
  draw(false);
  const t = txt(scene, 0, opts.sub ? -8 : 0, label, opts.size ?? 24, '#ffffff', {
    fontStyle: 'bold', stroke: INK, strokeThickness: 5,
  }).setOrigin(0.5);
  c.add([g, t]);
  if (opts.sub) c.add(jp(scene, 0, 14, opts.sub, 13, '#ffffff').setOrigin(0.5).setStroke(INK, 4));
  c.setSize(w, h).setInteractive({ useHandCursor: true });
  // Only fire if the press started on this button (releasing a drag over it does nothing).
  let armed = false;
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.05, duration: 90 }));
  c.on('pointerout', () => { armed = false; draw(false); scene.tweens.add({ targets: c, scale: 1, duration: 90 }); });
  c.on('pointerdown', () => { armed = true; draw(true); sfx.click(); });
  c.on('pointerup', () => {
    draw(false);
    if (!armed) return;
    armed = false;
    onClick();
  });
  return c;
}

export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color = '#ffffff', size = 20) {
  const t = txt(scene, x, y, s, size, color, { fontStyle: 'bold', stroke: INK, strokeThickness: 5, fontFamily: JP })
    .setOrigin(0.5).setDepth(1000);
  scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1100, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  return t;
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = COLORS.cream, r = 18) {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.ink, 0.35).fillRoundedRect(x + 4, y + 6, w, h, r);
  g.fillStyle(fill, 1).fillRoundedRect(x, y, w, h, r);
  g.lineStyle(4, COLORS.ink, 1).strokeRoundedRect(x, y, w, h, r);
  return g;
}

// Cream name tag (English big, kana small beneath) so labels read clearly on the wooden counter.
export function drawTag(g: Phaser.GameObjects.Graphics, x: number, top: number, name: Phaser.GameObjects.Text, kana: Phaser.GameObjects.Text) {
  const w = Math.max(name.displayWidth, kana.text ? kana.displayWidth : 0) + 16;
  const h = kana.text ? 38 : 22;
  g.clear();
  g.fillStyle(COLORS.cream, 0.95).fillRoundedRect(x - w / 2, top, w, h, 9);
  g.lineStyle(2, COLORS.ink, 0.6).strokeRoundedRect(x - w / 2, top, w, h, 9);
}

// Falling sakura petals in the background.
export function petals(scene: Phaser.Scene, count = 14, depth = 900) {
  const { width, height } = scene.scale;
  for (let i = 0; i < count; i++) {
    const p = scene.add.image(0, 0, 'petal').setDepth(depth).setAlpha(0.85);
    const fall = () => {
      p.setPosition(Phaser.Math.Between(-50, width), -20).setScale(Phaser.Math.FloatBetween(0.35, 0.65));
      p.setAngle(Phaser.Math.Between(0, 360));
      scene.tweens.add({
        targets: p, y: height + 30, x: p.x + Phaser.Math.Between(80, 260), angle: p.angle + Phaser.Math.Between(180, 540),
        duration: Phaser.Math.Between(7000, 13000), onComplete: fall,
      });
    };
    scene.time.delayedCall(i * 700, fall);
  }
}
