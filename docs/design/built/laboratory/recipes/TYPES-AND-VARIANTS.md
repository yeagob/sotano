# Potion types and variants

Up: [recipes](README.md) · built (issue #259). Names and numbers are proposals the owner has not confirmed; the open questions are in [potions: open questions](../../../not-built/practices/potions/OPEN-QUESTIONS.md#potion-types-variants-and-the-echo-issue-259).

A potion is a type with variants. The type says what the potion does; the variant says how deep and how long. A bulb that no named recipe matches is no longer a Plain Tonic: it brews the variant of its type, so that mixing gives many different potions and the Plain Tonic is left for a bulb with nothing captive in it.

## How a bulb resolves

The bulb is read in four steps, and the first that answers wins. Ice is left out of every step; it still makes a potion counted in rooms last one sealed room more.

1. **A named recipe.** The nine named recipes keep their bulbs and their meaning ([recipes](README.md)). The most specific one wins, as before.
2. **A type.** If the bulb holds only flesh, it is the tonic type. If its parts all come from patterns of one path, it is that path's type. Blocks in the bulb are carried along: they never change the type or the variant.
3. **An echo.** If its parts come from patterns of two or more paths and at least one part is deeper than flesh, it brews an [Echo](ECHO-DRAUGHT.md): a potion that carries the effect of a practice for two sealed rooms.
4. **The Plain Tonic.** Only a bulb with no part at all (blocks, ice, or both) makes the Plain Tonic.

No step rolls. The same bulb makes the same potion in every run and every order, so a player can learn what a bulb makes. A test walks every bulb of one to three things (every part, the recipe materials, ice and stone) and finds that each resolves, that every potion and every echo can be brewed, and that fewer than one bulb in a thousand makes the Plain Tonic.

## The tonic type: flesh alone

Flesh only buys instant healing (the owner's rule). A bulb of flesh, of any patterns, heals more the more flesh it holds.

| Flesh | Potion | Effect |
|---|---|---|
| one | Mending Tonic | restores three quarters of a heart |
| two | Restoring Draught (the named recipe) | restores one heart |
| three | Full Restoring Draught | restores one heart and a half |

## The four path types

Each path has one type, and each type has three variants. The variant is chosen by the deepest kind of part in the bulb: a mind, a heart or an essence (flesh along with them is carried, never counted). Deeper parts are rarer (mind about 12 %, heart about 5 %, essence about 2 % of releases), so a deeper variant lasts longer and is stronger.

| Kind | Noun | Duration | Strength |
|---|---|---|---|
| mind | Tincture | 2 sealed rooms | the type's first stat, lightly |
| heart | Cordial | 3 sealed rooms | the type's first stat, strongly |
| essence | Elixir | until the next floor | the first stat strongly, and a second stat |

| Path | Type | Tincture | Cordial | Elixir |
|---|---|---|---|---|
| Body | Nimble | speed ×1.2 | speed ×1.3 | speed ×1.3, jump ×1.2 |
| Mind | Lucid | shot speed ×1.2 | shot speed ×1.3 | shot speed ×1.3, range ×1.2 |
| Emotion | Tender | luck +0.5 | luck +1 | luck +1, recovery ×1.2 |
| Will | Steadfast | damage ×1.2 | damage ×1.3 | damage ×1.3, fire rate ×1.2 |

The body moves, the mind sees far and sends straight, the emotions keep the player and bring them gifts, and the will strikes. The named recipes of each path stay the special forms of their path (the Spring Tonic for one body heart, the Ember Tonic for one will heart, the Clear Infusion for two minds of two mind patterns, and so on); the type answers the bulbs they do not.

## Examples

| Bulb | Potion |
|---|---|
| Doubt's question (a mind of a mind pattern) | Lucid Tincture |
| Doubt's question and Doubt's question | Lucid Tincture (the Clear Infusion asks for two different mind patterns) |
| Panic's captive ember (a will heart) and a stone | Steadfast Cordial (the Ember Tonic asks for the heart alone) |
| Gloom's essence | Tender Elixir |
| Impulse's crouch (a body flesh) | Mending Tonic |
| Panic's captive ember and Doubt's pause (a will heart and a mind heart) | an Echo |
| Two stones | Plain Tonic |

Code: `src/content/recipes.ts` (`FAMILIES`, `FLESH_TONICS`, `familyOf`, `resolve`), `src/content/potions.ts` (the variants). Tests: `tests/potion-variants.test.ts`, `tests/recipes.test.ts`.
