// What every voxel world offers its consumers (docs/architecture/SKY.md §3.1): the dungeon's
// `VoxelWorld` (a flat array) and the sky's `SkyWorld` (a formula with exceptions) both implement
// it, so elements, cracks and the chunk renderer work on either. No implementation here.

export interface VoxelSpace {
  readonly sx: number; readonly sy: number; readonly sz: number;
  /** Chunks along each axis. */
  readonly ncx: number; readonly ncy: number; readonly ncz: number;
  /** Remaining HP of the blocks that were hit, by voxel index. */
  readonly damaged: Map<number, number>;
  /** Chunk keys (`chunkKey`) whose block or element mesh is stale. */
  readonly dirty: Set<string>; readonly elemDirty: Set<string>;
  version: number; elemVersion: number;
  onChange: ((x: number, y: number, z: number) => void) | null;
  inside(x: number, y: number, z: number): boolean;
  /** x + sx·(y + sy·z), the same formula in both worlds. */
  idx(x: number, y: number, z: number): number;
  coords(i: number): [number, number, number];
  /** The material at a cell, AIR outside the world. */
  get(x: number, y: number, z: number): number;
  getAt(i: number): number;
  solid(x: number, y: number, z: number): boolean;
  set(x: number, y: number, z: number, m: number): void;
  elemAt(x: number, y: number, z: number): number;
  elemAtIndex(i: number): number;
  setElem(x: number, y: number, z: number, kind: number, level: number, falling?: boolean): void;
  setElemByte(x: number, y: number, z: number, v: number): void;
  markDirty(x: number, y: number, z: number): void;
  markElemDirty(x: number, y: number, z: number): void;
  hp(x: number, y: number, z: number): number;
  /** A chunk plus a one-voxel border, (CHUNK + 2)³ bytes, for the mesher (`elem`: the element layer). */
  paddedChunk(cx: number, cy: number, cz: number, elem?: boolean): Uint8Array;
  /** True for a chunk column outside the stored world whose ground is a formula (the dungeon's
   *  surface and mountains): it is streamed round the viewer, never by the rows of levels. */
  outerChunk?(cx: number, cz: number): boolean;
  /** The formula ground's chunks to mesh within `radius` blocks of (x, z), nearest first. */
  outerChunksNear?(x: number, z: number, radius: number): [number, number, number][];
  /** True when a chunk is all air with no element (the sky is mostly air). */
  emptyChunk?(cx: number, cy: number, cz: number): boolean;
}
