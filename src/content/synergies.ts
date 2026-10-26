// Synergies: what happens when specific practices meet, and the states of being reached by
// holding three practices of the same path. This file is also where exceptions live:
// a synergy can add stats or hooks, and can `suppress` a single hook of an item
// ("itemId.hookId") to replace or cancel its behaviour while the combination is held.
// The inventory re-evaluates these every time the item list changes.

import { defineSynergy, hook, type SynergyDef } from '../items/types';
import { CHAIN_SOURCE, NEIGHBOURS } from './items/habitstack';
import { VOLATILE } from './items/catharsis';

export const SYNERGIES: readonly SynergyDef[] = [
  defineSynergy({
    id: 'somatic_release',
    name: 'Somatic Release',
    description: 'Kicked blocks burst too.',
    requires: ['catharsis', 'grounding'],
    hooks: [hook('kick', e => { e.tags.add(VOLATILE); }, { id: 'arm-kicks' })],
  }),
  defineSynergy({
    id: 'compound_effect',
    name: 'Compound Effect',
    description: 'Small steps with deep focus go through stone and brick as well.',
    requires: ['kaizen', 'deepfocus'],
    hooks: [hook('fire', e => { e.intent.pierceTier = Math.max(e.intent.pierceTier, 1); }, { id: 'pierce-stone', priority: 20 })],
  }),
  defineSynergy({
    id: 'flooding',
    name: 'Flooding',
    description: 'Fears you walk through take their neighbours with them.',
    requires: ['exposure', 'habitstack'],
    // Exception example. Habit Stacking's hook already follows contact breaks, but only deals
    // 60% of a block's HP to each neighbour. With Exposure we switch that hook off and install
    // one that shatters same-material neighbours outright, for every break except its own.
    suppress: ['habitstack.spread'],
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

  // ── states of being: three practices of the same path (docs/design/STORY.md §3) ──
  defineSynergy({
    id: 'embodied',
    name: 'Embodied',
    description: 'State of being: present in the body. Faster, and your kicks land harder.',
    requires: [{ tag: 'body', count: 3 }],
    stats: [{ stat: 'moveSpeed', layer: 'mul', value: 1.15 }, { stat: 'kick', layer: 'mul', value: 1.3 }],
  }),
  defineSynergy({
    id: 'lucid',
    name: 'Lucid',
    description: 'State of being: a clear mind. Intentions go further and you reach further.',
    requires: [{ tag: 'mind', count: 3 }],
    stats: [{ stat: 'range', layer: 'mul', value: 1.25 }, { stat: 'reach', layer: 'add', value: 1 }],
  }),
  defineSynergy({
    id: 'open_hearted',
    name: 'Open-hearted',
    description: 'State of being: feeling instead of avoiding. Fortune favours you.',
    requires: [{ tag: 'emotion', count: 3 }],
    stats: [{ stat: 'luck', layer: 'add', value: 2 }],
  }),
  defineSynergy({
    id: 'resolute',
    name: 'Resolute',
    description: 'State of being: steady will. More damage, and blocks give way sooner.',
    requires: [{ tag: 'will', count: 3 }],
    stats: [{ stat: 'damage', layer: 'mul', value: 1.15 }, { stat: 'mining', layer: 'mul', value: 1.2 }],
  }),
];
