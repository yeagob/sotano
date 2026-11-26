# The ending of illumination

Up: [Totality](README.md) · how a run ends in the Sun, with the friends the player made rising alongside (issue #351).

When the player has won the five guardians of the sky and climbed the whole of Totality, the last checkpoint rises and carries them into the Sun. The friends of the run rise with them. The screen fills with light, three lines are read, celestial bells ring, the achievement "Turned to Light" is granted, and the run ends.

## 1. The trigger

- **The five animals** are the five guardians of the sky, the deities of its five floors: the panda, the koala, the elephant, the lion and the horse. A guardian counts as passed once it is won (it has turned to the player's side). The code counts exactly these five, one per floor.
- **The whole ascent** is made when the player's feet stand on the last checkpoint, the last of the 108 platforms of Totality, the one before the Sun.
- The rise begins the first time both are true, once per run. Without all five guardians, the last checkpoint stays where it is and the last jump enters the Sun as before ([THRESHOLD.md](THRESHOLD.md)): the entrance is recorded and nothing follows.

## 2. The sequence

| Moment | Seconds from the start of the rise | What the player sees and hears |
|---|---|---|
| The rise | 0 to 8 | The last checkpoint, the same solar glass the player stood on, leaves its place and glides up and in. It carries the player: walking and jumping wait, looking and casting do not. It rises 12 blocks above the Sun's centre and ends inside the Sun, 12 blocks from its centre toward where it started (four tenths of its radius). |
| The light | 0 to 8 | The screen whitens in six even steps, one every 1.33 seconds, each easing in over 0.8 seconds, in the light's core colour, until everything is light. The HUD goes under it. |
| Full light | 8 to 9.5 | All light, held for a second and a half. |
| The card | 9.5 | The three lines (§4), on the light. |
| The bells | 9.5 to 13.7 | Eight high, calm bell strikes, 0.6 seconds apart: tin, tin, tin, tin, tin, tin, tin, tin. |
| The achievement | 9.5 | "Turned to Light" is granted. Its corner notice waits for the next calm moment, which is the start of the next run. |

The timings are written once, in `ASCENSION` (`src/sky/totality/ascension.ts`): the rise (8 s, 12 blocks, 0.4 of the radius), the steps (6, each easing in over 0.8 s), the hold (1.5 s), the bells (8, 0.6 s apart). The sequence runs on its own clock from the moment the rise begins: it never reads the seed, so every run and every seed gives the same timings. After the rise the player stays held inside the Sun; no fall is caught while the ending runs.

## 3. The friends who rise alongside

- **What counts as a friend.** Every being the player turned to their side in this run, by kind: the projections turned by good intentions, the allies the Mender brought back, the creatures, the bosses befriended, and the deities won. A friend that later relapses still counted as made. The count is for the run only, and it is never saved.
- **When they come.** From the first checkpoint of Totality (the sixth platform) on, the friends appear round the player and rise with them.
  - The won deities come first, all at once.
  - Then the first friend of each other kind, one kind every 1.5 seconds: a projection, a mended ally, a creature, a boss.
  - Then more and more as the player climbs, until the space is full: 40 at most, every friend shown once the player is 85 % of the way from the first checkpoint to the last. A fall takes no friend away.
- **How they move.** Each friend has its own place on four rings round the player, from 5 to 10 blocks away, a little above or below. They follow the player smoothly: across at one rate, and up and down each at its own slower rate, so none stays at the player's exact height and they lag behind a jump and catch up after. Each newcomer starts three blocks below its place and rises into it. They face the player and sway slowly. They are seen and never touched: no body, no collision, nothing to hit.
- **How they look.** Every friend is white (owner, 2026-11-26): its own model, with no tier, every part of it drawn in the light's core white and lit from inside by the same white, whatever its kind. The ally yellow belongs to the allies in play, not to the ending. They are becoming the light the screen turns into. A boss is drawn at half size and a deity at six tenths, so the rings hold them.
- **How they sound.** When the first friend of a kind appears, one of the meditations the player has heard plays its chime: the bells that open each of its parts. A meditation is heard once it has been sat to the end in this run, or its achievement is earned. They play in turn, one per kind. When the player has heard none yet, a soft Sanctuary bell plays instead.

## 3a. The meditations of the ascent (issue #380)

From the same moment the friends begin (the first checkpoint), the sky and the sound run one cycle of 40-second blocks: the starry sky, then the six meditations in the Sanctuary's order (Grounding, Gratitude, Visualization, Box Breathing, Self-Compassion, Listening to the River), and again. The cycle runs on the ascent's own clock (it holds while the game is paused or the player is out of Totality) and never reads the seed, so every run gives the same cycle.

- **The sky.** A meditation's block shows its background as the sky: its three stops (`med.<id>.high` at the zenith, `mid` on the horizon, `deep` below) on a low dome round the eye, drawn behind everything; the fog melts into its horizon and the stars dim to 40 %. The starry block is the strata's own sky. Each block cross-fades from the one before over its first 4 seconds.
- **The sound.** The block's music and ambience are the meditation's own synthesised sound (MEDITATION-APP.md §7), rising over the same 4 seconds while the block before fades. Its reflections are spoken as game audio, no text: one guidance line of each part, in the parts' order (the first loop the first lines, the next loop the next ones), the first due 5 s into the block and each next one 6 s later, never sooner than 1.5 s after the one before ended, none begun after 31 s. The music is lowered while a line is spoken.
- **The friends' chimes** (§3) still play as friends appear, a quieter layer on top (0.45 of the app's level, against 0.85 for the block's music and 0.6 while a line is spoken).
- **Muted.** With the Sanctuary's sound off, the blocks and the friends' chimes are silent; the sky still turns. The Sanctuary's voice switch does not apply here: the ascent speaks.
- **The end.** When the rise into the Sun begins, no new block or line begins, the music fades over 5 s and the backgrounds clear over 4 s.

Code: `src/game/ascent-blocks.ts` (the cycle, timings in `ASCENT_BLOCKS`), `src/sky/render/meditation-sky.ts` (the dome), wired in `src/game/game.ts` (`beginAscentBlocks`, `ascentAtmosphere`). Tests: `tests/ascent-blocks.test.ts`. Not yet heard or seen on a device.

## 4. The card

The Presence card, on full light, with the owner's three lines:

1. "Felicidades, has alcanzado la iluminación." (English: "Congratulations, you have reached illumination.")
2. "Nadie se ilumina solo. Alcanzamos juntas la iluminación, juntas con @." (English: "No one is illuminated alone. Together we reached illumination, together with @.")
3. "Finalmente os habéis convertido en luz." (English: "At last you have all turned to light.")

The owner wrote the lines in Spanish. The "@" and the plural "os" are kept exactly as he wrote them. The English is a translation. The card is confirmed like any Presence card (keyboard, mouse, gamepad, touch). The only nod beyond the lines is a reference in the lore library: the title "With a Little Help from My Friends", for Ursula K. Le Guin's *The Lathe of Heaven* ([SOURCES](../../../../lore/SOURCES.md)).

## 5. The end of the run

Issue #117's provisional ending (the run ends when the player enters the Sun) was never built. This ending replaces it. Once the card is gone, the run ends: the screen, already light, stays light while the next run is built, and the next run fades in from the light. The Roots' book page advances at the start of the next run, as it does after any run. Unity (#95, #116) is not built, so nothing follows inside the Sun.

## 6. The achievement

"Turned to Light" ("Convertido en luz"), id `sun.illumination`, on the event `illumination`, emitted once per run when the card shows. It is one mastery level. It is never granted in the sandbox or the lab, and nothing in the ending, the friend count or the companions reads or writes the save. Row: [ACHIEVEMENTS](../../progression/ACHIEVEMENTS.md) §1.

Code: the trigger, the ride and the timings in `src/sky/totality/ascension.ts`, wired in `src/sky/sky-realm.ts`, with the rising box in `src/sky/render/rising-platform.ts`. The friend count is `AllyTally` in `src/game/ally-tally.ts`. The companions are in `src/game/ascent-companions.ts` and drawn by `src/render/companion-view.ts`. The light is the Fade's light tone (`Hud.lightLevel`). The bells are `sfx3.celestialBells` in `src/audio/sfx.ts` and the chimes are `MeditationAudio.chime`. The card and the run's end are in `src/game/game.ts` (`updateEnding`, `illuminate`). Tests: `tests/illumination.test.ts`.
