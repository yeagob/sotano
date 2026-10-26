---
name: sotano-lore
description: SÓTANO's references and lore - the library of books, traditions, techniques, therapies and games the work draws on, its concepts, and its cosmology (as above, so below). Use it whenever the owner shares a new reference (book, course, technique, therapy, game, author), whenever you name or design a practice (item), projection (enemy), place, boss or endgame element, or whenever you write about the game's story, world or meaning. Also use sotano-docs (and sotano-items when items change).
---

# SÓTANO lore and references skill

The owner will keep sharing references (books, courses, techniques, therapies, games) to shape items, enemies, places and the endgame. This skill keeps them organised, credited correctly and actually used. Everything is written in **English**; chat with the owner in Spanish.

## 1. Where things live

| File | Holds |
|---|---|
| `docs/lore/SOURCES.md` | The **library**: one row per source (id, title, author, year, kind, naming status, key ideas, where it shows up) |
| `docs/lore/CONCEPTS.md` | The **glossary**: one row per idea, with source ids and its expressions in the game |
| `docs/lore/COSMOLOGY.md` | The **world's shape**: depth and surface as mirrors, the Hermetic principles as systems, the endgame connection |
| `docs/design/STORY.md` | Player-facing story, item catalogue and **naming rules** (wins on names and tone) |
| `docs/lore/README.md` | Index of the section |

## 2. When the owner shares a reference

1. **Add it to SOURCES.md** in the right group, with a stable kebab-case id, author, year, kind and **naming status**:
   - **PD** (public domain everywhere we ship): the title may be used as an in-game name.
   - **Concept** (generic technique or idea): the generic name may be used.
   - **Credit** (modern work): only in `inspiredBy` and docs; in-game names use the generic idea.
   - **Caution** (registered trademark, disputed rights, or a coined term owned by its author): never in names, avoid its distinctive coined terms.
   - Mark anything uncertain *(verify)*. Remember: public-domain status differs by country (for example, works by authors who died after 1955 are usually still protected in the EU).
2. **Extract 2–5 key ideas** in your own words (never long quotes; at most a short phrase).
3. **Map each idea in CONCEPTS.md**: existing concept (add the source id) or a new concept row.
4. **Look for a fit in existing content first.** If an existing practice, projection or place expresses the same idea, reformulate it (name, description, `inspiredBy`) rather than adding a duplicate. The owner allows this.
5. **Propose new content only where the idea suggests a mechanic** that the game can express (a stat, an event hook, an enemy behaviour, a place). The mechanic must mirror the idea (Nothing Personal: hits slide off you; Art Therapy: building heals).
6. **Ask the owner** (AskUserQuestion) when the meaning is ambiguous, when a reference is sensitive (religion, therapy methods, living authors), or when it would change the story's direction. Small, obvious mappings don't need a question: do them and report them.
7. Update STORY.md §5 (catalogue), the README items table, and SOURCES.md "In the game" column; follow sotano-items for the code.

## 3. Rules for content built on references

- **Respect.** Practices aren't magic cures; therapies and spiritual paths aren't jokes or enemies. Projections are *patterns*, never people, groups, diagnoses or traditions.
- **Credit every practice**: `inspiredBy` names the source as in SOURCES.md.
- **No impersonation**: don't present quotes as said by real people in the game; don't use authors' likenesses.
- **Short quotes only**, in docs, when needed; never reproduce substantial text.
- **As above, so below**: when adding a place or a mechanic in the depth, consider its mirror at the surface (COSMOLOGY.md §1) and note it.

## 4. Checklist

- [ ] SOURCES.md row (id, status, ideas, in-game use).
- [ ] CONCEPTS.md rows updated.
- [ ] Existing content checked for a fit (reformulated if it fits).
- [ ] New content (if any) follows sotano-items / sotano-feature, credited, named per status.
- [ ] STORY.md and README updated; COSMOLOGY.md if it touches the world's shape or endgame.
- [ ] Questions to the owner asked where meaning or sensitivity is unclear.
- [ ] Link check and tests (sotano-docs §5).
