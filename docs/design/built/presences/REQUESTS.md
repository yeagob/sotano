[Presences](README.md)

# Requests and the trust meter (built)

Built, in part. Some presences ask for something in the real world, in a line on their card, and then let the player go on. The game is a game: nothing here is a therapy, a cure or a test of the player. Code: `src/content/presences/requests.ts` (the request lines), `src/content/presences/idle.ts` (the idle window), `src/content/presences/trust.ts` (the question, the hidden step and its gifts), `src/game/game.ts` (`startIdle`, `updateIdle`, `askDone`, `answerDone`), `src/game/meta.ts` and `src/game/achievement-keeper.ts` (the count in the save). The rest of the design is in [the not-built part](../../not-built/presences/REQUESTS.md).

## What the player meets

- **The request line.** The Gardener asks to breathe, the Boatman to move, the Child to draw and the Elder to be still, each in one line on its card with an alternative (seated, quiet, or in the head). The exchange still completes only on the card's own answer.
- **The idle window.** After the Gardener's or the Boatman's exchange, the presence stays a seeded 30 to 60 seconds of game time. A paused game holds the window.
- **"Have you done it?"** When the window closes with the player within about six blocks, and no other card is open, the presence asks on the choice card, with **Yes** and **Not now** (keyboard, mouse, gamepad and touch, as every choice card). Far away, it leaves without asking.
- **Yes.** The presence says *Thank you. Take this with you.*, gives one gift and leaves. The words are the same whatever the game guessed: it never says the player lied.
- **Not now.** *Another time, then. Nothing is lost.* Nothing is given and nothing changes; the presence leaves, its window is over.

## The trust meter (owner's "Opus decides", #228, D7; issue #235)

- **The guess.** The game sees only input. A yes after at least 30 seconds in one stretch with no input inside the window (no key, button, stick, touch or look) is read as an honest completion; a yes sooner is an early yes.
- **The hidden step.** A number from 0 to 3, kept for the run only, starting at the top. An honest completion raises it one step, an early yes lowers it one. It is never drawn, named or said: not in the HUD, not in the codex, not on a card. It never locks progress.
- **The gift of the step** after the answer, never nothing: at the top a blue heart, one step down a red heart, then a key, and at the bottom a bomb. It draws no randomness.
- **The save keeps only the count.** The number of requests answered *Yes*, in any run (`requests` in the save). Never what was done, never the step. Nothing is written in the sandbox or the lab.
- **Reason for building it (decided by agent).** It was small once the question existed: one pure module, the choice card that already has every control, and one number in the save. The safety rules of the design (optional, an alternative for every physical request, gentle, no judgement, private, no camera or microphone, never longer than the window) hold: the card has "Not now", the request lines name their alternative, the question has no timer, and the words are the same for both readings.

## Checked

- Unit tests: the step's rule, the gifts of every step, the stillness count on game time, the lines in both languages, the save's count, its merge and the sandbox writing nothing (`tests/presences-trust.test.ts`).
- Not checked in the browser: the question at the end of a live window, and its gamepad and touch paths (the choice card is unchanged).
