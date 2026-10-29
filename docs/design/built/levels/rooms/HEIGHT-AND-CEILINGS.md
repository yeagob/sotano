# Height, ceilings, pits and layers

Up: [rooms](README.md) · Status: built.

A room is five blocks high unless its template says otherwise, up to eight. Above five, the extra height is shaped into a ceiling: a barrel vault, a dome, a pointed arch, a crossing of two vaults, steps, or an uneven cave roof. Below the floor, a room may dig pits and dips. Above the floor, it may carry layers: grids of single blocks for bridges, balconies and galleries. Together these give the rooms their depth. They also keep every room inside its band, so no room ever touches the floor above or below.

## Height

- **Five by default.** Twenty-eight templates keep the standard five blocks; the other fifty-eight raise it.
- **Six to eight when the template says so.** Fifty-eight templates set a height: 18 of them six, 23 seven, 17 eight. Eight is the most a room may be.
- **The band holds it.** A room's interior, plus the two brick layers over it, stays inside its sixteen-block band, with three rock layers between it and the next band.

## Ceilings

A ceiling is the shape of the height above five. A non-flat ceiling needs a height above five. The build has eight shapes and 42 uses of them:

| Ceiling | Uses | What it is |
|---|---|---|
| dome | 12 | a round roof over the whole room |
| vault along X | 9 | a barrel vault running east to west |
| vault along Z | 7 | a barrel vault running north to south |
| cave | 5 | an uneven roof, higher in some places than in others |
| stepped | 3 | the roof climbs in steps across the room |
| pointed along X | 3 | a pointed arch running east to west |
| cross | 2 | two vaults crossing over the middle |
| pointed along Z | 1 | a pointed arch running north to south |

Vaults and domes only shape the height above five; they never add more than the template's height allows. The shape is a rule of the room, not of the floor: a floor's rooms may have several ceilings.

## Pits and dips

- **Pits.** A pit digs up to two blocks below the floor (the rule of the band). Sixteen templates have pits; the trenches the player builds across are pits of two. A pit is lined with brick when it is deep, so its walls hold.
- **Holes five deep.** A plateau of three bricks can stand over a two-deep pit. From the plateau's top the drop is five, and a pillar of the plateau is what the player jumps to. The long gallery and the chasm use this.
- **Dips.** A dry hollow one block deep. Two templates have them (the dig field and the styx cavern).

## Layers

Thirteen templates carry layers: single blocks above the floor at heights from one to the template's height minus three, leaving two blocks of headroom over anything you can stand on. A layer stands on a block or spans between blocks; no block floats alone. A flame on a layer needs a terrace exactly that high under it: a brazier on a pillar. A layer may not block a door, the centre (below door height), the pedestal or the shaft.

## Terraces

Brick stacks one to four blocks high stand on the floor as stairs and tiers. Twenty-one templates use them. They are how the player climbs in a room without building, and how a room's vantage points are made.

## The rules the validator enforces

- The height is a whole number from five to eight.
- A non-flat ceiling needs a height above five.
- Each layer sits at a height from one to the height minus three, and no two layers share a height.
- Nothing stands less than two blocks under the ceiling, except the walls of the room.
- A pit digs no deeper than two blocks.

Code: `src/content/rooms.ts` (the height and ceiling fields, the shapes, the layers and the validator), `src/world/floor.ts` (carving the ceilings and the pits), `tests/levels.test.ts` (every element template across every pair of bands).
