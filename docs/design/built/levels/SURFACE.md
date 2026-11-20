# The surface and its mountains (built)

Up: [levels](README.md) · the grass round the giant tree, and the ring of mountains that closes it (issue #10).

You come out of the roots onto a wide plain of grass. The giant tree stands in its middle, and the plain runs out past the fog all round it. Far out, a ring of mountains rises in terraces: grassy ledges low down, bare stone higher up, and a summit on each ridge as tall as the tree's crown, never taller. Stairs of worn earth climb the walls, so every ledge and every ridge can be reached on foot.

## What you find

- **The plain.** Flat grass out to 304 blocks from the trunk's axis, all round: four times as wide as the first surface (76 blocks). The dungeon's own ground (the floors' footprint) lies inside it, so the grass simply goes on past where it used to stop. From the tree the mountains lie past the fog; you walk out to find them.
- **The ridges.** Three ridges make the ring. Their crest stands at about 488 blocks from the axis and about half the tree's height; each ridge has one summit as tall as the tree (146 blocks above the grass). Nothing on the surface is taller than the tree.
- **The walls: ledges and cliffs.** The walls rise in terraces: flat ledges you can stand and walk on, and cliffs of four blocks (sometimes five) between them, rugged in patches of two by two blocks. No wall is a smooth face.
- **The stairs.** Every 48 blocks along the ring a stair of worn earth, three blocks wide, climbs the inner wall from the plain to the crest, one block a step. Jumping up it is enough, and from it you step onto every ledge it crosses. There are about fifty-five stairs on each ring (none inside a pass).
- **The passes.** Three flat passes, about twelve blocks wide, cut through the ring between the ridges. They lead to a far plain behind the mountains, where other areas will open later. Past the far plain there is no ground yet. The outer walls are terraced too: you climb down them ledge by ledge.
- **What it is made of.** Grass on gentle ground up to 56 blocks, bare stone on cliffs and high ground, earth on the stairs. The same blocks as the rest of the world.
- **What you cannot do yet.** The mountains and the plain outside the old ground cannot be broken or built on: blocks you aim at them are refused, and a blast leaves them whole. Inside the old ground everything works as before.

Every run has its own mountains: the passes, the summits and where the stairs start are drawn from the run's seed, so the same seed gives the same ring.

## Not verified, and open

- **Art gate: owner review needed.** The surface uses only existing blocks and palette tokens; see the PR of issue #10 for what was looked at in the browser. Its read at distance and in the surface's fog, the ledges and stairs, and what the mountains mean to the story need the owner's eye before the art gate is passed.
- **The mountains are out of sight from the tree.** The surface's fog closes at about 114 blocks and the camera sees 200, so the ring (from 304 blocks out) is only seen when you walk towards it. A far silhouette of the ring is open.
- **The plain is flat and empty.** What grows or stands on it is open.
- **What lies past the passes**, and whether the far edge should be hidden or grown into new areas.
- **Whether the surface should become diggable** like the rest of the world (the formula already has a store of exceptions for it; decision 8 of [WORLD-STORAGE](../../not-built/levels/WORLD-STORAGE.md) keeps it closed for now).

How it is built: [architecture LEVELS §13](../../../architecture/LEVELS.md#13-the-surface-and-its-mountains-issue-10).
