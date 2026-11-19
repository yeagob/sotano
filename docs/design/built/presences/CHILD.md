[Presences](README.md)

# The Child

Built. A dweller of play: it waits in one quiet room of one seeded floor per run, from floor 1 down. It asks the player to place three blocks while it watches, and when they are placed it gives one gift. It stays where it is. Code: `src/content/presences/child.ts` (its identity), `src/content/presences/index.ts` (the floor, the placement, its consent and its lines), `src/content/tables/heart-gifts.ts` (the gift's tables and `rollChildGift`), `src/game/build-count.ts` (the count of placed blocks), `src/game/game.ts` (`updatePresences`, `acceptChild`, the gift), `src/sandbox/scenarios/presence-child.json` (a sandbox scene). Its room, its gift weights, its lines and its consent wording are **proposed, pending owner ruling**; the open parts are in [the not-built part](../../not-built/presences/CHILD.md).

- **Pattern:** permission to make something badly.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It keeps its place for the floor, and it is always joyful: its lines and its silence never cry.

## Where it is

- **One floor per run, from floor 1.** `dwellerFloorOf(run, 'child')` draws the floor from the run's root (`fork('presence', 'child')`). Never the tutorial floor.
- **The room.** A quiet normal room of that floor with no projections, not the start room, not a room that holds another presence. The Cellar of Habits is not built; the room stands in for it.

## What the player meets

- **The request.** Within about two blocks, the consent card asks *Place three blocks with The Child while it watches? Any shape you like.* It has the same two answers as the Wanderer's gift: **Take** and **Decline**.
- **Take.** The Child watches from that moment. The count starts at the blocks placed so far: only the blocks placed after the consent count. A card says *Yes! Three blocks, any way you like. I am watching.*
- **Decline.** Nothing changes; nothing is taken. The Child asks again only after the player steps away and returns.
- **Building.** Every material block the player places in the run counts (one count per `blockPlaced` event, from `build-count.ts`), so the build works with whatever block is in hand. Until three have been placed after the consent, a card says how many are left (*Keep going, {n} more to go. I am watching.*). It is shown once per approach, not on every block.
- **The gift.** When three blocks came after the consent, the card asks *Your blocks are standing. Take what The Child made with you?* with **Take** and **Decline**. Take gives one gift, rolled from the run's drops stream: three in four a practice of quality one, one in four one special heart (an even draw of the five heart kinds). The Listener's table is unchanged. Decline keeps everything: the Child asks again after the player steps away.
- **Staying.** After the gift the Child stays, and its room is ordinary for the rest of the floor except for its presence.
- **Per run.** The count is run-scoped and is not saved. A new run starts at zero, and a build begun in one run never carries into the next.

## Owed (not checked)

- The gift itself was not reached in a browser: headless placements did not register three blocks in this pass, so the path after *Take* was checked up to the progress card, and the gift path is covered only by the unit tests of the count and the gift.
- The consent card with a gamepad and with touch.
- The Child uses the Listener's body until it has its own art. Its look (a loose cluster of cubes, moving like a small animal) is an art need, not built.

## Look

The Child uses the Listener's body until it has its own art (the art agent's follow-up): a loose cluster of cubes that moves like a small animal, always in joyful colours, never crying.
