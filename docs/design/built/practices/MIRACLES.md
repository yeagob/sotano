## Kairos

Status: built. Kairos is the right moment, the time that is not counted on the clock. Its practice (quality 4, pools: vault 1, boss 0.5) stops time for a moment when you choose. It is triggered by the `miracle` action (keyboard V, pad D-pad Up, a touch button that appears only while the practice is held).

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
