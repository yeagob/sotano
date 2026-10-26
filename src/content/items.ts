// Items as data + hooks (see docs/TECHNICAL.md §9). In M0 they are only granted from the console
// (`S.give('...')`), but they already go through the same stats and event pipeline pedestal items will use.

import type { DamageKind } from '../core/damage';
import type { StatMod } from '../core/stats';
import type { GameBus } from '../game/events';
import { mat } from './materials';

export interface ItemCtx {
  bus: GameBus;
  source: string;
  /** Damages a block through the damage pipeline (for chain reactions). */
  damageBlock(x: number, y: number, z: number, amount: number, kind: DamageKind, source: string): void;
  materialAt(x: number, y: number, z: number): number;
}

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  pools: string[];
  stats?: Omit<StatMod, 'source'>[];
  install?(ctx: ItemCtx): void;
}

export const ITEMS: ItemDef[] = [
  {
    id: 'heavy',
    name: 'Leaden Intent',
    description: 'More damage, more drop.',
    pools: ['treasure'],
    stats: [
      { stat: 'damage', layer: 'add', value: 2 },
      { stat: 'gravity', layer: 'mul', value: 2 },
      { stat: 'size', layer: 'mul', value: 1.4 },
    ],
  },
  {
    id: 'miner',
    name: 'Miner\'s Intent',
    description: 'Breaks blocks twice as fast, but deals less damage.',
    pools: ['treasure'],
    stats: [
      { stat: 'mining', layer: 'mul', value: 2 },
      { stat: 'damage', layer: 'mul', value: 0.8 },
    ],
  },
  {
    id: 'drill',
    name: 'Drill',
    description: 'Intentions pierce through two soft blocks.',
    pools: ['treasure'],
    install({ bus, source }) {
      bus.on('fire', { priority: 10, source, fn: e => { e.intent.pierce += 2; e.intent.color = 0xffb347; } });
    },
  },
  {
    id: 'chain',
    name: 'Chain Reaction',
    description: 'Breaking a block damages its neighbours of the same material.',
    pools: ['treasure'],
    install({ bus, source, damageBlock, materialAt }) {
      bus.on('blockBreak', {
        priority: 200, source, fn: e => {
          if (e.kind === 'crush') return; // chain damage does not chain again
          const m = e.material;
          for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
            const x = e.x + dx, y = e.y + dy, z = e.z + dz;
            bus.defer(() => { if (materialAt(x, y, z) === m) damageBlock(x, y, z, mat(m).hp * 0.6, 'crush', source); });
          }
        },
      });
    },
  },
];

export const ITEM_BY_ID = new Map(ITEMS.map(i => [i.id, i]));
