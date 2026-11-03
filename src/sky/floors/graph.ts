// Helpers over a floor's graph of places (docs/architecture/SKY.md §5.6). Stub (K0): C0 builds them.

import type { FloorGraph, Link, Move, Place, PlaceKind } from '../types';

export const placeById = (_g: FloorGraph, _id: number): Place | null => null;
export const linksOf = (_g: FloorGraph, _id: number): readonly Link[] => [];
/** The nearest place to a point, of one of `kinds` when given. */
export const nearest = (_g: FloorGraph, _x: number, _y: number, _z: number, _kinds?: readonly PlaceKind[]): Place | null => null;
/** Place ids from `from` to `to` using only `moves`; null when there is no route. */
export const route = (_g: FloorGraph, _from: number, _to: number, _moves: readonly Move[]): number[] | null => null;
