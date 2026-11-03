// Gaits the minions compose: walking, climbing, hanging, rolling, stalking, leaping (docs/architecture/SKY.md §5.4). Stub (K0): C1 builds them.

import type { Gait, SkyActor } from '../types';

const still = (id: string): Gait => ({ id, step: () => false });

export const walk = (_speed: number): Gait => still('walk');
/** Seconds per block climbed up a face. */
export const climbFace = (_perBlock: number): Gait => still('climbFace');
export const hangUnder = (): Gait => still('hangUnder');
export const roll = (_speed: number): Gait => still('roll');
export const file = (_leader: () => SkyActor | null): Gait => still('file');
/** Speeds while seen and unseen; the half-angle of the player's view cone, radians. */
export const stalk = (_seen: number, _unseen: number, _cone: number): Gait => still('stalk');
export const gallopLoop = (_speed: number, _turnAt: number): Gait => still('gallopLoop');
export const bound = (_maxStep: number): Gait => still('bound');
/** The longest ballistic arc, in blocks across. */
export const pounce = (_arc: number): Gait => still('pounce');
/** The first gait that moves this tick wins. */
export const compose = (..._gaits: Gait[]): Gait => still('compose');
