[Presences](README.md)

# The Echo

Built, with proposed defaults **pending owner ruling** (the design left the stored place, the frequency and the ask open). Code: `src/content/presences/echo.ts` (its identity), `src/content/presences/index.ts` (the placement and its lines), `src/game/meta.ts` and `src/game/achievement-keeper.ts` (the stored place), `src/game/game.ts` (the death that records it, the run that reads it, the offer), `src/content/tables/heart-gifts.ts` (the gift).

The Echo is a messenger of learning from failure. When a run ends by death, the depth it reached is kept in the save. In the next run that reaches that depth, a faint copy of the player waits in a quiet room of that floor. It says how far the player got last time, asks for a part the player carries, gives back one key or one bomb, and fades into them. It never quotes a failure back.

- **Pattern:** learning from failure.
- **Health:** one point, which nothing removes (as the Listener).
- **Answers to:** positive intentions, once it has been met. It leaves when it is met.
- **Kind:** a messenger. It comes once and goes.

## Where it is

- **The stored place.** When a run ends by death, the deepest floor reached (`maxDepth`) is written to the save as `fade: { floor }`, only if that floor is a dungeon floor (1 or deeper). A Roots reset keeps it, because it is a dweller's memory and not the Roots.
- **The floor.** When a run starts, the stored floor is read once and passed to the floor generator (`echoFloor`), as the mastery level is. Generation does not read the save: it only uses the depth to pick which floor holds the Echo.
- **The room.** A quiet normal room of that floor (no projections), never the start room, never a room that already holds a presence. The room is picked by the floor's seed. If the floor has no quiet normal room, any normal room (proposed, pending owner ruling).
- **Once.** When the Echo is met, the save forgets the place (`fade` is removed), so it waits only once. A new death writes a new place.
- **Body.** The player cannot walk through it.

## What the player meets

- **Hint.** Within about two blocks, with no part carried, it says that a faint copy waits and asks for any part the player carries.
- **Wrong thing.** Anything that is not a part (a block or a flask) gets the shared reply, once every four seconds.
- **The ask.** Within about two blocks it offers the first part it finds in the hand, from the top down, whatever its kind. The card names the exact part and asks: *Give {item} to {presence} for a key or a bomb?* Accept takes only that part and gives one key or one bomb. Decline takes nothing; the Echo stays and asks again after the player steps away and returns.
- **Accept.** The part is taken; the gift appears on the floor in an arc away from the player; the card shows two lines. The first says the floor it faded on, from the place read before the save forgot it: *You were here before, and you got as far as {floor}.* The second says: *Take what I kept for you, and start from here.* The card stays until it is dismissed, and the Echo leaves in the frame the gift appears.

## The gift

| Outcome | Weight | Meaning |
|---|---|---|
| A key | 1 (50%) | One key, for a locked door or chest |
| A bomb | 1 (50%) | One bomb |

Drawn from the run's `drops` stream when the part is accepted, from `echo-gift` in `src/content/tables/heart-gifts.ts`.

## Decisions taken (proposed, pending owner ruling)

- **The stored place is a depth.** The design asked for the position where the last run faded. The build stores the deepest floor reached, since the rooms of a new run are new. The room is chosen again by the seed.
- **Once, then forgotten.** The design's frequency question is answered as "once": meeting the Echo clears its place. A new death writes a new one.
- **The ask is any part in hand.** The design's agreement table asks for "a part the player did not use", and the Echo's own page asks nothing. The reading here is any one part the player carries, of any kind. This is a consent exchange, so declining keeps everything.
- **Key or bomb, evenly.** The design gave a key or a bomb with no weights; the weights are even.
- **No deaths on floor 0.** The tutorial floor never holds an Echo, so a death there records nothing.
- **The line never quotes a failure.** It names the floor reached and nothing about how the run ended.

## Open questions

- **Frequency and stored place.** Confirm "once" and the depth as the place.
- **The ask.** Confirm "any part in hand" against the design's table.
- **Weights.** Confirm the even split between a key and a bomb.
- **Lines.** The English and Spanish lines await owner approval.
- **Look.** It uses the Listener's body until it has its own art (the art agent's follow-up).
- **Memory.** It is the first presence memory in the save. Counts, codex pages and the rest of [Memory](../../not-built/presences/MEMORY.md) are not built.
