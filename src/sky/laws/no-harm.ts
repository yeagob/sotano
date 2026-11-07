// No health loss in the sky (owner, 2026-11-03; docs/design/not-built/sky/README.md §3.10, docs/architecture/SKY.md §4).
// Health never drops in the sky whatever its cause: item self-harm, bombs, landing, water, deferred hits.
// Special attacks drain spirit instead (host.drainSpirit), and spirit at zero sends the player underground.
// The player cannot die in the sky: the `death` hook is a fallback in case a hit ever lands anyway.
// Installed while the sky's hooks are (source 'sky'): `bus.off(null, 'sky')` removes both.

import type { GameBus } from '../../game/events';
import type { InstallNoHarm } from '../types';

export const installNoHarm: InstallNoHarm = (bus: GameBus) => {
  // Cancel band, the highest of it: runs after every item's hook and cancels every damage to the player.
  bus.on('actorDamage', {
    priority: 199, source: 'sky', id: 'no-harm',
    fn: e => { if (e.targetKind === 'player') e.cancel(); },
  });
  bus.on('death', {
    priority: 150, source: 'sky', id: 'no-death',
    fn: e => { e.cancel(); },
  });
};
