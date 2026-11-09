[Presences](README.md)

# The Boundary's missions (built)

Up: [presences](README.md) · Status: built, first version. Code: `src/content/presences/missions.ts` (missions, guided steps), `src/game/guard-card.ts` (the card's phases), `src/game/game.ts` (`touchGuards`, `answerGuard`, `releaseBoundary`), `src/game/hud.ts` (the card, the countdown). Tests: `tests/missions.test.ts`, `tests/guard-card.test.ts`. The design it comes from is [not-built/presences/REQUESTS.md](../../not-built/presences/REQUESTS.md).

The Boundary keeps the centre practice of its vault. That practice does not open with keys: it is given when the player answers one question about a thing to do outside the game.

## What the player meets

- **The centre chest.** Each vault from floor 1 on keeps its centre practice in a chest, standing under the Boundary. Walking up to the chest does nothing.
- **The mission.** Walking up to the Boundary (about two blocks) brings a card with one mission, chosen at random from five: write one sentence, write a short message to someone you care about, write a few lines to someone you worry about, draw something small, or close your eyes and breathe for 30 seconds. Writing and drawing happen on paper or on the phone; the game never sees or keeps them. The card says it is optional.
- **The question.** The card asks "Have you done it?" with two answers: **I did it** and **I won't do it**.
- **The close ✕.** The card has a ✕ in its top corner. Clicking or tapping it, or pressing Back (Esc, B), cancels the mission: nothing is given, the chest stays locked, the Boundary stays, and the player is back in play. A short notice says the Boundary keeps its chest and will ask again. It asks again once the player has stepped more than three blocks away from it and come back. There is no penalty.
- **The guided breath.** The breath mission (the only meditation today) also offers **Begin**, selected first. Begin turns the card into a 30-second countdown: a clock that counts down from 0:30, the instruction for this moment, a breath circle that grows on an in-breath and shrinks on an out-breath, and a thin bar for the whole time. The steps, with their real durations: settle (4 s), breathe in (4 s), breathe out (6 s), breathe in (4 s), breathe out (6 s), come back (6 s). A soft bell (swelling in, never a click) marks each step, so it can be followed with closed eyes; two notes mark the end. While it runs the world is paused and no answer is taken; only the ✕ (or Back) stops it, as a cancel. When the time is up the card asks "The time is up. Have you done it?" with **I did it** selected. Since the countdown is as long as the window, a yes after it is a yes after 30 seconds.
- **I did it** or **I won't do it** releases the Boundary. The chest opens, the reward spawns from it, and the Boundary leaves the room.
- **I did it, quickly** (less than 30 seconds from the card to the answer): a practice of tier 1 or 2. The game takes it that the mission was not really done, and it never says so.
- **I did it, after 30 seconds or more:** a practice of tier 3 or 4.
- **I won't do it:** a practice of tier 1 or 2.

The reward is one practice drawn from the treasure pool in the tier band. It is not the practice reserved for the room at the start of the run.

## What the game never does

- It never saves, sends, reads or judges what the player writes or draws. It keeps no text.
- It never asks for a camera or a microphone. The only timer is the guided breath's, and only when the player chooses Begin.
- It never punishes an answer.

## Controls

The card is a toll-style card in the same context as the toll: navigate between the answers, confirm, or back, which closes the card as a cancel (keyboard Esc, gamepad B, touch: tap the ✕). The ✕ is also a button for the mouse and touch. The countdown needs no input. Everything goes through the existing bindings (`navigate`, `confirm`, `back` in the `toll` context), so no new action is added.

## Open questions

- **The room's other practices.** The centre practice is the only one that is guarded. The pedestals on the ring hold nothing, and the practice reserved for the room is not placed. Whether a vault should keep any free practice is open.
- **The look.** The guarded chest uses the padlock with one keyhole, the look of a locked chest. No key fits it. An art decision is needed before this ships as final: see [the art ledger](../../../art/DECISIONS.md).
- **Missions.** The five texts are drafts for the owner's list, in English and Spanish. The owner reviews them.
- **Mission tiers.** Missions have no tiers of their own; the tiers are the reward's. The guided countdown covers every mission with steps (today only the breath). Owner to confirm this reading of "a tier 1 or 2 mission".
- **Timing.** The 30 seconds is measured from the card to the answer. The design's idle window (the game waiting for no input) is not built: see [REQUESTS.md](../../not-built/presences/REQUESTS.md).
