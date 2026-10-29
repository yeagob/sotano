# Challenge rooms

Up: [rooms](README.md) · Status: built.

A challenge room is a room you come back to. Every time you walk in, three waves of projections come at you, harder each time, and you may stay for as long as you like. The owner asked for it for farming: a room to test yourself in and to win from again.

## Where it is

- **Which floors.** Any hostile floor, one to nine. Never the roots.
- **How often.** On a given floor, two plans in five have a challenge room. The draw is made with the floor's plan, so the same seed gives the same room.
- **Where.** A one-cell normal room, a dead end when the map has one, never next to the start.
- **Which rooms.** Two templates: a dome-roofed gauntlet and a vault-roofed colosseum with a pit (see [TEMPLATES](TEMPLATES.md)). Its doors wear the boss room's obsidian frame, so the room reads as a place of trial.

## What a visit is

1. **Enter.** When you step inside the room's open space (not a tunnel dug through its rock), its doors seal and the first wave is announced.
2. **Waves.** A wave is a group of projections, spawned one at a time with a short gap between them. There are three waves per visit. The next wave starts once the last one is down, after a pause.
3. **Reward.** Each wave that is cleared rolls for a reward, a heart, a bomb or a key, with luck added for the wave number. The room's clear table is the one used for every room.
4. **Done.** After the third wave the doors open again, the room is marked cleared, and a toast says the challenge is overcome: "come back for more".

Timing (built): the first wave after eight-tenths of a second; a spawn every 0.45 seconds within a wave; 1.4 seconds between waves.

## Harder each time

Every visit is harder than the one before, and every wave of a visit is harder than the wave before it. The projections chosen for a wave depend on the floor, the wave number, and the number of earlier visits, so repeat visits draw from a richer set.

## Not built here

- The wave composition is drawn from the same roster as the rest of the floor's rooms. The bestiary owns which projections a wave may hold.

Code: `src/game/game.ts` (entering, sealing, the waves, the reward and the end), `src/content/rooms.ts` (the two templates), `src/content/tables/rooms.ts` (the chance of a challenge room), `src/world/floor.ts` (the room's walls), `src/content/tables/rewards.ts` (the clear reward).
