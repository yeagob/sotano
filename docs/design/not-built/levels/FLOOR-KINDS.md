# The upper maps: trunk, branches and leaves

Up: [not-built levels](README.md) · Status: proposal, open.

The design lists three floor kinds for the giant tree, each a different kind of map: the trunk as a vertical map (rooms stacked inside the trunk, joined by climbs and shafts), the branches as a three-dimensional map (platforms and hollows in every direction, joined by branches), and the leaves as a star map (constellations as rooms, teleport doors between stars, open views of the cosmos). The build has the level kinds in its data but no floor uses them. The tree is walked as seven stories instead.

## What the design asks

- **Trunk (floor L1).** Rooms stacked inside the trunk, joined by climbs and shafts. A vertical map.
- **Branches (floor L2).** Platforms and hollows joined by branches, in every direction. A three-dimensional map.
- **Leaves (floor L3).** Constellations as rooms, teleport doors between the stars, views of the cosmos. A star map.

## What the build does

- The tree is built as seven stories, each a hall or level you walk, joined by spiral stairs (see [giant tree](../../built/levels/giant-tree/README.md)).
- The trunk, branches and leaves exist as zones the player walks through and the HUD names, not as rooms on a map with templates.
- The star pads are the teleport of the heaven zone: each carries you to the next star (see [STARS](../../built/levels/giant-tree/STARS.md)).
- No room template is used on the tree.

## A contradiction in the design

The design text calls the tree's upper part "three upper floors" in one place, and its built paragraph calls the tree "seven stories". Both are in the level design. The build follows seven stories. The owner has not said which to keep.

## What the three maps would need

- A map kind per tree story: how rooms stack in a trunk, how branches join, how a star map links rooms.
- The room templates for trees (none exist), the rules of height and doors in a tree, and the walk check for each map.
- A decision on whether the tree's stories are rooms (the templates) or walkable halls (as now).

## Open questions

1. Are the upper three levels room maps like the floors below, or walkable stories as built?
2. If room maps: which templates, and does a tree room follow the same house rules as a floor room?
3. Does the star map keep the teleport doors (the design) or only the pads (the build)?
4. Does the trunk keep its four stories, or fold into three floors as the design text says?
