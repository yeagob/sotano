# Loose cubes

A broken block does not vanish or drop an item: it becomes a loose cube, a physical piece of the same material, which falls, bounces, can be carried and then disappears.

Part of [blocks](README.md).

## What the player sees and feels

- A broken block turns into a cube a little smaller than a block, with the same look. It falls, bounces and rolls; there is no floating item to collect.
- A cube pressed against a wall hops up over the obstacle, a few times at most, then gives up and stays.
- A cube lives about ninety seconds. For the last eight seconds it shrinks smoothly to nothing.
- There is a cap on the cubes in the world: about two thousand on a keyboard and a thousand on touch. When the cap is reached, a new cube takes the slot that comes next in the ring, which is usually the oldest; bombs are not taken.
- An intention that hits a loose cube shatters it. A bomb is the exception: an intention only pushes it.
- Enemies push the cubes they walk into, at walking pace, away from them. They never push a bomb.
- A cube that has just been kicked, thrown or launched cannot be picked up again for a moment.
- Walking into a cube picks it up if your hand has room, and kicks it if not: see [HANDS.md](../player/HANDS.md) and [KICK-AND-THROW.md](KICK-AND-THROW.md).
- A cube in water sinks slowly, except a flammable one, which rises.

## The rule behind it

"There's no floating item drop like in Minecraft: the broken block *is* the object" ([DESIGN.md, section 5](README.md)). A broken block stays in the world as itself, which is why it can be picked up, kicked, thrown, pushed and placed again.

Code: `src/physics/debris.ts` (the constants: the size, the lifetime, the shrink and the hops, lines 11-18; the spawn and the cap, lines 90-110; the shatter on a hit, lines 140-146; the update of the cube, lines 180-200), `src/game/game.ts` (the cubes hit by intentions, lines 1618-1622; the enemies shoving cubes, line 1665; the walk-into rule, lines 1692-1728; the water rule for debris, lines 1866-1893).

## Open questions

1. **Shatter on the first shot, or four hits.** The design says loose blocks are tough but not eternal: intentions push them and after four hits they shatter ([DESIGN.md, section 6](README.md)). The code shatters a loose cube on the first intention that hits it (`src/physics/debris.ts`, lines 137-146). Which one does the owner want?
2. **Picking up once settled.** The design says a cube can be picked up once it settles ([DESIGN.md, section 5](README.md)). The code lets you pick up any cube you walk into, unless it was just launched. Should a cube in flight stay out of reach?
3. **Lifetime.** The design gives sixty to a hundred and twenty seconds; the code uses ninety. This is inside the range, so no decision is needed unless the owner wants a single number.
