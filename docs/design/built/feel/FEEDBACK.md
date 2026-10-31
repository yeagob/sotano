# Feedback and gentleness

Up: [built feel](README.md)

The game is meant to be gentle. A hit is felt, a hurt is seen, and nothing flashes, blinks or rumbles beyond what the player needs. These are the rules as built, with the numbers, and where each one lives. The owner's rules are the production bar in the [sotano-feature](../../../../.claude/skills/sotano-feature/SKILL.md) skill, and the art guide sets the same limits (section 10.4).

## Flashes and the budget

- **Flash budget.** A full-screen flash, such as a pickup's glow, never retriggers within 333 milliseconds. A flash that is too close to the last one is dropped. Code: `src/game/hud.ts`.
- **Item flash.** A pickup's flash peaks at 45% opacity and fades over half a second.
- **Hurt vignette.** When you are hit, a dark vignette peaks at 35% opacity and fades over 0.4 seconds.

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

The tutorial lives in the world, never in an overlay. Each lesson room of the roots has two stone tablets, on its north and south walls beside the doors, so the player reads them whichever way they come in. There are twelve lessons: move, intention, polarity, step, kick, pit, bridge, bomb, water, practice, down and carry. The text is drawn in the player's language and redrawn when the language changes. Code: `src/render/tablets.ts`.

## Open questions

- None recorded for feedback as built. The settings that would let the player change the shake, the flashes and the motion are not built ([ART-NOT-BUILT](../../not-built/feel/ART-NOT-BUILT.md)).
