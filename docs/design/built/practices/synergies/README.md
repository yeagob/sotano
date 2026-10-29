# Synergies

Up: [practices](../README.md) · [built design](../../README.md)

A synergy is a rule that switches on while a set of practices is held together. The code keeps them in one file, `src/content/synergies.ts`, and re-evaluates them every time the list of practices changes. A synergy can add stats or event hooks, replace a practice's weapon, or switch off one hook of a practice while it is held. Six are built, one per combination below. Each has its own document.

| Synergy | Requires | Effect as built |
|---|---|---|
| [One Clear Cut](ONE-CLEAR-CUT.md) | Cut Ties with Toxic People + Remember Breathing | Charge and release a giant blade of light that sweeps 140 degrees and cuts everything in it. The combination outranks the weapon of either practice. |
| [Chorus](CHORUS.md) | Remember Breathing + Dual Process | The beam's strike damage and mining are multiplied by 1.6. Dual Process cannot reach a beam, so the second voice is added here. |
| [Choir](CHOIR.md) | Remember Breathing + Triangulation | The beam's strike damage and mining are multiplied by 2.2. Triangulation cannot reach a beam, so the voices are added here. |
| [Somatic Release](SOMATIC-RELEASE.md) | Symbolic Act + Grounding | Blocks you kick become volatile: they burst on impact, like thrown blocks under Symbolic Act. |
| [Compound Effect](COMPOUND-EFFECT.md) | Kaizen + Deep Focus | Intentions pierce stone and brick as well: the pierce tier is at least 1. |
| [Flooding](FLOODING.md) | Exposure + Habit Stacking | Habit Stacking's neighbour rule is switched off while Flooding is held. In its place, every block break (except the chain of a break that came from this rule) shatters the same-material neighbours outright. |

The four states of being are also synergies in code, with a count of practices that share a path tag. They have their own folder: [states of being](../states-of-being/README.md).

## Open questions

- F1 (Flooding): the rule follows every block break, while the design text says contact. See [Flooding](FLOODING.md).
