import type { ItemDef, StatModSpec } from '../items/types';
import type { StatName } from '../core/stats';
import { ITEM_BY_ID, ITEMS } from './items';

export const ECHO_POOLS = ['treasure', 'boss', 'vault'] as const;
export const ECHO_EXCLUDED_STATS: readonly StatName[] = ['maxHearts', 'carry'];
export const ECHO_PATHS: readonly string[] = ['body', 'mind', 'emotion', 'will'];

export function echoable(d: ItemDef): boolean {
  if (!d.stats?.length || d.hooks?.length || d.suppress?.length || d.weapon || d.stack || d.onGain) return false;
  if (d.stats.some(m => ECHO_EXCLUDED_STATS.includes(m.stat))) return false;
  if (!d.tags?.some(t => ECHO_PATHS.includes(t))) return false;
  return ECHO_POOLS.some(p => (d.pools[p] ?? 0) > 0);
}

export const ECHO_ITEMS: readonly ItemDef[] = ITEMS.filter(echoable).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const pools = new Map<string, readonly ItemDef[]>();

export function echoPool(paths: readonly string[]): readonly ItemDef[] {
  const key = [...new Set(paths)].sort().join('+');
  let pool = pools.get(key);
  if (!pool) {
    const own = ECHO_ITEMS.filter(d => d.tags?.some(t => paths.includes(t)));
    pool = own.length ? own : ECHO_ITEMS;
    pools.set(key, pool);
  }
  return pool;
}

export function hashKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export function echoPick(paths: readonly string[], key: string): string | null {
  const pool = echoPool(paths);
  return pool.length ? pool[hashKey(key) % pool.length].id : null;
}

export function echoStats(id: string | undefined): readonly StatModSpec[] {
  const d = id ? ITEM_BY_ID.get(id) : undefined;
  return d && echoable(d) ? d.stats ?? [] : [];
}
