# Spirit, capture and the fall underground (law 3.10, built)

Up: [The laws of the sky (built)](README.md)

Spirit is the outline of the hearts: the reserve a deity's special attack can dim without touching life. At zero the player is sent underground.

## What the player sees and feels

- **The ring.** In the sky, and only there, a thin line of light runs round the hearts row, between two dark keylines, with a whole number out of 100 beside the row's end. The line's length is the spirit left, drawn clockwise from the top left; a drain slides it shorter over 0.3 s. Nothing flashes, pulses or shakes. On the light deck the light line almost vanishes against the pale ground, so the ring reads there as a **dark frame**; the owner accepted that look (2026-11-06). The look is in [DECISIONS §10.7](../../../../art/DECISIONS.md).
- **A drain.** A deity's special attack drains a set amount of spirit when it lands, never at its telegraph. Each deity's drains are listed in its document ([guardians](../guardians/README.md)): from 6 on the panda's floor to 18 on the koala's and the horse's.
- **When a drain may land.** At most once per attack; at least 6 s after the last drain; never while the player is held in any way, nor within 1 s after a hold. A deity does not even begin a drain attack's telegraph while the gate would refuse it.
- **A capture.** A deity's capture holds the player for 3 s: they cannot move or jump, and can still look and shoot. It takes one practice the player holds, chosen at random, for the rest of the run; it is not returned (provisional). A capture comes at most once every 30 s on each floor that has one.
- **At zero.** The player is sent to a random underground floor from floor 0 to floor 9 (the chamber of silence excluded), through the realm gate's fade. The number reads 0 through the fade, and spirit is full again on arrival.
- **When a deity is won**, spirit refills to full, with the way up opening. This stays **provisional** (the owner's default, to confirm, 2026-11-05; kept provisional by the owner, 2026-11-06).
- Hindrances and minions never drain spirit or capture (provisional, owner to confirm). Health is never touched in the sky ([NO-HARM](NO-HARM.md)).

## The rule

The player cannot die in the sky (owner, 2026-11-03): a capture takes one practice; spirit at zero sends the player to a random underground floor. Spirit is a number out of 100, and each drain a number on that scale (owner, 2026-11-05). The owner accepts the proposed drain amounts for now, to adjust later.

## Not built

- The art gate's colour-blindness and fog captures of the ring are not taken (see [guardians](../guardians/README.md), the shared gaps).
- What a captured practice looks like as it is taken, beyond the deity's own toast, is not designed.

Code: `src/sky/laws/spirit.ts` (`SpiritLaw`, `DRAIN_GAP` 6 s, `DRAIN_CALM` 1 s, `UNDERGROUND_FLOORS`), the host verbs (`drainSpirit`, `refillSpirit`, `takeRandomPractice`, `sendUnderground`) in `src/game/game.ts`, the ring in `src/render/spirit-ring.ts` and `index.html` (`.spirit-ring`); tests in `tests/sky-spirit.test.ts`.
