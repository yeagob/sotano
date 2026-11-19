[Presences](README.md)

# The Boatman

Built, in part. A dweller of letting go to move on. It waits by the deep water of Zone II, in the drowned nave of floor 3 or 4 (one of the two floors is drawn from the run's root). For one block you leave on the shore, it ferries you across the deep water to the island at the far end of the nave, where its gift lies. It stays on the shore. Code: `src/content/presences/boatman.ts` (its identity), `src/content/presences/index.ts` (the floor, the placement, `BOATMAN_TEMPLATE`, its consent and its lines), `src/content/tables/heart-gifts.ts` (`BOATMAN_GIFT_TABLE`, `rollBoatmanGift`), `src/game/game.ts` (the offer, `acceptBoatman`, `landingOf`, the ferry and the gift). The key and the bomb as tolls, a ferry that is not a teleport, the pocket of its own, and the Ferryback are not built. The toll, the weights and the wording are **proposed, pending owner ruling**. The open parts are in [the not-built part](../../not-built/presences/BOATMAN.md).

- **Pattern:** letting go to move on.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It keeps its place on the shore for the floor.

## Where it is

- **Zone II, a drowned nave.** The Boatman waits in a quiet normal room whose template is `drowned-nave` (`rooms.ts`): deep water from wall to wall with stepping stones and an island at the east end, which holds the room's `K` tile. The Boatman is placed only on a floor of 3 or 4 that holds such a nave, and only in one that is free of other presences. A run whose floors 3 and 4 hold no drowned nave meets no Boatman. This is the one level rule the design asked for: the nave is already built, so no room was added.
- **The floor.** `boatmanFloorOf(run)` draws 3 or 4 from `fork('presence', 'boatman')`.

## What the player meets

- **The toll.** Within about two blocks, with a block in hand, the card asks *Leave {block} on the shore for The Boatman to ferry you across the deep water?* with **Give** and **Keep**. Without a block the Boatman says its hint line, then names what the player holds, as every presence does.
- **Give.** One block leaves the hand. The Boatman carries the player across the deep water to the island (the `K` tile, read through the room's flips) in about 1.6 seconds, and the gift lies there, next to the player.
- **The gift.** Rolled from the drops stream when the ferry starts: three in four a practice of quality two, one in four one special heart (an even draw of the five heart kinds). It is the tier 2 gift of the design.
- **Keep.** Nothing changes; the Boatman asks again after the player steps away and returns. The player keeps the block.
- **Staying.** The Boatman stays on the shore and does not offer again: it has met the player.

## Owed (not checked)

- Checked in headless Chromium (seed 8, floor 4, a drowned nave): the card opens by the Boatman with the block in hand; Give (Enter) takes the block out of the hand, the player is carried to the island tile (the `K` tile, read through the room's flips, at the room's floor height) and the player lands there.
- Not checked: the gift's pickup on the island (six pickups appear after the ferry; which of them is the gift was not confirmed visually), the Keep path in a browser, the gamepad and touch paths, and the card at 375 px.
- The body uses the Listener's model until it has its own art (an art need: a boat or a ferryman that is not a human figure).
