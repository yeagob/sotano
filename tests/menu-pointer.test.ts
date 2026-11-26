// #356: on the keyboard and mouse, pointer lock is taken only for play. A press inside a menu (the pause card, the menu
// panel and the screen: #overlay, marked data-menu) never captures the mouse, so the pointer stays visible and every
// control gets its click the first time. The node test environment has no DOM: the window and document are stubbed with
// just what Input touches, and elements are small objects with a parent chain and closest().
import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { backdropResumes, hoverRedraws } from '../src/game/menu-pointer';

type Handler = (e: unknown) => void;
const winH = new Map<string, Handler[]>();
const docH = new Map<string, Handler[]>();
const on = (m: Map<string, Handler[]>) => (type: string, fn: Handler) => { m.set(type, [...(m.get(type) ?? []), fn]); };
const fire = (m: Map<string, Handler[]>, type: string, e: unknown = {}) => { for (const fn of m.get(type) ?? []) fn(e); };

const doc = {
  pointerLockElement: null as unknown,
  hidden: false,
  exits: 0,
  addEventListener: on(docH),
  exitPointerLock() { this.exits++; },
};
const g = globalThis as Record<string, unknown>;
g.addEventListener = on(winH);
g.document = doc;

/** A stand-in element: its attributes, its parent, and closest() for the one selector the code asks. */
interface El { attrs: Record<string, string>; parent: El | null; closest(sel: string): El | null }
function el(attrs: Record<string, string>, parent: El | null = null): El {
  return {
    attrs, parent,
    closest(sel: string) {
      const name = /^\[([\w-]+)\]$/.exec(sel)?.[1];
      for (let n: El | null = this; n; n = n.parent) if (name && name in n.attrs) return n;
      return null;
    },
  };
}

let requests = 0;
const canvas = { requestPointerLock() { requests++; } };
let InputClass: typeof import('../src/input/input').Input;
let capturesMouse: typeof import('../src/input/input').capturesMouse;

beforeAll(async () => {
  const mod = await import('../src/input/input');
  InputClass = mod.Input; capturesMouse = mod.capturesMouse;
});

// the menu panel as index.html lays it out: one control per section
const overlay = el({ id: 'overlay', 'data-menu': '' });
const card = el({ class: 'card' }, overlay);
const tabs = el({ class: 'tabs' }, card);
const actions = el({ class: 'actions' }, card);
const lang = el({ id: 'lang' }, actions);
const graphics = el({ id: 'graphics' }, actions);
const completion = el({ id: 'completion' }, actions);
const inventory = el({ id: 'inventory' }, card);
const footer = el({ class: 'credits' }, card);
const CONTROLS: [string, El][] = [
  ['tab Practices', el({ 'data-act': 'tab-items' }, tabs)],
  ['tab Star map', el({ 'data-act': 'tab-map' }, tabs)],
  ['Click to play', el({ 'data-act': 'resume' }, actions)],
  ['New run', el({ 'data-act': 'restart', id: 'newrun' }, actions)],
  ['a language', el({ 'data-lang': 'es' }, lang)],
  ['field of view −', el({ 'data-act': 'fov-down' }, el({ class: 'row' }, graphics))],
  ['field of view bar', el({ id: 'fov' }, el({ class: 'row' }, graphics))],
  ['download the book', el({ 'data-act': 'book-download' }, completion)],
  ['the seed', el({ class: 'seed' }, actions)],
  ['a practice tile', el({ class: 'tile', 'data-id': 'item:0' }, inventory)],
  ['the repository link', el({ href: 'https://github.com/yeagob/sotano' }, footer)],
];

describe('pointer lock on the keyboard and mouse (#356)', () => {
  let input: InstanceType<typeof InputClass>;
  const lockNow = (locked: boolean) => { doc.pointerLockElement = locked ? canvas : null; fire(docH, 'pointerlockchange'); };
  const press = (target: unknown) => fire(docH, 'mousedown', { target, button: 0 });

  beforeEach(() => {
    winH.clear(); docH.clear(); requests = 0; doc.exits = 0; doc.pointerLockElement = null;
    input = new InputClass(canvas as unknown as HTMLElement);
  });

  it('a press on the game view captures the mouse, and play begins when the lock arrives', () => {
    press(canvas);
    expect(requests).toBe(1);
    lockNow(true);
    expect(input.locked).toBe(true);
    expect(input.playing).toBe(true);
  });

  it('Esc (the browser drops the lock) pauses; then no press in the pause card captures the mouse', () => {
    press(canvas); lockNow(true);
    lockNow(false);
    expect(input.playing).toBe(false);
    requests = 0;
    for (const [, c] of CONTROLS) press(c);
    press(card);
    expect(requests).toBe(0);
    expect(input.locked).toBe(false);
  });

  it('the screen opened in play releases the lock, and its presses never take it back', () => {
    press(canvas); lockNow(true);
    input.unlockFor();
    expect(doc.exits).toBe(1);
    lockNow(false);
    expect(input.engaged).toBe(true);
    requests = 0;
    for (const [, c] of CONTROLS) press(c);
    expect(requests).toBe(0);
  });

  it('the screen opened from the pause (no lock to release) keeps the pointer free too', () => {
    input.unlockFor();
    expect(input.engaged).toBe(false);
    press(CONTROLS.find(([n]) => n === 'a practice tile')![1]);
    expect(requests).toBe(0);
  });

  it('play starts from the menu by its own click: resume() asks for the lock', () => {
    press(CONTROLS.find(([n]) => n === 'Click to play')![1]);
    expect(requests).toBe(0);
    input.resume();
    expect(requests).toBe(1);
  });

  it('the pause from the pause key releases the lock', () => {
    press(canvas); lockNow(true);
    input.release();
    expect(doc.exits).toBe(1);
    lockNow(false);
    expect(input.playing).toBe(false);
  });

  it('capturesMouse: only outside data-menu', () => {
    expect(capturesMouse(null)).toBe(true);
    expect(capturesMouse(canvas as unknown as EventTarget)).toBe(true);
    expect(capturesMouse(el({ id: 'death' }) as unknown as EventTarget)).toBe(true);
    for (const [, c] of CONTROLS) expect(capturesMouse(c as unknown as EventTarget)).toBe(false);
  });
});

describe('every main menu control is inside the menu and does what its label says (#356)', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const game = readFileSync(new URL('../src/game/game.ts', import.meta.url), 'utf8');
  const start = html.indexOf('<div id="overlay"');
  const block = html.slice(start, html.indexOf('<div id="rotate"'));

  it('#overlay is marked data-menu, and holds every section of the panel', () => {
    expect(html.slice(start, html.indexOf('>', start))).toContain('data-menu');
    for (const id of ['class="tabs"', 'id="play"', 'id="newrun"', 'id="lang"', 'id="graphics"', 'id="completion"', 'id="seed"', 'id="codex"', 'class="credits"', 'id="inventory"', 'id="starmap"', 'id="recipebook"']) {
      expect(block, id).toContain(id);
    }
  });

  it('each data-act of the panel has its action in Game.act', () => {
    const acts = [...block.matchAll(/data-act="([\w-]+)"/g)].map(m => m[1]);
    expect(acts).toEqual(expect.arrayContaining(['tab-menu', 'tab-items', 'tab-map', 'tab-recipes', 'resume', 'restart', 'fov-down', 'fov-up']));
    for (const a of acts) expect(game, a).toContain(`act === '${a}'`);
    expect(game).toContain("act === 'book-download'");
  });

  it('a hover redraws the practices only when the highlight moves', () => {
    expect(hoverRedraws(null, 'item:0')).toBe(true);
    expect(hoverRedraws('item:0', 'item:1')).toBe(true);
    expect(hoverRedraws('item:1', 'item:1')).toBe(false);
  });

  it('a click on the pause card backdrop starts play on the mouse only, never on its scrollbar or with the screen open', () => {
    const base = { device: 'keyboard' as const, screenOpen: false, onBackdrop: true, offsetX: 10, clientWidth: 800 };
    expect(backdropResumes(base)).toBe(true);
    expect(backdropResumes({ ...base, onBackdrop: false })).toBe(false);
    expect(backdropResumes({ ...base, offsetX: 805 })).toBe(false);
    expect(backdropResumes({ ...base, screenOpen: true })).toBe(false);
    expect(backdropResumes({ ...base, device: 'touch' })).toBe(false);
    expect(backdropResumes({ ...base, device: 'gamepad' })).toBe(false);
  });
});
