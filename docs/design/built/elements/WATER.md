# Water

Up: [elements](README.md) · Status: built.

Water is the first element the player meets. It stands for emotion: shallow feelings slow you down, deep ones take your footing. The owner's rule is that you can wade through shallow water slowly, and that in deep water you swim, hold your breath and can drown.

## What the player meets

- **Pools in rooms.** A room template digs water one or two blocks into its floor (`w` one deep, `W` two deep). Two-deep pools get a brick lining, so the walls of the pool hold. Pools are sources: they never change until the player breaks a wall around them.
- **Flow.** Water flows down first, then spreads sideways and evens out. A flow cell keeps its level from its neighbours, so when a wall breaks the water pours into the new space, and when a source is cut off the flow recedes.
- **Wading.** With the feet in water and the head out you move at 60 percent of your speed.
- **Swimming.** With the head under water you swim. A breath meter starts at 8 seconds. It drains while the head is under and refills four times faster at the surface.
- **Drowning.** When the breath is spent, you lose half a heart every 1.5 seconds until your head is out.
- **Splash.** Entering water throws foam particles and plays a splash.
- **Loose cubes.** Wood-like cubes rise to the surface; stone and other cubes sink slowly. Anything moving through water (a loose cube, a thrown intention, a projection) is slowed by it.
- **Water and lava.** Where water meets lava the lava turns to obsidian or stone (see [REACTIONS.md](REACTIONS.md)).
- **Water and fire.** Water puts out a flame it touches (see [FIRE.md](FIRE.md)).
- **Frozen floor.** On the ninth floor the pools are ice on their surface, and the water under the ice stays liquid (see [ICE-AND-WOOD.md](ICE-AND-WOOD.md) and [CIRCLES](../levels/floors/CIRCLES.md)).

## How projections meet water

Every projection that has an element entry says what it does in water. The path column says whether its walking field avoids the water cells, walks through them, or prefers them (dwells in them). Speed is its walking factor in water.

| Projection | In water |
|---|---|
| Doubt | avoids water; walks at 0.35 |
| Second-guessing | avoids water; walks at 0.35 |
| Comparison | avoids water; walks at 0.4 |
| Margin | avoids water |
| Critic | crosses water; walks at 0.45 |
| Numbness | crosses water; walks at 0.7 |
| Panic | crosses water; walks at 0.5; on entering it calms for 2.5 seconds |
| Alarm | crosses water; walks at 0.5; on entering it calms for 2.5 seconds |
| Sulk | dwells in water; walks at 0.5 |
| Undertow | dwells in water; walks at 1.5; surges |

So water is a place the player can use: Doubt will not follow you into it, Panic goes quiet in it, and Sulk and Undertow live there.

## Where it is in the rooms

Water pools and flooded halls are the protagonists of several rooms: `cistern`, `font`, `terraces`, `crossing`, `drowned-nave`, `cave-lake`, `well`, `spring` and `reliquary`, among others. Their list and what the player does in each is in [ELEMENT-ROOMS](../levels/rooms/ELEMENT-ROOMS.md).

Code: `src/content/elements.ts` (fluid rate, wading 0.6, swimming, breath), `src/entities/player.ts` (breath of 8 seconds), `src/game/game.ts` (breath, drowning, splash), the projection affinities in `src/content/enemies/`.

Not built (volume, drainage, mud): see [WATER-OPEN.md](../../not-built/elements/WATER-OPEN.md) and [DIRT-TO-MUD.md](../../not-built/elements/DIRT-TO-MUD.md).
