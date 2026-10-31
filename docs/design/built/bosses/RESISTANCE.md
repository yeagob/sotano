[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# Resistance

Built. Floors 1 and 2, from the Zone I pool. Code: `src/content/bosses/resistance.ts`.

Resistance is a door that walks: a great slab of the floor's brick on two short legs, with two dim eyes under its lintel. It comes at the player and rams, and what it rams breaks.

- **Pattern:** the force that stops creative work. It is named for an everyday idea, not a person.
- **Need:** that nothing changes.
- **Path:** Will.
- **Health:** 140 on floor 1, 179 on floor 2.

## Phases

### Phase 1: rams and stamps

Walks at the player (stalking) at a steady pace. Its moves:

- A ram and stamp: a charge, then one shockwave.
- A single charge that runs to the walls.
- One shockwave ring, reaching 4.5 blocks.
- A barrage of two cubes thrown from itself, each landing marked on the floor.

### Phase 2: walls in (from two thirds of its health)

Arena `walls`: two-block walls rise down the room's centre column, so the room becomes two corridors with gaps. Its moves:

- A double ram, the second charge sent through the walls it has just raised.
- Stones, then a ram.
- A charge that bounces once off the walls.
- A double shockwave reaching 7 blocks.
- The cube barrage, and a volley of four stones.

### Phase 3: sits (from one third of its health)

Arena `rockfall`: stones fall across the room. It stops walking and stays where it is. Its moves:

- Three drops: three leaps onto the player's position; the last leap throws stones.
- One slam with three stones around the landing.
- A triple shockwave reaching 10 blocks, with a quake.
- A volley of six stones.

## Toasts

- Entering phase 2: "It walls the room in and rams through its own walls".
- Entering phase 3: "It sits and grows heavy: it drops on you, and the ceiling falls with it".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's stair down, made of its released blocks, is not built.

## Open questions

- **Top-down breaking.** The design says a sitting Resistance must be broken from the top down. The build has no such rule: any hit that lands counts. Keep it, or build the rule?
- **Phase 1 identity.** The design has it plant itself in the way and push. The build charges across the room. Which one is the boss?
- **Walls.** The walls stay in the room after the phase, and after the boss is defeated. Should they fall when the boss is?
