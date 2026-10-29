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
| `blade` | Cut Ties with Toxic People | hold left click (swings at 80 % of the fire rate, **alongside the intention**: the shot keeps firing) | a cut in a 55° cone, reach 2.5 × `size` (at most 6): every breakable block in it is cut loose (it falls as a loose cube), every hostile projection in it takes `damage` × 3, every hostile projectile in it is destroyed; loose cubes in it (the rubble it just cut) are sliced in two along the stroke, Beat Saber style, and the halves fly apart and shrink away (at most 24 sliced per swing, the rest turn to dust) |
| `beam` | Remember Breathing | hold to charge, release when charged | a beam for 1 s along your aim: 10 ticks/s; each tick deals `mining` × 2 to the first solid block on its path (the beam goes on through it once it breaks) and `damage` × 1 to every hostile projection on the beam; destroys projectiles on it |
| `greatcut` | One Clear Cut (Razor + Remember Breathing) | hold to charge, release when charged | a giant blade of light, 9 × `size` long (at most 18), sweeps 140° in front of you in 0.45 s: cuts every breakable block it passes (3 layers thick), `damage` × 4 to each projection it crosses (once per sweep), destroys projectiles |

Charge time for `beam` and `greatcut` is `clamp(2.7 / fireRate, 0.35, 2)` seconds: fire-rate items charge faster, like Brimstone.

`WEAPONS_KEEPING_SHOT` (`game/events.ts`) lists the weapons used alongside the shot; today only `blade`. Beam and great cut still replace it (they share its button for charging).

A positive stroke never breaks a block either: it reaches only damaged blocks and mends them (owner, 2026-10-27).

## 2. Contract with items

- **Stats drive everything**: `damage`, `mining`, `fireRate`, `size` already change every weapon; no weapon-specific stats.
- **One new event**, `strike: { weapon, damage, mining, reach, color, tags }`, emitted **once** per swing, beam release or sweep, before it happens. Its result is frozen for the whole strike (the beam's ticks read the frozen copy). Hooks can scale it, tag it or cancel it; a cancelled beam or great cut gives the charge back. It covers what `fire` covers for intentions.
- **Weapon review (2026-10-29, sandbox matrix `src/sandbox/scenarios/wr-*.json`)**: the beam and the great cut emit `intentHit` once per projection per stroke, at its first contact (the same contact that warms it), so the intention-hit practices (Thought Stopping, Self-Efficacy, Aha Moment, Rapport, Resonance, Chunking, Boundaries' shove) apply to them. They emit it once, not on every tick, so Chunking splits a beam once per target. Blade cuts do not emit it: a cut is not an intention. Shot items that hook `fire` (Dual Process, Triangulation, Kaizen, Taoist phasing, Bounce Back, Affirmation) still do nothing to a beam, which is why two synergies restore the volley for it: **Chorus** (Remember Breathing + Dual Process, ×1.6 damage and mining) and **Choir** (Remember Breathing + Triangulation, ×2.2). Boundaries' no-damage applies to every stroke of yours (`strike`), so the beam and the cut shove without hurting.
- **Items that only hook `fire`** do nothing while a weapon replaces the intention, as in Isaac. Today: Kaizen and Tao Te Ching (pierce, phase) and the Compound Effect synergy (pierce stone). The blade is the exception: the shot keeps firing beside it, so these items still work with it. The beam already burns through blocks and the blade cuts everything, so nothing is lost in practice; mapping pierce onto the weapons is left for the balance milestone.
- Blocks broken by weapons go through `damageBlock` / `breakBlock` with kind `'cut'` (blade, great cut; amount = the block's full HP, so armor never saves it) or `'beam'`; actors go through `damageActor`. So `blockBreak`, `blockLoot`, `actorDamage` and every existing item keep working.
- A cut deals 1e6 block damage (kind `'cut'`), so armor never saves a block; `blockDamage` hooks still may. Unbreakable blocks (tier `Infinity`: bedrock) are never cut. Doors are not world blocks and are not cut. **Nothing inside the reach is filtered** (owner: "it cuts all blocks in its range"): walls, floors and frames are cut too, like any digging.
- Projectiles of allied (converted) projections survive: only projectiles hostile to the player are destroyed.

## 3. Safety and performance

- Deterministic: weapons use no randomness (cosmetic particles go through `core/fx.ts`). The beam runs on a fixed accumulator (exactly 10 ticks per beam at any frame rate); the sweep integrates every angle between frames, so a slow frame never skips blocks.
- The great cut caps block cuts at 60 per frame; the rest of its arc is processed the next frames.
- Per frame, block breaks play at most 4 sounds and 24 particle bursts (any source). A strike leaves at most 16 (blade) or 24 (beam, great cut) loose cubes; its other cuts vanish as dust, so the debris ring is never flushed.
- Gentle: the beam's brightness is constant (its width breathes, never its light); no flash faster than 3 Hz.

## 4. Review

Three-party review: [../reviews/weapons.md](../reviews/weapons.md).
