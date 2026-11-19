# Black heart

One more heart, drawn in soot-black after the containers, lost for good once it is spent. It follows the blue heart's rules for health, and while it is held it gives off a toxic aura that hurts the projections close to the player.

Part of [kinds of heart](README.md). Issues #154 (the heart) and #178 (the aura).

## What the player sees and feels

- A heart with the red one's shape, in soot-black with a pale glint. Walking into it adds one extra heart of 100 health after the containers, even at full health.
- Hits take it before the red health, after any extra heart picked up later and before any picked up earlier (the most recently picked up extra heart first).
- When it is spent it bursts, a toast says it is gone, and it never comes back: no heal refills it.
- It is not halved by a stone heart under it, does not start the berserker frame, and does not heal over time: the blood and stone hearts keep their own rules.
- It is rare: 1 % to 2 % of heart drops, drawn per floor from the seed (see the table in [the README](README.md)).
- Its pickup toast says what it does: one more heart, lost for good once spent, and while you hold it, it hurts projections within two blocks.

## The toxic aura (#178)

While the player holds at least one black heart, a toxic aura surrounds them.

| | Rule |
|---|---|
| Reach | 2 blocks from the centre of the player's body to the centre of the projection, plus the projection's half-width (a big boss is touched by its edge). It reaches up and down as far as sideways: a sphere, not a column. |
| Damage | 3 damage points to each projection inside it, once a second (the player's intention deals 3.5 per shot). Flat: no item, stat or berserker heart scales it. No knockback. |
| What it hurts | Hostile projections, bosses included (faction `projection`). |
| What it never hurts | Blocks of any kind, loose cubes, the player, allies (projections turned to the player's side), creatures, presences (the Listener, the Gardener, and the Boundary while it is calm: once its ring is broken with the player inside, it turns hostile and the aura hurts it like any projection), a projection still materialising, and anything in the sky (sky actors take no dungeon damage). It does not destroy hostile shots. |
| How many | One aura, however many black hearts are held. |
| When it ends | The moment the last black heart is spent, and when the player dies. It starts again only with a new black heart. |
| Damage pipeline | Each touch goes through `damageActor` as `item` damage with the source `blackHeart`, so items and synergies see it as any other hit (it can release a projection, and it can split one that splits on a hit). It carries no polarity: it never converts. |

**Looks and sound** (art ruling in [DECISIONS §10.6](../../../../art/DECISIONS.md)):
- Soot motes rise slowly from a ring at the aura's edge, at the player's feet: two motes every 0.2 s, three in soot-black (`heart.black.base`) to one in paper (`bone.paper`), the heart's own look. The ring shows the reach without a drawn circle.
- Each projection the aura touches gives off a small puff of the same motes (6 soot, 2 paper) and its usual hit flash (once a second, well under the 3 Hz rule).
- A soft, low hiss (`sfxHeart.blackAura`: two band-passed noises that swell in from silence) plays once on each pulse that touches at least one projection; an empty aura is silent.

## Decisions taken without the owner

- Its meaning and story sentence are not settled. The owner should name it and confirm the look (the art ledger, DECISIONS §10.6, lists it as proposed).
- The chance range is a proposal: 1 % to 2 %, the rarest of the common kinds, rarer than blue and stone.
- The player reads it as "toxic heart" (commit 7487160, the owner's word in #178). The code keeps the identifiers "black"; the owner confirms the name.
- The aura (#178) does not break blocks: a field that eats blocks two blocks around the player would dig the floor out from under them, cut through every wall they walk past, and roll crate loot for free. Mining stays the intention's job. It hurts hostile projections only and never friendly or neutral actors, and its numbers (2 blocks, 3 points a second) are a proposal for the owner to tune.

Code: `src/entities/hearts.ts` (`LayerKind`, `isLayer`, `hasLayerRoom`, `landHit`, the aura's `TOXIC_*`, `toxic`, `toxicHits`), `src/content/tables/hearts.ts` (the chance range and the roll), `src/content/heart-art.ts` (the look and the pickup), `src/content/palette.ts` (`heart.black.*`), `src/content/hud-icons.ts` (`heartBlack`), `src/game/game.ts` (`collectHeart`, `heartLost`, `toxicAura`), `src/audio/sfx.ts` (`sfxHeart.black`, `sfxHeart.blackAura`). Tests: `tests/hearts.test.ts` (`black heart aura (#178)`).
