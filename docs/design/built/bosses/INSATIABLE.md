[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Insatiable

Built. Floors 1 and 2, from the Zone I pool. Code: `src/content/bosses/insatiable.ts`.

The Insatiable is a giant open cup of stone with a maw at floor level. It never walks: the room comes to it. Its inhale pulls everything toward the mouth, and it spits back what it has swallowed.

- **Pattern:** craving, grown old. To be full.
- **Path:** Body.
- **Health:** 140 on floor 1, 179 on floor 2.

## Phases

### Phase 1: inhales and spits

It stays where it is. Its moves:

- An inhale that reaches 12 blocks and bites, then a fan of seven bolts over three volleys.
- A second inhale of 2.5 seconds.
- A fan of five bolts over two volleys.
- A barrage of five cubes.

### Phase 2: spits (from two thirds of its health)

Arena `spill`: the cup sheds cubes. Its moves:

- A spiral of ten bolts over three volleys, then a barrage of eight.
- A barrage of nine cubes.
- A second spiral, ten bolts over three volleys.
- An inhale of 1.8 seconds.

### Phase 3: hollows (from one third of its health)

Arena `rockfall`: stones fall across the room. Its moves:

- Rings, a spiral and stones: two shockwaves reaching 12 blocks, then a spiral of 14 bolts over three volleys, then four stones.
- A spiral of 14 bolts over four volleys.
- Three shockwave rings reaching 12 blocks.
- A volley of five stones.

## Toasts

- Entering phase 2: "It spits back what it swallowed".
- Entering phase 3: "It hollows out: it cracks, the floor rings and the ceiling falls".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's well of clean water is not built.

## Open questions

- **Feeding.** The design lets the player feed it a bomb to stop its pull. The build's inhale bites what reaches the mouth; whether a bomb in the mouth is spat out or ends the inhale is to be checked in play.
- **Core.** The design shows a core that is hit once the cup cracks. The build has glowing cores only; there is no weak point.
- **Release.** A clean-water well as the reward is not built (see [Voxel bodies](../../not-built/bosses/VOXEL-BODIES.md)).
