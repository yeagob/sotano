# Seeds and randomness

Status: **built**, after the three-party review in [../reviews/rng.md](../reviews/rng.md). Every run is unique and every run can be replayed from its seed.

## 1. In one paragraph

A run is a 32-bit **root seed**, shared as an 8-character **code** (`ABCD EFGH · v3`; v2 added the boss rooms' pedestals, which changed every reservation; v3 added the element and tall room templates, which changes template picks; v4 the ten floors of [LEVELS.md](LEVELS.md), the tutorial floor's gentle reservations and deep floors without vaults; v5 the chests; v6 the Tree-of-Life floors; v7 the challenge rooms; v8 the rooms reworked so building is the key on every floor; v9 big rooms and the great pit; v10 the giant tree, silence and the ice; v11 rooms bigger than their cell, new ceilings and a building palette per floor; v12 the giant tree rebuilt in stories; v13 the roots become a fixed plan, with loose keys and bombs; v14 the roots always lay one key and one bomb). New runs take their root from the browser's crypto RNG, the only place true randomness enters the game. Everything else derives from the root: the **structure** of the whole run (all four floor plans, rock themes, every pedestal item) is decided when the run starts, from **path-derived forks** (`fork('floor', 2, 'room', 5, 'layout')`) that never depend on what the player does. **Runtime** outcomes (drops, item procs, runtime item draws) use isolated streams. **Cosmetic** randomness (particles, sound, shake, cube spin and launch) goes through one module and never decides an outcome. Every random choice reads a **weighted table**.

## 2. Seeds

- **Code**: 8 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no I, O, 0, 1). The 40 bits hold the 32-bit root and an **8-bit checksum** (Isaac-style), so every code maps to exactly one run and a typo is rejected instead of silently starting a different run (`src/core/seed.ts`: `encodeSeed`, `decodeSeed`, `formatSeed`, `randomRoot`).
- **Replay**: `?seed=ABCD-EFGH` (spaces, dashes and case are ignored). An invalid code shows a toast and starts a fresh run. A plain number is accepted as a root (tests).
- **Version**: `GEN_VERSION` is shown next to the code (`· v1`) and put in share links (`&v=1`). It is bumped by hand at releases when generation changes; a link from another version shows a warning. It is not mixed into the root.
- **Where it shows**: the pause card, the inventory header, the death screen. Clicking it copies a share link.
- **New run (R)**: always a fresh crypto seed.

## 3. The three classes of randomness

| Class | What | Source | Rules |
|---|---|---|---|
| **Structure** | Floor plans, rock themes and noise, room templates, mirroring, moods, decor slots, rosters, the floor key, pedestal items | `rng.fork(...path)`, at run start or carve time | Never reads player state, stats or luck. Integer and RNG arithmetic only (no engine-dependent maths). |
| **Runtime** | Room-clear rewards, enemy drops, item procs, runtime item draws (chests, effects) | Per-room forks (`…'clear'`), per-item-copy forks, `rng.stream('drops' \| 'loot' \| 'ai')` | Isolated from structure; may use luck. No replay promise (the game runs on variable frame time and real-time input). |
| **Cosmetic** | Particles, sound jitter, camera shake, cube spin, debris launch direction, spawn particles | `fx` (`src/core/fx.ts`) | Must never decide an outcome. **Only `core/fx.ts` may call `Math.random`**; `src/world` and `src/content` may not import `fx` (both checked by tests). The sandbox seeds it (`seedFx`) so a scripted scenario replays exactly; a normal run never does. |

## 4. Paths (the only ones in use)

| Path | Class | Decides |
|---|---|---|
| `fork('plan', k)` | Structure | Floor k's plan (from the start cell under floor k−1's boss room) |
| `fork('floor', k, 'theme')` | Structure | Floor k's rock theme |
| `fork('rock', 0)`, `fork('rock', 1)` | Structure | The two rock noise layers (seeds for `hash3`) |
| `fork('reserve')` | Structure | Every pedestal's item, in (floor, room) order, at run start |
| `fork('floor', k, 'room', i, 'layout')` | Structure | Room i: template (among those whose space fits its allotment) → flips (one draw among the flips that fit) → mood → decor slots, row by row, in that order |
| `fork('floor', k, 'room', i, 'roster')` | Structure | Room i's projections |
| `fork('floor', k, 'presence')` | Structure | Which normal room of a Tree floor holds the Listener (GEN_VERSION 15); the Gardener is the start room of floor 0 |
| `fork('floor', k, 'key')` | Structure | Where floor k's key lies |
| `fork('floor', k, 'room', i, 'chest')` | Structure | Whether room i's practice is shut in a chest, its key cost, a free chest's tile and cost (GEN_VERSION 5) |
| `fork('floor', k, 'chestkeys')` | Structure | Where the extra keys for floor k's chests lie |
| `fork('floor', 0, 'loot')` | Structure | Where the roots' key and bomb lie, in its lesson rooms (`GEN_VERSION` 14) |
| `fork('plan', k, kind)` | Structure | Floor k's plan for its kind (random planners); Tree floors draw nothing |
| `fork('tree', story)` | Structure | One story of the giant tree (`GiantTree.grow`, lazily, when the player comes near): its knot windows, rings, ramps, columns, branches, limbs and stars. One fork per story, so the tree grows the same in any order |
| `fork('sandbox', 'layout')` | Structure | The sandbox room's decor slots ([SANDBOX.md](SANDBOX.md)) |
| `fork('floor', 0, 'creatures')` | Structure | Where the roots' peaceful creatures start |
| `fork('floor', k, 'space')` | Structure | Which room may spread into each empty cell of floor k (`allotSpace`), drawn before any room's layout |
| `fork('plan', k, 'challenge')` | Structure | Whether floor k keeps a challenge room (`CHALLENGE_ROOM`) and which |
| `fork('floor', k, 'room', i, 'wave', visit, wave)` | Runtime | A challenge room's wave (`pickWave`) |
| `fork('floor', k, 'room', i, 'challenge', visit, wave)` | Runtime | The reward for clearing that wave |
| `fork('elements')` | Runtime | One seed for the element simulation: each fire-spread roll is `hash3(seed, cell, tick, side)`, stateless, so one fire never changes another's luck. Template elements (pools, flames) are fixed by the template and draw nothing |
| `fork('floor', k, 'room', i, 'clear')` | Runtime | Room i's clear reward: one uniform `u`, then luck reweights the table against it |
| `fork('floor', k, 'room', i, 'rooted', seq)` | Runtime | Whether a projection spawns rooted (`rootedChance`, BESTIARY §4.3): `seq` as for parts; a rooted one rolls its parts once more on `fork(…, 'part', seq, 'rooted')` |
| `fork('floor', k, 'room', i, 'part', seq)` | Runtime | The parts a released projection leaves (`rollParts`): `seq` is the room's spawn count when its omen opened, so each projection has its own roll and `stream('drops')` is untouched |
| `fork('item', id, copy)` | Runtime | One held copy of an item: `api.rng()` inside its hooks (kept across inventory rebuilds) |
| `stream('drops')` | Runtime | Enemy drops |
| `stream('loot')` | Runtime | Runtime item draws (never reserved items) |
| `stream('ai')` | Runtime | Reserved for enemy decisions |

`fork()` returns a **fresh** RNG: same path, same numbers, whatever happened before. Call it **once per decision site** and draw from it in order; calling it twice for the same path is a bug (the second "roll" repeats the first). Paths are hashed part by part with the root as the hash seed (`hashPath`): no string building, no concatenation collisions, no correlation between nearby roots; non-integer number parts throw. Per-voxel values use `hash3` with a seed from a fork (no allocation).

## 5. Weighted tables (`src/core/tables.ts`, `src/content/tables/`)

```ts
export const ROOM_CLEAR = table<PickupKind | null>('room-clear', 'runtime', [
  { value: 'heart', weight: 3, luck: 0.25 },
  { value: 'bomb', weight: 2, luck: 0.25 },
  { value: 'key', weight: 2, luck: 0.25 },
  { value: null, weight: 7 },
]);
ROOM_CLEAR.roll(rng, { floor, luck });   // or pickU(u, ctx) against a pre-drawn uniform
```

- Entries: `value`, `weight`, optional `minFloor` / `maxFloor`, and `luck` (runtime tables only: weight × (1 + luck × factor)). Structure tables ignore luck.
- Tables today: `ROOM_CLEAR` (runtime), `ROSTER` and `QUIET_ROOM` (enemy rosters by floor), `ROOM_MOOD` and `DECOR_SLOTS` (rooms), `ROCK_THEME` (floors), `CHEST_CONTENTS` (stub for the elements plan). All are listed in `src/content/tables/index.ts` and validated by tests.
- Items change runtime outcomes through the existing events (`roomClear.drops`, `enemyDeath.drops`, `blockLoot.drops`). They never change structure: if an item ever needs to, it will act when the room or pedestal is revealed, not at carve time.

## 6. What varies per run

| Domain | Variety |
|---|---|
| Floors | Four plans (8–11 rooms each), special rooms on dead ends, a vault when there's a third dead end |
| Rock | Per-run noise; each floor rolls a theme: plain, earthy (more dirt pockets), veined (more ore), hardened (more deepstone) |
| Rooms | 19 templates (6 new with decor slots), mirrored on X/Z, a **mood** per normal room (sparse, normal, cluttered, reinforced) that biases its **decor slots** (`?` crate, `~` dirt/stone/ore, `!` ore/obsidian); reinforced rooms harden their obstacles (never the shared walls) |
| Projections | Rosters from weighted tables per floor (budget 2 + floor; some rooms are quiet) |
| Practices | Every pedestal reserved per run from weighted pools; vaults favour quality-4 practices |
| Rewards | Room-clear rewards pre-rolled per room; enemy drops |

## 7. Item pools

At run start every treasure, vault and boss room of every floor gets its practice **reserved** (boss rooms from the `boss` pool; their practice only appears once the boss is overcome) (in floor and room order, from `fork('reserve')`). Runtime draws (`drawRuntime`, on `stream('loot')`) only take items that are neither reserved nor taken, so nothing the player does can change a pedestal. If the player already holds a reserved practice when its floor activates, that pedestal gets a runtime draw instead. An exhausted pool falls back to the treasure pool, then any unused item, then any item: a pedestal is never empty. `GEN_VERSION` 15 added fifteen practices, so the same seeds reserve different ones.

## 8. Guarantees (tests, `tests/rng.test.ts`)

1. Seed codes round-trip every root; spaces, dashes and case are normalised; >95% of single-character typos are rejected.
2. `fork` is a pure function of (root, path); paths don't collide by concatenation; non-integer parts throw.
3. The same seed builds the same ten floors (voxels, rooms, moods, rosters, pedestals); a golden test pins seed 0xBEEF's structure hash to the current `GEN_VERSION`.
4. Runtime randomness (runtime draws, removals, every stream, item forks) never changes the structure.
5. A room's layout doesn't depend on rosters or items.
6. Room-clear rewards don't depend on clearing order.
7. 200 seeds give 200 different runs, every template and mood is used, and no practice takes more than 15% of the pedestals.
8. Every table has finite positive weights; rolls follow the weights; luck only affects runtime tables.
9. Only `core/fx.ts` calls `Math.random`; structure code never imports `fx`.

## 9. Later

- Golden hashes of fixed seeds once content freezes (the first public build), not before.
- A daily seed; marking runs started from a typed seed once meta-progression exists.
- Enemy decisions on `stream('ai')` when behaviours gain randomness.
