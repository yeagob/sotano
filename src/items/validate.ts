// Safety layer 1: static validation of the item and synergy catalogue.
// Runs at startup (problems are logged loudly, bad items are left out of the pools) and in
// tests (problems fail the build). See the sotano-items skill for the rules it enforces.

import { BASE_STATS, type StatName } from '../core/stats';
import type { ItemDef, SynergyDef } from './types';

export const PATHS = ['body', 'mind', 'emotion', 'will'] as const;
const STATS = new Set(Object.keys(BASE_STATS) as StatName[]);
const ID = /^[a-z][a-z0-9_]*$/;

export function validateItem(d: ItemDef): string[] {
  const e: string[] = [];
  const at = `item "${d.id}"`;
  if (!ID.test(d.id)) e.push(`${at}: id must be lowercase letters, digits or _`);
  if (!d.name?.trim()) e.push(`${at}: missing name`);
  if (!d.description?.trim()) e.push(`${at}: missing description`);
  if (!d.effect?.trim()) e.push(`${at}: missing effect (what it does, plainly, with numbers)`);
  if (!d.inspiredBy?.trim()) e.push(`${at}: missing inspiredBy (credit the practice or work)`);
  if (!(d.quality >= 0 && d.quality <= 4 && Number.isInteger(d.quality))) e.push(`${at}: quality must be 0..4`);
  if (!d.tags?.some(t => (PATHS as readonly string[]).includes(t))) e.push(`${at}: needs a path tag (${PATHS.join(', ')})`);
  if (!Object.values(d.pools).some(w => (w ?? 0) > 0)) e.push(`${at}: in no pool`);
  // icon: 12×12, every key in the palette
  const rows = d.icon?.rows ?? [];
  if (rows.length !== 12 || rows.some(r => r.length !== 12)) e.push(`${at}: icon must be 12 rows of 12`);
  for (const ch of new Set(rows.join(''))) if (ch !== '.' && d.icon.palette[ch] === undefined) e.push(`${at}: icon uses "${ch}" with no palette colour`);
  for (const m of d.stats ?? []) {
    if (!STATS.has(m.stat)) e.push(`${at}: unknown stat "${m.stat}"`);
    if (!Number.isFinite(m.value)) e.push(`${at}: non-finite value for ${m.stat}`);
    if (m.layer === 'mul' && m.value <= 0) e.push(`${at}: multiplier for ${m.stat} must be > 0`);
  }
  const ids = new Set<string>();
  for (const h of d.hooks ?? []) {
    if (h.id && ids.has(h.id)) e.push(`${at}: duplicate hook id "${h.id}"`);
    if (h.id) ids.add(h.id);
    if (h.priority !== undefined && (h.priority < 0 || h.priority > 999)) e.push(`${at}: hook priority out of 0..999`);
  }
  return e;
}

export function validateCatalogue(items: readonly ItemDef[], synergies: readonly SynergyDef[]): string[] {
  const e = items.flatMap(validateItem);
  const byId = new Map(items.map(i => [i.id, i]));
  if (byId.size !== items.length) e.push('duplicate item ids');
  const tags = new Set(items.flatMap(i => i.tags ?? []));
  const suppressedBy = new Map<string, string>();
  for (const s of synergies) {
    const at = `synergy "${s.id}"`;
    if (byId.has(s.id)) e.push(`${at}: id collides with an item`);
    for (const r of s.requires) {
      if (typeof r === 'string' ? !byId.has(r) : !tags.has(r.tag)) e.push(`${at}: requirement ${JSON.stringify(r)} can never be met`);
    }
    for (const h of s.hooks ?? []) if (!h.id) e.push(`${at}: every synergy hook needs an id`);
    for (const k of s.suppress ?? []) {
      const [item, hook] = k.split('.');
      if (!byId.get(item)?.hooks?.some(h => h.id === hook)) e.push(`${at}: suppresses "${k}", which doesn't exist`);
      if (suppressedBy.has(k)) e.push(`${at}: "${k}" is already suppressed by ${suppressedBy.get(k)}`);
      suppressedBy.set(k, s.id);
    }
    for (const m of s.stats ?? []) if (!STATS.has(m.stat) || !Number.isFinite(m.value)) e.push(`${at}: bad stat modifier ${m.stat}`);
  }
  return e;
}
