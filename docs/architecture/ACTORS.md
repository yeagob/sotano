# Actors, damage and factions

Status: **proposal** (P0 of [../reviews/stress-test.md](../reviews/stress-test.md)), under three-party review in [../reviews/actors.md](../reviews/actors.md).

The P0 refactors make the game ready for clones, friendly projections, enemies that use effects and separate block and actor damage, without changing how a normal run plays. Four steps, each one commit with its tests:

1. **PR1 — chain safety**: the bus fails closed at depth; explosions are queued and budgeted; every explosion carries a `Cause`; enemy projectiles name their thrower.
2. **PR2 — split damage**: actor damage and block damage are separate numbers everywhere (`Hit`).
3. **PR3 — actors**: the player and every projection are `Actor`s in one registry, with one health model, one damage event and one contact event.
4. **PR4 — factions**: who is hostile to whom; enemies target the nearest hostile actor; a room is clear when no hostile projection blocks it.

## 1. Chain safety (PR1)

**Problem.** Past `MAX_DEPTH` (8) nested emits, the bus ran events *without hooks*. In a long chain (a bomb breaks a block, an item makes broken blocks explode, which breaks more blocks…) that is exactly when protective hooks such as Radical Acceptance would silently stop working. Explosions also recurse synchronously, so one blast can run hundreds of others inside one frame.

**Changes.**

- **Fail closed.** Past `MAX_DEPTH` an event is **cancelled** (logged once per event type) instead of running without hooks. Cancelling means "nothing happens": no damage, no break, no heal. A shield can never be bypassed by depth.
- **Explosions are queued.** `Game.explode()` only enqueues a blast. `simulate()` runs at most `BLASTS_PER_FRAME` (8) per frame; the queue holds at most `MAX_BLASTS` (256) (past it, new blasts are dropped with one warning). A blast runs outside any other event's stack, so explosions never nest.
- **Cause.** Every blast carries `cause: { origin: string; gen: number }`. A blast queued while another blast is running inherits its origin with `gen + 1`. Past `MAX_CHAIN_GEN` (12) the blast is dropped. `explosion` events expose `cause`, so items can tell a first blast from a chain.
- **Projectile owner.** Enemy projectiles remember their thrower; damage is credited to it (it was `'world'`).

## 2. Split damage (PR2)

**Problem.** Block damage was `damage × mining`: every damage item also dug faster (Meditations tripled digging), and no effect could hurt only enemies or only blocks.

**Changes.**

```ts
/** What one hit does to each kind of target. Each part is absolute and independent. */
interface Hit {
  actor: number;  // damage points to actors (player, projections)
  block: number;  // damage to blocks, before the material's armor
  cube: number;   // impulse to loose cubes
}
```

- `IntentSpec` keeps `damage` (actors) and `mining` (blocks), and `mining` becomes **absolute**: a block takes `max(mining − armor, 10% of mining)`. The `mining` stat's base becomes **3.5** (the old `damage 3.5 × mining 1`), so digging feels the same at the start.
- Items that changed `mining` as a multiplier keep working (×2 is still ×2). Items that only change `damage` no longer dig faster; their `effect` text already says only "Damage…". No item text changes except where a number moves.
- `blockDamage(amount, material)` loses its `mining` argument; `damageBlock()` takes the final amount.
- Explosions already split: `damage` (blocks) and `actorDamage` (actors).
- Intent pushes on loose cubes use a `knock` derived from `damage` today; it moves to the intent spec as `knock` (base from stats, not from damage).

## 3. Actors (PR3)

**Problem.** One hard-coded player; enemies are records only the enemy system knows; damage has two pipelines with two units (player half-hearts, enemy HP and a hidden ×4).

**Model.**

```ts
type ActorId = number;                 // unique per run; the player is created first
type ActorKind = 'player' | 'projection';
type Owner = ActorId | 'world';

interface Actor {
  id: ActorId;
  kind: ActorKind;
  def: string;            // 'player' or the projection's def id
  faction: Faction;       // PR4
  body: Body;
  health: Health;
  tags: Set<string>;
  room: number;           // global room id (−1 outside rooms)
  alive: boolean;
}

/** One unit for everyone: damage points. The player shows them as hearts. */
interface Health {
  hp: number; max: number;
  /** 'hearts': every hit costs at least one half-heart: halfHearts = max(1, round(points / HALF_HEART)). */
  model: 'points' | 'hearts';
}
const HALF_HEART = 4;  // damage points per half-heart
```

- `ActorRegistry` (in `src/entities/actors.ts`): `add`, `get(id)`, `remove`, `all()`, `inRoom(room)`, `near(x, y, z, r)`, `newId()`. `Player` and `Enemy` both implement `Actor`. Enemy `uid` becomes the actor id.
- **Units.** Everything is in damage points. The player's health stays in half-hearts (the HUD and items keep talking in hearts); a hit on the player costs `max(1, round(points / 4))` half-hearts. Today's numbers keep their effect: contact damage 1 half-heart becomes 4 points; explosion `actorDamage` 2 half-hearts becomes 8 points (enemies already took 8).
- **One damage function.** `damageActor(target, amount, kind, source, owner, knockback?)` emits one event and applies it:

```ts
actorDamage: { target: ActorId; targetKind: ActorKind; def: string; faction: Faction;
               amount: number; kind: DamageKind; source: string; owner: Owner;
               knockback: number; cause?: Cause }
```

  It replaces `playerDamage` and `enemyDamage` (no aliases: there are no external mods yet; items and tests migrate in the same commit). `death` (cancellable, player) and `enemyDeath` (drops) stay, renamed `actorDeath` with `targetKind`, cancellable for every actor.
- **One contact event.** `contact: { attacker: ActorId; attackerDef: string; target: ActorId; targetKind: ActorKind; toTarget: number; toAttacker: number }`: a projection touching any actor it is hostile to. Forgiveness and Nothing Personal check `targetKind === 'player'`.
- **ItemApi.** `api.player()` returns the player's actor id; `api.damagePlayer(halfHearts)` stays (converted to points); `api.actors.query({ faction?, room?, near? })` for read-only queries.

## 4. Factions (PR4)

```ts
type Faction = 'self' | 'projection' | 'neutral';
const hostile = (a: Faction, b: Faction) => a !== b && a !== 'neutral' && b !== 'neutral';
```

Thematic reading: a projection that changes faction becomes part of the **self** (integrated, not destroyed).

- **Targeting.** Behaviours stop reading `ctx.player`; they call `ctx.target(e)` (the nearest live actor hostile to `e`, preferring its own room) and `ctx.toward(e, t)`. With no target, they idle.
- **Who hits whom.** Intents hit actors hostile to their owner's faction; enemy projectiles likewise. Contact is checked between every pair of hostile actors. Explosions hit every actor (friendly fire, as bombs do to the player today).
- **Room clear.** A room is clear when no live actor in it `blocksClear` (true for faction `projection`). Allies don't keep doors shut.
- **Allies follow.** An actor of faction `self` that isn't the player leashes to the player's room instead of its own (updated as the player moves), attacks hostiles there and otherwise keeps near the player.
- **Changing faction.** `setFaction(actor, faction, source)` emits `factionChange` (cancellable). Visuals: allies get a warm outline tint.
- **Debug.** `S.charm()` turns the nearest projection into an ally. A real practice that does this is a later design (named via the lore skill, asked to the owner).

## 5. What does not change

Stats stay player-only (R5); enemies keep spawn-time numbers. Statuses (R3/PR5), forces, the clock and commands come later. The synergy matrix and contract test keep covering every event (new payload samples for `actorDamage`, `contact`, `actorDeath`, `factionChange`).

## 6. Tests

- Bus: past the depth cap a protective hook is never bypassed (the event is cancelled).
- Chains: "every broken block explodes" plus a bomb runs at most 8 blasts per frame, stops at generation 12, and Radical Acceptance never lets self-damage through.
- Split damage: Meditations changes intent damage but not hits-to-break; a `mining`-only change doesn't change damage.
- Actors: one id space; player and projection both damaged through `actorDamage`; hearts conversion (4 points = 1 half-heart, minimum 1).
- Factions: an ally projection damages a hostile one, is not hit by the player's intents, and doesn't block room clear.
