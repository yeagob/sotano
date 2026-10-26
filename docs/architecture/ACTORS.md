# Actors, damage and factions

Status: **built** (P0 of [../reviews/stress-test.md](../reviews/stress-test.md)), after the three-party review in [../reviews/actors.md](../reviews/actors.md).

These refactors make the game ready for clones, friendly projections, enemies that use effects and separate block and actor damage, without changing how a normal run plays. They landed as four steps:

1. **Chain safety**: the bus fails closed at depth; explosions are queued and budgeted, and carry a `Cause`.
2. **Split damage**: actor damage and block damage are separate numbers everywhere.
3. **Actors**: the player and every projection are `Actor`s in one registry, with one damage unit, one damage event and one contact event.
4. **Factions**: who is hostile to whom; projections go after the nearest hostile actor; a room is clear when no hostile projection is left in it.

## 1. Chain safety

**Problem.** Past `MAX_DEPTH` (8) nested emits, the bus ran events *without hooks*. In a long chain (a bomb breaks a block, an item makes broken blocks explode, which breaks more blocks…) that is exactly when protective hooks such as Radical Acceptance would silently stop working. Explosions also recursed synchronously, so one blast could run hundreds of others inside one frame.

**What the code does now** (`src/core/events.ts`, `src/combat/blasts.ts`):

- **Fail closed.** Past `MAX_DEPTH` an event is **cancelled**: nothing happens (no damage, no break, no heal). The event is logged once per type. A shield can never be bypassed by depth.
- **Root-only events.** `death`, `doorOpen`, `enemySpawn`, `roomClear` and `floorEnter` are emitted only by the core loop, at depth 0. Cancelling them would change their meaning: a cancelled `death` means "survive". The bus reports any nested emit of them as a bug (`ROOT_EVENTS`). `death` is emitted right after `actorDamage` returns, at the same depth, so a hit that passed the cap also reaches `death`. `bus.depth` exposes the current depth.
- **Explosions are queued.** `Game.explode()` only enqueues a blast. `BlastQueue` runs at most **8 per frame**, outside any other event. A blast queued while another one runs joins its chain (`cause.gen + 1`), and chains stop at **12 links**.
  - Past **256** queued blasts, new *chain links* are dropped. A root blast (a real bomb, a Panic burst) always goes off.
  - A room only clears once the queue is empty, so a last Panic's burst lands before the doors open.
- **Cause.** Every blast carries `cause: { origin, gen }`, and the `explosion` event exposes it. Bombs set off by a blast inherit its chain (`bombCause`, reset when the debris slot is reused).
- **Enemy projectiles** credit their thrower (the owner was `'world'`).

## 2. Split damage

**Problem.** Block damage was `damage × mining`. Every damage item also dug faster (Meditations tripled digging), and no effect could hurt only projections or only blocks.

**Now:**

- `IntentSpec` has three independent amounts:
  - `damage` hurts actors;
  - `mining` damages blocks;
  - `knock` sets how hard the intention shoves loose cubes.
- `mining` is **absolute**: a block takes `max(mining − armor, 10% of mining)`. The `mining` stat's base is **3.5** (the old `damage 3.5 × mining 1`), so digging feels the same at the start.
- Explosions were already split: `damage` hits blocks, `actorDamage` hits actors.
- `blockDamage(amount, material)` takes the final amount.
- Every item that changes `mining` does so as a multiplier. A contract test forbids the `add` layer on `mining`, because an absolute add would need a rebalance.

## 3. Actors

```ts
type ActorId = number;                 // one id space per run; the player is created first
type ActorKind = 'player' | 'projection';
type Owner = ActorId | 'world';

interface Actor {
  id: ActorId; kind: ActorKind;
  def: string;            // 'player' or the projection's definition id
  faction: Faction;
  body: Body;
  hp: number;             // damage points (half-hearts for the player: `halfHearts: true`)
  halfHearts?: true;
  tags: Set<string>;
  room: number;           // global room id (−1: none)
  alive: boolean;
  spawning: number;       // materialising: harmless and unhittable
}
```

- **Registry.** `ActorRegistry` (`src/entities/actors.ts`) holds one id space per run: `reset`, `newId`, `add`, `remove`, `get`, `all`. `Player` and `Enemy` both implement `Actor`. An enemy's definition is `e.spec`; `e.def` is its id.
- **Units.** Everything deals **damage points**. The player's health stays in half-hearts, because the HUD and items talk in hearts. A hit on the player costs `max(1, ceil(points / 4))` half-hearts (`HALF_HEART = 4`, `halfHeartsFor`). Old values keep their effect:
  - contact (`contactDamage`) and projectiles: 4 points;
  - explosions: 8 points to every actor. Before, projections took 2 half-hearts × 4 and the player took 2 half-hearts.
  - Damage reductions on the player work in steps of 4 points or by cancelling.
- **One damage function.** `Game.damageActor(target, points, kind, source, owner, kx?, kz?)`:
  - skips dead or materialising targets, and the player while invulnerable;
  - emits **`actorDamage { target, targetKind, def, amount, kind, source, owner, knockback, cause? }`**, then applies it.
  - `Game.damagePlayer(halfHearts, …)` is a thin wrapper for the console and items.
- **Contact.** **`contact { attacker, attackerDef, target, targetKind, toTarget, toAttacker }`** fires when a projection touches an actor it is hostile to.
  - `ContactGate` allows **one exchange per pair every 0.5 s**, and none while the player is invulnerable. Without it a touch landed every frame: Forgiveness dealt about 240 damage per second, and its random rolls depended on frame rate.
- **Death.** `death` stays cancellable and **player-only**. **`actorDeath { target, targetKind, def, x, y, z, drops }`** is react-only and fires for every actor; projections fill `drops`. A projection's hook source `actor:<id>` is removed from the bus when it dies.
- **Hook targets.** `actorDamage`, `contact` and `actorDeath` cover every actor, so hooks on them must say which ones they are for:
  - `hook('actorDamage', fn, { target: 'player' })`, with `target` one of `'player'`, `'projection'` or `'any'`;
  - the inventory skips other actors before calling `fn`;
  - the validator and a contract test require `target` on those events.

  This is what keeps Radical Acceptance from also cancelling your bomb's damage to projections (a synergy-matrix test checks it with every item held).
- **ItemApi.** `api.player()` returns the player's actor id. `api.isPlayer(owner)` is the way to compare owners: never compare against raw ids or `'player'`.

## 4. Factions

```ts
type Faction = 'self' | 'projection' | 'neutral';
const hostile = (a: Faction, b: Faction) => a !== b && a !== 'neutral' && b !== 'neutral';
```

Thematic reading: a projection that changes side becomes part of the **self**. It is integrated, not destroyed.

- **Targeting.** Behaviours never look for the player. They call `ctx.target(e)` (a position snapshot, or `null`, in which case they idle), then `ctx.toward(e, t)` and `ctx.dist(e, t)`.
  - The target is the nearest live, non-materialising actor hostile to `e`, preferring its own room (+20 cost otherwise).
  - It is re-chosen at 4 Hz, and only switched for one at least 1.5 blocks closer, so equidistant targets don't make it jitter.
- **Flow fields** are cached per (room, target). Each field is 13×7, so this is cheap.
- **Who hits whom.**
  - The player's intents pass through allies.
  - Projectiles hit the first actor hostile to their thrower's side.
  - Contact is checked between every hostile pair.
  - Explosions hit every actor in range (friendly fire, as bombs always hurt the player).
- **Room clear.** A room clears when no live projection of faction `projection` is left in it (`Enemies.blockingIn`). Allies don't keep doors shut, so turning the last hostile into an ally clears the room.
- **Allies stay in their room** (leash unchanged), fight hostiles there and otherwise idle. Following the player across rooms and floors is a later design, with controllers (PR7).
- **Changing side.** `Game.setFaction(actor, faction, source)` emits react-only **`factionChange { target, targetKind, def, from, to, source }`** and makes the actor look for a new target.
- **Look.** Allies glow a steady warm gold.
- **Debug.** `S.charm()` turns the nearest projection into an ally. A practice that does this is a later design (named through the lore skill, with the owner).

## 5. What did not change

- Stats stay player-only (R5); enemies keep spawn-time numbers.
- Statuses (PR5), forces, the clock and commands come later.
- The synergy matrix and the contract test cover every event, including `actorDamage`, `contact`, `actorDeath` and `factionChange`.

## 6. Later (from the review)

| When | What |
|---|---|
| When an item first sets `keepTags` or tags debris spawned by a blast | Carry `Cause` through cubes (per-cube cause arrays, ambient cause during `debrisImpact`); a contract test forbids `keepTags = true` until then |
| PR5 statuses | `api.actors.query({ faction, room, near })` |
| PR7 controllers | Allies follow the player across rooms and floors |
| Owner question | Should a reduction smaller than 4 points ever save a half-heart? (That would need player HP in points and quarter hearts.) |
| Later | A cancellable `factionChange`; cancellable death for projections (every `kill()` site must handle survival first) |

## 7. Tests

- `tests/core.test.ts`:
  - the bus fails closed, so a shield is never bypassed;
  - root-only events are reported when nested, and `bus.depth` is exposed;
  - `BlastQueue` runs 8 per frame, chains stop at 12, root blasts are never dropped;
  - half-heart conversion; one id space; `ContactGate` bounds hits per second; `hostile()`.
- `tests/items.test.ts`:
  - damage items don't dig faster, and mining items don't hurt more;
  - hooks on actor events have a `target`;
  - no `keepTags = true` in content;
  - no `add` layer on `mining`.
- `tests/synergy-matrix.test.ts`: samples for the new events; with every item held, your bomb still hurts a projection and contact aimed at a projection is untouched.
- Checked in the browser:
  - Panic's burst hurts the player and the other projection;
  - with Radical Acceptance your bomb doesn't hurt you but still hurts projections;
  - Forgiveness lands once per contact;
  - a charmed Doubt targets and fights the Critic;
  - charming the last hostile clears the room.
