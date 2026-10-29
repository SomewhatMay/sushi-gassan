// Big cute bin: lid pops open while you hover something over it.
import Phaser from 'phaser';
import { DEPTH, NATIVE, TRASH } from '../layout';
import { sfx } from '../sfx';
import { drawTag, jp, txt } from '../ui';

export class Trash {
  private img: Phaser.GameObjects.Image;
  private open = false;

  constructor(private scene: Phaser.Scene) {
    this.img = scene.add.image(TRASH.x, TRASH.y, 'trash').setScale(NATIVE).setDepth(DEPTH.prep);
    const tag = scene.add.graphics().setDepth(DEPTH.prep);
    const name = txt(scene, TRASH.x, TRASH.y + 58, 'Trash', 16, '#3a2420', { fontStyle: 'bold' }).setOrigin(0.5).setDepth(DEPTH.prep);
    const kana = jp(scene, TRASH.x, TRASH.y + 75, 'ごみばこ', 12, '#a0281c').setOrigin(0.5).setDepth(DEPTH.prep);
    drawTag(tag, TRASH.x, TRASH.y + 47, name, kana);
  }

  contains(x: number, y: number) {
    return Phaser.Math.Distance.Between(x, y, TRASH.x, TRASH.y) <= TRASH.r;
  }

  setOpen(on: boolean) {
    if (on === this.open) return;
    this.open = on;
    this.img.setTexture(on ? 'trash_open' : 'trash');
    this.scene.tweens.add({ targets: this.img, scale: NATIVE * (on ? 1.12 : 1), duration: 110, ease: 'Back.easeOut' });
  }

  // Swallow a held visual.
  eat(visual: Phaser.GameObjects.Container) {
    sfx.remove();
    this.scene.tweens.add({
      targets: visual, x: TRASH.x, y: TRASH.y - 10, scale: 0.2, angle: 200, duration: 240, ease: 'Quad.easeIn',
      onComplete: () => {
        visual.destroy();
        this.setOpen(false);
        this.scene.tweens.add({ targets: this.img, angle: { from: -10, to: 10 }, duration: 60, yoyo: true, repeat: 2, onComplete: () => this.img.setAngle(0) });
      },
    });
  }
}
