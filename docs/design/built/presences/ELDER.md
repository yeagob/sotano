[Presences](README.md)

# The Elder

Built. A dweller of what was taught: it waits in one quiet room of one seeded floor per run, from floor 1 down. It asks which of the player's four paths still holds, on a choice card, and gives one practice of the path chosen. It stays where it is. Code: `src/content/presences/elder.ts` (its identity), `src/content/presences/index.ts` (the floor, the placement, its options and its lines), `src/content/tables/heart-gifts.ts` (the lesson's table), `src/game/game.ts` (the choice and the lesson). Its floor, its lesson weights and its lines are **proposed, pending owner ruling** (see [the not-built part](../../not-built/presences/ELDER.md)).

- **Pattern:** what was taught, and what still holds.
- **Health:** one point, which nothing removes (as every presence).
- **Kind:** a dweller. It keeps its place for the floor.

## Where it is

- **One floor per run, from floor 1.** `dwellerFloorOf(run, 'elder')` draws the floor from the run's root (`fork('presence', 'elder')`). Never the tutorial floor.
- **The room.** A quiet normal room of that floor with no projections, not the start room, not a room that holds another presence. The Ledger Halls and their vaults are not built; the room stands in for the vault.

## What the player meets

- **The question.** Within about two blocks, a choice card asks *Which of your paths still holds?* with four answers: Body, Mind, Emotion and Will.
- **Choose.** The chosen path gives one practice that carries that path's tag. Three draws in four are of quality one and one in four of quality two; a quality with no practice of the path falls back to the other one (the Will has no quality-one practice today, so its lessons are quality two). The practice appears on the floor in an arc away from the player, and the card reads: *Your {path} still holds. It may have meant more than it said, and it cost you something.* and the Elder's second line.
- **Not now.** Nothing is taken or given. The Elder asks again only after the player steps away and returns.
- **Staying.** The Elder keeps its place; its room is ordinary for the rest of the floor except for its presence.

## The choice card's grace (PR #225 review)

- The card opens with the first answer selected, so a confirm key or button pressed within 0.4 s of game time after it opens is ignored (`ChoiceGuard`, `src/content/presences/consent.ts`): a stray double confirm cannot pick a path. A click or tap on a named answer is deliberate and is not delayed. The same card serves the Elder, the Cartographer and the Listener's Lesson. The consent outcomes of every card (yes once, decline keeps everything, stale refuses, the Trickster and the Wanderer leave on decline) are pure rules there, tested in `tests/presences-consent.test.ts`.

## Owed (not checked in a browser)

- The choice card with a gamepad (navigate on the d-pad, A to choose, B for Not now) and with touch (tap an answer). Only the keyboard path and the unit tests of the lesson were run in this pass; the preview tab of the in-app browser never finished loading.
- The card's layout on a phone in landscape with four answers.

## Look

The Elder uses the Listener's body until it has its own art (the art agent's follow-up): a tall light of ledger stone, faceless until the player comes close.
