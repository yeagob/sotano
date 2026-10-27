# Entities: health, bombs, enemies, pickups and stacked floors

Status: **built (M1.5)**, after the three-party review in [../reviews/entities.md](../reviews/entities.md). Builds on the item architecture in [ITEMS.md](ITEMS.md) and the story in [../design/STORY.md](../design/STORY.md).

## 1. Stacked floors (`world/floor.ts`)

- One `VoxelWorld` (119 × 268 × 77) holds the whole dungeon: **10 floors (0–9) on 16-block bands** ([LEVELS.md](LEVELS.md)), deep rock and bedrock below, dirt, grass and **100 blocks of open sky** above (`SKY_LIMIT`: the build limit). Above floor 0's band, `bandOf` returns `SURFACE` (−1) to the structure, and `depthOf` returns **0** to anything that asks how deep you are (the surface counts as depth 0).
  - Floor *k* (1 = top) has its room interiors at `floorY(k) = 8 + (4 − k) · 16`: 56, 40, 24, 8. `bandOf(y)` maps a height to its floor.
  - Rock between floors gets harder with depth: stone and dirt (floors 1–2), stone and deepstone (3), deepstone and obsidian (4).
- `createDungeonWorld(seed)` fills the whole column once per run. `carveFloor(world, rng, k, opts)` carves one floor with **per-floor RNG streams** (`floor<k>:plan`, `:rooms`, `:loot`, `:enemies`), so a floor's layout never depends on when it was carved. Pedestal items are drawn at carve time, so a seed always gives the same items.
- **One floor ahead**: floor 1 and 2 are carved at run start; floor *k+1* is carved when you arrive on floor *k*. You can never dig into a band that will be overwritten later.
- **Activation = "the next floor loads"**: when you enter floor *k*'s boss room, floor *k+1* is activated (its doors, pedestals and keys appear). Digging into a deeper band also activates it.
- **Going down by gravity**: floor *k+1*'s plan starts **right under floor *k*'s boss room** (`generatePlan(rng, opts, startCell)`, with a fallback that relaxes the room count for edge and corner starts). 1.5 s after entering the boss room (there's no boss yet, so it counts as overcome), two things happen: the **boss's practice** appears on the room's pedestal (reserved at run start from the `boss` pool, popping in with light and a chime), and a **2×2 shaft** opens from the boss room floor straight into the start room below. During those 1.5 s the four floor blocks over the shaft show real crack stages (the telegraph). **The floor never opens under the player**: while you stand or hover over the 2×2, it waits, trickling dust, and a toast tells you to step aside; it opens the moment you step off. You walk in and fall; `land` fires with `cause: 'descent'`.
- **Depth**: `depth` is the band you're in now; `maxDepth` the deepest reached. `floorEnter` fires only when going deeper (climbing back up and dropping again doesn't re-trigger it). On `floorEnter` the deferred chain-reaction queue is cleared.
- **Room ids are global**: `floor × 100 + index`. One `Doors` and one `Pickups` hold every activated floor; floors above keep their state.
- Rendering only draws chunk rows within ±22 blocks of the eye; fog switches to sky colours near `SURFACE_Y` (71).

## 2. Health (`entities/player.ts`, `game/game.ts`)

- Damage points in `player.hp` (a heart is 8 points); containers are the **`maxHearts` stat** (base 3), so an item that grants a container takes it away again when lost. The HUD draws hearts in **quarters** (2 points each).
- The player is an **actor** like every projection ([ACTORS.md](ACTORS.md)). Every hit goes through **`actorDamage`** (cancellable) in damage points: the player loses exactly those points, so small damage reductions count. After a hit you're invulnerable for the **`invuln` stat** (1 s) and the HUD shows a red vignette and a shake.
- **`heal { amount, source }`** before healing; hearts on the floor are only picked up when you're hurt (Isaac rule).
- At 0: **`death { source }`** (cancellable: a future "second chance" item). Otherwise the death screen shows the floor reached and your practices; R starts again.
- **Owners**: an actor id or `'world'` (`api.isPlayer(owner)` asks whether it was the player). Radical Acceptance cancels damage to the player whose owner is the player and kind is `explosion` (your own bombs), and only that: its hook targets the player.

## 3. Pickups (`entities/pickups.ts`)

- Kinds: `key`, `bomb`, `heart`, and `item` (pedestals). Floor pickups fall until they rest on something solid (re-checked each frame, so they drop if the floor breaks) and bob and spin.
- Collecting goes through **`pickupCollect { kind, amount }`** (mutable amount; cancel to leave it). Counters cap at 99. Keys and bombs show top-left with hearts, Isaac-style.
- **Breaking blocks drops nothing but the block** (owner decision): `blockLoot` fires with an empty `drops` list so an item can add some. Keys and treasures are moving into **chests** ([ELEMENTS.md §7](ELEMENTS.md)). Today the floor's key for the vault sits on a key spot, and cleared rooms may drop a heart, bomb or key (40%, raised by `luck`).

## 4. Bombs ("breakthroughs")

- Start with 1. **E** drops one at your feet through **`bombPlace { fuse }`**.
- A bomb **is a loose cube** (material `bomb`) with a fuse in `DebrisSystem.fuse`: it falls, stacks, can be kicked (walking into a bomb always kicks it) and is pushed by explosions. Bombs are **pinned**: never recycled by the ring buffer and never aged out.
- When the fuse ends: `explode()` with the **`bombRadius`** (2.6) and **`bombDamage`** (40) stats, owned by the player. Bombs caught in a blast go off almost at once (chains).
- Explosions are queued and run at most 8 per frame; chains stop at 12 links ([ACTORS.md §1](ACTORS.md#1-chain-safety)).
- `explosion { radius, damage, actorDamage, source, owner, cause }`: damages blocks (with falloff), deals `actorDamage` (8 points: one heart to the player) to every actor in range, whatever its side, pushes cubes, shakes the screen.

## 5. Enemies: projections (`enemies/`, `entities/enemies.ts`, `content/enemies/`)

### Definition (one file each)

```ts
defineEnemy({
  id: 'doubt', name: 'Doubt', pattern: 'Self-doubt',
  hp: 12, speed: 1.7, size: [0.32, 1.6], contactDamage: 4,   // damage points (4 = half a heart)
  cost: 1, minFloor: 1,
  drops: { heart: 0.12, key: 0.04, bomb: 0.05 },
  behaviour: chase({ lunge: 1.5 }),
  model: [ { size, pos, color, glow?, tilt?, name? }, ... ],   // a body of cubes
  onDeath?(e, ctx) { ... },
});
```

- **Behaviours are factories** (`enemies/behaviours.ts`): `chase`, `ranged`, `burst`. Each returns a small state machine that sets the enemy's wish direction, winds up, shoots or bursts. Behaviours never look for the player: they ask `ctx.target(e)` for the nearest actor hostile to them and idle without one ([ACTORS.md §4](ACTORS.md#4-factions)). New patterns (splitting, armour, mirroring) are new factories or an `onDeath`, never a switch in the system.
- **Models** are lists of boxes; named parts (`legL`, `armR`, `head`…) get a walk cycle. Hits flash white; winding up and swelling glow red.

| Enemy | Pattern | Behaviour |
|---|---|---|
| **Doubt** | Self-doubt | `chase`: walks at you and lunges when close; drains half a heart on touch |
| **Inner Critic** | The judging voice | `ranged`: keeps ~6 blocks away, strafes, winds up and lobs a "judgement" that arcs onto you (breaks soft blocks) |
| **Panic** | Anxiety spiralling into panic | `burst`: rushes you, swells for 0.9 s and explodes, breaking blocks (and hurting other projections) |

### Spawning and rooms

> As built today. The owner's new direction (doors slam, spawn points around the room announced by omens and spatial sound, waves) is designed in [../design/BESTIARY.md §2](../design/BESTIARY.md) and not built yet.

- At carve time each normal room gets a roster from `ENEMY_BUDGET` (budget 2 + floor, 1 room in 5 is quiet).
- **Sealing and slam**: when the player's box is **fully inside** a room interior, its doors close and stay sealed, and each door slams with its own spatial sound and dust (`slamDoors`, `spatial.slam`). The first wave starts after a 0.5 s breath.
- **Omens at spawn points** (`game/omens.ts`, BESTIARY §2): a wave is announced before it exists. Each projection opens an omen at a seeded floor cell of the room: never within 3 blocks of a door, preferably 3.5 blocks from the player (the farthest cell otherwise). The omen gathers cold motes for 1.0 s with a spatial hum from its point, then cracks (a breach sound and a burst) for 0.2 s, and the projection materialises there. Harmless and unhittable until then. Walls, ceilings and liquids as spawn points are not built yet.
- **Waves**: a normal room's roster splits into waves of at most 3 (`splitWaves`). The next wave opens once the last one has one projection left (or the room is empty), after a 1.5 s breath and an unpositioned swell. Clear needs the last wave down, no open omen and no queued blast.
- **Every spawn goes through `enemySpawn`** (hp, speed, contact damage, tags, position all mutable).
- **Leash**: projections belong to their room; one that leaves it walks back to the centre.
- **Clear**: when no hostile projection of the room is left (wherever it went; allies don't count), the doors unseal, `roomClear { drops }` fires and the reward (if any) appears at the centre. If you dig out of a sealed room, its doors stay shut until it's cleared, and seal again when you're back inside.

### Navigation (`enemies/flowfield.ts`)

A **flow field per room and target**: BFS over the 13×7 interior from the target's cell, with each cell's standing height (first free 2-block gap) and steps of at most one block; diagonals don't cut corners. It's rebuilt only when the target changes cell or the world changes (`VoxelWorld.version`). Outside the room, steering is a straight line. Blocked enemies hop up one block.

### Intention polarity (`combat/polarity.ts`, `game/game.ts`)

The rules are pure functions (`intentDamage`, `intentCeiling`, `warmthAfter`, `allyHeal`, `convertedHp`, `relapseHp`, `meetsIntention`, `resolveHit`); `Game` applies their result inside the one damage pipeline (`damageActor`), after the `actorDamage` hooks. Constants: `POSITIVE_DAMAGE` 0.5, `WARMTH_PER_HIT` 0.2, `WARMTH_COOL` 0.25, `ALLY_HEAL` 0.5, `TURN_HP` 0.5. Review and ruling: [reviews/polarity.md](../reviews/polarity.md).

- **Loaded:** `Game.polarity` (positive at the start of each run), switched by **F** (`togglePolarity`), with `polarityChange`. Shots carry it in `IntentSpec.polarity`; weapon strokes carry it in `strike.polarity`, and every hit of a stroke follows it.
- **Halving and the ceiling.** A positive intention halves its damage before `actorDamage` (`polarity` in that payload says so). After the hooks, a positive hit never takes a projection's last point (`intentCeiling`). Negative hits are full damage; a kill is a release, as before.
- **Warmth.** `Enemy.warmth` (0 to 1): +0.2 per positive hit, −0.25 per negative hit, once per target per stroke. At 1 the projection converts: `setFaction(e, 'self', 'polarity')`, with its health raised to at least half its maximum.
- **Allies.** Positive intentions heal them (`allyHeal`, half the damage, never past the maximum) and pass them when healthy (`meetsIntention`); negative ones hit them at full damage. At zero under a negative intention an ally relapses: `setFaction(e, 'projection', 'polarity')` with half its maximum health, warmth 0. Nothing reseals a room.
- **Cancelled hits** (an item cancels `actorDamage`) give no warmth and no conversion.
- **Still not polarity:** bombs, blasts, lava, fire, kicks and contact keep today's damage. A projection they kill is released; an ally they kill is released too.

### Combat events

These were merged into the actor events in P0 ([ACTORS.md](ACTORS.md)):

- `actorDamage { target, targetKind, def, amount, kind, source, owner, knockback, cause? }` before any damage to any actor (intentions, explosions, contact, projectiles).
- `contact { attacker, attackerDef, target, targetKind, toTarget, toAttacker }` when a projection touches an actor it is hostile to, at most once per pair every 0.5 s (thorns, Forgiveness…).
- `actorDeath { target, targetKind, def, x, y, z, drops }` (react only); the source `actor:<id>` is removed from the bus on death (reserved for actor-owned hooks).
- `factionChange` when a projection changes side (`S.charm()` in the console, or a converted projection or relapsed ally: source `polarity`).
- `polarityChange { from, to }` when the player switches the loaded intention with **F** (react only).

## 6. Events added in this milestone

`blockLoot`, `bombPlace`, `playerDamage`, `heal`, `death`, `pickupCollect` (replaces `keyPickup`), `enemySpawn`, `enemyDamage`, `enemyContact`, `enemyDeath`, `roomClear`; `explosion` gained `actorDamage` and `owner`; `land` gained `cause`; `touchCube` gained `bomb`; `IntentSpec` gained `tags`. All are in the contract test and the synergy matrix.

## 7. Stats added

`maxHearts` (3), `invuln` (1 s), `bombRadius` (2.6), `bombDamage` (40).

## 8. Deferred (from the review)

| When | What |
|---|---|
| M2 | Enemy-owned hooks (Comparison mirrors your intentions), installed as `actor:<id>` |
| M2 | Procrastination (splits on death), Perfectionism (armour shell), bosses made of breakable voxels |

Projection looks follow the art guide's final specs (Doubt, the Lectern, Panic: [../art/ART-GUIDE.md](../art/ART-GUIDE.md) §8, §15). Models are whole-texel boxes (`TX` in `enemies/types.ts`) and may be parented (`parent: 'head'`) so faces follow a tilted head; parts named `tell` or `core` are the telegraph and brighten toward cold white with `pulse`. `Enemy.armed` is false while a projection can't hurt by touch (Doubt before its 0.5 s reach).
| E1 | Chests: keys and treasures move into them ([ELEMENTS.md](ELEMENTS.md)) |
