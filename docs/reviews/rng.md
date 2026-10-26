# Review: seeds and randomness

Three-party review of the proposal in [../architecture/RNG.md](../architecture/RNG.md).

The owner's request (translated): *the whole RNG system implemented now; items and rooms carry probability RNG; depending on the seed, unique things are generated each run; every run must already be unique; across the whole vertical — scenarios, rooms with their variants and possibilities, enemies, items, rewards — all based on a seed; very important; take the time to do it well; documented, explained and implemented optimally.*

---

## 1. Architect's critique

### Verdict

Right direction (crypto seeds by default, path-derived structure at carve time, probabilities as data), but the proposal promises a determinism it can't deliver (the game runs on variable `dt`, so the "play" class can never replay), misses the one real cross-floor leak (shared item pools), and several variety features collide with existing invariants. Ship a smaller core and defer the rest.

### Critiques

1. **(High) Item pools break cross-floor isolation.** Pools draw without replacement from one stateful stream; floor k+1 is carved later, so any removal before then (`give()`, future chests) changes every later pedestal. *Change:* a fixed weighted permutation per pool built once per run (Efraimidis–Spirakis keys from path-derived randoms); a draw takes the first entry not yet taken, so removing X only changes the slot that would have held X.
2. **(High) The "play" class promises impossible determinism.** Variable `dt` and real-time input mean debris, enemy decisions and proc timing never replay; per-entity streams add bookkeeping for nothing. *Change:* three classes — **Structure** (path-derived, never reads player state), **Runtime** (one seeded stream per domain: `run/drops`, `run/items`, `run/ai`; isolated from structure, no replay promise), **Cosmetic** (debris velocity and spin, particles, shake, audio).
3. **(Medium-High) Rewards that matter should be pre-rolled.** Today the shared `drops` stream makes a room's clear reward depend on clearing order. *Change:* roll at clear time from a fresh derived RNG keyed by the room, applying luck to a fixed `u`, so same seed + same luck = same reward.
4. **(Medium) Item streams keyed by uid aren't stable** (uids keep counting across R and restores). *Change:* key by `item/<defId>/<copyIndex>` or use `run/items`.
5. **(Medium) Seed-code entropy is overstated**: 40 bits folded into 32 means ~256 codes per run, and the doc says "64-bit-safe". *Change (Isaac-style):* 32 seed bits + an 8-bit checksum — a bijection, no collisions, and typos are rejected instead of silently starting another run.
6. **(Medium) `GEN_VERSION` tied to golden hashes will churn.** *Change:* bump by hand at releases; keep property tests (same seed twice is identical; isolation; variety); add golden hashes when content freezes; don't mix the version into the root silently: show `v1` and warn on mismatch.
7. **(Medium) `at()` vs `stream()` is a trap**: `at(p)` twice gives the same sequence, correlating decisions. *Change:* a single `fork(...path)` documented as "once per decision site"; one fork per (floor, room, domain), not per micro-decision; hash path parts incrementally with the root as the hash seed (not `seed ^ hashStr(name)`, which correlates across seeds).
8. **(Medium) A `roll` hook on structure tables breaks structure** (floors are carved one ahead, so an item's influence would depend on a hidden moment). *Change:* luck and `roll` only on runtime tables; structure tables get a frozen `{ floor }` context; don't add `roll` until an item needs to bias weights before the outcome (`roomClear`/`enemyDeath` already expose mutable drops).
9. **(Medium) Some variety features conflict with invariants.** "Reinforced" walls are overwritten by the neighbour's shared wall (cut it); `?` decor isn't a known marker and must be treated as possibly solid by the door, pedestal and centre-spawn rules; variants are just more templates (existing `weight` covers them); don't grow room counts (corner starts already need relaxing); cut enemy stat jitter. *Must-haves now:* crypto seed, decor slots, enemy and reward tables, per-floor rock theme. *Defer:* other modifiers.
10. **(Low-Medium) The `Math.random` grep test isn't sufficient.** Route the legitimate cosmetic calls through `fx`; also check that nothing under `src/world/` or `src/content/` imports `fx`; structure code should use integer and RNG arithmetic only (`Math.sin`/`hypot` can differ between engines).
11. **(Low) Performance isn't the risk**: creating an RNG costs <100 ns; strings/GC matter in hot paths, which are cosmetic anyway; per-voxel values use `hash3`.

### Keep as is

sfc32 + splitmix and `hash3`; the alphabet without look-alikes, normalisation, crypto as the only entropy source, seed shown on pause/inventory/death; carve-time pedestal draws and rosters; tables as data with validation; determinism, isolation and variety tests (extend isolation to pool removals and R-restart vs fresh load).

---

## 2. Mediator's ruling

### Summary

The architect's smaller core is right. One big correction: the architect's own fix for #1 (a weighted permutation per pool) still cascades: an early take shifts every later pedestal by one. The real fix is to **decide all structure at run start**: every floor plan and every pedestal's item. The owner's "rooms with variants and possibilities" is met cheaply and safely with decor slots, room moods and more templates, not risky modifiers.

### Decisions

| # | Critique | Decision | Action |
|---|---|---|---|
| 1 | Pools leak across floors | **Now, fix replaced** | Plan all four floors at `newRun`; reserve one item per treasure/vault room in (floor, room) order from `fork('reserve')`; runtime draws only take unreserved, untaken items; a pedestal whose item the player already holds gets a runtime draw. |
| 2 | "Play" can't replay | **Now** | Structure / Runtime / Cosmetic; runtime is isolated with no replay promise. |
| 3 | Pre-roll rewards | **Now** | `fork('floor',k,'room',i,'clear')`, draw `u` first, luck reweights against the fixed `u`. |
| 4 | Item streams keyed by uid | **Now** | `fork('item', defId, copyIndex)`, created once per copy. |
| 5 | Code entropy | **Now (done)** | 32-bit root + 8-bit checksum; wire into the game. |
| 6 | GEN_VERSION churn | **Now; goldens later** | Bump by hand; accept `?v=`, warn on mismatch; golden hashes at content freeze. |
| 7 | `at` vs `stream` | **Now** | `fork` + `stream`; `hashPath` rejects non-integer parts; one fork per (floor, room, domain). |
| 8 | No `roll` hook on structure | **Now; hook later** | Structure tables get `{floor}` only; luck only on runtime tables; future structure effects act at reveal time. |
| 9 | Variety vs invariants | **Now, with additions** | No wall modifiers; a "reinforced interior" mood; decor slots `? ~ !` treated as solid by the validator (door approach, pedestal reach, centre spawn); moods bias slots; 6+ new normal templates and 1–2 start/treasure/boss; keep 8–11 rooms; no stat jitter; rock theme per floor. |
| 10 | Grep isn't enough | **Now** | Only `core/fx.ts` calls `Math.random`; move sfx, particles, debris launch/spin, settle rotation, spawn particles and shake there; test that `world`/`content` don't import `fx`. |
| 11 | Performance | **No action** | No forks or strings in per-voxel loops (`hash3` there). |

### Missed by both

The build was broken mid-change; the stateful room stream in `carveFloor` crossed rooms (one more decor roll in room 3 would change room 4); rock noise correlated across nearby seeds (`hash3(seed + s)`); the permutation fix cascades; numeric `?seed=` should still display a code; bad codes must show a toast; enemy uids are a global counter (never key randomness on them); `drawItem` could return null.

## 3. Engineer's resolution

Everything ruled "now" is built; see [../architecture/RNG.md](../architecture/RNG.md).

- `core/seed.ts` (codes with checksum, crypto root, `GEN_VERSION` shown and checked from `?v=`), `core/rng.ts` (`RunRandom.fork/stream`, `hashPath`), `core/tables.ts`, `core/fx.ts`.
- `planDungeon()` decides all four plans and rock themes at run start; `fork('reserve')` reserves every pedestal; `carveFloor()` reads only those decisions and forks per room (`layout`, `roster`) and per floor (`key`); rock layers seeded from forks.
- `ItemPools` rewritten: `reserve`, `reservedFor`, `drawRuntime`, `remove`, fallbacks.
- Room-clear rewards pre-rolled per room with luck applied to a fixed `u`; per-copy item RNGs; every `Math.random` moved to `fx`.
- Tables: `ROOM_CLEAR`, `ROSTER`, `QUIET_ROOM`, `ROOM_MOOD`, `DECOR_SLOTS`, `ROCK_THEME`, `CHEST_CONTENTS` (stub).
- Rooms: decor slots with validator rules (pedestal reach, centre spawn tile, 2×2 shaft tiles), moods, a reinforced-interior swap, and 9 new templates (garden, rubble, veins, checker, ring, colonnade, hall, nook, pit).
- Seed shown on pause, inventory and death screens, click to copy a share link; invalid codes show a toast; a new run closes any open banner.
- Tests: `tests/rng.test.ts` (codes, derivation, determinism, isolation, rewards, variety over 200 seeds, tables, randomness discipline) and the shared run builder `tests/helpers.ts`.
