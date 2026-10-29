[Bosses](README.md) · [Arenas](ARENAS.md)

# Boss fight flow

Built. How every boss fight runs, from the sealed door to the way down. The code lives in `src/game/game.ts` (boss room, omen, defeat), `src/enemies/moves.ts` (moves) and `src/enemies/behaviours.ts` (phases).

## 1. The room seals

A boss room is one room of its floor. Entering it shuts its doors at once, with the same slam as any fight (see [Seal and omens](../encounters/SEAL-AND-OMENS.md)). The floor's boss is not yet there.

## 2. The boss rises

The boss wakes 1.2 seconds after the player enters. An omen opens on a seeded floor cell of the room, away from the player: the cold motes gather, the crack opens, and the boss breaches out of it. The omen holds at its crack while the player stands within 3.5 blocks, as any projection's does. The boss then looks at the player and begins.

The entrance omen lasts 1.5 seconds in total. The design asked for 2.5 seconds (see open questions).

## 3. Health

Boss health is set when the boss spawns, from its floor, not from its definition: 140 on floor 1, 179 on floor 2, 229 on floor 3, 293 on floor 4, 374 on floor 5, 478 on floor 6, 612 on floor 7, 782 on floor 8 and 1000 on floor 9 (a curve of about ×1.28 a floor). The HUD shows a health bar with the boss's name and its ratio, only while the player is in the boss room.

A boss's touch deals 8, the same as a full heart. Its shots and ground attacks are in [Attacks](../encounters/ATTACKS.md).

## 4. Phases

A boss has three phases. The phase changes when its health falls to two thirds and to one third.

When a phase changes:

1. The boss stops and holds for 2 seconds.
2. Its arena effect for that phase runs (see [Arenas](ARENAS.md)). The phase's first arena runs when phase 2 starts, the second when phase 3 starts. Phase 1 has none.
3. A toast names the change in plain words, in the player's language.
4. A cue plays, and the new moves start.

Each phase is a moveset: a gait, a pace, and a set of moves.

## 5. Moves

Between moves a boss keeps walking its gait: stalking the player, keeping its distance, hovering over them, or standing still. Each phase sets its own pace: a move begins after a short rest of walking, and the rests are shorter in each later phase.

Every move has three beats:

- **Windup** (0.4 to 0.9 s). The boss stops, its tells brighten, and the attack's reach is drawn on the floor in cold marks. Some moves walk during the windup and say so. Moves that land on the player's position are aimed at where the player is going, not where they are.
- **Act**. The attack happens.
- **Recovery** (up to about a second). The boss stands open. This is the moment to hit it.

The next move is chosen by a seed from the boss's id and its move count, so a fight is the same in the same seed. A move is never repeated back to back when another is available. Some moves are **combos**: two or three moves chained with short gaps, counted as one move in the rotation, with the recovery after the last.

Moves that cross the room (charges, tides, bars, volleys) are the boss's reach. Stones and rubble a boss sheds do not hurt it until the player kicks or throws them.

## 6. Breaking blocks

Each boss has a breaking strength (its `breaks` field) and breaks soft blocks as it moves and charges, so a fight pushes through a room. Rubble a boss breaks loose is harmless to it.

## 7. Defeat

A boss is defeated when:

- its health reaches zero (the usual case), or
- it is converted by positive intentions: its warmth fills and it turns to the player's side (see [polarity](../encounters/POLARITY.md)), or
- it is the Shadow and the player stands still beside it for three seconds (see [The Shadow](SHADOW.md)).

Any of these runs the same defeat (`bossDown`):

1. The boss room is marked cleared and its doors open.
2. The boss's practice appears on its pedestal, with light and a chime.
3. A toast says the boss is down, and the screen gives a short shake.
4. The way down is cracked open after 1.5 seconds: the hole's top blocks crack in stages, then it opens.

On floors 1 to 8 the way down asks a toll first (section 8). Floor 9 has none.

## 8. The toll

The way down is paid for on floors 1 to 8. The player is asked to give:

- floors 1 to 4: floor plus one of hands, keys, bombs or hearts (for example, two on floor 1 and five on floor 4). A heart given this way hurts the player.
- floors 5 to 8: floor minus four practices from the inventory (one on floor 5, four on floor 8).

Until the toll is paid the hole does not open. Floor 9 has no toll.

## 9. Phase texts

Each phase has a toast, written in both languages. The toasts say what the boss does now, for example "It walls the room in and rams through its own walls". They are the only description of a phase the player gets in play.

## Why the moves are like this

The owner's verdict on the first bosses was that they felt weak: few and poor attacks, low reach, and no real risk. The rules above answer it. A boss is never idle, every blow is telegraphed for its whole windup, attacks reach across the room, and each phase is a new set of moves, with combos chained in a different order each fight. Floors 6 to 9 still use the older behaviours for some moves; their documents say where.

## Open questions

- **Entrance omen.** The design asks for a 2.5-second omen where the whole arena's motes converge and the floor cracks along the boss's outline. The code uses the standard 1.5-second omen and no outline crack.
- **Convertible bosses.** The code lets a positive intention convert any boss: warmth fills, the boss stays alive at half health on the player's side, and the room is counted defeated. The design gives conversion to the Threshold Guardian only. Should the other bosses be convertible, and should a converted boss stay as an ally, or end as a release?
- **Health curve.** The design gave both about 140 on floor 1 and 1000 on floor 9 and also a ×1.35 a floor step; the two cannot both hold. The build follows the two ends (×1.28). Which one stands?
- **Floors 6 to 9.** Their bosses still use the older single-behaviour phases for some moves. The gap between each boss's built phases and its design is in its document.
- **Release.** A defeated boss dissolves. The design says its blocks become architecture (a stair, a bridge, a light, a door). That is not built: see [Voxel bodies](../../not-built/bosses/VOXEL-BODIES.md).
