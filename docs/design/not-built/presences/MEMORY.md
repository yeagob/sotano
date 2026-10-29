[Presences](README.md)

# Memory across runs

Status: **decided** (owner answer 7, 2026-10-27: dwellers remember the player, as knowledge only, in a small profile save, never as stats). The Covenant's set effect (every Presence remembers in the run) is decided too.

Dwellers remember which runs the player began, how deep they went, which Lessons they chose, which projections they have released and how many times. This is meta-progression as knowledge, not power. It shows as new dialogue, new codex pages, the Echo, and a Gardener who greets the player differently. It is never a permanent stat boost.

## What it is, and is not

- **Knowledge only.** Memory gives lines, pages and places. It never adds health, damage, luck or any stat.
- **Profile save.** It is stored in a small profile save, not in the run's seed. A new run starts from the profile.
- **Run trust.** The hidden trust meter of the requests is per run, not per profile, and it is never shown (see [Requests](REQUESTS.md)).

## Open questions

- **The profile save.** The build has no profile save for presences yet. Its design (what is kept, where, and how it is cleared) comes first.
- **Counts.** Release counts and run counts are kept in the profile. Decide the limit, so that a long player does not see a memory that never ends.
- **Reset.** A way to erase the profile must exist and be plain. Decide where it lives in the settings.
- **Covenant set.** "Every Presence remembers you in the run" is a run rule, while the rest of memory is a profile rule. Keep the two apart in the code and the text.
