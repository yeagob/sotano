# Blocks with an effect when placed

Blocks that do something when they are placed or dropped, the design's equivalent of cards and runes.

Status: proposal

Part of [blocks (not built)](README.md).

## The design

Some blocks would have an active effect when they are placed or dropped ([DESIGN.md, section 6](README.md)):

- **TNT**: placed, it explodes after a delay.
- **Light block**: lights up dark areas.
- **Slime block**: launches the player when they jump on it.
- **Rune block**: does something strange, to be discovered.

## What the game has now

The built bomb is close to the TNT: a fused block dropped at the player's feet, which goes off after about two seconds ([built/blocks/BOMBS.md](../../built/blocks/BOMBS.md)). Nothing else in the list exists.

## Open questions

1. **TNT or the bomb.** Is TNT a second kind of bomb, or the same bomb under another name? If it is the same, the design line can be dropped.
2. **Light.** Should a light block light the dark, and how far? The art and the lighting rules decide the look.
3. **Slime.** Should a slime block launch the player, and how high? The player's jump is described in [built/player/MOVEMENT.md](../../built/player/MOVEMENT.md).
4. **Rune.** The design leaves the rune block to be discovered. Should it be a secret of the story, and if so, which one?
