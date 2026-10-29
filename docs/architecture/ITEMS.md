# Items, synergies and exceptions

How items are defined, stored and installed, and how they can affect anything (and be affected by anything). This is the most important architectural piece of The Roots: the whole game is meant to be "everything can modify everything".

This design went through a three-party review (engineer, architect, mediator); the critique, the ruling and what changed are in [reviews/items-architecture.md](../reviews/items-architecture.md).

Code: [`src/items/`](../src/items) (the machinery), [`src/content/items/`](../src/content/items) (one file per item), [`src/content/synergies.ts`](../src/content/synergies.ts) (combinations and exceptions), [`src/game/events.ts`](../src/game/events.ts) (every place an item can step in).

## 1. The model in one paragraph

An item is **data plus effects**. Effects come in exactly two kinds: **stat modifiers** (layered and recomputed from scratch) and **hooks** on game events (functions that mutate or cancel an event's payload), plus an optional one-shot `onGain`. The game never asks "does the player have item X?"; it emits events and reads stats, and items change what those events and stats contain. Combinations that need special handling are **synergies**: effects that switch on when a set of items is held, and that can **suppress** an individual hook of an item to replace its behaviour. The inventory rebuilds every effect it owns from scratch whenever its contents change.

## 2. Defining an item

```ts
// src/content/items/catharsis.ts
export const VOLATILE = 'volatile';      // cube tag, exported so others don't mistype it

export default defineItem({
  id: 'catharsis',                       // stable id: saves and synergies refer to it
  name: 'Symbolic Act',
  description: 'A symbolic act reaches what words cannot: blocks you throw burst on impact.', // meaning
  effect: 'Blocks you throw explode when they hit something (radius 1.8, can hurt you). Throw strength ×1.3.', // plainly
  inspiredBy: 'Psychomagic (Alejandro Jodorowsky); catharsis in psychodrama', // credit, required
  pools: { treasure: 1 },                // where it can drop, with a weight in each
  tags: ['emotion', 'blocks', 'explosive'], // a path (body/mind/emotion/will) + mechanics
  color: 0xff5a1f,                       // glow and accents
  quality: 3,                            // 0–4, Isaac-style; shown as stars
  icon: { rows: [/* 12 × 12 */], palette: { a: 0xff5a1f, b: 0xffb347, c: 0xfff3c4 } },
  causes: ['volatile'],                  // damage sources it uses besides its id (death screen)
  stats: [{ stat: 'throw', layer: 'mul', value: 1.3 }],
  hooks: [
    hook('throw', e => { e.tags.add(VOLATILE); }, { id: 'arm' }),
    hook('debrisImpact', (e, api) => {
      if (e.tags.has(VOLATILE)) api.explode(e.x, e.y, e.z, 1.8, 14, 'volatile');
    }, { id: 'explode' }),
  ],
  // messages: { lock: '…' },           // text it shows with api.toast('lock'), in English
  // onGain(api) { ... }                 // optional one-shot effect on pickup
});
```

Then list it in `src/content/items/index.ts`, and translate `name`, `description`, `effect` (and `inspiredBy`, `messages` if any) in every non-English catalog in `src/i18n/locales/` ([LOCALIZATION.md](LOCALIZATION.md) §5; `tests/i18n.test.ts` lists what is missing, and checks the translated `effect` keeps the same numbers). The full checklist is the project skill [`sotano-items`](../../.claude/skills/sotano-items/SKILL.md).

- `hook(event, fn, { id?, priority? })` is typed: the payload type comes from the event name. Give an `id` to every hook that defines the item's identity, so synergies can target it.
- Hooks get the event context (mutable fields + `cancel()`) and an `ItemApi` facade:

| `ItemApi` | Does |
|---|---|
| `stats()`, `held()` | Read current stats and the blocks in your hand |
| `has(id)`, `hasTag(tag)` | Ask about other held items |
| `pulse`, `arc`, `igniteArea` | Area effects: damage and shove every projection around a point, a bolt between a point and a projection (through its polarity), fire on flammable blocks |
| `nearestProjection`, `actorAt`, `shove`, `freeze`, `frighten` | Find projections, push one, freeze one for a time (it cannot move, attack or touch), frighten one (it runs away) |
| `launch`, `tagFlying`, `tagCube` | Fire a new intention, tag the intentions in flight around a point, tag a loose cube |
| `materialAt`, `damageBlock`, `explode`, `spawnDebris` | Act on the world through the normal pipelines (so other items react too) |
| `rng()` | Deterministic randomness on the `items` stream (never `Math.random`) |
| `defer(fn)` | Run at the end of the frame (chain reactions); owned by the item |
| `heal`, `damagePlayer`, `collect(kind, n)`, `counts()`, `spawnPickup` | Health (`heal`/`damagePlayer` take half-hearts; `counts()` gives points) and counters, through `heal`, `actorDamage` and `pickupCollect` |
| `player()`, `isPlayer(owner)` | The player's actor id; the way to ask "did the player cause this?" (never compare owners with raw ids) |
| `toast(messageId, params?)`, `bus` | Show one of the item's own `messages` (by id, in the player's language; never a literal); raw access to the event bus |

Items never import `Game`. Anything an item needs goes through `ItemApi`, so the surface stays small and explicit.

## 3. Everything is a stat or an event

To make *everything* modifiable, the rule for the core code is: **any behaviour an item might want to change must either read a stat or emit an event.** A test enforces it (`tests/items.test.ts`, "contract"): every event in the catalogue must have an emit site, and every stat must be read by the game.

### Stats (`src/core/stats.ts`)

| Stat | Drives |
|---|---|
| `damage` (to actors), `mining` (to blocks, absolute: separate from damage), `fireRate`, `shotSpeed`, `range`, `gravity`, `size` | Intentions |
| `moveSpeed`, `jump` | Movement |
| `reach` | How far you can place blocks |
| `carry` | How many blocks you can hold (1 by default) |
| `kick`, `throw` | Strength of kicks and throws |
| `crush` | Block damage per second dealt to every block you press against while walking (feet, waist and head height, never below; armor counts; 0 = none) |
| `headbutt` | Highest block tier your head breaks when you jump into it (-1 = none); breaking keeps 45 % of the jump |
| `maxHearts`, `invuln` | Heart containers; seconds of invulnerability after a hit |
| `bombRadius`, `bombDamage` | Your bombs |
| `luck` | Chance of a reward when a room is cleared (more uses to come: chests) |

`value = clamp((base + Σ add) × Π mul, min, max)`, then `final` overrides. A stat is never mutated in place, so removing an item can't leave residue. The stats panel (Tab) shows all of them; the pickup banner shows exactly what changed.

### Events (`src/game/events.ts`)

| Event | Hooks can change | Emitted when |
|---|---|---|
| `fire` | the whole `IntentSpec` (damage, `polarity`, pierce, pierceTier, `phase`, colour…), or cancel | casting |
| `blockDamage` | `amount`, or cancel | any damage to a block (intent, explosion, crush, contact…) |
| `blockBreak` | `spawnDebris`, or cancel | a block reaches 0 HP (`source` says who broke it) |
| `blockPlace` | `material` (swap what gets placed), or cancel | placing the top block of your hand |
| `touchBlock` | `crush` (wear it down or not) | every 0.25 s the player presses against a solid block with contact wear |
| `strike` | `damage`, `mining`, `reach`, `tags`, `color`, or cancel; `polarity` is read-only (every hit of the stroke follows it) | a weapon that replaces the intention acts (once per swing, beam or sweep; [WEAPONS.md](WEAPONS.md)) |
| `headBump` | `breaks` (break it or not) | the player's head hits a solid block while jumping (once per block above) |
| `explosion` | `radius`, `damage`, or cancel | anything explodes |
| `touchCube` | `action`: `'pickup'`, `'kick'` or `'ignore'` | walking into a loose cube (pre-filled from `carry`) |
| `kick` | `speed`, `lift`, `tags`, or cancel | kicking a cube |
| `throw` | `speed`, `lift`, `tags`, or cancel | Q, or right click with nowhere to place |
| `drop` | — (react) | a block leaves your hand (`how`: place or throw) |
| `debrisImpact` | `keepTags` | a tagged cube hits something hard |
| `jump` | `velocity`, or cancel | jumping |
| `land` | — (react) | touching ground after a fall (`fallSpeed` in blocks/s; the feet's position `x, y, z`) |
| `doorOpen` | `needsKey`, or cancel | approaching a door |
| `chestOpen` | `cost` (keys, 0 = free), or cancel | walking up to a closed chest |
| `blockLoot` | `drops` (empty by default: blocks drop nothing but themselves) | after a block breaks |
| `bombPlace` | `fuse`, or cancel | pressing E |
| `pickupCollect` | `amount`, or cancel | collecting a key, bomb or heart |
| `actorDamage` *(target required)* | `amount` (damage points; 8 = a heart, 2 = a quarter), `knockback`, or cancel (`targetKind`, `kind`, `source`, `owner`, `cause` tell you what it is; `polarity` is set for player intentions, already halved if positive: a positive one cannot kill a projection after your hooks, [ENTITIES.md §5](ENTITIES.md)) | anything hurting the player or a projection |
| `contact` *(target required)* | `toTarget`, `toAttacker` (points) | a projection touching an actor it is hostile to (once per pair every 0.5 s) |
| `heal` | `amount` (points), or cancel | healing |
| `death` | cancel (survive) | the player reaching 0 hearts |
| `actorDeath` *(target required)* | `drops` (react otherwise) | an actor is gone |
| `factionChange` | — (react) | an actor changed side (e.g. a projection became an ally, through polarity or a charm) |
| `polarityChange` | — (react) | the player switched the loaded intention between positive and negative with **F** |
| `enemySpawn` | `hp`, `speed`, `contactDamage` (points), `tags`, position, or cancel | a projection materialising |
| `roomClear` | `drops` | a room cleared |
| `intentHit` | — (react) | an intention hits a projection (`kind: 'actor'`, `target` its id), a loose cube (`'cube'`, its index) or a block (`'block'`, with the face normal `nx, ny, nz`); `intent` is the intention that hit. A beam or great cut stroke emits it once per projection per stroke (its first contact), never a blade cut |
| `itemGained`, `roomEnter`, `floorEnter` | — (react) | as named |

**Actor events** (`actorDamage`, `contact`, `actorDeath`) cover the player and every projection, so a hook on them must say which actors it is for: `hook('actorDamage', fn, { target: 'player' })` (`'player'`, `'projection'` or `'any'`). The inventory skips the others; the validator and a contract test require it. See [ACTORS.md](ACTORS.md).

`explosion` also carries `actorDamage` (damage points to every actor in range), `owner` and `cause` (its chain); `land` carries `cause` (`'fall'` or `'descent'` down a shaft).

The owner's list, mapped: the carry limit is `carry` plus `touchCube`; health is `maxHearts` plus `actorDamage`/`heal`; enemies are `enemySpawn`/`actorDamage`/`contact`; breaking weak blocks on contact is `crush` plus `touchBlock`; what happens when you drop or throw is `throw`, `drop` and `debrisImpact`; jumping and movement are `jump`, `moveSpeed`, `jump`/`land` events.

**Intention shape** is carried by fields on `IntentSpec` that items set in a `fire` hook and the core reads: `volley` (how many intentions one shot launches; the extra ones deal 60% damage and mining and fan out), `bounces` (rebounds off blocks it doesn't break), `homing` (how hard it steers toward the nearest block within 6 blocks each second). What an intention does when it hits is an `intentHit` hook.

**Tags on cubes** carry intent across time: a hook on `throw` or `kick` adds a tag, and a hook on `debrisImpact` reacts to it later. The core clears a cube's tags after its impact unless a hook sets `keepTags` (so a volatile cube explodes once, not on every bounce). Items export their tag names as constants.

## 4. Priorities, failures and chain reactions

Hooks run in ascending `priority` (default 50):

| Range | Use |
|---|---|
| 0–99 | Modify the payload (add pierce, scale damage) |
| 100–199 | Decide (cancel, veto) |
| 200+ | Side effects (spawn things, chain reactions). **Must not cancel.** |

Equal priorities run in installation order: items in acquisition order, then synergies.

- **A hook that throws** is logged with its source and id (`item:3 kaizen.pierce`) and skipped; the event and the frame go on.
- **Chain reactions** never recurse directly: they use `api.defer(fn)`, which runs in `bus.flush(64)` at the end of the frame, owned by the item (losing the item drops its pending calls). Going down to a new floor clears the queue (`floorEnter`), so nothing leaks into the next floor; the queue is capped at 5000.
- **A hook slower than 4 ms** is reported once with its source and id.
- **Nested emits** are capped at depth 8; past it the event runs **without hooks** (default behaviour) and a warning is logged. It is never silently cancelled.
- To stop an effect from triggering itself, check the `source` of the event (Habit Stacking ignores breaks whose source is `'chain'`), not the damage kind.

## 5. Synergies and exceptions

```ts
// src/content/synergies.ts
defineSynergy({
  id: 'flooding',
  name: 'Flooding',
  description: 'Fears you walk through take their neighbours with them.',
  requires: ['exposure', 'habitstack'], // item ids, or { tag: 'body', count: 3 }
  suppress: ['habitstack.spread'],      // turn off Habit Stacking's 'spread' hook…
  hooks: [hook('blockBreak', ..., { id: 'shatter', priority: 200 })],  // …and install a replacement
});
```

- A synergy is an `Effect` like an item: stats, hooks, plus `requires` and `suppress`.
- `requires` takes item ids and `{ tag, count? }`. **States of being** (Embodied, Lucid, Open-hearted, Resolute) are synergies that require three practices of one path: Isaac's transformations.
- `suppress` names hooks as `itemId.hookId`. Synergy hooks must have ids too.
- **All exceptions live in this one file.** Fixing a bad interaction between two items means adding or editing one entry here, never patching either item or the core.
- Tests check that every `suppress` points at a real hook, that no hook is suppressed by two synergies, and that synergy ids never collide with item ids.

## 6. Installing: `Inventory.rebuild()`

```
on gain / lose / restore / new floor:
  for each source we installed: bus.off(source), stats.removeSource(source)
  active synergies = those whose requires are all met
  suppressed = union of their suppress lists
  for each held item (acquisition order): install stats + hooks (skip suppressed), source = item:<uid>
  for each active synergy:                install stats + hooks,                   source = syn:<id>
```

- Every held copy is an `ItemInstance { uid, def }`; the uid is stable for the life of the copy.
- Only sources the inventory installed are removed. Effects from other sources (a room aura, a curse, a timed buff) on the same stat sheet and bus survive pickups.
- `onGain` runs once, from `gain()`. Rebuilds and restores never run it again.
- `gain()` returns the stat diff and the synergies that just switched on; the HUD shows both in the pickup banner.
- Picking up a duplicate is allowed (two instances, stats stack).

## 7. Storing

- **Definitions** are code (TypeScript modules), versioned with the game.
- **A player's items** are ids in acquisition order: `inventory.serialize() → ['kaizen', 'deepfocus']`, `restore(ids)` rebuilds everything (and warns about unknown ids).
- **Weapons**: an item or synergy may declare `weapon: { id, priority }` to replace the intention (Cut Ties with Toxic People → blade, Remember Breathing → beam, One Clear Cut → great cut). The inventory resolves the active weapon on every rebuild; see [WEAPONS.md](WEAPONS.md).
- **Pools** (`ItemPools`) are per run: weighted draws without replacement from the `loot` RNG stream. Treasure rooms draw from `treasure`, the locked vault from `vault`, the boss room's pedestal from `boss` (both falling back to `treasure`). Every pedestal, boss rooms included, is reserved at run start (`pedestalSlots` in `world/floor.ts`).

## 8. Debugging an interaction

In the browser console:

```js
S.give('exposure'); S.give('habitstack')
S.synergies()   // ['flooding']
S.hooks()       // every hook per event, in run order: { blockBreak: [{ priority: 200, source: 'syn:flooding', id: 'flooding.shatter' }] }
S.trace()       // then inspect ctx.touchedBy on events
S.lose('habitstack')
```

## 9. Safety layers

Items are meant to be powerful enough to break a run, but never to break the game. Five layers guard that (details in the [`sotano-items`](../../.claude/skills/sotano-items/SKILL.md) skill):

| Layer | Where | Catches |
|---|---|---|
| 1. Static validation | `src/items/validate.ts`, at startup (invalid items stay out of the pools) and in tests | Bad ids, missing credit, path or icon, unknown stats, non-finite values, bad suppressions, impossible requirements |
| 2. Runtime guards | `core/events.ts`, `core/stats.ts` | Throwing hooks (logged, skipped), slow hooks, nested emits, runaway chain reactions, NaN/Infinity stats (fall back to base) |
| 3. Synergy matrix | `tests/synergy-matrix.test.ts` | Every item alone and every pair, under every event: no errors, finite stats within limits, chain reactions settle |
| 4. Inventory invariants | `tests/items.test.ts` | Gain then lose leaves no residue; serialize/restore; `onGain` once |
| 5. Contract | `tests/items.test.ts` | Every event has an emit site; every stat is read by the game |

## 10. Deferred decisions from the architecture review

Accepted by the mediator, scheduled for later milestones:

| When | What |
|---|---|
| M2 | An `EffectHost` that owns effects from every source (items, synergies, curses, rooms, buffs), with wildcard suppression (`'kaizen.*'`) |
| M2 | Per-instance item state (`initState`, hooks receive the instance) for counters and charges |
| M2 | `replaces` with most-specific-wins, `suppressStats`, `not`/`any` requirements |
| M2 | Pre/post event phases (`blockBreak` / readonly `blockBroken`), readonly fact fields |
| M2 | Cause tracking (`{ origin, gen }`) through damage → break, and a cap on the deferred queue |
| M2 | Typed tag registry shared by cubes, intentions and entities |
| M2 | `tick`, `intentHit`, `roomClear` events; conditional stats (`value: (q) => number`) |
| M2 | Hook ordering by `(priority, sourceRank, seq)` once non-item hooks exist; an automatic synergy matrix test |
| M4 | Saves: RNG state, pool serialization, restore removing held items from pools |

Rejected: a permutation-equivalence test (acquisition order legitimately matters).
