# Dr. Launcher

Up: [Miracles folder](README.md) · [all practices](../README.md) · [built design](../../README.md)

| | |
|---|---|
| Path | Miracles; also none |
| Quality | 3 of 4 |
| Found in | treasure rooms |
| Inspired by | Transcending limits (Santiago Dopazo, the owner's line) |
| Code | `src/content/items/drlauncher.ts` (the `missile` stat); the missile in `src/combat/missiles.ts` and `Game.tapMissile`, `launchMissile`, `loveBlast` |

## What it means

There is nothing impossible: a limit is only the edge of what you have tried. A thrown bomb falls under its own weight. The missile keeps its line and does not fall: the limit of the throw does not bind it. It keeps the bomb's blast.

## What it does

A quick double tap of the fire control launches one carried bomb as a missile instead of an intention.

- **The double tap.** The first press fires its intention at once, as always. A second press within 0.3 seconds launches the missile and does not also cast while it is held. Without this practice a double tap is two intentions.
- **One missile, one bomb.** Each missile spends one bomb from the counter. With no bomb, nothing is launched: the player hears the denied sound and reads "No bombs".
- **Room to arm.** A missile flies 2 blocks before it can explode. A launch with a block closer than that along the aim is refused with the denied sound, and no bomb is spent.
- **A rocket, not a thrown bomb.** It leaves from the eye along the aim, at 8 blocks per second, speeds up to 24 blocks per second over about four blocks, and holds a straight line. It does not fall, roll or bounce, and nothing pushes it.
- **It ends on the first thing it meets**: a block, a projection, a creature, an ally or a loose bomb; or in the air after 40 blocks.
- **Negative polarity: the bomb's blast.** The same blast a bomb makes, scaled by the same bomb stats: blocks broken in a sphere about two and a half blocks across, loose cubes thrown, bombs in range set off, and a heart of damage to every actor in range, the player included. A missile fired at a wall next to you can hurt you.
- **Positive polarity: the love explosion.** The same sphere, but everything in it is touched as a positive intention touches it, with the blast's own damage as the amount. Damaged blocks are mended and none breaks; allies are healed by half; hostile projections are warmed toward your side and take half damage, never the last point; creatures grow, as a warm love shot grows them. It never hurts the player, sets off no bomb and throws no cube. It sounds like a soft swell and a rising chord instead of a boom.

The practice does not replace the intention: intentions keep flying on every single press, as they do beside the blade of [Cut Ties with Toxic Relationships](../mind/CUT-TIES-WITH-TOXIC-RELATIONSHIPS.md).

## Controls

| Device | The double tap |
|---|---|
| Keyboard and mouse | A quick double click of the left button (counts only while the pointer is locked) |
| Gamepad | A quick double press of RT |
| Touch | A quick double tap on the bead of light |

The first time the practice is held in a run, a toast names the gesture of the device in use. The rule is in the [input design](../../../../architecture/input/README.md).

## Stats and events

- the `missile` stat: 1 turns the double tap on (the stats panel reads "double tap")
- `missileLaunch`: an item can change the missile's speed, range or polarity, or cancel it (no bomb is spent)
- the negative blast is an `explosion` with source `missile`; the death screen names this practice
- the blast reads `bombRadius` and `bombDamage`, so whatever grows the bomb grows the missile

## Owner decisions (issue #89, 2026-11-02)

The owner answered the proposal of issue #59 in issue #89, and the open points while it was built. Paraphrased in English unless quoted:

1. Tier 3, a practice, found in treasure rooms.
2. The lore concept is transcending limits, the owner's own line, credited to Santiago Dopazo: "No hay nada imposible...". *Dr. Stone* is credited in the lore notes only, as the citation "Let's go to the moon" ([SOURCES](../../../../lore/SOURCES.md), `dr-stone`); it is never in-game text.
3. Only the quick double tap fires the missile; a single tap fires its intention.
4. Keyboard: a double click of the left button. Gamepad: a double press of RT. Touch: a double tap on the bead, returned for this practice only ([TOUCH](../../../../architecture/input/TOUCH.md) §7).
5. Explosions hurt the player, with no immunity. The blast is the bomb's.
6. Polarity changes the missile: positive is the love explosion, negative is the bomb blast.
7. The love explosion has the bomb's radius, and heals and grows each element in it as a positive intention would, with the bomb's damage as the amount.
8. The arming refusal is kept, to be tested in play.
9. Synergies: only with bombs (none built yet).
10. The path is **Miracles**, a new path, placed first. The name is **Dr. Launcher**: the owner judges "Dr." too loose a reference to count as a third-party name, a deliberate exception to the naming rule ([NAMING](../../story/NAMING.md)).

## Synergies and states of being

- None yet. Miracles has no state of being: it needs three practices of its path, and this is the first.

## Open questions

- The speed, the range and the arming distance are the owner's to test in a build.
- The love explosion does not emit the `explosion` event, so an item that resizes explosions resizes only the negative missile. Whether it should reach the love explosion too is open.
- "Miracles" is a word central to *A Course in Miracles* ([SOURCES](../../../../lore/SOURCES.md), Caution); the owner chose it knowingly.
