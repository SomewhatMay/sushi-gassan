// Tiny synth blips so we need no audio files.
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol = 0.15, slide = 0, delay = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur);
}

export const sfx = {
  place: () => tone(520, 0.08, 'triangle', 0.12, 1.6),
  remove: () => tone(300, 0.1, 'triangle', 0.12, 0.5),
  rotate: () => tone(700, 0.05, 'sine', 0.08),
  pop: () => tone(880, 0.07, 'sine', 0.07, 1.3),
  coin: () => { tone(988, 0.08, 'square', 0.06); tone(1319, 0.18, 'square', 0.06, 1, 0.08); },
  happy: () => { tone(660, 0.1, 'triangle', 0.1); tone(880, 0.14, 'triangle', 0.1, 1, 0.1); },
  bad: () => tone(220, 0.25, 'sawtooth', 0.07, 0.6),
  bell: () => { tone(1568, 0.5, 'sine', 0.08); tone(2093, 0.6, 'sine', 0.04, 1, 0.02); },
  click: () => tone(1200, 0.03, 'square', 0.04),
  // pentatonic jingle
  fanfare: () => [523, 587, 659, 784, 880, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, 1, i * 0.09)),
};
