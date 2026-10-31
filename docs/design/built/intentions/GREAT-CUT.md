# The great cut

The great cut is a charged, giant blade of light that sweeps in front of the player. It is the weapon of the two practices together: One Clear Cut is the synergy of Cut Ties with Toxic Relationships and Remember Breathing.

Part of [intentions](README.md) · see also [WEAPONS.md](WEAPONS.md).

## What the player sees and feels

- Hold cast to charge, as with the beam. When the charge is full, the hands glow white-gold, and release starts the sweep.
- The blade is nine blocks long at base, up to eighteen with size, and sweeps 140 degrees in front of you in about half a second.
- It cuts every breakable block along its path, in a band a few blocks thick.
- Every hostile projection it crosses takes four times the damage of an intention, once per sweep.
- Every projectile in its reach is destroyed.
- Up to twenty-four of the blocks it breaks become loose cubes; the rest are gone.
- A positive great cut mends damaged blocks and warms projections.
- It replaces the intention while it fires. Its synergy outranks both practices' own weapons.

## The rule behind it

The design calls One Clear Cut "a charged, giant blade of light that sweeps the room" and says it comes from the combination of the two weapons ([DESIGN.md, section "Weapons that replace the intention"](WEAPONS.md)). The built sweep covers a 140-degree arc, not the whole room; see the open question below.

Code: `src/combat/weapons.ts` (the great cut, its arc and its reach, lines 265-360), `src/content/synergies.ts` (the synergy and its priority, lines 10-19).

## Open questions

1. **Sweeps the room, or sweeps in front.** The design says the great cut "sweeps the room" ([DESIGN.md](README.md)). The code sweeps a 140-degree arc in front of the player, up to eighteen blocks. Which does the owner want? The arc is the built behaviour.
