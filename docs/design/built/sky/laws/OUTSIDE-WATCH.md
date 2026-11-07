# The way up is inside the tree, and towers come down (laws 3.8 and 3.9, built in part)

Up: [The laws of the sky (built)](README.md)

A tower of the player's own blocks raised outside the sky tree is warned of, then knocked down by the guardian of that height, and the player is pushed off it.

## What counts as a tower

The player stands on a **placed** block with their feet three or more blocks above the sky's own ground under them. A stack counts, and so does a staircase of single placed steps. The floors' own routes are the sky's world, not placed blocks, so they never count. A stack of two does not count.

## Outside the tree (law 3.8)

- The watch runs every frame while the player is in the sky tree's heights. When the player stands on a tower **outside the trunk's outer wall**, at a height the trunk spans or anywhere below the deck, the guardian of that height is asked to knock it down: the guardian of the last hall whose ground is at or below the player's feet, and the panda at the first floor and below (provisional, owner, 2026-11-03).
- **The warning.** For two seconds motes rise from every cell of the stack, four times a second, and nothing changes. The rising grumble is named but silent (the sky's core sounds are not synthesised yet).
- **The knock.** Then every placed cell of the stack turns to air from the top down, and each one falls as a loose cube of its own material, with a pop, that the player can gather again (provisional, owner, 2026-11-03). The sky's own cells are never touched.
- **Where the player lands.** A player still on the column is pushed off it, sideways away from the guardian and up, about two blocks, and falls. Falls never hurt in the sky: the player lands on the ground or a ledge below, and a player who falls off the arrival deck passes down to the crown of the built tree, as any fall off the deck does.
- The watch asks once per tower: again only after four seconds on the same tower, or at once for a tower stepped onto anew. One knock runs at a time.
- Above the roof of the tree (Totality) nothing is watched: there is no tree to climb outside of there.
- The trunk wall, the slabs and the membranes are unbreakable heartwood, so nobody digs out of the tree or past a closed way up.

## A tower that reaches a deity (law 3.9)

The tower itself is detected, and the knock above is the same routine for every deity. **Not built:** the trigger inside a floor, when a tower brings the player within two blocks of the deity's height, is not wired yet; and no deity's body leaves its seat to reach the tower and come back (the panda's float, the koala's float, the elephant's sweep, the lion's glide, the horse's leap). Each guardian document lists this gap ([guardians](../guardians/README.md)).

## The rule

Outside the tree the player cannot climb to the sky; the god that comes is the guardian of that height (owner, 2026-11-03, provisional). A tower that reaches a deity is knocked down after a warning, and the player can always answer by stepping onto the floor's own route.

Code: `src/sky/laws/outside.ts` (`OutsideWatch`, `REWATCH` 4 s), `src/sky/laws/tower.ts` (`towerUnder`), `src/sky/creatures/knock.ts` (`TowerKnock`, `KNOCK_WARNING` 2 s, `KNOCK_PUSH` 2 blocks); tests in `tests/sky-outside.test.ts` and `tests/sky-engine.test.ts`.
