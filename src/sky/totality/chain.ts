// Totality's chain of platforms: climb and rest hops, checkpoints, headroom (docs/architecture/SKY.md §8). Stub (K0): TT builds it.

import type { Fork, TotalityPlan, Vec3 } from '../types';
import { STRATA } from './strata';

/** Every sixth platform is a checkpoint. */
export const CHECKPOINT_EVERY = 6;
/** Blocks of formula air above every takeoff and arc. */
export const HEADROOM = 15;
/** The spiral stays within this radius of the axis. */
export const CHAIN_RADIUS = 100;

/** `fork` is the run's; the chain draws from fork('sky', 'totality', stratum). `crown` is the first platform's cell. */
export function buildTotality(_fork: Fork, crown: Vec3): TotalityPlan {
  return { strata: STRATA, shapes: [], platforms: [], hops: [], checkpoints: [], threshold: { x: crown.x, y: crown.y, z: crown.z, r: 0 } };
}
