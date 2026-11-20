# Weapons: how the player casts

Until now the player had one way to act at range: the **intention** (`src/combat/intents.ts`), fired while the left button is held. Isaac's lesson is that some items **replace** the shot entirely (Brimstone, Spirit Sword) and that two of them together become something new. This document is the contract for that. Owner decisions (2026-10-26): weapons replace the shot, like Isaac; both new weapons are quality 4 and boss-pool; together they make a synergy of their own.

## 1. The active weapon

- An item or synergy may declare `weapon: { id, priority }` (`Effect.weapon`).
- The inventory resolves **one active weapon** on every `rebuild()`: the highest `priority` among held items and active synergies; ties go to the most recently gained (synergies after items). No weapon declared → `'intent'` (the default shot).
- Synergies that combine weapons declare a higher priority (100) than items (10), so the combination always wins. Losing an item rebuilds and the weapon falls back by itself: no state to clean.
- The game owns one `Weapon` instance (`src/combat/weapons.ts`) and checks `inventory.weapon` every frame in `simulate` and swaps when it changes; the old one disposes its visuals and any charge or strike in progress is dropped, with no damage. Validation: known id, priority 0..999.

| Weapon | Declared by | Input | Does |
|---|---|---|---|
| `intent` | (default) | hold left click | the intention, unchanged |
| `blade` | Cut Ties with Toxic Relationships | hold left click (swings at 80 % of the fire rate, **alongside the intention**: the shot keeps firing) | a cut in a 55° cone, reach 2.5 × `size` (at most 6): every breakable block in it is cut loose (it falls as a loose cube), every hostile projection in it takes `damage` × 3, every hostile projectile in it is destroyed; loose cubes in it (the rubble it just cut) are sliced in two along the stroke, Beat Saber style, and the halves fly apart and shrink away (at most 24 sliced per swing, the rest turn to dust) |
| `beam` | Remember Breathing | hold to charge, release when charged | a beam for 1 s: 10 ticks/s; each tick deals `mining` × 2 to the first solid block on each ray (the ray goes on through it once it breaks) and `damage` × 1 to every hostile projection on it; destroys projectiles on it. The shot's practices shape it (§2): fan, strands, homing, both hands |
| `greatcut` | One Clear Cut (Razor + Remember Breathing) | hold to charge, release when charged | a giant blade of light, 9 × `size` long (at most 18), sweeps 140° in front of you in 0.45 s: cuts every breakable block it passes (3 layers thick), `damage` × 4 to each projection it crosses (once per sweep), destroys projectiles |

Charge time for `beam` and `greatcut` is `clamp(2.7 / fireRate, 0.35, 2)` seconds: fire-rate items charge faster, like Brimstone.

`WEAPONS_KEEPING_SHOT` (`game/events.ts`) lists the weapons used alongside the shot; today only `blade`. Beam and great cut still replace it (they share its button for charging).

A positive stroke never breaks a block either: it reaches only damaged blocks and mends them (owner, 2026-10-27).

## 2. Contract with items

- **Stats drive everything**: `damage`, `mining`, `fireRate`, `size` already change every weapon; no weapon-specific stats.
- **One new event**, `strike: { weapon, damage, mining, reach, color, tags }`, emitted **once** per swing, beam release or sweep, before it happens. Its result is frozen for the whole strike (the beam's ticks read the frozen copy). Hooks can scale it, tag it or cancel it; a cancelled beam or great cut gives the charge back. It covers what `fire` covers for intentions.
- **Weapon review (2026-10-29, sandbox matrix `src/sandbox/scenarios/wr-*.json`)**: the beam and the great cut emit `intentHit` once per projection per stroke, at its first contact (the same contact that warms it), so the intention-hit practices (Thought Stopping, Self-Efficacy, Aha Moment, Rapport, Chunking, Boundaries' shove) apply to them. They emit it once, not on every tick, so Chunking splits a beam once per target. Blade cuts do not emit it: a cut is not an intention. The shot items that hook `fire` for volley, formation or homing (Dual Process, Triangulation, Rule of Three, Spiral Growth, Eye Contact, Dowsing, Bilateral Stimulation) reach the beam through its shot (see the beam above). Boundaries' no-damage applies to every stroke of yours (`strike`), so the beam and the cut shove without hurting.
- **Items that only hook `fire` for pierce or phase** do nothing while a weapon replaces the intention, as in Isaac. Today: Kaizen and Tao Te Ching (pierce, phase) and the Compound Effect synergy (pierce stone). The blade is the exception: the shot keeps firing beside it, so these items still work with it. The beam already burns through blocks and the blade cuts everything, so nothing is lost in practice; mapping pierce onto the weapons is left for the balance milestone.
- - **The beam is a shot first** (owner, 2026-11-20). Releasing a charged beam emits `fire` with the shot's spec (`intentFromStats`), as an intention does, and then `strike` with that spec as its `intent` (its tags, volley and shape; damage and mining are the strike's). A cancelled `fire` or `strike` gives the charge back. The beam reads the shot, frozen at release (`BeamShape`, `src/combat/weapons.ts`):
  - `volley` (Dual Process, Triangulation): the fan. Beam k > 0 turns around up by ±ceil(k/2) × 0.12 radians at 60 % of the damage and mining; beam 0 is at 100 %. At most 24 rays a cast: the outermost beams go first.
  - `formation` (Rule of Three, Spiral Growth): each beam is three strands. Rule of Three: a triangle that opens from 0.15 to 0.9 blocks over the second, 70 % each. Spiral Growth: a helix of radius 0.3, five turns a second, strand 0 at 100 %, strands 1 and 2 at 40 %. Both: the triangle turns. With Spiral Growth alone the beam keeps its own core at its normal width, and the three strands are drawn over it as thin helices of radius 0.15 that open from the hand over the first 3 blocks (`helixRadiusAt`), turn forward along the beam and are clipped where the beam ends; they never reach outside the beam's halo in the first block, so nothing wraps around the eye (issue #258). A curved (homing) beam draws its strands along their own curved paths.
  - `homing` (Eye Contact, Dowsing): each ray curves as an intention does (issue #257). It is traced in steps of 0.5 blocks (`beamPath`); the first step is straight, then every step turns it by 1 − e^(−homing × 0.5 / speed) toward its aim, where speed is the shot's speed (16 blocks/s at base). The aim is taken again every 0.15 × speed blocks from the point the ray has reached: the nearest projection within 8 blocks inside a 25° cone around the ray's direction (Eye Contact), or the nearest block within 6 (Dowsing). So the beams of a fan leave the hand a fan apart and each bends on its own toward its aim, never collapsing into one. The curve is drawn as straight pieces, a new piece each time the direction has turned more than 2°, at most 384 pieces a cast. Each tick traces it afresh, so the result depends on the tick alone.
  - `twin` (Bilateral Stimulation): the beam's ten ticks alternate between the two hands, five each, starting at the hand that casts. Both hands' rays are drawn at constant brightness. Each hand's ray starts a little below and beside the eye and aims where the eye's ray ends, so both meet at the crosshair.
  - What does not apply to a beam: bounces, pierce, phase and absorb, which move an intention through the world. Kaizen, Tao Te Ching and Compound Effect still change nothing about a beam, as before.
- Blocks broken by weapons go through `damageBlock` / `breakBlock` with kind `'cut'` (blade, great cut; amount = the block's full HP, so armor never saves it) or `'beam'`; actors go through `damageActor`. So `blockBreak`, `blockLoot`, `actorDamage` and every existing item keep working.
- A solid block a weapon reaches but cannot break (the alembic, infinite HP) gets the host's `answer(x, y, z)` instead, once per beam tick or per great-cut sweep. The game answers the alembic with the same brew a shot makes (`hitLab`), and ignores every other block, so the alembic's rules stay in one place.
- A cut deals 1e6 block damage (kind `'cut'`), so armor never saves a block; `blockDamage` hooks still may. Unbreakable blocks (tier `Infinity`: bedrock) are never cut. Doors are not world blocks and are not cut. **Nothing inside the reach is filtered** (owner: "it cuts all blocks in its range"): walls, floors and frames are cut too, like any digging.
- Projectiles of allied (converted) projections survive: only projectiles hostile to the player are destroyed.

## 3. Safety and performance

- Deterministic: weapons use no randomness (cosmetic particles go through `core/fx.ts`). The beam runs on a fixed accumulator (exactly 10 ticks per beam at any frame rate); the sweep integrates every angle between frames, so a slow frame never skips blocks.
- The great cut caps block cuts at 60 per frame; the rest of its arc is processed the next frames.
- Per frame, block breaks play at most 4 sounds and 24 particle bursts (any source). A strike leaves at most 16 (blade) or 24 (beam, great cut) loose cubes; its other cuts vanish as dust, so the debris ring is never flushed.
- Gentle: the beam's brightness is constant (its width breathes, never its light); no flash faster than 3 Hz.

## 4. Review

Three-party review: [../reviews/weapons.md](../reviews/weapons.md).
