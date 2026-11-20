# Miracles

Up: [all practices](README.md) · [built design](../../README.md)

A miracle is an effect that is impossible in normal play, rare, and clearly timed. Each miracle has its own issue under the umbrella #121. A miracle is a practice like any other: it is found in the rooms, carries a path and tags, and is listed in the [index](README.md).

## Rules for every miracle (#121)

1. It always gives the player a positive outcome, especially in special cases (the design rule of the practices issue, #110).
2. It has a clear timer or cost, shown on the HUD.
3. It can never trap the player, for example inside a block.
4. Its controls work on keyboard and mouse, gamepad and touch (sotano-controls).
5. Its text is translated into English and Spanish (sotano-i18n).

## The miracles

Both are practices of the Miracles path (`milagros`, the path the owner opened for Dr. Launcher), so the path now holds three practices; its state of being is the owner's to name.

| Miracle | Issue | Quality | Found in | Status |
|---|---|---|---|---|
| [Lucid Dream](#lucid-dream) | #122 | 4 | vault rooms, boss rewards | built |
| [Kairos](#kairos) | #123 | 4 | vault rooms, boss rewards | built |

## Lucid Dream

`luciddream` · Miracles path (`milagros`) · tags `milagros`, `miracle`, `movement` · quality 4 · pools vault 1, boss 0.5 · inspired by *Lucid dreaming* (Frederik van Eeden, 1913).

In a lucid dream you know the walls are made of you.

**Effect (as the player reads it):** "Picking up a bomb, key or heart lets you walk through blocks for 3 seconds (more pickups add time, up to 6). Unbreakable blocks stay solid. You always come out in free space."

### What starts it

- A pickup that is actually collected: a bomb, a key, or a heart of any kind (red, blue, stone, berserker, blood and the others). A refused pickup (a full red heart, no room for a heart layer) starts nothing.
- Each collected pickup during a phase adds 3 s. The time left is capped at 6 s.
- No other action starts a phase.
- The item's hook runs after every hook that can cancel the pickup (priority 200), so a cancelled pickup grants nothing.

### What the phase does

- While phased, the body passes through blocks with finite hp. Blocks with infinite hp (bedrock, heartwood, the sun seal, any unbreakable block) and doors stay solid.
- The body never leaves the box of the room it stood in when the phase began. The box is the room with its walls on the sides and its ceiling layer above. The floor layer stays solid, so the body cannot sink through the floor. Beyond the box everything is solid.
- No suffocation or crush damage while phased. Contact wear on blocks (the `crush` stat) pauses while phased, because the body is inside the blocks it passes.
- A soft screen tint (a wash of `path.mind.glow` at the edges) is shown while the phase runs.

### How the phase ends

- When the time runs out, or when the body has left its box (a fall through the floor, a descent), the phase ends.
- A body left inside a block moves to the nearest free standing cell, searched inside room interiors only: first the room the phase started in, then the room the body is in, then the other rooms of its floor. Standing spots with solid ground below are preferred; the body is never placed in a block, never outside the map.
- A phase that starts in no room (a corridor or the sky) uses a small box around the feet (3 cells sideways, 2 down, 4 up). It ends the same way.

### Feedback

- HUD: a status pill under the counters, the practice's icon and the seconds left (rounded up). In the last second (1 s) the pill is outlined. Type: the persistent status type of sotano-popups (`#phase`).
- Sound: a soft rising swell when a phase starts; one soft tick when the last second begins.

### Generic core

- `ItemApi.grantStatus(id, seconds, { add?, cap? })` starts or extends a player status timer. A status is counted down in the game's simulation and cleared with a run. A status that starts a phase takes the box described above. The HUD shows `phase` only.
- The game reads the status through `Game.phaseLeft` (the sandbox report prints `phase n s` while it runs).

### Numbers

| Number | Value |
|---|---|
| Phase length per pickup | 3 s |
| Cap on the time left | 6 s |
| Warning | the last 1 s |
| Fallback box in no room | 3 cells sideways, 2 down, 4 up |
| Body for the rescue | half width 0.3, height 1.8 |

### Decisions taken for the owner (open for review)

These were the choices the issue left open. The orchestrator took them; the owner can change any of them.

1. **Duration and stacking.** 3 s per pickup, adding up to a cap of 6 s (from the design brief). A pickup during a phase adds to it; it does not restart it.
2. **Unbreakable blocks stay solid**, as the brief asks. The sun seal, heartwood and bedrock count as unbreakable (infinite hp).
3. **The floor stays solid.** The box is the room with its walls and ceiling layer. A body that could sink through the floor would end the phase in the rock below the room, so the box starts at the floor surface.
4. **Doors stay solid** while phased.
5. **Rescue preference.** The current room first, then the other rooms of the floor. A rescue never leaves the rooms.
6. **Fallback in corridors** (no room): a small box around the feet. Only the feet's neighbourhood can be passed.
7. **Crush pauses while phased.** A phased body is inside blocks; wearing blocks down by pressing would be a surprise.
8. **Lowest-cost feedback.** A pill and a tint, one sound at the start and one tick in the last second. No toast.

### Tests and sandbox

- `tests/lucid-dream.test.ts`: the item's validity and translations; the pickup hook (bomb, key, heart start the phase; a refused pickup does nothing); the passable solid (finite blocks passable inside the box, unbreakable blocks and the floor solid); the rescue from 400 seeded random positions inside blocks (the result is inside an interior and free); the rescue picks the nearest free spot (a brute-force check); the fallback box.
- Scenarios in `src/sandbox/scenarios/`: `luciddream-phase` (the body steps into a crate and comes out when the phase ends), `luciddream-bedrock` (a body placed inside bedrock is moved out when the phase ends; the sandbox can place a body but cannot walk it into bedrock, so the solid rule is tested in the unit tests), `luciddream-stack` (four pickups: the time is capped at 6 s).

## Kairos

Status: built. Kairos is the right moment, the time that is not counted on the clock. Its practice (Miracles path, `milagros`; quality 4, pools: vault 1, boss 0.5) stops time for a moment when you choose. It is triggered by the `miracle` action (keyboard V, pad D-pad Up, a touch button that appears only while the practice is held).

- **Charge.** Three pips. Starts full on pickup. One pip fills per cleared room (`roomClear`); a boss room fills it at once (`bossOvercome`). The charge is kept in the practice's scratch memory: it survives inventory rebuilds and is not saved with the run. It is shown as three pips on the HUD (a persistent status beside the polarity mark) and as a ring on the touch button.
- **Trigger.** The `miracle` action with the charge full. A press with the charge short says how much is charged (a toast from the practice's messages) and does nothing else.
- **The stop.** Time stops for everything: the player cannot move, the projections, their projectiles, the intentions in flight, the elements (fire, water, lava), the doors, the timers and the potions' clocks do not advance. The player's look still turns. The screen is desaturated and a slow heartbeat sounds. Pausing the game during a stop keeps it; a death, a room change or a screen opened ends it without firing, and the charge stays.
- **Marks.** While stopped, the cast press (mouse, keyboard or touch) marks the point under the crosshair: the projection the ray meets first (the mark sticks to it), else the block (up to 40 blocks), else the far end of the ray. Up to five marks; a sixth is refused with a toast. Each mark is a numbered ring on the world and the HUD reads `marks n/5`.
- **Release.** The `miracle` action again, or six seconds of running game (a pause does not spend them). Five intentions fire at the same moment from the eye, one for each mark, dealt round robin when there are fewer marks (two marks: 1, 2, 1, 2, 1). With no marks all five go to the crosshair point. Each intention is built through the normal `fire` event (the items apply), with pierce +1; an intention marked on a projection homes toward projections (`homingTarget: 'projection'`, homing at least 6 per second). The charge then empties.
- **Code.** The rules without a renderer are in `src/game/kairos.ts`; the stop is one branch at the top of `Game.simulate`, and the frame cancels it on any screen that is not the game. The practice is `src/content/items/kairos.ts`.

Effect (as shown in the game): "Clear 3 rooms to charge (starts charged). Press it to stop time; mark up to five places; release to fire five intentions at once, one at each mark, piercing."

### Open for the owner

- The stop counts six seconds of running game, not wall-clock time, so a pause does not spend it. The brief said real time; this keeps a pause from firing the marks behind the menu.
- A stop is cancelled, not fired, when the player dies or a room changes. The charge is kept, so the practice is never lost to a bad moment.
- The touch icon is a placeholder drawn for the build; the art gate (sotano-art) has not passed it yet.
- The homing strength of a projection mark (6 per second) is a first value to play with.
