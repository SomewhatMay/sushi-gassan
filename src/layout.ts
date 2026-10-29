// Screen layout (1280x720).
export const W = 1280;
export const H = 720;
export const TOP = 52; // HUD bar height

// Three lanes stacked under the HUD: a strip of seats above each belt.
export const LANE_TOP = 58;
export const LANE_H = 158;
export const SEAT_H = 94;
export const BELT_H = 64;
export const SEAT_X = [170, 560, 950];
export const LANE_DIRS = [1, -1, 1];

export const laneTop = (i: number) => LANE_TOP + i * LANE_H;
export const beltY = (i: number) => laneTop(i) + SEAT_H + BELT_H / 2;
export const seatY = (i: number) => laneTop(i) + 44;

// Bottom counter: prep plates, menu card, trash.
export const COUNTER_Y = LANE_TOP + 3 * LANE_H;
export const PREP_Y = 632;
export const PREP_X = [100, 270, 440, 610];
export const PREP_HIT = { w: 164, h: 150 };
export const MENU = { x: 712, y: COUNTER_Y + 12, w: 400, h: H - COUNTER_Y - 22 };
export const TRASH = { x: 1196, y: 628, r: 80 };

// Texture art is rasterized at 2x.
export const NATIVE = 0.5;

export const DEPTH = { floor: 0, belt: 10, beltItem: 20, customer: 40, prep: 50, ui: 100, held: 300, modal: 500 };
