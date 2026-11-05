# Bombs

The bomb is a fused block the player drops at their feet. It is a loose cube with a fuse: it rolls, can be kicked and pushed, and goes off after a fixed time with a blast that breaks blocks and hurts anything nearby, the player included.

Part of [blocks](README.md).

## What the player sees and feels

- The bomb action drops a bomb at your feet, a cube with a fuse that rolls a little forward with your motion. The fuse lasts about two seconds.
- Without a bomb in your counters, the action is refused with a short message.
- When the fuse ends, the bomb blasts a sphere about two and a half blocks across. Blocks at the centre take forty points of damage before armour, and the damage falls off toward the edge, down to half at the edge.
- Loose cubes in the blast are thrown outward. Chests and bedrock are not hurt.
- Anything in range is hurt, the player included. Your own blast costs you a full heart unless an item says otherwise.
- A bomb caught in another blast goes off almost at once, so a row of bombs chains.
- You cannot pick up a bomb. Walking into one kicks it. Intentions push a bomb and do not set it off. Blasts set off bombs in their range.
- You start a run with one bomb. Bombs are found in rooms and taken from rewards, and you can carry up to ninety-nine.
- **White and black bombs.** A bomb you drop while your polarity is positive is **white**: a pale seed with hot white seams, gold lip ends and branches, and a white halo. A bomb you drop while it is negative is the **black** breakthrough, and its fuse ends in the blast above. Changing polarity later does not change a bomb that is already placed.
- **A white bomb ends in a love explosion**, the same sphere as the blast but touched as a positive intention touches it. The blocks in it are mended and none breaks; nothing is thrown; it never hurts the player; a hostile projection in it takes the positive share of the damage (half, as any positive intention deals), and an ally in it is healed; no other bomb goes off; a love explosion leaves doors alone. The love explosion is the one of [Dr. Launcher](../practices/milagros/DR-LAUNCHER.md).
- A white bomb caught in a negative blast goes off almost at once, as a love explosion.

## The white bomb's rule

**Owner decision (2026-11-05, provisional: the owner may change it).** The polarity is captured when the bomb is dropped and kept with it, so a white bomb stays white. The rule holds in the dungeon and in the sky. A free slot forgets its polarity when it is reused, so a new bomb never inherits one. The seed's look is in [DECISIONS §7.8](../../../art/DECISIONS.md) (the husk, the seams and the halo of each polarity).

## The rule behind it

The design says bombs are loose cubes too: you can kick them, enemies and intentions push them, and a bomb is set off by its fuse or a blast ([DESIGN.md, section 6](README.md)). The built rules follow that, with the two differences in the open questions below.

Code: `src/game/game.ts` (placing a bomb, lines 1731-1747; the fuse and the blast, lines 415-421 and 1434-1466), `src/physics/debris.ts` (a bomb is a cube with a fuse, line 83; a bomb is only pushed by a hit, lines 137-146), `src/core/stats.ts` (the bomb radius and damage, lines 46-47). The white bomb: the `love` flag of `DebrisSystem` (`src/physics/debris.ts`), set in `Game.placeBomb` and read in `Game.newDebris` (`onFuse`); the white seed is `LOOKS` in `src/render/seed-model.ts`.

## Open questions

1. **An intention hit sets a bomb off.** The design says an intention hit sets a bomb off at once ([DESIGN.md, section 6](README.md)). The code only pushes a bomb on a hit; the fuse or another blast sets it off (`src/physics/debris.ts`, lines 137-146). Which one does the owner want? Pushing is the built rule.
2. **Enemies push bombs.** The design says enemies shove the loose blocks and bombs they walk into ([DESIGN.md, section 6](README.md)). The code's enemy push skips bombs entirely, so only the player's kicks and the blasts move them. Should enemies move bombs?
3. **The word.** The counters and the messages say bomb; the material is called breakthrough, the first lesson is titled Breakthroughs, and the death screen says your own breakthrough. The design says bomb. Which word should the player see? The naming rules in the story document decide this.
