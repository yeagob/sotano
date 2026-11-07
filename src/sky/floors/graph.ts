// Helpers over a floor's graph of places (docs/architecture/SKY.md §5.6). Pure: no three.js, no state.
// Links are walked both ways: a route is a route for the floor tests and for minions, whatever the move's name.

import type { FloorGraph, Link, Move, Place, PlaceKind } from '../types';

export const placeById = (g: FloorGraph, id: number): Place | null =>
  g.places.find(p => p.id === id) ?? null;

export const linksOf = (g: FloorGraph, id: number): readonly Link[] =>
  g.links.filter(l => l.a === id || l.b === id);

/** The nearest place to a point (its walking cell, measured from the cell's centre), of one of `kinds` when given. */
export function nearest(g: FloorGraph, x: number, y: number, z: number, kinds?: readonly PlaceKind[]): Place | null {
  let best: Place | null = null;
  let bestD = Infinity;
  for (const p of g.places) {
    if (kinds && !kinds.includes(p.kind)) continue;
    const dx = p.x + 0.5 - x, dy = p.y - y, dz = p.z + 0.5 - z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

/** Place ids from `from` to `to` using only `moves`, the fewest links first; null when there is no route. */
export function route(g: FloorGraph, from: number, to: number, moves: readonly Move[]): number[] | null {
  if (!placeById(g, from) || !placeById(g, to)) return null;
  const prev = new Map<number, number>([[from, from]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i];
    if (at === to) break;
    for (const l of g.links) {
      if (!moves.includes(l.move)) continue;
      const next = l.a === at ? l.b : l.b === at ? l.a : -1;
      if (next < 0 || prev.has(next)) continue;
      prev.set(next, at);
      queue.push(next);
    }
  }
  if (!prev.has(to)) return null;
  const out = [to];
  for (let at = to; at !== from; at = prev.get(at)!) out.push(prev.get(at)!);
  return out.reverse();
}
