# The star map

Up: [giant tree](README.md) · Status: built. Owner decision D15 of #149: the star map goes in the crown, and Opus designs it.

The star map is the third tab of the menu screen, beside the menu and the practices. It belongs to the crown: the owner's line for the tree was "leaves as a star map", so the map draws every place as the crown sees it, as stars. Under the ground it draws the floor you stand on as a constellation; above the ground it draws the crown from above, with the Leaves and the stars.

## Opening and closing it

| Device | Open | Close |
|---|---|---|
| Keyboard and mouse | **M** (in play, on the pause card or on another tab), or click the **Star map** tab | **M** again, **Esc**, or the ✕ |
| Gamepad | **View** (in play or on the screen) | **View** again, or **B** |
| Touch | the tab button, then the **Star map** tab | the ✕, or the tab button |

Opening it pauses the world, as the screen always does. The arrows and the d-pad do nothing on it; it is read, not used.

The pause card's controls list shows the map row once the star map has been opened in the run (issue #349). No item grants the map, so its first opening is what the list counts; a new run starts without the row.

## The floor as a constellation

- **Rooms are stars, doors are the lines between them.** A room you have been in is a bright four-point star; a room whose door you have seen is a small dim star; the lines are the doors you have seen, dotted.
- **You** are the star in gold, with a gold bar under it.
- **Special rooms** keep the minimap's marks: the start's house, the treasure room's hollow diamond, the vault's ▭ in brass, the boss's ▣.
- **The Cartographer's mark.** When the Cartographer marks the vault or the boss, that room gets four brass corners on the map, on its floor, even before you have seen a door to it.
- **The Star-reader's room.** When you take the Star-reader's light, its room gets a ring of eight points on its floor's map.

## The crown from above

- **The crown** is a dotted ellipse of leaves, the trunk a dotted ring of bough under it.
- **The Leaves** are a small room of young leaves with their ring of starstone at the centre (see [LEAVES](LEAVES.md)); the last stair is a ring of bough beside it.
- **The stars.** Once the stars story has grown, each star pad is a small starstone star; the last one, the way up into the sky, carries a point above it.
- **The stars.** The pads are drawn as stars, with no lines between them: the pads carry no teleport, and the route is climbed with the jumps (issue #325). The card's line says whether the Star-reader has read the stars for you (you took its light).
- **You** are a small gold star, where you stand.

A line under the title says what the map shows (the floor, the crown read or unread, or that the stars are not out yet) and how to close it on the device you last used. A legend under the map gives each glyph with its words; nothing is told by colour alone.

## What it does not do

The map never shows a room you have no way of knowing: no plan of the whole floor, no rooms behind unseen doors (except the two marks the presences give). It does not move you: the star pads carry no teleport (issue #325), so stepping on one does nothing.

Code: `src/game/star-map.ts` (the map's model, its pixel art and its card), `src/game/hud.ts` (the tab), `src/game/game.ts` (the marks and the view), `src/input/bindings.ts` (`map`), `index.html` (the tab and its styles). Words in `src/i18n/locales/` (`starmap.*`, `tab.map`). The look: [DECISIONS §14.3](../../../../art/DECISIONS.md). Tested in `tests/star-map.test.ts`.
