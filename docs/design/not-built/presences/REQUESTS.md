[Presences](README.md)

# Requests from the depths

Status: **decided** (the owner approved requests, not orders, and the five allowed requests, on 2026-10-27). None of this is built. The Boundary's request card, the first build of this design, was replaced on 2026-11-09 by its meditation app (see [built/presences/MEDITATION-APP.md](../../built/presences/MEDITATION-APP.md)), which keeps the safety rules below except rule 8, by the owner's decision. Built so far: the request line and its alternative on the consent card (`src/content/presences/requests.ts`), for the Gardener (breathe) and the Boatman (move), and, proposed pending owner ruling, for the Child (draw, on its build card) and the Elder (be still, on its choice card); the exchange still completes only on Give or on the card's answer. Built in this pass too: the idle window (`src/content/presences/idle.ts`): after the Gardener or the Boatman is given its exchange, it stays for a seeded 30 to 60 seconds of game time, then leaves. Proposed, pending owner ruling: the window runs on game time, not on the player being idle (the game sees input, not whether the player stepped away, so it cannot tell). Still to build: the honest-completion reading, the trust meter and the requests of the other presences (the Child draws, the Elder stands still and writes). The readings of the idle window and the reward table are still to be confirmed.

Some presences ask for something in the real world, in a line of story, and then let the player go on. The game is a game: nothing here is a therapy, a cure or a test of the player.

## What the design asks

- **Idle window.** A request runs in an idle window of thirty to sixty seconds. The game waits until it sees no keys and no mouse for at least thirty seconds, and the window never goes past one minute. The card says what to do and that the game will wait.
- **Requests.** Breathe (a paced breath, with a gentle cue; asked by the Gardener and the Listener). Be still (sit or stand quietly; the Listener and the Elder). Write one line, in the head or on paper, never recorded (the Elder). Draw a small sketch, never judged (the Child). Move: stand up, roll the shoulders, walk to another room and back (the Child and the Boatman).
- **The question.** When the window closes, the presence asks: "Have you done it?"
- **Honest completion.** After at least thirty seconds of idle, a full reward.
- **Early yes.** Before thirty seconds of idle, a lower reward. The game never says the player lied; the check is a guess.
- **Not now.** The presence waits and gives nothing. It never punishes.

## The trust meter

A hidden number, kept per run. It is never drawn, named or said: not in the HUD, not in the codex, not in a line of dialogue. It starts at the top. Each early yes lowers it one step; each honest completion raises it one step. It never locks progress. The reward is drawn from a table by the hidden step: the full tier at the top, a tier below one step down, a plain gift two steps down, the smallest gift at the bottom. Never nothing.

## Safety (all required)

1. Every request is optional and has a "not now" answer.
2. Every physical request has an alternative: seated or lying down, no hands, a quiet room, write it in the head, say it aloud.
3. Gentle, never urgent: no red timers, no startling sounds, no screen effects.
4. No judgement, no insults, no quoting failure back.
5. No therapy claims. A short note in the settings says the game is not therapy and where to find help.
6. Private: writing and drawing are never saved, sent, read or judged. The game stores only the hidden number and the request count.
7. No camera or microphone. Requests run on the player's own word.
8. No request asks for longer than the idle window.

## Open questions

- **Idle detection.** The game sees only input, not whether the player stepped away. The card must say so, and the game must not pretend otherwise.
- **Readings.** Confirm the thirty-to-sixty-second window and the reward table (readings k and t of the design's section 13).
- **Settings note.** The not-therapy note and the help line need the owner's text and the translations.

## Checked in the browser (issue #149)

- Headless Chromium, the real consent card of the Gardener (breathe) and the Boatman (move): the request line and its alternative show, Give and Keep are there, the card is 19 to 356 px wide at 375 px, no horizontal scroll. The card at 375 px was measured, not seen clearly: the menu stayed over it in the screenshot.
- Not checked: the exchange played in the game itself (Give on the card, the idle window ending and the presence leaving), the gamepad and the touch paths on the card, and the request card in the sandbox lab (the lab prints text only).

## Checked in the browser (issue #149, second pass)

- Headless Chromium, the Elder's choice card opened through the game's own card call with its request: at 375 px the request line and its alternative show above the four paths and "Not now", the card is 323 px wide, and the page has no horizontal scroll. At 1280 px the card is 412 px wide. No page errors. Screenshots were checked by eye.
- Not checked: choosing a path with the keyboard or a click on the live card, the Child's draw request on the build card, the idle window's end, the gamepad and touch paths, and the Covenant's line on a live exchange card.
