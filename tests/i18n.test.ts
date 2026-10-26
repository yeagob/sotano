import { afterEach, describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/content/enemies';
import { ITEMS } from '../src/content/items';
import { MATERIALS } from '../src/content/materials';
import { SYNERGIES } from '../src/content/synergies';
import { fmtStat } from '../src/core/stats';
import { detectLocale, fmtNum, locale, onLocaleChange, setLocale, t } from '../src/i18n';
import { causeName, effectMessage, enemyText, itemText, materialName, PATHS, pathName } from '../src/i18n/content';
import { LOCALES, type Catalog, type Message } from '../src/i18n/locales';
import { EN } from '../src/i18n/locales/en';
import { buildRun, signature } from './helpers';

afterEach(() => setLocale('en'));

const TRANSLATIONS = LOCALES.filter(l => l !== EN);
const forms = (m: Message) => (typeof m === 'string' ? [m] : Object.values(m));
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
/** Numbers in an effect line, decimal commas read as points ("+0,5" = "+0.5"). */
const numbers = (s: string) => [...s.matchAll(/\d+(?:[.,]\d+)?/g)].map(m => m[0].replace(',', '.')).sort();

/** Every string a catalog holds. */
function* strings(c: Catalog): Generator<[string, string]> {
  for (const [k, m] of Object.entries(c.messages)) for (const f of forms(m)) yield [k, f];
  for (const [kind, byId] of Object.entries(c.content)) for (const [id, v] of Object.entries(byId as Record<string, unknown>)) {
    if (typeof v === 'string') { yield [`${kind}.${id}`, v]; continue; }
    for (const [f, x] of Object.entries(v as Record<string, unknown>)) {
      if (typeof x === 'string') yield [`${kind}.${id}.${f}`, x];
      else for (const [mk, mv] of Object.entries(x as Record<string, string>)) yield [`${kind}.${id}.${f}.${mk}`, mv];
    }
  }
}

describe('catalogs', () => {
  it('locale codes are unique and English is first', () => {
    expect(LOCALES[0]).toBe(EN);
    expect(new Set(LOCALES.map(l => l.code)).size).toBe(LOCALES.length);
  });

  it.each(TRANSLATIONS.map(l => [l.code, l] as const))('%s has every message with the same placeholders', (_, l) => {
    expect(Object.keys(l.messages).sort()).toEqual(Object.keys(EN.messages).sort());
    for (const [k, en] of Object.entries(EN.messages)) {
      const want = placeholders(forms(en).join(' ')).filter((p, i, a) => a.indexOf(p) === i);
      for (const f of forms(l.messages[k as keyof typeof EN.messages])) {
        expect(placeholders(f).filter((p, i, a) => a.indexOf(p) === i), `${l.code} ${k}`).toEqual(want);
      }
    }
  });

  it.each(TRANSLATIONS.map(l => [l.code, l] as const))('%s translates every item, synergy, enemy and material, and nothing else', (_, l) => {
    const c = l.content;
    for (const d of ITEMS) {
      const tr = c.items[d.id];
      expect(tr?.name && tr.description && tr.effect, `${l.code} item ${d.id}`).toBeTruthy();
      for (const id of Object.keys(d.messages ?? {})) expect(tr?.messages?.[id], `${l.code} ${d.id} message ${id}`).toBeTruthy();
    }
    for (const s of SYNERGIES) {
      expect(c.synergies[s.id]?.name && c.synergies[s.id]?.description, `${l.code} synergy ${s.id}`).toBeTruthy();
      for (const id of Object.keys(s.messages ?? {})) expect(c.synergies[s.id]?.messages?.[id], `${l.code} ${s.id} message ${id}`).toBeTruthy();
    }
    for (const e of ENEMIES) expect(c.enemies[e.id]?.name && c.enemies[e.id]?.pattern, `${l.code} enemy ${e.id}`).toBeTruthy();
    for (const m of MATERIALS) expect(c.materials[m.key], `${l.code} material ${m.key}`).toBeTruthy();
    // stale entries: ids that no longer exist
    const ids = new Set(ITEMS.map(i => i.id));
    for (const id of Object.keys(c.items)) expect(ids.has(id), `${l.code} stale item ${id}`).toBe(true);
    for (const id of Object.keys(c.synergies)) expect(SYNERGIES.some(s => s.id === id), `${l.code} stale synergy ${id}`).toBe(true);
    for (const id of Object.keys(c.enemies)) expect(ENEMIES.some(e => e.id === id), `${l.code} stale enemy ${id}`).toBe(true);
    for (const k of Object.keys(c.materials)) expect(MATERIALS.some(m => m.key === k), `${l.code} stale material ${k}`).toBe(true);
    for (const d of ITEMS) for (const id of Object.keys(c.items[d.id]?.messages ?? {})) {
      expect(d.messages?.[id], `${l.code} ${d.id} message ${id} has no English`).toBeDefined();
    }
  });

  it.each(TRANSLATIONS.map(l => [l.code, l] as const))('%s effect lines keep the same numbers as English', (_, l) => {
    // balance changes edit the English: a translation with old numbers would mislead the player
    for (const d of ITEMS) {
      const tr = l.content.items[d.id]?.effect;
      if (tr) expect(numbers(tr), `${l.code} ${d.id}: "${tr}" vs "${d.effect}"`).toEqual(numbers(d.effect));
    }
  });

  it.each(LOCALES.map(l => [l.code, l] as const))('%s has no empty strings and no markup', (_, l) => {
    for (const [k, s] of strings(l)) {
      expect(s.trim(), `${l.code} ${k}`).not.toBe('');
      expect(s, `${l.code} ${k}`).not.toMatch(/[<>]/);
    }
  });

  it('every item message has English text in its definition', () => {
    for (const d of [...ITEMS, ...SYNERGIES]) for (const [id, s] of Object.entries(d.messages ?? {})) expect(s.trim(), `${d.id}.${id}`).not.toBe('');
  });
});

describe('t()', () => {
  it('fills placeholders and formats numbers for the locale', () => {
    expect(t('hud.floor', { n: 3 })).toBe('Floor 3');
    setLocale('es');
    expect(t('hud.floor', { n: 3 })).toBe('Piso 3');
    expect(fmtNum(1.25, 2)).toBe('1,25');
    expect(fmtNum(2.7, 2)).toBe('2,70');
    expect(fmtStat('reach', 5)).toBe('5,0 bloques');
    setLocale('en');
    expect(fmtStat('reach', 5)).toBe('5.0 blocks');
    expect(fmtStat('carry', 1)).toBe('1 block');
  });

  it('picks plural forms', () => {
    setLocale('es');
    expect(t('unit.blocks', { n: 1 })).toBe('1 bloque');
    expect(t('unit.blocks', { n: 4 })).toBe('4 bloques');
  });

  it('falls back to English for a message a catalog lacks', () => {
    const es = LOCALES.find(l => l.code === 'es')!;
    const saved = es.messages['toast.unlocked'];
    try {
      delete (es.messages as Partial<typeof es.messages>)['toast.unlocked'];
      setLocale('es');
      expect(t('toast.unlocked')).toBe('Unlocked');
    } finally { es.messages['toast.unlocked'] = saved; }
  });

  it('notifies on change, not on a no-op', () => {
    let n = 0;
    const off = onLocaleChange(() => n++);
    setLocale('es'); setLocale('es'); setLocale('xx');
    off();
    setLocale('es');
    expect(n).toBe(2); // es, then unknown → English
    expect(locale()).toBe('es');
  });
});

describe('detectLocale', () => {
  it('URL beats the saved choice beats the browser beats English', () => {
    expect(detectLocale({ search: '?lang=es', saved: 'en', languages: ['en-US'] })).toBe('es');
    expect(detectLocale({ search: '', saved: 'es', languages: ['en-US'] })).toBe('es');
    expect(detectLocale({ languages: ['fr-FR', 'es-AR', 'en'] })).toBe('es');
    expect(detectLocale({ search: '?lang=xx', saved: 'yy', languages: ['de'] })).toBe('en');
    expect(detectLocale({})).toBe('en');
  });
});

describe('content texts', () => {
  it('fall back to the definition and never change it', () => {
    const d = ITEMS[0];
    const before = JSON.stringify(d);
    setLocale('es');
    expect(itemText(d).name).not.toBe(d.name);
    expect(JSON.stringify(d)).toBe(before);
    setLocale('en');
    expect(itemText(d)).toEqual({ name: d.name, description: d.description, effect: d.effect, inspiredBy: d.inspiredBy });
    expect(enemyText(ENEMIES[0]).name).toBe(ENEMIES[0].name);
    expect(materialName(MATERIALS[4].id)).toBe(MATERIALS[4].name);
    for (const p of PATHS) expect(pathName(p)).toBe(p);
  });

  it('item messages resolve by id, translated, and are null when unknown', () => {
    const socratic = ITEMS.find(i => i.id === 'socratic')!;
    expect(effectMessage(socratic, 'lock')).toBe(socratic.messages!.lock);
    setLocale('es');
    expect(effectMessage(socratic, 'lock')).toMatch(/cerradura/);
    expect(effectMessage(socratic, 'nope')).toBeNull();
  });

  it('every damage source the game uses names its cause', () => {
    const unknown = t('cause.unknown');
    const sources = [
      ...ENEMIES.map(e => e.id), ...ENEMIES.map(e => `enemy:${e.id}`), ...ITEMS.map(i => i.id),
      ...ITEMS.flatMap(i => i.causes ?? []),
      'bomb', 'judgement', 'contact', 'item', 'console', 'explosion:bomb',
    ];
    for (const code of LOCALES.map(l => l.code)) {
      setLocale(code);
      for (const s of sources) {
        const name = causeName(s);
        expect(name, `${code} ${s}`).not.toBe(unknown);
        expect(name.trim(), `${code} ${s}`).not.toBe('');
      }
    }
    setLocale('es');
    expect(causeName('enemy:panic')).toBe('Pánico');
    expect(causeName('volatile')).toBe('Acto simbólico');
    expect(causeName('???')).toBe(t('cause.unknown'));
  });
});

describe('determinism', () => {
  it('the language never changes a run', () => {
    setLocale('en');
    const en = signature(buildRun(0xBEEF));
    setLocale('es');
    expect(signature(buildRun(0xBEEF))).toBe(en);
  });
});
