# The tree's bark and leaves

Up: [giant tree](README.md) · Status: built (issue #12).

The tree is not one wood from root to crown. Its bark changes as you climb, its limbs have their own bark, and its crown has old and young leaves, so no two parts of the climb look the same and you can tell how high you are from the wall beside you.

## The bark by height

| Band | Stories | Bark | What it looks like | What it stands for |
|---|---|---|---|---|
| The foot | roots | **Root bark** | dark, damp, gnarled: wide crevices that twist as they climb, moss in the damp | what holds on below, where it all began |
| The middle | rings, galleries | **Living wood** | the warm brown bark of the tree, straight crevices, a little moss | the tree that holds the world |
| High up | hollows, branches | **Old bark** | lichen grey, weathered: wide flat ridges, deep furrows that fork and die out, pale lichen | what the years weathered and did not break |

- **The seam is ragged.** In the lowest four rows of a story, the bark of the story below comes through in patches, fewer the higher you go, so a change of bark is a seam of patches and never a straight line.
- **The wood inside is one.** Every bark shows the same end grain on its top and bottom, so the floors and ceilings of every story are the same wood: only the skin changes with age.
- **The stair is living wood all the way.** The spiral stairs keep the living wood from the roots to the crown, one thread through every band.
- **Same seed, same bark.** The patches come from the run's seed: a run grows the same tree every time it is replayed, and another seed grows other patches.

## The limbs: boughs

The limbs that leave the trunk in the branch story and the limbs of the crown are **boughs**, and the deck under the crown is where the old bark gives way to them: paler, warmer, smooth bark in long plates with small dashes across them, the mark of a branch and never of a trunk. A bough is bark on every face, top included, because you walk along a limb, not across its cut end.

## The crown: old and young leaves

The leaves have their own deep green, no longer the grass's. Through the crown, patches of **young leaves** (a fresh, lighter green, open to the light) break up the old ones, more of them towards the top of the crown. The hanging strands of the galleries and the balls at the tips of the limbs are the old leaves.

## Everything else is the same

The new barks are as tough as living wood (tier 1, 14 points, armour 0.5) and young leaves as leaves (tier 0, 2 points); all of them burn. Only the look changes with height.

Code: `src/world/tree.ts` (which bark and which leaves at a cell), `src/content/materials.ts` and `src/content/palette.ts` (the materials and their colours), `src/render/atlas.ts` (their patterns), `src/content/tiles.ts` (the end grain). Art recipes: [DECISIONS §6.2](../../../../art/DECISIONS.md).
