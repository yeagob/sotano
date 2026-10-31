[Encounters](README.md)

# Attacks

Built. Every attack is one of a few shapes, and each shape is drawn before it lands. The telegraph is what makes an attack fair: the player always sees where it will land, and for how long, before it does. Code: `src/enemies/attacks.ts` (the shapes and their marks), `src/enemies/moves.ts` (boss moves), `src/entities/enemies.ts` (projectiles).

## The telegraph

Every strike has a lead time. During it the strike's shape is drawn on the floor in marks, and motes rise from its shape, brighter as it comes due. A boss move's windup is the same idea: the boss stops and its tells brighten before the act. Lead times are at least 0.4 seconds.

When the strike is live, its marks are doubled and shed sparks along the front, so the attack reads as force, not as dots. Then it is gone.

### Colour: a warning is yellow, a blow is red

An attack that deals damage **warns in yellow** while it is coming: its marks, its reach ring and its telegraph, including a telegraph that deals no damage itself but warns of a blow that does (a charge's aim line, a slam's landing mark, an inhale's mouth ring). When the blow lands, its marks turn **red**, and every hostile shot is red. Particles and decoration are **pale blue-white** and never yellow or red: the sparks, the rising motes, the dust, and an attack that does not hurt (a pull, a slowing field). The yellow is a warning only: it is never the player's gold. The dimmer yellow marks a growing ring's reach; the bright yellow marks the warning itself. The rule and its tokens are in [DECISIONS §7.6](../../../art/DECISIONS.md) (issue #47, owner ruling 2026-10-31).

## The shapes (built)

| Shape | What it is | Telegraph | Answer |
|---|---|---|---|
| Line | A straight run along a path (a charge) | A dashed line on the floor along the path, yellow when the charge hurts | Get off the line; a block in the path stops the charge |
| Ring | A circle growing out from a point (shockwave, landing) | A ring on the floor, shrinking or growing | Jump it (about 0.8 blocks high) |
| Sweep | A wall of water or stone that crosses the room (a tide) | A ridge of motes forms along the wall | Jump it (about 1 block high), or get above it |
| Field | An area that changes a rule (slow, mute; a sting hurts) | A ring of dots turns around the area, yellow when it stings | Leave the area |
| Pull | A drag toward a point | Motes stream toward the source | Break line of sight, or stand behind a block |
| Bolt | A straight shot from a body | The body brightens through the windup, with a windup cue | Step aside, or put a block between |
| Lob | An arc that lands | A dot marks the landing, yellow while it is in the air and red when it lands (it hurts) | Move off the mark |
| Stones | Rubble falling from the ceiling | A mark for each stone's landing | Move off the mark |
| Bars | Lines across the room, in parallels or crossed | Dashed lines across the floor | Stand between the bars |
| Puddles | Stinging pools that stay for a few seconds | A mark at each pool | Leave the pool |

Some moves are a chain of these (a combo): each part has its own telegraph, with a short gap between.

## Blocks shield the player

A bolt or a lob that reaches a solid block dies on it, and the block gives off a puff. A placed block between the boss and the player stops a shot; a charge stops at a block it hits. This is the core answer of the game to a projection: what you build protects you.

## Projections and the blocks

Projections live in the same matter as the player. Built: a charger breaks soft blocks along its line and stops at a hard one; a burst breaks blocks around it; a boss breaks the soft blocks at its sides as it moves, and the rubble it sheds is harmless to it until the player moves it. Not built: a burrower tunnels through rock; a leaper cracks soft floor where it lands; a Procrastination stacks crates; an Avoidance hides inside a block (see [not-built spawn kinds](../../not-built/encounters/spawn-kinds/BLOCK.md)).

## Intentions and attacks

A projectile hits the first actor that is hostile to its thrower and that it touches. A projection's bolt can therefore hit a converted ally on its way to the player.

Attacks deal their own damage. A boss's touch deals 8, the same as a full heart. Projections' contact is smaller; see their documents.

## Open questions

- **Dashes.** The design asks for the dashed line to last 0.6 to 0.9 seconds before a charge. The build's line lasts the windup, which the move sets (0.45 to 0.9 seconds). Check the marks read in time.
- **Crossing rooms.** Line and sweep attacks cross the whole room. The design asks that they always leave an answer: a height to stand on, a block to put in the way, a gap. Each boss move is checked in its document; the sweep's height is one block.
- **The sting.** A field can sting. In the build the sting does nothing to the player. Decide whether it should hurt.
- **Glyphs and ✗ marks.** The design's ✗ marks and glyph rings are a projection's signature. Only the glyph ring is built, as a field.
