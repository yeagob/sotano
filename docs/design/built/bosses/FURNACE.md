[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Furnace

Built, in part. Floors 7 and 8, from the Zone IV pool. Code: `src/content/bosses/furnace.ts`.

The Furnace is a great furnace of obsidian and brick, its door a mouth, and a cold core behind the door. It pulls the room in, then throws fire at the player. Its phases use the older emitter behaviours.

- **Pattern:** Burnout, grown old. To be enough.
- **Path:** Will.
- **Health:** 612 on floor 7, 782 on floor 8.

## Phases

### Phase 1: pulls

It stays near the player, keeping about four blocks away. Every five seconds it pulls: a field of six blocks' radius, lasting 2.5 seconds, that drags the player toward it.

- Arena: none on entering.

### Phase 2: blazes (from two thirds of its health)

Arena `fire`: fire spreads over the room's free floor, except near the player. Every 1.8 seconds it throws two bolts at points one and a half to three and a half blocks around the player.

### Phase 3: cracks (from one third of its health)

Arena `cool`: toast only. Every 2.4 seconds a ring of fire grows out of its own body, doing 8.

## Toasts

- Entering phase 2: "It blazes: the floor catches fire".
- Entering phase 3: "It is exhausted: it goes cold and cracks".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's cold hearth with a light of the player's inside it is not built.

## Open questions

- **Exhaustion.** The toast says it goes cold and cracks. The build keeps firing a ring from its body; nothing cools or cracks. Build the exhaustion, or change the toast?
- **Feeding.** The design has it pull loose cubes into its mouth and burn hotter. The build's pull acts on the player.
- **The cool arena.** Its name says the room cools; the build leaves the fire alone in phase 3.
- The full design is in [not-built/bosses/FURNACE.md](../../not-built/bosses/FURNACE.md).
