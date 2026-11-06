# Horse (built)

Up: [The guardians of the sky (built)](README.md) · sky floor 5, the meadow.

The fifth deity: a giant horse head on a small plush body, standing on the paddocks of a wide meadow. It is the only deity that does not levitate: it walks and leaps. The full design, its targets and its open questions are in [not-built HORSE](../../../not-built/sky/guardians/HORSE.md).

## What the player meets

- **Where.** The horse stands on one of six raised, fenced paddocks and leaps between them: a great leap of up to 20 blocks across and 8 up, after a crouch of one telegraph (0.9 s), landing on a paddock or open ground, never on the player.
- **Grazing and Alert.** It grazes until the player comes within 14 blocks, then is alert.
- **Startle.** A player who moves, or lands a jump, within 6 blocks startles it: it leaps away, or teleports to the paddock farthest from the player. It is not startled while Gentled, while recovering, or while hurt, and not again within 2 s of a landing.
- **Calm, its own rule.** A player who stands still for 1.5 s within 8 blocks, or on its paddock, gentles it: for 3 s the horse walks up to within 3 blocks of the player and every positive hit counts **two**. It comes again only after the horse has acted once since the last time.
- **Sending.** From its paddock the horse sends a horse of the herd to kick the player (the herd is built, not spawned in play: see the shared gaps).
- **The rhythm.** From the second phase the floor fades one segment of each run every 12 s, for 3 s.
- **Three phases**, at a third and two thirds of its 48 hits; the rest between attacks is 2.5 s, then 2 s, then 1.5 s.
- A positive hit anywhere on the horse during a telegraph is that attack's answer (the design names a part for each; the build reads any part).

## Attacks

| # | Attack | Phase | What it does | Answer |
|---|---|---|---|---|
| 1 | Rear and stamp | 1 | The hooves land: a push along the shown arc, and two flickering segments fade for 3 s | Keep out of reach, or a block behind you; move off the segments |
| 2 | Tail gust | 1 | A gust that blows from the horse past the player | Walk against it, or a wall in its line |
| 3 | Dust roll | 1 | A patch is dense for 5 s: walking at half pace | Jump out, or build over it |
| 4 | Snort | 1 | A cone of breath; inside it drains 14 spirit | Step out sideways, or a block between |
| 5 | Leap and land | 2 | A great leap onto a mark; the landing ring pushes; then it recovers close to the player | Move off the mark and jump the ring |
| 6 | Mane shake | 2 | A ring spreading out to 8 blocks pushes outward | Jump the edge, or a block |
| 7 | Gallop line | 2 | A gallop at 12 blocks a second along the shown line, leaving a dust trail for 1 s; touching the horse or the trail drains 16 | Stay off the line, or jump the trail |
| 8 | Whinny wave | 3 | Segments of the runs fade in order and reform | Stand on a fixed segment, the ground or a placed block |
| 9 | Herd panic | 3 | At the end of its telegraph, a player who moved in the last 0.3 s drains 18 | Stop and stand still |
| 10 | Snaking | 3 | The horse circles the player; inside when the circle closes, they are held 3 s and lose one practice ("The horse herds you in, and takes a practice.") | Leave through the open arc |

The spreading rings of Leap and land and Mane shake are the horse's own hindrance (`horse-ring`).

## Won

At 48 positive hits the horse stops leaping and the wind drops ("The horse stops leaping, and the wind drops."): the floor's way up at the top of the mast opens, spirit refills, and the horse leaves its gift on its paddock, the **Triple Jump** ([TRIPLE-JUMP](../../player/TRIPLE-JUMP.md)), the way into Totality. An ally horse grazing beside it brings calm instead of hits: it gentles the horse every 10 s.

## Not built

- **No leap to a tower:** the horse does not leap to a tower to kick it down.
- **No sounds** (cues named `horse.*`; the horse's sound part is silent).
- The herd is not spawned on the floor (the shared gaps in [README](README.md)).
- The art gate is pending owner review ([horse art](../../../../art/sky/horse.md)).

Code: `src/sky/creatures/deities/horse.ts`, `src/sky/hindrances/horse-ring.ts`; tests in `tests/sky-horse.test.ts`.
