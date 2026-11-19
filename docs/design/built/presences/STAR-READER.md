[Presences](README.md)

# The Star-reader

Built, in part. A dweller of seeing the whole. It waits in one quiet room of one seeded floor of the Tree (the Tree-of-Life floors, 1 to 5). It asks you for a yes to its light, asks for no part, and gives one gift. Code: `src/content/presences/star-reader.ts` (its identity), `src/content/presences/index.ts` (its floor `starReaderFloorOf`, the placement in `placeMessengers`, its consent and its lines), `src/content/tables/heart-gifts.ts` (`STAR_READER_GIFT_TABLE`, `rollStarReaderGift`), `src/game/game.ts` (the offer, `dropPresenceReward`). Its weights, lines and place are **proposed, pending owner ruling**. The open parts are in [the not-built part](../../not-built/presences/STAR-READER.md).

- **Pattern:** reading the shape of what you carry.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It stays after its gift, and asks again after the player steps away when declined.

## Where it is

- **Its floor.** One seeded floor from 1 to 5, the floors whose level is of kind `tree`. It is drawn from the run's root (`fork('presence', 'star-reader')`), before the room is placed.
- **The room.** A quiet normal room of that floor with no projections, not the start room, not a room that holds another presence (the Listener's room, a messenger's or a dweller's).
- **Not the Leaves.** The Leaves are a room of the crown now (owner ruling D14, [LEAVES](../levels/giant-tree/LEAVES.md)), but the Star-reader keeps its quiet room on its Tree floor (decided by agent: the tree holds no presences yet).

## What the player meets

- **The request.** Within about two blocks, the card says *I only read, and I ask for nothing. Take the light I give back for your shape?* with **Take** and **Decline**. Nothing is carried or given.
- **The reading.** Taking its light also reads the stars for you: its room is marked on its floor's star map, and the crown's star map draws the chain of the star pads ([STAR-MAP](../levels/giant-tree/STAR-MAP.md)).
- **Take.** The Star-reader gives one gift, rolled from the run's drops stream: two in four a practice of quality one, one in four a practice of quality two, one in four one special heart (an even draw of the five heart kinds). It says its second line and stays.
- **Decline.** Nothing changes; nothing is taken. The Star-reader stays and asks again only after the player steps away and returns.

## Owed (not checked)

- Checked in headless Chromium (Playwright, the sandbox scenario `presence-star-reader`, the Star-reader two blocks from the player): the card opens near it in Spanish at 1280 px and at 375 px, with Take and Decline, and no page errors; Escape (Decline) closes the card.
- Not checked: the gift's pickup and its look, the English text, the gamepad and touch paths, and the place on a real Tree floor in a generated run (the placement is covered by the rule's tests, not by a played run).
- The body uses the Listener's model until it has its own art (an art need: an abstract shape of stars, see the not-built part).
