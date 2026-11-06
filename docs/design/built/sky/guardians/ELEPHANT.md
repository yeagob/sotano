# Elephant (built)

Up: [The guardians of the sky (built)](README.md) · sky floor 3, the channels.

The third deity: a great grey elephant head on a small plush body, floating one block over the Basin, the pool at the top of the floor's stepped mountain. The full design, its targets and its open questions are in [not-built ELEPHANT](../../../not-built/sky/guardians/ELEPHANT.md).

## What the player meets

- **Where.** The elephant floats one block over the Basin's water, its trunk reaching down into it; its small body hangs from height 27 and its head reaches about 30. It hears the whole hall from there. It does not teleport.
- **Listening.** When the player climbs onto a new level, its ears fan open for 1.5 s.
- **Memory, its own rule.** The elephant keeps the place where the player stood longest in the last 10 s. Trunk spray, Memory stone and Dust bath aim there, not at the player: a player who keeps moving is never where they land.
- **The rim, its guard.** The Basin has a rim two blocks high. A positive hit counts only when the player's eye sees the small body over the rim, or the head while the trunk is raised (in Trunk spray, Trumpet and Trunk lift, and 1.5 s after a spray or a trumpet). Anything else puffs.
- **Drinking, its recovery.** After each attack it drinks for 2.5 s, its trunk down in the pool.
- **Three phases**, at a third and two thirds of its 36 hits; the rest between attacks is 3 s, then 2.5 s, then 2 s.

## Attacks

| # | Attack | Phase | What it does | Answer |
|---|---|---|---|---|
| 1 | Trunk spray | 1 | Water runs down a channel bed from its head for 6 s and carries the player down at 3 blocks a second | Step up onto a bank, or dam the bed above you; a positive shot at the head stops it for 3 s |
| 2 | Trunk swat | 1 | A kick of 3 blocks along an arc, away from the Basin, within 11 blocks of the axis | Step out of the arc, or a block behind you |
| 3 | Mud wallow | 1 | A patch of radius 2 is dense for 5 s: walking at half pace | Jump out, or build over it |
| 4 | Dust bath | 1 | Dust falls in a circle of radius 2 where the player rested; inside it drains 16 spirit | Move; a block overhead shelters |
| 5 | Memory stone | 2 | A stone lobbed where the player rested stays as one block for 8 s, then dissolves; on the player it is a push | Do not be where you rested; a block overhead stops it |
| 6 | Ear fan | 2 | A gust of 2.5 s at 2.5 blocks a second along a line | Walk against it, or a block in its line |
| 7 | Low rumble | 2 | A ring along the terrace's own ground at 7 blocks a second; on that ground when the edge passes drains 12 | Jump, stand on a placed block, or step into wet water |
| 8 | Trumpet | 3 | A ring along the player's terrace pushes 1.5 blocks outward | Jump it; a positive hit on the raised trunk muffles it |
| 9 | Heavy water | 3 | A grey flow runs down a bed at 4 cells a second; in the bed when it reaches the player drains 14 | Climb out through a cut, or dam the bed above |
| 10 | Trunk lift | 3 | A ring closes round the player; inside, the trunk lifts them one block, holds them 3 s and keeps one practice ("The trunk holds you, and keeps one practice.") | Leave the ring; a block overhead stops the trunk |

## Won

At 36 positive hits the elephant sets its weight down and the water drains ("The elephant sets its weight down. The water drains from the channels."), the floor's way up over the tusk line opens and spirit refills. Ally elephants in the waterhole answer its trumpet with their own: one hit every 6 s, with no cap below the hit count (allies alone may win slowly, provisional).

## Not built

- **The positive answers in flight:** a positive shot into the dust circle, at the grey water or at the stone in flight does not answer them yet.
- **The channels of the floor** are not built (F3 built the spouts only): Trunk spray and Heavy water run down a stand-in bed round the terrace, not the plan's channels.
- **The tower sweep** is not wired.
- **No sound** (cues named `elephant.*`; the elephant's sound part is silent).
- The art gate is pending owner review ([elephant art](../../../../art/sky/elephant.md)).

Code: `src/sky/creatures/deities/elephant.ts`; tests in `tests/sky-elephant.test.ts`.
