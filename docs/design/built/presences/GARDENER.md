[Presences](README.md)

# The Gardener

Built. A dweller of care: it waits in one quiet room of one seeded floor per run, from floor 1 down, and asks for a living root and a tuft of cave moss, its agreement. It gives nothing back and stays where it is. Code: `src/content/presences/gardener.ts` (its identity and body), `src/content/presences/index.ts` (the floor, the placement, its lines and its offer question), `src/game/game.ts` (the offer). The placement is **proposed, pending owner ruling**; the root and the moss are the owner's ruling D13 of 2026-11-19, built as the presences README D13f says (see [the not-built part](../../not-built/presences/GARDENER.md)).

- **Pattern:** care, patience, cultivation.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It keeps its place after its part is taken for its idle window, a seeded 30 to 60 seconds, then leaves (pending owner ruling: the built version kept its place for the floor; see [REQUESTS.md](../../not-built/presences/REQUESTS.md)).
- **Request (proposed, pending owner ruling):** the consent card also asks the player to breathe slowly for a moment, seated if they like, with the alternative of saying nothing. Shared mechanism: `src/content/presences/requests.ts`; Give or Keep decides, as before.

## Where it is

- **One floor per run, from floor 1.** `gardenerFloorOf` draws one floor from floor 1 to the last floor, from the run's root (`fork('presence', 'gardener')`). Never the tutorial floor, which holds no presence (owner ruling, 2026-10-29).
- **The room.** A quiet normal room of that floor with no projections, not the start room, and not a room that holds another presence. Its room is cleared, so it never seals a door.

## What the player meets

- **What it asks for.** A living root and a tuft of cave moss, two blocks found in the rock of every floor, more near the surface (see [floors](../levels/floors/README.md#rock-by-depth)). One card names one of them, in either order (presences README D13f).
- **The offer.** Within about two blocks, with a root or a moss carried that it does not hold yet, its card asks: *Give {item} to The Gardener? It will be planted where you were.* The hand is searched from the top down, and the first one is offered. Give takes that block only; Keep takes nothing, and the Gardener asks again only after the player steps away and returns.
- **Half of it.** After the first of the two, it says *The roots have it. Now bring me {item}.*, naming the other, and asks again after the player steps away and returns.
- **Both.** Once it holds the root and the moss, the Gardener's two lines show on the card: *Walk slowly. The roots remember where you have been.* and *Nothing here has to be finished today.* It stays where it is, and it answers positive intentions as the other dwellers do.
- **Nothing it wants.** Within about two blocks, with neither a root nor a moss, it gives its hint (*Roots and moss grow in the rock, more of them near the surface. Bring me a root and a tuft of moss, and I will plant something where you were.*) and then answers each approach with the name of what the player holds, once every four seconds, as the other presences do.

## Not built yet

The teaching on floor 0 (ruled out), the memory of how far the player went, and a gift for the agreement (open question) are in [not-built](../../not-built/presences/GARDENER.md). The Gardener uses its own body (defined in the code, with its bone tones and living hands); it has no new art.
