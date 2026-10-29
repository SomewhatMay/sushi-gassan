import Phaser from 'phaser';
import { H, W } from './layout';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { ResultsScene } from './scenes/ResultsScene';
import { ShopScene } from './scenes/ShopScene';
import { TitleScene } from './scenes/TitleScene';

// Google Fonts serves CJK in unicode-range slices; request every kana plus the kanji we use.
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCharCode(a + i)).join('');
const JP_SAMPLE = range(0x3041, 0x3096) + range(0x30a1, 0x30fc) + '合戦花丸再良可練・…！';

async function start() {
  // Wait for web fonts so canvas text renders with them (but don't hang if offline).
  await Promise.race([
    Promise.all([
      document.fonts.load('700 20px Fredoka'),
      document.fonts.load('800 20px "M PLUS Rounded 1c"', JP_SAMPLE),
      document.fonts.load('700 20px "M PLUS Rounded 1c"', JP_SAMPLE),
    ]),
    new Promise((r) => setTimeout(r, 2500)),
  ]).catch(() => {});

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#2b1d1a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, TitleScene, GameScene, ResultsScene, ShopScene],
  });
  // Dev-only hook for automated play tests.
  if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
}

void start();
