# What items change in the shot

The properties an intention can gain from items: more of them, through blocks, bouncing off blocks, and steering toward them.

Part of [intentions](README.md).

## What the player sees and feels

- **Volley.** Extra intentions leave in a fan with the first one. Each extra one deals a share of the damage and mining, and they spread to alternating sides.
- **Pierce.** An intention that breaks a block keeps going through it, and loses one pierce for each block. By default pierce works only through the softest blocks, the ones of tier zero. Pierce never passes a projection: a projection stops the intention.
- **Phase.** An intention passes through a block without breaking it, losing one phase for each block it passes through. A projection still stops it.
- **Bounce.** An intention that hits a block that does not break rebounds from it, keeping most of its speed, and loses one bounce each time.
- **Homing.** An intention bends toward the nearest block within about six blocks of it, re-aiming a few times a second. The stronger the homing, the sharper the bend.

Items compose: an intention can carry several of these, and each is read from the shot's own properties when it meets something.

## The rule behind it

The shot is the place where items add their effect, so that an item changes a rule rather than a number. The contract for items is in [the items architecture](../../../architecture/ITEMS.md). The design's golden rule is that an item touches at least two systems ([DESIGN.md, section 10](../../not-built/practices/README.md)); each shot change here reads the intention's own properties, so an item that adds one composes with the others.

Code: `src/combat/intents.ts` (the volley when fired, lines 110-119; the homing, lines 130-140; the contact, the pierce, the phase and the bounce, lines 160-260), `src/content/items/` (the practices that add them; their names and descriptions belong to the practices section).

## Open questions

1. **What homing seeks.** The design sketches a magnet item whose intentions home in on enemies, and asks whether they should home in on blocks instead ([DESIGN.md, section 10](../../not-built/practices/README.md)). The built homing seeks the nearest block within six blocks, and it does not seek projections. Which target does the owner want for homing?
