// Cartoon art as SVG strings. Everything uses chunky outlines and flat colors.
// Self-contained: no game-data imports. Keys must match the Art contract in docs/DESIGN.md.

const INGREDIENTS = ['rice', 'nori', 'salmon', 'tuna', 'cucumber', 'tamago', 'ebi'] as const;
const DISHES = ['salmonNigiri', 'tunaNigiri', 'tamagoNigiri', 'ebiNigiri', 'kappaMaki'] as const;
type Ingredient = (typeof INGREDIENTS)[number];
type Dish = (typeof DISHES)[number];
type Food = Ingredient | Dish | 'mess';
type Mood = 'happy' | 'dizzy';
type Expr = 'happy' | 'waiting' | 'angry';

const OL = '#3a2420';
const SW = 3.5;
const BLUSH = '#ff8fa3';
const ANGRY_CHEEK = '#ff4d5e';

const wrap = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

const st = (fill: string, sw = SW) =>
  `fill="${fill}" stroke="${OL}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;

const ln = (color: string, sw: number) =>
  `stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

// Little face, centered at (cx, cy).
function face(cx: number, cy: number, mood: Mood, s = 1, ink = OL): string {
  const p = (x: number, y: number) => `${cx + x * s} ${cy + y * s}`;
  const line = `stroke="${ink}" stroke-width="${2.4 * s}" fill="none" stroke-linecap="round"`;
  const cheeks = (o: number) => `
      <ellipse cx="${cx - 12 * s}" cy="${cy + 4 * s}" rx="${3 * s}" ry="${1.8 * s}" fill="${BLUSH}" opacity="${o}"/>
      <ellipse cx="${cx + 12 * s}" cy="${cy + 4 * s}" rx="${3 * s}" ry="${1.8 * s}" fill="${BLUSH}" opacity="${o}"/>`;
  if (mood === 'happy') {
    return `
      <ellipse cx="${cx - 7 * s}" cy="${cy}" rx="${2.6 * s}" ry="${3.3 * s}" fill="${ink}"/>
      <ellipse cx="${cx + 7 * s}" cy="${cy}" rx="${2.6 * s}" ry="${3.3 * s}" fill="${ink}"/>
      <circle cx="${cx - 6.2 * s}" cy="${cy - 1.2 * s}" r="${1 * s}" fill="#fff"/>
      <circle cx="${cx + 7.8 * s}" cy="${cy - 1.2 * s}" r="${1 * s}" fill="#fff"/>
      <path d="M${p(-3.5, 4)} Q${p(0, 8)} ${p(3.5, 4)}" ${line}/>${cheeks(0.75)}`;
  }
  // dizzy: swirl eyes + wobbly mouth
  const swirl = (ex: number) =>
    `<path d="M${p(ex, 0)} A${s} ${s} 0 0 1 ${p(ex + 2, 0)} A${2 * s} ${2 * s} 0 0 1 ${p(ex - 2, 0)} A${3 * s} ${3 * s} 0 0 1 ${p(ex + 4, 0)}" stroke="${ink}" stroke-width="${1.8 * s}" fill="none" stroke-linecap="round"/>`;
  return `
    ${swirl(-8)}${swirl(6)}
    <path d="M${p(-5, 6)} Q${p(-3.75, 4)} ${p(-2.5, 6)} T${p(0, 6)} T${p(2.5, 6)} T${p(5, 6)}" stroke="${ink}" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>${cheeks(0.6)}`;
}

const SALMON = '#ff9a6b';
const SALMON_STRIPE = '#ffe3d2';
const TUNA = '#e2434b';
const TUNA_STRIPE = '#f58a8e';
const NORI = '#2f4a32';
const RICE = '#fffdf7';
const EGG = '#ffd84d';
const EGG_LINE = '#fff1a8';
const EBI = '#ff8a4c';
const EBI_LIGHT = '#fff1e6';
const EBI_TAIL = '#f0553a';
const CUKE = '#57b35a';

interface Body { body: string; fx: number; fy: number; fs: number; ink?: string }

const riceBlock = `<rect x="11" y="33" width="42" height="19" rx="9.5" ${st(RICE)}/>`;
const fishTopPath = 'M6 36 Q10 16 32 16 Q54 16 58 34 Q52 42 32 41 Q12 43 6 36 Z';

// Food bodies (64x64), without the face.
function foodBody(kind: Food): Body {
  switch (kind) {
    case 'rice':
      return {
        body: `
          <path d="M10 47 Q8 22 32 15 Q56 22 54 47 Q32 54 10 47 Z" ${st(RICE)}/>
          <g ${ln('#e5ddcc', 2)}>
            <path d="M20 24 l3 -2"/><path d="M42 23 l3 2"/><path d="M15 40 l2 2"/><path d="M47 41 l2 -2"/><path d="M32 19 l2 0"/>
          </g>`,
        fx: 32, fy: 35, fs: 1,
      };
    case 'nori':
      return {
        body: `
          <rect x="11" y="13" width="42" height="40" rx="6" ${st(NORI)}/>
          <g ${ln('#41654a', 2)}><path d="M15 20 L49 20"/><path d="M15 47 L49 47"/></g>`,
        fx: 32, fy: 32, fs: 0.95, ink: '#fff',
      };
    case 'salmon':
    case 'tuna': {
      const c = kind === 'salmon' ? SALMON : TUNA;
      const sc = kind === 'salmon' ? SALMON_STRIPE : TUNA_STRIPE;
      return {
        body: `
          <path d="M5 42 Q12 16 59 21 Q56 44 9 48 Z" ${st(c)}/>
          <g ${ln(sc, 2.6)}>
            <path d="M13 29 Q18 37 13 44"/><path d="M51 25 Q46 33 51 41"/>
          </g>`,
        fx: 32, fy: 33, fs: 0.85,
      };
    }
    case 'cucumber':
      return {
        body: `
          <rect x="6" y="22" width="52" height="22" rx="11" ${st(CUKE)}/>
          <ellipse cx="51" cy="33" rx="4" ry="7" fill="#b5e3a2"/>
          <g fill="#2f7d35"><circle cx="13" cy="28" r="1.4"/><circle cx="16" cy="38" r="1.4"/><circle cx="44" cy="27" r="1.4"/><circle cx="45" cy="39" r="1.4"/></g>`,
        fx: 30, fy: 32, fs: 0.8,
      };
    case 'tamago':
      return {
        body: `
          <rect x="7" y="17" width="50" height="32" rx="7" ${st(EGG)}/>
          <g ${ln(EGG_LINE, 2.4)}>
            <path d="M12 23 H52"/><path d="M12 43 H52"/>
          </g>
          <g ${ln('#e8b52e', 2)}><path d="M12 28 H17"/><path d="M47 38 H52"/></g>`,
        fx: 32, fy: 33, fs: 0.9,
      };
    case 'ebi':
      return {
        body: `
          <defs><clipPath id="ebiBody"><path d="M8 44 C5 24 20 12 36 14 C47 15 55 22 56 32 L48 40 C44 34 38 33 31 34 C25 35 22 40 22 46 Q15 50 8 44 Z"/></clipPath></defs>
          <path d="M50 34 L62 34 L61 46 L55 53 L45 43 Z" ${st(EBI_TAIL, 3)}/>
          <g ${ln('#ffb39a', 1.8)}><path d="M52 39 L59 37"/><path d="M52 42 L57 49"/></g>
          <path d="M8 44 C5 24 20 12 36 14 C47 15 55 22 56 32 L48 40 C44 34 38 33 31 34 C25 35 22 40 22 46 Q15 50 8 44 Z" fill="${EBI}"/>
          <g clip-path="url(#ebiBody)" ${ln(EBI_LIGHT, 3.6)}>
            <path d="M3 36 L25 39"/><path d="M8 26 L26 34"/><path d="M45 9 L41 35"/><path d="M60 17 L42 35"/>
          </g>
          <path d="M8 44 C5 24 20 12 36 14 C47 15 55 22 56 32 L48 40 C44 34 38 33 31 34 C25 35 22 40 22 46 Q15 50 8 44 Z" ${st('none')}/>
          <g ${ln(OL, 2)}><path d="M26 41 l-2 5"/><path d="M33 37 l-1 5"/><path d="M40 37 l1 5"/></g>`,
        fx: 32, fy: 24, fs: 0.7,
      };
    case 'salmonNigiri':
    case 'tunaNigiri': {
      const c = kind === 'salmonNigiri' ? SALMON : TUNA;
      const sc = kind === 'salmonNigiri' ? SALMON_STRIPE : TUNA_STRIPE;
      return {
        body: `
          ${riceBlock}
          <path d="${fishTopPath}" ${st(c)}/>
          <g ${ln(sc, 2.4)}>
            <path d="M13 24 Q17 31 13 37"/><path d="M51 23 Q47 30 51 36"/>
          </g>`,
        fx: 32, fy: 28, fs: 0.85,
      };
    }
    case 'tamagoNigiri':
      return {
        body: `
          ${riceBlock}
          <rect x="7" y="17" width="50" height="23" rx="6" ${st(EGG)}/>
          <path d="M12 22 H52" ${ln(EGG_LINE, 2.4)}/>
          <path d="M14 14 H24 V54 H14 Z" ${st(NORI, 3)}/>
          <path d="M17 18 V50" ${ln('#41654a', 1.8)}/>`,
        fx: 40, fy: 29, fs: 0.75,
      };
    case 'ebiNigiri':
      return {
        body: `
          <defs><clipPath id="ebiTop"><path d="${fishTopPath}"/></clipPath></defs>
          ${riceBlock}
          <path d="M49 30 L55 11 L62 21 L58 35 Z" ${st(EBI_TAIL, 3)}/>
          <path d="M55 26 L57 17" ${ln('#ffb39a', 1.8)}/><path d="M57 29 L60 23" ${ln('#ffb39a', 1.8)}/>
          <path d="${fishTopPath}" fill="${EBI_LIGHT}"/>
          <g clip-path="url(#ebiTop)" ${ln(EBI, 5)}>
            <path d="M10 14 Q15 30 9 44"/><path d="M19 14 Q23 30 18 44"/><path d="M45 14 Q41 30 46 44"/><path d="M54 14 Q50 30 55 44"/>
          </g>
          <path d="${fishTopPath}" ${st('none')}/>`,
        fx: 32, fy: 28, fs: 0.8,
      };
    case 'kappaMaki':
      return {
        body: `
          <path d="M12 22 L12 46 A20 8 0 0 0 52 46 L52 22 Z" ${st(NORI)}/>
          <ellipse cx="32" cy="22" rx="20" ry="9" ${st(RICE)}/>
          <ellipse cx="32" cy="22" rx="6.5" ry="3.4" fill="${CUKE}" stroke="#2f7d35" stroke-width="1.5"/>`,
        fx: 32, fy: 38, fs: 0.8, ink: '#fff',
      };
    case 'mess':
      return {
        body: `
          <g fill="${RICE}" stroke="${OL}" stroke-width="1.6">
            <ellipse cx="6" cy="40" rx="2.6" ry="1.6" transform="rotate(-30 6 40)"/>
            <ellipse cx="58" cy="52" rx="2.6" ry="1.6" transform="rotate(25 58 52)"/>
            <ellipse cx="9" cy="56" rx="2.6" ry="1.6" transform="rotate(15 9 56)"/>
            <ellipse cx="32" cy="7" rx="2.6" ry="1.6" transform="rotate(-10 32 7)"/>
          </g>
          <path d="M8 47 Q5 35 15 31 Q19 22 31 25 Q43 19 50 28 Q60 32 57 46 Q55 54 44 53 Q32 58 20 54 Q9 54 8 47 Z" ${st(RICE)}/>
          <g transform="rotate(-28 18 24)">
            <rect x="6" y="17" width="25" height="13" rx="5" ${st(SALMON, 3)}/>
            <path d="M11 20 Q14 23.5 11 27" ${ln(SALMON_STRIPE, 2)}/>
          </g>
          <rect x="38" y="11" width="16" height="15" rx="2" transform="rotate(22 46 18)" ${st(NORI, 3)}/>
          <path d="M44 46 Q50 40 57 45 Q58 53 50 54 Q44 53 44 46 Z" ${st(TUNA, 3)}/>
          <circle cx="13" cy="47" r="6" ${st(CUKE, 3)}/>
          <circle cx="13" cy="47" r="3" fill="#b5e3a2"/>
          <g ${ln('#e5ddcc', 1.8)}><path d="M26 29 l3 -1"/><path d="M38 51 l2 1"/></g>`,
        fx: 31, fy: 39, fs: 0.82,
      };
  }
}

function foodSvg(kind: Food, mood: Mood = 'happy') {
  const b = foodBody(kind);
  return wrap(64, 64, b.body + face(b.fx, b.fy, mood, b.fs, b.ink));
}

// ---------- Plates & belt ----------

const plateSvg = (rim: string) => wrap(64, 36, `
  <ellipse cx="32" cy="22" rx="25" ry="10.5" ${st('#dfe4ee', 3)}/>
  <ellipse cx="32" cy="18" rx="29" ry="13" ${st('#ffffff', 3)}/>
  <ellipse cx="32" cy="18" rx="21" ry="8" fill="none" stroke="${rim}" stroke-width="4.5"/>
  <ellipse cx="32" cy="18.5" rx="15" ry="5" fill="#f6f7fb"/>`);

const PLATE_RIMS: Record<Dish, string> = {
  salmonNigiri: '#ff8fb8',
  tunaNigiri: '#d39b1a',
  tamagoNigiri: '#ffe14a',
  ebiNigiri: '#ff8a3c',
  kappaMaki: '#5fbf5f',
};

// Wooden prep plate centered at (cx, cy).
function prepBody(cx: number, cy: number, rx: number, ry: number, t: number, sw = SW): string {
  return `
    <ellipse cx="${cx}" cy="${cy + t}" rx="${rx}" ry="${ry}" ${st('#b8743f', sw)}/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${st('#e2a768', sw)}/>
    <ellipse cx="${cx}" cy="${cy + ry * 0.04}" rx="${rx * 0.8}" ry="${ry * 0.74}" fill="#f0c086" stroke="#c98a52" stroke-width="${sw * 0.6}"/>
    <g ${ln('#cf9459', sw * 0.5)}>
      <path d="M${cx - rx * 0.88} ${cy - ry * 0.2} q${rx * 0.03} ${ry * 0.2} 0 ${ry * 0.4}"/>
      <path d="M${cx + rx * 0.88} ${cy - ry * 0.2} q${-rx * 0.03} ${ry * 0.2} 0 ${ry * 0.4}"/>
    </g>
    <ellipse cx="${cx - rx * 0.45}" cy="${cy - ry * 0.48}" rx="${rx * 0.14}" ry="${ry * 0.08}" fill="#fff" opacity="0.35"/>`;
}

const prepSvg = wrap(120, 80, prepBody(60, 37, 55, 31, 6));

// 128x64, tiles seamlessly left-right (everything repeats every 16 or 64 px).
const beltLaneSvg = (() => {
  const slats = Array.from({ length: 8 }, (_, i) => `<path d="M${8 + i * 16} 11 V53"/>`).join('');
  const bolts = Array.from({ length: 4 }, (_, i) =>
    `<circle cx="${16 + i * 32}" cy="5" r="1.8"/><circle cx="${16 + i * 32}" cy="59" r="1.8"/>`).join('');
  const chev = (x: number) => `<path d="M${x - 6} 21 L${x + 6} 32 L${x - 6} 43"/>`;
  return wrap(128, 64, `
    <rect x="0" y="0" width="128" height="64" fill="#4f5770"/>
    <g ${ln('#454c63', 2)}>${slats}</g>
    <rect x="0" y="0" width="128" height="10" fill="#394055"/>
    <rect x="0" y="54" width="128" height="10" fill="#394055"/>
    <rect x="0" y="1.5" width="128" height="2" fill="#56607a"/>
    <rect x="0" y="55.5" width="128" height="2" fill="#56607a"/>
    <g fill="#6f7a96">${bolts}</g>
    <g stroke="${OL}" stroke-width="${SW}"><path d="M0 10 H128"/><path d="M0 54 H128"/></g>
    <rect x="0" y="11.8" width="128" height="2.5" fill="#3f465b" opacity="0.6"/>
    <g ${ln('#b3bdd6', 5.5)}>${chev(32)}${chev(96)}</g>`);
})();

// ---------- Customers (80x80) ----------

const sweat = (x: number, y: number) => `
  <g transform="translate(${x} ${y})">
    <path d="M0 -8 Q6 -1 4.5 3.5 Q2.5 7.5 -1.5 7 Q-5.5 6 -5 1.5 Q-4 -3 0 -8 Z" fill="#7cc7ff" stroke="${OL}" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="-1.5" cy="2" rx="1.2" ry="2.2" fill="#fff" opacity="0.85"/>
  </g>`;

const steam = (x: number, y: number, flip = false) => `
  <g transform="translate(${x} ${y}) scale(${flip ? -0.85 : 0.85} 0.85)">
    <path d="M-8 4 Q-11 -1 -6 -3 Q-6 -9 0 -8 Q4 -12 8 -6 Q12 -3 9 2 Q8 6 2 5 Q-3 8 -8 4 Z" fill="#f4f1f1" stroke="${OL}" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="9" cy="10" r="2.6" fill="#f4f1f1" stroke="${OL}" stroke-width="1.8"/>
  </g>`;

const brows = (e: Expr, lx: number, rx: number, y: number, len = 9) => {
  if (e === 'happy') return '';
  const d = e === 'waiting' ? -3 : 4; // inner end offset (negative = raised)
  const h = len / 2;
  return `<g ${ln(OL, 2.8)}>
    <path d="M${lx - h} ${y} L${lx + h} ${y + d}"/>
    <path d="M${rx + h} ${y} L${rx - h} ${y + d}"/>
  </g>`;
};

const cheeksFor = (e: Expr, lx: number, rx: number, y: number) => {
  if (e === 'angry') {
    return `<ellipse cx="${lx}" cy="${y}" rx="5.5" ry="3.2" fill="${ANGRY_CHEEK}" opacity="0.85"/><ellipse cx="${rx}" cy="${y}" rx="5.5" ry="3.2" fill="${ANGRY_CHEEK}" opacity="0.85"/>`;
  }
  const o = e === 'happy' ? 0.7 : 0.4;
  return `<ellipse cx="${lx}" cy="${y}" rx="4" ry="2.4" fill="${BLUSH}" opacity="${o}"/><ellipse cx="${rx}" cy="${y}" rx="4" ry="2.4" fill="${BLUSH}" opacity="${o}"/>`;
};

const dotEyes = (lx: number, rx: number, y: number) => `
  <circle cx="${lx}" cy="${y}" r="3.2" fill="${OL}"/><circle cx="${rx}" cy="${y}" r="3.2" fill="${OL}"/>
  <circle cx="${lx + 1}" cy="${y - 1}" r="1" fill="#fff"/><circle cx="${rx + 1}" cy="${y - 1}" r="1" fill="#fff"/>`;

function shibaSvg(e: Expr) {
  const mouth = {
    happy: `<path d="M35 56 Q40 60 45 56" ${ln(OL, 2.4)}/>`,
    waiting: `<path d="M37 58 L43 58" ${ln(OL, 2.4)}/>`,
    angry: `<path d="M34 61 Q40 55 46 61" ${ln(OL, 2.4)}/>`,
  }[e];
  return wrap(80, 80, `
    ${e === 'angry' ? steam(10, 15) + steam(70, 15, true) : ''}
    <path d="M14 34 L18 8 L36 24 Z" ${st('#e48c3e')}/>
    <path d="M66 34 L62 8 L44 24 Z" ${st('#e48c3e')}/>
    <path d="M20 26 L21 15 L30 23 Z" fill="#fff0de"/><path d="M60 26 L59 15 L50 23 Z" fill="#fff0de"/>
    <ellipse cx="40" cy="45" rx="29" ry="25" ${st('#ec9a4f')}/>
    <path d="M15 52 Q20 70 40 70 Q60 70 65 52 Q56 44 40 50 Q24 44 15 52 Z" fill="#fff6ea"/>
    <ellipse cx="30" cy="33" rx="3.5" ry="2.2" fill="#fff6ea"/><ellipse cx="50" cy="33" rx="3.5" ry="2.2" fill="#fff6ea"/>
    ${brows(e, 30, 50, 34)}
    ${dotEyes(30, 50, 42)}
    <ellipse cx="40" cy="51" rx="4" ry="3" fill="${OL}"/>
    ${mouth}
    ${cheeksFor(e, 22, 58, 51)}
    <ellipse cx="40" cy="45" rx="29" ry="25" fill="none" stroke="${OL}" stroke-width="${SW}"/>
    ${e === 'waiting' ? sweat(67, 34) : ''}`);
}

function bunnySvg(e: Expr) {
  const mouth = {
    happy: `<path d="M36 60 Q40 63 44 60" ${ln(OL, 2.2)}/>`,
    waiting: `<path d="M37 61.5 L43 61.5" ${ln(OL, 2.2)}/>`,
    angry: `<path d="M35 63 Q40 59 45 63" ${ln(OL, 2.2)}/>`,
  }[e];
  return wrap(80, 80, `
    ${e === 'angry' ? steam(10, 33) + steam(70, 33, true) : ''}
    <ellipse cx="28" cy="19" rx="8" ry="16.5" ${st('#fbf5f1')}/>
    <ellipse cx="52" cy="19" rx="8" ry="16.5" ${st('#fbf5f1')}/>
    <ellipse cx="28" cy="19" rx="3.5" ry="11" fill="#ffc2d1"/><ellipse cx="52" cy="19" rx="3.5" ry="11" fill="#ffc2d1"/>
    <ellipse cx="40" cy="50" rx="26" ry="22" ${st('#fbf5f1')}/>
    ${brows(e, 31, 49, 40)}
    ${dotEyes(31, 49, 47)}
    <path d="M37 54 L43 54 L40 57 Z" fill="#ff8fa8" stroke="${OL}" stroke-width="1.6" stroke-linejoin="round"/>
    ${mouth}
    <g ${ln('#c8b9b4', 1.6)}><path d="M22 55 L12 53"/><path d="M22 58 L12 60"/><path d="M58 55 L68 53"/><path d="M58 58 L68 60"/></g>
    ${cheeksFor(e, 24, 56, 57)}
    ${e === 'waiting' ? sweat(65, 36) : ''}`);
}

function owlSvg(e: Expr) {
  // angry: heavy eyelids drooping toward the middle
  const lids = e === 'angry' ? `
    <defs>
      <clipPath id="owlEyeL"><circle cx="29" cy="40" r="7.5"/></clipPath>
      <clipPath id="owlEyeR"><circle cx="51" cy="40" r="7.5"/></clipPath>
    </defs>
    <path d="M18 28 L42 28 L42 42 L18 35 Z" fill="#efd6ae" clip-path="url(#owlEyeL)"/>
    <path d="M38 28 L62 28 L62 35 L38 42 Z" fill="#efd6ae" clip-path="url(#owlEyeR)"/>
    <path d="M21 35.5 L37 40.3" ${ln(OL, 2.4)} clip-path="url(#owlEyeL)"/>
    <path d="M59 35.5 L43 40.3" ${ln(OL, 2.4)} clip-path="url(#owlEyeR)"/>
    <circle cx="29" cy="40" r="7.5" fill="none" stroke="${OL}" stroke-width="2.5"/>
    <circle cx="51" cy="40" r="7.5" fill="none" stroke="${OL}" stroke-width="2.5"/>` : '';
  const browLines = {
    happy: `<path d="M25 30 L33 33" ${ln(OL, 2.6)}/>`,
    waiting: `<g ${ln(OL, 2.6)}><path d="M22 29 L32 26"/><path d="M58 27 L48 24"/></g>`,
    angry: `<g ${ln(OL, 2.8)}><path d="M21 25 L33 30"/><path d="M59 24 L47 29"/></g>`,
  }[e];
  const pupil = e === 'waiting' ? 3 : 3.6;
  const py = e === 'waiting' ? 39 : 41;
  return wrap(80, 80, `
    ${e === 'angry' ? steam(10, 13) + steam(70, 13, true) : ''}
    <path d="M16 22 L20 6 L32 18 Z" ${st('#8c5d3c')}/>
    <path d="M64 22 L60 6 L48 18 Z" ${st('#8c5d3c')}/>
    <ellipse cx="40" cy="44" rx="29" ry="28" ${st('#9c6b45')}/>
    <circle cx="29" cy="40" r="12" fill="#efd6ae"/><circle cx="51" cy="40" r="12" fill="#efd6ae"/>
    <circle cx="29" cy="40" r="7.5" ${st('#fff', 2.5)}/><circle cx="51" cy="40" r="7.5" ${st('#fff', 2.5)}/>
    <circle cx="30" cy="${py}" r="${pupil}" fill="${OL}"/><circle cx="52" cy="${py}" r="${pupil}" fill="${OL}"/>
    ${e === 'waiting' ? `<circle cx="31" cy="${py - 1.2}" r="1" fill="#fff"/><circle cx="53" cy="${py - 1.2}" r="1" fill="#fff"/>` : ''}
    ${lids}
    ${e === 'angry' ? cheeksFor(e, 19, 61, 53) : ''}
    <circle cx="51" cy="40" r="10.5" fill="none" stroke="#f1c232" stroke-width="2.8"/>
    <path d="M60 46 Q66 58 62 68" stroke="#f1c232" stroke-width="1.8" fill="none"/>
    ${browLines}
    <path d="M36 50 L44 50 L40 58 Z" ${st('#ffb02e', 2.4)}/>
    ${e === 'angry' ? `<path d="M35 64 Q40 60 45 64" ${ln(OL, 2.2)}/>` : ''}
    <g ${ln('#7e5233', 2)}>${e === 'angry' ? '<path d="M24 62 q3 3 6 0"/><path d="M50 62 q3 3 6 0"/>' : '<path d="M30 62 q3 3 6 0"/><path d="M44 62 q3 3 6 0"/>'}</g>
    ${e === 'waiting' ? sweat(15, 30) : ''}`);
}

const CUSTOMERS: Record<string, (e: Expr) => string> = { shiba: shibaSvg, bunny: bunnySvg, owl: owlSvg };
const EXPRS: Expr[] = ['happy', 'waiting', 'angry'];

// ---------- Furniture ----------

const stoolSvg = wrap(64, 40, `
  <rect x="14" y="20" width="6" height="17" rx="2" ${st('#a96d3b', 3)}/>
  <rect x="44" y="20" width="6" height="17" rx="2" ${st('#a96d3b', 3)}/>
  <rect x="29" y="20" width="6" height="14" rx="2" ${st('#8f5a2f', 3)}/>
  <rect x="8" y="17" width="48" height="7" rx="3" ${st('#c8894f', 3)}/>
  <path d="M8 11 Q8 19 32 19 Q56 19 56 11 L56 9 L8 9 Z" ${st('#d23a44', 3)}/>
  <ellipse cx="32" cy="9.5" rx="24" ry="7" ${st('#f0606a', 3)}/>
  <ellipse cx="24" cy="7.5" rx="7" ry="2.2" fill="#fff" opacity="0.4"/>
  <circle cx="32" cy="9.5" r="1.6" fill="#b02a33"/>`);

const BIN = '#8cc6e8';
const BIN_DARK = '#6aa7cf';
const BIN_LID = '#a6d6f2';

const binBody = `
  <path d="M18 44 L23 91 Q24 93 27 93 L69 93 Q72 93 73 91 L78 44 Z" ${st(BIN)}/>
  <g ${ln(BIN_DARK, 3)}><path d="M26 52 L28.5 86"/><path d="M70 52 L67.5 86"/></g>
  <rect x="28" y="88" width="40" height="3" rx="1.5" fill="${BIN_DARK}" opacity="0.6"/>`;

const binLid = `
  <rect x="38" y="25" width="20" height="11" rx="4" ${st(BIN_DARK, 3)}/>
  <rect x="11" y="34" width="74" height="12" rx="5" ${st(BIN_LID)}/>
  <rect x="17" y="36.5" width="18" height="3" rx="1.5" fill="#fff" opacity="0.55"/>`;

const trashSvg = wrap(96, 96, `
  ${binBody}
  ${binLid}
  ${face(48, 66, 'happy', 1.3)}`);

const trashOpenSvg = wrap(96, 96, `
  ${binBody}
  <ellipse cx="48" cy="44.5" rx="30" ry="5" fill="#3d4a5c" stroke="${OL}" stroke-width="3"/>
  <g transform="translate(-6 -16) rotate(-20 48 40)">${binLid}</g>
  <g ${ln(OL, 3.1)}><path d="M33 63 Q38 57 43 63"/><path d="M53 63 Q58 57 63 63"/></g>
  <path d="M41 70 Q48 70 55 70 Q55 81 48 81 Q41 81 41 70 Z" fill="#c9455a" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round"/>
  <ellipse cx="48" cy="77.5" rx="4" ry="2.2" fill="#ff8fa3"/>
  <ellipse cx="32.4" cy="71.2" rx="3.9" ry="2.3" fill="${BLUSH}" opacity="0.75"/>
  <ellipse cx="63.6" cy="71.2" rx="3.9" ry="2.3" fill="${BLUSH}" opacity="0.75"/>`);

// ---------- Emotes & decor ----------

const heartSvg = wrap(40, 40, `<path d="M20 34 C4 23 4 10 13 8 C17 7 20 10 20 13 C20 10 23 7 27 8 C36 10 36 23 20 34 Z" ${st('#ff5c86', 3)}/><ellipse cx="13" cy="15" rx="3" ry="2" fill="#fff" opacity="0.7"/>`);

const puffSvg = wrap(48, 40, `
  <path d="M10 30 Q2 30 4 22 Q2 12 12 13 Q14 4 24 7 Q32 2 37 10 Q46 10 44 20 Q48 30 38 30 Z" ${st('#d9dce4', 3)}/>
  <g stroke="#e0505a" stroke-width="3" fill="none" stroke-linecap="round"><path d="M18 16 l5 5 m0 -5 l-5 5"/><path d="M28 16 l5 5 m0 -5 l-5 5"/></g>`);

const coinSvg = wrap(32, 32, `<circle cx="16" cy="16" r="12.5" ${st('#ffcf3f', 3)}/><circle cx="16" cy="16" r="8" fill="none" stroke="#e6a817" stroke-width="2"/><rect x="13" y="13" width="6" height="6" rx="1" fill="${OL}"/>`);

const starSvg = (fill: string) => wrap(32, 32, `<path d="M16 3 L20 12 L29.5 12.5 L22 18.8 L24.6 28.5 L16 23 L7.4 28.5 L10 18.8 L2.5 12.5 L12 12 Z" ${st(fill, 2.6)}/>`);

const petalSvg = wrap(20, 20, `<path d="M10 2 Q18 6 15 14 Q12 19 10 15 Q8 19 5 14 Q2 6 10 2 Z" fill="#ffb7cd" stroke="#f08aaa" stroke-width="1.2"/>`);

const lanternSvg = wrap(40, 64, `
  <rect x="17" y="1" width="6" height="6" fill="${OL}"/>
  <rect x="11" y="6" width="18" height="5" rx="2" ${st('#2b2b2b', 2)}/>
  <ellipse cx="20" cy="32" rx="17" ry="21" ${st('#e8434b', 3)}/>
  <g stroke="#b02a33" stroke-width="1.8" fill="none"><path d="M5 26 Q20 30 35 26"/><path d="M4 34 Q20 38 36 34"/><path d="M6 42 Q20 46 34 42"/></g>
  <ellipse cx="13" cy="24" rx="3" ry="6" fill="#ff9a9f" opacity="0.6"/>
  <rect x="11" y="52" width="18" height="5" rx="2" ${st('#2b2b2b', 2)}/>
  <path d="M20 57 L20 63" stroke="#f1c232" stroke-width="3"/>`);

const norenSvg = wrap(180, 70, `
  <rect x="2" y="2" width="176" height="8" rx="4" ${st('#8b5a35', 3)}/>
  <path d="M8 10 H62 V64 Q35 68 8 64 Z" ${st('#2e3f7a', 3)}/>
  <path d="M63 10 H117 V64 Q90 68 63 64 Z" ${st('#2e3f7a', 3)}/>
  <path d="M118 10 H172 V64 Q145 68 118 64 Z" ${st('#2e3f7a', 3)}/>
  <circle cx="90" cy="36" r="13" fill="none" stroke="#fff" stroke-width="3"/>
  <path d="M84 36 Q90 28 96 36 Q90 44 84 36 Z" fill="#fff"/>`);

// ---------- Shop icons (64x64) ----------

const tileBase = (fill: string) => `<rect x="3" y="3" width="58" height="58" rx="11" ${st(fill)}/>`;

const shopPlateSvg = wrap(64, 64, `
  ${tileBase('#ffeedd')}
  ${prepBody(30, 38, 21, 12, 4, 3)}
  <circle cx="46" cy="19" r="9.5" ${st('#5fbf5f', 3)}/>
  <path d="M46 14 V24 M41 19 H51" ${ln('#fff', 3.6)}/>`);

const shopSlowSvg = wrap(64, 64, `
  ${tileBase('#e6f4ff')}
  <rect x="6" y="42" width="52" height="13" fill="#5d667c" stroke="${OL}" stroke-width="3"/>
  <g ${ln('#b3bdd6', 3)}><path d="M15 45 L20 48.5 L15 52"/><path d="M29 45 L34 48.5 L29 52"/><path d="M43 45 L48 48.5 L43 52"/></g>
  <g transform="translate(-3 0)">
  <path d="M48 23 L46 13" ${ln(OL, 2.2)}/><path d="M53 23 L56 13" ${ln(OL, 2.2)}/>
  <circle cx="46" cy="12.5" r="2.6" ${st('#ffe6a8', 2)}/><circle cx="56" cy="12.5" r="2.6" ${st('#ffe6a8', 2)}/>
  <path d="M10 42 Q10 35 18 35 L44 35 Q43 20 50 20 Q57 20 57 30 L57 39 Q57 42 54 42 Z" ${st('#ffe6a8', 3)}/>
  <circle cx="29" cy="26" r="12" ${st('#ff9fb3', 3)}/>
  <path d="M29 26 m0 -1.5 a1.5 1.5 0 0 1 1.5 1.5 a3.5 3.5 0 0 1 -6 2 a6 6 0 0 1 4.5 -9.5 a8.5 8.5 0 0 1 8.5 8.5" ${ln('#d9607e', 2.2)}/>
  <circle cx="48" cy="28" r="1.6" fill="${OL}"/><circle cx="54" cy="28" r="1.6" fill="${OL}"/>
  <path d="M49 32 Q51 34 53 32" ${ln(OL, 1.6)}/>
  <ellipse cx="46" cy="32" rx="1.8" ry="1.1" fill="${BLUSH}"/><ellipse cx="56" cy="32" rx="1.8" ry="1.1" fill="${BLUSH}"/>
  </g>`);

const furinSvg = wrap(64, 64, `
  ${tileBase('#e3f6ff')}
  <path d="M32 6 V14" stroke="${OL}" stroke-width="2.5"/>
  <path d="M16 34 Q16 14 32 14 Q48 14 48 34 Z" fill="#cdeeff" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M20 26 Q26 22 30 28 M36 22 Q40 20 44 26" stroke="#e8434b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M32 34 V42" stroke="${OL}" stroke-width="2"/>
  <path d="M26 42 H38 L36 58 H28 Z" fill="#fff6c8" stroke="${OL}" stroke-width="2.5" stroke-linejoin="round"/>`);

const nekoSvg = wrap(64, 64, `
  ${tileBase('#fff1d6')}
  <path d="M42 26 L46 8 L52 12 L50 28 Z" ${st('#ffffff', 3)}/>
  <path d="M18 22 L20 10 L28 18 Z" ${st('#ffffff', 3)}/>
  <path d="M46 22 L44 10 L36 18 Z" ${st('#ffffff', 3)}/>
  <ellipse cx="32" cy="42" rx="17" ry="16" ${st('#ffffff', 3)}/>
  <ellipse cx="32" cy="27" rx="15" ry="12" ${st('#ffffff', 3)}/>
  <path d="M24 26 q2 2 4 0 M36 26 q2 2 4 0" stroke="${OL}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M30 31 q2 2 4 0" stroke="${OL}" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M20 37 Q32 42 44 37" stroke="#e8434b" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle cx="32" cy="42" r="3.2" ${st('#ffd23f', 2)}/>
  <ellipse cx="22" cy="30" rx="2.6" ry="1.6" fill="${BLUSH}"/><ellipse cx="42" cy="30" rx="2.6" ry="1.6" fill="${BLUSH}"/>`);

// ---------- Registry ----------

export interface ArtEntry { key: string; svg: string; w: number; h: number; scale: number }

export function allArt(): ArtEntry[] {
  const out: ArtEntry[] = [];
  const add = (key: string, svg: string, w: number, h: number, scale = 2) => out.push({ key, svg, w, h, scale });

  for (const k of INGREDIENTS) add(`ing_${k}`, foodSvg(k), 64, 64);
  for (const k of DISHES) {
    add(`dish_${k}`, foodSvg(k), 64, 64);
    add(`plate_${k}`, plateSvg(PLATE_RIMS[k]), 64, 36);
  }
  add('dish_mess', foodSvg('mess', 'dizzy'), 64, 64);
  add('plate_belt', plateSvg('#9fb3cc'), 64, 36);
  add('plate_prep', prepSvg, 120, 80);
  add('belt_lane', beltLaneSvg, 128, 64);
  for (const c of Object.keys(CUSTOMERS)) {
    for (const e of EXPRS) add(`cust_${c}_${e}`, CUSTOMERS[c](e), 80, 80);
  }
  add('stool', stoolSvg, 64, 40);
  add('trash', trashSvg, 96, 96);
  add('trash_open', trashOpenSvg, 96, 96);
  add('heart', heartSvg, 40, 40);
  add('puff', puffSvg, 48, 40);
  add('coin', coinSvg, 32, 32);
  add('star_on', starSvg('#ffd23f'), 32, 32);
  add('star_off', starSvg('#e6dccf'), 32, 32);
  add('petal', petalSvg, 20, 20);
  add('lantern', lanternSvg, 40, 64);
  add('noren', norenSvg, 180, 70);
  add('shop_plate', shopPlateSvg, 64, 64);
  add('shop_slow', shopSlowSvg, 64, 64);
  add('shop_furin', furinSvg, 64, 64);
  add('shop_neko', nekoSvg, 64, 64);
  return out;
}
