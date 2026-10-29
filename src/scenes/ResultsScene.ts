import Phaser from 'phaser';
import { DAYS } from '../data';
import { H, W } from '../layout';
import { sfx } from '../sfx';
import { run, type DayStats } from '../state';
import { COLORS, INK, button, jp, panel, petals, txt } from '../ui';

export function grade(s: DayStats): [string, string, string] {
  const ratio = s.served / Math.max(1, s.served + s.missed);
  if (s.failed) return ['再', 'Try again', 'もういちど'];
  if (s.served === 0) return ['練', 'Keep practicing', 'れんしゅう'];
  if (s.stars >= 4 && ratio >= 0.85 && s.served >= 5) return ['花丸', 'Amazing!', 'はなまる'];
  if (s.stars >= 2.5 && ratio >= 0.6 && s.served >= 3) return ['良', 'Good job!', 'よい'];
  return ['可', 'Okay', 'まあまあ'];
}

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(stats: DayStats) {
    this.cameras.main.setBackgroundColor('#fbf0dc');
    petals(this, 12, 0);
    const pw = 620, ph = 520, px = W / 2 - pw / 2, py = H / 2 - ph / 2;
    panel(this, px, py, pw, ph);
    const last = run.day === DAYS.length - 1;
    const title = stats.failed ? 'The shop closed early!' : last ? 'Spring complete!' : `Day ${run.day + 1} done!`;
    txt(this, W / 2, py + 50, title, 40, INK, { fontStyle: 'bold' }).setOrigin(0.5);
    jp(this, W / 2, py + 92, stats.failed ? 'ざんねん…' : last ? 'はる クリア!' : 'おつかれさま!', 20, '#c0392b').setOrigin(0.5);

    const rows: [string, string][] = [
      ['Customers served', `${stats.served}`],
      ['Customers who left', `${stats.missed}`],
      ['Yen earned', `¥${stats.earned}`],
      ['Total yen', `¥${run.yen}`],
    ];
    rows.forEach(([k, v], i) => {
      const y = py + 150 + i * 40;
      txt(this, px + 70, y, k, 22, '#5a4030').setOrigin(0, 0.5);
      txt(this, px + 360, y, v, 24, INK, { fontStyle: 'bold' }).setOrigin(1, 0.5);
    });
    for (let i = 0; i < 5; i++) {
      const s = this.add.image(px + 110 + i * 46, py + 330, stats.stars >= i + 0.5 ? 'star_on' : 'star_off').setScale(0);
      this.tweens.add({ targets: s, scale: 0.7, duration: 250, delay: 300 + i * 120, ease: 'Back.easeOut' });
    }

    // hanko stamp: graded on how many customers you fed, not just stars left
    const [kanji, english, reading] = grade(stats);
    const stamp = this.add.container(px + 500, py + 250).setScale(3).setAlpha(0).setAngle(-30);
    const g = this.add.graphics();
    g.lineStyle(7, COLORS.red, 1).strokeCircle(0, 0, 62).lineStyle(3, COLORS.red, 1).strokeCircle(0, 0, 53);
    stamp.add([g, jp(this, 0, 0, kanji, kanji.length > 1 ? 42 : 58, '#e8434b').setOrigin(0.5)]);
    this.tweens.add({
      targets: stamp, scale: 1, alpha: 0.9, angle: -12, duration: 280, delay: 1000, ease: 'Quad.easeIn',
      onComplete: () => { sfx.bad(); this.cameras.main.shake(120, 0.006); },
    });
    txt(this, px + 500, py + 336, english, 26, '#c0392b', { fontStyle: 'bold' }).setOrigin(0.5);
    jp(this, px + 500, py + 362, reading, 14, '#c0392b').setOrigin(0.5);

    const by = py + ph - 60;
    if (stats.failed) {
      button(this, W / 2, by, 'Try again', () => this.scene.start('Game', { replay: true }), { sub: 'もういちど', w: 260, h: 60 });
    } else if (last) {
      button(this, W / 2 - 140, by, 'Replay day', () => this.scene.start('Game', { replay: true }), { sub: 'もういちど', w: 220, h: 60, fill: 0x9a7a5c });
      button(this, W / 2 + 140, by, 'Title', () => this.scene.start('Title'), { sub: 'タイトル', w: 220, h: 60 });
      txt(this, W / 2, by - 72, 'Summer festival coming soon…', 18, '#7a5a40').setOrigin(0.5);
      jp(this, W / 2, by - 51, 'なつまつり', 12, '#7a5a40').setOrigin(0.5);
    } else {
      button(this, W / 2 - 140, by, 'Replay day', () => this.scene.start('Game', { replay: true }), { sub: 'もういちど', w: 220, h: 60, fill: 0x9a7a5c });
      button(this, W / 2 + 140, by, 'Shop', () => this.scene.start('Shop'), { sub: 'おみせ', w: 220, h: 60, fill: 0x4fbf6a });
    }
  }
}
