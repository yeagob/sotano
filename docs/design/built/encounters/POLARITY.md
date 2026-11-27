[Encounters](README.md)

# Intention polarity

Built, with added rules from the review. Every intention the player casts has a polarity. A good intention is attention with care and purpose; a bad one is the same force turned to wound. The player sees only good and bad, never the code's words. The toggle flips the loaded intention between the two (the key is F), and the change applies from the next intention. The default is good. Rules are in `src/combat/polarity.ts`, applied by the game loop; the review is in [docs/reviews/polarity.md](../../../reviews/polarity.md).

## The bar (owner, 2026-11-26)

Converting and killing are one value, a bar. Every hostile projection and boss has one, and it is relative to the being's own life: it runs from 0 to twice its maximum health and starts in the middle, at its maximum health (50 %).

- A **good** intention fills the bar by the hit's whole damage; a **bad** one drains it by the same amount. Every change of the shot moves it the other way at once.
- At **0** the being is released (destroyed). At **twice its maximum health** it turns to the player's side.
- So killing with harm and converting with love take the same damage: the being's maximum health, from the middle to either end. A being of 24 health falls to 7 bad hits of 3.5, or turns after 7 good ones. Before this ruling a good hit added a fifth of a separate warmth, so any projection turned after five good hits, whatever its life, while killing took its whole health.
- Harm that is not an intention (a bomb, fire, a fall into lava, a kick) drains the same bar. A shell or an armor guards against harm only: love passes them, as warmth did.
- What the code keeps in `hp` is the bar: from 0 to 2 × `maxHp` while the being is hostile. Every reading of "how much life is left" (a boss's phases, Dogma's decree, waking up, a boss's dodge after a hit) reads the distance from the middle, so love moves a fight on as much as harm does.
- Shown over every hostile projection as a small bar above its head, and for a boss as the boss bar at the top of the screen, with a mark at the middle (see [DECISIONS §14.10](../../../art/DECISIONS.md)).

## What each polarity does

| | To a projection (hostile) | To a converted projection (ally) | To a creature | To a presence |
|---|---|---|---|---|
| **Good** | Fills its bar by the whole damage. At the top it turns to the player's side, with half its maximum health, and is not destroyed. A good intention never harms a projection | Heals it: half the damage it would have done, never past its maximum | Heals it. A creature has a 7.5% chance to drop one special heart when it first grows to three times its birth size | Nothing to heal. A good intention near it lifts a silence; it does not speak differently yet |
| **Bad** | Drains its bar by the whole damage. At zero it is released | Harms it. At zero it turns hostile again, its bar back in the middle. A bad intention of the Shadow turns it at once (see [Friendly fire](#friendly-fire-issue-372)) | Harms it. At zero it flees into the blocks until the room clears. It never dies | Silences it: the presence turns its light away until a good intention passes near |

## Friendly fire (issue #372)

The owner's rule: friendly fire is everywhere. Whatever hurts reaches the player's allies too, whichever side it comes from. Code: `resolveHit` in `src/combat/polarity.ts`, applied in the one damage pipeline (`hurtEnemy` in `src/game/game.ts`).

- **A hostile intention** turns an ally hostile at once and harms it: its bar goes back to the middle, then drains by the hit's damage. Today the Shadow is the only hostile being whose attacks are intentions: its bolts, its weapon's strokes, its rings and its missile's splash. Its bolts stop on the first ally they meet, as they stop on the player.
- **Any other harm** reaches an ally as a bad intention of the player's does: a hostile projection's shot, strike or touch, the Shadow's touch, a bomb (the player's or the Shadow's), fire and lava. It harms the ally by its whole damage, and harm that would bring it to zero turns it hostile instead, its bar back in the middle. Before this rule an ally that harm brought to zero was released.
- **Good intentions** still heal an ally (half the damage, never past its maximum) and pass a healthy one.
- **What does not change.** The bar of a hostile being is the same bar: harm drains it, love fills it, at zero it is released, at the top it turns. A relapsed ally in a cleared room does not reseal it. Hostile beings still never hurt one another, and a blast still only pushes a creature. The black heart's aura still touches hostile projections only (its own rule, [BLACK](../player/hearts/BLACK.md)).
- **Tests:** `tests/friendly-fire.test.ts`.

## Blocks and weapons

- A good intention never breaks a block: it heals one that is damaged, and its cracks close.
- A bad intention breaks blocks as it always did.
- A weapon's stroke follows the same rule: a good blade or beam only heals.

## Rules that the review added

The owner's text does not state these; the review's mediator added them, and they are built:

- A good intention never harms a projection, so the route of light always ends in a conversion (with the bar this holds by construction: love only fills).
- A converted projection returns with half its maximum health. An ally that relapses starts its bar again in the middle (the bar's ruling, 2026-11-26; before, half its health).
- A beam's repeat ticks move the bar by their own damage, each tick, as a bad beam's ticks harm. A creature grows once per stroke.
- A relapsed projection in a cleared room does not reseal the room.
- A healthy ally lets good intentions pass; a bad one always hits it.

## Open questions

- **Bosses.** A good intention can convert any boss through the same bar, which ends its fight. The design gives conversion to the Threshold Guardian only. See [Fight flow](../bosses/FIGHT-FLOW.md#7-defeat).
- **Bar decay.** A projection's bar does not drift back to the middle over time (Not Yet mends only its harm side, as before). The design has no rule yet; decide whether it should.
- **Heavy projections.** With one scale for both endings, a heavy projection needs as many good hits as bad ones: Backlog (120) takes 35 hits of 3.5 either way, where five good hits turned it before. A Red tier (×2.5 health) multiplies both. The owner's playtest decides whether the hit's damage is the right step.
- **Hint.** The design asks for a hint after three good intentions in a row on the same undamaged block, saying that good intentions only heal and that the player should switch to bad ones. The build shows it (`src/game/polarity-hint.ts`); on a phone it repeats, as [intentions](../intentions/POLARITY.md) describes. Check the wording against the toast set.
- **The bad colour.** The bad intention keeps its round shape with a darker core and a cold rim. The exact colour is the owner's ruling and is awaiting it.
- **Gifts at full health.** A converted projection at full health is meant to give a gift. The gift is not built.
