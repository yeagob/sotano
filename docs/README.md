# The Roots documentation

Everything about the game, organised in five sections. Each section has its own README with an index of what it contains.

| Section | What's in it |
|---|---|
| [design/](design/README.md) | The game design document, a folder tree in two branches: [built/](design/built/README.md) (what exists) and [not-built/](design/not-built/README.md) (decided or proposed). Pillars, mechanics, story, metaphor, enemies, bosses, levels and practices (items) from the player's side |
| [architecture/](architecture/README.md) | How the code works today: overview, items and synergies, rooms and floors, entities |
| [research/](research/README.md) | Research into how Isaac and Noita are built, the target technical architecture, budgets, IP notes and the roadmap |
| [art/](art/README.md) | Art direction "Vessel Light": the art guide (every visual element, its colours, proportions and rules), the binding decision ledger from the debate, and the presentation |
| [lore/](lore/README.md) | References and lore: the source library (books, traditions, techniques, therapies, games) with naming status, the concept glossary, and the cosmology (as above, so below) |
| [reviews/](reviews/README.md) | Architecture reviews (engineer, architect, mediator): critiques, rulings and what changed |
| [process/](process/README.md) | How the project is built and released: GitFlow branches, versions, issues, releases and hotfixes |

## Rules for these docs

- **English only**, docs and code comments alike.
- Every change that adds or changes behaviour updates the matching doc **in the same commit**.
- Every new document is listed in its section README, and every new section in this file and in the root [README](../README.md).
- How to do all of this is written down as project skills: [`sotano-docs`](../.claude/skills/sotano-docs/SKILL.md) (documentation), [`sotano-feature`](../.claude/skills/sotano-feature/SKILL.md) (production quality bar, self-improving feedback log), [`sotano-items`](../.claude/skills/sotano-items/SKILL.md) (safe, compatible items), [`sotano-lore`](../.claude/skills/sotano-lore/SKILL.md) (references, concepts, cosmology), [`sotano-i18n`](../.claude/skills/sotano-i18n/SKILL.md) (localization: every player-facing text in every language), [`sotano-art`](../.claude/skills/sotano-art/SKILL.md) (the art bar: every visual proposal passes the guide and its gate), [`sotano-controls`](../.claude/skills/sotano-controls/SKILL.md) (every action mapped on keyboard and mouse, gamepad and touch).
