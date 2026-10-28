# Entities: health, bombs, enemies, pickups and stacked floors

Status: **built (M1.5)**, after the three-party review in [../reviews/entities.md](../reviews/entities.md). Builds on the item architecture in [ITEMS.md](ITEMS.md) and the story in [../design/STORY.md](../design/STORY.md).

## 1. Stacked floors (`world/floor.ts`)

- One `VoxelWorld` (119 × 268 × 77) holds the whole dungeon: **10 floors (0–9) on 16-block bands** ([LEVELS.md](LEVELS.md)), deep rock and bedrock below, dirt, grass and **100 blocks of open sky** above (`SKY_LIMIT`: the build limit). Above floor 0's band, `bandOf` returns `SURFACE` (−1) to the structure, and `depthOf` returns **0** to anything that asks how deep you are (the surface counts as depth 0).
  - Floor *k* (1 = top) has its room interiors at `floorY(k) = 8 + (4 − k) · 16`: 56, 40, 24, 8. `bandOf(y)` maps a height to its floor.
  - Rock between floors gets harder with depth: stone and dirt (floors 1–2), stone and deepstone (3), deepstone and obsidian (4).
- `createDungeonWorld(seed)` fills the whole column once per run. `carveFloor(world, rng, k, opts)` carves one floor with **per-floor RNG streams** (`floor<k>:plan`, `:rooms`, `:loot`, `:enemies`), so a floor's layout never depends on when it was carved. Pedestal items are drawn at carve time, so a seed always gives the same items.
- **One floor ahead**: floor 1 and 2 are carved at run start; floor *k+1* is carved when you arrive on floor *k*. You can never dig into a band that will be overwritten later.
- **Activation = "the next floor loads"**: when you enter floor *k*'s boss room, floor *k+1* is activated (its doors, pedestals and keys appear). Digging into a deeper band also activates it.
- **Going down by gravity**: floor *k+1*'s plan starts **right under floor *k*'s boss room** (`generatePlan(rng, opts, startCell)`, with a fallback that relaxes the room count for edge and corner starts). A **boss room seals** when you enter it, after a short rumble its boss rises from a spawn point (announced by an omen), and the way down is **closed until the boss is overcome** (`Game.bossDown`, §5.4). Then the boss's practice appears on the room's pedestal (popping in with light and a chime), the four floor blocks over a **2×2 shaft** crack (the telegraph) and the shaft opens into the start room below. **The floor never opens under the player**: while you stand or hover over the 2×2, it waits, trickling dust, and a toast tells you to step aside; it opens the moment you step off. You walk in and fall; `land` fires with `cause: 'descent'`. Floor 0 is peaceful and has no boss: its way down opens on entry, as before.
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

- Kinds: `key`, `bomb`, `heart`, `item` (pedestals), and `part` (a projection's part, `content/parts.ts`, BESTIARY §5.7). Floor pickups fall until they rest on something solid (re-checked each frame, so they drop if the floor breaks) and bob and spin.
- A **part** is not an item: it has no effect and never enters `Inventory`. Touching one pushes its id onto `Game.parts` (run state, reset on a new run, no cap). Each projection rolls its parts when it dies, on its own RNG path (RNG.md §4), with chances 30 / 12 / 5 / 2 % for flesh, mind, heart and essence. The inventory lists them after the items, with the same tile and name label.
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

The roster holds 40 projection entries in `content/enemies/` (38 files; Procrastination's two lineage forms live in its own file), weighted by floor in `content/tables/enemies.ts`. The table above shows the first three; the rest use the same definition and factories, and each one's pattern and zone is in [BESTIARY §5](../design/BESTIARY.md).

### Spawning and rooms

> As built today. The owner's direction (doors slam, spawn points around the room announced by omens and spatial sound, waves) is in [../design/BESTIARY.md §2](../design/BESTIARY.md) and is built. What is not built is listed in [BESTIARY §12.1](../design/BESTIARY.md).

- At carve time each normal room gets a roster from `ENEMY_BUDGET` (budget 2 + floor, 1 room in 5 is quiet).
- **Sealing and slam**: when the player's box is **fully inside** a room interior, its doors close and stay sealed, and each door slams with its own spatial sound and dust (`slamDoors`, `spatial.slam`). The first wave starts after a 0.5 s breath.
- **Omens at spawn points** (`game/omens.ts`, BESTIARY §2): a wave is announced before it exists. Each projection opens an omen at a seeded floor cell of the room: never within 3 blocks of a door, preferably 3.5 blocks from the player (the farthest cell otherwise). The omen gathers cold motes for 1.0 s with a spatial hum from its point, then cracks (a breach sound and a burst) for 0.2 s, and the projection materialises there. Harmless and unhittable until then. Walls, ceilings and liquids as spawn points are not built yet.
- **Waves**: a normal room's roster splits into waves of at most 3 (`splitWaves`). The next wave opens once the last one has one projection left (or the room is empty), after a 1.5 s breath and an unpositioned swell. Clear needs the last wave down, no open omen and no queued blast.
- **Every spawn goes through `enemySpawn`** (hp, speed, contact damage, tags, position all mutable).
- **Leash**: projections belong to their room; one that leaves it walks back to the centre.
- **Clear**: when no hostile projection of the room is left (wherever it went; allies don't count), the doors unseal, `roomClear { drops }` fires and the reward (if any) appears at the centre. If you dig out of a sealed room, its doors stay shut until it's cleared, and seal again when you're back inside.

### Kinds of beings (BESTIARY §1)

Every enemy definition has a `kind`: `projection` (hostile, released when beaten), `creature` (neutral, alive, never killed by a hit) or `boss` (a projection with phases and a health bar). Creatures are `neutral` and nothing targets them; bosses are projections whose health is set by their floor (`content/bosses` `bossHp`, about 140 on floor 1 and 1000 on floor 9, a geometric curve of about ×1.28 a floor; the open question is in [BESTIARY §12.1](../design/BESTIARY.md)).

### Attacks (`enemies/attacks.ts`)

Every attack is one **shape** with one telegraph (BESTIARY §3.2): a **line** (a charge or a beam), a **ring** (a leap landing, a shockwave), a **field** (`slow`, `mute` or `sting`, while you stand in it), a **pull** (a tether or wind toward its source) or a **sweep** (a wall that crosses the room). A shape is drawn as cold motes for its `lead` seconds (the announcement, dim), then it is live for `live` seconds (white) and hurts each target once. Fields and pulls act while you stand in them. Hazards are drawn by one instanced mesh and hit through the damage pipeline (`hurtActor`) and the player's statuses (`affectActor`: a slowed walk, a silence that stops casting, toast `toast.muted`). Bolts are straight cold cubes (`ctx.bolt`); lobs keep their arc (`ctx.shootAt`).

Movement classes live in `enemies/behaviours.ts`: `chase` and `wander` (walkers), `ranged`, `burst`, `flee`, `leap` (crouch, aim where you stand, land with a ring and crack the soft floor), `charge` (a line, then a run that smashes soft blocks, and a stun when it meets a hard one), `patrol` (a fixed loop), `emitter` (stationary, fires on a rhythm), `phase` (through blocks), `sleep` (asleep until moved), `phased` (a boss's phases) and `chirp` (sings while its room is quiet). A flyer keeps a height (`flyY`), a phaser or burrower moves through blocks (`ghost`). `ctx.quiet`, `ctx.safe`, `ctx.centre` and `ctx.bounds` read the room; `wobble(id, seq, k)` is the seeded choice a being makes (never cosmetic `fx`).

### Creatures (`content/creatures/`)

Eleven kinds (BESTIARY §7.2), placed per floor by `CREATURE_LIFE` from the floor's own fork (`ambientCreatures`): Wonders, Rootlings and Mosslings on floor 0, Chirpers and Delvers on floors 1–3, Bubblers and Ferrybacks on 3–4, Drifters and Inkmites on 5–6, Cinderwalkers on 7–8, Huddlers on 9. They are spawned when their floor loads, outside every roster, so they never seal a room or count for clearing it.

- **Sealing**: when a room seals, its creatures hide in the blocks (`Enemies.hideRoom`, neither drawn nor hittable), and they come back whole when it clears.
- **Polarity** (§1.1): a positive intention heals them, and a creature healed to full gives a heart once (`gifted`). A negative intention that would kill one sends it into the blocks instead (`Enemies.hurt`): it never dies.
- **Blasts** only push creatures; fire and lava still hurt them, so they must avoid it.
- **Chirpers** sing every few seconds only while their room is quiet (no projection alive): their silence is the warning.
- **Mosslings** heal a quarter heart the first time you sit still beside one for three seconds (`Game.updateRest`).

### Bosses (`content/bosses/`, `Game.updateBossRoom`)

- **One per floor**, drawn from its zone's pool with the run's fork `floor<k>:boss` and never met twice in one run (`bossFor`). Floors 5 and 9 are keystones: the Threshold Guardian and the Shadow. Zones: I (1–2) Resistance, Inertia, The Insatiable; II (3–4) Overwhelm, The Hoard, The Downpour; III (6) The Verdict, The Grudge, The Old Rule; IV (7–8) The Furnace, The Impostor, The Many Faces.
- **The room**: entering seals the doors (`doors.seal`), a rumble, then the boss rises at a spawn point of the room (`summonBoss`). Its health shows in the bar at the top while you are in the room (`Hud.bossBar`).
- **Phases** (`phased`): at 2/3 and 1/3 of its health the boss stops for `PHASE_HOLD` seconds, its arena changes by name (`Game.bossArena`: walls rise, water floods or drains, fire catches, loose cubes spill or fall, the toast says what happened, `boss.<id>.phase.<n>`), and the next phase's behaviour takes over.
- **Overcome**: its death (or, for the Guardian, its turning to your side: the route of light) calls `bossDown`. The room unseals, the boss's practice appears on the pedestal, and the way down starts to crack.
- **Route of light** (Threshold Guardian, BESTIARY §6.5): positive intentions fill its warmth and it turns to your side. The route of shadow fights it. Both open the same way down (the design's separate hole beside the pit is not built yet).
- **The Shadow** wins by standing still beside it for three seconds: it shrinks into your hands (`ctx.kill`).
- **Inertia** is asleep: it takes knockback only (bombs, kicks) until it moves at a speed of 1.5 blocks a second.

### Navigation (`enemies/flowfield.ts`)

A **flow field per room and target**: BFS over the 13×7 interior from the target's cell, with each cell's standing height (first free 2-block gap) and steps of at most one block; diagonals don't cut corners. It's rebuilt only when the target changes cell or the world or its elements change (`VoxelWorld.version`, `elemVersion`). Outside the room, steering is a straight line.

**Terrain it avoids** (lava and fire for everyone, water for those that avoid it, `ElementSense.path: 'avoid'`) is never walked into:

- The flow field leaves avoided cells and every cell **within two blocks** of them out of the route (lava flows about three blocks a second, faster than a walker). A projection that stands within that margin steps back out (`FlowField.unsafe`, `escape`) before the front reaches it.
- Sideways motion is blocked by avoided cells (`moveBody(..., walls)`), but falling is not: knockback can still drop a projection in, and a lift over lava never lands on it (`avoidWalls` lifts while it stands in one, so it can climb out).
- A hop only goes over a solid block, never over what it avoids. With no route, a projection waits at the shore instead of walking straight through the lava.

**Breaking blocks** (`EnemyDef.breaks`): a projection with `breaks: { tier, power }` smashes the first solid block that stops it, if its material tier is at most `tier` and it is not unbreakable (never lava, never bedrock or chests). Damage goes through the normal block pipeline (`EnemyHost.smash`), so armour, cracks and loose cubes behave as for any other blow. Chargers, burrowers and leapers use it (BESTIARY §3.3).

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

Status (2026-10-28): Scarcity, Isolation, Comparison, Hall of Mirrors, Shortcut, Avoidance, Perfectionism and Procrastination are in the game in simpler form than designed (per-entry notes in [BESTIARY §12.1](../design/BESTIARY.md)). Rooted variants, the swimmer and mounted movement classes, and presences are not built.

Projection looks follow the art guide's final specs (Doubt, the Lectern, Panic: [../art/ART-GUIDE.md](../art/ART-GUIDE.md) §8, §15). Models are whole-texel boxes (`TX` in `enemies/types.ts`) and may be parented (`parent: 'head'`) so faces follow a tilted head; parts named `tell` or `core` are the telegraph and brighten toward cold white with `pulse`. `Enemy.armed` is false while a projection can't hurt by touch (Doubt before its 0.5 s reach).
| E1 | Chests: keys and treasures move into them ([ELEMENTS.md](ELEMENTS.md)) |
