# SÓTANO — instructions for Claude

- **Always use the project skills**:
  - `sotano-docs` (`.claude/skills/sotano-docs/SKILL.md`) when implementing or changing any feature, or when adding anything about the game's story, identity, metaphor or abilities. Documentation is part of the change, not a follow-up.
  - `sotano-feature` (`.claude/skills/sotano-feature/SKILL.md`) for anything the player sees, hears or feels: the production quality bar. **Self-improving**: after every round of owner feedback, append the lesson to its feedback log.
  - `sotano-items` (`.claude/skills/sotano-items/SKILL.md`) whenever items, synergies, stats or events change: how to keep items compatible, testable and safe.
- Repo language is **English** (docs, comments, identifiers, commits, in-game text). Chat with the owner in Spanish.
- Ask the owner when anything about meaning, names, story or scope is unclear.
- Key architecture decisions go through the three-party review (engineer, architect agent, mediator agent) described in the skill.
- Docs index: [docs/README.md](docs/README.md). Story and naming rules: [docs/design/STORY.md](docs/design/STORY.md).
- Checks before committing: `npm run typecheck && npm test`.
