// Cosmetic randomness: particles, sound jitter, camera shake, cube spin and launch directions.
// It may use Math.random because it must never decide an outcome (docs/architecture/RNG.md).
// Structure code (src/world, src/content) must not import this module; a test checks it.
// The sandbox seeds it (`seedFx`) so a scenario replays tick for tick (docs/architecture/SANDBOX.md).

let draw = Math.random;

/** A fixed sequence from `seed` (mulberry32), or Math.random again with null. */
export function seedFx(seed: number | null) {
  if (seed === null) { draw = Math.random; return; }
  let s = seed >>> 0;
  draw = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const fx = {
  /** [0, 1) */
  random: () => draw(),
  /** [-r, r) */
  spread: (r: number) => (draw() * 2 - 1) * r,
  range: (min: number, max: number) => min + (max - min) * draw(),
};
