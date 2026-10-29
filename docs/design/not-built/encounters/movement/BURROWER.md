[Movement](README.md)

# Burrower

Status: **proposal** (design text, bestiary section 3.1).

A burrower moves through rock along a fixed loop, breaking out and in. The player sees cracks ripple across the walls and hears it travel in three dimensions.

## What the design asks

- **Voxel path.** A path through the rock shell around the room, along a fixed loop that is the same each time.
- **Breaking out.** It bursts out across the room, bites, and dives back in. The loop is learnable.
- **Sound.** A rumble that moves through the walls in 3D.

## What the build has

Rumination walks a fixed loop on the floor, not through the rock. The ghost movement (passing through blocks slowly) stands in for the rock path, and nothing carves the rock.

## Open questions

- **Carving.** Does the burrower carve a tunnel as it moves, or only pass through? The design says it breaks out and in; the build does not carve.
- **The rock shell.** Which rock the burrower may use, and how the room's walls keep their shape.
- **Learnable loop.** The loop must be the same every time: the seed decides it once per room.
