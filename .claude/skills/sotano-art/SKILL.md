---
name: sotano-art
description: The art bar for SÓTANO, Vessel Light. Use it EVERY time a proposal generates or changes anything the player sees - blocks, textures, enemies and projections, bosses, items and icons, HUD, particles, lighting, colour, hands, shards, seams, animation. It applies the art guide (docs/art/ART-GUIDE.md), the binding ledger (docs/art/DECISIONS.md), the five pillars, the meaning test and the gallery gate. Also use sotano-feature (quality bar), sotano-docs and sotano-lore.
---

# SÓTANO art skill (Vessel Light)

Every visual proposal goes through this checklist before it is built. Nothing new the player sees ships without passing it. The owner's rule: *nothing is added again that does not have this finish.*

Source of truth, in order: [DECISIONS.md](../../../docs/art/DECISIONS.md) (the ledger, final numbers), [ART-GUIDE.md](../../../docs/art/ART-GUIDE.md) (the reading guide), then the feedback log below.

## 0. Who draws (owner, 2026-10-27)

**Every art element is made by a dedicated agent running Opus 5.5** (`claude-opus-5-5`, spawned with `model: "opus"`), never by the main session in passing. This covers every element the player can see: characters, projections, inhabitants, presences, bosses, blocks and scenery, textures, icons, the HUD, particles, lighting, colour and hands. The main session briefs the agent with this skill, the guide and the ledger, and reviews what comes back against the gate in §3.

## 1. Before you draw anything

1. **Name the side.** World / vessel, the player's light, or projection (ART-GUIDE §2). The side fixes colour, value and glow.
2. **Name the meaning.** One sentence in the story's voice and a `concept:` id from [CONCEPTS.md](../../../docs/lore/CONCEPTS.md). No concept means decoration: cut it or find its meaning.
3. **Name what the intention does to it.** It breaks, cracks, frees, lights or repairs; or it is a fixed point with a stated reason (bedrock, the house).
4. **Check the reserved colours.** Gold is only the light and repair. Red is only life. Cold is only the projections'. Path hues are only the player's. Skin tones are never on a projection.

## 2. Build rules (all must hold)

- **Colours come only from `palette.ts` tokens.** No hex literal in content, renderers or CSS.
- **One shading model.** Every cube is unlit and baked. No scene lights. Glow is emissive texels, halos, or the light pool.
- **16 texels per block** for everything. Creature boxes are whole texels; joints are pivots.
- **Projections:** the host room's pattern, never its value. Dark husk (body L* ≤ 14, cold rim) or pale husk (≥ host + 20 L*, ≥ 55). One family eye: a 2 × 2 `cold.white` light in a socket. A 0.4 s telegraph on three channels. A release, not a kill, with a shard. A sound that resolves.
- **Gentle:** nothing flashes faster than 3 Hz; full-screen effects obey the flash budget; the HUD never distorts to express a mood; no gore; no panic simulation on the player.
- **Paths:** always with their glyph (■ ● ◆ ▲). Pairs keep ΔE ≥ 20 under colour-blindness simulation.
- **Shape before colour.** Player shots are round; hostile shots are cubes or ✗.

## 3. The gate (before you say it is done)

1. Run the tests: `npm run typecheck && npm test` (`tests/art.test.ts` once it exists).
2. Capture it deterministically in `?gallery` (the section and the parameters) in colour, greyscale and the three colour-blindness filters, and at distance (20 blocks in fog). Attach the captures.
3. Pass the meaning test: (a) what does it stand for, (b) which side, (c) what does the intention do to it, (d) does it read with no text, (e) would someone who lives this pattern feel seen rather than mocked.
4. Check the red lines in ART-GUIDE §11: no sacred names or symbols, no mental-health imagery, no gore, no family as enemy, no copying from Minecraft, Isaac or Noita.
5. If it is a projection: write `need`, `touching`, `glyph` (unique), the four face frames and the release clip. If you cannot write the touching moment, go back to the need.
6. If the change adds or alters any text the player reads, follow [sotano-i18n](../sotano-i18n/SKILL.md).
7. Document it in the same change ([sotano-docs](../sotano-docs/SKILL.md)).

## 4. When the owner gives feedback

Append the lesson to the log below, and update the ledger if a ruling changes. Ask the owner when taste, story or scope is unclear.

## 5. Feedback log (append, newest last)

*Owner feedback:*

- **Round 1 of the art pass (2026-10-26):** the enemies have no personality, soul or meaning; the current look is a Minecraft texture pack. The fix is one system with one meaning, not prettier textures.
- **Owner decisions (2026-10-26):** the Tree of Life is the literal map of the generated world; the run seed is shown and read as an I Ching hexagram; the carried light is called **shards** (*lascas*), a nod to the Cosmere.

*Lessons from the debate (2026-10-26, not yet tested by the owner):*

- **A human silhouette breaks "patterns, never people"**: the Inner Critic read as a naked salmon man. Projections are objects and patterns, never bodies.
- **Panic's red body with green eyes fails for colour-blind players and disappears in fog**: every projection needs a value that holds against its floor.
- **Warm light is earned**: the world's glow is the player's. Projections never throw warm light; light held inside them is captive.

*Owner feedback, round 2 (2026-10-26):*

- **Review everything against the guide, fix what strays, and put the captures in the guide.** Done in ART-GUIDE §15. Lessons: (1) the gate catches real problems the eye misses (five colours in one icon, two silhouettes 98 % alike, an icon that read as the Critic's ✗); always run `tests/art-content.test.ts` and look at `?gallery`; (2) the pane must be visible for honest captures (a hidden pane returns stale frames); (3) freeze the simulation, not the renderer, when capturing a moment.
- **Zero hex outside `palette.ts` is the baseline now**: the ratchet is empty, so any new literal fails the build.
- **Dedicated art agent** (2026-10-27, owner): every art element, from characters to scenery, is made by a dedicated Opus 5.5 agent, briefed with this skill and the guide, and checked against the gate before it ships (§0).

*Owner feedback, round 3 (2026-10-27):*

- **"Several wood textures are very bad, dirt is so-so, the bombs are very ugly; brick and obsidian are very good."** Lessons: (1) wood reads from structure, not colour: frames, slats, butt joints, knots, bark crevices and end grain; flat bands in a wood ramp read as nothing; (2) vertical stripes on any tile read as boards whatever the ramp, so a stone door frame needs blocks, not grain; (3) a four-way cross of light on a cube face reads as the Critic's ✗; (4) a timer can break the 3 Hz rule unseen (the fused bomb blinked at 8 and 16 Hz): check every `Math.floor(time * k)` that toggles visibility; (5) a thing the player picks up and drops should be the same model in both states (the seed), not a model in the hand and a textured cube on the floor.
