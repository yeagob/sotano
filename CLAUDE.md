# The Roots — instructions for Claude

- **Always use the project skills**:
  - `sotano-docs` (`.claude/skills/sotano-docs/SKILL.md`) when implementing or changing any feature, or when adding anything about the game's story, identity, metaphor or abilities. Documentation is part of the change, not a follow-up.
  - `sotano-design` (`.claude/skills/sotano-design/SKILL.md`) for the game design document in `docs/design/`: a folder tree split into `built/` (what exists) and `not-built/` (what is decided or proposed). Use it whenever design text is added, moved or split, and when a feature ships and its text moves to `built/`.
  - `sotano-feature` (`.claude/skills/sotano-feature/SKILL.md`) for anything the player sees, hears or feels: the production quality bar. **Self-improving**: after every round of owner feedback, append the lesson to its feedback log.
  - `sotano-items` (`.claude/skills/sotano-items/SKILL.md`) whenever items, synergies, stats or events change: how to keep items compatible, testable and safe.
  - `sotano-lore` (`.claude/skills/sotano-lore/SKILL.md`) whenever the owner shares a reference or you name/design practices, projections, places or the endgame.
  - `sotano-art` (`.claude/skills/sotano-art/SKILL.md`) **every time a proposal generates or changes anything the player sees**: blocks, textures, enemies, bosses, icons, HUD, particles, lighting, colour, hands. It applies the art guide (`docs/art/ART-GUIDE.md`) and the binding ledger (`docs/art/DECISIONS.md`). Nothing ships that does not pass its gate.
  - `sotano-levels` (`.claude/skills/sotano-levels/SKILL.md`) **every time a room, a floor type, a floor's depth or theme, or the world's vertical layout changes**: the thirteen floors, room templates with height and elements, and the rules that keep every room inside its band.
  - `sotano-i18n` (`.claude/skills/sotano-i18n/SKILL.md`) **every time any text the player can read is added, changed or removed**, anywhere (HUD, toasts, menus, index.html, items, synergies, enemies, materials, stats, damage causes): every word must exist in every shipped language (English + Spanish).
- `sotano-controls` (`.claude/skills/sotano-controls/SKILL.md`) **every time a control is added, changed or removed**, including any new verb from an item, synergy, weapon or effect: every action is mapped on keyboard and mouse, gamepad and touch, following Minecraft, Noita and The Binding of Isaac.
- Repo language is **English** (docs, comments, identifiers, commits, and the source text of the game). Players read the game in their language through `src/i18n/` (English and Spanish). Chat with the owner in Spanish.
- Ask the owner when anything about meaning, names, story or scope is unclear.
- Key architecture decisions go through the three-party review (engineer, architect agent, mediator agent) described in the skill.
- Docs index: [docs/README.md](docs/README.md). Design document: [docs/design/README.md](docs/design/README.md). Story and naming rules: [docs/design/built/story/README.md](docs/design/built/story/README.md).
- Checks before committing: `npm run typecheck && npm test`.
