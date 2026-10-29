# The player (built)

The player is the one body you control: a first-person view with your hands in front of you, a walk, a jump, a swim, a set of hearts, and a hand that carries the matter you dig up. This folder describes what exists in the game today and what it means for the player. Everything here can be checked in the code, and anything that is only planned lives in [not-built/player](../../not-built/player/README.md).

Back to [built](../README.md) · [the design document](../../README.md)

| Document | Contents |
|---|---|
| [MOVEMENT.md](MOVEMENT.md) | Walking, jumping, the forgiving jump (coyote time and input buffer), ice, air control and the jump height |
| [SWIMMING.md](SWIMMING.md) | Wading, swimming, breath and drowning |
| [HEALTH.md](HEALTH.md) | Hearts, damage points and quarter hearts, invulnerability after a hit, falls, hot elements |
| [DEATH.md](DEATH.md) | Dying, the death screen, starting a new run with R |
| [HANDS.md](HANDS.md) | What your hands carry: the hand's capacity, picking things up, parts, counters that cost no hand |
| [CONTROLS.md](CONTROLS.md) | The actions the player has, in plain words; the device mapping is in the input document |

What all of these share: the view is first person, and the player's numbers are base values. Items change them through stats, so a value written here is the value without any practice in hand. The stat contract is in [the items architecture](../../../architecture/ITEMS.md); the stats that belong to intentions are in [intentions/STATS.md](../intentions/STATS.md).
