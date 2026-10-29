# Room walls and digging out

How the walls of a room should resist digging, so that digging out of a fight is a decision with a cost, not an exploit.

Status: proposal

Part of [blocks (not built)](README.md).

## The design

The design says the player can always try to dig out of a room, and that the game does not forbid it but makes it expensive ([DESIGN.md, section 7](README.md)):

- The walls of a room are one tier harder than the rock around them.
- During combat the walls reinforce visibly: glowing runes, worth one temporary tier more.
- Fleeing forfeits the room's reward.

The design's summary is that digging is a decision, not an exploit.

## What the game does today

A room mood called reinforced hardens the soft obstacles inside a room, so they become harder materials. That is built and belongs to the levels section. The wall rule above, the one about the walls around the room and the runes in combat, is not built. Breaking through a room's walls takes the same hits as any other block of its material ([built/blocks/TIERS.md](../../built/blocks/TIERS.md)).

## Open questions

1. **Which walls.** Should the rule cover every wall of a room, or only the walls between the room and the rock? The design says "room walls".
2. **How much harder.** One tier, as the design says, is a jump from brick to door frame or from stone to deepstone. Is that the feel the owner wants?
3. **The runes.** The glowing runes are the visible sign of the reinforcement. Their look belongs to the art ledger, and the tier they add is temporary. Should the runes stay until the fight ends, or fade?
4. **The reward.** Fleeing forfeits the reward. The reward rules belong to the levels section; this document only records that the rule is about digging out.
