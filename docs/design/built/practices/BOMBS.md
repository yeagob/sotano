# Bomb practices

Up: [all practices](README.md) · [built design](../../README.md)

Four practices that change what your own bombs and missiles do: Pressure Valve (emotion), Controlled Burn (will), Bolt from the Blue (mind) and Serendipity (emotion). Issue #110, section 5. The bomb is "bomb" in the game (the vocabulary's word, [VOCABULARY](../story/VOCABULARY.md)); a missile is a bomb launched by [Dr. Launcher](milagros/DR-LAUNCHER.md).

All four are found in treasure rooms (weight 1). They have a positive outcome in every case: each one only adds, and none hurts you more than a plain bomb does.

## What they react to

Every hook here listens to one event, `bombBlast`, which the game emits **only** for an explosion of a bomb or a missile owned by the player:

| Blast | Emitted | Polarity |
|---|---|---|
| A bomb you placed, going off (`source` `bomb`) | yes, after its blocks and actors were hit | negative |
| A missile you launched, ending on a block or an actor (`source` `missile`) | yes | negative |
| A white bomb or a positive missile: a love explosion (`source` `bomb` or `missile`) | yes, after it mended what it touches | positive |
| A volatile cube (Symbolic Act), an enemy's burst, another item's `explode` | **no** | |

So a blast of Symbolic Act's volatile cube is never a bomb blast, and the practices cannot chain with it. The event carries `x, y, z`, the real `radius`, the `polarity` and `source`, and `acted`: the ids of the practices that already acted on this blast. A practice held twice acts once per blast (its stats still stack).

Effects that could explode a bomb again (fire that reaches a loose bomb) run at the end of the frame (`api.defer`); a bomb caught in the fire goes off as its own blast, and the fire is finite (it burns the flammable blocks away), so the chain ends.

## 1. Pressure Valve (`pressurevalve`)

- **Meaning:** what is let out on purpose does not burst on its own. Inspired by emotional release and the "pressure cooker" model of anger.
- **Path:** emotion. Tags: emotion, explosive, bomb. Quality 2. Pools: treasure 1.
- **Effect:** bombs: blast radius +0.8 blocks and damage ×1.6. Gives 2 bombs.
- **Mechanics:** `bombRadius` add +0.8 (2.6 becomes 3.4), `bombDamage` mul ×1.6 (40 becomes 64). `onGain` gives two bombs once; a rebuild never gives them again. No hooks.
- **Positive outcome:** the bigger blast and the two bombs are the outcome. It has no cost.

## 2. Controlled Burn (`controlledburn`)

- **Meaning:** the forest burns a little on purpose, so it never burns all at once. Inspired by controlled burns in forest management.
- **Path:** will. Tags: will, explosive, bomb, fire. Quality 2. Pools: treasure 1.
- **Effect:** your bomb blasts set flammable blocks in their radius on fire and burn projections for +4 damage. The fire never hurts you within 4 blocks of a blast, for 8 seconds.
- **Mechanics** (on a negative blast only; a love explosion sets nothing alight):
  - `api.shieldFire(x, y, z, radius + 4, 8)`: a fire shield at the blast, immediately (no deferral, so the fire of the same frame is covered).
  - Deferred: `api.igniteArea(block of the centre, radius)` sets every flammable block in the radius alight, then `api.pulse(..., radius, 4, ..., 'controlledburn')` hits every projection inside the radius for 4 points through the normal actor damage pipeline.
- **Why a shield and not a tag on the fire:** fire is an element of the cell grid and spreads from cell to cell, so a fire cell has no memory of which blast lit it. A shield in space and time is the cleanest safe rule. It covers fire that the blast lit near you; fire that spreads further than radius + 4 after 8 seconds is ordinary fire.
- **Core change:** `shieldFire` is a new `ItemApi` verb (see [ITEMS](../../../architecture/ITEMS.md)). The game keeps the last eight shields and drops them with a new run. Fire damage to the player is skipped only for the `fire` element inside a live shield (lava still hurts).
- **Also fixed:** `igniteArea` took its loops from the radius itself, so a fractional blast radius (2.6) ignited nothing. It now walks the whole blocks up to the ceiling of the radius and keeps the sphere test, so integer radii (kindling, 2) behave as before.
- **Positive outcome:** blocks that would burn later burn now, while you stand clear; projections take extra damage; you are never hurt by the fire of your own blast nearby.

## 3. Bolt from the Blue (`boltfromtheblue`)

- **Meaning:** insight strikes all at once and lights everything around it. Inspired by the sudden flash of insight (the "aha" of Gestalt psychology).
- **Path:** mind. Tags: mind, explosive, bomb, lightning. Quality 3. Pools: treasure 1.
- **Effect:** your bomb blasts arc lightning to up to 3 projections within 3 blocks of the blast's edge, 6 damage each.
- **Mechanics:** on every player blast (both polarities), deferred: up to three times, `api.nearestProjection(centre, radius + 3, already hit)` then `api.arc(centre, target, 6, 'boltfromtheblue', polarity)`. Nearest first. The arc is the existing bolt look.
- **Positive outcome:** the arcs of a love explosion are positive: they warm and mend the projections they reach instead of hurting them, and never more than the plain arc would.

## 4. Serendipity (`serendipity`)

- **Meaning:** what you did not look for finds you. Inspired by the word coined by Horace Walpole (1754).
- **Path:** emotion. Tags: emotion, bomb, luck. Quality 2. Pools: treasure 1.
- **Effect:** luck +1. Each of your bomb blasts has a 25% chance (+5% per luck, up to 60%) to leave a key, a bomb or a heart.
- **Mechanics:** `luck` add +1 (base 0). On each player blast the chance is `min(0.6, 0.25 + 0.05 × luck)`, read from the stat at the blast; a deferred roll on the item's own stream (`api.rng().chance`), then `api.rng().pick` of key, bomb or heart with equal odds, placed at the blast's centre (`api.spawnPickup`).
- **Luck:** luck was read by the crate and room-clear rolls only. Serendipity makes it a second use in blasts; the stat is unchanged.
- **Positive outcome:** the find is a gain at the place of the blast; a love blast can find too.

## Decisions taken without the owner

- **Fire shield instead of a fire tag:** the owner allowed either; the shield is in space and time (see Controlled Burn). The effect text states its limit (4 blocks, 8 seconds), so the promise is true.
- **Once per blast per practice:** the owner's text says "a chance per blast" and "one key, bomb or heart". Duplicates of one practice would otherwise each roll and each burn. The `acted` set makes each practice act once per blast; its stats still stack, as every stat does.
- **Love blasts count for Serendipity and Bolt from the Blue, not for Controlled Burn:** a love explosion sets nothing alight and hurts nothing.
- **Damage source of Controlled Burn:** its +4 goes through the projection damage pipeline with the source `controlledburn` (the pulse's cause `item`), not a separate fire cause. Projections are the only targets, so the death screen never shows it.
- **Bolt from the Blue's radius:** the search radius is the blast's real radius (after every hook on `explosion`) plus 3, measured from the centre to each projection's middle.

## Open for the owner

- The Controlled Burn text now reads "for 8 seconds, within 4 blocks of a blast" instead of "that fire never hurts you". Say if you want a different window.
- Recipes for the crafting table (rule 14, once issue #112 is resolved): none of the four has one yet. Their tiers would ask for a potion or several for quality 3 (Bolt from the Blue) and a monster part for the quality 2 ones.
- The names "Rayo caído del cielo" (Bolt from the Blue) and "Serendipia" (Serendipity) are the Spanish choices; the owner may prefer others.
