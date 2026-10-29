# Carryables

Status: idea. The husk has its own document ([HUSK](HUSK.md)); the rest of the list is here. Index: [stations](README.md).

Today the hand carries loose blocks and bombs. Stations need more: ingredients, outputs, and things the player can eat. The proposal is that a carryable is a cube with a kind beyond its material, so the pick-up, kick, throw and place behaviour stays one path. Every carryable is a small cube with its own texture.

## The list

| Carryable | Where it comes from | Meaning | Used in |
|---|---|---|---|
| Mushroom, root, tuber | Floor 0, the roots; mushroom beds in damp rooms | The earth feeds you | [HEARTH-STOVE](HEARTH-STOVE.md), [CAULDRON](CAULDRON.md) |
| Fruit, resin, seed pod | The tree above (trunk, branches) | What grows when you climb | Kitchen, laboratory, planters |
| Fish or eel (maybe) | Deep water rooms, a fishing spot in a cistern | Feelings you dared to swim into | [SMOKEHOUSE](SMOKEHOUSE.md) |
| Ice | Floor 9 (frozen), cold rooms | What froze; melts near heat into water | Puts out fire, fills a channel, kept in an [ICE-BOX](ICE-BOX.md) |
| Coal and ash | [FURNACE](FURNACE.md) (crate to coal), [PYRE](PYRE.md) (anything to ash) | Spent fuel; what is left after letting go | Fuel; ash fertilises [PLANTER](PLANTER.md) |
| Glass, iron, brick | Furnace outputs ([GLASS](../elements/GLASS.md), [ELEMENTS](../elements/FURNACE.md)) | Refined matter | Building, lenses, conductive paths |
| Jar | Laboratory shelves ([SPECIMEN-SHELF](SPECIMEN-SHELF.md)) | Something preserved, waiting to be understood | Holds water, lava or an essence; thrown, it shatters and spills |
| Meal | Kitchen outputs | Care given to yourself | Eaten with the use key while held: heals or gives a short state |

## Meals

- Food never punishes. There is no debuff for eating.
- A meal is eaten with the use key ([README](README.md), rule 3). Open: is it instant, or does a short animation leave the player exposed for a moment? The owner asked this in [OPEN-QUESTIONS](OPEN-QUESTIONS.md).
- A meal set on the [LONG-TABLE](LONG-TABLE.md) is eaten as a group.

## Open questions

1. Is a fish a carryable from the start, or does it wait for the fishing spot?
2. Does a jar of lava (listed as "lava (!)") need a separate fire rule, or does lava stay in the elements design?
3. A jar that spills is a hazard. Does a spilled jar leave water or lava in the room?
