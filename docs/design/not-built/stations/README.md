# Stations, props and zones

Status: idea. Brainstorm, nothing decided or built. Everything here waits for the owner's choice before it becomes content.

This folder is the not-built part of the stations catalogue: the interactive **stations** that could furnish a room (furnace, kitchen, laboratory, garden, forge and the rest), the **loading and unloading zones** that hold, demand or send cubes, the **props** that only decorate, the **special blocks** that change movement or combat locally, and the **carryables** a station works on. A station is a design idea first: what the player does with it, what it means, and how it helps the climb up and down. Numbers are placeholders and names are proposals until they pass [sotano-lore](../../../../.claude/skills/sotano-lore/SKILL.md).

## The owner's brief

The owner asked for interactive elements in the levels: a furnace where stone is transformed or objects are burned; a kitchen where the player gets things, with the block hand able to carry other items, such as pieces of an enemy to cook; a document of ideas for themed blocks and tables, purely aesthetic decorations, special interactive blocks, and loading and unloading zones; and a brainstorm of other elements for the layouts (a torture table, but also an experimentation laboratory), analysed for their uses and their place in the game's verticality.

## What a station is


A station is a fixed object in a room that **transforms what the player brings to it**. The obstacle becomes the way: a broken stone, a husk, a jar of something preserved goes in, and something else comes out after a while. Stations are where the alchemy of the descent (nigredo to rubedo, [ART-GUIDE §4](../../../art/ART-GUIDE.md)) becomes something the player does with their hands.

## Rules of the proposals

1. **Everything is a cube.** A carryable is a small cube with its own texture, picked up by walking over it, kicked, thrown and placed like stone. There are no menus and no inventory grid ([DESIGN](../README.md) describes the one-block hand).
2. **Stations are verbs.** The player feeds a station by throwing, kicking or placing a cube into its mouth. The station answers in the world: a cube pops out, a flame grows, a door moves. Its state shows on the block itself (glow, smoke, a filled slot), readable with no text.
3. **The use key is chosen by the controls.** Where a document says "use", the key is not fixed here. F is the polarity key ([KEYBOARD](../../../architecture/input/KEYBOARD.md)), so no station may use it.
4. **Every prop answers an intention.** Even decoration breaks into shards or reacts. A prop that never reacts is a fixed point with a stated reason (an altar, a bell). Meaning test: [ART-GUIDE §12](../../../art/ART-GUIDE.md).
5. **Projections live with stations.** Each station changes a fight ([PROJECTIONS-AT-STATIONS](PROJECTIONS-AT-STATIONS.md)).
6. **The house rules still hold.** Nothing reacts on load, door approaches, the centre and the shaft stay clear, and no room reaches another floor ([sotano-levels](../../../../.claude/skills/sotano-levels/SKILL.md)). Floor-crossing ideas need an explicit exception and a three-party review ([VERTICALITY](VERTICALITY.md)).
7. **Respect.** Instruments of self-punishment are relics of a pattern, never a scene of people being hurt; no gore, no bodies, no victims. Food is nourishment and care, never moralised. Instruments are placed in circle 7 and on the Inner Critic's floor, always with a way to dismantle them, never on the wood of the suicides, and never with chains on a figure.
8. **Positive intentions where the owner says so.** Creatures of the sky are won with positive intentions; stations that take intentions say which polarity they take.

## Effort tiers

| Tier | What it needs | Example |
|---|---|---|
| T0 | A material and template characters only | Bookshelves, hanging roots, candles |
| T1 | A block with one simple reaction (on hit, on touch, on use) | Bell, mirror, bounce pad, ladder |
| T2 | A block entity: slots, a timer, an output ([ELEMENTS architecture](../../../architecture/ELEMENTS.md)) | Furnace, hearth, alembic, planter |
| T3 | A system across rooms or floors | Dumbwaiter, depots kept for the climb, the athanor's slow work |

## Documents

| Document | Family | Contents | Tier | Status |
|---|---|---|---|---|
| [FURNACE](FURNACE.md) | Fire | Fuel and input to a refined cube | T2 | proposal |
| [PYRE](PYRE.md) | Fire | The burning barrel made a place; an updraft | T2 | idea |
| [KILN](KILN.md) | Fire | Soft dirt to a light tile, slowly | T2 | idea |
| [FORGE](FORGE.md) | Fire | Hot iron and a hit of intention to a tool cube | T2 | idea |
| [BELLOWS](BELLOWS.md) | Fire | A gust that feeds fire and lifts | T1 | idea |
| [ATHANOR](ATHANOR.md) | Fire | One cube worked for a whole floor | T3 | idea |
| [HEARTH-STOVE](HEARTH-STOVE.md) | Kitchen | Ingredient and fire to a meal | T2 | idea |
| [CAULDRON](CAULDRON.md) | Kitchen | Water and ingredients to a broth | T2 | idea |
| [LARDER](LARDER.md) | Kitchen | Stores ingredients; rots what is left too long | T2 | idea |
| [SMOKEHOUSE](SMOKEHOUSE.md) | Kitchen | Preserves husks and fish | T2 | idea |
| [ICE-BOX](ICE-BOX.md) | Kitchen | Keeps ice and food cold | T2 | idea |
| [LONG-TABLE](LONG-TABLE.md) | Kitchen | Eat four meals together | T1 | idea |
| [MUSHROOM-BED](MUSHROOM-BED.md) | Kitchen | Grows ingredients in damp rooms | T2 | idea |
| [SLUICE-GATE](SLUICE-GATE.md) | Water | Releases a contained pool along a channel | T1 | idea |
| [PUMP](PUMP.md) | Water | Raises water one block per kick | T2 | idea |
| [WATER-WHEEL](WATER-WHEEL.md) | Water | Turns with flowing water; powers what touches it | T3 | idea |
| [WELL](WELL.md) | Water | A bucket lowered on the use key | T2 | idea |
| [DRAIN](DRAIN.md) | Water | Sends water to the room below | T3 | idea |
| [EXPERIMENT-TABLE](EXPERIMENT-TABLE.md) | Laboratory | Two cubes and an intention combine | T2 | idea |
| [FIELD-NOTES](FIELD-NOTES.md) | Laboratory | A lectern that keeps discoveries across runs | T3 | idea |
| [ALEMBIC](ALEMBIC.md) | Laboratory | Distils; the brewing design is in potions | T2 | proposal |
| [MORTAR](MORTAR.md) | Laboratory | Grinds a cube to powder | T1 | idea |
| [SCALES](SCALES.md) | Laboratory | Balance opens a cabinet or a door | T1 | idea |
| [SPECIMEN-SHELF](SPECIMEN-SHELF.md) | Laboratory | Jars of husks that release their light | T1 | idea |
| [LENS-BENCH](LENS-BENCH.md) | Laboratory | A lens and a mirror bend an intention | T1 | idea |
| [TESLA-COIL](TESLA-COIL.md) | Laboratory | Arcs to iron and water (electricity milestone) | T2 | idea |
| [RACK](RACK.md) | Instruments of self-punishment | Splits a cube into two of the tier below | T2? | idea |
| [PRESS](PRESS.md) | Instruments of self-punishment | Two soft cubes make one harder | T2 | idea |
| [STOCKS](STOCKS.md) | Instruments of self-punishment | Holds a projection for a few seconds | not set | idea |
| [WEIGHING-CHAIR](WEIGHING-CHAIR.md) | Instruments of self-punishment | Sit and see how many hearts you "weigh" | not set | idea |
| [PLANTER](PLANTER.md) | Garden | A planted bomb grows a vine, not a blast | T2 | idea |
| [COMPOST](COMPOST.md) | Garden | Husks and ash to soil that speeds planters | T2 | idea |
| [ROOT-TAP](ROOT-TAP.md) | Garden | Sap and resin from a thick root | T1 | idea |
| [BEEHIVE](BEEHIVE.md) | Garden | Honey; bees chase whoever breaks it (maybe) | T2 | idea |
| [ARCHIVE-SHELF](ARCHIVE-SHELF.md) | Memory and offerings | Cubes kept for later floors | T3 | idea |
| [ALTAR-OF-OFFERING](ALTAR-OF-OFFERING.md) | Memory and offerings | Give something, receive a practice, key or heart | T2 | idea |
| [BELL](BELL.md) | Memory and offerings | Calls every projection in the room | T1 | idea |
| [MIRROR](MIRROR.md) | Memory and offerings | Reflects intentions; on floor circle 8 some show rooms that are not there | T1 | idea |
| [CLOCK](CLOCK.md) | Memory and offerings | Things move only on the beat | T1 | idea |
| [DEPOT](DEPOT.md) | Loading and unloading | Cubes kept across the run | T2 | idea |
| [QUOTA-HOPPER](QUOTA-HOPPER.md) | Loading and unloading | Fill a quota to open something | T2 | idea |
| [CHUTE](CHUTE.md) | Loading and unloading | Cubes fall to the room below | T3 | idea |
| [DUMBWAITER](DUMBWAITER.md) | Loading and unloading | A small box between floors | T3 | idea |
| [MINE-CART](MINE-CART.md) | Loading and unloading | Load, kick, roll and dump | T2 | idea |
| [CRANE](CRANE.md) | Loading and unloading | Hook a cube or yourself and crank it up | T2 | idea |
| [PRESSURE-PLATE](PRESSURE-PLATE.md) | Loading and unloading | Holds a door or lift while something heavy stands on it | T1 | idea |
| [BALANCE-LIFT](BALANCE-LIFT.md) | Loading and unloading | Two platforms on a rope; one goes down, one rises | T2 | idea |
| [SPECIAL-BLOCKS](SPECIAL-BLOCKS.md) | Special blocks | Bounce, reflect, conduct, climb, ring, light | T1 | idea |
| [PROPS](PROPS.md) | Props | Decoration by place, all breakable | T0 to T1 | idea |
| [HUSK](HUSK.md) | Carryables | The shell a released projection leaves | T1 | proposal |
| [CARRYABLES](CARRYABLES.md) | Carryables | Everything else the hand can carry for a station | mixed | idea |
| [THEMED-ROOMS](THEMED-ROOMS.md) | Rooms | Rooms built from these stations, one verb each | mixed | idea |
| [VERTICALITY](VERTICALITY.md) | Rooms | How the stations help going up and down | mixed | idea |
| [PROJECTIONS-AT-STATIONS](PROJECTIONS-AT-STATIONS.md) | Rooms | How each projection behaves near a station | mixed | idea |
| [PRACTICES-USING-STATIONS](PRACTICES-USING-STATIONS.md) | Practices | Practice ideas that would use stations | mixed | idea |
| [FIRST-SLICE](FIRST-SLICE.md) | Plan | The cheapest order for the first build | mixed | idea |
| [OPEN-QUESTIONS](OPEN-QUESTIONS.md) | Plan | Questions for the owner, and conflicts between documents | none | idea |

Not in this folder, on purpose:

- **The chest** is a station in the brief, but it is already covered by [CHESTS.md](../../built/chests/CHESTS.md) and the furnace and barrel by [FURNACE](../elements/FURNACE.md) and [BARREL](../elements/BARREL.md) (not-built elements). CHESTS.md marks the chest as built and ELEMENTS.md calls it designed; see [OPEN-QUESTIONS](OPEN-QUESTIONS.md).
- **Potions and the alembic's brewing** live in [not-built/practices/potions](../practices/potions/README.md).
- **Projections, creatures and presences** live in their own not-built folders.

## Architecture sketch (not design)

A station could be one data shape, so that a new station is content and not code: an identity, the material it is made of (breakable, with shards), its slots and what each accepts, its recipes (inputs, outputs, time, whether it needs fuel), how a cube goes in (throw, place or use), and what happens on break (spill or shards). Results would go through events so practices can hook in, and recipe or drop chance would take their own random streams. This is a key architecture decision: it goes through the three-party review before any code, in [ELEMENTS architecture](../../../architecture/ELEMENTS.md) and [ITEMS](../../../architecture/ITEMS.md), not here.
