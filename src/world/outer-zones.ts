// The four secret zones of the Outer Void that the ?test bench can stand the player on (docs/testing/TEST-BENCH.md).
// A formula of the tree's axis and of the surface's own structures, so every run finds them in the same place.

/** The zones the bench offers, in the order of its buttons. */
export const OUTER_ZONES = ['desert', 'ice', 'mountains', 'port'] as const;
export type OuterZone = (typeof OUTER_ZONES)[number];

/** Distance from the tree's axis to the desert's and the ice's centres: past the sectors' blend (BIOME_R + BIOME_BLEND), where the worm's basin lies. */
export const ZONE_RADIUS = 1600;

/** The surface terrain's fields a zone needs: the axis and the two structures of the biomes. */
export interface ZoneTerrain {
  readonly cx: number;
  readonly cz: number;
  readonly biomes: { readonly temple: { readonly x: number; readonly z: number }; readonly village: { readonly x: number; readonly z: number } };
}

/** The column (x, z) of a zone: the desert to the south, the ice to the north, the mountains' temple peak, the port's village. */
export function outerZoneColumn(zone: OuterZone, t: ZoneTerrain): [number, number] {
  switch (zone) {
    case 'desert': return [t.cx, t.cz + ZONE_RADIUS];
    case 'ice': return [t.cx, t.cz - ZONE_RADIUS];
    case 'mountains': return [t.biomes.temple.x, t.biomes.temple.z];
    case 'port': return [t.biomes.village.x, t.biomes.village.z];
  }
}
