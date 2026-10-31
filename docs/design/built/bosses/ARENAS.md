[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# Boss arenas

Built, in part. A phase change can name an arena: a change to the room that every boss announces. The code names 20 arenas across the 14 bosses. Eight change the world; twelve only show their toast. The arena runs once, when its phase begins (see [Fight flow](FIGHT-FLOW.md#4-phases)).

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
| `mirrors` | Shadow (phase 2) | Toast only |
| `stop` | Shadow (phase 3) | Toast only |
| `cool` | Furnace (phase 3) | Toast only |

Their toasts still play, so the phase is announced, but the room is not changed.

## Not in this list

`ice` changes the room (it raises ice walls), but only a projection uses it, the Isolation projection. No boss does.

## Rules

- An arena change happens after the phase's 2-second hold and before the first new move.
- Water and fire never start on the player's cell or within three blocks of the player.
- Walls and stones take the room's material from its floor's palette, so the same arena looks like its floor.

## Open questions

- **Twelve toast-only arenas.** Build them, or remove them? Each of these names is a promise in the toast that the room changes. Until the owner decides, the toast is ahead of the room (see [Not-built bosses](../../not-built/bosses/README.md)). The verdict, the grudge, the many-faces, the impostor, the shadow and the furnace each have a design for their arena, recorded in their own documents.
- **`walls` placement.** The design asks for walls that cut the arena into a corridor. The build raises a central column with gaps. Confirm the shape.
- **`rockfall` and `spill` on the same boss.** Inertia, Insatiable and Hoard reuse them. Is that a deliberate shared language (falling stones are the room's weight, spilling is the boss's hoard) or a shortcut to be replaced?
