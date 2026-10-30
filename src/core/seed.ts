// Run seeds as short, shareable codes (docs/architecture/RNG.md §3).
//
// A code is 8 characters from a 32-letter alphabet without look-alikes (no I, O, 0, 1), shown
// as "ABCD EFGH". It carries exactly the 32-bit root seed plus an 8-bit checksum (Isaac-style):
// every code maps to exactly one run and every run to exactly one code, and a typo is rejected
// instead of silently starting a different run. New runs get a root from the browser's crypto
// RNG: the only place true randomness enters the game. Everything else derives from the root.

export const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SEED_LENGTH = 8;

/**
 * Bumped by hand at releases when generation changes enough that old codes produce different
 * runs. It is shown next to the code ("ABCD EFGH · v1"); it is not mixed into the root.
 */
export const GEN_VERSION = 21;

/** A fresh random 32-bit root (crypto when available). */
export function randomRoot(): number {
  const buf = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(buf);
  else buf[0] = (Date.now() * 2654435761) >>> 0; // non-browser fallback (tests, tools) only
  return buf[0] >>> 0;
}

function checksum(root: number): number {
  return mix32(root ^ 0x5eed5eed) & 0xff;
}

/** 32-bit root → "ABCDEFGH": the 40-bit number checksum·2³² + root, in base 32 (exact in a double). */
export function encodeSeed(root: number): string {
  let v = checksum(root >>> 0) * 2 ** 32 + (root >>> 0);
  let out = '';
  for (let i = 0; i < SEED_LENGTH; i++) { out = SEED_ALPHABET[v % 32] + out; v = Math.floor(v / 32); }
  return out;
}

/** "abcd-efgh" / "ABCD EFGH" → its root, or null if it isn't a valid code (length, letter or checksum). */
export function decodeSeed(input: string): number | null {
  const s = input.toUpperCase().replace(/[\s\-_]/g, '');
  if (s.length !== SEED_LENGTH) return null;
  let v = 0;
  for (const ch of s) {
    const d = SEED_ALPHABET.indexOf(ch);
    if (d < 0) return null;
    v = v * 32 + d;
  }
  const root = v % 2 ** 32, ck = Math.floor(v / 2 ** 32);
  return checksum(root) === ck ? root : null;
}

/** "ABCDEFGH" → "ABCD EFGH". */
export function formatSeed(code: string): string {
  return `${code.slice(0, 4)} ${code.slice(4)}`;
}

/** Murmur3 finaliser: a cheap, well-distributed 32-bit mix. */
export function mix32(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
