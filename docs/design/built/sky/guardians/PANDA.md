# Giant panda (built)

Up: [The guardians of the sky (built)](README.md) · sky floor 1, the bamboo seat.

The first deity: a giant panda head on a small plush body, floating over the Bamboo Seat at the centre of the first hall. The full design, its targets and its open questions are in [not-built PANDA](../../../not-built/sky/guardians/PANDA.md).

## What the player meets

- **Where.** The panda floats 1.5 blocks over the top of the Bamboo Seat, the tallest column of the floor, and drifts slowly round it. It does not teleport.
- **Waking.** It watches the player within 12 blocks, or a player who has climbed above height 8 within 18.
- **The rest beat.** A player who stands still on a column top for 2 s while the panda watches delays its next attack by 2 s more. From the moment they stop, the panda's chewing slows, its lids droop and leaves settle round the player's feet, so the player sees they are doing it right.
- **Two phases.** The first, up to 12 hits, rests 3.5 s between attacks; at 12 hits the panda rallies once (a yawn and a stretch) and the second phase rests 2.5 s and adds its attacks. A short nap follows the rally.

## Attacks

| # | Attack | Phase | What it does | Answer |
|---|---|---|---|---|
| 1 | Bamboo toss | 1 | A lob that stands as a one-block bamboo stump for 6 s; a stump on the player is a soft push of one block | Step off the mark; a stump is also a step to climb |
| 2 | Heavy press | 1 | A 3 × 3 band of dense ground for 5 s: walking there is at half pace | Walk round it; a positive shot at a dense cell returns it |
| 3 | Sit-down | 1 | One or two cells of a column top sink out for 4 s, never the whole top | Move off the crack; a positive shot at a cracked cell closes it |
| 4 | Yawn | 2 | A ring of drowsy air pushes the player 1.5 blocks away from the seat | A positive hit in the open mouth ends it |
| 5 | Playful shove | 1 | A soft push of 1.5 blocks toward the nearest edge, along the arc it shows | Step out of the arc, or a block in it |
| 6 | Thicket | 1 | A line of 2-high bamboo stalks between the player and the seat for 4 s, one end always open | Walk round the open end |
| 7 | Slow chew | 1 | Drains 6 spirit from a player who rushes during the chew (two jumps, or more than three blocks walked); the leaves turn green while the pace is kept | Keep a slow pace |
| 8 | Peekaboo | 2 | Drains 8 from a player hidden from the panda's sight when it uncovers its eyes | Stay in its sight |
| 9 | Tumble | 2 | A ball of drowsy air rolls along the shown line; its touch drains 8 | Step off the line, jump it, or a block in its way |
| 10 | Cradle | 2 | A ring of leaves shrinks to the player's cell; inside when it closes, the player is held 3 s and loses one practice | Leave the ring before it closes |

The bamboo stump and the thicket are the panda's own hindrance (`panda-bamboo`): transient bamboo that the floor takes back, never a placed block.

## Won

At 24 positive hits the panda settles on its seat, wide awake and friendly ("The panda settles on its seat, wide awake and friendly."), the floor's way up over the ledge strip opens and spirit refills. An ally panda sitting against the deity adds a hit every 4 s, with no cap below the hit count (provisional).

## Not built

- The panda's float to a tower and back, and its float in Cradle: the body stays on its seat.
- The tower trigger on the floor (see the shared gaps in [README](README.md)).
- A positive intention turning a bamboo lob into a falling leaf in flight.
- The sounds (cues named `panda.*`; the panda's sound part is silent).
- Cradle takes the practice without a toast of its own.
- The art gate is pending owner review ([panda art](../../../../art/sky/panda.md)).

Code: `src/sky/creatures/deities/panda.ts`, `src/sky/hindrances/panda-bamboo.ts`; tests in `tests/sky-panda.test.ts`.
