[Built](../README.md) · [Design](../../README.md)

# Creatures (built)

Creatures are the living things of the depths: instinct, curiosity, play, rest and care. They are not patterns and never become projections. They are neutral: no projection hunts them, and they hunt nothing. The player can harm them with negative intentions and heal them with positive ones, and they never die. Thirteen are in the game, placed in the rooms of floors 0 to 9 by `src/content/creatures/index.ts`. Each one has its own document; what they share is below.

| Document | Creature | Floors | Answers only positive intentions |
|---|---|---|---|
| [WONDER.md](WONDER.md) | Wonder | 0 | No |
| [ROOTLING.md](ROOTLING.md) | Rootling | 0 | No |
| [MOSSLING.md](MOSSLING.md) | Mossling | 0 | Yes |
| [CHIRPER.md](CHIRPER.md) | Chirper | 1 to 2 | No |
| [DELVER.md](DELVER.md) | Delver | 1 to 3 | No |
| [BUBBLER.md](BUBBLER.md) | Bubbler | 3 to 4 | No |
| [FERRYBACK.md](FERRYBACK.md) | Ferryback | 3 to 4 | No |
| [DRIFTER.md](DRIFTER.md) | Drifter | 5 to 6 | No |
| [INKMITE.md](INKMITE.md) | Inkmite | 5 to 6 | No |
| [CINDERWALKER.md](CINDERWALKER.md) | Cinderwalker | 7 to 8 | No |
| [HUDDLER.md](HUDDLER.md) | Huddler | 9 | Yes |
| [LEAFLING.md](LEAFLING.md) | Leafling | 1 to 5 | Yes |
| [STAR-MITE.md](STAR-MITE.md) | Star-mite | 1 to 5 | Yes |

## What they share (built)

- **Kind and side.** Each is a creature in the code, in the neutral faction. Their look uses the living tones (`living.*`), not a projection's cold eye.
- **Never killed.** A creature at zero health is not removed. It is hidden: it drops out of sight and out of play until its room clears.
- **Polarity.** A negative intention harms a creature. At zero it flees into the blocks, and it stays hidden until the room clears. A positive intention heals it. The four positive-only creatures ignore negative intentions entirely: they pass through, with no harm and no flight.
- **Gift.** A creature healed to full by a positive intention drops a heart, once for that creature.
- **Seal and clear.** When a room with projections seals, its creatures hide. When the room clears, they return at full health.
- **Blasts.** Explosions push creatures gently and never hurt them.
- **Silence.** No creature speaks. Chirpers sing; others make no sound of their own.
- **Placement.** Ambient creatures are placed in normal and start rooms of their floors, a few per floor. They are not part of any projection roster.

## Open questions (shared)

- **Hidden for good.** A creature hidden by a negative intention, or by fire, in a room that never holds projections is never shown again: the room never seals, so the clear that brings creatures back never happens. Check in play (the code reading suggests it).
- **Gift once.** The gift is tied to the creature instance, not the visit. Does a creature heal again on a later visit, or stay gifted for the run?
- **Living palette.** The design calls the living side a proposal awaiting an art ruling. The build uses it already. The ruling is still needed for the colour-blind and grey tests.
- **The Tree.** Leafling and Star-mite are placed on floors 1 to 5, the level kind the code calls the tree. The design places them on the Tree above the surface, which is not built. See their documents.
- Interactions (burrowing, befriending, rides, thawing, cleaning, doors) are not built. They are in [not-built/creatures](../../not-built/creatures/README.md).
