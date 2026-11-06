# Totality (built)

Up: [built levels](../README.md) · the sky above the crown of the sky tree, where the climb of the sky ends.

Totality is the last stretch of the sky: three strata above the crown of the sky tree, small platforms over a long climb with the Triple Jump, the Earth below and the Sun above. The last jump of the climb enters the Sun, which activates Unity (issue #95, pending, which does nothing yet).

**The climb as built.** A spiral of 108 platforms and 107 hops rises from the crown (height 221) to the Sun (about 980), within 100 blocks of the axis: the lower stratum of petrified leaf, starlight resin and boundary stone (3 × 3, then 2 × 2), the void of meteor glass (2 × 2), and the solar approach of solar glass (2 × 2, narrowing to 1 × 1). At least 60 % of the hops are climb hops that need the third jump by height alone; the rest are rest hops within reach of the first two. Every hop is within reach at base stats, and every takeoff and arc has 15 blocks of clear air above it. Every sixth platform is a checkpoint. There are no nests: the gaps are the triple jump's.

| Document | Contents |
|---|---|
| [THRESHOLD.md](THRESHOLD.md) | The last checkpoint and the entrance to the Sun |
| [UPDRAFT.md](UPDRAFT.md) | The fall recovery: a fall is carried back to the last checkpoint |
| [VIEWS.md](VIEWS.md) | The Earth and the Sun in view, the strata's colour, the far view |

What is not built (the strata's decoration, the checkpoint's beacon, the Earth's continents, solar wind, a tower knocked down by the Sun) is in [not-built levels](../../../not-built/levels/TOTALITY.md).

Code: `src/sky/totality/` (`strata.ts`, `reach.ts`, `chain.ts`, `threshold.ts`), the updraft in `src/sky/laws/updraft.ts`, the views in `src/sky/render/`; tests in `tests/totality.test.ts`.
