Up: [Levels (not built)](../README.md) · Status: decided in part, proposal in part (issue #331).

# Secret rooms

A secret room is a room the official dungeon does not show. Each one has its own way in, its own fixed unique items and its own achievement. Only the south destination is built: the deep desert, reached by walking south, with its worm, its unique practice and its achievement ([worm-desert](../../../built/levels/worm-desert/README.md), issue #354). There is no portal, no other secret room and no other walking trigger in the code.

Four of them are the **cardinal rooms**. From the surface, walking straight north, south, east or west for long enough reaches an element of the Outer Void, and that element opens a portal onto a destination ([CARDINAL-WALK](CARDINAL-WALK.md)). The owner has decided the four destinations: an ice zone to the north, the statue to the east, the labyrinth temple to the west and the desert of the worms to the south. The other rooms are reached in ways the design has not yet set.

## Shared rules

Every secret room follows these rules, whatever its way in.

| Rule | What it means |
|---|---|
| **Its own way in** | Each room is found in its own unique way: the cardinal walk, a state of being, a specific action or digging. The way in is written in the room's own document |
| **Fixed unique items** | Each room holds one or more items that exist only there, the same in every run. Their names are not chosen yet; they follow [sotano-items](../../../../../.claude/skills/sotano-items/SKILL.md) and the naming rules |
| **One achievement each** | Each room gives its own achievement, one mastery level each ([MASTERY](../../../built/progression/MASTERY.md)). The achievement is permanent across runs. Its criterion belongs to the room and is set when the room is built |
| **A challenge with a reward** | Inside is a challenge. Its reward is the room's fixed items and its achievement. The most powerful rooms also give a reflection object (issue #336), which this folder does not define |
| **The room is there every run** | The room and its items are in every run. Only the achievement is kept across runs, as the record that the room was found |
| **A portal is not a teleport door** | In this folder a portal is a secret room's entrance. The teleport doors of the Tree, which are not built, are a different thing ([TELEPORT-DOORS](../../creatures/TELEPORT-DOORS.md)) |

## Documents

| Document | Status | Contents |
|---|---|---|
| [CARDINAL-WALK.md](CARDINAL-WALK.md) | decided (the walk's end, the four destinations), open (distance, the portal's look) | The walk from the surface to the four portals, and where each one leads |
| [EAST-STATUE.md](EAST-STATUE.md) | decided (destination), proposal (the room) | The statue to the east (issue #334) |
| [WEST-LABYRINTH.md](WEST-LABYRINTH.md) | decided (destination), proposal (the room) | The temple labyrinth to the west (issue #335). A sacred reference: treated with respect |
| [BOSS-RUSH.md](BOSS-RUSH.md) | proposal, location open | Boss Rush (issue #332), reached by digging |
| [SNAKE-3D.md](SNAKE-3D.md) | idea, location and way in open | Snake 3D (issue #333) |

The two cardinal destinations outside the dungeon are zones, documented in [extra-zones](../extra-zones/README.md): the north ice zone ([NORTH-ICE](../extra-zones/NORTH-ICE.md)) and the south desert ([SOUTH-DESERT](../extra-zones/SOUTH-DESERT.md)). The walk ends at the Outer Void ([OUTER-VOID](../extra-zones/OUTER-VOID.md)).

## What the owner decided (issue #331)

- **Backlog export v1 (2026-11-25).** The secret-room system has several kinds of room. Each has unique fixed items, an achievement and its own way in. The first four are predefined: from the surface of the tree, walking straight for long enough leads to structures or teleports to unique places. The export names the destinations of Boss Rush, Snake 3D, the statue, the labyrinth and the desert. The only cardinal link it states is that south leads to the desert.
- **Destinations (owner, 2026-11-26).** North: an ice zone, not yet designed. East: the statue (#334). West: the temple, which is the labyrinth (#335). South: the desert of the worms (#354). Boss Rush is not a cardinal room.
- **Recorded in the issue's analysis.** The four cardinal rooms open by walking only, with no state of being. The walk ends at the cardinal element of the Outer Void (#330), so no straightness tolerance is needed: reaching the element is what counts. Boss Rush is reached by digging. Every secret room gives its own achievement, which is permanent.

## Build plan (when the zones and rooms are built)

This is the list the build starts from. Nothing in it is built.

1. **Triggers.** The cardinal walk (the distance, the direction, what counts), and the state-of-being and action triggers of the other rooms.
2. **The portal and its art.** A portal object, passing [sotano-art](../../../../../.claude/skills/sotano-art/SKILL.md). Any hint or notice uses an existing pop-up type ([sotano-popups](../../../../../.claude/skills/sotano-popups/SKILL.md)) and both languages ([sotano-i18n](../../../../../.claude/skills/sotano-i18n/SKILL.md)).
3. **Room templates.** The rooms follow the level grammar ([sotano-levels](../../../../../.claude/skills/sotano-levels/SKILL.md)). A room outside the floors is placed as the built Leaves room is ([LEAVES](../../../built/levels/giant-tree/LEAVES.md)).
4. **Items and achievements.** Catalogue entries as data ([sotano-items](../../../../../.claude/skills/sotano-items/SKILL.md), [sotano-achievements](../../../../../.claude/skills/sotano-achievements/SKILL.md)). Names pass [sotano-lore](../../../../../.claude/skills/sotano-lore/SKILL.md).
5. **Tests.** Each portal opens when, and only when, its condition holds, for a fixed seed. The cardinal walk does not fire before the element is reached, and does fire once it is. Each trigger is tested by its own condition.
6. **Docs.** The shipped text moves from this folder to the built branch in the same commit ([sotano-design](../../../../../.claude/skills/sotano-design/SKILL.md)). The pointer in [HIDDEN-LAYER](../HIDDEN-LAYER.md) is updated.
7. **Seeds.** Any change to what a seed builds bumps `GEN_VERSION` ([RNG](../../../../architecture/RNG.md)).
8. **Checks.** `npm run typecheck && npm test`.

## Open questions

1. **Triggers of the other rooms.** Which states of being open which rooms, and which specific actions open the rest? (Question 3 of issue #331.)
2. **Boss Rush and Snake 3D.** Where do they lie, and what is the trigger for the digging of Boss Rush? (Issues #332, #333.)
3. **Hints.** Does the walk or any way in show a sign? A secret must be found by a sign the player can read, as in [BURROWING](../../creatures/BURROWING.md).
4. **Reflection objects.** What is a reflection object, and which rooms are the most powerful? (Issue #336.)
5. **HIDDEN-LAYER and TELEPORT-DOORS.** Whether their proposals are absorbed into this folder or kept. This folder leaves them as they are.
6. **Names.** Item names and room names are not chosen. The working names "Joel-Clown", "Maze 3D", "Snake 3D", "Boss Rush" and "Gusanos de Dune" pass [sotano-lore](../../../../lore/SOURCES.md) first. "Dune" is a copyrighted title and is not used as a name ([dune](../../../../lore/SOURCES.md)).
