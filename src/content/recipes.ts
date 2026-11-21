import type { Carried } from '../entities/player';
import { MAT, ORES } from './materials';
import type { PathName } from './palette';
import type { PartDef, PartKind } from './parts';
import { echoPick } from './echo';
import { lineageOf, pathOf } from './patterns';
import { isFlask, POTIONS, type Flask, type PotionId } from './potions';

export interface PartSlot { part: PartKind; pattern?: string; lineage?: string; path?: PathName }
export interface MaterialSlot { materials: readonly number[] }
export type Slot = PartSlot | MaterialSlot;

export interface Recipe {
  potion: PotionId;
  slots: readonly Slot[];
  patterns?: 'same' | 'distinct';
}

export const ICE = MAT.ice;
export const FALLBACK: PotionId = 'plain-tonic';
export const ECHO: PotionId = 'echo-draught';

export type FamilyPath = 'body' | 'mind' | 'emotion' | 'will';
export type DeepKind = Exclude<PartKind, 'flesh'>;

export const FLESH_TONICS: readonly PotionId[] = ['mending-tonic', 'restoring-draught', 'full-restoring-draught'];

export const FAMILIES: Readonly<Record<FamilyPath, Readonly<Record<DeepKind, PotionId>>>> = {
  body: { mind: 'nimble-tincture', heart: 'nimble-cordial', essence: 'nimble-elixir' },
  mind: { mind: 'lucid-tincture', heart: 'lucid-cordial', essence: 'lucid-elixir' },
  emotion: { mind: 'tender-tincture', heart: 'tender-cordial', essence: 'tender-elixir' },
  will: { mind: 'steadfast-tincture', heart: 'steadfast-cordial', essence: 'steadfast-elixir' },
};

export const KIND_DEPTH: Readonly<Record<PartKind, number>> = { flesh: 0, mind: 1, heart: 2, essence: 3 };

export const RECIPES: readonly Recipe[] = [
  { potion: 'restoring-draught', slots: [{ part: 'flesh' }, { part: 'flesh' }] },
  { potion: 'footing-tincture', slots: [{ part: 'flesh', path: 'body' }, { materials: [MAT.deepstone, MAT.obsidian] }] },
  { potion: 'spring-tonic', slots: [{ part: 'heart', path: 'body' }] },
  { potion: 'clear-infusion', slots: [{ part: 'mind', path: 'mind' }, { part: 'mind', path: 'mind' }], patterns: 'distinct' },
  { potion: 'questioning-tincture', slots: [{ part: 'mind', lineage: 'doubt' }, { materials: ORES }] },
  { potion: 'ember-tonic', slots: [{ part: 'heart', path: 'will' }] },
  { potion: 'berserker-draught', slots: [{ part: 'heart', path: 'will' }, { part: 'heart', path: 'will' }, { materials: [MAT.obsidian] }] },
  { potion: 'patient-draught', slots: [{ part: 'heart', path: 'will' }, { part: 'mind', path: 'will' }], patterns: 'same' },
  { potion: 'stride-tonic', slots: [{ part: 'mind', path: 'body' }] },
  { potion: 'folding-tincture', slots: [{ part: 'mind', path: 'body' }, { materials: [MAT.dirt] }] },
  { potion: 'rebirth-draught', slots: [{ part: 'heart', path: 'will' }, { part: 'mind', path: 'mind' }, { part: 'flesh', path: 'body' }] },
];

export const SLOT_LEVEL = { exact: 3, lineage: 2, path: 1, any: 0 } as const;

export function slotLevel(s: Slot): number {
  if ('materials' in s || s.pattern) return SLOT_LEVEL.exact;
  return s.lineage ? SLOT_LEVEL.lineage : s.path ? SLOT_LEVEL.path : SLOT_LEVEL.any;
}

export function specificity(r: Recipe): readonly [number, number] {
  return [r.slots.reduce((n, s) => n + slotLevel(s), 0), r.slots.length];
}

const moreSpecific = (a: readonly [number, number], b: readonly [number, number]) => a[0] - b[0] || a[1] - b[1];

function fits(s: Slot, c: Carried): boolean {
  if ('materials' in s) return typeof c === 'number' && s.materials.includes(c);
  if (typeof c !== 'object' || isFlask(c) || c.kind !== s.part) return false;
  if (s.pattern && c.source !== s.pattern) return false;
  if (s.lineage && lineageOf(c.source) !== s.lineage) return false;
  return !s.path || pathOf(c.source) === s.path;
}

function permutations<T>(xs: readonly T[]): T[][] {
  if (xs.length <= 1) return [[...xs]];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map(rest => [x, ...rest]));
}

function patternsHold(r: Recipe, cubes: readonly Carried[]): boolean {
  if (!r.patterns) return true;
  const sources = cubes.flatMap(c => (typeof c === 'object' && !isFlask(c) ? [c.source] : []));
  const distinct = new Set(sources).size;
  return r.patterns === 'same' ? distinct <= 1 : distinct === sources.length;
}

export function matches(r: Recipe, cubes: readonly Carried[]): boolean {
  if (cubes.length !== r.slots.length || !patternsHold(r, cubes)) return false;
  return permutations(cubes).some(order => order.every((c, i) => fits(r.slots[i], c)));
}

export function withoutIce(bulb: readonly Carried[]): Carried[] {
  return bulb.filter(c => c !== ICE);
}

export function topMatches(bulb: readonly Carried[]): Recipe[] {
  const cubes = withoutIce(bulb);
  let top: Recipe[] = [];
  for (const r of RECIPES) {
    if (!matches(r, cubes)) continue;
    const d = top.length ? moreSpecific(specificity(r), specificity(top[0])) : 1;
    if (d > 0) top = [r];
    else if (d === 0) top.push(r);
  }
  return top;
}

export function partsOf(cubes: readonly Carried[]): PartDef[] {
  return cubes.flatMap(c => (typeof c === 'object' && !isFlask(c) ? [c] : []));
}

const isFamilyPath = (p: string | null): p is FamilyPath => p !== null && p in FAMILIES;

function pathsOf(parts: readonly PartDef[]): (string | null)[] {
  return [...new Set(parts.map(p => pathOf(p.source)))];
}

export function familyOf(bulb: readonly Carried[]): PotionId | null {
  const parts = partsOf(withoutIce(bulb));
  if (!parts.length) return null;
  const deep = parts.filter(p => p.kind !== 'flesh');
  if (!deep.length) return FLESH_TONICS[Math.min(parts.length, FLESH_TONICS.length) - 1];
  const paths = pathsOf(parts);
  if (paths.length !== 1 || !isFamilyPath(paths[0])) return null;
  const kind = deep.reduce((a, p) => (KIND_DEPTH[p.kind] > KIND_DEPTH[a] ? p.kind : a), deep[0].kind) as DeepKind;
  return FAMILIES[paths[0]][kind];
}

const cubeKey = (c: Carried) => (typeof c === 'number' ? `m${c}` : isFlask(c) ? `f.${c.potion}` : c.id);

export function bulbKey(bulb: readonly Carried[]): string {
  return withoutIce(bulb).map(cubeKey).sort().join('|');
}

export function echoOf(bulb: readonly Carried[]): string | null {
  const parts = partsOf(withoutIce(bulb));
  if (!parts.some(p => p.kind !== 'flesh')) return null;
  const paths = pathsOf(parts).filter((p): p is string => p !== null);
  if (paths.length < 2) return null;
  return echoPick(paths, bulbKey(bulb));
}

export function resolve(bulb: readonly Carried[]): Flask {
  const named = topMatches(bulb)[0]?.potion ?? familyOf(bulb);
  const echo = named ? null : echoOf(bulb);
  const potion = named ?? (echo ? ECHO : FALLBACK);
  const flask: Flask = echo ? { potion, echo } : { potion };
  if (withoutIce(bulb).length < bulb.length && POTIONS[potion].duration.kind === 'rooms') flask.iced = true;
  return flask;
}

export const brewOf = (bulb: readonly Carried[]): PotionId => resolve(bulb).potion;
