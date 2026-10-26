// Voxel grid raycast (Amanatides–Woo DDA): returns the exact block and the face that was hit.

export interface VoxelHit {
  x: number; y: number; z: number;     // block that was hit
  nx: number; ny: number; nz: number;  // face normal (points out of the block)
  t: number;                           // distance travelled
}

export function raycastVoxels(
  solid: (x: number, y: number, z: number) => boolean,
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  maxDist: number,
): VoxelHit | null {
  const len = Math.hypot(dx, dy, dz);
  if (len === 0) return null;
  dx /= len; dy /= len; dz /= len;
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const stepX = Math.sign(dx), stepY = Math.sign(dy), stepZ = Math.sign(dz);
  const tdx = stepX ? Math.abs(1 / dx) : Infinity;
  const tdy = stepY ? Math.abs(1 / dy) : Infinity;
  const tdz = stepZ ? Math.abs(1 / dz) : Infinity;
  let tmx = stepX ? (stepX > 0 ? x + 1 - ox : ox - x) * tdx : Infinity;
  let tmy = stepY ? (stepY > 0 ? y + 1 - oy : oy - y) * tdy : Infinity;
  let tmz = stepZ ? (stepZ > 0 ? z + 1 - oz : oz - z) * tdz : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;

  if (solid(x, y, z)) return { x, y, z, nx: 0, ny: 0, nz: 0, t: 0 };
  while (t <= maxDist) {
    if (tmx < tmy && tmx < tmz) { x += stepX; t = tmx; tmx += tdx; nx = -stepX; ny = 0; nz = 0; }
    else if (tmy < tmz) { y += stepY; t = tmy; tmy += tdy; nx = 0; ny = -stepY; nz = 0; }
    else { z += stepZ; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -stepZ; }
    if (t > maxDist) break;
    if (solid(x, y, z)) return { x, y, z, nx, ny, nz, t };
  }
  return null;
}
