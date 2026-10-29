# Climbing back up

How the player gets back up after going down. The design calls this the key decision in the block design: climbing four floors one block at a time, the way Minecraft does, is tedious.

Status: proposal

Part of [the player (not built)](README.md).

## The problem

The player carries one block by default ([HANDS.md](../../built/player/HANDS.md)). Climbing by placing a block below you, again and again, is repetition, not a puzzle. The design keeps the one-block rule and makes climbing a matter of resources and knowledge instead ([DESIGN.md, section 6](README.md)).

## The options the design names

- **Growing blocks.** A vine seed that grows upward until it touches a ceiling. A ladder that extends itself.
- **Items that bend the rule.** Carry two blocks; stack blocks of the same type; jump higher; float. The name for carrying two is a question in [built/player/HANDS.md](../../built/player/HANDS.md).
- **The way back on a floor.** After the boss of a floor is beaten, its trapdoor leaves a ladder back up, but only if the player opened that floor's trapdoor on the way down. The levels section decides how the trapdoor works.
- **Digging.** A diagonal staircase upward is always possible, just slow.

The owner's intent, as the design puts it: "how do I get back up" becomes something you plan on the way down.

## Open questions

1. **One block, or stacking.** Should the player keep one block only, or may they stack blocks of the same type? The design recommends one block, plus items and special blocks that relax it ([DESIGN.md, section 13, question 1](../README.md)).
2. **Which growing solution.** The design names both the vine seed and the self-extending ladder. Does the game need one, both, or neither? A growing block would be a block with a placed effect, the kind listed in [ACTIVE-BLOCKS.md](../blocks/ACTIVE-BLOCKS.md).
3. **The trapdoor ladder.** Whether the trapdoor leaves a ladder back up is a level question as much as a player one. It is recorded here because it is one of the climbing options.
