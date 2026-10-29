# Casting

How the player fires an intention: holding cast, the rhythm of fire, where the intention starts and what stops it.

Part of [intentions](README.md).

## What the player sees and feels

- You hold cast and intentions keep coming, at the rate of fire. The first one leaves at once when you press.
- Each intention leaves from in front of your eye, a little to the side and below it, so it reads as coming from your hand.
- An intention inherits half of your sideways motion. Running and casting carries the intentions forward with you; standing still, they leave along your aim.
- You cannot cast while your hands are raised after picking up a practice or a part, which lasts about a second and a half, or while an effect has muted you.
- A weapon that replaces the intention changes what cast does: see [WEAPONS.md](WEAPONS.md).

## The rule behind it

The shot is a cast of will, never a tear. The design calls the player's attack an intention, and the name is final ([DESIGN.md, section 4](README.md)). Holding cast is the simplest action for a repeated shot: the player aims, holds, and adjusts.

Code: `src/game/game.ts` (the fire action: the cooldown from the rate of fire, lines 1898-1905), `src/combat/intents.ts` (the spec and the launch, lines 11-32 and 111-150).
