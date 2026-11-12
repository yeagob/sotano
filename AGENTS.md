# The Roots: Agent Instructions

THE ROOTS is a first-person voxel roguelite about intention, practices and going deeper into the layers of the mind. It is a TypeScript game built with Three.js, Vite and Vitest.

## Start here

- [README.md](README.md) explains the game, its controls and its core ideas.
- [CLAUDE.md](CLAUDE.md) records the owner's project-wide rules and when to use each project skill.
- [docs/README.md](docs/README.md) indexes the documentation.
- [docs/design/README.md](docs/design/README.md) explains the player-facing design tree: `built/` is verified in-game; `not-built/` contains decisions and proposals.
- [docs/architecture/README.md](docs/architecture/README.md) indexes how the code works.
- [docs/design/built/story/README.md](docs/design/built/story/README.md) holds the story and naming rules.

Read the relevant documents and invoke the matching skill in `.claude/skills/` before changing a feature. Documentation is part of the change, not a follow-up.

## Project rules

- When the owner asks to create an issue, always create it on GitHub (not as a local file). Write the issue in English.
- Write repository documentation, identifiers and source player text in English; chat with the owner in their language.
- Keep design claims in the correct branch. Never describe a proposed or partially built feature as built; update the matching design document and its indexes when behavior changes.
- Follow the relevant project skills for design, levels, items, lore, art, controls, localization and production quality. Ask the owner when meaning, names or scope are unclear.
- Route player-facing text through `src/i18n/` in English and Spanish. Every random outcome must follow the seeded RNG rules in [docs/architecture/RNG.md](docs/architecture/RNG.md).
- Keep changes surgical and preserve existing behavior. Use existing project patterns and tests; do not make unrelated fixes.

## Validation

- `npm run typecheck`
- `npm test`
- `npm run sandbox -- --check` when a change can affect sandbox scenarios or item behavior.

Run the smallest relevant checks, and report what was and was not verified.
