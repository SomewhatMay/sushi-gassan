// What rides a belt or sits in your hand: a single ingredient, or a plate from a prep slot.
import Phaser from 'phaser';
import type { DishKind, Ingredient } from '../data';
import { NATIVE } from '../layout';

export type Payload =
  | { t: 'ing'; ing: Ingredient }
  | { t: 'plate'; ings: Ingredient[]; dish: DishKind | 'mess' | null };

export const dishOf = (p: Payload) => (p.t === 'plate' ? p.dish : null);

// Kaiten plate with its food on top, centered on the plate.
export function plateVisual(scene: Phaser.Scene, p: Payload): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const dish = dishOf(p);
  const rim = dish && dish !== 'mess' ? `plate_${dish}` : 'plate_belt';
  c.add(scene.add.image(0, 8, rim).setScale(NATIVE));
  if (p.t === 'ing') {
    c.add(scene.add.image(0, -6, `ing_${p.ing}`).setScale(NATIVE * 0.8));
  } else if (dish) {
    c.add(scene.add.image(0, -6, `dish_${dish}`).setScale(NATIVE * 0.85));
  } else {
    p.ings.forEach((ing, i) => {
      const x = (i - (p.ings.length - 1) / 2) * 20;
      c.add(scene.add.image(x, -2, `ing_${ing}`).setScale(NATIVE * 0.5));
    });
  }
  return c;
}
