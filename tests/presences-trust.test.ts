import { describe, expect, it } from 'vitest';
import { DONE_CHOICE, DONE_GIFTS, HONEST_STILL_S, StillWatch, TRUST_START, TRUST_TOP, answerDone, doneGift } from '../src/content/presences/trust';
import { defaultMeta, loadMeta, mergeMeta, saveMeta, type MetaStore } from '../src/game/meta';
import { AchievementKeeper } from '../src/game/achievement-keeper';
import { offerList } from '../src/game/hud';
import { EN } from '../src/i18n/locales/en';
import { ES } from '../src/i18n/locales/es';

const memory = (): MetaStore & { raw: string | null } => {
  const s = { raw: null as string | null, read: () => s.raw, write: (v: string) => { s.raw = v; } };
  return s;
};

describe('the trust meter and "Have you done it?" (REQUESTS.md; #235, #228 D7)', () => {
  it('starts at the top; an honest completion raises it one step, an early yes lowers it one, inside 0 to the top', () => {
    expect(TRUST_START).toBe(TRUST_TOP);
    expect(answerDone(TRUST_TOP, HONEST_STILL_S)).toBe(TRUST_TOP);
    expect(answerDone(TRUST_TOP, HONEST_STILL_S - 0.1)).toBe(TRUST_TOP - 1);
    expect(answerDone(1, 45)).toBe(2);
    expect(answerDone(0, 0)).toBe(0);
  });

  it('every step gives a gift, never nothing, the smallest at the bottom', () => {
    expect(DONE_GIFTS).toHaveLength(TRUST_TOP + 1);
    for (let k = 0; k <= TRUST_TOP; k++) expect(doneGift(k)).toBeDefined();
    expect(doneGift(TRUST_TOP)).toEqual({ type: 'heart', heart: 'blue' });
    expect(doneGift(0)).toEqual({ type: 'bomb' });
    expect(doneGift(-5)).toEqual(doneGift(0));
    expect(doneGift(99)).toEqual(doneGift(TRUST_TOP));
  });

  it('counts the longest stretch with no input inside a window, on game time', () => {
    const w = new StillWatch();
    w.start(1);
    for (let i = 0; i < 20; i++) w.tick(1, false);
    w.tick(0.1, true);
    for (let i = 0; i < 10; i++) w.tick(1, false);
    expect(w.take(1)).toBe(20);
    expect(w.take(1)).toBe(0);
  });

  it('the card asks one question with one answer (the choice card adds Not now), in both languages, the same words for both readings', () => {
    expect(DONE_CHOICE.options).toEqual(['request.done.yes']);
    for (const k of ['request.done.question', 'request.done.yes', 'request.done.thanks', 'request.done.later'] as const) {
      expect(EN.messages[k]).toBeTruthy();
      expect(ES.messages[k]).toBeTruthy();
    }
  });

  it('the save keeps only the count of requests answered, merged by the higher, and the sandbox writes nothing', () => {
    const store = memory();
    const live = new AchievementKeeper(loadMeta(store), store);
    live.recordRequest();
    live.recordRequest();
    expect(loadMeta(store).requests).toBe(2);
    expect(Object.keys(JSON.parse(store.raw!)).filter(k => /trust/i.test(k))).toEqual([]);
    expect(mergeMeta({ ...defaultMeta(), requests: 5 }, { ...defaultMeta(), requests: 3 }).requests).toBe(5);
    expect(saveMeta({ ...defaultMeta(), requests: -1 }, memory())?.requests).toBeUndefined();
    const sandboxStore = memory();
    const sandbox = new AchievementKeeper(loadMeta(sandboxStore), sandboxStore);
    sandbox.live = false;
    sandbox.recordRequest();
    expect(sandboxStore.raw).toBeNull();
  });
});

describe('multi-part agreement cards name every object (AGREEMENTS.md; #233, #228 D11)', () => {
  it('lists one, two or three objects in one phrase of the player language', () => {
    expect(offerList(['A'])).toBe('A');
    expect(offerList(['A', 'B'])).toBe(String(EN.messages['presence.offer.two']).replace('{a}', 'A').replace('{b}', 'B'));
    expect(offerList(['A', 'B', 'C'])).toContain('C');
    expect(ES.messages['presence.offer.two']).toContain('{b}');
    expect(ES.messages['presence.offer.three']).toContain('{c}');
  });
});
