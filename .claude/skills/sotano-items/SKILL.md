---
name: sotano-items
description: How to create, change or fix The Roots items (practices) and synergies so they are compatible with every other item, testable, and cannot break the game. Use it whenever you add or edit anything in src/content/items/, src/content/synergies.ts or src/items/, or add a stat/event items could use. Also use the sotano-docs and sotano-i18n skills.
---

# The Roots items skill

Items are **practices** the protagonist picks up. They change the game only through **stats** and **event hooks**, installed and removed by the inventory. Read `docs/architecture/ITEMS.md` (the contract) and the story and naming rules in `docs/design/built/story/README.md`; the practice catalogue is `docs/design/built/practices/README.md` (index) with one doc per practice in `built/practices/<path>/`. The catalogue itself is `src/content/items/index.ts`. Read these before you start.

## 1. Anatomy of an item (one file in `src/content/items/`)

```ts
export default defineItem({
  id: 'gratitude',                     // lowercase, unique, stable (saves refer to it)
  name: 'Gratitude Journal',           // a technique/concept or a public-domain work, never a trademark
  description: 'What the practice is about (its meaning, in the story voice).',
  effect: 'Luck +1.5: cleared rooms leave a reward more often.',   // plainly, with numbers
  inspiredBy: 'Gratitude journaling (positive psychology)',   // credit, required
  pools: { treasure: 1 },              // where it drops, with weights
  tags: ['emotion'],                   // at least one path: milagros | body | mind | emotion | will (items/validate.ts PATHS)
  color: pal('path.emotion.glow'),     // the primary path's glow token (tests/art-content.test.ts)
  quality: 1,                          // 0–4, Isaac-style; 4 = run-defining
  icon: { rows: [/* 12 strings of 12 */], palette: { a: pal('path.emotion.dark') } },
  stats: [{ stat: 'luck', layer: 'add', value: 1.5 }],
  hooks: [hook('doorOpen', (e, api) => { ... }, { id: 'unlock', priority: 20 })],
  onGain(api) { ... },                 // one-shot (heal, give keys); never re-run on rebuild/restore
});
```

Then add it to `src/content/items/index.ts`.

## 2. Rules (enforced by `src/items/validate.ts` and the tests)

1. **Prefer stats over hooks.** If a stat exists for it, use it; if a behaviour should be reusable by many items, add a stat in `core/stats.ts` (add it to `BASE_STATS` with a comment, its range in `STAT_LIMITS` (a 0/1 switch gets `[0, 1]`), its format in `STAT_FMT`, the `stat.<name>` label in every catalog, and make the game read it with `get('<name>')`: the contract test 'every stat is read by the game' fails otherwise). Example: carrying more blocks is `carry`, not a hook.
2. **Hooks only through `ItemApi`.** Never import `Game` or reach into systems. If you need a new verb, add it to `ItemApi` and implement it in `Game.makeApi()`.
3. **Every hook that defines the item gets an `id`**, so synergies can suppress it. Synergy hooks always have ids.
4. **Priority bands:** 0–99 modify, 100–199 cancel, 200+ side effects (never cancel there).
5. **No direct recursion.** Chain reactions use `api.defer(fn)`. Guard against triggering yourself by checking the event's `source` (e.g. Habit Stacking ignores breaks whose source is `'chain'`).
6. **Say which actors a hook is for.** Hooks on `actorDamage`, `contact` or `actorDeath` cover the player *and* every projection: pass `{ target: 'player' }` (or `'projection'`, `'any'`). Compare owners with `api.isPlayer(owner)`, never with raw ids. Damage and health are in points for every actor (8 = a heart, 2 = a quarter; the player loses exactly the points of each hit); `damage` hurts actors and `mining` breaks blocks: never derive one from the other.
7. **Deterministic.** Use `api.rng()` (each held copy has its own seeded stream), never `Math.random()`. Items change runtime outcomes only (drops, rewards, procs), never the run's structure.
8. **Persistent effects are stats.** Anything that must disappear when the item is lost (heart containers, reach…) is a stat modifier, not something done in `onGain`.
9. **Tags on cubes/intentions are exported constants** (`export const VOLATILE = 'volatile'`), never retyped strings.
10. **Exceptions between items live in `src/content/synergies.ts`** (add a synergy, `suppress` the item hook, install a replacement). Never patch one item to special-case another.
11. **Names:** generic technique names or public-domain works; modern books, courses and branded methods only in `inspiredBy`. No trademarks (Pomodoro®, GTD®, Wim Hof Method®, 7 Habits®…). Respectful tone.
12. **Two texts, always:** `description` is the meaning (philosophical, the story's voice); `effect` says plainly what it does and its impact on the run, with numbers. The player must never have to guess what an item does.
13. **Icon:** 12×12, every non-`.` key in the palette, palette tokens only (`pal(...)`), at most 4 colours, never `life.*` or `cold.*`, `light.*` only for light concepts, silhouette IoU below 0.8 with every other icon (`tests/art-content.test.ts`). The icon is made by the Opus art agent and passes the `sotano-art` gate (`?gallery`).
14. **Every practice has a recipe.** Once the crafting table is resolved (issue #112), every practice must have a recipe the crafting table can use: inputs are monster parts, potions and blocks (food is never an input, it cannot be carried in hand). The higher the tier, the harder the recipe: higher tiers need potions, or several potions. A new practice is not finished until its recipe exists and a test checks it. Recipes respect the per-floor craft cap (1 practice on floor 1, up to 5 on floor 5). Until issue #112 is resolved, the PR states "no recipe yet" and refs #112; `tests/recipes.test.ts` is where the recipe test goes.
15. **Every practice has a positive outcome.** Every practice always has a positive or healing outcome, especially in special cases. State it in the design (docs/design/not-built/practices/) before the item is built, and say it in the `effect` line when it is a special case. A practice that only punishes or only costs is not accepted. Test the positive case in the sandbox (positive polarity is the default): a positive seed or a positive intention must visibly help.
16. **Fire is emitted once per intention, not per click.** Today that means a normal cast, each intention a Kairos release fires (one per mark), and the beam (`WeaponHost.shot`). A cancel gives the charge back. A `fire` hook must be correct for any of them: no counters that assume one fire per press, no reading the input. Two items writing the same intention field (`homing`, `homingTarget`) must say who wins: last gained writes last. Assign, do not `Math.max`, and document it.
17. **Shared paths.** Changing which events a weapon, element or core path emits is a shared-behaviour change. List every item and synergy hooked on that event (grep `hook('<event>'`). Re-run `npm run sandbox -- --check`, and remove or rewrite any synergy that would now double-count, in the same change. The designer decides this before implementation.
18. **States of being.** Three practices with the same path tag make a state of being: a tag-count synergy (`requires: [{ tag, count: 3 }]`) in `src/content/synergies.ts`, documented in `docs/design/built/practices/states-of-being/README.md`. A new path needs its state. A state that changes intentions does it with a `fire` hook with an id (the Transcendent aura sets `absorb` on positive intentions only; `Intents` reads it). Adding a path tag to a practice changes which states it counts toward: say so in its `effect` line.
19. **Seeds.** Adding a practice to a pool, or changing its pool weights, changes the pedestal reservations and so the golden hash. `GEN_VERSION` (`src/core/seed.ts`) is bumped by hand only when a release changes generation, not per item. Within an iteration, the `rng` and `roots-easy` pins (`tests/rng.test.ts`, `tests/roots-easy.test.ts`) are re-recorded once, by the orchestrator, in the last commit before the PR. Never per item, and never by an implementing agent. Note the pool change in the version line of `docs/architecture/RNG.md`.

## 3. Safety layers (don't remove them; extend them)

| Layer | Where | Catches |
|---|---|---|
| 1. Static validation | `items/validate.ts`, run at startup and in tests | Bad ids, missing credit/path/icon, unknown stats, non-finite values, bad suppressions, impossible requirements |
| 2. Runtime guards | `core/events.ts`, `core/stats.ts` | A throwing hook is logged and skipped; slow hooks are reported; nested emits capped; deferred queue capped; NaN/Infinity stats fall back to base |
| 3. Synergy matrix | `tests/synergy-matrix.test.ts` | Every item alone and every pair, every event fired with sample payloads: no errors, finite stats within limits, chain reactions settle. `SAMPLES` is a typed map over `keyof GameEvents`, so a sample for a new event fails the typecheck; the sample should exercise the new event's new fields (for example `absorb` on an intention). |
| 4. Inventory invariants | `tests/items.test.ts` | Gain then lose leaves no residue; serialize/restore is identical; `onGain` runs once |
| 5. Contract | `tests/items.test.ts` "contract" | Every event has an emit site; every stat is read by the game |
| 6. Sandbox lab | `src/sandbox/scenarios/`, `npm run sandbox -- --check` | The real game, scripted and deterministic: what the item actually does in water, lava, fire, among crates, against projections, with the items it touches; any change in any other scenario shows as a diff ([SANDBOX.md](../../../docs/architecture/SANDBOX.md)). A scenario passes only if its report shows the practice's effect as events (for example `actorDamage`, `heal`, `intentHit`). A report where nothing happens is a bug, not a pass. The sandbox has a single room: hooks on `floorEnter` or `roomEnter` must tolerate a missing floor plan. |

When you add an **event**, add a sample payload to `SAMPLES` in the synergy matrix (TypeScript forces it) and add it to the contract list. When you add a **stat**, add limits, its format in `STAT_FMT` and its `stat.<name>` label in every catalog (`sotano-i18n` skill).

## 4. Checklist for a new item

- [ ] File + index entry; passes `validateItem`.
- [ ] Name/credit follow the story and naming rules in `docs/design/built/story/README.md`, and the source is in `docs/lore/SOURCES.md` (sotano-lore skill); ask the owner if the practice or its meaning is unclear.
- [ ] `effect` line is clear, complete and has the real numbers.
- [ ] Translated in every catalog in `src/i18n/locales/` (name, description, effect, `inspiredBy`, `messages`), with the same numbers, and its teaching written in every catalog (`teach.<id>.quote`, `teach.<id>.lesson`: an original phrase or a short paraphrase of a public-domain idea, never a quote put in a real person's mouth; issue #202); text it shows uses `messages` + `api.toast(id)`, own damage labels go in `causes` (`sotano-i18n` skill).
- [ ] Uses stats where possible; hooks have ids and correct priorities.
- [ ] Visual: icon passes `tests/art-content.test.ts` and is reviewed in `?gallery`. Pickup, banner and Tab are checked in the browser, or, if pointer lock prevents it, the PR lists it under Not verified and the art gate stays open.
- [ ] `npm test` green (matrix included). If it interacts with another item in a special way, add a synergy and a test for it.
- [ ] Sandbox: a scenario per environment and item it may meet (`src/sandbox/scenarios/<item>-<case>.json`), its report read and saved (`npm run sandbox -- --all`); `npm run sandbox -- --check` shows no other scenario moved, or every move is explained.
- [ ] Docs: write the practice's design in `docs/design/not-built/practices/` before building (rule 15). When the code is merged, the doc keeps a "Status: built in code, waits for the owner's acceptance" line and stays in not-built. Only after the owner accepts does it move to `built/practices/<path>/` with a row in the index (`sotano-design` skill). `ITEMS.md` if you added a stat, event or API verb.
- [ ] Positive or healing outcome stated in the design, including its special cases (rule 15).
- [ ] Recipe defined for the crafting table, tier-appropriate, with a test (rule 14), once issue #112 is resolved.
- [ ] Stat added: `BASE_STATS`, `STAT_LIMITS`, `STAT_FMT`, `stat.<name>` in every catalog, read by the game (contract test).
- [ ] Event added: `GameEvents` doc comment, an emit site, `SAMPLES` in the synergy matrix, the contract test's `eventNames`, `ITEMS.md`.
- [ ] Pool change noted for the iteration's single pin re-record (rule 19).
- [ ] Path tags checked against the states of being (rule 18).
