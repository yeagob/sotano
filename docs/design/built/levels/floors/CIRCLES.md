# The circles (floors 6 to 9)

Up: [floors](README.md) · Status: built.

The last four underground floors are Dante's circles six to nine, laid out as random plans in the style of Isaac: a handful of rooms joined at random, with the special rooms at the dead ends. Each circle is harder, with more rock and more elements than the one above, and the ninth is frozen.

## How the plans work

- **Size.** Eight to eleven rooms per floor.
- **The boss.** The boss room sits at the dead end farthest from the start. It holds the way down.
- **The treasure.** Another dead end holds the treasure room.
- **No vault.** These floors keep no locked vault: the vault rooms become normal rooms, so the catalogue of practices lasts the whole run.
- **A challenge room.** A challenge room may take a dead end on any hostile floor, two plans in five (see [rooms/CHALLENGE](../rooms/CHALLENGE.md)).
- **Bigger rooms.** Templates that spread over more than one cell are chosen more often here: their weight is multiplied by 3 to 4 on these floors (see [rooms/MULTI-CELL](../rooms/MULTI-CELL.md)).

## The circles

| Floor | Circle name on the HUD | The room that marks it |
|---|---|---|
| 6 | The walls | `dis-hall`: the walls of Dis, a ditch of lava beyond the graves of flame |
| 7 | The rivers | `river` and `giants-well`: a river of lava, and trenches cut by the sides |
| 8 | The ditches | `ditches`: a row of holes the player builds across |
| 9 | The ice | `cocytus`: the frozen bottom, its pools ice |

The names are the HUD's; they name a place, not a figure. The rooms that mark each circle are in [ELEMENT-ROOMS](../rooms/ELEMENT-ROOMS.md) and [TEMPLATES](../rooms/TEMPLATES.md).

## The frozen ninth

- **Ice.** Every pool of water carved on floor 9 is ice on its surface; the water under the ice stays liquid. Ice is solid, breakable and slippery (see [ICE-AND-WOOD](../../elements/ICE-AND-WOOD.md)).
- **Silence below.** The boss room's hole drops the player into the silence chamber, the one place with no toll (see [SILENCE](SILENCE.md)).

## Using Dante

The circles borrow Dante's structure and images, never his figures. The rule the owner set: projections are patterns, never people; no one is punished in a circle; there is no gore. The names of the circles, the order, and the places (the winds, the rain, the ice) come from the poem. Nothing in a circle is a named sinner.

## Way down

The way down from floors 6 to 8 is a two-by-two shaft in the boss room; the toll applies (see [TOLL](TOLL.md)). Floor 9 has no toll.

Code: `src/world/floorplan.ts` (the random generator and the dead ends), `src/world/floor.ts` (ice in the ninth floor's pools, the silence chamber, no vaults below floor 5), `src/content/levels.ts` (the circles, palettes, rock and the frozen flag), `src/content/rooms.ts` (the circle templates).
