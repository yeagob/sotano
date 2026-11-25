# The trunk (roots, rings, galleries, hollows)

Up: [giant tree](README.md) · Status: built.

The trunk is four stories of one hollow column of bark: root bark at the roots, living wood in the rings and galleries, old bark in the hollows (see [BARK](BARK.md)). Each story is a hall with a wall three blocks thick, its own floor and its own ceiling, and a spiral stair to the story above, broken half way up. You climb through it by building across the breaks, and each hall has its own look.

## Roots (the foot of the trunk)

The first story is the widest, a hall 68 blocks across, at the foot of the tree.

- **Four doorways.** Openings in the wall face the four sides, about six blocks wide and seven high, so you can walk in and out to the surface.
- **Root-buttresses.** Ten to twelve great roots run out from the foot of the trunk, across the floor and through the wall, rising up to ten blocks at the foot and tapering as they go, up to eighty blocks from the centre.
- **Spokes.** Eight spokes of root bark run along the floor from the centre to the wall.
- **A clearing.** Around the centre, grass about four blocks across, with dirt at its heart.
- **Pillars.** Six living-wood columns stand between the walls and the centre.

## Rings

The second story is a hollow of rings: a series of living-wood rings laid across the floor of the hall, each five blocks further out than the one before. Each ring has two to four gaps, so you walk around them and through them. A column stands at the centre. The rings give the story its look: a floor you cross in steps.

## Galleries

The third story has a walkway. A ring of living-wood gallery runs round the inside wall about eight blocks above the floor, and two stepped ramps of logs climb up to it from opposite sides. Strands of leaves hang from the ceiling, two to six blocks long, up to fourteen of them through the hall. You can walk the gallery and look down on the floor.

## Hollows

The fourth story is a forest of posts. Columns of old bark stand on a grid about eight blocks apart, a few of them missing, and decks of old bark run between the posts that are close enough, at nine blocks above the floor. You cross the hollow by the decks.

## The spiral stairs

Each story has a spiral stair of living wood into the story above it: a central core of two blocks, a ring of steps climbing around it, each step a block higher than the last and about two blocks of tread long on the line you walk, and three blocks of headroom cleared along the stair. A turn of the stair is fourteen steps. The stairs are set against the wall, so each hall keeps its centre open. The stair is how you climb the trunk without a platform.

## The broken stairs (issue #317)

Every trunk story's stair is broken half way up: a run of its steps is missing, so the stair stops in the air and starts again higher up, across a hole you can fall through to the turn below. No jump crosses it: a step rises one block, so a gap of five steps is a rise of six from the last step under it to the first above it, and a ground jump rises a block and a quarter. You cross it by building: lay a block where each missing step was (or pillar up and step across), with blocks you carry or break from the bark around you.

| Story | Missing steps | Rise across the gap | Blocks to lay (one per step) |
|---|---|---|---|
| roots | 13 to 17 (five) | 6 | 5 |
| rings | 13 to 18 (six) | 7 | 6 |
| galleries | 13 to 19 (seven) | 8 | 7 |
| hollows | 13 to 20 (eight) | 9 | 8 |

Why these numbers (decided for #317, which left them open, the owner's word being "enough blocks"):

- **Step 13 and up.** The gaps begin above the highest place a story's own floor lets you stand: the galleries' walkway (8) and the hollows' decks (10). So no ledge of the hall reaches across a gap; the only way past is to build.
- **Five, then one more each story.** Five steps is already a rise of six, far beyond a jump and beyond two jumps of the ladder; the gaps grow by one step a story, so the climb gets harder as you rise (26 blocks laid for the whole trunk).
- **Every gap leaves steps above it.** Each stair keeps at least two whole steps over its gap, up to the floor of the story above.
- **Practices.** The gaps are for a body with no practices. The [Triple Jump](../../player/TRIPLE-JUMP.md) (the horse's gift, or the Leaves' at the top of the tree) rises far enough to cross them; that is its reward, not a hole in the design.

Above the trunk the stairs are whole: once the hollows are climbed, the branches, the canopy and the Leaves are reached on foot, and the Leaves give the jump practice for the stars ([LEAVES](LEAVES.md)).

## The climb: route and goal of each story (issue #328, reconciled with #317)

The trunk's interior is the four stories above, unchanged, and one route through them: the spiral stair of each story, in order, from the roots' doorways to the branch story's floor. Each story has one goal on that route, its broken stair: reach the step under the gap, build across it, climb on. The gaps are the route's obstacles and the stories are where they stand, so the climb and the interior are one design. The halls' own features (the rings, the gallery and its ramps, the posts and decks) are places to stand and look from and blocks to take, never a way past a gap. The climb is met in every run on the way to the crown; it adds no room, no projection and no boss. What #328 still leaves open (what else a story asks or gives, and whether the climb ever changes with progress) is in [TREE-CORE](../../../not-built/levels/TREE-CORE.md).

## Knots

The wall of each trunk story has knots at heights three to six: small gaps in the bark, placed at random per run.

Tested in `tests/tree-climb.test.ts`: each trunk story has its gap and no other stair has one; a generous jumper (any place within 3.5 blocks across and one block up) reaches nothing past a gap from its story; the real body fails the gap and crosses it with one block laid per missing step; from the grass the climb stops at the roots' gap, and with every gap mended it reaches every story and the Leaves on foot.

Code: `src/world/tree.ts` (the trunk, the roots, the rings, the galleries, the hollows, the stairs and `STAIR_GAPS`, the knots).
