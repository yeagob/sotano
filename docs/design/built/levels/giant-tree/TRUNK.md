# The trunk (roots, rings, galleries, hollows)

Up: [giant tree](README.md) · Status: built.

The trunk is four stories of one hollow column of bark: root bark at the roots, living wood in the rings and galleries, old bark in the hollows (see [BARK](BARK.md)). Each story is a hall with a wall three blocks thick, its own floor and its own ceiling, and a spiral stair to the story above. The stair is broken: steps to hop, plugs to dig, in the galleries a waterfall to swim, and half way up a gap to rebuild. Each hall has its own look.

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

Above the trunk the stairs are whole. Once the hollows are climbed, the branch story, the canopy and the Leaves are reached on foot, and the Leaves give the jump practice for the stars ([LEAVES](LEAVES.md)). The six branch courses leave the branch story's hall ([BRANCHES](BRANCHES.md)).

## The broken climb (issue #328, the core)

The core is the whole climb inside the trunk, from the roots' doorways to the floor of the branch story. Each of the four stories keeps its hall, and its stair is a broken climb with parkour in it. There is one route, the stairs in order. The halls are the detours: places to stand, look from and take blocks from, never a way past a work of the stair. The rule: every section can be passed with the base body (one ground jump, no practice) plus digging and placing blocks, so a run never gets stuck. Practices make it faster, never possible.

What a stair asks below its gap:

| Work | What you meet | How you pass |
|---|---|---|
| **Broken tread** | the first half of a step is missing: about a block of air, one block up | a ground jump |
| **Leap** | the first two thirds of a step are missing: about a block and a third of air on the line you walk (less on the inner side, more on the outer), one block up | a ground jump, from the edge |
| **Plug** | earth fills the headroom over two steps, three high | dig through it: dirt is the softest block in the trunk, and what you dig is what you carry up to mend the gap |
| **Waterfall** (galleries) | steps 2 to 8 are washed out. A waterfall falls beside step 9, from the story's ceiling to the floor | swim up the falling water (hold Jump) and step out onto step 9. Building up also works |
| **Gap** (#317) | five to eight steps missing, beyond any jump | lay a block per missing step (the table above) |

| Story | Its stair, step by step |
|---|---|
| roots | broken treads at 4 and 6, a plug over 8 and 9, the gap 13 to 17 |
| rings | a broken tread at 3, a leap at 5, a plug over 8 and 9, a broken tread at 11, the gap 13 to 18 |
| galleries | the waterfall beside the washed-out steps 2 to 8 (out at 9), a leap at 10, the gap 13 to 19 |
| hollows | a leap at 3, a plug over 6 and 7, a leap at 9, the gap 13 to 20 |

**The waterfall.** A source sits under the galleries' ceiling, and falling water reaches down to the floor, just outside the stair's tread at step 9's middle. It is water by the floors' rules: written still, woken once the story grows, and its foot spreads a few blocks of shallow water over the floor. The climb is about six blocks of swimming. Breath lasts eight seconds and the swim takes under three. The water runs past the gap's height, but nothing of the stair above the gap is in reach from it (by the stair's geometry the nearest whole step over the gap is about seven and a half blocks away across the air; not tested). The galleries' walkway, ramps and strands keep four blocks off the stairs (`GALLERY_CLEAR`), so the walkway is three blocks of air from the tread and cannot be used to skip the washed-out flight.

**Building through it all.** A player with no practice who digs the plugs and lays a block in every missing tread cell reaches every story and the Leaves on foot. The trunk asks for at least 26 blocks laid for the gaps, plus the broken treads and leaps they choose to fill instead of jumping. The plugs give more dirt than that.

The climb is met in every run on the way to the crown. It adds no room, no projection and no boss. What #328 still leaves open is in [TREE-CORE](../../../not-built/levels/TREE-CORE.md).

## Knots

The wall of each trunk story has knots at heights three to six: small gaps in the bark, placed at random per run.

Tested in `tests/tree-climb.test.ts`:

- Each trunk story has its gap, no other stair has one, and every other work sits below the gap.
- A generous jumper reaches nothing past a gap from its story, with the rest of the stair mended. The real body fails the gap and crosses it with one block laid per missing step.
- The real body (base stats, `tests/helpers/parkour.ts`) hops every broken tread and every leap.
- A plug stops the walk until it is dug.
- The waterfall is a source with falling water down to the floor. No jump climbs past the washed-out flight, and the real body swims up it and steps out onto step 9.
- From the grass the climb stops in the roots. Built through (plugs dug, missing treads laid), it reaches every story and the Leaves on foot.

Code: `src/world/tree.ts` (the trunk, the roots, the rings, the galleries, the hollows, the stairs, `STAIR_GAPS`, `STAIR_WORKS`, `LEAP`, `PLUG`, the waterfall, the knots), `src/game/game.ts` (the waterfall woken once its story grows).
