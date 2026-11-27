[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# Boss arenas

Built, in part. A phase change can name an arena: a change to the room that every boss announces. The code names 19 arenas across the 14 bosses. Eight change the world; eleven only show their toast. The arena runs once, when its phase begins (see [Fight flow](FIGHT-FLOW.md#4-phases)).

## Arenas that change the room (built)

| Arena | What it does | Used by (phase it starts) |
|---|---|---|
| `walls` | Raises two-block walls of the floor's wall material down the room's centre column, from three rows in from one end, so the far end stays open. Never on the player's cell | Resistance (phase 2) |
| `rockfall` | Up to twelve stones fall across the room, each marked before it lands, a beat apart | Resistance (phase 3), Inertia (phase 2), Insatiable (phase 3), Hoard (phase 2), Threshold Guardian (phases 2 and 3) |
| `spill` | The boss sheds twelve cubes of the floor's material around itself, which fly out and fall | Inertia (phase 3), Insatiable (phase 2), Hoard (phase 3) |
| `flood` | Water rises across the room to a level of three, except within three blocks of the player | Overwhelm (phase 2) |
| `drain` | Water is removed from the room | Overwhelm (phase 3), Downpour (phase 3) |
| `puddle` | Shallow water (level one) across the room, except within three blocks of the player | Downpour (phase 2) |
| `fire` | Fire on the room's free floor cells, except within three blocks of the player | Furnace (phase 2) |
| `drop` | A block of the wall material falls on the player's position | Old Rule (phase 2) |

The phase in brackets is the one the arena starts. Hoard's arenas are `rockfall` on phase 2 and `spill` on phase 3; Downpour's are `puddle` on phase 2 and `drain` on phase 3.

## Arenas that show only a toast (built: the name, not the change)

| Arena | Used by | What the player sees |
|---|---|---|
| `marks` | Verdict (phase 2) | Toast only |
| `turn` | Verdict (phase 3) | Toast only |
| `crumble` | Old Rule (phase 3) | Toast only |
| `mud` | Grudge (phase 2) | Toast only |
| `surface` | Grudge (phase 3) | Toast only |
| `faces` | Many Faces (phase 2) | Toast only |
| `plain` | Many Faces (phase 3) | Toast only |
| `brass` | Impostor (phase 2) | Toast only |
| `frame` | Impostor (phase 3) | Toast only |
| `stop` | Shadow (its health falls to a third: the stillness ending opens) | Toast only |
| `cool` | Furnace (phase 3) | Toast only |

Their toasts still play, so the phase is announced, but the room is not changed.

## The Shadow's room (built)

The Shadow (floor 9) fights in a room of its own, `mirror-hall`, the biggest a floor can hold. The owner asked for a much bigger room, a start much farther from the boss, plenty of cover of different materials all over it, and room for a more generous fight.

- **Size.** Four cells of space: 28 blocks by 16, under a flat roof 8 blocks high. That is the limit of the room format: a template is at most two cells each way, and 8 blocks is the tallest interior that keeps three layers of rock between floors 16 blocks apart (see [Height and ceilings](../levels/rooms/HEIGHT-AND-CEILINGS.md)). Every other boss room is two cells (28 by 7). The flat roof keeps the full 8 blocks over every tile; a vault or a dome would take height back at the edges.
- **Always there.** Floor 9's plan always leaves an empty two-by-two block of cells beside its boss room, and the boss room claims it before any other room, so the Shadow's room always fits. It is the only boss room of floor 9 and appears on no other floor.
- **The start.** You come in through the door of one corner cell. The Shadow rises on the open floor tile of the room farthest from you, which is the far corner: 25.8 blocks away if you came in by the door in the short wall's middle, 29.5 by the door in the long wall's middle. In the two-cell halls it rose on a seeded tile at least 3.5 blocks away (8 to 15 blocks typically). Nothing two blocks high stands on the line between either door and that corner, so you see it the moment it rises.
- **Cover.** About 28 pieces, spread over the whole room: pillars of dark brick to the roof, obsidian walls, stepped ledges of ashlar three blocks high along the north and south walls and on the west side, stone boulders, crate stacks, lead ore, dirt, and patches of ice underfoot. Tall pieces (two blocks or more) hide you; low pieces (one block) you jump on. Every high top you can stand on has a step of one block beside it.
- **What breaks.** The game's own rule: a shot breaks the softest blocks it hits (crates and dirt), so that cover wears away as the fight goes on; it stops on stone, ashlar, dark brick, lead ore, obsidian and ice, which only digging or a bomb takes down.
- **Lanes, nooks and ledges.** The diagonal from the doors to the far corner is an open lane; the pieces against the walls make close nooks (never a pocket closed on three sides); the stepped ledges are the high ground.
- **Nothing traps you.** From every tile you can stand on there is a walking way to the Shadow and back, with steps of one block, so it can always reach you and you it.

Code: `src/content/room-layouts.ts` (`mirror-hall`), `src/world/floorplan.ts` and `src/world/floor.ts` (the two-by-two block), `src/game/game.ts` and `src/game/omens.ts` (the far start). Tests: `tests/shadow-arena.test.ts`.

## Not in this list

`ice` changes the room (it raises ice walls), but only a projection uses it, the Isolation projection. No boss does.

## Rules

- An arena change happens after the phase's 2-second hold and before the first new move.
- Water and fire never start on the player's cell or within three blocks of the player.
- Walls and stones take the room's material from its floor's palette, so the same arena looks like its floor.

## Open questions

- **Eleven toast-only arenas.** Build them, or remove them? Each of these names is a promise in the toast that the room changes. Until the owner decides, the toast is ahead of the room (see [Not-built bosses](../../not-built/bosses/README.md)). The verdict, the grudge, the many-faces, the impostor, the shadow and the furnace each have a design for their arena, recorded in their own documents.
- **`walls` placement.** The design asks for walls that cut the arena into a corridor. The build raises a central column with gaps. Confirm the shape.
- **`rockfall` and `spill` on the same boss.** Inertia, Insatiable and Hoard reuse them. Is that a deliberate shared language (falling stones are the room's weight, spilling is the boss's hoard) or a shortcut to be replaced?
