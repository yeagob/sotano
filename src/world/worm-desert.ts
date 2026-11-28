// The deep desert of the worm (issue #354, docs/design/built/levels/worm-desert/README.md): a round basin of sand in the
// south of the Outer Void's desert, reached only by walking south. Inside it the sand goes down DEEP_SAND blocks to
// bedrock, with no lava sea and no lava trap under it. A formula of the tree's axis, like the rest of the Void: nothing
// is drawn from the seed, nothing is stored.

/** Distance from the tree's axis to the basin's centre, due south (+z): past the desert's blend (BIOME_R + BIOME_BLEND). */
export const WORM_DESERT_DIST = 1600;
/** The basin's radius: inside it the sand is deep. */
export const WORM_DESERT_R = 150;
/** The worm is never steered (or wanders) farther than this from the centre: the deep sand always lies under it. */
export const WORM_STEER_R = 120;
/** Blocks of sand from the grass level down to the bedrock (owner: about 100). */
export const DEEP_SAND = 100;
/** Over this many blocks inside the rim the dunes flatten into the basin's low swell. */
const RIM_BLEND = 40;
/** The basin's ground: a low swell 2 to 4 blocks above the grass, so the worm's back reads as the highest thing in it. */
const BASIN_H = 3;

export function wormDesertCentre(cx: number, cz: number): [number, number] {
  return [cx, cz + WORM_DESERT_DIST];
}

/** Distance from the basin's centre. */
export function wormDesertDistance(cx: number, cz: number, x: number, z: number): number {
  return Math.hypot(x - cx, z - (cz + WORM_DESERT_DIST));
}

/** Whether the column (x, z) is deep sand (cx, cz: the tree's axis). */
export function inWormDesert(cx: number, cz: number, x: number, z: number): boolean {
  return wormDesertDistance(cx, cz, x, z) <= WORM_DESERT_R;
}

/** The basin's swell at a column (above the grass, before rounding). */
export function basinHeight(x: number, z: number): number {
  return BASIN_H + Math.sin(0.061 * x + 0.023 * z) * 0.8 + Math.sin(0.047 * z - 0.019 * x) * 0.6;
}

/** How much of the basin's swell replaces the dunes at distance `d` from its centre: 1 well inside, 0 at the rim. */
export function basinBlend(d: number): number {
  const t = Math.max(0, Math.min(1, (WORM_DESERT_R - d) / RIM_BLEND));
  return t * t * (3 - 2 * t);
}
