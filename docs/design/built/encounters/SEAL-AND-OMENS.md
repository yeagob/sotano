[Encounters](README.md)

# Seal and omens

Built. How a room's fight begins and how each projection is announced before it exists. Code: `src/game/game.ts` (seal, clear), `src/game/omens.ts` (timing, clearance), `src/entities/doors.ts` (the doors).

## The seal

A room with projections seals when the player's whole body is inside its open space. At that moment:

1. Every door of the room shuts at once, and each one slams: a heavy sound positioned at that door, dust chipped from its threshold, and a small camera nudge.
2. The room's creatures hide, dropping out of sight until the room clears.
3. A breath of half a second passes, and then the first wave's omens begin.

A room with no projections never seals: it is cleared from the start, its creatures stay visible and its doors stay open. Floor 0, the tutorial floor, never seals: its doors never lock.

## The omen

Every projection is announced by an omen at its spawn point (see [Spawns and waves](SPAWNS-AND-WAVES.md)). The omen takes 1.5 seconds in all:

| Phase | Time | What the player sees and hears |
|---|---|---|
| Gather | 1.3 s | 72 cold motes drift in toward the point, accelerating; a rising hum sits at the point, positioned in the room |
| Breach | 0.2 s | The crack opens: a flare of the cold white, a short positional crack |
| Held | while the player is near | If the player stands within 3.5 blocks of the point when the breach ends, the omen does not finish. It waits, flared, until the player moves away |
| Materialise | after the breach | The projection stands up at the point. It is not targetable while it is still forming |

The motes are colour-coded: the first half of the gather is the body tone of the pale cold ramp; the last part is the white tone. Decoration is never red (issue #47). Omens never use warm colours. Motes are capped at 24 per omen in the design; the build spends 72 per omen over the gather, with the light budget respected.

## Sound

Sound is positioned through the game's spatial audio, with the listener at the camera:

- the hum at the start of each omen,
- the breach,
- each door's slam,
- the swell before a wave (unpositioned, so the player always hears that more are coming).

Occlusion and a voice limit are not built.

## The clear

A room clears when its last wave is down, no omen is open, and no queued blast is still going off. Then:

1. The doors open with a lighter sound: the player's light, back in the room.
2. The room's creatures come back, at full health.
3. The room's reward appears, rolled once per room from its own seed.
4. A toast says the room is clear.

A room that is cleared once stays cleared: re-entering it does not seal it again.

## Open questions

- **Gather length.** The design gives 1.0 seconds on most floors, 1.4 on floors 1 and 2, and 0.8 from floor 6. The build uses one length for every floor (1.3 seconds). The design's per-floor pacing is in [not-built/encounters](../../not-built/encounters/README.md).
- **Held omens.** A held omen may hang for a long time while the player stands near. Is there a cap?
- **Doors and the player.** The design says a door whose opening holds the player waits until it is clear. Check the build with a player standing in a doorway when a seal starts.
- **Creatures after a seal.** A creature hidden by a seal in a room that is later cleared comes back; a creature hidden by a negative intention in a room that never seals does not (see [the creatures' shared questions](../creatures/README.md)).
