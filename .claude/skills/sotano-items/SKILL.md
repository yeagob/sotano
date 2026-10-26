---
name: sotano-items
description: How to create, change or fix SÓTANO items (practices) and synergies so they are compatible with every other item, testable, and cannot break the game. Use it whenever you add or edit anything in src/content/items/, src/content/synergies.ts or src/items/, or add a stat/event items could use. Also use the sotano-docs skill.
---

# SÓTANO items skill

Items are **practices** the protagonist picks up. They change the game only through **stats** and **event hooks**, installed and removed by the inventory. Read `docs/architecture/ITEMS.md` (the contract) and `docs/design/STORY.md` §5 (naming) before you start.

## 1. Anatomy of an item (one file in `src/content/items/`)

```ts
export default defineItem({
  id: 'gratitude',                     // lowercase, unique, stable (saves refer to it)
  name: 'Gratitude Journal',           // a technique/concept or a public-domain work, never a trademark
  description: 'What the practice is about (its meaning, in the story voice).',
  effect: 'Luck +1.5: cleared rooms leave a reward more often.',   // plainly, with numbers
  inspiredBy: 'Gratitude journaling (positive psychology)',   // credit, required
  pools: { treasure: 1 },              // where it drops, with weights
  tags: ['emotion'],                   // at least one path: body | mind | emotion | will
  color: 0xe05d5d,                     // glow and accents
  quality: 1,                          // 0–4, Isaac-style; 4 = run-defining
  icon: { rows: [/* 12 strings of 12 */], palette: { a: 0x7a4a2a } },
  stats: [{ stat: 'luck', layer: 'add', value: 1.5 }],
  hooks: [hook('doorOpen', (e, api) => { ... }, { id: 'unlock', priority: 20 })],
  onGain(api) { ... },                 // one-shot (heal, give keys); never re-run on rebuild/restore
});
```

Then add it to `src/content/items/index.ts`.

## 2. Rules (enforced by `src/items/validate.ts` and the tests)

1. **Prefer stats over hooks.** If a stat exists for it, use it; if a behaviour should be reusable by many items, add a stat in `core/stats.ts` (with limits and `STAT_INFO`) and make the core read it. Example: carrying more blocks is `carry`, not a hook.
2. **Hooks only through `ItemApi`.** Never import `Game` or reach into systems. If you need a new verb, add it to `ItemApi` and implement it in `Game.makeApi()`.
3. **Every hook that defines the item gets an `id`**, so synergies can suppress it. Synergy hooks always have ids.
4. **Priority bands:** 0–99 modify, 100–199 cancel, 200+ side effects (never cancel there).
5. **No direct recursion.** Chain reactions use `api.defer(fn)`. Guard against triggering yourself by checking the event's `source` (e.g. Habit Stacking ignores breaks whose source is `'chain'`).
6. **Deterministic.** Use `api.rng()`, never `Math.random()`.
7. **Persistent effects are stats.** Anything that must disappear when the item is lost (heart containers, reach…) is a stat modifier, not something done in `onGain`.
8. **Tags on cubes/intentions are exported constants** (`export const VOLATILE = 'volatile'`), never retyped strings.
9. **Exceptions between items live in `src/content/synergies.ts`** (add a synergy, `suppress` the item hook, install a replacement). Never patch one item to special-case another.
10. **Names:** generic technique names or public-domain works; modern books, courses and branded methods only in `inspiredBy`. No trademarks (Pomodoro®, GTD®, Wim Hof Method®, 7 Habits®…). Respectful tone.
11. **Two texts, always:** `description` is the meaning (philosophical, the story's voice); `effect` says plainly what it does and its impact on the run, with numbers. The player must never have to guess what an item does.
12. **Icon:** 12×12, every non-`.` key in the palette, readable at 24 px (high contrast, clear silhouette). The renderer adds an outline.

## 3. Safety layers (don't remove them; extend them)

| Layer | Where | Catches |
|---|---|---|
| 1. Static validation | `items/validate.ts`, run at startup and in tests | Bad ids, missing credit/path/icon, unknown stats, non-finite values, bad suppressions, impossible requirements |
| 2. Runtime guards | `core/events.ts`, `core/stats.ts` | A throwing hook is logged and skipped; slow hooks are reported; nested emits capped; deferred queue capped; NaN/Infinity stats fall back to base |
| 3. Synergy matrix | `tests/synergy-matrix.test.ts` | Every item alone and every pair, every event fired with sample payloads: no errors, finite stats within limits, chain reactions settle |
| 4. Inventory invariants | `tests/items.test.ts` | Gain then lose leaves no residue; serialize/restore is identical; `onGain` runs once |
| 5. Contract | `tests/items.test.ts` "contract" | Every event has an emit site; every stat is read by the game |

When you add an **event**, add a sample payload to `SAMPLES` in the synergy matrix (TypeScript forces it) and add it to the contract list. When you add a **stat**, add limits and `STAT_INFO`.

## 4. Checklist for a new item

- [ ] File + index entry; passes `validateItem`.
- [ ] Name/credit follow STORY.md §5 and the source is in `docs/lore/SOURCES.md` (sotano-lore skill); ask the owner if the practice or its meaning is unclear.
- [ ] `effect` line is clear, complete and has the real numbers.
- [ ] Uses stats where possible; hooks have ids and correct priorities.
- [ ] Icon reviewed in the browser (pedestal, banner, inventory window).
- [ ] `npm test` green (matrix included). If it interacts with another item in a special way, add a synergy and a test for it.
- [ ] Docs: STORY.md §5 catalogue row; ITEMS.md if you added a stat/event/API verb; README items table.
- [ ] Browser check: pick it up, read the banner, open Tab, see the effect.
