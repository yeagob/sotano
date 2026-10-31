[Presences](README.md)

# The Boundary's missions (built)

Up: [presences](README.md) · Status: built, first version. Code: `src/content/presences/missions.ts`, `src/game/game.ts` (`touchGuards`, `answerGuard`, `releaseBoundary`), `src/game/hud.ts` (the question card). The design it comes from is [not-built/presences/REQUESTS.md](../../not-built/presences/REQUESTS.md).

The Boundary keeps the centre practice of its vault. That practice does not open with keys: it is given when the player answers one question about a thing to do outside the game.

## What the player meets

- **The centre chest.** Each vault from floor 1 on keeps its centre practice in a chest, standing under the Boundary. Walking up to the chest does nothing.
- **The mission.** Walking up to the Boundary (about two blocks) brings a card with one mission, chosen at random from five: write one sentence, write a short message to someone you care about, write a few lines to someone you worry about, draw something small, or close your eyes and breathe for 30 seconds. Writing and drawing happen on paper or on the phone; the game never sees or keeps them. The card says it is optional.
- **The question.** The card asks "Have you done it?" with two answers only: **I did it** and **I won't do it**. There is no answer that waits. Back means I won't do it.
- **Either answer releases the Boundary.** The chest opens, the reward spawns from it, and the Boundary leaves the room.
- **I did it, quickly** (less than 30 seconds from the card to the answer): a practice of tier 1 or 2. The game takes it that the mission was not really done, and it never says so.
- **I did it, after 30 seconds or more:** a practice of tier 3 or 4.
- **I won't do it:** a practice of tier 1 or 2.

The reward is one practice drawn from the treasure pool in the tier band. It is not the practice reserved for the room at the start of the run.

## What the game never does

- It never saves, sends, reads or judges what the player writes or draws. It keeps no text.
- It never asks for a camera, a microphone or a timer the player can see.
- It never punishes an answer.

## Controls

The card is a toll-style card in the same context as the toll: navigate between the two answers, confirm, or back (which means I won't do it). The keyboard, gamepad and touch (tap or click) reach it through the existing bindings, so no new action is added.

## Open questions

- **The room's other practices.** The centre practice is the only one that is guarded. The pedestals on the ring hold nothing, and the practice reserved for the room is not placed. Whether a vault should keep any free practice is open.
- **The look.** The guarded chest uses the padlock with one keyhole, the look of a locked chest. No key fits it. An art decision is needed before this ships as final: see [the art ledger](../../../art/DECISIONS.md).
- **Missions.** The five texts are drafts for the owner's list, in English and Spanish. The owner reviews them.
- **Timing.** The 30 seconds is measured from the card to the answer. The design's idle window (the game waiting for no input) is not built: see [REQUESTS.md](../../not-built/presences/REQUESTS.md).
