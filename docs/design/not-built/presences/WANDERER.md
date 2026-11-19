[Presences](README.md)

# The Wanderer

Status: **decided in part, pending owner ruling**. The weights, the count and the lines below are proposed; the rest of the design (a wall, a practice-tied line, a released projection) is a proposal. The built part moves to [built/presences](../../built/presences/WANDERER.md) when it ships.

A messenger of lessons on the way. It can be met from floor 1, once or twice in a run. It says one line of wisdom and offers a gift, and it walks on when the gift is declined.

## Decisions taken (proposed, pending owner ruling)

- **How many.** One or two floors per run, drawn from the run's root (`fork('presence', 'wanderer')`) with weights 3 (one floor) to 2 (two floors): 60% of runs meet it once and 40% twice. Floors 1 to the last floor; never the tutorial.
- **Where.** A quiet normal room of its floor with no projections, not the start room, not a room that holds another presence. The corridor of the design is not built, so the room stands in for it.
- **Consent.** The gift asks for no part. Within about two blocks the Wanderer offers its gift on the consent card, with its line as the question. Accept takes nothing and gives the gift. Decline takes nothing, and the Wanderer walks on at once (it leaves, as the Trickster does on a refusal). Nothing is lost either way.
- **The gift (tier 1).** A seeded weighted table, `wanderer-gift` in `src/content/tables/heart-gifts.ts`:

| Outcome | Weight | Meaning |
|---|---|---|
| A practice of quality one | 3 (75%) | The usual gift |
| One special heart, an even draw of the five kinds that predate the black heart | 1 (25%) | The rarer gift, of a different value |

## What the player meets

- **The line.** Within about two blocks, on the consent card: *Every road is walked one step at a time. Take the gift it holds out for the next step?* The question is the line; the card shows no other text.
- **Accept.** The gift appears on the floor in an arc away from the player, and the card shows one line of thanks; the Wanderer leaves in the same frame.
- **Decline.** It walks on: *Then walk on. I will be on another road.* It leaves in the same frame. Nothing is taken.
- **Body.** The Wanderer has a body, as every presence, and its room is cleared, so it never seals a door.

## What the design asks and the build does not do yet

- **Wall.** It walks on through a wall. The build removes it from its room in the same frame, with no walk. A wall check (the Wanderer never stands in a wall the player must break) waits for the walk.
- **Practice or released projection.** The line is tied to a practice held or a projection just released. The build has one fixed line; a line tied to the hand waits for the reading of the hand as a line (see [Dialogue](DIALOGUE.md)).
- **Corridor.** The design puts it in a corridor. The build puts it in a room (see Where).

## Open questions

- **Wisdom.** Every line is a paraphrase of a credited source in the lore library, never a quote from a real person. The English and Spanish lines are proposed and need the owner's approval; the lore library check is open.
- **Frequency.** The weights above are the proposal; the owner rules on them.
- **Gift weights.** The 3 to 1 split is a proposal; a practice of quality one is a usual gift and a special heart is the rarer one.
- **Look.** It uses the Listener's body until it has its own art (the art agent's follow-up).
