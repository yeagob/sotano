[Presences](README.md)

# The Gardener

Built. A dweller of care: it waits in one quiet room of one seeded floor per run, from floor 1 down, and asks for one flesh part. It gives nothing back and stays where it is. Code: `src/content/presences/gardener.ts` (its identity and body), `src/content/presences/index.ts` (the floor, the placement, its lines and its offer question), `src/game/game.ts` (the offer). The placement and the part are **proposed, pending owner ruling** (see [the not-built part](../../not-built/presences/GARDENER.md)).

- **Pattern:** care, patience, cultivation.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It keeps its place for the floor; it does not leave when its part is taken.

## Where it is

- **One floor per run, from floor 1.** `gardenerFloorOf` draws one floor from floor 1 to the last floor, from the run's root (`fork('presence', 'gardener')`). Never the tutorial floor, which holds no presence (owner ruling, 2026-10-29).
- **The room.** A quiet normal room of that floor with no projections, not the start room, and not a room that holds another presence. Its room is cleared, so it never seals a door.

## What the player meets

- **The offer.** Within about two blocks, with a flesh part carried, its card asks: *Give {item} to The Gardener? The roots will keep what it held.* The hand is searched from the top down, and the first flesh part is offered. Give takes that part only; Keep takes nothing, and the Gardener asks again only after the player steps away and returns.
- **Give.** The part is taken, the Gardener's two lines show on the card: *Walk slowly. The roots remember where you have been.* and *Nothing here has to be finished today.* It stays where it is, and it answers positive intentions as the other dwellers do.
- **No part, or the wrong part.** Within about two blocks, with no flesh part, it gives its hint and then answers each approach with the name of what the player holds, once every four seconds, as the other presences do.

## Not built yet

The teaching on floor 0 (ruled out), the memory of how far the player went, and the agreement for a root and a tuft of moss are in [not-built](../../not-built/presences/GARDENER.md). The Gardener uses its own body (defined in the code, with its bone tones and living hands); it has no new art.
