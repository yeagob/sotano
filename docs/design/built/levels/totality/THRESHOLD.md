# The entrance to the Sun

Up: [Totality](README.md) · the place where the climb reaches the Sun in this build.

Past the last checkpoint the Sun stands in the air ahead, centred at the checkpoint's height. Its volume is a sphere 30 blocks across, and its near surface lies four blocks past the checkpoint's far edge, so the last jump of the climb reaches it. When the player's body enters that sphere on a jump begun on the last checkpoint, the entrance is taken once: the realm records it, which activates the last layer, Unity (issue #95, pending). Unity does nothing yet. Entering shows no words and changes nothing else. A low hum comes from the Sun while the player is within ten blocks of its surface. Walking off the last checkpoint, or a jump from any other platform, does not enter the Sun. Nothing is sealed and nothing is refused: the wall of light that closed the climb is gone.

Decided by the owner on 2026-11-05, replacing the closed threshold of 2026-11-03: the last jump enters the Sun; entering activates the last layer, Unity (pending, issue #95), which does nothing yet. The 107 hops stay as they are.

The entrance is not saved: the flag lives in the running realm only. The platforms, the Earth and the Sun's view are in code; the realm runs the entrance each frame.

Code: `src/sky/totality/threshold.ts` (the jump's entrance and the hum), the Sun's volume in `src/sky/totality/chain.ts` (`SUN_RADIUS`, `SUN_GAP`), the realm's flag and the verb `enterUnity` in `src/sky/sky-realm.ts` and `src/game/game.ts`, the hum in `src/audio/sky/totality.ts`.
