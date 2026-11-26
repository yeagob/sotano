import { EL_WATER, SOURCE, elemByte, elemKind } from '../content/elements';
import { AIR } from '../content/materials';
import type { VoxelSpace } from './space';

export const TEMP_WATER_SECONDS = 3;

type WaterSpace = Pick<VoxelSpace, 'inside' | 'idx' | 'get' | 'elemAt' | 'setElemByte'>;

interface Pool { world: WaterSpace; x: number; y: number; z: number; until: number }

const SOURCE_WATER = elemByte(EL_WATER, SOURCE);

export class TempWater {
  private pools = new Map<string, Pool>();
  private worlds = new Map<WaterSpace, number>();

  private key(world: WaterSpace, x: number, y: number, z: number): string {
    let id = this.worlds.get(world);
    if (id === undefined) { id = this.worlds.size; this.worlds.set(world, id); }
    return `${id}:${world.idx(x, y, z)}`;
  }

  place(world: WaterSpace, x: number, y: number, z: number, now: number, seconds = TEMP_WATER_SECONDS): boolean {
    if (!world.inside(x, y, z) || !(seconds > 0)) return false;
    const k = this.key(world, x, y, z);
    const pool = this.pools.get(k);
    if (pool && world.elemAt(x, y, z) === SOURCE_WATER) {
      pool.until = now + seconds;
      return true;
    }
    if (world.get(x, y, z) !== AIR || world.elemAt(x, y, z) !== 0) return false;
    world.setElemByte(x, y, z, SOURCE_WATER);
    if (world.elemAt(x, y, z) !== SOURCE_WATER) return false;
    this.pools.set(k, { world, x, y, z, until: now + seconds });
    return true;
  }

  has(world: WaterSpace, x: number, y: number, z: number): boolean {
    return this.pools.has(this.key(world, x, y, z));
  }

  near(world: WaterSpace, x: number, y: number, z: number): boolean {
    if (elemKind(world.elemAt(x, y, z)) !== EL_WATER) return false;
    for (const p of this.pools.values()) {
      if (p.world !== world) continue;
      if (Math.abs(p.x - x) <= 1 && Math.abs(p.z - z) <= 1 && y <= p.y && y >= p.y - 2) return true;
    }
    return false;
  }

  get count(): number { return this.pools.size; }

  update(now: number): void {
    for (const [k, p] of this.pools) {
      if (p.until > now) continue;
      this.dryPool(p);
      this.pools.delete(k);
    }
  }

  clear(): void {
    for (const p of this.pools.values()) this.dryPool(p);
    this.pools.clear();
  }

  private dryPool(p: Pool): void {
    if (p.world.elemAt(p.x, p.y, p.z) === SOURCE_WATER) p.world.setElemByte(p.x, p.y, p.z, 0);
  }
}
