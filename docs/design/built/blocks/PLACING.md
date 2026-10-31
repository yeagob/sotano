# Placing

Putting the top block of your hand back into the world, on the face you aim at.

Part of [blocks](README.md).

## What the player sees and feels

- You aim at a face of a block and press place. The top block of your hand goes into the empty cell against that face, within reach of about five blocks.
- A placed block replaces a loose cube that sits in that cell.
- Placing is refused when the cell is outside the world or a doorway. A body that reaches into the cell is handled like Minecraft, without throwing anything: if it reaches a quarter of a block or less into the cell, you are nudged out of it and the block goes down; if it reaches deeper, the block stays in your hand until you step clear. A nudge into a wall is refused the same way.
- A face you aim at whose cell takes no block (a doorway, the world's edge) is refused with the same soft sound, and the block stays in your hand. The block is never thrown from there, so it cannot bounce back at you.
- On a keyboard or a gamepad, if there is no face in reach at all, the same action throws the block instead (see [KICK-AND-THROW.md](KICK-AND-THROW.md)). On touch, a tap places on the block under the finger, and a tap that finds nothing is refused with a soft sound rather than thrown.
- A part is placed the same way, but it lies on the floor as a part, and it can be picked up again after a short delay.

## The rule behind it

The design asks for placing like Minecraft: aim at a block face and place it, with about five blocks of reach ([DESIGN.md, section 6](README.md)). The one rule the player meets on top of that is that a block cannot be placed inside the player's own body, so you cannot trap yourself by accident.

Code: `src/game/game.ts` (`tryPlace`: placing a block or a part, the throw fallback, the tap rule and the body nudge within the same function).
