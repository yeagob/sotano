# The beam

The beam is a charged line of light that burns through what it touches, one tick at a time. It comes from the practice Remember Breathing and replaces the intention while it fires.

Part of [intentions](README.md) · see also [WEAPONS.md](WEAPONS.md).

## What the player sees and feels

- Hold cast to charge. The charge fills on the hands and glows white-gold when it is full. The charge is faster with a higher fire rate: between about a third of a second and two seconds.
- Release when it is full, and a beam runs along your aim for one second. It ticks ten times a second, so you see it burn in steps.
- On each tick the first solid block on its path takes twice the mining, armour counting, and the beam goes on through the block once it breaks. It reaches about twenty-four blocks.
- Every hostile projection on the beam takes an intention's damage on each tick, and every projectile on it is destroyed.
- A positive beam mends the damaged blocks it touches and warms projections. An undamaged block does nothing.
- Releasing before the charge is full does nothing.

Two synergies raise the beam's damage and mining, because no shot practice reaches it: Chorus, with Dual Process, multiplies both by 1.6, and Choir, with Triangulation, by 2.2.

## The rule behind it

The design describes the beam as "hold to charge, release a beam that burns through blocks tick by tick" ([DESIGN.md, section "Weapons that replace the intention"](WEAPONS.md)). The built beam matches that description; the charge and the one-second length are the numbers the code uses.

Code: `src/combat/weapons.ts` (the charge, lines 57 and 165-175; the beam, lines 179-260).
