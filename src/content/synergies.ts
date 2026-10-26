// Synergies: what happens when specific items meet. This file is also where exceptions live:
// a synergy can add stats or hooks, and can `suppress` a single hook of an item
// ("itemId.hookId") to replace or cancel its behaviour while the combination is held.
// The inventory re-evaluates these every time the item list changes.

import { defineSynergy, hook, type SynergyDef } from '../items/types';
import { CHAIN_SOURCE, NEIGHBOURS } from './items/chain';
import { VOLATILE } from './items/volatile';

export const SYNERGIES: readonly SynergyDef[] = [
  defineSynergy({
    id: 'demolition_kick',
    name: 'Demolition Kick',
    description: 'Kicked blocks explode too.',
    requires: ['volatile', 'leadboots'],
    hooks: [hook('kick', e => { e.tags.add(VOLATILE); }, { id: 'arm-kicks' })],
  }),
  defineSynergy({
    id: 'tunnel_bore',
    name: 'Tunnel Bore',
    description: 'Drilled intentions go through stone and brick as well.',
    requires: ['drill', 'miner'],
    hooks: [hook('fire', e => { e.intent.pierceTier = Math.max(e.intent.pierceTier, 1); }, { id: 'pierce-stone', priority: 20 })],
  }),
  defineSynergy({
    id: 'wrecking_ball',
    name: 'Wrecking Ball',
    description: 'Blocks you shatter by walking into them damage their neighbours too.',
    requires: ['bulldozer', 'chain'],
    // Exception example. Chain Reaction's hook already follows contact breaks, but only deals
    // 60% of a block's HP to each neighbour. With Bulldozer we switch that hook off and install
    // one that shatters same-material neighbours outright, for every break except its own.
    suppress: ['chain.spread'],
    hooks: [
      hook('blockBreak', (e, api) => {
        if (e.source === CHAIN_SOURCE) return;
        for (const [dx, dy, dz] of NEIGHBOURS) {
          const x = e.x + dx, y = e.y + dy, z = e.z + dz;
          api.defer(() => {
            if (api.materialAt(x, y, z) === e.material) api.damageBlock(x, y, z, 999, 'crush', CHAIN_SOURCE);
          });
        }
      }, { id: 'shatter', priority: 200 }),
    ],
  }),
];
