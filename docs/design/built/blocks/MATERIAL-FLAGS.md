# Material flags

The properties a material can carry today, what the player sees because of them, and the one flag that has no effect yet.

Part of [blocks](README.md).

## What the player sees and feels

- **Flammable**: crates, living wood and leaves. Fire or lava that touches one sets it alight, and it burns away, leaving a flame in its place. A loose flammable cube that falls into water floats up to the surface instead of sinking.
- **Slippery**: ice. On ice you keep sliding: starting, turning and stopping take far longer than on stone.
- **Heavy**: obsidian and iron ore are declared heavy. Nothing reads the flag yet, so a heavy block behaves like any other. The design's effect for heavy blocks, that they hurt what they land on, is not built ([not-built/blocks/MATERIAL-PROPERTIES.md](../../not-built/blocks/MATERIAL-PROPERTIES.md)).

## The rule behind it

Flags are data: a material says what it is, and the systems that read the flag decide what it does. The design lists the planned flags and says that items and enemies read them ([DESIGN.md, section 5](README.md)). Only the flags with a reader are built.

Code: `src/content/materials.ts` (the flags on each material), `src/game/game.ts` (the fire that ignites a flammable block, the ignition rule, and the loose cube in water, the water rule), `src/entities/player.ts` (the grip on a slippery block, the medium read from the block under the feet), `src/content/materials.ts` (the heavy flag, read nowhere).

## Open questions

1. **Heavy.** The design says a heavy block hurts what it lands on, and that a falling heavy block crushes an enemy ([DESIGN.md, section 5](README.md)). The code declares the flag on obsidian and iron ore and reads it nowhere. The owner should decide whether the flag should do something before anything is built on it.
