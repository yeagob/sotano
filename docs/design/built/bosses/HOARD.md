[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Hoard

Built. Floors 3 and 4, from the Zone II pool. Code: `src/content/bosses/hoard.ts`.

The Hoard is a mound of everything kept: crates, stones and bundles packed together. It rolls great weights across the room, pulls the room's loose things back to its pile, and bursts open when enough of it is spent. It is the weakest boss against breaking blocks, so soft walls give way to it easily.

- **Pattern:** holding on to everything. To be safe from lack.
- **Path:** Will.
- **Health:** 229 on floor 3, 293 on floor 4.

## Phases

### Phase 1: pushes weights

It walks at the player. Its moves:

- Weights, then a ram: a tide along one axis, then a charge.
- Two tides on both axes, walking.
- A charge, chosen only while the player is three or more blocks away.
- Bars of force, parallel lines across the room where the player stands.

### Phase 2: clutches (from two thirds of its health)

Arena `rockfall`. Its moves:

- Clutch and throw: an inhale of nine blocks, then a barrage of eight.
- A second inhale of two seconds.
- A barrage of seven.
- Crossed bars.

### Phase 3: spills (from one third of its health)

Arena `spill`: cubes are shed around it. Its moves:

- Burst open: two novas of twelve bolts, then a bouncing charge.
- A charge with two bounces.
- A spiral nova of twelve bolts over three volleys.
- Five stones.

## Toasts

- Entering phase 2: "It clutches: it pulls everything back to its pile".
- Entering phase 3: "It spills: what it kept flies out in every direction".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's pile of loose cubes and every pickup it took, plus one, is not built.

## Open questions

- **Pickups.** The design has it suck pickups back from the floor. The build's inhale pulls what is near; it does not say which pickups. Confirm in play and decide the rule.
- **Core.** The design hides the core in the pile. The build's core is two glowing blocks on the front.
- **Stolen items.** The design's "plus one" on release is not built.
