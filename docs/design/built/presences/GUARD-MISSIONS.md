[Presences](README.md)

# The Boundary's missions (built)

Up: [presences](README.md) · Status: built, first version. Code: `src/content/presences/missions.ts`, `src/game/game.ts` (`touchGuards`, `answerGuard`), `src/game/hud.ts` (the question card). The design it comes from is [not-built/presences/REQUESTS.md](../../not-built/presences/REQUESTS.md).

The Boundary keeps the vault's chest. The chest does not open with keys: it opens when the player does one thing outside the game.

## What the player meets

- **The chest.** Each vault from floor 1 on keeps one chest under its Boundary, in place of the two keyed chests a vault used to hold. Walking up to it does not open it.
- **The mission.** Within about one and a half blocks of the chest, a card appears with one mission, chosen at random from five: write one sentence, send a short message to someone you worry about, write a short letter, draw something small, or close your eyes and breathe for 30 seconds. Each has an alternative in the card (write it in the head, keep the eyes open, sit down).
- **The question.** The same card asks "Have you done it?" with two answers: **I did it** and **Not yet**. The default is Not yet.
- **Not yet.** Nothing is given and nothing is said. The card does not come back until the player walks three blocks away and returns.
- **Yes, quickly.** Less than 30 seconds from the card to the answer: the chest gives a practice of tier 1 or 2. The game never says it doubts the player.
- **Yes, after 30 seconds or more.** The chest gives a practice of tier 3 or 4.

The reward is one practice, drawn from the treasure pool in the tier band, and it is spat out of the chest like any other chest contents. The chest holds nothing else.

## What the game never does

- It never saves, sends, reads or judges what the player writes or draws. It keeps no text.
- It never asks for a camera, a microphone or a timer the player can see.
- It never punishes Not yet or a quick yes.

## Controls

The card is a toll-style card in the same context as the toll: navigate between the two answers, confirm, or back (which means Not yet). The keyboard, gamepad and touch (tap or click) reach it through the existing bindings, so no new action is added.

## Open questions

- **The look.** The guarded chest uses the padlock with one keyhole, the look of a locked chest. No key fits it. An art decision is needed before this ships as final: see [the art ledger](../../../art/DECISIONS.md).
- **Missions.** The five texts are first drafts written for the owner's list. They are in English and Spanish and the owner reviews them.
- **Timing.** The 30 seconds is measured from the card to the answer, as the owner described. The design's idle window (the game waiting for no input) is not built: see [REQUESTS.md](../../not-built/presences/REQUESTS.md).
