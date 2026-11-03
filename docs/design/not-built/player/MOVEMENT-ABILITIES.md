# Movement abilities beyond walking and jumping

Abilities that change how the player moves: triple jump, a second jump, flight, and a sprint.

Status: mixed. The **Triple Jump** is decided as the reward for overcoming the fifth tree deity ([HORSE](../sky/guardians/HORSE.md)). Flight and sprint remain ideas.

Part of [the player (not built)](README.md).

## The design

The design gives the player walk and jump, with no sprint at first, and says that some items could grant flight, a double jump, and similar abilities ([DESIGN.md, section 4](README.md)). The built movement is in [built/player/MOVEMENT.md](../../built/player/MOVEMENT.md).

## What exists in design

- **Triple Jump (Status: decided)**:
  - Granted by an item awarded upon overcoming the fifth god of the tree ([HORSE](../sky/guardians/HORSE.md)).
  - Progression:
    - Jump 1: Normal jump height ($1\times$).
    - Jump 2: Double height ($2\times$).
    - Jump 3: Eight times normal height ($8\times$).
    - No forward boost: the third jump adds no forward speed, and the player steers fully in the air (provisional, owner, 2026-11-03).
  - Purpose: Enables long-distance, high-altitude platforming across tiny stepping stones in [Totality](../levels/TOTALITY.md), ascending into space toward the Sun ([Unity](../levels/UNITY.md)).
- **A second jump in the air (idea)**: Lower-tier double jump prior to the tree.
- **Flight from an item (idea)**.
- **A sprint (idea)**: A faster walk, if the owner wants one.

## Open questions

1. **Item identity**: What is the lore name, appearance, and physical nature of the artifact/item granted by the Horse deity?
2. **Horizontal air velocity** (answered, provisional: no): the $8\times$ jump adds no forward momentum, and the player steers fully in the air to cover the chasms in Totality.
3. **When sprint comes**: The design says no sprint at first. Does the owner mean sprint is out for good, or later?
4. **Flight and the dungeon**: Flight would change how blocks are dug and how the climb is planned ([CLIMBING.md](CLIMBING.md)). Should flight be a way up, or only a way across?
