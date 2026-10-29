[Encounters](README.md)

# Spawn fairness rules

Status: **proposal** (design text, bestiary section 2.2). Parts are built; the rest are not checked by the build.

Every spawn must be heard before it is seen, and no spawn may be unfair to the position the player is in. The rules are validated before a room is used.

## The rules and what the build does

| # | Rule | Build |
|---|---|---|
| 1 | Never through a door, and never within 3 blocks of one | Built (door clearance of 3 blocks) |
| 2 | Never within 3.5 blocks of the player; an omen holds at its crack while the player is near | Built (choice of cell; the omen holds) |
| 3 | Never directly behind the player in a narrow room, without a sound from a wall, ceiling or floor first | Not built (floor spawns only) |
| 4 | At most four open omens at once; spawns staggered by at least 0.25 seconds | Partly built (spacing of 0.45 seconds; no cap of four) |
| 5 | A point is used at most once per wave, and a point that just spawned rests for 3 seconds | Not built |
| 6 | A walker's floor point must reach the player's area on the room's flow field | Not built |
| 7 | Seeded: the points a wave uses come from the room's own fork | Built |

## Open questions

- **Rule 3.** It depends on the wall and ceiling spawns (see [Spawn kinds](spawn-kinds/README.md)).
- **Rule 4.** Four is the design's number. Check it against the omen motes, which are many per omen.
- **Rule 5.** Resting a point and using it once per wave both need per-room memory of the wave's points.
- **Fallback.** The build's fallback to the room's centre (when no cell qualifies) breaks rule 2 in a narrow room. Decide the fallback.
