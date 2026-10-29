import Phaser from 'phaser';
import { allArt } from '../art/svg';
import { txt } from '../ui';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const label = txt(this, 640, 360, 'Loading…', 28, '#fff6e6').setOrigin(0.5);
    this.load.on('progress', (v: number) => label.setText(`Loading… ${Math.round(v * 100)}%`));
    for (const a of allArt()) {
      const url = URL.createObjectURL(new Blob([a.svg], { type: 'image/svg+xml' }));
      this.load.svg(a.key, url, { width: a.w * a.scale, height: a.h * a.scale });
    }
  }

  create() {
    this.scene.start('Title');
  }
}
