# SÓTANO — instructions for Claude

- **Always use the project skills**:
  - `sotano-docs` (`.claude/skills/sotano-docs/SKILL.md`) when implementing or changing any feature, or when adding anything about the game's story, identity, metaphor or abilities. Documentation is part of the change, not a follow-up.
  - `sotano-feature` (`.claude/skills/sotano-feature/SKILL.md`) for anything the player sees, hears or feels: the production quality bar. **Self-improving**: after every round of owner feedback, append the lesson to its feedback log.
  - `sotano-items` (`.claude/skills/sotano-items/SKILL.md`) whenever items, synergies, stats or events change: how to keep items compatible, testable and safe.
  - `sotano-lore` (`.claude/skills/sotano-lore/SKILL.md`) whenever the owner shares a reference or you name/design practices, projections, places or the endgame.
  - `sotano-art` (`.claude/skills/sotano-art/SKILL.md`) **every time a proposal generates or changes anything the player sees**: blocks, textures, enemies, bosses, icons, HUD, particles, lighting, colour, hands. It applies the art guide (`docs/art/ART-GUIDE.md`) and the binding ledger (`docs/art/DECISIONS.md`). Nothing ships that does not pass its gate.
  - `sotano-i18n` (`.claude/skills/sotano-i18n/SKILL.md`) **every time any text the player can read is added, changed or removed**, anywhere (HUD, toasts, menus, index.html, items, synergies, enemies, materials, stats, damage causes): every word must exist in every shipped language (English + Spanish).
- Repo language is **English** (docs, comments, identifiers, commits, and the source text of the game). Players read the game in their language through `src/i18n/` (English and Spanish). Chat with the owner in Spanish.
- Ask the owner when anything about meaning, names, story or scope is unclear.
- Key architecture decisions go through the three-party review (engineer, architect agent, mediator agent) described in the skill.
- Docs index: [docs/README.md](docs/README.md). Story and naming rules: [docs/design/STORY.md](docs/design/STORY.md).
- Checks before committing: `npm run typecheck && npm test`.
