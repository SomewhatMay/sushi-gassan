import Phaser from 'phaser';
import { SHOP, type ShopDef } from '../data';
import { H, NATIVE, W } from '../layout';
import { sfx } from '../sfx';
import { hasUpgrade, run } from '../state';
import { INK, button, floatText, jp, panel, txt } from '../ui';

export class ShopScene extends Phaser.Scene {
  private yenText!: Phaser.GameObjects.Text;

  constructor() { super('Shop'); }

  create() {
    this.cameras.main.setBackgroundColor('#fbf0dc');
    this.add.image(W / 2, 60, 'noren').setScale(0.6);
    txt(this, W / 2, 130, 'Shop', 40, INK, { fontStyle: 'bold' }).setOrigin(0.5);
    jp(this, W / 2, 162, 'おみせ', 15, '#c0392b').setOrigin(0.5);
    txt(this, W / 2, 190, 'Spend your yen to upgrade the restaurant', 17, '#7a5a40').setOrigin(0.5);
    this.add.image(W - 190, 60, 'coin').setScale(0.7);
    this.yenText = txt(this, W - 162, 60, `¥${run.yen}`, 30, '#b07a12', { fontStyle: 'bold' }).setOrigin(0, 0.5);

    SHOP.forEach((item, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      this.card(item, W / 2 + (col - 0.5) * 420, 320 + row * 190);
    });

    let leaving = false;
    button(this, W / 2, H - 50, 'Next day →', () => {
      if (leaving) return;
      leaving = true;
      run.day++;
      this.scene.start('Game', { replay: false });
    }, { sub: 'つぎのひ', w: 260, h: 60, fill: 0x4fbf6a });
  }

  private card(item: ShopDef, x: number, y: number) {
    const w = 400, h = 170;
    panel(this, x - w / 2, y - h / 2, w, h, 0xfffaf0, 16);
    this.add.image(x - 140, y - 10, item.icon).setScale(NATIVE * 1.5);
    txt(this, x - 80, y - 58, item.name, 22, INK, { fontStyle: 'bold' });
    jp(this, x - 80, y - 30, item.kana, 13, '#c0392b');
    txt(this, x - 80, y - 8, item.desc, 16, '#5a4030', { wordWrap: { width: 260 } });
    const owned = hasUpgrade(item.id);
    const label = owned ? 'Owned' : `¥${item.price}`;
    const btn = button(this, x + 60, y + 48, label, () => this.buy(item, btn), {
      w: 200, h: 44, size: 20, fill: owned ? 0x9a9a9a : run.yen >= item.price ? 0xe8434b : 0xc9a9a0,
    });
  }

  private buying = false;

  init() {
    this.buying = false;
  }

  private buy(item: ShopDef, btn: Phaser.GameObjects.Container) {
    if (this.buying || hasUpgrade(item.id)) return;
    if (run.yen < item.price) {
      sfx.bad();
      floatText(this, btn.x, btn.y - 30, 'Not enough yen!', '#ff8a8a', 18);
      return;
    }
    run.yen -= item.price;
    run.upgrades.push(item.id);
    this.buying = true;
    sfx.coin();
    floatText(this, btn.x, btn.y - 30, 'Bought!', '#4fbf6a', 20);
    this.yenText.setText(`¥${run.yen}`);
    this.time.delayedCall(250, () => this.scene.restart());
  }
}
