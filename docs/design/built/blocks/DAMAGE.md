# Damage and repair

How much a hit takes off a block, what armour does, and how a positive intention mends a block instead.

Part of [blocks](README.md).

## What the player sees and feels

- Every hit on a block takes its mining off the block's hit points, less the block's armour. A block that is hit and survives stays damaged: its hit points are remembered, and the next hit starts from there.
- Armour makes the hard blocks slower, not immune. A hit always takes at least a tenth of its full value.
- A positive intention on a damaged block mends it by its mining, with no armour. A block that is mended to full is no longer damaged. A positive intention never breaks a block.
- Breaking a block sends a short burst of its particles and a sound of the block's tier.
- Explosions, fire, crush and headbutt all damage blocks by the same rule, with their own amounts.

## The rule behind it

Damage to blocks and damage to projections are separate numbers everywhere: an intention carries damage for projections and mining for blocks, and nothing multiplies one by the other ([DESIGN.md, section 4](README.md) and the architecture of actors). A positive intention is the one way the player repairs the world, and it can only repair what has already been hurt.

Code: `src/core/damage.ts` (the damage a block takes after armour, lines 9-16), `src/game/game.ts` (the damage to a block, lines 1376-1390; the repair, lines 1592-1602; the intention's rule on a block, lines 1473-1490).
