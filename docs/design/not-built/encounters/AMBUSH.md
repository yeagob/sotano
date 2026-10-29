[Encounters](README.md)

# Ambush

Status: **proposal** (design text, bestiary section 2.4, special room types). Never on floors 0 or 1.

A room that seems empty. Entering it does not seal it. Taking its reward, or breaking a marked wall, triggers the seal and a wave that rises from the walls and the ceiling.

## What the design asks

- **Empty look.** No projection is visible on entry, and the room does not seal.
- **Telegraph.** Silent creatures and a faint cold draught: motes moving towards the walls, before the wave.
- **Trigger.** Taking the reward, or breaking a marked wall, seals the room and starts the wave.
- **Spawns.** The wave rises from walls and the ceiling, not only from the floor (see [Spawn kinds](spawn-kinds/README.md)).

## What the build has

The seal runs for rooms with projections. A room that holds none is cleared at once. The silence of Chirpers is built, and the draught and the marked wall are not.

## Open questions

- **Dependencies.** The ambush needs wall and ceiling spawns first.
- **Fairness.** A wave from behind the player is the case the fairness rules forbid without a sound first (see [Fairness rules](FAIRNESS-RULES.md)).
- **The silence.** A Chirper's silence is the warning. A room with no Chirper needs its own warning.
