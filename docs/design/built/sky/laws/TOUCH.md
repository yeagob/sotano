# How intentions reach sky creatures (law 3.3, built)

Up: [The laws of the sky (built)](README.md)

Every intention, weapon stroke and blast that meets a sky creature reaches it, and only a positive one changes anything.

## What the player sees and feels

- **A shot or a stroke** (an intention, the blade, the beam, the great cut) that touches a deity or a minion lands at its body. A positive one is one positive hit: a gold mark where it landed and the animal's own sign of progress ([guardians](../guardians/README.md)). A beam counts once per stroke, not once per tick.
- **A negative touch is a puff**: a small pale cloud, and nothing changes: no hit, no harm, no change of side. The first puff of a run shows the toast "Only a good intention lands here. The rest puffs away." once.
- **A blast** gives every sky creature in its reach one touch. A negative blast (a black bomb, a negative missile) is one puff on each. A **love explosion** (a white bomb or a positive missile, [BOMBS](../../blocks/BOMBS.md)) is one warm positive touch on each creature in its sphere, whatever its radius.
- **A missile** that meets a deity stops at it. A negative missile goes off as a bomb (one puff); a positive one is the love explosion alone, with no direct hit as well ([Dr. Launcher](../../practices/milagros/DR-LAUNCHER.md)).
- A creature that has left its floor (parked) is not touched by anything.
- Nothing a touch does takes health from a sky creature: they have none that can reach zero ([NO-HARM](NO-HARM.md)).

## The rule

Negative intentions do not work on sky creatures; they are won with positive intentions only (owner). The puff is the feedback that teaches it.

## Not built

- **Thrown cubes** do not reach sky creatures yet: a kicked or thrown cube passes them by.
- **The puff's sound.** The soft "pff" is named but silent: the sky's core sounds are not synthesised yet.
- **The Spiked Entity** is not routed yet (it is the endgame's, not the sky's).

Code: `src/combat/touch-router.ts` (the router), `src/sky/creatures/puff.ts` (the puff and its toast), `src/sky/creatures/system.ts` (`SkyCreatures`, the provider); the seams in `src/game/game.ts` are listed in [SKY.md](../../../../architecture/SKY.md) section 5.7. Tests: `tests/touch-router.test.ts`, `tests/game-realm-passage.test.ts`.
