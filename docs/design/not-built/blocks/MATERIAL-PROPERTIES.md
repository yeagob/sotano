# Material properties

The flags a material could carry beyond the ones the game has, and what each would do in play.

Status: proposal

Part of [blocks (not built)](README.md).

## The design

Every material could carry properties, data rather than code. Items and enemies would read them: a fire intention burns wood, an explosive enemy breaks stone, a falling heavy block crushes an enemy ([DESIGN.md, section 5](README.md)).

The list in the design is: flammable, explosive, conductive, fragile, heavy, luminous, bouncy, sticky, and liquid in a later phase.

## What each would do

- **Flammable**: built. Fire or lava burns it away ([built/blocks/MATERIAL-FLAGS.md](../../built/blocks/MATERIAL-FLAGS.md)).
- **Explosive**: the design gives no effect of its own for the flag; it says enemies and items would read it, and an explosive enemy breaks stone. A candidate reading is a block that blasts when it breaks.
- **Conductive**: the design gives no effect. Electricity is part of the elements section.
- **Fragile**: breaks when it falls ([DESIGN.md, section 5](README.md)).
- **Heavy**: hurts what it lands on, and a kicked heavy block hurts more ([built/blocks/KICK-AND-THROW.md](../../built/blocks/KICK-AND-THROW.md)). The flag is declared on two built materials and read by nothing.
- **Luminous**: the design gives no effect of its own; the light block in [ACTIVE-BLOCKS.md](ACTIVE-BLOCKS.md) is the design's light.
- **Bouncy**: the design gives no effect. A candidate reading is a surface that returns what lands on it.
- **Sticky**: the design gives no effect. A candidate reading is a surface that holds what touches it.
- **Liquid**: a fluid, later. Fluids belong to the elements section, not this one.

## Open questions

1. **Which ship.** The design lists nine flags and does not say which the owner wants first, or what most of them do. Heavy is the one already declared in the code; the owner should choose the order and the effects.
2. **Fragile and break.** How is a fragile block different from one that breaks under a hit? The design says it breaks when it falls, and says nothing else.
3. **Explosive and the bomb.** A block that blasts when it breaks is close to the built bomb ([built/blocks/BOMBS.md](../../built/blocks/BOMBS.md)). Should an explosive block be a bomb, or a different thing?
