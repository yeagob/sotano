import { describe, expect, it } from 'vitest';
import { MENDED_SEAM_S, MENDED_TAG, ReleaseLog, countsAsRelease, projectionToMend } from '../src/content/presences/mended';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

describe("the Mender brings a released projection back as an ally (owner, #228, D9)", () => {
  it('keeps the releases of each floor in order, and forgets them at a new run', () => {
    const log = new ReleaseLog();
    log.record(3, 'doubt');
    log.record(4, 'panic');
    log.record(3, 'craving');
    expect(log.on(3)).toEqual(['doubt', 'craving']);
    expect(log.on(4)).toEqual(['panic']);
    expect(log.on(5)).toEqual([]);
    log.clear();
    expect(log.on(3)).toEqual([]);
  });

  it('brings back the last projection released on its floor, and nothing when none was', () => {
    expect(projectionToMend(['doubt', 'craving'])).toBe('craving');
    expect(projectionToMend([])).toBeNull();
  });

  it('a boss, a presence or an ally already mended is no release to mend: it comes back once', () => {
    expect(countsAsRelease('projection', new Set())).toBe(true);
    expect(countsAsRelease(undefined, new Set(['rooted']))).toBe(true);
    expect(countsAsRelease('boss', new Set())).toBe(false);
    expect(countsAsRelease('projection', new Set(['presence']))).toBe(false);
    expect(countsAsRelease('projection', new Set([MENDED_TAG]))).toBe(false);
  });

  it('its seam is under the 3 Hz rule, and its line exists in English and Spanish', () => {
    expect(1 / MENDED_SEAM_S).toBeLessThan(3);
    expect(EN.messages['presence.mender.return']).toBeTruthy();
    expect(ES.messages['presence.mender.return']).toBeTruthy();
  });
});
