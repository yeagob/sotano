export const FEAR_FLIGHT = 3;
export const FEAR_REST_MIN = 5;
export const FEAR_REST_MAX = 10;

export function frightenProjection(e: { fear: number; fearRest: number }, next: () => number): boolean {
  if (e.fear > 0 || e.fearRest > 0) return false;
  e.fear = FEAR_FLIGHT;
  e.fearRest = FEAR_REST_MIN + (FEAR_REST_MAX - FEAR_REST_MIN) * next();
  return true;
}

export function tickFearRest(e: { fear: number; fearRest: number }, dt: number): void {
  if (e.fear <= 0 && e.fearRest > 0) e.fearRest = Math.max(0, e.fearRest - dt);
}
