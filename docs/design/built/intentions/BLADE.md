# The blade

The blade is a cut of light in front of the player, from the practice Cut Ties with Toxic People. It sweeps through a cone and cuts what is in it, beside the intentions.

Part of [intentions](README.md) · see also [WEAPONS.md](WEAPONS.md).

## What the player sees and feels

- Hold cast and the blade swings in front of you, with a cut of light that shows the cone it covers. It swings at four-fifths of the fire rate, and the intentions keep flying beside it.
- Every breakable block in the cone is cut loose: it falls as a loose cube, the same as a block that was broken. The first sixteen blocks a swing cuts fall as cubes; the rest are gone.
- Every hostile projection in the cone takes three times the damage of an intention.
- Every hostile projectile in the cone is destroyed.
- Loose cubes in the cone, the rubble it has just cut, are sliced in two along the stroke. The halves fly apart and shrink away. At most twenty-four are sliced per swing.
- A positive blade mends. It restores every damaged block in its cone to full, never breaks one, and warms projections the way a positive intention does.
- A blade cut is not an intention. Items that act on intention hits do not act on it.

## The rule behind it

The blade "cuts every block in reach, projections and their projectiles" and the intentions keep flying beside it ([DESIGN.md, section "Weapons that replace the intention"](WEAPONS.md)). The blade is the weapon that makes the shot a choice: you can cut and shoot at once.

Code: `src/combat/weapons.ts` (the blade, its cone and its swing, lines 74-140), `src/game/game.ts` (the strike, its loose-cube budget and the slicing, lines 712-770; the cut's block rule, lines 720-730).
