# Hands: what you carry

How the player's hand holds loose blocks and parts, how many it holds, and what it does not hold.

Part of [the player](README.md).

## What the player sees and feels

- By default you carry one block. What you carry is shown in your hands, at the bottom of the view; the hand shows the top of the stack.
- Walking into a loose block picks it up if your hand has room. If your hand is full, you kick it instead ([KICK-AND-THROW.md](../blocks/KICK-AND-THROW.md)).
- Bombs cannot be picked up. Walking into one kicks it.
- Parts, the things a released projection leaves behind, also take a slot in your hand, like a block. Walking into one lifts it if there is room. They have no effect when carried. On floors 0 to 4 the toll window lists the parts you carry, and a part given there is gone. You place or throw a part exactly as you would a block. A placed part lies on the floor and can be picked up again after a short delay.
- Keys and bombs are counters. They are not held in the hand and cost no slot.
- Picking up a practice, or a part, raises your hands for about a second and a half. While they are raised you cannot cast.

## The rule behind it

Carrying is the one way the player moves matter. The design keeps it to one block by default, so that climbing back up is a problem to plan, not a repetition to endure ([DESIGN.md, sections 4 and 6](README.md)). Parts are collectible but not items: they take a slot and have no effect of their own. Keys and bombs are the only counters that cost no slot.

Code: `src/entities/player.ts` (the hand and the stack), `src/game/game.ts` (walking into a loose block, lines 1691-1728; the parts pickup, lines 2088-2092; placing and throwing, lines 1913-1980), `src/content/parts.ts` (the header: parts have no effect), `src/render/hands.ts` (the hands in view and the raised hand, lines 111-122).

## The carry stat

The number of blocks you can hold is the carry stat, floored. Its base is 1. Items raise it: one practice adds one, and another adds three.

## Open questions

1. **The name of the carry item.** The design text names a practice "Builder's Hands" that gives plus one carry and, in the practices list, "carry 2 blocks" ([DESIGN.md, sections 6 and 10](README.md)). In the code the plus one comes from a practice called Second Brain (`src/content/items/secondbrain.ts`, the stat line). Is the name the owner's choice, and which name should players see? The same item and its name belong to the practices section.
