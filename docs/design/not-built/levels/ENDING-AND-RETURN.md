# What ends a run, and the return from silence

Up: [not-built levels](README.md) · [ENDGAME](../story/ENDGAME.md) · [UNITY](UNITY.md)

Status: decided (owner, 2026-11-03) for the bottom revelation (the Spiked Entity, waiting in the chamber of silence), the upward staircase through all floors to the surface, the meta-progression staircase unlock on floor 0, the roots, and the sky realm above the crown. No rematch in this build: the solar relic and the cosmic loop it would close are later, with Unity (issue #95).

## 1. What the build does

- **A run ends in death.** When the player's hearts run out, the death screen shows the deepest floor reached and the practices held, and a restart begins a new run from the roots.
- **The run starts on the roots.** A new run places the player in the start room of floor 0.
- **The loop is built.** Standing still in silence carries you to heaven; the top of the sky carries you back into silence (see [SILENCE](../../built/levels/floors/SILENCE.md)). Decided (owner, 2026-11-03): the top of the sky opens into the sky realm instead, and silence still carries the player up to heaven ([the realm of the sky](../sky/README.md)).

## 2. The Endgame structure (Status: decided)

1. **Reaching the lowest depth**:
   - The player reaches the lowest floor and encounters the indestructible Spiked Entity, which waits in the chamber of silence ([ENDGAME](../story/ENDGAME.md)).
   - The entity reveals that the true path is upward: *"The true path was not to reach this place; the true path is to go upward."*
2. **The Ascending Stairway**:
   - Meeting the entity unlocks a staircase carving upward through every floor to the surface.
   - Once unlocked, future runs feature an upward staircase directly from floor 0, the roots, offering an immediate route to the surface and the Giant Tree.
3. **The Upward Journey to Unity**:
   - The player ascends the Giant Tree, overcomes the five deities, earns the Triple Jump from the Horse, climbs through the cosmic void in [Totality](TOTALITY.md), and reaches the closed threshold of the Sun. [Unity](UNITY.md) is issue #95 and not built (decided, owner, 2026-11-03).
4. **The Solar Relic & Final Confrontation** (later, not in this build; no rematch, owner, 2026-11-03):
   - At the Sun, the player receives a solar artifact that grants the power to challenge and overcome the invulnerable Spiked Entity at the bottom of the world.

## 3. Open questions

1. **Storage of the unlock** (provisional): the meta-progression state (the unlocked upward staircase on floor 0) is persisted in the browser's local storage (`localStorage`), and clearing the browser's data forgets it.
2. **Physical staircase location**: The floor is decided (owner, 2026-11-03): floor 0, the roots. Where on it does the upward staircase manifest (near the start room, or in a special portal vestibule)?
