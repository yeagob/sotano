export const FEAR_REST_MIN = 5;
export const FEAR_REST_MAX = 10;

export function frightenProjection(e: { fear: number; fearRest: number }, seconds: number, roll: number): boolean {
  if (!(seconds > 0) || e.fear > 0 || e.fearRest > 0) return false;
  e.fear = seconds;
  e.fearRest = FEAR_REST_MIN + (FEAR_REST_MAX - FEAR_REST_MIN) * roll;
  return true;
}

export function tickFearRest(e: { fear: number; fearRest: number }, dt: number): void {
  if (e.fear <= 0 && e.fearRest > 0) e.fearRest = Math.max(0, e.fearRest - dt);
}
