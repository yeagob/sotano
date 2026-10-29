[Creatures](README.md)

# Leafling

Built. Floors 1 to 5, as ambient life. Code: `src/content/creatures/leafling.ts`.

A Leafling is a little light that wanders the leaves: a flat leaf-shaped body with one glowing point. It stands for wonder. It answers only positive intentions.

- **Pattern:** wonder.
- **Health:** 3.
- **Answers to:** positive intentions only.

## Movement and character

- Floats about 1.2 blocks above the floor, drifting between two and five blocks from the player.
- A single glow on its front, the living light.
- One or two appear per floor from 1 to 5.

## What the player can do

- Heal it: a positive intention heals it if it is hurt.
- Ignore it: a negative intention passes through it.
- Watch it drift. It is the one creature the design sends to the Tree above.

## Open questions

- **Which tree.** The design places Leaflings on the Tree (floors 1 to 5). The build places them on floors 1 to 5 of the underground, which the code calls the tree level; the giant tree above is not built. Rename the level or move the creature.
- **Teleport doors.** The design has Leaflings point out the teleport doors on the star map. Not built: see [Teleport doors](../../not-built/creatures/TELEPORT-DOORS.md).
