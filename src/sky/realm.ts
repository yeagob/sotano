// The swap between the dungeon's systems and the sky's (docs/architecture/SKY.md §2.1). The game
// keeps its fields and swaps them through `RealmHost`, so this is tested headless with a fake host.

import type { RealmSet, SwapRealm } from './types';

/**
 * Makes `stash` the active world and returns the set that was active, which becomes the new stash.
 * The leaving world's in-flight work is cleared first, while its systems are still in the fields;
 * the sky's hooks are installed or removed last, once the new world is in place.
 */
export const swapRealm: SwapRealm = (host, stash, dungeonRoot, skyRoot) => {
  const leaving: RealmSet = host.current();
  host.clearTransient();
  host.install(stash);
  host.hooks(stash.kind);
  dungeonRoot.visible = stash.kind === 'dungeon';
  skyRoot.visible = stash.kind === 'sky';
  return leaving;
};
