# すし合戦 Sushi Gassen — v2 design

Kids 10–15. Cute cartoon art (chunky dark outlines `#3a2420`, flat candy colors, little faces on food). Japanese theme.
**Every Japanese label is paired with English, English first and larger** (e.g. "Salmon nigiri" big, "さけにぎり" small beneath/after).

## Core loop

Screen 1280×720 (Phaser 4, Vite, TS). Mouse/touch drag only. Space = pause.

```
HUD: season/day · timer · ¥ · ★★★☆☆
┌ lane 1 ─ seats: [🐶 order] [🐰 order] [🦉 order] ─────────────┐
│ belt 1  →  →  ingredient plates & finished dishes ride by  →   │
├ lane 2 ─ seats ───────────────────────────────────────────────┤
│ belt 2  ←  ←                                                ←  │
├ lane 3 ─ seats ───────────────────────────────────────────────┤
│ belt 3  →  →                                                →  │
└───────────────────────────────────────────────────────────────┘
[prep plate 1] [prep plate 2] [prep plate 3]   [menu card]  [🗑 trash]
```

- **Lanes**: 3 horizontal lanes. Each lane = a strip of 3 customer seats directly above its belt. Belt directions alternate (→ ← →). Day 1 uses only lanes 1–2.
- **Belts** carry ingredient plates that spawn at the entry edge at intervals and fly to the far edge, then vanish. Mix is weighted toward what that lane's waiting customers ordered, plus random others from today's ingredient pool. Belts never stop.
- **Grab**: press on an ingredient on a belt → it lifts off and follows the pointer. Drop on a prep plate → added. Drop on trash or anywhere else → poof, gone.
- **Prep plates** (3, bottom): contents are a set; order doesn't matter. When the set exactly equals a recipe on today's menu, the plate pops into that dish. If the set isn't a subset of any menu recipe, it becomes a **mess** plate (dizzy jumble). Recipes are designed so no recipe is a subset of another.
- **Serve**: drag a finished dish from a prep slot and drop it onto a belt lane → it rides that belt (unfinished/mess plates bounce back with a hint). Dropping within ~110px of a waiting customer who ordered it hands it straight over; otherwise when it passes a matching customer in that lane (within ~30px of seat x), they grab it. Unclaimed dishes reaching the end wrap to the lane's start (kaiten style) — up to 2 wraps, then poof.
- **Trash**: drag a prep plate (mess or unwanted) onto the trash → cleared. Prep slot instantly gets a fresh empty plate.
- **Customers**: arrive at a free seat, show an order bubble (dish icon + English name + kana) and a patience bar. Face changes as patience drops: `happy` → `waiting` (>50% → 25–50%) → `angry` (<25%). Pay = dish price × type multiplier × (0.6 + 0.6 × patience fraction) — fast service tips more. Timeout → angry puff, leaves, stars −0.35. Served fast → stars +0.15 (critic: +0.4 if >50% patience left, −0.2 if <25%).
- **Customer types**: Shiba (regular), Bunny (short patience, pays ×1.3), Critic Owl (normal patience, pays ×1.5, big star swings).
- **Day**: timed shift (90–150s). Intro modal → Start. Stars start at 3 each day; hitting 0 → "Try again" replays the day (no game over). End → Results (hanko stamp graded on served/missed + stars: 花丸 Amazing / 良 Good job / 可 Okay / 練 Keep practicing if nobody was served) → Shop → next day. Spring = 3 days, then "Spring complete!".
- No spoilage, no junk — belts carry only good ingredients.

## Ingredients & recipes

| key | English | kana |
|---|---|---|
| rice | Rice | ごはん |
| nori | Seaweed | のり |
| salmon | Salmon | さけ |
| tuna | Tuna | まぐろ |
| cucumber | Cucumber | きゅうり |
| tamago | Egg | たまご |
| ebi | Shrimp | えび |

| dish key | English | kana | set | price |
|---|---|---|---|---|
| salmonNigiri | Salmon nigiri | さけにぎり | rice+salmon | 120 |
| tunaNigiri | Tuna nigiri | まぐろにぎり | rice+tuna | 150 |
| tamagoNigiri | Egg nigiri | たまごにぎり | rice+tamago | 100 |
| ebiNigiri | Shrimp nigiri | えびにぎり | rice+ebi | 140 |
| kappaMaki | Cucumber roll | かっぱまき | rice+nori+cucumber | 110 |

Days: D1 lanes 1–2, menu salmon+tuna nigiri, slow belts. D2 3 lanes, + kappaMaki, + bunny. D3 + tamago/ebi nigiri, + owl, faster belts.

Shop (between days): Extra prep plate (4th slot, once), Slow belts −15% (once), Wind chime patience +30% (once), Lucky cat +25% yen (once).

## Art contract (texture keys, all in `src/art/svg.ts` → `allArt()`)

Art is rasterized at 2× (`scale: 2`), so display with `setScale(0.5)` for native size.

| key | size (viewBox) | notes |
|---|---|---|
| `ing_<ingredient>` | 64×64 | 7 ingredients above, happy face |
| `dish_<dish>` | 64×64 | 5 dishes above, happy face |
| `dish_mess` | 64×64 | messy jumble, dizzy swirl eyes |
| `plate_belt` | 64×36 | small white kaiten plate (ingredients ride on it) |
| `plate_<dish>` | 64×36 | colored-rim kaiten plate per dish |
| `plate_prep` | 120×80 | big wooden prep board / plate, top-ish view |
| `belt_lane` | 128×64 | horizontally tileable belt segment with chevrons pointing right |
| `cust_<shiba\|bunny\|owl>_<happy\|waiting\|angry>` | 80×80 | 9 heads; waiting = worried/sweat drop, angry = red cheeks, frown, steam |
| `stool` | 64×40 | red cushion stool, sits under each seat |
| `trash` / `trash_open` | 96×96 | big cute bin; open variant lid tilted |
| `heart`, `puff`, `coin`, `star_on`, `star_off`, `petal`, `lantern`, `noren` | existing | keep |
| `shop_plate`, `shop_slow`, `shop_furin`, `shop_neko` | 64×64 | shop icons (slow = snail on belt) |
