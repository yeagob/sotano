# Placing

Putting the top block of your hand back into the world, on the face you aim at.

Part of [blocks](README.md).

## What the player sees and feels

- You aim at a face of a block and press place. The top block of your hand goes into the empty cell against that face, within reach of about five blocks.
- A placed block replaces a loose cube that sits in that cell.
- Placing is refused when the cell is outside the world, inside your body, or a doorway.
- On a keyboard or a gamepad, if there is nothing to place against, the same action throws the block instead (see [KICK-AND-THROW.md](KICK-AND-THROW.md)). On touch, a tap places on the block under the finger, and a tap that finds nothing is refused with a soft sound rather than thrown.
- A part is placed the same way, but it lies on the floor as a part, and it can be picked up again after a short delay.

## The rule behind it

The design asks for placing like Minecraft: aim at a block face and place it, with about five blocks of reach ([DESIGN.md, section 6](README.md)). The one rule the player meets on top of that is that a block cannot be placed inside the player's own body, so you cannot trap yourself by accident.

Code: `src/game/game.ts` (placing a block or a part, lines 1914-1952; the throw fallback and the tap rule within the same function).
