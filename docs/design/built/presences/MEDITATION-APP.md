[Presences](README.md)

# The Sanctuary: the Boundary's meditation app

Up: [presences](README.md) · Status: built (owner, 2026-11-09, issue #35: the Boundary's real-world request cards are replaced by one meditation app hidden inside the game; 2026-11-10: owner set sitting lengths to 20, 30 or 40 seconds). Code: `src/content/presences/meditations.ts` (the six meditations, a sitting's time, the reward), `src/game/meditation-app.ts` (the screens, the clock, the outcome), `src/game/meditation-view.ts` (the layer on the page), `src/render/meditation-scenes.ts` (the scenes), `src/audio/meditation.ts` (the music and the cues), `src/game/game.ts` (`touchGuards`, `openSanctuary`, `answerGuard`), `src/content/palette/meditation.ts` (its colours). Tests: `tests/meditation.test.ts`, `tests/meditation-app.test.ts`, `tests/controls.test.ts`. In the debug console, `S.sanctuary()` opens it without a Boundary.

The Boundary keeps the centre chest of its vault. Walking up to it no longer brings a card. It opens the Sanctuary: a full-screen meditation app with its own look, sound and motion, unlike anything else in the game. The player takes a quick reward at once, or sits through a guided meditation of 20, 30 or 40 seconds and receives the better one (the owner set seconds on 2026-11-10: "las meditaciones son de 20 a 40 segundos").

## 1. Meaning

- **Concept:** `Boundaries` ([CONCEPTS.md](../../../lore/CONCEPTS.md)). The Boundary guards a sanctuary: a ring it keeps whole. A boundary is what keeps a space for you. The app is that space, kept for as long as the player chooses to stay. Its name comes from the Boundary's own ring.
- **Why it breaks the game's look.** The depths are dark, cold and made of cubes. The Sanctuary is outside them: round, soft, slow, in colour. The break is the meaning: inside the boundary, nothing of the depths gets in.
- **A game, not a therapy.** The app guides attention and breath in plain words. It promises nothing, measures nothing and says nothing about the player's life. The first screen says that stopping is always fine.
- **The practices are the game's own.** Each of the six meditations is a tier 1 or tier 2 practice of the game, with its source in the library ([SOURCES.md](../../../lore/SOURCES.md)). No practice is invented for the app, and no tradition, figure or sacred symbol appears in it.

## 2. Flow

| Step | Screen | What the player sees | Leaves to |
|---|---|---|---|
| 1 | Approach | Within about two blocks of a Boundary that still keeps its chest, the world fades and the app opens. The world is paused underneath. | Home |
| 2 | Home (choose the reward) | The app's name, one line on what it is, and two choices: **Meditate** (the better reward, selected first) and **Take the quick reward**. A small note: stopping is always fine. A close ✕ means "not now". | Library, or out |
| 3 | Library | Six meditations as cards: name, one line, tier mark, a live swatch of its colours. | Length, or back to Home |
| 4 | Length | 20, 30 or 40 seconds (20 selected first; set to seconds by the owner on 2026-11-10). Choosing one begins. | Session, or back to Library |
| 5 | Session | The scene of the meditation, a timer counting down, the part's name, the instruction for this moment, the breath cue, and a control bar that hides after six seconds without input. | End, or the leave sheet |
| 6 | Leave sheet | Opened by Leave. The clock stops. **Stay** (selected first) or **Leave with the quick reward**. | Session, or out |
| 7 | End | When the timer reaches zero: the shared ending, and **Receive**. | Out |

Out means the app fades, the world resumes and the Boundary answers:

- **Not now** (the ✕ on Home): nothing is given, the chest stays locked, the Boundary stays. It asks again once the player has stepped more than three blocks away and come back. A short notice says so.
- **Quick reward** or **the better reward**: the chest opens, the practice is spat up from it, and the Boundary leaves the room.

## 3. Rewards

| Outcome | How | Practice drawn from the treasure pool |
|---|---|---|
| Quick | **Take the quick reward** on Home, or **Leave with the quick reward** from a session at any time | Tier 1 or 2 |
| Better | The timer of the chosen length reaches zero, then **Receive** (or any way out of the End screen) | Tier 3 or 4 |
| Not now | The ✕ or Back on Home | Nothing, and no penalty |

Rules:

- The quick reward is always one press away on the first screen. The meditation is never required.
- Leaving early never gives the better reward and never costs anything: it gives the quick one.
- The reward is given once. After an outcome the app accepts no more input, and an opened chest ignores a second answer.
- The length does not change the reward: 20 seconds earn the same band as 40. The longer sittings are there for whoever wants them.
- The reward is not the practice reserved for the room at the start of the run; it is a runtime draw, like every chest's.
- The game takes the player's word. It sees only its own clock, not whether the player sat still, and it never says otherwise.

## 4. The six meditations

Every meditation has five parts. A part has its own scene effect, its own harmony, its own sound cue when it begins, its guidance lines and its breath pace. The first part arrives and the last returns; the three in between are the practice.

Tier is the tier of the practice the meditation comes from. It only says how much the sitting asks of attention; it does not change the reward.

### 4.1 Grounding (tier 1)

- **Practice and source:** Grounding (`somatic`): coming back to the body.
- **What the player does:** feels the weight of the body, part by part, from the feet up.
- **Colours:** loam, moss and warm clay, with a pale seed light.
- **Scene:** a horizon of two slow hills with the ground below it. Motes sink instead of rising.
- **Music:** a low drone on D, a Dorian pad, wooden bell notes far apart; a deep earth rumble under it.
- **Sounds:** in-breath a low rising hum, out-breath a falling hum; each part opens with two low wooden notes.

| Part | Share | Breath | Scene effect | What it guides |
|---|---|---|---|---|
| Arrive | 10% | natural | Dust settles: motes fall and come to rest on the horizon | Sit or lie down, let the body be heavy |
| Feet and legs | 25% | in 4, out 6 | Roots grow down from the horizon, a little with each breath | Feet, the ground under them, the legs |
| Belly and back | 25% | in 4, out 6 | A soft column of light rises from the ground through the centre | The seat, the belly moving, the back |
| Shoulders and face | 25% | in 4, out 8 | Leaves gather above the horizon and sway | Shoulders drop, the jaw, the eyes |
| Return | 15% | natural | Everything glows together and slows | The whole body at once, then the room |

### 4.2 Gratitude (tier 1)

- **Practice and source:** Gratitude Journal (`positive-psychology`): noticing what goes well.
- **What the player does:** brings to mind one thing, then another, that is good to have, and stays with each.
- **Colours:** dusk plum, rose and amber, with a warm lantern light.
- **Scene:** an evening sky. Lanterns of soft light rise from below, one for each breath out.
- **Music:** a drone on F, a major pentatonic pad, clear bell notes; a faint evening wind.
- **Sounds:** in-breath a soft rising fifth, out-breath a lantern chime; each part opens with a three-note rising bell.

| Part | Share | Breath | Scene effect | What it guides |
|---|---|---|---|---|
| Arrive | 10% | natural | The sky darkens to dusk; first sparks drift up | Settle, a few easy breaths |
| Something small | 25% | in 4, out 6 | One lantern is lit in the centre and stays | One small good thing of today |
| Something that holds you | 25% | in 4, out 6 | Lanterns rise in pairs and keep each other's pace | Something that supports: a place, a habit, a thing |
| Something given | 25% | in 5, out 7 | Many lanterns; the sky fills slowly | Something that came without being earned |
| Return | 15% | natural | The lanterns become a slow field of stars | Let the list go, keep the warmth |

### 4.3 Visualization (tier 1)

- **Practice and source:** Visualization (`sports-psych`): seeing before doing.
- **What the player does:** builds a quiet place in the mind's eye, one sense at a time, and rests there.
- **Colours:** night teal, deep blue and aurora green, with a pale star light.
- **Scene:** a night sky over layered mountains, with ribbons of aurora and still water below. The breath is the moon.
- **Music:** a drone on E, a Lydian pad, glassy high notes; a thin shimmer of air.
- **Sounds:** in-breath a glassy rise, out-breath a soft fall; each part opens with two high notes a fifth apart.

| Part | Share | Breath | Scene effect | What it guides |
|---|---|---|---|---|
| Arrive | 10% | natural | Stars come out one by one | Close the eyes or rest them on the screen |
| The way there | 20% | in 4, out 6 | Mountains rise out of the dark in three layers | A path to a place that feels quiet |
| The place | 30% | in 4, out 6 | Aurora ribbons unfold across the sky | What is seen there: light, shapes, distance |
| The senses | 25% | in 5, out 7 | Still water mirrors the sky; ripples cross it | What is heard, the air on the skin |
| Return | 15% | natural | A pale dawn rises behind the mountains | The place stays; come back to the room |

### 4.4 Box Breathing (tier 2)

- **Practice and source:** Box Breathing (`breathwork`): paced breathing in four equal sides.
- **What the player does:** breathes in, holds, breathes out and holds, each for the same count, with rests of natural breath.
- **Colours:** indigo and slate blue, with a clear white-blue bead.
- **Scene:** a square with soft corners. A bead of light travels its four sides, one side per count.
- **Music:** a drone on A, a suspended pad that never resolves until the last part; no noise layer.
- **Sounds:** four notes, one for each side (up, stay, down, stay); each part opens with a low bell.

| Part | Share | Breath | Scene effect | What it guides |
|---|---|---|---|---|
| Arrive | 10% | natural | The square draws itself, side by side | Sit upright, find the natural breath |
| Four sides | 25% | box 4-4-4-4 | One square; the bead leaves a short trail | The count of four on each side |
| The square holds | 25% | box 4-4-4-4 | Nested squares answer the bead like an echo | The holds are rests, not effort |
| Wide square | 25% | box 5-5-5-5 | A field of faint tiles lights outward from the square | A slower count, the same ease |
| Return | 15% | natural | The corners soften until the square is a circle | Let the count go; the breath breathes itself |

### 4.5 Self-Compassion (tier 2)

- **Practice and source:** Self-Compassion (`self-compassion`): meeting yourself as you would meet a friend.
- **What the player does:** offers a few kind wishes inward, then to someone close, then outward.
- **Colours:** plum, rose and peach, with a warm pale centre.
- **Scene:** a soft orb in the centre. Rings of warmth leave it with each breath out; petals drift.
- **Music:** a drone on G, a warm major pad with an added sixth, round bell notes; a breath of soft noise on each out-breath.
- **Sounds:** in-breath a warm swell, out-breath a soft open fifth; each part opens with a slow two-note chime.

| Part | Share | Breath | Scene effect | What it guides |
|---|---|---|---|---|
| Arrive | 10% | natural | The orb appears and steadies | Settle; a hand on the chest if that is comfortable |
| For yourself | 25% | in 4, out 6 | Rings of warmth leave the orb and stay close | Kind wishes inward |
| For someone close | 25% | in 4, out 6 | A second orb appears beside the first; their rings meet | The same wishes for someone easy to wish well |
| For everyone | 25% | in 5, out 7 | Many small orbs across the screen, joined by faint lines | The same wishes, widened without limit |
| Return | 15% | natural | The orbs drift back into one glow | Rest in the warmth that is left |

### 4.6 Listening to the River (tier 2)

- **Practice and source:** Thinking, Waiting, Fasting, its waiting (`siddhartha`, `tao-te-ching`); the concept is *Listening to the river*.
- **What the player does:** listens to whatever sound is there, lets thoughts pass like leaves on water, and waits.
- **Colours:** river green, deep blue and silver, with a pale moon light.
- **Scene:** water seen from above. Streams of light flow across it; leaves ride them; drops make rings.
- **Music:** a drone on C, a Mixolydian pad, soft plucked notes like drops; a river of filtered noise that never stops.
- **Sounds:** in-breath almost silent, out-breath a wash of water; each part opens with three falling drops.

| Part | Share | Breath | Scene effect | What it guides |
|---|---|---|---|---|
| Arrive | 10% | natural | Still water; a drop falls and rings spread | Settle; nothing to do yet |
| Sounds | 25% | natural | The streams begin to flow; a ring opens where each sound would be | Near sounds, far sounds, the silence between |
| Leaves | 30% | in 4, out 6 | Leaves appear upstream and drift off the screen | A thought comes, it is a leaf, it goes |
| The whole river | 20% | natural | The streams widen and shimmer from bank to bank | Sounds, breath and thoughts as one river |
| Return | 15% | natural | The water slows to still; the moon lies on it | Keep the listening; come back |

### 4.7 The shared ending

Every meditation ends the same way, in the app's own colours (night blue, a pale dawn and warm white). The scene of the meditation fades; every mote on screen drifts to the centre and becomes one seed of light; the seed opens in three slow rings; a low chord resolves upward and a single bell rings. The screen says the time is complete and the Boundary opens its chest. **Receive** closes the app.

## 5. How a meditation adapts to its length

- The parts keep their shares, so a 40-second sitting is the same meditation as a 20-second one, slower.
- Inside a part, the guidance line changes about every 45 seconds. A longer part goes round its lines again; a shorter one shows each once.
- The breath pace is stretched by a hair so that a whole number of breaths fits in each part. A part never ends mid-breath.
- **Next part** moves on without shortening the sitting: the time left in the part is shared among the parts that follow. The timer never jumps. The last part cannot be skipped.
- The timer shows minutes and seconds left. It reads the full length at the start and 0:00 only at the end.
- The clock is the app's own: it measures real time while the session is running, and stops while it is paused or the leave sheet is open. It does not depend on the frame rate. A hidden tab stops the game's frames, so each frame counts at most 250 ms (`AppClock`): the time the tab was hidden is not counted, and a sitting cannot end while the game is not drawing it.

## 5a. The words of each part

Every line is in English and Spanish in `src/i18n/locales/`. They are short, they ask and never order, and none says anything about the player's life. English, in the order they are shown:

**Grounding** (*Enraizamiento*)

| Part | Lines |
|---|---|
| Arrive | Sit or lie down, whichever is easier. Let the body be heavy. / Close your eyes, or rest them on the screen. |
| Feet and legs | Feel your feet. Notice what they touch. / Feel the ground holding them. It holds without effort. / Let the attention rise through the legs, slowly. |
| Belly and back | Feel where the body rests on the seat or the bed. / Notice the belly moving with the breath. / Feel the back, from its base to the neck. |
| Shoulders and face | Let the shoulders drop a little on each breath out. / Loosen the jaw. Let the tongue rest. / Soften the eyes and the forehead. |
| Return | Feel the whole body at once, heavy and held. / Notice the room around you. Come back when you are ready. |

**Gratitude** (*Gratitud*)

| Part | Lines |
|---|---|
| Arrive | Settle where you are. Take a few easy breaths. / There is nothing to find yet. Only to arrive. |
| Something small | Bring to mind one small good thing. Any one will do. / Stay with it. Notice what is good about it. / On each breath out, let it be enough. |
| Something that holds you | Think of something that supports you: a place, a habit, a thing. / Notice how it is there without being asked. / Breathe with it for a while. |
| Something given | Think of something that came to you without being earned. / Let another one come, and another. No need to count. / If nothing comes, the breath itself is one. |
| Return | Let the list go. Keep the warmth that is left. / Notice the room around you. Come back when you are ready. |

**Visualization** (*Visualización*)

| Part | Lines |
|---|---|
| Arrive | Close your eyes, or rest them on the screen. / Let the breath slow down by itself. |
| The way there | Imagine a path. It leads somewhere quiet. / Walk it slowly. There is no hurry to arrive. / The place can be real or invented. Both are fine. |
| The place | You are there. Look around. / Notice the light. Notice the shapes, near and far. / Find a spot to rest in it, and rest. |
| The senses | Listen. What can be heard in this place? / Feel the air on the skin. Warm or cool. / Let the place become as clear as it wants to be. |
| Return | The place stays where it is. You can come back to it. / Walk the path back. Notice the room around you. |

**Box Breathing** (*Respiración cuadrada*)

| Part | Lines |
|---|---|
| Arrive | Sit upright and at ease. Breathe as you normally do. / Watch the square draw itself. The count comes next. |
| Four sides | Follow the light around the square. Each side is a count of four. / In through the nose. Out through the nose or the mouth. / If a hold is not comfortable, breathe normally and rejoin later. |
| The square holds | The holds are rests, not effort. Nothing is squeezed. / Keep the shoulders loose on every side. / Let each side be the same as the last. |
| Wide square | The count is a little slower now. The ease is the same. / Follow the light. It keeps the count for you. / Shorten the holds whenever you need to. |
| Return | Let the count go. The breath breathes itself. / Notice the room around you. Come back when you are ready. |

**Self-Compassion** (*Autocompasión*)

| Part | Lines |
|---|---|
| Arrive | Settle where you are. Let the breath be easy. / Rest a hand on the chest, if that is comfortable. |
| For yourself | Say inwardly: may I be at ease. / May I be kind to myself. / The words need not be felt. Offering them is enough. |
| For someone close | Think of someone it is easy to wish well. / Say inwardly: may you be at ease. / May you be treated with kindness. |
| For everyone | Let the wish widen: to those nearby, then further. / Say inwardly: may all be at ease. / No one needs to be left out, yourself included. |
| Return | Let the words rest. Stay with the warmth that is left. / Notice the room around you. Come back when you are ready. |

**Listening to the River** (*Escuchar el río*)

| Part | Lines |
|---|---|
| Arrive | Settle where you are. There is nothing to do yet. / Let the breath go at its own pace for the whole sitting. |
| Sounds | Listen to the nearest sound. Do not name it. / Listen to the farthest sound you can find. / Notice the silence between one sound and the next. |
| Leaves | When a thought comes, set it on the water like a leaf. / Watch it go downstream. There is no need to follow it. / Another will come. It is a leaf too. |
| The whole river | Sounds, breath and thoughts: one river, passing. / You are on the bank. Nothing needs to be held. / Wait. Waiting is the whole practice. |
| Return | The river keeps flowing without you watching it. / Keep the listening. Come back when you are ready. |

The breath cue above the line is one of five: Breathe in, Hold, Breathe out, Rest, or Breathe at your own pace, with the seconds left of a paced beat.

## 6. Look (a deliberate exception to the game's HUD)

The app does not use the cellar slate. The exception is recorded in the art ledger ([DECISIONS.md](../../../art/DECISIONS.md)).

| The game's HUD | The Sanctuary |
|---|---|
| Chamfered corners, no radius | Circles and round corners everywhere |
| No gradients, no blur | Soft vertical gradients; glows drawn as gradients |
| Pixel art, hard edges | Smooth vector shapes on a 2D canvas |
| Bold display type | Light, wide-spaced type; the instruction in a serif italic |
| Ink, bone and the reserved colours | Its own palette (`med.*` tokens), one set per meditation |

What still holds, with no exception:

- Colours come only from palette tokens. No hex outside the palette.
- Nothing alternates faster than 3 Hz; nothing flashes; brightness changes are ramps of a second or more.
- Text is at least 14 px, at least 4.5:1 against what is behind it, never below 60% opacity.
- The red lines: no sacred names or symbols, no figures, no mental-health imagery, nothing copied from another game or app.
- Meaning never rests on colour alone: the breath cue is a word, a shape that grows and a sound.

## 7. Sound

All sound is made in the browser with Web Audio. There are no audio files.

- **Music** is generative: a drone, a pad chord that changes with each part, sparse bell notes drawn from the meditation's scale, and (where the meditation has one) a texture of filtered noise. It runs through a soft reverb and its own volume, apart from the game's.
- **The music breathes.** The pad opens a little on each in-breath and closes on each out-breath.
- **Cues** mark each breath (in, hold, out), each new guidance line (a very soft tick), each new part (the meditation's own chime), the beginning and the end. Every cue swells in; none clicks.
- **Level.** The whole mix sits low and has no sudden peaks. **Mute** silences everything, eased over half a second, and is remembered.

## 8. Settings inside the app

Two switches, on the Home screen and on the session bar, remembered between visits:

- **Sound** on or off.
- **Calm visuals** (reduced motion). On: no particles, no drifting or zooming of the scene, no parallax; the background is a still gradient and the breath shape fades instead of moving. The timer, the part, the instruction and the breath cue stay exactly as they are. It starts on when the system asks for reduced motion.

## 9. Controls

One context, `meditation`. Every action on the three devices:

| Action | What it does | Keyboard and mouse | Gamepad | Touch |
|---|---|---|---|---|
| `navigate` | Moves the selection between the choices on screen | Arrow keys; the mouse hovers | D-pad | Tap the choice |
| `confirm` | Chooses: the reward, the meditation, the length (this begins), Pause or Resume, Stay, Receive | Enter, or a click | A | Tap |
| `skip` | Next part, in a session | N | RB | The Next button on the bar |
| `mute` | Sound on or off | M | X | The Sound button |
| `calm` | Calm visuals on or off | C | Y | The Calm button |
| `back` | One screen back; on Home, not now; in a session, the leave sheet; on the leave sheet, stay | Esc | B | The ✕ or the Leave button |

- Pause is the selected choice of the session bar, so `confirm` pauses and resumes.
- No press does two things: the press that opens the app or closes it is swallowed until released.
- The bar hides after six seconds without input in a session; any input brings it back, and the first tap on a hidden bar only shows it.
- References: Minecraft (Esc or B closes a screen, the d-pad moves between slots), Noita (menus pause, A accepts), The Binding of Isaac (one button per thing, B goes back).

## 10. Performance

- Measured in the browser (2026-11-10, desktop, 1024 × 768): one frame of the app (clock, words and scene) takes 0.2 to 0.35 ms of script for every meditation. A phone was not measured.
- On a short screen (under 460 px high, a phone on its side) each scene draws its centre of attention smaller and higher, so the words never cover it.
- The scene is a 2D canvas drawn at no more than 1.5 device pixels per CSS pixel and no more than 1280 px wide.
- Particles are capped at 160, and at 70 on a small screen (shorter side under 500 px). Calm visuals draw none.
- While the app covers the screen, the world underneath is not drawn.
- The screen is asked to stay awake during a session where the browser allows it.

## 11. Safety

1. Optional from the first screen; the quick reward never requires the meditation.
2. Every posture has an alternative in the words themselves: sit or lie down, eyes closed or resting on the screen, a hand on the chest only if comfortable.
3. Breath holds appear in one meditation only (Box Breathing) and are short; its text says to breathe normally whenever a hold is not comfortable.
4. No judgement, no streaks, no scores, no reminder that the player left early.
5. No therapy claims; no word about the player's life, past or feelings.
6. Nothing is recorded but the two switches. No camera, no microphone.
7. This replaces safety rule 8 of [REQUESTS.md](../../not-built/presences/REQUESTS.md) ("no request asks for longer than the idle window") for the Boundary only, by the owner's decision.

## 12. Test plan

| Rule | Test |
|---|---|
| The timer reaches the chosen length, for each of 20, 30 and 40 seconds and each meditation, and reads zero only at the end | `tests/meditation.test.ts` |
| The parts fill the length exactly; shares add to 100%; a part holds a whole number of breaths | `tests/meditation.test.ts` |
| Next part never shortens the sitting, and cannot skip the last part | `tests/meditation.test.ts` |
| The clock stops while paused and on the leave sheet | `tests/meditation-app.test.ts` |
| A hidden tab does not count: the clock moves at most 250 ms per frame | `tests/meditation-clock.test.ts` |
| Leaving early gives the quick reward and never the better one; completing gives the better one | `tests/meditation-app.test.ts` |
| Not now gives nothing, keeps the chest locked and lets the Boundary ask again | `tests/meditation-app.test.ts` |
| The reward is granted once only | `tests/meditation-app.test.ts` |
| At least six meditations; each has a palette, five parts, a scene effect per part, a music entry and a sound entry, and no two share a scene or a palette | `tests/meditation.test.ts` |
| Every word of every meditation exists in English and Spanish | `tests/i18n.test.ts`, `tests/meditation.test.ts` |
| Every action of the context is mapped on keyboard, gamepad and touch, with no shared input | `tests/controls.test.ts` |
| Each input type drives the app end to end (start, next, pause, mute, leave, choose reward) | `tests/meditation-app.test.ts` |
| Calm visuals removes particles and scene motion and keeps the timer and the instruction | `tests/meditation-app.test.ts` |
| Particle caps hold | `tests/meditation-app.test.ts` |
| In the browser: every meditation, every part, the Home, Library, Length, Leave and End screens, at desktop and phone widths, in both languages | by hand, recorded in the pull request and in [the art ledger](../../../art/DECISIONS.md) §10.8 |

## Not verified yet

- **By ear.** The music and the cues were built to the rules of §7 and never heard by a person: the browser used for the review has no sound. The owner listens before this is final.
- **On a real phone and a real gamepad.** Touch was reviewed in emulation (667 × 375 and 812 × 375); the gamepad through the binding table in the tests.
- **A whole sitting in real time.** Sittings were reviewed with the clock moved by hand to each part; nobody has sat 20 seconds with it.
- **The art agent.** The art skill asks for a dedicated art agent for everything visible. This was drawn by the build agent and reviewed against the gate; a pass by the art agent is still owed.

## Open questions

- **The name.** "The Sanctuary" (*El Santuario*) is taken from the Boundary's ring. Owner to confirm.
- **"Tier 1 and 2 meditations."** Read here as: the meditations are the game's tier 1 and tier 2 practices. Owner to confirm.
- **"Almost impossible to leave."** Read here as: it is hard to want to leave, never hard to leave. Leaving takes two presses (Leave, then confirm), and Stay is selected first. Owner to confirm that no stronger friction is wanted.
- **Does length matter?** Every length earns the same band today.
- **The not-therapy note.** The first screen carries one plain line. The owner's own text and a help line are still open ([REQUESTS.md](../../not-built/presences/REQUESTS.md)).
- **More meditations.** Radical Acceptance and Sleep Hygiene are tier 2 practices that would fit.
