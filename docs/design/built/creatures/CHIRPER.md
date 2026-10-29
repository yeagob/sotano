[Creatures](README.md)

# Chirper

Built. Floors 1 and 2, the Cellar of Habits, as ambient life. Code: `src/content/creatures/chirper.ts`.

A Chirper is a cellar cricket, dark and small, with two antennae and two glowing eyes. It is the gut feeling of the first floors: it sings when its room is quiet, and it is silent when the room is not.

- **Pattern:** the gut feeling.
- **Health:** 3.
- **Answers to:** both polarities.

## Movement and character

- Drifts about 0.6 blocks above the floor, keeping between two and a half and six blocks from the player.
- About every 2.6 seconds it chirps, if its room holds no projection that blocks the way.
- A chirp is a short pair of tones.
- Two to three appear on floors 1 and 2.

## What the player can do

- **Listen.** A room that chirps is safe; a room that falls silent holds a projection. It works as a warning by ear.
- Harm it: it hides until the room clears, and the silence lasts that long.
- Heal it: a positive intention heals it.

## Open questions

- **Silent when near.** The design says a Chirper goes silent when projections are near, including ambushes. The build silences the whole room whenever any blocking projection is in it, not only near ones. Keep the room rule?
- **Ambush.** An ambush that seems empty is not built (see [Ambush](../../not-built/encounters/AMBUSH.md)). Until then, the chirp is the only warning.
- **Hidden creatures.** A hidden Chirper cannot warn. This is intended, but check in play.
