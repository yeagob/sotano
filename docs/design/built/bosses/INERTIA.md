[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# Inertia

Built. Floors 1 and 2, from the Zone I pool. Code: `src/content/bosses/inertia.ts`.

Inertia is a round mass of packed earth, asleep in the middle of the room. Nothing wakes it by looking at it. A push does: a kicked cube, a bomb, a hard intention shot. Once awake it rolls at the player and bounces back off the walls.

- **Pattern:** staying as you are. Rest that became a stop.
- **Need:** to be left alone in its stillness.
- **Path:** Body.
- **Health:** 140 on floor 1, 179 on floor 2.

## Phases

### Phase 1: asleep, then rolling

It stays asleep until its body moves faster than 1.5 blocks a second. Then it wakes and walks at the player. Its moves:

- A roll and clods: a charge that runs three blocks and bounces once, then four clods thrown across the room.
- A charge that bounces twice.
- A barrage of three clods.

### Phase 2: rolls (from two thirds of its health)

Arena `rockfall`. It rolls faster. Its moves:

- Hop, hop, roll: two leaps, then a bouncing charge that lands on the player.
- A charge that bounces three times.
- A leap that throws two stones.
- A double shockwave.

### Phase 3: gathers (from one third of its health)

Arena `spill`: cubes are shed around it. It stops in one place for a while and pulls the room in. Its moves:

- Breathe in, roll out: an inhale that reaches 10 blocks and bites, then a charge with three bounces.
- A second inhale, 1.6 seconds long.
- A charge with three bounces.
- A barrage of six clods.

## Toasts

- Entering phase 2: "It rolls faster and bounces off the walls back at you".
- Entering phase 3: "It gathers: it pulls the room in, then rolls through it".

## Defeat

As in [Fight flow](FIGHT-FLOW.md#7-defeat). The design's ramp, the slope it rolled, is not built.

## Open questions

- **Wake threshold.** The wake speed decides how hard a push wakes it. Is 1.5 blocks a second the right line, given that a single intention shot knocks the boss?
- **Growth.** The design has it pick up loose cubes and grow as it rolls. The build sheds and pulls cubes but does not grow. Keep the simpler version?
- **Shell.** The design has a shell of gathered cubes to break in phase 3. There is no shell; the boss is hittable at any time after it wakes.
