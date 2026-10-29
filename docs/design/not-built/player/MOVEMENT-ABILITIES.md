# Movement abilities beyond walking and jumping

Abilities that would change how the player moves: a second jump, flight, and a sprint.

Status: idea

Part of [the player (not built)](README.md).

## The design

The design gives the player walk and jump, with no sprint at first, and says that some items could grant flight, a double jump, and similar abilities ([DESIGN.md, section 4](README.md)). The design makes no commitment to any of them. The built movement is in [built/player/MOVEMENT.md](../../built/player/MOVEMENT.md).

## What it would be

- A second jump in the air, from an item.
- Flight from an item.
- A sprint: a faster walk, if the owner wants one.

## Open questions

1. **Which of these exist at all.** The design says "some items" could grant them; it does not name the items or decide the abilities. The owner should choose which, if any, belong to the game.
2. **When sprint comes.** The design says no sprint at first. Does the owner mean sprint is out for good, or later?
3. **Flight and the dungeon.** Flight would change how the blocks are dug and how the climb is planned ([CLIMBING.md](CLIMBING.md)). Should flight be a way up, or only a way across?
