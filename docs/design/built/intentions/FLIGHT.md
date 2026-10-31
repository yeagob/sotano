# Flight, fall and contact

How an intention moves through the world, what it hits, and how it looks.

Part of [intentions](README.md).

## What the player sees and feels

- An intention flies straight for its flight time, then drops under gravity. A shot aimed at a high ceiling is therefore a dig into the ceiling; a shot lobbed over a wall reaches the enemy behind it.
- It ends on contact. Against a block, it breaks the block if it can, and then it is gone (unless an item says otherwise, see [SHOT-CHANGES.md](SHOT-CHANGES.md)). Against a loose cube, it shatters the cube, except a bomb, which it only pushes. Against a projection, it hits and is gone.
- An intention that is still flying six seconds after it left is removed.
- Water drags it: it keeps going, but slower. Lava puts it out.
- Presences in the world hear it: a positive one lifts them and a negative one silences them. The presences are part of the bestiary, not of this document.
- A positive intention has a round, white-hot core and a gold shell. A negative one has the same shape with a dimmer core and an ash shell, so the polarity reads in the air.

## The rule behind it

An intention falls under gravity and breaks on contact, so that it is a physical object in the same world as the blocks. The design calls it "small orbs of will that fly, drop and hit" ([DESIGN.md, section 4](README.md)). The visual language is still open; the art decisions that exist are in the art ledger, and the open question is in [not-built/intentions/README.md](../../not-built/intentions/README.md).

Code: `src/combat/intents.ts` (the update of the flight, the fall, the contact with projections, cubes and blocks, lines 160-260; the drawing at the end of the file), `src/content/palette.ts` (the gold and ash tokens).
