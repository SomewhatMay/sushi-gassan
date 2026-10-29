// Static game data: ingredients, dishes, customers, days, shop.

export type Ingredient = 'rice' | 'nori' | 'salmon' | 'tuna' | 'cucumber' | 'tamago' | 'ebi';
export type DishKind = 'salmonNigiri' | 'tunaNigiri' | 'tamagoNigiri' | 'ebiNigiri' | 'kappaMaki';
export type CustomerKind = 'shiba' | 'bunny' | 'owl';
export type Face = 'happy' | 'waiting' | 'angry';

export interface Label {
  name: string;
  kana: string;
}

export const INGREDIENTS: Record<Ingredient, Label> = {
  rice: { name: 'Rice', kana: 'ごはん' },
  nori: { name: 'Seaweed', kana: 'のり' },
  salmon: { name: 'Salmon', kana: 'さけ' },
  tuna: { name: 'Tuna', kana: 'まぐろ' },
  cucumber: { name: 'Cucumber', kana: 'きゅうり' },
  tamago: { name: 'Egg', kana: 'たまご' },
  ebi: { name: 'Shrimp', kana: 'えび' },
};

export interface DishDef extends Label {
  set: Ingredient[];
  price: number;
}

// No recipe set is a subset of another, so a plate can only ever complete one dish.
export const DISHES: Record<DishKind, DishDef> = {
  salmonNigiri: { name: 'Salmon nigiri', kana: 'さけにぎり', set: ['rice', 'salmon'], price: 120 },
  tunaNigiri: { name: 'Tuna nigiri', kana: 'まぐろにぎり', set: ['rice', 'tuna'], price: 150 },
  tamagoNigiri: { name: 'Egg nigiri', kana: 'たまごにぎり', set: ['rice', 'tamago'], price: 100 },
  ebiNigiri: { name: 'Shrimp nigiri', kana: 'えびにぎり', set: ['rice', 'ebi'], price: 140 },
  kappaMaki: { name: 'Cucumber roll', kana: 'かっぱまき', set: ['rice', 'nori', 'cucumber'], price: 110 },
};

export const MESS: Label = { name: 'Mess', kana: 'ぐちゃぐちゃ' };

export interface CustomerDef extends Label {
  patience: number; // seconds
  payMul: number;
  critic: boolean;
}

export const CUSTOMERS: Record<CustomerKind, CustomerDef> = {
  shiba: { name: 'Shiba', kana: 'しば', patience: 55, payMul: 1, critic: false },
  bunny: { name: 'Bunny', kana: 'うさぎ', patience: 36, payMul: 1.3, critic: false },
  owl: { name: 'Critic Owl', kana: 'ふくろう', patience: 50, payMul: 1.5, critic: true },
};

export interface DayDef {
  season: string;
  seasonKana: string;
  lanes: number; // active lanes, from the top
  beltSpeed: number; // px per second
  ingSpawn: [number, number]; // seconds between ingredient plates, per lane
  custSpawn: [number, number]; // seconds between customers
  menu: DishKind[];
  customers: Partial<Record<CustomerKind, number>>; // spawn weights
  duration: number;
  intro: string;
}

export const DAYS: DayDef[] = [
  {
    season: 'Spring', seasonKana: 'はる',
    lanes: 2, beltSpeed: 65, ingSpawn: [1.7, 2.4], custSpawn: [6.5, 9.5],
    menu: ['salmonNigiri', 'tunaNigiri'],
    customers: { shiba: 1 },
    duration: 120,
    intro: 'Grab rice and fish off the belts, build sushi on a prep plate, then drop it on the belt in front of the hungry customer!',
  },
  {
    season: 'Spring', seasonKana: 'はる',
    lanes: 3, beltSpeed: 75, ingSpawn: [1.5, 2.1], custSpawn: [5.5, 8],
    menu: ['salmonNigiri', 'tunaNigiri', 'kappaMaki'],
    customers: { shiba: 3, bunny: 1 },
    duration: 135,
    intro: 'A third lane opens and cucumber rolls join the menu. Bunnies are in a hurry, but they tip well!',
  },
  {
    season: 'Spring', seasonKana: 'はる',
    lanes: 3, beltSpeed: 90, ingSpawn: [1.2, 1.8], custSpawn: [4.6, 6.8],
    menu: ['salmonNigiri', 'tunaNigiri', 'kappaMaki', 'tamagoNigiri', 'ebiNigiri'],
    customers: { shiba: 3, bunny: 2, owl: 1 },
    duration: 150,
    intro: 'Egg and shrimp nigiri are here, and the belts run faster. The Critic Owl loves quick service!',
  },
];

export type UpgradeId = 'plate' | 'slow' | 'furin' | 'neko';

export interface ShopDef extends Label {
  id: UpgradeId;
  desc: string;
  price: number;
  icon: string;
}

export const SHOP: ShopDef[] = [
  { id: 'plate', name: 'Extra prep plate', kana: 'おさら', desc: 'A 4th prep plate to build on', price: 1000, icon: 'shop_plate' },
  { id: 'slow', name: 'Slow belts', kana: 'ゆっくりベルト', desc: 'Belts move 15% slower', price: 800, icon: 'shop_slow' },
  { id: 'furin', name: 'Wind chime', kana: 'ふうりん', desc: 'Customers wait 30% longer', price: 900, icon: 'shop_furin' },
  { id: 'neko', name: 'Lucky cat', kana: 'まねきねこ', desc: 'Earn 25% more yen', price: 1200, icon: 'shop_neko' },
];

// Tuning
export const START_STARS = 3;
export const PREP_SLOTS = 3;
export const SERVE_RANGE = 30; // px from seat x where a customer grabs a dish
export const MAX_WRAPS = 2;
export const NEED_BIAS = 0.6; // chance a belt spawns something its lane's customers need

// Ingredients needed for a day's menu.
export function poolFor(menu: DishKind[]): Ingredient[] {
  return [...new Set(menu.flatMap((d) => DISHES[d].set))];
}

// Dish whose set exactly matches, 'mess' if no menu dish can still be made, else null (keep building).
export function evaluate(ings: Ingredient[], menu: DishKind[]): DishKind | 'mess' | null {
  const has = new Set(ings);
  const fits = (d: DishKind) => ings.every((i) => DISHES[d].set.includes(i));
  const exact = menu.find((d) => DISHES[d].set.length === has.size && fits(d));
  if (exact) return exact;
  return menu.some(fits) ? null : 'mess';
}
