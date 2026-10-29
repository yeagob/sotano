# The design document

The game as it is designed: what the player experiences, what it means, and what is still to come. This is a folder tree, not one file. Nobody reads it top to bottom. You open one folder and get everything about one part of the game.

The tree has two branches:

| Branch | What it holds | Index |
|---|---|---|
| `built/` | What exists in The Roots today. Every claim can be checked in the code or in play. | [built/README.md](built/README.md) |
| `not-built/` | What is decided, proposed or only an idea, and is not in the code yet. Every document starts with a status line. | [not-built/README.md](not-built/README.md) |

## How to navigate

- Each level answers one question. A branch says *is it real*. A section (a folder) says *which part of the game*. A subsystem folder says *which system*. A document says *which variant*.
- Every folder has a README with an index table. Start there.
- To give someone a small context about one part, pass them that folder's README and its documents. Nothing else is needed.
- Architecture (how the code works) is not here: it lives in [docs/architecture/](../architecture/README.md). This document describes what the player experiences and what it means.
- The story and naming rules that apply everywhere are in [built/story](built/story/README.md). Names and tone follow them.

## The rules

These rules are written down in the project skill [`sotano-design`](../../.claude/skills/sotano-design/SKILL.md). In short: a feature moves from `not-built/` to `built/` in the same commit that ships it; a document holds one variant; every claim that is built cites code or play; every open question is written down, never decided silently.
