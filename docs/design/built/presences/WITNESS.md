[Presences](README.md)

# The Witness

Built, in part. A dweller of seeing without judging. It waits in one quiet room of the ninth floor, the last floor of every run. It asks you for a yes to its gift, and gives one gift. Code: `src/content/presences/witness.ts` (its identity), `src/content/presences/index.ts` (the floor, the placement, its consent, its lines), `src/content/tables/heart-gifts.ts` (`WITNESS_GIFT_TABLE`, `rollWitnessGift`), `src/game/game.ts` (the offer, `dropPresenceReward`). The Silence below the ninth floor is not built: the Witness stands in a room of the ninth. The reading of the run, the parts of its patterns and the Seal are not built. Its room, weights, lines and wording are **proposed, pending owner ruling**. The open parts are in [the not-built part](../../not-built/presences/WITNESS.md).

- **Pattern:** seeing without judging.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a messenger. It leaves once its gift is taken; when declined, it stays and asks again after the player steps away.

## Where it is

- **The last floor, always.** `WITNESS_FLOOR` is the ninth floor. It draws nothing from the run's root, so no other room of the run moves.
- **The room.** A quiet normal room of the ninth floor with no projections, not the start room, not a room that holds another presence (the Silence stands in for the room below the ninth).

## What the player meets

- **The request.** Within about two blocks, the card asks *I only look, and I do not judge. Take the gift I hold out for what you have seen?* with **Take** and **Decline**. Nothing is carried or given: the Witness asks for no part.
- **Take.** The Witness gives one gift, rolled from the run's drops stream: three in four a practice of quality two, one in four one special heart (an even draw of the five heart kinds). Then it says its second line and leaves.
- **Decline.** Nothing changes; nothing is taken. The Witness stays and asks again only after the player steps away and returns.

## Owed (not checked)

- Not reached in a browser in this pass (see the report of the pass): the consent card and the gift were checked by the unit tests of the rule, the consent and the gift only.
- The consent card with a gamepad and with touch.
- The body uses the Listener's model until it has its own art (an art need: a shape that is not a human figure).
