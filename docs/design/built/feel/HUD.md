# HUD and screens

Up: [built feel](README.md)

What the player reads on screen, in the corners and on the screens that open over the world. The HUD is a DOM layer over the game, drawn in the cellar's slate style ([ART](ART.md)). Code: `src/game/hud.ts` and the markup in `index.html`.

## The corner

- **Hearts.** Each heart container is drawn in quarters, filled from the left. The container's full value is eight damage points, and each quarter is two. An invulnerable heart is steady and outlined, and never blinks. When one heart or less is left, the last heart beats (see [FEEDBACK](FEEDBACK.md)).
- **Breath.** Eight bubbles, shown only while the breath is not full: under water, or while the breath comes back. The last bubble beats when two or fewer are left.
- **Bombs and keys.** Two counters, capped at 99. Keys and bombs cost no hand slot.
- **Hand slots.** The things you carry: a block, a part, or two blocks with Second Brain, four with Letters from a Stoic.
- **Polarity mark.** A static mark for the loaded intention: a filled circle for good, a ring for bad. The F key switches it, and a short tick sounds.
- **Boss bar.** The boss's name and its health ratio, shown while a boss is present.
- **Path chips.** A practice's path is shown as a chip: the path's colour, always with its glyph and its word.

## The minimap

A small map in the top right. Cleared rooms show in gold, the current room in the paper colour, unvisited rooms are faint, and the treasure, vault, boss and challenge rooms have their own marks. A floor label sits above it: the floor number and its circle's name, for example "Floor 3 · The rain". The map turns with the view.

## Banners and toasts

- **Pickup banner.** When a practice is picked up, a banner shows its icon, its name, its quality in stars, its inspiration line, what it changed, and any new synergy. It stays until the player dismisses it, because information is never on a timer.
- **Toasts.** A short line at the top of the screen, for a notice such as a lock that gives way to a good question. A toast stays for 2.5 seconds.

## The toll window

Going down asks a price. The toll window lists what you carry (keys, bombs, hearts, blocks from the hand, and from the sixth level on, practices). You choose exactly the number the window asks for. The rule is in [MECHANICS](../story/MECHANICS-AND-METAPHOR.md#notes) and the levels documents.

## The screen

Esc, or Tab, and the touch tab button open one screen with two tabs:

- **Menu.** The pause card: resume, the controls, the language choice and the seed.
- **Practices.** The inventory: every practice you hold, with its icon, description and effect.

Opening the screen pauses the world on every device. Clicking outside it on touch resumes the game.

## The seed

The seed is shown on the pause card, in the inventory and on the death screen. Clicking it copies a share link, and the copy is confirmed with a toast.

## The death screen

The screen fades to night, and the title says that the intention faded. The line under it names the cause and the floor reached: a practice's name where a practice is the cause, or the projection's pattern (for example, Panic held you on a floor). The screen also shows the practices you held and the seed, with a button to begin again. R starts a new run behind a short fade.

## Debug readout

A readout of the game state in the corner. It is off by default. F3 toggles it. It is in English on purpose, because it is for developers.

## Open questions

- The art record lists a house glyph among the minimap marks. The levels say there is no house on the surface, so the glyph should be checked. The owner decides whether the mark stays.
- A settings page (shake, flashes, field of view, interface scale, reduced motion, skin tone) is in the art ledger and is not built ([ART-NOT-BUILT](../../not-built/feel/ART-NOT-BUILT.md)).
