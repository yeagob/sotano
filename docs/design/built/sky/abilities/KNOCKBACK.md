# Knockback (built)

Up: [Abilities (built)](README.md) · [The sky (built)](../README.md)

A kick: an arc on the floor, shown first, then one shove along it that moves the player and never hurts them.

Status: built (H0). The numbers are provisional; the deities use it through their attacks ([guardians](../guardians/README.md)); what is not built is in [not-built](../../../not-built/sky/abilities/KNOCKBACK.md).

## What the player sees and feels

- **The warning.** For the full warning (never shorter than 0.8 s) a dashed arc lies on the floor at the source: a ring around it, a straight line, or a fan of five rays (a cone). Dust motes rise along it in the wood's dark tones. The kick is never a surprise: the arc is there before the push.
- **The push.** When the warning ends, a player standing in the arc is shoved once: sideways along the arc, and up. The shove is a single impulse, and the player's own gravity takes it into an arc.
- **The live marks.** The arc turns solid for 0.6 s, at twice the size of the dashes, then is gone.

The sound and the camera lean of a kick are not built here: the deities' sounds are named but silent (only the lion's play, as placeholders), and the camera does not lean.

## The rule

1. A kick is one push, given when its warning ends. A player outside the arc is not pushed.
2. The arc is the reach. A ring reaches what is within its radius of the source. A line reaches what lies along its aim within its length and within a narrow half width of its centre. A cone reaches what lies within its radius and within 40 degrees of its aim.
3. The push goes away from the source in a ring, and along the aim in a line and a cone.
4. A solid block between the source and the player stops the kick. A player-made block counts as well.
5. Nothing in the kick takes the player's health, spirit or a practice.

## How the player answers it

- **Step out of the arc.** Standing outside the reach is safe.
- **Build a wall.** A block between the source and the player stops the kick, and it stays.
- **A positive shot at the source.** A warm positive touch within three blocks of the source, during the warning, softens the kick to 0.4 of its push (provisional).

Code: `src/sky/hindrances/knockback.ts` (with `runner.ts` and `effects.ts`).
