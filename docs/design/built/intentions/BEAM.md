# The beam

The beam is a charged line of light that burns through what it touches, one tick at a time. It comes from the practice Remember Breathing and replaces the intention while it fires.

Part of [intentions](README.md) · see also [WEAPONS.md](WEAPONS.md).

## What the player sees and feels

- Hold cast to charge. The charge fills on the hands and glows white-gold when it is full. The charge is faster with a higher fire rate: between about a third of a second and two seconds.
- Release when it is full, and a beam runs along your aim for one second. It ticks ten times a second, so you see it burn in steps.
- On each tick the first solid block on its path takes twice the mining, armour counting, and the beam goes on through the block once it breaks. It reaches about twenty-four blocks.
- Every hostile projection on the beam takes an intention's damage on each tick, and every projectile on it is destroyed.
- The beam is an intention to the alembic: a positive beam that reaches a laboratory's alembic brews it, and a negative one boils its bulb, as a shot does. The alembic cannot be broken, so the beam answers it instead of burning it. Only the first tick in the 0.6-second hit gap counts ([laboratory](../laboratory/README.md)).
- A positive beam mends the damaged blocks it touches and warms projections. An undamaged block does nothing.
- Releasing before the charge is full does nothing.

The beam is a shot first: releasing it emits the same fire event an intention does, so the practices that change the shot change the beam. Dual Process and Triangulation fan it into two or three beams (the extra ones at 60 %). Rule of Three splits each beam into three strands at 70 %, Spiral Growth into a helix (strand 0 at 100 %, the others at 40 %); with Spiral Growth the beam keeps its normal size and the strands are thin spirals of light layered over it, running forward along it. Eye Contact curves its rays toward a projection and Dowsing toward a block, as they curve an intention, so a fan of beams stays a fan of curves. Bilateral Stimulation gives it one beam from each hand, the ten ticks alternating. Bounces, pierce, phase and absorb do not apply to a beam.


## The rule behind it

The design describes the beam as "hold to charge, release a beam that burns through blocks tick by tick" ([DESIGN.md, section "Weapons that replace the intention"](WEAPONS.md)). The built beam matches that description; the charge and the one-second length are the numbers the code uses.

Code: `src/combat/weapons.ts` (the charge, lines 57 and 165-175; the beam, lines 179-260).
