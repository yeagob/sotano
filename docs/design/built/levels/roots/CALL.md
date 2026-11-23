# The Roots' call (mastery level 50)

Up: [the Roots](README.md) · Status: built (issue #295). Code: `src/game/roots-call.ts` (the pure movement and rules), `src/content/tables/roots-mastery.ts` (`ROOTS_CALL_AT`, `rootsCall`), `src/game/game.ts` (`updateCall`, `absorbPickup`). Tests: `tests/roots-call.test.ts`. The name "the Roots' call" / "la llamada de las raíces" is a proposal; the owner decides it.

Level 50 is half of the mastery: half of the achievements, half of the way. From then on the Roots stop asking the player to walk them for what they lay. **At the start of every run**, with no button, what the Roots hold rises from its place, flies to the player and is absorbed.

## 1. What answers the call

The owner's words (issue #295, comment of 2026-11-22): every loose object on the Roots' floor.

| Object | Answers | How it is absorbed |
|---|---|---|
| Loose keys and bombs | Yes | `collect`, as a touch: the counter goes up to its cap |
| Loose hearts (every kind the table lays) | Yes, when it can be taken | `collectHeart`, as a touch |
| The practices on floor 0's pedestals: the extra practices (Fartlek, Child's Pose), the altar, the way-down pedestal | Yes | `give`, with its banner |
| What the Roots' **free chests** hold | Yes: the call opens them quietly from afar and their contents fly too | as the object it is |
| **The Sanctuary's practice** (the meditation chest, and the second Sanctuary at 100) | **Never.** Its chest stays shut until a sitting (or the quick reward) opens it | — |
| A Boundary's guarded chest, a chest that asks for keys | Never (floor 0 has none) | — |
| What a crate gives, a projection's part, a flask | No: not laid by the Roots | — |

## 2. How it moves

- The call begins 1.2 s after the run is revealed (`CALL_WAIT`), with one toast (`roots.call`: "The Roots call: what they hold comes to you.") and a soft drawing-in sound.
- Each object rises 1.2 blocks, then heads for the player's chest, gaining speed (3 to 26 blocks a second), with a faint golden trail. It passes through rock: the Roots carry it. Loose things set off one every 0.12 s, nearest first.
- A practice sets off only when no banner, card or window is open, one at a time, so each banner is read before the next practice comes. The first waits 3.5 s after the call begins (`CALL_FIRST_ITEM`), so the toast is read first and the loose things lead.
- A heart already flying counts as taken: a second red heart does not set off for the health the first will fill, nor a layer for room the first will use.
- It is absorbed within 0.7 blocks of the player (or after 5 s of flight).
- The call only sends new things while the player is in the Roots' band. What is already flying always arrives.

## 3. What cannot be absorbed

- An object that could not be taken now (a red heart at full health, a blue, stone or toxic heart with no room for another layer) **does not move**: it stays where it lies. The call asks again every half second while the player is in the Roots, so it comes as soon as it can be taken (for example after a hurt).
- An object refused on arrival (an item that cancels the pickup) is left at the player's feet as an ordinary pickup. Nothing vanishes.

## 4. Rules

- The level is read once at run start (`runMastery`); a level earned during a run calls from the next run.
- Never in the sandbox or the lab (`callActive`), whose Roots are level 0.
- Generation is untouched: floor 0 is carved the same as without the call, no RNG fork is read, `GEN_VERSION` does not change. The free chests the call opens draw from their own forks exactly as when walked into.
- The save is never written by the call.
