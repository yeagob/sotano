[Bosses](README.md) · [Fight flow](FIGHT-FLOW.md)

# The Shadow

Built, in part. Floor 9, the keystone of the frozen bottom. Code: `src/content/bosses/shadow.ts`.

The Shadow is the player's own silhouette in the room's negative: the same height, the same hands, a jumper. In phase 1 it does nothing but walk with the player, copying their movement. Its ending is not a fight to win by hitting: the player must stand still beside it.

- **Pattern:** everything you do not want to see in yourself. To be seen, and to come home.
- **Path:** all paths.
- **Health:** 1000 on floor 9.

## Phases

### Phase 1: mirrors

It has no attack of its own. Each frame it copies the player's velocity (scaled to its speed), so it walks with the player and keeps pace. Its contact is the only harm.

- Arena: none on entering.

### Phase 2: reveals (from two thirds of its health)

Arena `mirrors`: toast only. Every six seconds it summons one random projection from the doubt, the critic and the panic, beside itself.

### Phase 3: stops (from one third of its health)

Arena `stop`: toast only. It stops moving. If the player stands within 2.5 blocks of it, moving less than 0.2 blocks a second, for three seconds in a row, it is defeated. Stepping away resets the count.

## Toasts

- Entering phase 2: "It reveals: the projections you let go rise as shadows".
- Entering phase 3: "It stops fighting: stand still beside it for three seconds".

## Defeat

Stillness is a defeat like any other: the boss room opens and the way down is cracked open after the usual delay. Floor 9 has no toll. The design's dark ring at the player's wrist, and the state "Shadow integrated", are not built.

## Open questions

- **Mirrors.** The design has it mirror the player's intentions a beat later, cold. The build mirrors the player's movement. Both are fair; which is the Shadow?
- **Reveals.** The design summons the projections the player let go during this run, as shadows. The build summons three random basic patterns. Build the memory of the run?
- **Integration.** The design says the Shadow shrinks into the player's hands. The build removes it with the usual release.
- **Arena.** The design turns the frozen floor into mirrors when phase 2 starts. The build has only the toast.
- The full design is in [not-built/bosses/SHADOW.md](../../not-built/bosses/SHADOW.md).
