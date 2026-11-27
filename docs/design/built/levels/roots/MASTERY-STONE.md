# The mastery stone

Up: [the Roots](README.md) · Status: built (issue #397). The mastery level itself is in [MASTERY](../../progression/MASTERY.md).

The way-down room carries the Roots' mastery level cut in stone, in Roman numerals. The player wakes on the spawn of the start room facing it, and sees it at the first frame through the two open doors, above the way-down pedestal. Nothing explains it: the number is the only word on the stone.

## What the player sees

- **Where:** a limestone tablet set into the middle of the way-down room's south wall (`roots-door`, the `B` cell), facing north toward the door. Its centre is at column 6.5 of the room and `y0 + 3.6`, 1.5 blocks high. It sits above the pedestal's practice and to the left of the room's south panel, and it is the same in the teaching and the easy layout (the way-down room is the same template in both).
- **What:** the level the run was carved with, as a Roman numeral in bold serif capitals cut in ink with a pale lip, between two small gold diamonds (the Roman interpunct). The tablet is as wide as its numeral needs: 2 blocks for `I`, `N` or `C`, up to 4.75 blocks for `LXXXVIII`, the longest.
- **Level 0:** `N`, for *nulla*, the mark Roman and medieval scribes used where a count was nothing. The owner may change it.
- **When it changes:** it is cut when the run starts, from the level the game read then (`runMastery`, the same level floor 0 is carved with). An achievement earned during the run shows on the stone from the next run, like every other gift of mastery. The debug level (`S.mastery(n)`, then `S.restart()`) shows too.
- **Breaking it:** the tablet is a face on the wall's blocks, not a block. If the player breaks any block behind it, the stone goes until the next run.
- Only floor 0 has it, and not the sandbox.

## Seen from the spawn

The spawn is the `P` of `roots-hall`; the way-down room is south of it, through the start room's south door and the way-down room's north door, which stand open on the Roots. From the spawn eye (1.62 blocks over the floor) the far wall can be seen through the doors between columns 3.1 and 9.9 and up to about `y0 + 4.75` (the lintel of the door). The tablet stays inside that window, and above the practice floating over the pedestal (whose icon tops out near `y0 + 2`). The narrow tablet at level 100 also keeps clear of the Boundary that stands over the second Sanctuary at that level.

The player wakes facing it: at the start of a run the view turns toward the centre of the doorway between the start room and the way-down room (`arrivalYaw`, `src/game/checkpoint.ts`), which on the carved floor is due south, with the view level. The sandbox keeps facing north.

`tests/mastery-stone.test.ts` proves it on the carved floor: for levels 0, 38, 88 and 100, in both layouts and six seeds, a ray from the spawn eye to 45 points across the tablet crosses only air, and no pickup, chest or Boundary. The same test closes the doorway and checks that every ray is then blocked, and it checks that the tablet's centre and both ends fall inside the first frame's view, from the spawn's facing, at the narrowest and widest field of view the settings allow (70 and 100 degrees) and at a square and a 16:9 screen.

## Code

`src/render/mastery-layout.ts` (pure: `romanNumeral`, the tablet's width and mount, the blocks behind it), `src/render/mastery-stone.ts` (the carving and the mesh), `Game.hangRoots` and `Game.updateRoots` (mount once per run, hide when a block behind it breaks). Gallery: `?gallery=book`, the mastery stone row. Art: [DECISIONS §14.13](../../../../art/DECISIONS.md#1413-the-mastery-stone-art-agent-2026-11-27-issue-397-owner-to-confirm-the-look-and-the-zero).
