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

Then list it in `src/content/items/index.ts`, and translate `name`, `description`, `effect` (and `inspiredBy`, `messages` if any) in every non-English catalog in `src/i18n/locales/`, and write its **teaching** (`teach.<id>.quote` and `teach.<id>.lesson`, issue #202: a phrase that carries the practice into everyday life and two or three lines on how to live it, shown first in the practices tab) in every catalog's `messages` ([LOCALIZATION.md](LOCALIZATION.md) §5; `tests/i18n.test.ts` lists what is missing, and checks the translated `effect` keeps the same numbers). The full checklist is the project skill [`sotano-items`](../../.claude/skills/sotano-items/SKILL.md).

- `hook(event, fn, { id?, priority? })` is typed: the payload type comes from the event name. Give an `id` to every hook that defines the item's identity, so synergies can target it.
- Hooks get the event context (mutable fields + `cancel()`) and an `ItemApi` facade:

| `ItemApi` | Does |
|---|---|
| `stats()`, `held()` | Read current stats and the blocks in your hand |
| `has(id)`, `hasTag(tag)` | Ask about other held items |
| `pulse`, `arc`, `igniteArea` | Area effects: damage and shove every projection around a point, a bolt between a point and a projection (through its polarity), fire on flammable blocks |
| `shieldFire` | Fire never hurts you within `radius` of a point for `seconds` (Controlled Burn: the fire of your own blasts) |
| `nearestProjection`, `actorAt`, `shove`, `freeze`, `frighten` | Find projections, push one, freeze one for a time (it cannot move, attack or touch), frighten one (it runs away) |
| `launch`, `intentsHere`, `tagCube` | Fire a new intention, count the intentions in flight in the player's room, tag a loose cube |
| `placeBlock` | Place one copy of an ordinary block in an empty cell of the player's room (Affirmation). Only interior room space, no body, no element, no door or doorway, never a material that may not be copied. Writes the world like the player's placement but emits no `blockPlace` or `blockPlaced`. Returns whether it placed |
| `convertFluid` | Turn the connected cells of one fluid into another (`water` ↔ `lava`), nearest first, up to a cap; once per frame. Returns the cells converted, 0 when nothing was, -1 when a negative conversion into lava is refused (the player's body touches the section and no `lavaWalk` time is left) |
| `materialAt`, `damageBlock`, `explode`, `spawnDebris` | Act on the world through the normal pipelines (so other items react too) |
| `rng()` | Deterministic randomness on the `items` stream (never `Math.random`) |
| `time()`, `memory()` | Game time in seconds (paused with the game); scratch numbers per practice for timers and per-room caps, shared by its copies, dropped with the last copy, never saved |
| `defer(fn)` | Run at the end of the frame (chain reactions); owned by the item |
| `heal`, `damagePlayer`, `collect(kind, n)`, `counts()`, `spawnPickup` | Health (`heal`/`damagePlayer` take half-hearts; `counts()` gives points) and counters, through `heal`, `actorDamage` and `pickupCollect` |
| `player()`, `isPlayer(owner)` | The player's actor id; the way to ask "did the player cause this?" (never compare owners with raw ids) |
| `toast(messageId, params?)`, `bus` | Show one of the item's own `messages` (by id, in the player's language; never a literal); raw access to the event bus |
| `consumeSelf()` | Removes this copy of the item once the current event has finished (deferred: never rebuilds the inventory inside an emit); Waymark spends a copy this way |
| `playerFeet()`, `teleportPlayer(x, y, z)` | The feet position; moves the player to the free cell nearest the feet, zeroes velocity and opens the doors of any room the player is sent out of (Waymark's revive) |
| `checkpoint()`, `setCheckpoint(x, y, z)` | The run's checkpoint (`src/game/checkpoint.ts`): set to the free cell nearest the feet, kept across inventory rebuilds, cleared when no held item carries the `checkpoint` tag |
| `invulnerable(seconds)`, `burst(x, y, z, color, count)`, `chime()` | Invulnerability for seconds (never shorter than the window running); a coloured particle burst; the reveal chime |
| `addStack(n = 1)` | Add stacks to this held copy of a practice with a `stack` (clamped to its max; only its stat sheet changes, safe inside an event); returns the new count. Synergies get 0. See [STACKING](../design/built/practices/STACKING.md) |
| `grantStatus(id, seconds, { add?, cap? })` | Starts or extends a player status timer (`Game`, its `statuses` map): counted down each frame and cleared with a run. `'phase'` is Lucid Dream: the body passes finite blocks inside its room's box and comes out in free space when it ends ([MIRACLES](../design/built/practices/MIRACLES.md#lucid-dream)) |

Items never import `Game`. Anything an item needs goes through `ItemApi`, so the surface stays small and explicit.

## 3. Everything is a stat or an event

To make *everything* modifiable, the rule for the core code is: **any behaviour an item might want to change must either read a stat or emit an event.** A test enforces it (`tests/items.test.ts`, "contract"): every event in the catalogue must have an emit site, and every stat must be read by the game.

### Stats (`src/core/stats.ts`)

| Stat | Drives |
|---|---|
| `damage` (to actors), `mining` (to blocks, absolute: separate from damage), `fireRate`, `shotSpeed`, `range`, `gravity`, `size` | Intentions |
| `moveSpeed`, `jump` | Movement |
| `airJumps` | Jumps you may make in the air before landing (0 by default, at most 3, floored: the first Triple Jump copy gives two, the second one more, a third none); each climbs the ladder `[1, 2, 8, 16]` of `physics/jump.ts` (SKY.md §9; the 16 is the fourth jump, reached only with three air jumps) |
| `wallJumps` | The last of the `airJumps` that need a solid block touching your side (0 by default, at most 3, floored; the Wall Jump adds one per copy, [WALL-JUMP.md](../design/built/practices/body/WALL-JUMP.md)) |
| `reach` | How far you can place blocks |
| `carry` | How many blocks you can hold (2 by default: one per hand; items add to it) |
| `kick`, `throw` | Strength of kicks and throws |
| `crush` | Block damage per second dealt to every block you press against while walking (feet, waist and head height, never below; armor counts; 0 = none) |
| `headbutt` | Highest block tier your head breaks when you jump into it (-1 = none); breaking keeps 45 % of the jump |
| `maxHearts`, `invuln` | Heart containers; seconds of invulnerability after a hit |
| `bombRadius`, `bombDamage` | Your bombs (and the blast of a missile, love or not) |
| `missile` | 1 = a quick double tap of the fire control launches a bomb as a missile (0 = it does nothing); `game.ts` `tapMissile`, rules in `combat/missiles.ts` |
| `luck` | Chance of a reward when a room is cleared (chests to come; Serendipity finds in bomb blasts) |
| `dash` | 1 = a double tap of a direction, a double flick of the left stick or a swipe dashes 4.5 blocks that way (0 = no dash); `Player.startDash`, the gestures in `src/input/gestures.ts`, rules in [DASH](../design/built/practices/DASH.md) |
| `run` | 1 = holding the run control walks 1.45 times as fast (0 = no running; crouching wins over it); `Player.walk`, rules in [RUN-AND-CROUCH](../design/built/practices/RUN-AND-CROUCH.md) |
| `crouch` | 1 = holding the crouch control makes the body a block shorter, its eye lower, the walk 0.45 times as fast, keeps it off ledges and halves projection contact (0 = no crouch); `Player.setStance`, `src/entities/stance.ts`, rules in [RUN-AND-CROUCH](../design/built/practices/RUN-AND-CROUCH.md) |
| `lavaWalk` | Seconds of lava walking (0 = none; the practice gives 2 per copy, the stat caps at 6). While time is left, lava does not hurt the player (it is left out of the damage check), its surface is ground (`Game.lavaSurface`, read by the solid test of the frame) and wading in it is full speed (the 0.4 wade becomes 1). `Game.lavaWalkLeft` is the stat less the seconds stood in lava (`lavaSpent`, it runs down in lava and is whole again out of it). Intentions are still put out by lava (posttraumatic, [practices](../design/built/practices/emotion/POST-TRAUMATIC-GROWTH.md)) |
| `twinCast` | Flag (0 or 1): the two hands take turns casting. `Player.castSide` flips after each shot and `Game.fire()` starts the shot from that side (`hands.ts` swings that arm); weapons that replace the shot swing from the next hand without taking a turn |
| `recipes` | Flag (0 or 1): the Recipe Book opens. `Game.frame` reads it before the `recipes` action opens the screen on the book, `Hud.syncRecipesTab` shows the Recipes tab while it is 1, and `Game.act('tab-recipes')` checks it. Given by the Book of Secrets ([RECIPE-BOOK](../design/built/practices/RECIPE-BOOK.md)); not echoable (its only pool is `roots`) |
| `triad`, `spiral` | Flags (0 or 1) that give each intention a formation of three strands (`IntentSpec.formation`, built by `intentFromStats`): a triangle that widens over the flight, and a helix that turns. See [practices](../design/not-built/practices/README.md) |

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
| `bombBlast` *(react only)* | nothing: `polarity` says a bomb or missile of yours went off negative (a blast) or positive (a love explosion); `acted` lists the practices that already acted on it | one of the player's own bombs or missiles went off, after its blast (never a volatile cube or another item's explosion) |
| `touchCube` | `action`: `'pickup'`, `'kick'` or `'ignore'` | walking into a loose cube (pre-filled from `carry`) |
| `kick` | `speed`, `lift`, `tags`, or cancel | kicking a cube |
| `throw` | `speed`, `lift`, `tags`, or cancel | Q, or right click with nowhere to place |
| `drop` | — (react) | a block leaves your hand (`how`: place or throw) |
| `debrisImpact` | `keepTags` | a tagged cube hits something hard |
| `jump` | `velocity`, or cancel (`air`: the step of an air jump, 1 then 2; absent on the ground) | jumping |
| `land` | — (react) | touching ground after a fall (`fallSpeed` in blocks/s; the feet's position `x, y, z`) |
| `doorOpen` | `needsKey`, or cancel | approaching a door |
| `chestOpen` | `cost` (keys, 0 = free), or cancel | walking up to a closed chest |
| `blockLoot` | `drops` (blocks drop nothing but themselves, except a crate's roll of a key, heart or bomb, at its floor's chance of 10% to 30%) | after a block breaks |
| `burst` *(react only)* | nothing: `source` names the item whose pulse went off (Kindling, Stolen Fire) | a pulse (`ItemApi.pulse`) goes off: damage to the projections in a sphere |
| `bombPlace` | `fuse`, or cancel | pressing E |
| `missileLaunch` | `speed` (steady, blocks/s), `range` (blocks), `polarity` (negative: a bomb blast; positive: a love explosion), or cancel (no bomb is spent) | a quick double tap of the fire control with the `missile` stat, a bomb in the counter and room to arm |
| `pickupCollect` | `amount`, or cancel (`heart` names the kind of a heart other than red; a red heart has none) | collecting a key, bomb or heart |
| `berserkChange` *(react only)* | nothing: `on` says whether the berserker state just started or ended (a berserker heart held or a Berserker Draught drunk) | the berserker state changes |
| `heartLost` *(react only)* | nothing: `heart` is the blue, stone or berserker heart just spent | an extra heart is spent by a hit |
| `actorDamage` *(target required)* | `amount` (damage points; 8 = a heart, 2 = a quarter), `knockback` (for the player, a multiplier of the hurt knockback: 1 by default, 0 takes it away), or cancel (`targetKind`, `kind`, `source`, `owner`, `cause` tell you what it is; `polarity` is set for player intentions, already halved if positive: a positive one cannot kill a projection after your hooks, [ENTITIES.md §5](ENTITIES.md)) | anything hurting the player or a projection |
| `contact` *(target required)* | `toTarget`, `toAttacker` (points) | a projection touching an actor it is hostile to (once per pair every 0.5 s) |
| `heal` | `amount` (points), or cancel | healing |
| `death` | cancel (survive; Waymark cancels it at priority 150 and spends a copy) | the player reaching 0 hearts |
| `actorDeath` *(target required)* | `drops` (react otherwise) | an actor is gone |
| `factionChange` | — (react) | an actor changed side (e.g. a projection became an ally, through polarity or a charm) |
| `polarityChange` | — (react) | the player switched the loaded intention between positive and negative with **F** |
| `enemySpawn` | `hp`, `speed`, `contactDamage` (points), `tags`, position, or cancel | a projection materialising |
| `roomClear` | `drops` | a room cleared |
| `intentElement` | — (react; hooks change the world, not the payload) | an intention enters a water or lava cell, once per entry (`intent`, `x, y, z`, `element`); emitted through `Intents` `entered` (IntentHooks). The element is read again after the hooks: lava a hook made at the intention's cell puts it out. Solve et Coagula converts the connected fluid with `convertFluid` |
| `intentHit` | — (react) | an intention hits a projection (`kind: 'actor'`, `target` its id), a loose cube (`'cube'`, its index) or a block (`'block'`, with the face normal `nx, ny, nz`); `intent` is the intention that hit. A beam or great cut stroke emits it once per projection per stroke (its first contact), never a blade cut |
| `intentBounce` | `vx, vy, vz` (the reflected velocity), `intent` (the spec), `launch` (new intentions) — react or modify, cannot cancel | an intention rebounds off a block: `x, y, z` the bounce point, `nx, ny, nz` the face normal, `bounce` the rebound number (1 for its first). Intentions added to `launch` join after the frame's walk, so launching from here is safe |
| `itemGained`, `roomEnter` | — (react) | as named |
| `floorEnter` *(react)* | nothing: `depth` is the floor entered, `arrival` its arrival point (feet position, the floor's spawn); Waymark moves its checkpoint there |
| `pageReached` | — (react) | a run's end advanced the Roots' page (`page`, the new current page); once per run, never in the sandbox |
| `bossOvercome` | — (react) | a floor's boss was overcome, once per boss room (`boss`, `floor`, `how`: `destroyed` when its health reached zero, `converted` when it turned to your side, `stillness` for the Shadow's own ending, which is a turning) |
| `meditationComplete` | — (react) | a Sanctuary opened by a Boundary (the Roots' chest or a vault's) ended with `complete` (`meditation`, the sitting's id; `source`: `roots` or `vault`; `seconds`: the finished sittings of that visit, each at its full length); never a quick reward, a cancel or the debug console's Sanctuary |
| `cook` | — (react) | a kitchen cooked a part into a meal (`meal`, the potion id; `part`, the part's kind) |
| `brew` | `iced` (set true to ice the flask: Apprenticeship; the alembic reads it back) · else react | an alembic brews a flask (`potion`, `iced`, how many things were in the bulb, where the alembic stands) |
| `drink` | — (react) | the player drinks a flask (`potion`; `rooms` it lasts, 0 when it is not counted in rooms) |
| `playerDied`, `surfaceEnter`, `blockPlaced`, `bookBack`, `bedrockTouch` | — (react) | the achievements' events: a death (`floor`, `source`), the climb into the surface (`from`), a block placed (`afterPact`), the tutorial book turned back (`from`, `page`), bedrock touched (`side`) |
| `projectionConverted`, `projectionDestroyed` | — (react) | a projection turned to your side (`def`, `boss`: true for a boss), or a hostile projection's health reached zero by harm and it died (`def`, `boss`); the achievements of 100 of each, bosses excluded |
| `synergyOn` | — (react) | a practice gained turned a synergy on for the first time in this inventory (`synergy`, its id); the states of being's achievements and the synergies' |
| `presenceMet` | — (react) | a presence is met for the first time on its enemy: its first exchange is done (`presence`, its id); the presences' achievements |

**Actor events** (`actorDamage`, `contact`, `actorDeath`) cover the player and every projection, so a hook on them must say which actors it is for: `hook('actorDamage', fn, { target: 'player' })` (`'player'`, `'projection'` or `'any'`). The inventory skips the others; the validator and a contract test require it. See [ACTORS.md](ACTORS.md).

`explosion` also carries `actorDamage` (damage points to every actor in range), `owner` and `cause` (its chain); `land` carries `cause` (`'fall'` or `'descent'` down a shaft).

The owner's list, mapped: the carry limit is `carry` plus `touchCube`; health is `maxHearts` plus `actorDamage`/`heal`; enemies are `enemySpawn`/`actorDamage`/`contact`; breaking weak blocks on contact is `crush` plus `touchBlock`; what happens when you drop or throw is `throw`, `drop` and `debrisImpact`; jumping and movement are `jump`, `moveSpeed`, `jump`/`land` events.

**Intention shape** is carried by fields on `IntentSpec` that items set in a `fire` hook and the core reads: `volley` (how many intentions one shot launches; the extra ones deal 60% damage and mining and fan out), `bounces` (rebounds off blocks it doesn't break), `homing` (how hard it steers each second) and `homingTarget` (`'block'`, the default: the nearest block within 6 blocks; `'projection'`: the nearest projection within 8 blocks, through `IntentHooks.nearestEnemy`, a negative intention meeting only hostile ones). Items that write `homingTarget` in a `fire` hook at the same priority run in acquisition order, so the one gained last wins (Dowsing and Eye Contact, see [AIM-PRACTICES](../design/built/practices/AIM-PRACTICES.md)). What an intention does when it hits is an `intentHit` hook.

**Formations** (`formation`, set from the `triad` and `spiral` stats) make a shot fly as three strands. Each strand is an ordinary intention with a share of the damage and mining (70% for the triangle, 100% and 40% and 40% for a helix; the shares multiply when both apply). A strand carries an `orbit` that keeps it on its circle around the flight line (`Intents.update`), and it lives 3 seconds where a plain intention lives 6, so three strands per direction stay under the cap of 200 intentions. At the cap the oldest intention is dropped; a stress shot (two Bilaterals, a triangle and Triangulation, 10.8 shots a second) is checked in `tests/multishot.test.ts`.

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
- **Potions** are such a source. A drunk potion's stat modifiers sit on the same stat sheet under `potion:<id>`, one source per potion, installed and removed by `PotionEffects` (`src/game/potion-effects.ts`), never by the inventory. Drinking an active potion again replaces its source and refreshes its count. A potion counted in rooms loses one room per sealed room cleared (never per challenge wave); every potion ends on the next floor entry; a new run clears them all. Potions have no hooks yet: the Questioning Tincture's lock is read by the core at the door and the chest. The Rebirth Draught (`rebirth: true`) is the one potion the core treats apart: drinking it opens the offer card (`Game.askRebirth`), no `drink` event is emitted for it, and a yes starts a new run that keeps the held practices through `Inventory.serialize()`/`restore()`, never through `onGain` (`docs/design/built/practices/potions/IN-HAND-AND-REBIRTH.md`).
- `onGain` runs once, from `gain()`. Rebuilds and restores never run it again.
- `gain()` returns the stat diff and the synergies that just switched on; the HUD shows both in the pickup banner.
- Picking up a duplicate is allowed (two instances, stats stack).

## 7. Storing

- **Definitions** are code (TypeScript modules), versioned with the game.
- **A player's items** are ids in acquisition order: `inventory.serialize() → ['kaizen', 'deepfocus']`, `restore(ids)` rebuilds everything (and warns about unknown ids).
- **Weapons**: an item or synergy may declare `weapon: { id, priority }` to replace the intention (Cut Ties with Toxic Relationships → blade, Remember Breathing → beam, One Clear Cut → great cut). The inventory resolves the active weapon on every rebuild; see [WEAPONS.md](WEAPONS.md).
- **Pools** (`ItemPools`) are per run: weighted draws without replacement from the `loot` RNG stream. Treasure rooms draw from `treasure`, the locked vault from `vault`, the boss room's pedestal from `boss` (both falling back to `treasure`). Every pedestal, boss rooms included, is reserved at run start (`pedestalSlots` in `world/floor.ts`). Three pools are never drawn: `sky` (the sky realm's gifts, handed out by id), `covenant` (the Covenant's pieces held as items, today the Mender's Thread) and `roots` (the Roots' mastery table's gifts, laid by id on their fixed pedestal, today the Book of Secrets; `isRootsGift`). Adding a `roots` item moves no seed: `ItemPools` leaves it out of every draw and fallback. A `covenant` item is **promised** (`isPromised` in `items/pool.ts`): no toll offers or accepts it, a sky capture never takes it, and no presence table lists it. Each of the three must be an item's only pool (the validator refuses a mix).

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
