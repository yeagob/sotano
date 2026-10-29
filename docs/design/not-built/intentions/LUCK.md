# Luck and special effects

Whether luck should decide if a special effect happens, not only which loot a room gives.

Status: idea

Part of [intentions (not built)](README.md).

## The design

The design gives luck as the chance of special effects, with a base of zero ([DESIGN.md, section 4](README.md)).

## What the game does today

Luck weights the loot: the rewards of a cleared room and the items in a chest. It does not decide whether a special effect happens. The stat's base and its use are in [built/intentions/STATS.md](../../built/intentions/STATS.md).

## Open questions

1. **Which meaning.** Should luck be a chance of special effects, as the design says, or stay a weight on loot, as built? The owner should choose; the two can both stand.
2. **Which effects.** If luck decides effects, which ones? The design does not list them.
3. **Chance and the seed.** A run is reproducible from its seed. A roll of luck would have to stay reproducible too. Should the roll be part of the seeded randomness, as the loot already is?
