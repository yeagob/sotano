# Entities: health, bombs, enemies, pickups and stacked floors

Status: **built (M1.5)**, after the three-party review in [../reviews/entities.md](../reviews/entities.md). Builds on the item architecture in [ITEMS.md](ITEMS.md) and the story in [../design/STORY.md](../design/STORY.md).

## 1. Stacked floors (`world/floor.ts`)

- One `VoxelWorld` (119 × 72 × 77) holds the whole dungeon: **4 floors on 16-block bands**, deep rock and bedrock below, dirt, grass and sky above.
  - Floor *k* (1 = top) has its room interiors at `floorY(k) = 8 + (4 − k) · 16`: 56, 40, 24, 8. `bandOf(y)` maps a height to its floor.
  - Rock between floors gets harder with depth: stone and dirt (floors 1–2), stone and deepstone (3), deepstone and obsidian (4).
- `createDungeonWorld(seed)` fills the whole column once per run. `carveFloor(world, rng, k, opts)` carves one floor with **per-floor RNG streams** (`floor<k>:plan`, `:rooms`, `:loot`, `:enemies`), so a floor's layout never depends on when it was carved. Pedestal items are drawn at carve time, so a seed always gives the same items.
- **One floor ahead**: floor 1 and 2 are carved at run start; floor *k+1* is carved when you arrive on floor *k*. You can never dig into a band that will be overwritten later.
- **Activation = "the next floor loads"**: when you enter floor *k*'s boss room, floor *k+1* is activated (its doors, pedestals and keys appear). Digging into a deeper band also activates it.
- **Going down by gravity**: floor *k+1*'s plan starts **right under floor *k*'s boss room** (`generatePlan(rng, opts, startCell)`, with a fallback that relaxes the room count for edge and corner starts). 1.5 s after entering the boss room (there's no boss yet), a **2×2 shaft** opens from the boss room floor straight into the start room below. You walk in and fall; `land` fires with `cause: 'descent'`.
- **Depth**: `depth` is the band you're in now; `maxDepth` the deepest reached. `floorEnter` fires only when going deeper (climbing back up and dropping again doesn't re-trigger it). On `floorEnter` the deferred chain-reaction queue is cleared.
- **Room ids are global**: `floor × 100 + index`. One `Doors` and one `Pickups` hold every activated floor; floors above keep their state.
- Rendering only draws chunk rows within ±22 blocks of the eye; fog switches to sky colours near `SURFACE_Y` (71).

## 2. Health (`entities/player.ts`, `game/game.ts`)

- Half-hearts in `player.hp`; containers are the **`maxHearts` stat** (base 3), so an item that grants a container takes it away again when lost.
- Every hit goes through **`playerDamage { amount, kind, source, owner }`** (cancellable). After a hit you're invulnerable for the **`invuln` stat** (1 s) and the HUD shows a red vignette and a shake.
- **`heal { amount, source }`** before healing; hearts on the floor are only picked up when you're hurt (Isaac rule).
- At 0: **`death { source }`** (cancellable: a future "second chance" item). Otherwise the death screen shows the floor reached and your practices; R starts again.
- **Owners**: `'player'`, `'world'` or `` `enemy:${uid}` ``. Radical Acceptance cancels damage whose owner is the player and kind is `explosion` (your own bombs).

## 3. Pickups (`entities/pickups.ts`)

- Kinds: `key`, `bomb`, `heart`, and `item` (pedestals). Floor pickups fall until they rest on something solid (re-checked each frame, so they drop if the floor breaks) and bob and spin.
- Collecting goes through **`pickupCollect { kind, amount }`** (mutable amount; cancel to leave it). Counters cap at 99. Keys and bombs show top-left with hearts, Isaac-style.
- **Breaking blocks drops nothing but the block** (owner decision): `blockLoot` fires with an empty `drops` list so an item can add some. Keys and treasures are moving into **chests** ([ELEMENTS.md §7](ELEMENTS.md)). Today the floor's key for the vault sits on a key spot, and cleared rooms may drop a heart, bomb or key (40%, raised by `luck`).

## 4. Bombs ("breakthroughs")

- Start with 1. **E** drops one at your feet through **`bombPlace { fuse }`**.
- A bomb **is a loose cube** (material `bomb`) with a fuse in `DebrisSystem.fuse`: it falls, stacks, can be kicked (walking into a bomb always kicks it) and is pushed by explosions. Bombs are **pinned**: never recycled by the ring buffer and never aged out.
- When the fuse ends: `explode()` with the **`bombRadius`** (2.6) and **`bombDamage`** (40) stats, owner `player`. Bombs caught in a blast go off almost at once (chains).
- `explosion { radius, damage, actorDamage, source, owner }`: damages blocks (with falloff), deals `actorDamage` half-hearts to the player and ×4 HP to enemies in range, pushes cubes, shakes the screen.

## 5. Enemies: projections (`enemies/`, `entities/enemies.ts`, `content/enemies/`)

### Definition (one file each)

```ts
defineEnemy({
  id: 'doubt', name: 'Doubt', pattern: 'Self-doubt',
  hp: 12, speed: 1.7, size: [0.32, 1.6], contactDamage: 1,
  cost: 1, minFloor: 1,
  drops: { heart: 0.12, key: 0.04, bomb: 0.05 },
  behaviour: chase({ lunge: 1.5 }),
  model: [ { size, pos, color, glow?, tilt?, name? }, ... ],   // a body of cubes
  onDeath?(e, ctx) { ... },
});
```

- **Behaviours are factories** (`enemies/behaviours.ts`): `chase`, `ranged`, `burst`. Each returns a small state machine that sets the enemy's wish direction, winds up, shoots or bursts. New patterns (splitting, armour, mirroring) are new factories or an `onDeath`, never a switch in the system.
- **Models** are lists of boxes; named parts (`legL`, `armR`, `head`…) get a walk cycle. Hits flash white; winding up and swelling glow red.

| Enemy | Pattern | Behaviour |
|---|---|---|
| **Doubt** | Self-doubt | `chase`: walks at you and lunges when close; drains half a heart on touch |
| **Inner Critic** | The judging voice | `ranged`: keeps ~6 blocks away, strafes, winds up and lobs a "judgement" that arcs onto you (breaks soft blocks) |
| **Panic** | Anxiety spiralling into panic | `burst`: rushes you, swells for 0.9 s and explodes, breaking blocks (and hurting other projections) |

### Spawning and rooms

- At carve time each normal room gets a roster from `ENEMY_BUDGET` (budget 2 + floor, 1 room in 5 is quiet).
- **Sealing**: when the player's box is **fully inside** a room interior, its doors close and stay sealed. Spawns start 0.5 s later, one every 0.45 s.
- **Spawning from the centre, visibly**: each projection materialises at the room's **centre column on the first free height**, over 0.9 s (cubes converge, it grows from nothing), harmless and unhittable meanwhile; then it steps off the spot. If you're standing on the centre (you fell or dug in), it appears beside you, never at the doors.
- **Every spawn goes through `enemySpawn`** (hp, speed, contact damage, tags, position all mutable).
- **Leash**: projections belong to their room; one that leaves it walks back to the centre.
- **Clear**: when every projection of the room is gone (wherever it went), the doors unseal, `roomClear { drops }` fires and the reward (if any) appears at the centre. If you dig out of a sealed room, its doors stay shut until it's cleared, and seal again when you're back inside.

### Navigation (`enemies/flowfield.ts`)

A **flow field per room**: BFS over the 13×7 interior from the player's cell, with each cell's standing height (first free 2-block gap) and steps of at most one block; diagonals don't cut corners. It's rebuilt only when the player changes cell or the world changes (`VoxelWorld.version`). Outside the room, steering is a straight line. Blocked enemies hop up one block.

### Combat events

- `enemyDamage { uid, def, amount, kind, source, owner, knockback }` before any damage (intentions, explosions, contact).
- `enemyContact { uid, def, toPlayer, toEnemy }` when touching the player (thorns, Open-hearted…).
- `enemyDeath { uid, def, x, y, z, drops }`; the source `enemy:<uid>` is removed from the bus on death (reserved for enemy-owned hooks, M2).

## 6. Events added in this milestone

`blockLoot`, `bombPlace`, `playerDamage`, `heal`, `death`, `pickupCollect` (replaces `keyPickup`), `enemySpawn`, `enemyDamage`, `enemyContact`, `enemyDeath`, `roomClear`; `explosion` gained `actorDamage` and `owner`; `land` gained `cause`; `touchCube` gained `bomb`; `IntentSpec` gained `tags`. All are in the contract test and the synergy matrix.

## 7. Stats added

`maxHearts` (3), `invuln` (1 s), `bombRadius` (2.6), `bombDamage` (40).

## 8. Deferred (from the review)

| When | What |
|---|---|
| M2 | Enemy-owned hooks (Comparison mirrors your intentions), installed as `enemy:<uid>` |
| M2 | Procrastination (splits on death), Perfectionism (armour shell), bosses made of breakable voxels |
| E1 | Chests: keys and treasures move into them ([ELEMENTS.md](ELEMENTS.md)) |
