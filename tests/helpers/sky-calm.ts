import type { DeityDef } from '../../src/sky/types';

export function calm(def: DeityDef): DeityDef {
  const out = Object.defineProperties({}, Object.getOwnPropertyDescriptors(def)) as DeityDef & { chase?: unknown };
  delete out.chase;
  return out;
}
