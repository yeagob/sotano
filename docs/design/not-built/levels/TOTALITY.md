# Totality: the sixth level going up

Up: [not-built levels](README.md) · [The realm of the sky](../sky/README.md)

Status: decided for the placement (level 6 going up, above the five deities), the core mechanic (high-altitude, long-distance platforming across small platforms), the ascent theme (leaving the tree and the Earth behind, climbing through deep space toward the Sun), and the requirement of the triple jump reward. Decided (owner, 2026-11-05, replacing the closed threshold of 2026-11-03): the last jump of the climb enters the Sun; entering activates Unity (issue #95, pending), which does nothing yet. Proposal for the exact platform layout, pacing, and fall recovery.

## 1. What Totality is

Totality is the sixth level of the upward journey, located directly above the canopy of the Giant Tree and the fifth guardian's floor. It is a level of pure, high-stakes vertical and horizontal platforming at dizzying heights.

Unlike the confined tree branches or the bounded meadows of the lower sky floors, Totality opens into vast, open cosmic space. The player traverses tiny, isolated stepping stones separated by immense distances, progressively leaving behind the green canopy, the atmosphere, and the Earth itself as they ascend into the stars toward the Sun.

## 2. Core mechanic: The Triple Jump

Totality cannot be traversed with ordinary movement. Progression is designed entirely around the **Triple Jump** ability granted upon overcoming the fifth tree deity ([HORSE](../sky/guardians/HORSE.md)):

1. **First jump**: Standard jump ($1\times$ height). Ground leap to gain initial footing.
2. **Second jump**: Double height ($2\times$ standard height). Mid-air surge allowing adjustments and moderate clearance.
3. **Third jump**: Eight times standard height ($8\times$ standard height). A massive atmospheric leap propelling the player high and far into the cosmic void.

The vast gulfs between tiny platforms require intentional jump sequencing: timing the cadence of the $1\times \to 2\times \to 8\times$ leaps to catch high thermal currents and bridge chasms that appear impossibly wide from below.

## 3. Visual and atmospheric ascent

The ascent through Totality is divided into three distinct strata:

- **Lower Totality (The Thinned Exosphere)**:
  - The crown of the giant sky tree recedes below into a vast green carpet.
  - The sky shifts from pale blue to deep cyan and violet.
  - Platforms consist of drifting petrified leaf clusters, starlight resin, and ancient boundary stones.
- **Mid Totality (The Void of Space)**:
  - The Earth itself curves away below, becoming a recognizable sphere floating in darkness.
  - Deep space envelopes the player: brilliant constellations, nebula dust, and pitch-black vacuum.
  - Platforms are small, crystalline meteor fragments and solidified star-matter, glowing softly against the dark.
- **Upper Totality (Solar Approach)**:
  - The blinding corona of the Sun fills the upper hemisphere. Golden light washes out shadows.
  - The platforms glow like incandescent glass and solar embers.
  - Distances between platforms stretch to their maximum, requiring full commitment to the $8\times$ leap.
  - The last jump of the climb, taken from the final checkpoint, enters the Sun's volume (decided, owner, 2026-11-05). Entering activates [Unity](UNITY.md), which is issue #95, pending, and does nothing yet. The entrance is built and moved to [built/levels/totality/THRESHOLD.md](../../built/levels/totality/THRESHOLD.md). The 107 hops stay as they are for now.
  - The Sun's warm light is an exception to art pillar 2 (warm light is earned and yours), provisional (owner, 2026-11-03). It is to be recorded in the sky art ledger, which is not written yet.

## 4. Platforming design and player feel

- **Tiny platforms, immense gaps**: Platforms are small (often 2x2 or 3x3 blocks wide, narrowing to single blocks near the summit). Precision landings are mandatory.
- **Momentum and air control**: The $8\times$ third jump provides substantial airtime, requiring player focus on trajectory, horizontal drift control, and judging landing shadows or glowing markers.
- **Fall handling (Proposal)**: In keeping with the laws of the sky ([law 3.7: nothing dies in the sky](../sky/README.md#37-nothing-dies-in-the-sky)), missing a jump in Totality does not cause death or damage ([law 3.10](../sky/README.md#310-the-player-cannot-die-in-the-sky), decided). Instead, falling deep into the void catches the player in a gentle updraft (solar wind or cosmic currents) that returns them to the last stable checkpoint platform or safely down to the lower stratum.

## 5. Open questions

1. **Checkpoints and safe platforms**: How frequent are resting platforms where the player can pause without precision balancing?
2. **Block building in Totality**: Realm law 3.2 allows the player to place blocks created with abilities. Does the player have enough blocks or reach to create bridges, or does cosmic void restrict block placement?
3. **Solar wind hindrances**: Should gusts of solar wind act as kinetic aids or hazards during the third jump?
