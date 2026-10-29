Up: [Story (built)](README.md) · [the design document](../../README.md)

# Pillars and the game loop

The five principles the design is built on, and the loop a run goes round. The pillars are the design's identity, not a claim about the code: each pillar says where its built part lives, and the part that is not built is in [not-built](../../not-built/README.md).

## The idea in one sentence

A first-person *roguelite* inside a **fully breakable** voxel dungeon: you descend floor by floor casting intentions, finding items that combine with each other and make you stronger… until, in the end, you have to **dig and build your own way back up to the surface**, where another layer of the game begins.

## The pillars

1. **Everything is matter.** Walls, doors, floors, chests and even some enemies are made of blocks. Any block can be broken if you insist enough; the question is never *whether* you can, but *what it costs you*. Built: [blocks](../blocks/README.md), [levels](../levels/README.md).
2. **Everything interacts with everything.** An item is not "+1 damage": it changes rules. Intentions, bombs, blocks, enemies, doors and health all share the same damage and event systems, so combinations emerge on their own (and sometimes break the game, which is fine). Built: [intentions](../intentions/README.md), [practices/synergies](../practices/synergies/README.md).
3. **Down to get strong, up to win.** The natural direction is down (more items, more danger). The goal is up. That tension is the heart of a run. Built: the descent ([levels/floors](../levels/floors/README.md)). The climb back up is not built: [ROUTE-FROM-ROOTS](../../not-built/levels/ROUTE-FROM-ROOTS.md).
4. **The world is only limited by what you know.** As in Noita, there are places that aren't shown, aren't announced and aren't on any map. You reach them with resources, skill, or because someone told you. Not built: [HIDDEN-LAYER](../../not-built/levels/HIDDEN-LAYER.md); the presences who tell you things are in [built/presences](../presences/README.md).
5. **Short runs, readable on mobile and PC.** A "normal" run lasts 20 to 40 minutes (a target, not measured). Controls fit on a joystick and three buttons, and every action exists on keyboard and mouse, gamepad and touch. Built: [player/CONTROLS](../player/CONTROLS.md).

The mix the design names: Minecraft's look and voxel world, The Binding of Isaac's run structure, items and synergies, and Noita's world of secrets that open up through knowledge.

## The loop

```
Enter room ─► (combat: doors close) ─► room cleared ─► reward
     ▲                                                    │
     │          ┌────────────── explore doors ◄───────────┘
     │          │
     │          ├─► treasure room (item)   ├─► key / bomb room
     │          └─► boss room ─► trapdoor ─► next floor
     │
     └──── or at any time: dig down / sideways
```

- **Micro (seconds):** aim, cast, dodge, break a block, pick up a block, place it.
- **Mid (minutes):** clear a room, decide whether to spend a key or a bomb, decide whether to dig instead of following the path.
- **Macro (run):** go down through the floors below the roots, and (not built) later up the giant tree ([built/levels/giant-tree](../levels/giant-tree/README.md) holds what is there), assembling a build from items.
- **Meta (between runs):** unlock items and knowledge (not raw power) that open new places. The design's version is not built: see [META-PROGRESSION](../../not-built/story/META-PROGRESSION.md).

Status of the loop: the micro and mid parts and the descent are built; the macro climb and the meta layer are not.
