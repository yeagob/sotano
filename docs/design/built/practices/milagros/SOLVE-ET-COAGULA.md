# Solve et Coagula

Up: [Miracles folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Miracles; also the intention and the elements (tags `intent`, `element`) |
| Quality | 3 of 4 |
| Found in | treasure rooms, vault rooms |
| Inspired by | The alchemical formula *solve et coagula* (dissolve and coagulate), an old image of transformation |
| Code | `src/content/items/solvecoagula.ts`; the `intentElement` event, `Intents` (`entered`), `Game.convertFluid` and `ItemApi.convertFluid` |

## What it means

The alchemists loosened what had hardened and hardened what had loosened: one work, run in both directions. Change is that same motion. An intention is the player's own act of light; where it meets water or lava, the work can run.

## What it does

The practice works on the first cell of a fluid that an intention enters (once per entry, not again while it stays in that element).

- **A positive intention in lava** turns the connected lava into water.
- **A negative intention in water** turns the connected water into lava.
- **The section.** The cells of the same fluid that are face-connected to the touched one, in the same room, nearest first, up to **256 cells**. Each cell keeps its level and its falling bit; a source stays a source. The touched cell is the first one converted.
- **Once per frame.** At most one conversion happens in a frame; an entry that comes after it in the same frame is not converted.
- **The intention keeps flying.** Water still slows it and lava still puts it out. The element is read again after the conversion, so a conversion that makes the intention's own cell lava puts that intention out in the same frame, and a conversion to water lets it fly on.
- **Safety.** A negative conversion into lava is refused, with the toast "Not here: the lava would reach you.", if the player's body touches any cell of the section and no `lavaWalk` time is left (see [Post-Traumatic Growth](../emotion/POST-TRAUMATIC-GROWTH.md)). A positive conversion into water never hurts anyone.

## Pool sizes

The largest pool in the room templates (`src/content/rooms.ts`) is 152 cells: the water of the drowned nave, 76 cells of floor and two cells deep. Every lava pool of the templates is at most 80 cells (the islet). So a whole template pool converts with the cap. The count is the templates' own; the floors and the flows can make pools bigger than their template.

Two things are bigger than 256 and are not converted whole:

- the flood boss's room, which floods the whole floor of the room (up to 448 cells in one layer), and
- the lava that the floors carve below the surface (`carveLavaBelow` in `src/world/floor.ts`), which can span a floor.

In both a conversion stops at 256 cells nearest the touched one. Another intention that enters the rest converts the next section, one per frame.

## Stats and events

- `ItemApi.convertFluid(x, y, z, from, to, cap, source)`: the conversion. Returns the cells converted; 0 when nothing was (not that fluid, no room, or already one this frame); -1 when the negative conversion is refused. `source` is reserved: no element event carries a cause yet.
- `intentElement` (`intent`, `x`, `y`, `z`, `element`): emitted by `Intents` through `IntentHooks.entered` when an intention enters a water or lava cell. The hook is `transmute`, priority 200.

## Open questions

- A negative intention that enters water turns the water at its own cell into lava and is put out by it in the same frame. The design text says it keeps flying and that lava puts it out; both are kept, so the item's negative case always ends the intention. Whether the touched cell should be spared (so the intention survives and only the pool beyond it turns) is the owner's to decide.
- Whether the Spanish name of the practice stays in Latin (as written) or takes a Spanish form is the owner's.
