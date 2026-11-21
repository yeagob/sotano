# Feedback and gentleness

Up: [built feel](README.md)

The game is meant to be gentle. A hit is felt, a hurt is seen, and nothing flashes, blinks or rumbles beyond what the player needs. These are the rules as built, with the numbers, and where each one lives. The owner's rules are the production bar in the [sotano-feature](../../../../.claude/skills/sotano-feature/SKILL.md) skill, and the art guide sets the same limits (section 10.4).

## Flashes and the budget

- **Flash budget.** A full-screen flash, such as a pickup's glow, never retriggers within 333 milliseconds. A flash that is too close to the last one is dropped. Code: `src/game/hud.ts`.
- **Item flash.** A pickup's flash peaks at 45% opacity and fades over half a second.
- **Hurt vignette.** When you are hit, a dark vignette peaks at 35% opacity and fades over 0.4 seconds.
- **Where the hit came from.** When the hit has a source, the vignette is not a ring but a glow on the screen edge on the source's side, in the same colour (`life.dark`), the same peak and the same 0.4 seconds: ahead is the top edge, behind is the bottom, left and right are their edges, and the angles between slide along the frame to the corners. The glow is a circle of 35% of the screen's longer side, centred on the edge, so it never covers more than about a third of the screen and fades to nothing. A hit with no source keeps the ring on every edge. Code: `src/game/hurt-feedback.ts` (`hurtAngle`, `hurtEdge`), `Hud.hurt` in `src/game/hud.ts`, `#hurt-side` in `index.html`.

## Knockback on a hit

A hit that lands moves you a little, as in Minecraft: you see and feel that you were struck and from where. It never changes the damage, the invulnerability window or the hearts. Code: `hurtKnock` in `src/game/hurt-feedback.ts`, `Game.hurtFeedback` in `src/game/game.ts`.

- **From a source,** you are pushed away from it at 4 blocks a second along the ground, with a hop of 4.5 blocks a second (about a third of a block high). The source is the projection that touched you, the centre of a blast, the path of a hostile shot, the centre of a ring or a field, the nearest point of a line attack (its start when you stand on the line), the wall of a sweep behind its front, or the side of the fire or lava cells around you.
- **With no source** (drowning, a toll, a practice, the console), you hop straight up, and if you were walking you flinch back along the way you came at 1.5 blocks a second. Standing in the middle of a pool of fire or lava is the same: the hot cells are all around, so there is no side.
- **Once per hit.** The knockback only comes with a hit that lands, so the invulnerability window paces it: a burn or a contact can never chain into a launch. The hop never adds to a body already rising faster than the hop.
- **Never into harm.** A push from safe ground towards fire or lava loses its sideways part and is only the hop. From inside fire or lava, the push leads away from the hot side, towards the edge.
- **Swimming** (head under water) halves the knockback. A dash, which is invulnerable, takes none, and a body being carried ignores it.
- **Practices can change it.** For the player, `actorDamage`'s `knockback` is a multiplier of this knockback (1 by default; 0 takes it away).

## The sound of a hit

The hurt sound is the old square drop and noise, with a slight pitch variation and a low thump under it for the knock. When the hit has a source, the sound is panned towards its side (at most 60% to one ear). Code: `sfx3.hurt` in `src/audio/sfx.ts`.

## Hearts

- **The last heart beats.** When one heart or less is left, the last heart beats at about 1.1 times a second (a 0.9 second cycle), gently scaling up and down.
- **Invulnerable hearts are steady.** While you cannot be hurt, the hearts stop, and they are outlined. They never blink.
- **The last breath bubble beats** (0.7 second cycle) when two or fewer bubbles are left.

## Shake and rumble

- **Shake.** A hit shakes the screen for 0.2 seconds. The shake's amount is capped, so it never throws the view around.
- **Rumble.** Gamepads rumble for up to 400 milliseconds, stronger for a longer shake, with the dual-motor effect where the browser offers it. Code: `src/game/hud.ts` (the rumble on a shake) and `src/input/input.ts`.

## Information stays

- **Banners stay until the player clicks.** A pickup's banner is information, and information is never on a timer. The player dismisses it.
- **Toasts** last 2.5 seconds and are the only timed text.

## Motion

- **Reduced motion.** The banner's entrance and the fade are switched off when the player asks for reduced motion in the system settings. The settings page itself is not built.
- **Death.** The death screen fades in over 1.2 seconds.

## The lessons in stone

The tutorial lives in the world, never in an overlay. Each room of the roots has two panels of carved stone, on its north and south walls beside the doors, so the player reads them whichever way they come in. The panels are the Roots' book: six tutorial pages, then the book's own pages, and the page the walls show changes as the player walks the ring ([the Roots' book](../levels/roots/README.md)). The text is drawn in the player's language and redrawn when the language changes. Code: `src/render/tablets.ts`.

## Open questions

- None recorded for feedback as built. The settings that would let the player change the shake, the flashes and the motion are not built ([ART-NOT-BUILT](../../not-built/feel/ART-NOT-BUILT.md)).
