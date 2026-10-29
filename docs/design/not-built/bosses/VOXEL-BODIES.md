[Bosses](README.md)

# Voxel bodies and release into architecture

Status: **proposal** (design, [built/bosses](../../built/bosses/README.md) for what is built).

The design wants every boss built from real, breakable blocks of its floor, not from model boxes. Its body has a **core vessel**, a block that shows captive light through its cracks, and exposing and hitting it releases the boss. Released, the boss's blocks become architecture: a stair, a bridge, a light or a door, the way on.

## What the design asks

- **Real blocks.** The body is made of the floor's breakable blocks, so breaking the boss's sides changes its shape and the room.
- **Luminous sockets.** Its eyes are luminous socket blocks.
- **Core vessel.** One core block shows light through cracks; exposing and hitting it is what releases the boss.
- **Release into the room.** The released blocks become a stair, a bridge, a light or a door.

## Per boss (from the design's cards)

| Boss | Release becomes |
|---|---|
| Resistance | A stair down |
| Inertia | A ramp: the slope it rolled |
| The Insatiable | A well of clean water (a heal) |
| Overwhelm | Stepping stones over still water |
| The Hoard | A pile of loose cubes and every pickup it took, plus one |
| The Downpour | A shaft of light down into the room |
| The Threshold Guardian | The arch over the pit (light route) or a hole beside it (shadow route) |
| The Verdict | A blank floor of ledger stone, warm once walked on |
| The Grudge | A causeway across the marsh |
| The Old Rule | Tablets that become a bridge out |
| The Furnace | A cold hearth with one ember of the player's in it (a light) |
| The Impostor | The empty frame stands as a doorway |
| The Many Faces | Ten masks, face up, becoming stepping stones |
| The Shadow | A thin dark ring at the player's wrist (state "Shadow integrated") |

## What the build does instead

Each boss is a set of model parts, not breakable blocks. Its defeat is a dissolve, and the way down is a hole in the floor, cracked open after a delay (see [Fight flow](../../built/bosses/FIGHT-FLOW.md#7-defeat)). There is no core vessel and no release into architecture.

## Why it is a proposal

The architecture document defers voxel bodies (its entities section). Building them means each boss's body becomes a set of breakable blocks with a core, and a release that changes the room's layout, which is a three-party review item.

## Open questions

- **One rule or per boss?** Does every boss release into architecture, or only the keystones?
- **The core.** Is the core vessel a block the player must reach, or a weak point of the body?
- **Permanence.** Released blocks are part of the floor after the fight. Do they stay for the rest of the run, and do they ever block the way?
- **Review.** Which of the release shapes need the three-party review before any of them is built?
