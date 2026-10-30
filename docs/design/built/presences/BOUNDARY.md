[Presences](README.md)

# The Boundary

Built. One per vault of a dungeon floor, from floor 1 on, except the tutorial floor. Code: `src/content/presences/boundary.ts`, placed in `src/world/floor.ts`.

The Boundary is a tall, calm column of limestone that keeps the vault it stands in. Its sanctuary is a ring of pedestal blocks two blocks around its centre. It never moves. Breaking the ring wakes it, and it throws cubes at the player while the player stays in its room. It cannot be hurt, only calmed.

- **Pattern:** boundaries.
- **Health:** none that can be removed: it has 9999 and armour 1, so no intention takes any health from it.
- **Answers to:** negative intentions reach it and are absorbed. Positive intentions pass through.

## What the player meets

- **Calm.** While its ring stands whole, it is neutral: it does nothing, and nothing targets it.
- **Wake.** Breaking any block of its ring, while the player is inside its room, turns it hostile. About every 2.4 seconds it throws a cube at the player.
- **Calm again.** Putting the ring back, or leaving its room, makes it neutral again. A room is never sealed by it, since a vault holds no roster.

## Open questions

- **Kind.** The design (approved 2026-10-29) calls the Boundary a creature that is provoked and not a projection: it does not release, it settles. The code makes it a projection with the armour that prevents any hurt, and the design's creature list does not include it. Which one? The design's wording is in [not-built/presences](../../not-built/presences/README.md) only as a note; the owner decides.
- **Holding a door.** A woken Boundary in a vault is hostile. Check in play whether it can hold a door or a room shut; the room is cleared from the start, so the seal does not run.
- **The ring.** Two blocks around the centre is a small sanctuary. The design asks for the ring to be the only thing the player must break, and to be put back. Check the feel of rebuilding it.
- **Look.** The design calls its look a first draft for the art gate. It has not passed the gallery review.

- **Body.** The Boundary has a body the player cannot walk through, like the presences. It does not answer words: it is a guardian, not a presence that speaks.
