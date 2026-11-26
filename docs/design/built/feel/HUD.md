# HUD and screens

Up: [built feel](README.md)

What the player reads on screen, in the corners and on the screens that open over the world. The HUD is a DOM layer over the game, drawn in the cellar's slate style ([ART](ART.md)). Code: `src/game/hud.ts` and the markup in `index.html`.

## The corner

- **Hearts.** Each heart container is drawn in quarters, filled from the left. The container's full value is eight damage points, and each quarter is two. An invulnerable heart is steady and outlined, and never blinks. When one heart or less is left, the last heart beats (see [FEEDBACK](FEEDBACK.md)).
- **Spirit (in the sky only).** A thin line of light round the hearts row, between dark keylines, with a number out of 100: the spirit left. On the light deck it reads as a dark frame. See [SPIRIT](../sky/laws/SPIRIT.md).
- **Breath.** Eight bubbles, shown only while the breath is not full: under water, or while the breath comes back. The last bubble beats when two or fewer are left.
- **Bombs and keys.** Two counters, capped at 99. Keys and bombs cost no hand slot.
- **Hand slots.** The things you carry: two blocks (one per hand) by default; Second Brain adds one to what you carry and Letters from a Stoic adds three. A part takes a slot like a block. One of them is the **active** item: the next place, throw, drink, alembic or kitchen use takes it, and it is outlined in gold. Choose it with the mouse wheel, the D-pad, the number keys 1 to 9 or a tap on its slot; choosing moves nothing and uses nothing. Code: `Game.chooseCarried`, `Player.active`, `Player.removeAt`.
- **Polarity mark.** A static mark for the loaded intention: a filled circle for good, a ring for bad. The F key switches it, and a short tick sounds.
- **Boss bar.** The boss's name and its health ratio, shown underground while you are alive in the boss room and its boss is alive. It hides at once when you die (under the death screen too), when a reset makes the new world (R or respawn), when the boss falls, and when you leave its room; it shows again only when a fight resumes. A menu, the toll or the pause card leaves it as it is. In the sky the same bar shows a deity's hits.
- **Path chips.** A practice's path is shown as a chip: the path's colour, always with its glyph and its word.

## The minimap

A small map in the top right. Cleared rooms show in gold, the current room in the paper colour, unvisited rooms are faint, and the treasure, vault, boss and challenge rooms have their own marks. A floor label sits above it: the floor number and its circle's name, for example "Floor 3 · The rain". The map turns with the view.

- **One cell per room.** Every room is one cell, however big it is: the map tells how many rooms there are and how they join, never their size or shape.
- **The player is always on it.** Inside a room the arrow sits on the room's cell. Anywhere else on the floor (a doorway, a wall, the rock, a tunnel) it follows the body across the map, at about one map pixel per block. The arrow points where you look. It has a light border so it reads on the dark map: dark on the current room's paper cell, gold everywhere else. The map shows a border of rock around the rooms, so the arrow and the tunnels in the floor's outer rock stay on it.
- **Explored rooms stay.** The rooms you have been in stay on a floor's map for the whole run: going down a floor, digging into the next floor's band and climbing back, or walking into a room through a dug wall never clears them. A new run starts with empty maps.
- **Dug tunnels.** Every hole you dig that is more than 2 blocks tall (three dug blocks one above the other, still open) is drawn on the map of each floor whose band it reaches, as a light trail (`bone.dim`, at least 2 map pixels per block column), clearly lighter than the map's background. The trail follows the digging a few times a second; a hole you fill back in leaves the map. Blocks broken by bombs, fire and projections count too: the map shows the rock that is gone. Code: `src/game/minimap.ts` (`TunnelLog`, `mapPlace`), `Hud.updateMap`.

## Banners and toasts

- **Pickup banner.** When a practice is picked up, a banner shows its icon, its name, its quality in stars, its inspiration line, what it changed, and any new synergy. It stays until the player dismisses it, because information is never on a timer.
- **Toasts.** A short line at the top of the screen, for a notice such as a lock that gives way to a good question. A toast stays for 2.5 seconds.

## The toll window

Going down asks a price. The toll window lists what you carry (keys, bombs, hearts, blocks from the hand, and from the sixth level on, practices). You choose exactly the number the window asks for. The rule is in [MECHANICS](../story/MECHANICS-AND-METAPHOR.md#notes) and the levels documents. The window ("The way down", *La bajada*) has the pixel finish of the achievement notice (issue #224): a gold bar down its left, the title in Pixelify Sans at 40 px, the section headings, the chosen count, the ✓ marks and the two buttons at 20 px, and chamfered tiles. A picked tile has a gold frame and a ✓; the tile under the cursor has a paper frame inside; Go down turns gold once the count is met. What the picks would cost sits in its own inset line.

## The screen

Esc, or Tab, and the touch tab button open one screen with two tabs:

- **Menu.** The pause card: resume, the controls, the language choice, the graphics settings and the seed. It has the pixel finish of the achievement notice (issue #223): a gold bar down the card's left, the tabs, buttons, headings and the field of view in Pixelify Sans at 20 px, and chamfered, bevelled buttons. Its controls list shows only the rows the player has: a practice's control (run, crouch, dash, the book, the miracle) and the star map's row appear when the player holds them, and the basic rows always show (issue #349).
- **Practices.** The inventory: every practice you hold as a tile, and the carried items in your hand above them (the same slots as the HUD's hand). The chosen practice opens below in three blocks, always in this order (issue #202): **the teaching** (a phrase that carries the practice into everyday life, two or three lines on how to live it, and its credit), **in the game** (its description and its effect, with the numbers) and **the stats** it changes (▲ up in gold, ▼ down in cold). Every practice has its teaching, in every language. The tab has the pixel finish of the achievement notice: the name in Pixelify Sans at 28 px, the title at 40 px, the block headings at 20 px. The pause card shows no inventory of its own; the inventory is one tap away on the same screen.

Opening the screen pauses the world on every device. Clicking outside it on touch resumes the game.

## Graphics settings

The menu has a Graphics section under the language choice. Its one setting is the **field of view**: how wide the world looks, from 70° to 100° in steps of 5, starting at 75°. The value shows in gold beside its name, and it changes the view at once, with a short tick that rises when the view widens and falls when it narrows. The choice is kept in the browser for the next session; a private window or blocked storage simply starts at 75° again.

It is set with the arrow keys or the mouse (drag the bar, or click − and +), the d-pad left and right on a pad, or a drag or a tap on − and + on a phone, and the line under the bar says how on the device in use. Only the world widens: the hands, the crosshair and the HUD stay where they are, and even at 100° the view never sees through a wall or a ceiling. Code: `src/game/settings.ts`, `Game.setFov`, `#graphics` in `index.html`.

## The seed

The seed is shown on the pause card, in the inventory and on the death screen. Clicking it copies a share link, and the copy is confirmed with a toast.

## The death screen

The screen fades to night, and the title says that the intention faded. The line under it names the cause and the floor reached: a practice's name where a practice is the cause, or the projection's pattern (for example, Panic held you on a floor). The screen also shows the practices you held and the seed, with a button to begin again. R starts a new run behind a short fade.

## Debug readout

A readout of the game state in the corner. It is off by default. F3 toggles it. It is in English on purpose, because it is for developers.

## Open questions

- The art record lists a house glyph among the minimap marks. The levels say there is no house on the surface, so the glyph should be checked. The owner decides whether the mark stays.
- The rest of the ledger's settings (shake, flashes, head bob, interface scale, reduced motion, skin tone) is not built ([ART-NOT-BUILT](../../not-built/feel/ART-NOT-BUILT.md)). The field of view is built, in the menu's Graphics section.
