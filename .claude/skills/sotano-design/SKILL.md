---
name: sotano-design
description: Game design document discipline for The Roots. The design document is a folder tree, not a file, split into two branches - built (what exists and can be verified in code) and not-built (decided or proposed, not yet in code). Use it EVERY time you add, move, split or reword anything in docs/design/, when a feature gets built (its text moves from not-built to built), when a new mechanic, enemy, boss, floor, ability or story idea is designed, or when someone needs a small context about one part of the game. Also use sotano-docs (hierarchy and commit rules), sotano-lore (meaning and names) and sotano-levels or sotano-items when the subject is a room, floor or item.
---

# The Roots design document skill

The design document is **a folder**. Nobody reads it top to bottom: a reader, or an agent with a small context window, opens one folder and gets everything about one part of the game, and nothing else. Every rule below serves that: a branch says *built or not*, a section says *which part of the game*, a subsystem folder says *which system*, and a document says *which variant or facet*.

Read [docs/design/README.md](../../../docs/design/README.md) first. The architecture of the code lives in `docs/architecture/`; the design document never describes code structure, only what the player experiences and what it means.

## 1. The two branches

```
docs/design/
  README.md          The design document: what it is, the two branches, how to navigate
  built/             What exists today. Every claim here is true in the code now.
  not-built/         What is decided or proposed and is not in the code yet.
```

- **`built/`** holds only what the game does now. Each document cites where it is in code (`src/...`) or in play (a floor, a room, a key) in one line, not in every paragraph. If the code and the text disagree, the text is wrong: fix it or move it.
- **`not-built/`** holds everything else: proposals, owner decisions not yet implemented, ideas, open questions. Every document or section starts with a status line: `Status: decided` (the owner decided it, not built), `Status: proposal` (designed, awaiting the owner or a build), or `Status: idea` (brainstorm, no commitment).
- **Built is a fact, not a plan.** A feature moves from `not-built/` to `built/` in the same commit that ships it (move the text, do not copy it). A half-built feature stays in both places only as the parts that are true: the built part in `built/`, the rest in `not-built/`, each one pointing to the other.
- The two branches are never mixed inside one document. If a document has a built part and an unbuilt part, it is split.

## 2. The tree: hierarchy you can navigate by

Every level answers one question. Keep to it.

| Level | Folder or file | Answers | Example |
|---|---|---|---|
| 0 | `docs/design/README.md` | What the design is; the two branches | the root index |
| 1 | `built/`, `not-built/` | Is it real? | two branch folders with their README |
| 2 | a section folder | Which part of the game | `built/creatures/`, `not-built/sky/` |
| 3 | a subsystem folder (only when it holds more than one document) | Which system inside that part | `not-built/sky/guardians/` |
| leaf | a document | Which variant or facet | `not-built/sky/guardians/PANDA.md` |

Rules that make the tree usable:

- **A folder has a README.** One paragraph on what the subject is, a table of its documents (document, contents, status), and only what all its documents share. Nothing specific to one variant lives in the folder README.
- **Split by variant, never merge.** When a subject has variants a reader looks up one at a time (each projection, each floor, each boss, each element, each practice family), each variant gets its own document inside a folder named after the subject. Nothing about one variant lives in another's file.
- **A document says where it belongs** in its first lines: a link up to its folder's README, and its status line if it is under `not-built/`.
- **A document is readable on its own.** Someone who loads only the folder's files (its README and its documents) must get the full picture of that part. Link sideways only to define a term, to the one canonical place it is defined (naming rules: `built/story/` or `not-built/story/` as the current home of `STORY`; see §5).
- **Size is a signal.** A document over about 400 lines is probably two variants. Split it by variant, moving the text, not copying it.
- **Folder names are lowercase kebab-case; document names are UPPERCASE** (`built/elements/WATER.md`, `not-built/sky/minions/BEHAVIOUR.md`).
- **Each level is indexed by the level above.** A new document goes in its folder's README; a new folder goes in its section's README; a new section goes in its branch README and in `docs/design/README.md`; and the root [README](../../../README.md) documentation index lists the design section.

Example of a small context: "the panda guardian" is `docs/design/not-built/sky/guardians/PANDA.md`. To give that context to an agent, pass that one file, and its folder README if the document needs the shared guardian contract. Nothing else.

## 3. What a document contains

- **One sentence on what it is**, then the body. No marketing tone, no code.
- **Built documents**: how the player meets it (what they see, hear, feel, do), the owner's rule behind it, and the code location in one line. No function names, no implementation steps.
- **Not-built documents**: the status line, the design (behaviour, verbs, numbers as targets, failure and reward), the owner's words paraphrased in English and linked to the decision record, and **open questions** as a list at the end. An open question is never decided silently.
- **Behaviour specs** (creatures, bosses, minions): the player's read of the creature (its animal, its pattern), its states, its attacks as intentions the player can answer, its rules against negative intentions, and the arena's rules. Numbers are targets until a build confirms them.
- **Names** follow [STORY.md](../../../docs/design/built/story/README.md) (or its not-built counterpart) and `sotano-lore`: practices are generic technique names or public-domain works; projections are patterns; the player's shot is an **intention**, never a "tear".

## 4. Writing rules

- **English only.** Chat with the owner in Spanish; the repo is English.
- **No code comments anywhere**, and the design text does not narrate code either.
- **Positive intentions only where the owner says so.** For creatures of the sky: negative attacks do not work against them; the player wins with positive intentions. Write it as the rule, not as a list of forbidden things.
- **Model names stay out of the repository.** A design may assign work to "an agent on the Opus tier" or "a design agent"; no model version identifiers in documents.
- **Links are relative** and must resolve (link check in `sotano-docs` §5).

## 5. Where the naming and story rules live

The story and naming rules are in force in the design tree wherever they are written: they live in the `story` section of the tree (today `docs/design/built/story/` for what is in force, and `docs/design/not-built/story/` for the endgame, heaven and the sky). When the two disagree, the naming rules win for names and tone, and the mechanics document wins for numbers and behaviour. A new name must pass `sotano-lore` first.

## 6. Working on the design

1. **Find the place**: which branch, which section, which subsystem, which variant. If there is no folder for it, make one with a README, and index it.
2. **Check what the code says** (for `built/`) or **what the owner decided** (for `not-built/`). Read the code only to confirm; never invent a built claim.
3. **Ask the owner** (AskUserQuestion) when a meaning, a name, a story point or the scope is unclear. Offer a recommended option first. Small mechanical defaults do not need a question: pick, and say so.
4. **Write the document** under the rules of §2–§4. Update every index above it.
5. **Feature shipped?** Move the text from `not-built/` to `built/` in the same commit, leave a pointer in the old place if the not-built text still has open parts.
6. **Behaviour work for a design agent**: a not-built document may carry an *Assignment* section (who, which tier, which inputs to read, what to produce, where the result goes). The assignment is documentation; the agent is not run from the design tree.

## 7. Before you commit

- [ ] Every document sits in one branch and one folder with a README; its first lines link up.
- [ ] Built claims cite code or play; nothing in `built/` is only planned.
- [ ] Not-built documents carry a status line and list their open questions.
- [ ] Each folder README indexes its documents; each branch README indexes its sections; `docs/design/README.md` lists the branches.
- [ ] Root README documentation index and `docs/README.md` still list the design section.
- [ ] English only; no code comments; no model identifiers.
- [ ] Link check passes (`sotano-docs` §5), and `npm run typecheck && npm test` pass.
