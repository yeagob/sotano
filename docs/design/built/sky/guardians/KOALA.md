# Koala (built)

Up: [The guardians of the sky (built)](README.md) · sky floor 2, the branches.

The second deity: a koala head on a small plush body, its arms round an upright branch over the Fork at the centre of the second hall. The full design, its targets and its open questions are in [not-built KOALA](../../../not-built/sky/guardians/KOALA.md).

## What the player meets

- **Where.** The koala floats one block over the Fork, a crown of living wood over the floor's central gap, held by four limbs from the four trunks.
- **Asleep, then Stirring.** At the start the koala sleeps. When the player comes within 12 blocks, or lands a positive hit, it stirs for 1.5 s and then watches the whole floor.
- **Clinging, its guard.** From the second phase on, after each attack, the koala clings to its branch for 2.5 s: a positive hit then bounces off softly and does not count. An ally koala hugging the deity lifts the guard for as long as it stays. Then it dozes for 2 s, its recovery.
- **Teleport.** When the player comes within 3 blocks of it, the koala warns for one telegraph and reappears at the place of the floor farthest from the player that is still within its sight, so it keeps attacking, at most once every 20 s.
- **Three phases**, at a third and two thirds of its 30 hits, each opened by a rally; the rest between attacks is 3 s, then 2.5 s, then 2 s.

## Attacks

| # | Attack | Phase | What it does | Answer |
|---|---|---|---|---|
| 1 | Let-go | 1 | The thin branch under the player, or the next one on their way, turns to mist for 4 s | Move on, or a positive shot holds the branch |
| 2 | Leaf drop | 1 | Three bundles fall on marks round the player; one that lands shoves them down | Step off the marks |
| 3 | Hug | 2 | A cube cage round the player's cell for 4 s, never closed over a drop | A positive shot breaks a cube |
| 4 | Sleepy sigh | 3 | A gust along the player's line toward the central gap, 2 s at 2 blocks a second | A block in the line, or a positive shot at the koala |
| 5 | Scent mark | 1 | The thick branch or limb nearest the player, within 5 blocks, is dense for 5 s | Walk round it; a positive shot returns a cell |
| 6 | Eucalyptus haze | 1 | A circle of radius 2 round the player; inside when it bursts drains 8 spirit | Leave the circle |
| 7 | Joey ride | 2 | A mark on the player's cell; the joey that lands rides them for 4 s, and their jumps are half height | Jump three times to shake it off ("A koala holds on to you: jump three times to shake it off") |
| 8 | Bellow | 2 | A ring from the Fork at the player's height, 7 blocks a second out to 14, 0.8 high; drains 10 | Jump the ring |
| 9 | Lullaby | 3 | The branch under the player glows; still on its wood at the end drains 18; never a branch with no way off | Step off the branch |
| 10 | Hold fast | 3 | A ring of claws closes on the player's cell; inside when it closes, the koala holds them 3 s and keeps one practice ("The koala holds you fast, and keeps one of your practices") | Leave the ring |

The koala's own hindrances (the hug, the haze, the bellow, the lob, the lullaby, the hold and the set that builds them) are in `src/sky/hindrances/koala-*.ts`; they keep the shared rules of [abilities](../abilities/README.md).

## Won

At 30 positive hits the koala lets go of its branch ("The koala lets go of its branch"), the floor's way up over a trunk's knots opens and spirit refills. Whether the branches then give way is open. An ally koala hugging it adds a hit every 4 s, at most 10 in all (provisional: a third of the target).

## Not built

- The body does not float in to the player for Hold fast, nor back to the Fork after a teleport.
- The telegraph poses are not drawn: the model does not take its attack poses yet.
- The sounds (cues named `koala.*`; the koala's sound part is silent).
- The tower trigger (the shared gaps in [README](README.md)).
- The art gate is pending owner review ([koala art](../../../../art/sky/koala.md)).

Code: `src/sky/creatures/deities/koala.ts`, `src/sky/hindrances/koala-*.ts`; tests in `tests/sky-koala.test.ts`.
