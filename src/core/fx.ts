// Cosmetic randomness: particles, sound jitter, camera shake, cube spin and launch directions.
// It may use Math.random because it must never decide an outcome (docs/architecture/RNG.md).
// Structure code (src/world, src/content) must not import this module; a test checks it.

export const fx = {
  /** [0, 1) */
  random: () => Math.random(),
  /** [-r, r) */
  spread: (r: number) => (Math.random() * 2 - 1) * r,
  range: (min: number, max: number) => min + (max - min) * Math.random(),
};
