[Creatures](README.md)

# Mossling

Built. Floor 0, the roots, as ambient life. Code: `src/content/creatures/mossling.ts`, and the rest rule in `src/game/game.ts`.

A Mossling is a round moss creature, asleep on the floor. It is the slowest creature in the game and the first one that answers only positive intentions. The player's way to help it is to stop and rest beside it.

- **Pattern:** rest.
- **Health:** 6.
- **Answers to:** positive intentions only. A negative intention passes through it: no harm, no flight.

## Movement and character

- Drifts very slowly. It comes toward the player when they are more than four blocks away, and steps back when they are nearer than one and a half blocks.
- Soft, rounded body, with two glowing eyes low on its front.

## What the player can do

- **Rest beside it.** Stand still on the ground, within two and a half blocks of it, for three seconds. It heals the player a quarter of a heart and shows a burst of light. This happens once per Mossling.
- **Heal it.** A positive intention heals its health if it is hurt.
- **Ignore it.** A negative intention does nothing to it.

## Open questions

- **Once per creature.** The rest counts once for each Mossling in the run. Should a Mossling rest again on a later visit to its room?
- **Stillness.** The rest needs stillness on the ground. Check in play that a player who is only standing still on a ledge still gets it.
