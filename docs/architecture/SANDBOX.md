# Sandbox and lab

A creative room for development: build one room from any layout, materials, elements, projections and practices, and test physics, reactions, item combinations and how the scene answers. The same room runs in two ways:

- **Creative room** (`?sandbox`): you play in it, and edit it live from the browser console.
- **Lab** (`npm run sandbox`): the real game runs the room's script headless, tick by fixed tick, and prints a short text report. Same scenario, same build: the same report, byte for byte. A change to the game shows up as a diff of a few lines, which is what we read to check a new item against everything it may touch, without screenshots or long logs.

It is a developer tool: English only and never localized, like the debug readout and the `S` console ([LOCALIZATION.md](LOCALIZATION.md)).

## 1. How it fits in the game

Nothing is simulated twice. `Game.newSandbox(scenario)` starts a run like `Game.newRun` does (one shared `begin()`), with three differences:

1. The run's rock is filled as usual (`createDungeonWorld`, so the room sits in its floor's real strata), then `carveSandbox` carves **one sealed room** (no doors) on the scenario's floor band, at grid cell (2, 2). It uses `carveInterior` from `world/floor.ts`, the same code the floor generator carves every room with, so a template looks and behaves exactly as in a run. No other floor is carved.
2. The room's contents come from the scenario (`furnish`): practices gained quietly (`Game.grant`, no banner), the hand, 99 bombs and keys, optional invulnerability, projections out at once (no omen), keys on `K` tiles, the pedestal's practice on `T`.
3. Determinism: cosmetic randomness is seeded from the scenario's seed (`seedFx` in `core/fx.ts`, [RNG.md](RNG.md) §3), and the world moves in fixed steps of 1/60 s (`SANDBOX_DT`): one per frame in the creative room, and `Game.step()` in the lab. Everything else is already deterministic by seed.

Everything after that is the normal game: the element simulation, loose cubes, bombs and blasts, intentions, weapons, projections and factions, items and synergies on the event bus. **R** rebuilds the scenario (with your console edits).

## 2. Scenarios (`src/sandbox/scenarios/*.json`)

One JSON file per scenario; the file name is its id. Coordinates are room-local `[col, h, row]`: `col` west to east, `row` north to south, `h = 0` the first air layer above the floor (negative `h` digs into it: pools and pits). A box is `[x0, h0, z0, x1, h1, z1]`, both corners included.

| Field | Meaning (default) |
|---|---|
| `note` | One line: what it checks |
| `floor` | The floor whose band, rock and rules the room takes, e.g. frozen pools on the last (1) |
| `seed` | Root seed of everything random, cosmetic included (1) |
| `template` | A room template id from `src/content/rooms.ts` ([ROOMS.md](ROOMS.md)); `rows`, `height`, `ceiling`, `layers` override it |
| `rows` | A layout in the template legend, any size from 3 × 3 to 28 × 16 |
| `height`, `ceiling`, `layers`, `flipX`, `flipZ`, `mood` | As in a template; `mood: "reinforced"` hardens it, decor slots roll by mood |
| `shell` | Material of the two-block walls, floor and ceiling (`brick`) |
| `place` | Placements after the template, in order: `{ "at", "block": "crate" }`, `{ "at", "element": "water" \| "lava" \| "fire", "level"? }` (a source unless `level` 1–7), `{ "at", "clear": true }` |
| `pedestal` | The practice on a `T` tile |
| `items`, `hand` | Practices held from the start; blocks in the hand, bottom to top |
| `enemies` | `{ "def": "doubt", "at", "faction"?: "self" }`; a creature id spawns a neutral creature |
| `player` | Where you stand (the template's `P`, else the centre) |
| `god` | Invulnerable (false) |
| `ticks`, `report`, `maps`, `view` | Lab: ticks to run (60 per second, 120), the ticks to report on (first and last), the ticks to draw maps at (last) and the heights drawn (`[0]`) |
| `actions` | Lab: the script (below) |

`validateScenario` names every unknown id (template, block, practice, projection) and every size out of range; `carveSandbox` refuses an invalid scenario.

### The script (`actions`)

Each action has a tick `t` and runs right after that tick's report, before the tick is simulated. Any placement can be an action too (no `do`).

| `do` | Fields | What it does |
|---|---|---|
| `damage` | `at`, `amount`, `kind`? | Block damage through the normal pipeline (`blockDamage`, armour) |
| `break` | `at` | Breaks a block (`blockBreak`, a loose cube) |
| `explode` | `at`, `radius`? (2.5), `damage`? (30) | A blast, as a breakthrough's |
| `bomb` | `at`, `fuse`? (1.8) | A lit breakthrough cube |
| `cube` | `block`, `at`, `v`? | A loose cube with a velocity |
| `spawn` | `def`, `at`, `faction`? | A projection or creature, out at once |
| `give`, `lose` | `item` | Gain (quietly) or lose a practice |
| `tp`, `look` | `at` | Stand on a tile; aim at a cell's centre |
| `fire` | `ticks`? (1) | Hold the fire button that many ticks (the intention, or the active weapon) |
| `key` | `code` | Press a key for one tick: `KeyE` bomb, `KeyQ` throw, `KeyF` polarity |
| `use` | | Right click: place the top block where you look |
| `hand` | `blocks` | Set the hand |

## 3. The report

```
# water-lava — Water poured beside lava: a lava source quenches to obsidian, its flow to stone
floor 3 · seed 1 · room 13×7×5 · 180 ticks (3.0 s)

t 30 (0.5 s)
  player hp 24/24 · at 0.5 0.0 6.5 · hand [] · bombs 99 · keys 99
  blocks —
  elements water 29 (2 src) · lava 10 (10 src)
  cubes — · pickups 0
  events materialReact:quench 2 · roomEnter 1

map t 180 · h -1
  bbbboooobbbbb
  …
legend b brick · o obsidian · w water · W water source
```

At each reported tick: the player (health in points, 8 per heart; room-local position; hand; counters), the practices and synergies held, every projection (hp, faction, position), every block inside the room and every element cell (its pools included), the loose cubes and pickups, and every event since the last report with its subject (`blockBreak:crate`, `materialReact:quench`, `actorDamage:doubt<intent`, `factionChange:doubt>self`; a trailing `!` marks a cancelled event). Maps are top-down at one height: one character per material (`MAP_CHAR` in `src/sandbox/report.ts`), elements as `w`/`l`/`f`, upper case for a source. Anything logged with `console.error` (a hook that threw) ends the report as `ERROR` lines and fails the run.

## 4. Running it

```bash
npm run sandbox -- water-lava fire-crates     # print these reports
npm run sandbox -- '{"rows":["c.f"],"ticks":300}'   # an ad-hoc scenario, inline
npm run sandbox -- --file my-scenario.json    # or from a file
npm run sandbox -- --all                      # every scenario: save src/sandbox/reports/<id>.txt, show what changed
npm run sandbox -- --check                    # every scenario against its saved report; exit 1 on any difference
```

`scripts/sandbox.mjs` serves the game with Vite, opens `?sandbox=<id>&lab` in headless Chromium through Playwright (it must be installed: `npm i -D playwright && npx playwright install chromium` on a new machine) and reads the report from the page. The saved reports in `src/sandbox/reports/` are the expected behaviour: after a change, `--check` tells exactly which scenarios moved and which lines; `--all` accepts the new behaviour.

**Testing a new practice**: add a scenario for each environment it may meet (water, lava, fire, crates, a projection, a bomb), give it the practice, and script the actions it reacts to; run `--check` to see that nothing else moved. `tests/sandbox.test.ts` checks in Vitest that every scenario validates and carves the same room twice.

**Testing a new projection or creature**: put it in a scenario beside the terrain it reacts to (lava, water, crates, a blast), under `enemies` with its id as `def` (a creature id spawns a neutral creature; `"faction": "self"` makes it an ally), and script the blows or intentions it should take. `bestiary-smoke` puts every projection in one room on floor 9 (`npm run -s sandbox -- bestiary-smoke`); its report is saved in `src/sandbox/reports/`. A `console.error` ends a report as `ERROR` lines and fails the run (§3).

**Bosses** spawn their body in the sandbox, but the sandbox room has no boss room (`boss: null`): the seal, the health bar and the way down run only on a generated floor.

## 5. The creative room (`?sandbox`)

`?sandbox` opens an empty 13 × 7 room (invulnerable); `?sandbox=<id>` a scenario; `?sandbox={…}` an inline one. In the browser console, `S.sb.help()`:

| Call | What it does |
|---|---|
| `S.sb.list()`, `templates()`, `blocks()`, `items()`, `projections()` | What exists |
| `S.sb.load('id' \| {…})`, `reload()` | Build a scenario (R also rebuilds it) |
| `S.sb.template('cistern', { floor: 3 })` | A room from a template, with overrides |
| `S.sb.block(x, h, z, 'crate')`, `box(x0, h0, z0, x1, h1, z1, 'stone')`, `clear(x, h, z)` | Blocks |
| `S.sb.pour(x, h, z, 'water', level?)`, `pourBox(…)` | Elements (sources unless a level) |
| `S.sb.spawn('doubt', x, h, z, 'self'?)` | A projection, out at once |
| `S.sb.give('stoic')`, `lose(id)`, `hand('crate', 'stone')` | Practices and hand |
| `S.sb.pause()`, `step(60)` | Freeze the world; move it a fixed tick at a time |
| `S.sb.here()`, `map(h)` | Your room-local tile; the room top-down at a height |
| `S.sb.export()` | The scenario as JSON, your edits included: save it as a new scenario |
| `S.sb.lab('id' \| {…})` | Run a scenario's script and print its report |

Every edit is written into the scenario, so **R**, `reload()` and `export()` keep it.

### 5.1 Boss duels (`S.sb.duel`)

`S.sb.duel('resistance', 'kite', { floor: 1, seconds: 45, hp: 140 })` puts a boss in an empty 28 × 7 arena, 8 high (a double boss room), against a scripted player, and runs it headless: a third of the time in each phase (its health is set to 60 % and 30 % to cross them). `still` stands at the west end; `kite` runs laps of the arena at running pace (it never jumps, so every ring and wave it meets counts). The player takes no damage: each hit is counted, then cancelled, with the normal second of invulnerability after it. One line per duel, per phase: blocks moved, mean distance, moves started, hits and damage points (8 = a heart), and the most attacks and projectiles on the field at once; then the damage the boss did to itself and the blocks it broke. `S.sb.duels()` runs every boss on its first floor in both modes. Code: `src/sandbox/duel.ts`.

What a boss of floors 1–5 must show (2026-10-29): it moves or attacks in every phase (no phase of standing still), at least five moves in fifteen seconds, it never dies of its own rubble, a still player loses well over three hearts in a phase, and a running player who never jumps about two to six hearts a phase (jumping the rings and waves, and dodging charges, is how you take less).

## 6. Limits

- One room, sealed: no doors, no floor plan around it, no boss holes. Digging out of it reaches the floor's real rock (and nothing else is carved).
- The creative room is deterministic only as far as your own input is: replays belong to the lab.
- The lab moves the player only by `tp` (no walking yet) and aims with `look`.
