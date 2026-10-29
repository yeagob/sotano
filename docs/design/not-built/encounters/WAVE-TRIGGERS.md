[Encounters](README.md)

# Wave triggers

Status: **proposal** (design text, bestiary section 2.4, the room director). The built triggers are the seal and the wave's remaining count and patience (see [built: Spawns and waves](../../built/encounters/SPAWNS-AND-WAVES.md)).

A room's roster is split into waves, and a trigger decides when each next wave opens. The design wants the room director to be data, not code for each room.

## The triggers

| Trigger | Meaning | Use | Status |
|---|---|---|---|
| `onSeal` | The first wave, half a second after the slam | Every combat room | Built |
| `remaining ≤ n` | When n or fewer of the wave remain | Wave two and later (n = 1) | Built (n = 1) |
| Patience | The wave has stood for 25 seconds, so the next opens | Every wave two and later | Built |
| `hpShare ≤ x` | When the wave's remaining health falls below x | Large single projections that call help | Not built |
| `afterSeconds t` | A timer, so stalling does not help | Trial rooms and bosses | Not built |
| `event` | A room event: a pedestal touched, a flame put out, water drained, a boss phase | Ambushes and set pieces | Not built (boss phases are built as their own changes) |

## What the design asks

- **Data.** A room's director is data: its waves, its triggers and its spawn kinds, read by the same code for every room.
- **Seeded.** The waves and the triggers come from the room's own seed.

## Open questions

- **Format.** The room data format for waves does not exist. It needs the levels skill before it is written.
- **Events.** Which events are safe to use as triggers (a flame put out in a fight could be a trap)?
- **Timers.** A timer makes stalling useless; decide whether a room should ever wait for the player to act.
