# Blocks (built)

Blocks are the matter of the world: every wall, floor, door frame and loose piece of rock is made of them. The player breaks them, carries them, kicks them, places them and sets bombs against them. Every block has a material; every material has a tier, a number of hit points, an armour value and a few flags. This folder describes what exists in the game today; what is planned is in [not-built/blocks](../../not-built/blocks/README.md).

Back to [built](../README.md) · [the design document](../../README.md)

| Document | Contents |
|---|---|
| [TIERS.md](TIERS.md) | The tiers, the built materials in each, how many hits each takes, the unbreakable blocks |
| [MATERIAL-FLAGS.md](MATERIAL-FLAGS.md) | The flags a material can carry today: flammable and slippery, and the one that is declared but does nothing |
| [DAMAGE.md](DAMAGE.md) | How a hit on a block counts, armour, the minimum that always gets through, and repair by positive intentions |
| [CUBES.md](CUBES.md) | A broken block as a loose cube: its life, its hops, what breaks it, what enemies do to it |
| [KICK-AND-THROW.md](KICK-AND-THROW.md) | Kicking and throwing loose cubes, and the damage a flying cube does to a projection |
| [PLACING.md](PLACING.md) | Placing the top block on the face you aim at, and what stops it |
| [BOMBS.md](BOMBS.md) | The fused bomb: dropping it, its fuse, its blast, its chain and the counters |
| [CONTACT.md](CONTACT.md) | Crush, wearing down the blocks you press against, and headbutt, breaking the ceiling |

What all of these share: a block that breaks becomes a loose cube, or is gone; a block is broken by damage, and damage to a block is the mining stat of an intention, not its damage to a projection. The only blocks that never break are bedrock and the chests.
