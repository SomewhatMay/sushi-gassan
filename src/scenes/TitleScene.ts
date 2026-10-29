import Phaser from 'phaser';
import { W, H, NATIVE } from '../layout';
import { DAYS } from '../data';
import { debug, resetRun, run } from '../state';
import { button, jp, petals, txt, INK } from '../ui';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    if (debug.day) {
      resetRun();
      run.day = Math.min(debug.day, DAYS.length) - 1;
      run.yen = 1000;
      debug.day = 0;
      this.scene.start('Game', { replay: false });
      return;
    }
    this.cameras.main.setBackgroundColor('#fbf0dc');
    const g = this.add.graphics();
    g.lineStyle(3, 0xe2cba4, 1);
    for (let x = 0; x <= W; x += 64) g.lineBetween(x, 0, x, H);
    for (let y = 0; y <= H; y += 80) g.lineBetween(0, y, W, y);
    g.fillStyle(0xe8434b, 1).fillCircle(W / 2, 250, 170);

    for (const x of [140, 320, 960, 1140]) {
      const l = this.add.image(x, 70, 'lantern').setScale(1.1).setOrigin(0.5, 0);
      this.tweens.add({ targets: l, angle: { from: -4, to: 4 }, duration: 1600 + x, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    txt(this, W / 2, 225, 'SUSHI GASSEN', 92, '#ffffff', { fontStyle: 'bold', stroke: INK, strokeThickness: 14 }).setOrigin(0.5);
    jp(this, W / 2, 312, 'すし合戦', 46, '#ffffff').setOrigin(0.5).setStroke(INK, 9);

    const parade = ['salmonNigiri', 'kappaMaki', 'tunaNigiri', 'tamagoNigiri', 'ebiNigiri', 'salmonNigiri'];
    parade.forEach((k, i) => {
      const img = this.add.image(220 + i * 168, 500, `dish_${k}`).setScale(NATIVE * 1.4);
      this.tweens.add({ targets: img, y: 480, duration: 420, yoyo: true, repeat: -1, delay: i * 120, ease: 'Sine.easeInOut' });
    });
    ['shiba', 'bunny', 'owl'].forEach((k, i) => {
      const c = this.add.image(W - 250 + i * 90, 640, `cust_${k}_happy`).setScale(0);
      this.tweens.add({ targets: c, scale: NATIVE, duration: 400, delay: 400 + i * 150, ease: 'Back.easeOut' });
    });

    button(this, W / 2, 620, 'Start!', () => {
      resetRun();
      this.scene.start('Game', { replay: false });
    }, { sub: 'スタート', w: 260, h: 70, size: 30 });
    txt(this, 20, H - 28, 'A kaiten sushi game', 14, '#a08060');
    petals(this, 18);
  }
}
