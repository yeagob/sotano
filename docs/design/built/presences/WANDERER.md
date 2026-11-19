[Presences](README.md)

# The Wanderer

Built. A messenger of lessons on the way: it waits in a quiet room on one or two floors of each run, from floor 1 down, and offers a gift by consent. Code: `src/content/presences/wanderer.ts` (its identity), `src/content/presences/index.ts` (the floors, the placement, its lines and the offer), `src/content/tables/heart-gifts.ts` (the gift's table), `src/game/game.ts` (the offer, the decline, the reward). Its weights, its count and its lines are **proposed, pending owner ruling** (see [the not-built part](../../not-built/presences/WANDERER.md)).

- **Pattern:** wisdom on the way.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a messenger. It appears, says what it came to say, and goes.

## Where it is

- **One or two floors per run.** `wandererFloorsOf` draws one floor (weight 3) or two (weight 2) from floor 1 to the last floor, from the run's root (`fork('presence', 'wanderer')`). Never the tutorial. The choice never reads the player.
- **The room.** A quiet normal room of that floor with no projections, not the start room, and not a room that holds another presence. Its room is cleared, so it never seals a door. The corridor of the design is not built; a room stands in for it.

## What the player meets

- **The offer.** Within about two blocks, its consent card shows its line as the question: *Every road is walked one step at a time. Take the gift I hold out for the next one?* It asks for no part, so the hand is never searched. The card's buttons say Take and Decline.
- **Take.** Nothing leaves the hand. A gift appears on the floor in an arc away from the player, and the card shows its thanks: *Take it and walk on. I will not pass this road again.* The Wanderer leaves in the same frame, as the Listener does.
- **Decline.** Nothing is taken. It walks on: *Then walk on. I will be on another road.* It leaves in the same frame, as the Trickster does on a refusal.

## The gift (tier 1)

| Outcome | Weight | Meaning |
|---|---|---|
| A practice of quality one | 3 (75%) | The usual gift |
| One special heart, an even draw of the five kinds that predate the black heart | 1 (25%) | The rarer gift |

Both are drawn from the run's `drops` stream when the gift is taken, from `wanderer-gift`, `wanderer-practice` and `wanderer-heart` in `src/content/tables/heart-gifts.ts`. The Listener's 15/75/10 table is not changed.

## Not built yet

The walk through a wall, the line tied to the hand, and the corridor are in [not-built](../../not-built/presences/WANDERER.md). The Wanderer uses the Listener's body until it has its own art (the art agent's follow-up).
