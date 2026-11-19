[Presences](README.md)

# The Trickster

Built. A messenger: it comes once in a run, on one floor drawn from the run's seed (floor 3 and below the last floor), in a quiet dead end of that floor. Code: `src/content/presences/trickster.ts` (its identity), `src/content/presences/index.ts` (the floor, the placement, its lines and the offer question), `src/content/tables/heart-gifts.ts` (the deal's table), `src/game/game.ts` (the offer, the decline, the reward). Its costs and weights are **proposed, pending owner ruling**.

The Trickster is the shortcut that teaches. It offers a trade with a plain cost, and it says the cost plainly. The player may decline; then it laughs and is gone. Nothing is taken on a refusal.

- **Pattern:** the shortcut that teaches.
- **Health:** one point, which nothing removes (as the Listener).
- **Answers to:** positive intentions. It is silenced only after it has been met, and it leaves when it is met, so the silence rule never applies to it in practice.
- **Kind:** a messenger. It appears, says what it came to say, and goes.

## Where it is

- **One floor per run.** `tricksterFloorOf` draws one floor from floor 3 to the last floor, from the run's root (`fork('presence', 'trickster')`). The choice never reads the player.
- **The room.** A quiet normal room of that floor with no projections, preferring a dead end (a room with one doorway). If the floor has no quiet dead end, any quiet normal room (proposed, pending owner ruling). Never the start room, and never the Listener's room.
- **Body.** The player cannot walk through it, as with every presence. Its room is cleared, so it never seals a door.

## What the player meets

- **Hint.** Within about two blocks, with no heart carried, it says what it sells and asks for a heart. The line is the hint, not the price.
- **Wrong thing.** With anything else on top of the hand, it names the thing and says it is not what it waits for, once every four seconds (the shared reply rule). With empty hands it says so.
- **The trade.** Within about two blocks, it scans the carried hand from the top down and offers the first heart part it finds. The card names the exact heart and says the trade in plain words: *Trade {item} for a practice of quality three?* Accept takes only that heart and gives one practice. Decline takes nothing.
- **Decline.** It laughs: *Ha. Then keep your heart. I will be somewhere else.* It leaves at once, in the same frame. Nothing is lost and there is no penalty.
- **Accept.** The heart is taken, the practice appears on the floor in an arc away from the player, and two lines show on the card: the cost was a heart, and the long way would have taught the same more slowly. The card stays until it is dismissed. The Trickster leaves in the frame the practice appears, as the Listener does.

## The deal

| Outcome | Weight | Meaning |
|---|---|---|
| A quality-three practice that is not a health practice | 4 (80%) | The usual shortcut |
| The quality-three health practice (its maximum-health stat) | 1 (20%) | The better shortcut, of higher value |

Both are drawn from the run's `drops` stream when the trade is accepted, from `trickster-deal`, `trickster-practice` and `trickster-health-practice` in `src/content/tables/heart-gifts.ts`. Today the health practice of quality three is Forgiveness, the only one with a maximum-health stat. The Listener's 15/75/10 table is not changed by this.

## Decisions taken (proposed, pending owner ruling)

- **The price is a heart part, not a heart container.** The design named a heart container, but the build has no heart container. The Trickster takes one monster heart part, the same part the Listener takes, and gives one practice of quality three. This matches the agreement table ("a heart for a practice", [Agreements](../../not-built/presences/AGREEMENTS.md)).
- **Bombs for keys is not built.** The design's second deal (the player's bombs for keys) waits for the owner's ruling on its costs.
- **The floor is one per run,** drawn from floor 3 to the last floor, so a run meets the Trickster once. The design says "from floor 3"; the single draw is the reading of "messengers come once".
- **The fallback room.** A floor with no quiet dead end gets the Trickster in any quiet normal room, so a run meets it on the drawn floor.
- **The weights** 4 to 1 for practice over health practice.

## Open questions

- **Costs.** The design asks for the price of each quality. Only quality three is built, as one heart part for one practice.
- **Bombs for keys.** Not built; needs the owner's costs.
- **Lines.** The English and Spanish lines await owner approval.
- **Look.** It uses the Listener's body until it has its own art (the art agent's follow-up).
