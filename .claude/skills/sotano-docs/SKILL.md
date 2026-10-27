---
name: sotano-docs
description: Documentation discipline for SÓTANO. Use it EVERY time you implement or change a feature, add or rename an item, enemy, room template, material, stat or event, or add anything about the game's story, identity, metaphor, characters or abilities (items/practices, states of being, enemies/projections). Keeps docs in English, in the right section, indexed, and asks the owner when something is unclear.
---

# SÓTANO documentation skill

The owner wants **everything documented thoroughly, always in English**, in a predictable structure. Follow these steps for every change. Do not skip them because a change looks small.

## 0. Language and tone

- **English only**: docs, code comments, identifiers, commit messages, and the source text of the game. (Talk to the owner in their language in chat; write the repo in English.) Players read the game in every shipped language: translations live in `src/i18n/locales/` (`sotano-i18n` skill).
- Respectful tone around mental health, therapy and personal growth: practices are not magic cures, enemies are *patterns*, never people or diagnoses (see `docs/design/STORY.md`).

## 1. Know where things go

```
README.md                      Project front page + documentation index by blocks
docs/README.md                 Index of sections + doc rules
docs/design/                   The game from the player's side
  README.md                    Index of this section
  DESIGN.md                    Mechanics, loop, structure, scope, open questions
  STORY.md                     Story, metaphor, identity, paths/states of being,
                               enemies as projections, item naming rules, vocabulary
  ELEMENTS.md                  Fire, water, lava, mud, electricity, furnaces, chests (design)
  LEVELS.md                    The thirteen floors, rooms with height, element rooms (sotano-levels skill)
docs/architecture/             How the code works today
  README.md                    Index of this section
  OVERVIEW.md                  Module map, frame order, core systems, debug console, tests
  ITEMS.md                     Items, synergies, the stat/event contract
  ROOMS.md                     Floor plans, room templates, doors
  ENTITIES.md                  Health, bombs, enemies, pickups, stacked floors
  RNG.md                       Seeds and randomness: classes, paths, tables, guarantees
  LOCALIZATION.md              i18n: catalogs, content texts, item messages, live switching
  ELEMENTS.md                  Elements and containers: architecture + step-by-step plan
  input/                       Input (a subsystem folder; sotano-controls skill)
    README.md                  What input is, index, the action table, contexts, pausing
    KEYBOARD.md                Keyboard and mouse
    GAMEPAD.md                 Gamepad
    TOUCH.md                   Touch (mobile, landscape)
  SANDBOX.md                   The sandbox (creative room) and the lab (deterministic scripted runs)
docs/lore/                     References and lore (see the sotano-lore skill)
  README.md, SOURCES.md (library), CONCEPTS.md (glossary), COSMOLOGY.md (as above, so below)
docs/research/                 Background research, target architecture, roadmap
  README.md, TECHNICAL.md
docs/reviews/                  Three-party architecture reviews
  README.md, <topic>.md
```

| You changed… | Update |
|---|---|
| A mechanic the player can feel | `docs/design/DESIGN.md` (+ README "What you can do" and controls if relevant) |
| Story, metaphor, names, identity, an item's or enemy's meaning | `docs/design/STORY.md` (it wins on names and tone) |
| An item, synergy, stat or event | `docs/architecture/ITEMS.md` (tables in §3, §5) and `docs/design/STORY.md` §5 catalogue |
| An enemy, health, bombs, loot, floors stacking | `docs/architecture/ENTITIES.md`, plus STORY.md §4 for enemies |
| Room templates, floor generation, doors | `docs/architecture/ROOMS.md` (+ `docs/design/LEVELS.md` and the `sotano-levels` skill) |
| Module layout, frame order, debug console, tests | `docs/architecture/OVERVIEW.md` |
| Roadmap / milestone status, a technical decision change | `docs/research/TECHNICAL.md` (§15 roadmap, and note decision changes where the old decision was described) and the README roadmap |
| A new reference (book, technique, therapy, game) or lore | `docs/lore/` via the sotano-lore skill |
| Player-facing text, a new language, or the localization mechanism | The catalogs in `src/i18n/locales/` (`sotano-i18n` skill); `docs/architecture/LOCALIZATION.md` if the mechanism changed |
| Anything random (a new table, a new random decision, a new seed path) | `docs/architecture/RNG.md` (path table, tables list) |
| Controls: an action, a binding, a device | `docs/architecture/input/README.md` (the table) and the device's own document (`KEYBOARD.md`, `GAMEPAD.md`, `TOUCH.md`), via the `sotano-controls` skill |
| A key architecture decision | Run the three-party review (below) and add `docs/reviews/<topic>.md` |

### Hierarchy

Documentation is a tree, never a pile. Every level answers one question: a section says *which part of the game*, a subsystem folder says *which system*, a document says *which variant or facet* of it.

- **Split by variant, never merge.** When a subject has variants that a reader looks up one at a time (devices, element types, floor kinds, platforms), each variant gets its own document inside a folder named after the subject. One document per variant; nothing about one variant lives in another's file.
- **A folder for every subsystem with more than one document**, inside its section (`docs/architecture/input/`, not `docs/architecture/INPUT-*.md`). Folder names are lowercase; document names are UPPERCASE.
- **Every folder has a `README.md`** that says in one paragraph what the subject is, holds the index of its documents (a table: document, contents), and keeps only what is shared by all of them (the common contract, the shared table, what the variants have in common). Detail specific to one variant goes down into its document.
- **Every document says where it belongs** in its first lines (a link up to its folder's README) and links sideways only when it must.
- **Each level is indexed by the level above**: a new document in its folder's README, a new folder in its section's README, a new section in `docs/README.md` and the root README.
- **Move, don't copy.** When a document grows a second variant, turn it into a folder and move the text; fix every link in the same commit (the link check below).

A **new document** must be added to its section `README.md` index. A **new section (folder)** must have its own `README.md` with an index, and be listed in `docs/README.md` and in the root `README.md` documentation index.

## 2. Naming rules for game content (from STORY.md)

- Items are **practices**: in-game names are generic technique/concept names or public-domain works (Marcus Aurelius, Seneca, Epictetus, Lao Tzu, Emerson, James Allen…). Modern books, courses and branded methods go only in `inspiredBy`, never as the name. Never use trademarked method names (Pomodoro®, GTD®, Wim Hof Method®, 7 Habits®…) as names.
- Enemies are **projections** of patterns that block intention (Doubt, Inner Critic, Panic…). Their behaviour must mirror the pattern.
- The player's shot is an **intention** (`intent` in code). Never "tear".
- No Mojang or Isaac names or assets anywhere.
- Every item has a path tag (`body`, `mind`, `emotion`, `will`) unless the owner says otherwise.

## 3. Ask when in doubt

If a request is ambiguous — about meaning, names, story, tone, scope, or where something should live — **ask the owner before writing it down** (use the AskUserQuestion tool; keep questions short, offer a recommended option first). Don't invent lore, character traits or names that contradict STORY.md; if something new is needed, propose it and ask. Small technical choices with an obvious default don't need a question: pick the default and mention it.

## 4. Three-party review for key decisions

For key architecture decisions (new core systems, cross-cutting contracts), the owner wants:

1. **Engineer** (you) writes the proposal in the right `docs/architecture/` file.
2. Spawn an **architect** agent (read-only, e.g. the Plan agent) to critique it: severity, failure scenario, concrete change.
3. Spawn a **mediator** agent that represents the owner's interests, fact-checks the critique against the code and rules on each point: now / later (milestone) / reject.
4. Record critique, ruling and resolution in `docs/reviews/<topic>.md`, list it in `docs/reviews/README.md`, implement the "now" items, and list the "later" items in the relevant architecture doc.

## 5. Before you commit

- [ ] Code comments in English, matching the surrounding density.
- [ ] Every affected doc updated (table in §1), in this same commit.
- [ ] New docs indexed in their section README; new sections indexed in `docs/README.md` and the root README.
- [ ] Root README: "What you can do", controls, items table, roadmap and status line still true.
- [ ] Relative links resolve (run the link check below).
- [ ] `npm run typecheck && npm test` pass.

Link check (from the repo root):

```bash
python -c "import os,re;b=[(p,l) for r,_,fs in os.walk('.') if 'node_modules' not in r and '.git' not in r for f in fs if f.endswith('.md') for p in [os.path.join(r,f)] for l in re.findall(r'\]\(([^)#:]+\.md)',open(p,encoding='utf8').read()) if not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(p),l)))];print(b or 'links ok')"
```
