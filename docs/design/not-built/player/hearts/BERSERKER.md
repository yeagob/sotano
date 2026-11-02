# Berserker heart

A heart whose loss starts a timed fighting state: the player hits harder, moves faster, jumps higher, breaks loose blocks by walking over them, and sends back projectiles that are about to hit.

Status: decided (owner). Not built.

Part of [the hearts (not built)](README.md).

## The design

When the Berserker heart is lost, the player enters Berserker mode for 30 seconds. During the mode:

- **Damage** is multiplied by 1.5.
- **Speed** is multiplied by 1.5.
- **Jump height** is multiplied by 1.5.
- **Loose blocks break underfoot.** A block that touches the rest of the world by a single face (a block sitting alone on a surface, joined by one side) breaks when the player passes over it.
- **Projectiles come back.** If the player fires at the moment a projectile would hit them, the shot returns the projectile.

The mode can also be started by a potion. Items may name the mode and react to it. Any item or synergy that reads or starts the mode uses the same 30-second state; it does not define its own.

## Open questions

1. **Pickup effect.** The owner did not say what the Berserker heart gives on pickup. Health amount, if any, is open.
2. **Look.** The owner did not describe the art of the Berserker heart. Art follows [the art guide](../../../../art/ART-GUIDE.md) and needs the owner's word first.
3. **Reading of the block and projectile rules.** The owner's sentences put these two abilities in the same paragraph as the mode, and this document reads them as part of the mode (they end when the mode ends). Confirm: are they part of the mode, or permanent once the heart has been lost?
4. **Restarting the mode.** If the player loses a second Berserker heart, or a potion starts the mode, while the mode is active, does the 30-second timer reset, or does nothing happen?
5. **Rounding.** Damage multiplied by 1.5 gives fractions. Round down, as with the stone heart, or round up?
6. **Projectile reflection.** Which way does a returned projectile go, and does it damage what it hits?
7. **Potion.** Which potion starts the mode, and which of its parts supplies it? See [the potions](../../practices/potions/README.md).
