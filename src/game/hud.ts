// DOM HUD. Isaac-style corner: hearts, bombs and keys (capped at 99); item icons; minimap and
// floor; hand slots; the pickup banner (icon, quality, what it changed, new synergies) with a
// screen flash; damage vignette and screen shake; the screen (menu and practices, one window with
// two tabs: Esc and Tab open it, the touch tab button too); the death screen;
// toasts; the language selector on the pause card; and the debug readout (English on purpose:
// it is for developers). Every player-facing word goes through i18n (docs/architecture/
// LOCALIZATION.md); `relocalize()` redraws whatever is on screen when the language changes.

import { heartQuarters, HEART } from '../entities/actors';
import { heartCount } from '../entities/hearts';
import { BERSERKER_FRAME, HEART_HUD, STAR_GLOW } from '../content/heart-art';
import { SYNERGIES } from '../content/synergies';
import { BASE_STATS, fmtStat, statLabel, type StatName } from '../core/stats';
import { fill, fmtNum, locale, locales, onLocaleChange, t, type MessageKey, type Params } from '../i18n';
import { effectMessage, tieredCause, isPath, itemText, materialName, partText, pathName, practiceTeaching, synergyText } from '../i18n/content';
import { chooseLocale } from '../i18n/dom';
import { copyMods, type ItemDef, type Req, type SynergyDef } from '../items/types';
import { isPromised } from '../items/pool';
import type { Polarity } from '../combat/polarity';
import type { Tier } from '../enemies/tiers';
import { HUD_ICONS } from '../content/hud-icons';
import { palCss, PATH_GLYPH, type PalToken, type PathName } from '../content/palette';
import { materialTexture } from '../render/atlas';
import { applyPaletteCss, hudIconUrl, iconDataUrl, qualityStars } from '../render/icons';
import { createSpiritRing, paintSpiritRing } from '../render/spirit-ring';
import { ROOM_ID_STRIDE, type FloorResult } from '../world/floor';
import { AIR } from '../content/materials';
import { ARROW_BORDER, ARROW_BORDER_PX, arrowFill, bandRange, MAP_CELL, MAP_PAD, mapPlace as placeOnMap, mapPx, TUNNEL_TONE, tunnelRect, type MapPlace } from './minimap';
import { level, tollOf } from '../content/levels';
import { carriedDef, flaskIcon, flaskRooms, isFlask, POTIONS, type Flask } from '../content/potions';
import { flaskEffect, flaskName } from '../content/potion-text';
import { handTollIds, heartTollIds, heartTollPlan, splitHeartPicks } from './toll';
import { MeditationView } from './meditation-view';
import type { Game } from './game';
import { PHASE_WARN_S } from './phase';
import { hurtEdge } from './hurt-feedback';
import type { Carried } from '../entities/player';
import { visibleControlRows, type ControlRow, type Device } from '../input/bindings';
import { practiceReleaseCloses } from '../input/gestures';
import { activeDevice, onDeviceChange } from '../input/input';
import { controlKey, controlParams, forDevice, keyLabel } from '../input/labels';
import type { CardKeys } from './achievement-keeper';
import { PARTS, partPercent, type Completion } from './completion';
import { bookButtonHtml } from './book-download';
import { FOV_DEFAULT, FOV_MAX, FOV_MIN, FOV_STEP } from './settings';
import { PRESENCE_TALK, type PresenceId } from '../content/presences';
import { COVENANT_PIECES } from '../content/presences/covenant';
import { mapKeyOutcome, starMapHtml } from './star-map';
import { backdropResumes, hoverRedraws } from './menu-pointer';
import { recipeBook, recipeBookHtml, recipesKeyOutcome } from './recipe-book';

const $ = (id: string) => document.getElementById(id)!;
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** A message, escaped for innerHTML. */
const th = (key: MessageKey, params?: Params) => esc(t(key, params));
/** A parameter of the Presence card: text, a number, or a function that gives the text on each redraw (see presenceCard). */
export type CardParams = Record<string, string | number | (() => string)>;
interface CardSpec { nameKey: MessageKey; lineKeys: readonly MessageKey[]; params?: CardParams; kicker?: MessageKey; onRead?: () => void }
/** A heart's name in the toll window, with its quarters when it is not whole (the window's tiles show them). */
const tollHeartLabel = (name: string, quarters: number) => (quarters >= 4 ? name : t('toll.heartPart', { name, q: quarters }));

const STAT_ORDER: StatName[] = [
  'damage', 'fireRate', 'shotSpeed', 'range', 'gravity', 'size', 'mining',
  'moveSpeed', 'jump', 'maxHearts', 'invuln', 'carry', 'kick', 'throw', 'crush', 'headbutt', 'missile', 'reach',
  'bombRadius', 'bombDamage', 'luck',
];

/** Path chips: the path's base colour, always next to its glyph and word (§10.2). */
const pathColor = (p: string) => palCss(`path.${p}.base` as PalToken);
/** Minimap tones (docs/art/DECISIONS.md §10.2). */
const MAP = {
  unvisited: palCss('bone.faded'), visited: palCss('ink.ash'), cleared: palCss('light.gold'), current: palCss('bone.paper'),
  treasure: palCss('light.gold'), vault: palCss('brass.base'), boss: palCss('cold.white'), start: palCss('bone.dim'), challenge: palCss('cold.body'),
  tunnel: palCss(TUNNEL_TONE),
};
/** Seconds between two looks at the tunnels while the player digs: the map follows the digging without a frame's cost. */
const TUNNEL_REFRESH_S = 0.25;
/** A full-screen effect may not retrigger within this many ms (the flash budget, §10.4). */
const FLASH_BUDGET_MS = 333;

/** A presence's request as the consent card shows it: what it asks, and the alternative (requests.ts, REQUESTS.md). */
export interface PresenceRequestText { ask: MessageKey; alt: MessageKey }

/** "Floor 3 · The rain": the number and the circle's image (docs/design/LEVELS.md). */
export function floorLabel(depth: number): string {
  return `${t('hud.floor', { n: depth })} · ${t(`level.${level(depth).key}` as MessageKey)}`;
}

/** The tabs of the screen: the menu (pause, controls, language), the practices, the star map (D15 of #149), and the
 *  Recipe Book (only while the Book of Secrets is held: the `recipes` stat). */
export type ScreenTab = 'menu' | 'items' | 'map' | 'recipes';

/** The objects of one exchange in one phrase, in the player's language: "A", "A and B" or "A, B and C" (one message per
 *  count, so the word order can change). A card names at most three (MAX_OFFER_PARTS), so a fourth is never asked for. */
export function offerList(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return t('presence.offer.two', { a: names[0], b: names[1] });
  return t('presence.offer.three', { a: names[0], b: names[1], c: names[2] });
}

/** The answers an offer card shows in place of a presence's own (the Rebirth Draught asks on the same card). */
export interface OfferAnswers { accept: MessageKey; decline: MessageKey; controls: MessageKey }

export class Hud {
  private hand = $('hand');
  /** The held-item label above the hand (a flask or meal in hand; see `updateHeld`). */
  private heldEl = $('held');
  private itemsBar = $('items');
  private debugEl = $('debug');
  private overlay = $('overlay');
  private bannerEl = $('banner');
  /** The achievement notice's own element (sotano-popups §2): a corner panel, not the banner. */
  private achievementEl = $('achievement');
  private lastAchievement: { keys: CardKeys; level: number } | null = null;
  /** Time the achievement notice has left on screen, in ms. It runs on game time (`update`), so a pause holds it. */
  private achievementLeft = 0;
  private achievementDone: (() => void) | undefined;
  private toastEl = $('toast');
  private bossEl = $('boss');
  private bossFill = $('bossfill');
  private bossLove = $('bosslove');
  private bossName = $('bossname');
  private heartsEl = $('hearts');
  private heartsRow = $('hearts-row');
  /** The spirit (sky only): its outline round the hearts and its number; -1 until first drawn. */
  private spiritRing = createSpiritRing();
  private spiritNum = $('spirit-num');
  private spiritShown = -1;
  private breathEl = $('breath');
  private breathKey = '';
  private bombsEl = $('bombs');
  private keysEl = $('keys');
  private polarityEl = $('polarity');
  /** The corner of counters: it carries the polarity too, so the bomb counter and its icon take the intention's colour. */
  private statusEl = $('status');
  private kairosEl = $('kairos');
  private kairosMarksEl = $('kairos-marks');
  private kairosTone = '';
  private phaseEl = $('phase');
  private phaseTint = $('phase-tint');
  private phaseShown = '';
  private lastPolarity: Polarity = 'positive';
  private depthEl = $('depth');
  private invEl = $('inventory');
  private mapEl = $('starmap');
  /** The Recipe Book's tab (recipe-book.ts); its tab button shows only while the practice is held. */
  private bookEl = $('recipebook');
  private recipesHeld = false;
  /** The book has been opened since the practice was taken: its tab loses the new mark. */
  private recipesRead = false;
  private tollEl = $('toll');
  tollOpen = false;
  private tollFloor = 0;
  private tollPicked = new Set<string>();
  /** The Sanctuary, the Boundary's meditation app: a full-screen layer of its own (meditation-view.ts). */
  readonly sanctuary = new MeditationView();
  get sanctuaryOpen() { return this.sanctuary.open; }
  private flashEl = $('flash');
  private hurtEl = $('hurt');
  private hurtSideEl = $('hurt-side');
  private berserkEl = $('berserk');
  private starEl = $('star');
  private deathEl = $('death');
  private fadeEl = $('fade');
  private map = $('minimap') as HTMLCanvasElement;
  private handKey = '';
  private heartsKey = '';
  private slotUrls = new Map<number, string>();
  private debugTimer = 0;
  private toastTimer = 0;
  private shakeT = 0;
  private selected: string | null = null;
  // last inputs of each surface, to redraw them in another language (relocalize)
  private lastItems: readonly ItemDef[] = [];
  private lastDepth = -1;
  private lastBanner: Parameters<Hud['itemBanner']> | null = null;
  /** The press on the practice card in progress (#375): its pointer, where it started, and how far it moved. */
  private press: { id: number; x: number; y: number; onCard: boolean; reach: number; path: number } | null = null;
  private lastCard: CardSpec | null = null;
  private lastPresenceOffer: { nameKey: MessageKey; carried: Carried | readonly Carried[] | undefined; questionKey?: MessageKey; gift: boolean; request?: PresenceRequestText; answers?: OfferAnswers } | null = null;
  /** The key of the held-item label last drawn (the flask in hand and its language), so it is not redrawn each frame. */
  private heldKey = '';
  /** The choice card of a presence: a question with up to four answers, and a decline. `selected` is the answer the
   *  navigate action has reached; a tap or the confirm action picks one. */
  private lastPresenceChoice: { nameKey: MessageKey; questionKey: MessageKey; options: readonly MessageKey[]; selected: number; request?: PresenceRequestText } | null = null;
  /** The presences met in this run, in the order met: the codex (CODEX.md). */
  private codexIds: readonly PresenceId[] = [];
  private lastDeath: Parameters<Hud['showDeath']> | null = null;
  /** The completion percentage shown on the pause card and the death screen (COMPLETION.md). */
  private completionView: Completion | null = null;
  private game: Game | null = null;
  /** The screen (menu and practices) is open; it pauses the world on every device. */
  screenOpen = false;
  private screenTab: ScreenTab = 'menu';
  private shownTab: ScreenTab | null = null;
  bannerOpen = false;
  get presenceOfferOpen() { return this.lastPresenceOffer !== null; }
  get presenceChoiceOpen() { return this.lastPresenceChoice !== null; }
  get choiceSelected() { return this.lastPresenceChoice?.selected ?? -1; }
  /** The debug readout is off by default; F3 toggles it (it's for developers). */
  showDebug = false;
  private lastFlash = 0;
  rumble: ((strength: number, ms: number) => void) | null = null;
  onAct: ((act: string) => void) | null = null;
  onFov: ((fov: number) => void) | null = null;
  private fovInput = $('fov') as HTMLInputElement;
  private fovShown = FOV_DEFAULT;
  private lastCleared = new Set<number>();
  private mapState: { floor: FloorResult; room: number; visited: Set<number> } | null = null;
  private mapYaw = 0;
  /** Where the arrow is (updateMap), and what the map was last drawn from: it redraws only when that changes. */
  private mapPlace: MapPlace | null = null;
  private mapDrawn = '';
  /** The tunnel layer of the floor on the map, refreshed at most every TUNNEL_REFRESH_S while digging. */
  private mapTunnels: [number, number][] = [];
  private tunnelStamp = -1;
  private tunnelDepth = NaN;
  private tunnelWait = 0;

  constructor() {
    applyPaletteCss(HUD_ICONS);
    addEventListener('keydown', e => { if (e.code === 'F3') { e.preventDefault(); this.showDebug = !this.showDebug; } });
    this.fadeEl.style.setProperty('--fade-bg', palCss('ink.void'));
    this.fadeEl.style.setProperty('--fade-ink', palCss('bone.paper'));
    document.documentElement.style.setProperty('--berserk-edge', palCss(BERSERKER_FRAME.edge));
    document.documentElement.style.setProperty('--berserk-glow', palCss(BERSERKER_FRAME.glow));
    document.documentElement.style.setProperty('--star-glow', palCss(STAR_GLOW));
    this.renderLanguages();
    $('hearts-box').appendChild(this.spiritRing);
    this.renderSpiritLabel();
    onLocaleChange(() => this.relocalize());
    onDeviceChange(d => {
      this.applyDevice(d);
      if (this.presenceOfferOpen) {
        this.renderControls();
        this.renderGraphics();
        this.renderPresenceOfferControls();
      } else this.relocalize();
    });
    this.applyDevice(activeDevice());
    this.renderControls();
    this.fovInput.min = String(FOV_MIN);
    this.fovInput.max = String(FOV_MAX);
    this.fovInput.step = String(FOV_STEP);
    this.fovInput.addEventListener('input', () => this.onFov?.(Number(this.fovInput.value)));
    this.renderGraphics();
    addEventListener('click', e => {
      const el = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-act]');
      if (el) { e.stopPropagation(); if (el.closest('#graphics')) el.blur(); this.onAct?.(el.dataset.act!); return; }
      // the mouse: a click on the pause card's backdrop (outside the card, not its scrollbar) starts play, from the click
      // itself; a press inside the menu never captures the mouse (input.ts capturesMouse, #356)
      if (backdropResumes({ device: activeDevice(), screenOpen: this.screenOpen, onBackdrop: e.target === this.overlay, offsetX: e.offsetX, clientWidth: this.overlay.clientWidth })) {
        this.onAct?.('resume');
        return;
      }
      if (activeDevice() !== 'touch' || this.screenOpen || !this.overlay.contains(e.target as Node)) return;
      if ((e.target as HTMLElement).closest('[data-lang], .seed, #graphics')) return;
      this.onAct?.('resume');
    });
    // the practice card closes on the release of a tap, never on a press (#375, practiceReleaseCloses)
    addEventListener('pointerdown', e => this.practicePress(e), true);
    addEventListener('pointermove', e => this.practiceMove(e), true);
    addEventListener('pointerup', e => this.practiceRelease(e), true);
    addEventListener('pointercancel', () => { this.press = null; }, true);
    // with the pointer locked, a wheel targets the canvas, not the card: the card still scrolls
    addEventListener('wheel', e => { if (this.practiceOpen && !this.bannerEl.contains(e.target as Node)) this.scrollPractice(e.deltaY); }, { passive: true });
    // capture phase, like the seed: choosing a language must not also capture the mouse
    addEventListener('mousedown', e => {
      const b = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[data-lang]');
      if (!b) return;
      e.stopPropagation();
      chooseLocale(b.dataset.lang!);
    }, true);
  }

  /** The language changed: redraw everything on screen from its last inputs. */
  relocalize() {
    this.handKey = '';
    this.setItems(this.lastItems);
    if (this.lastDepth >= 0) this.depthEl.textContent = floorLabel(this.lastDepth);
    this.renderSeed();
    this.renderCompletion();
    this.renderPolarity();
    this.renderSpiritLabel();
    this.renderLanguages();
    this.renderControls();
    this.renderGraphics();
    if (this.lastAchievement) this.renderAchievement(this.lastAchievement);
    else if (this.bannerOpen && this.lastPresenceOffer) this.renderPresenceOffer();
    else if (this.bannerOpen && this.lastPresenceChoice) this.renderPresenceChoice();
    else if (this.bannerOpen && this.lastCard) this.renderCard(this.lastCard);
    else if (this.bannerOpen && this.lastBanner) this.renderBanner(...this.lastBanner);
    if (this.deathEl.classList.contains('show') && this.lastDeath) this.renderDeath(...this.lastDeath);
    if (this.screenOpen && this.game) this.renderScreen(this.game);
    if (this.tollOpen && this.game) this.renderToll(this.game);
    this.toastEl.classList.remove('show');
  }

  /** The spirit's name for its aria-label and title (hud.spirit). */
  private renderSpiritLabel() {
    const name = t('hud.spirit');
    this.spiritNum.setAttribute('aria-label', name);
    this.spiritNum.title = name;
  }

  private applyDevice(d: Device) {
    for (const k of ['keyboard', 'gamepad', 'touch']) document.body.classList.toggle(`dev-${k}`, k === d);
  }

  /** The controls list shows the rows the player meets (CONTROL_GATES). It starts with the basic rows only. */
  private controlRows: readonly ControlRow[] = visibleControlRows({ stat: () => 0, holds: () => false, starMapSeen: false });

  /** Redraws the controls list when the rows the player meets change (an item, a stat or the star map gained or lost). */
  private syncControls(g: Game) {
    const rows = visibleControlRows({ stat: n => g.stats.get(n), holds: id => g.inventory.has(id), starMapSeen: g.starMapSeen });
    if (rows.length === this.controlRows.length && rows.every((r, i) => r === this.controlRows[i])) return;
    this.controlRows = rows;
    this.renderControls();
  }

  private renderControls() {
    const d = activeDevice();
    const table = document.getElementById('controls');
    if (table) table.innerHTML = this.controlRows.map(r =>
      `<tr><td>${th(controlKey(r, d))}</td><td>${th(`controls.${r}` as MessageKey)}</td></tr>`).join('');
    const go = document.getElementById('play');
    if (go) go.textContent = t(forDevice('intro.play', d));
    const nr = document.getElementById('newrun');
    if (nr) nr.textContent = t('pause.newRun');
    for (const b of document.querySelectorAll<HTMLElement>('#overlay .tabs button')) {
      b.textContent = t(b.dataset.tab === 'items' ? 'inv.title' : b.dataset.tab === 'map' ? 'tab.map' : b.dataset.tab === 'recipes' ? 'tab.recipes' : 'tab.menu');
    }
    const rot = document.getElementById('rotate');
    if (rot) rot.textContent = t('touch.rotate');
    this.renderCodex();
  }

  /** The codex (CODEX.md): the presences met this run, with what each asks and what it gives. Text only, in the language on screen. */
  setCodex(ids: readonly PresenceId[]) {
    this.codexIds = [...ids];
    this.renderCodex();
  }

  private renderCodex() {
    const list = document.querySelector<HTMLElement>('#codex ul');
    if (!list) return;
    list.innerHTML = this.codexIds.length
      ? this.codexIds.map(id => `<li><b>${th(PRESENCE_TALK[id].name)}</b>` +
        `<span><em>${th('codex.asks')}</em> ${th(`codex.${id}.asks` as MessageKey)}</span>` +
        `<span><em>${th('codex.gives')}</em> ${th(`codex.${id}.gives` as MessageKey)}</span></li>`).join('')
      : `<li class="none">${th('codex.empty')}</li>`;
  }

  get menuShown() { return !this.screenOpen || this.screenTab === 'menu'; }

  /** The star map is the tab on screen (D15): navigate and pick do nothing there. */
  get mapShown() { return this.screenOpen && this.screenTab === 'map'; }

  /** The Recipe Book is the tab on screen: navigate scrolls it, pick does nothing. */
  get recipesShown() { return this.screenOpen && this.screenTab === 'recipes'; }

  setFov(fov: number) {
    this.fovShown = fov;
    this.renderGraphics();
  }

  private renderGraphics() {
    const v = String(this.fovShown);
    if (this.fovInput.value !== v) this.fovInput.value = v;
    this.fovInput.setAttribute('aria-valuetext', t('graphics.fovValue', { n: this.fovShown }));
    $('fov-value').textContent = t('graphics.fovValue', { n: this.fovShown });
    $('fov-hint').textContent = t(forDevice('graphics.hint', activeDevice()));
    for (const [act, key] of [['fov-down', 'graphics.fovNarrower'], ['fov-up', 'graphics.fovWider']] as const) {
      const b = this.overlay.querySelector<HTMLElement>(`[data-act="${act}"]`);
      if (b) { const label = t(key); b.title = label; b.setAttribute('aria-label', label); }
    }
  }

  /** The selector on the pause card: every shipped language by its own name. */
  private renderLanguages() {
    const el = document.getElementById('lang');
    if (!el) return;
    el.innerHTML = `<span>${th('intro.language')}</span>` + locales().map(l =>
      `<button type="button" data-lang="${l.code}"${l.code === locale() ? ' class="on" aria-pressed="true"' : ''}>${esc(l.name)}</button>`).join('');
  }

  /** Kairos (#123), a persistent status: the charge pips while the practice is held, and while time is stopped the
   *  marks, each drawn where its point is on screen. A mark that is behind the camera is hidden, not moved. */
  kairos(k: { held: boolean; charge: number; max: number; stopped: boolean; marks: { x: number; y: number; n: number; on: boolean }[] }) {
    const el = this.kairosEl;
    el.hidden = !k.held;
    if (!this.kairosTone) {
      this.kairosTone = palCss('light.gold');
      el.style.setProperty('--kairos', this.kairosTone);
      this.kairosMarksEl.style.setProperty('--kairos', this.kairosTone);
    }
    if (!k.held) { if (this.kairosMarksEl.childElementCount) this.kairosMarksEl.replaceChildren(); return; }
    el.classList.toggle('stopped', k.stopped);
    el.title = t('hud.kairos', { n: k.charge, max: k.max });
    el.querySelectorAll('i').forEach((pip, i) => pip.classList.toggle('on', i < k.charge));
    el.querySelector('em')!.textContent = k.stopped ? t('hud.kairos.marks', { n: k.marks.length, max: 5 }) : '';
    this.kairosMarksEl.replaceChildren(...k.marks.map(m => {
      const b = document.createElement('b');
      b.textContent = String(m.n);
      b.style.left = `${m.x}px`;
      b.style.top = `${m.y}px`;
      b.hidden = !m.on;
      return b;
    }));
  }

  /** The boss bar. With `turn` it is the conversion bar of a hostile boss (combat/polarity.ts): a centre mark,
   *  the cold fill up to the middle and the captive fill past it, so harm empties it and love fills it to the
   *  top (DECISIONS §14.10). Without it, a plain fill (an allied boss, the sky's presences). */
  bossBar(boss: { name: string; ratio: number; turn?: boolean } | null) {
    this.bossEl.hidden = !boss;
    if (!boss) return;
    this.bossName.textContent = boss.name;
    const r = Math.max(0, Math.min(1, boss.ratio));
    this.bossEl.classList.toggle('turn', !!boss.turn);
    this.bossFill.style.width = `${(boss.turn ? Math.min(r, 0.5) : r) * 100}%`;
    this.bossLove.style.width = `${(boss.turn ? Math.max(0, r - 0.5) : 0) * 100}%`;
  }

  /** The loaded intention's polarity: a static mark (filled = positive, ring = negative), set only when it changes. */
  setPolarity(p: Polarity) {
    this.lastPolarity = p;
    this.renderPolarity();
  }

  /** Lucid Dream's status (the persistent status type of sotano-popups): its practice icon, the seconds left and a soft
   *  tint over the screen, shown while the phase runs. `left` null hides it. Redraws only when what shows changes. */
  setPhase(left: number | null, def: ItemDef | null) {
    const on = left !== null && def !== null;
    const warn = on && left <= PHASE_WARN_S;
    const key = on ? `${Math.ceil(left)}:${warn}` : '';
    if (key === this.phaseShown) return;
    this.phaseShown = key;
    this.phaseEl.hidden = !on;
    this.phaseTint.classList.toggle('on', on);
    if (!on) return;
    document.documentElement.style.setProperty('--phase-tint', palCss('path.milagros.glow'));
    this.phaseEl.classList.toggle('warn', warn);
    const name = esc(itemText(def).name);
    this.phaseEl.innerHTML = `<img src="${iconDataUrl(def, 2)}" alt="" title="${name}"><b>${esc(t('hud.phase.left', { n: fmtNum(Math.ceil(left)) }))}</b>`;
  }

  private renderPolarity() {
    const el = this.polarityEl;
    const positive = this.lastPolarity === 'positive';
    el.dataset.polarity = this.lastPolarity;
    this.statusEl.dataset.polarity = this.lastPolarity;
    // the frame's colour: gold for the good intention, ember for the bad one (never cold: it is yours)
    el.style.setProperty('--pol', palCss(positive ? 'light.gold' : 'light.ember'));
    el.title = t(positive ? 'hud.polarity.positive' : 'hud.polarity.negative');
  }

  update(g: Game, running: boolean, dt: number) {
    this.shakeT = Math.max(0, this.shakeT - dt);
    if (running) this.tickAchievement(dt);
    this.syncRecipesTab(g);
    this.syncControls(g);
    // the screen is the overlay's tab while it is open; otherwise the pause card shows the menu
    this.showTab(this.screenOpen ? this.screenTab : 'menu');
    this.overlay.style.display = running || this.tollOpen || this.sanctuaryOpen || g.player.dead ? 'none' : 'flex';

    this.updateMap(g, dt);

    const max = Math.floor(g.stats.get('maxHearts')), p = g.player, hp = p.hp;
    const star = p.starT > 0, layersKey = p.layers.map(l => `${l.kind}${l.hp}`).join(',');
    const hk = `${max}:${hp}:${p.invulnT > 0 ? 1 : 0}:${star ? 1 : 0}:${p.blood ? 1 : 0}:${layersKey}`;
    if (hk !== this.heartsKey) {
      this.heartsKey = hk;
      const fill = (q: number, cls: string) => {
        const shown = q === 4 ? 0 : (1 - (1 + 9 * q / 4) / 11) * 100;
        return `<span class="heart full ${cls}" style="clip-path: inset(0 ${shown.toFixed(1)}% 0 0)"></span>`;
      };
      let html = '';
      for (let i = 0; i < max; i++) {
        const q = heartQuarters(hp, i);
        html += q === 0 ? '<span class="heart"></span>' : `<span class="heart">${fill(q, '')}</span>`;
      }
      for (const l of p.layers) html += `<span class="heart layer">${fill(heartQuarters(l.hp, 0), `k-${l.kind}`)}</span>`;
      this.heartsEl.innerHTML = html;
      this.heartsEl.classList.toggle('safe', p.invulnT > 0 && !star);
      this.heartsEl.classList.toggle('star', star);
      this.heartsEl.classList.toggle('blood', !!p.blood);
      this.heartsEl.classList.toggle('low', hp > 0 && heartCount(hp, p.layers) <= 1 && hp + p.layers.reduce((a, l) => a + l.hp, 0) <= HEART);
      this.starEl.classList.toggle('on', star);
    }
    // spirit: only in the sky; the outline slides (CSS) to the new length, and the number is whole
    const sky = g.inSky;
    this.heartsRow.classList.toggle('sky', sky);
    if (sky) {
      const spirit = Math.round(g.spiritNow);
      if (spirit !== this.spiritShown) {
        this.spiritShown = spirit;
        paintSpiritRing(this.spiritRing, spirit);
        this.spiritNum.textContent = fmtNum(spirit, 0);
        this.spiritNum.setAttribute('aria-valuenow', String(spirit));
      }
    }
    // breath: only while it isn't full (under water, or catching it back)
    const bmax = g.stats.get('breath'), bubbles = 8;
    const full = Math.ceil(g.player.breath / bmax * bubbles - 1e-6);
    const bk = g.player.breath >= bmax - 1e-3 ? '' : String(full);
    if (bk !== this.breathKey) {
      this.breathKey = bk;
      this.breathEl.classList.toggle('on', bk !== '');
      this.breathEl.classList.toggle('low', full <= 2);
      let html = '';
      for (let i = 0; i < bubbles; i++) html += `<span class="bubble${i < full ? (i === full - 1 ? ' last' : '') : ' empty'}"></span>`;
      this.breathEl.innerHTML = bk ? html : '';
    }
    this.bombsEl.textContent = String(g.player.bombs).padStart(2, '0');
    this.keysEl.textContent = String(g.player.keys).padStart(2, '0');

    // hand slots: one per carry point; the active carried item is outlined in gold
    const carry = Math.floor(g.stats.get('carry'));
    const active = g.player.activeIndex;
    const key = carry + ':' + active + ':' + g.player.hand.map(c => typeof c === 'number' ? c : carriedDef(c).id).join(',');
    if (key !== this.handKey) {
      this.handKey = key;
      this.hand.innerHTML = '';
      // slots past the base carry (Furoshiki) are drawn dimmer
      for (let i = 0; i < carry; i++) this.hand.appendChild(this.handSlot(g.player.hand[i], i === active, i >= BASE_STATS.carry));
    }
    this.updateHeld(g.player.active);

    if (--this.debugTimer <= 0 && this.showDebug) {
      this.debugTimer = 15;
      const d = g.debug;
      this.debugEl.textContent =
        `${d.fps} fps · ${Math.round(d.tris / 1000)}k tris · cubes ${d.debris} · enemies ${d.enemies} · intents ${d.intents}\n` +
        `pos ${d.pos} · room ${d.room}\nhand: ${d.held}`;
    }
    this.debugEl.style.display = this.showDebug ? 'block' : 'none';
    const now = performance.now();
    if (now > this.toastTimer) this.toastEl.classList.remove('show');
    this.sanctuary.frame(now);
  }

  /**
   * The held label: while a flask or a meal is the active carried item, its name and what it does sit above the hand
   * (sotano-popups: the persistent HUD status type). The recipe is never shown.
   */
  private updateHeld(c: Carried | undefined) {
    const f = c && isFlask(c) ? c : null;
    const key = f ? `${f.potion}:${f.echo ?? ''}:${f.iced ? 1 : 0}` : '';
    if (key === this.heldKey) return;
    this.heldKey = key;
    if (!f) { this.heldEl.classList.remove('show'); this.heldEl.replaceChildren(); return; }
    const name = document.createElement('b');
    name.textContent = flaskName(f);
    const effect = document.createElement('span');
    effect.textContent = flaskEffect(f);
    this.heldEl.replaceChildren(name, effect);
    this.heldEl.classList.add('show');
  }

  /** How long a flask lasts, in words: at once, for some sealed rooms, or until the next floor. */
  private potionDuration(f: Flask): string {
    const d = POTIONS[f.potion].duration;
    return d.kind === 'instant' ? t('potion.duration.instant') : d.kind === 'floor' ? t('potion.duration.floor') : t('potion.duration.rooms', { rooms: flaskRooms(f) });
  }

  /** The "In hand" block at the top of the inventory when a flask or meal is the active item: name, effect, duration. */
  private inHandBlock(f: Flask): string {
    return `<section class="in-hand"><h3>${th('inv.carried')}</h3><b class="d-name">${esc(flaskName(f))}</b>` +
      `<p>${esc(flaskEffect(f))}</p><small>${esc(this.potionDuration(f))}</small></section>`;
  }

  private slotUrl(m: number) {
    let url = this.slotUrls.get(m);
    if (!url) { url = (materialTexture(m).image as HTMLCanvasElement).toDataURL(); this.slotUrls.set(m, url); }
    return url;
  }

  /** One carry slot: the item in it, or an empty well; outlined in gold when it is the active item. */
  private handSlot(c: Carried | undefined, active: boolean, extra = false) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (c ? ' full' : '') + (active ? ' on' : '') + (extra ? ' extra' : '');
    if (c) {
      const img = document.createElement('img');
      if (typeof c === 'number') {
        img.src = this.slotUrl(c);
        img.title = materialName(c);
      } else if (isFlask(c)) {
        img.src = iconDataUrl(carriedDef(c), 3);
        img.title = `${flaskName(c)}\n${flaskEffect(c)}`;
      } else {
        const tx = partText(c);
        img.src = iconDataUrl(c, 3);
        img.title = `${tx.name}\n${tx.description}`;
      }
      slot.appendChild(img);
    }
    return slot;
  }

  /** Small icons of the items you hold, under the counters. */
  setItems(items: readonly ItemDef[]) {
    this.lastItems = items;
    this.itemsBar.innerHTML = items.map(it => `<img src="${iconDataUrl(it, 2)}" title="${esc(itemText(it).name)}" alt="">`).join('');
  }

  /** Somewhere that is not a floor: a level of the tree, heaven or silence (`level.<zone>`). */
  setZone(zone: string) {
    this.depthEl.textContent = t(`level.${zone}` as MessageKey);
  }

  /** The sky's place label, set every frame; the text only changes when the place does. */
  placeLabel(key: MessageKey) {
    const text = t(key);
    if (this.depthEl.textContent !== text) this.depthEl.textContent = text;
  }

  /** The minimap maps rooms, so it is hidden in the sky. */
  setMinimap(on: boolean) {
    this.map.style.display = on ? '' : 'none';
  }

  /** The realm gate's fade, set each frame (0 clear → 1 black). At 0 the restart's own fade takes over again. */
  fadeLevel(k: number) {
    this.fadeEl.style.setProperty('--fade-t', '0s');
    this.fadeEl.style.opacity = k > 0 ? String(k) : '';
  }

  setFloor(floor: FloorResult, depth: number) {
    this.lastDepth = depth;
    this.depthEl.textContent = floorLabel(depth);
    // the rooms already explored stay: `visited` holds every floor's rooms (global ids), so a floor reached again,
    // or the next band touched by a deep hole, never wipes the map (issue #302)
    this.mapState = { floor, room: -1, visited: this.mapState?.visited ?? new Set() };
    this.mapDrawn = '';
    this.drawMap(floor, -1, this.mapState.visited);
  }

  setRoom(floor: FloorResult, room: number, visited: Set<number>, cleared: Set<number> = this.lastCleared) {
    this.lastCleared = cleared;
    this.mapState = { floor, room, visited };
    this.mapDrawn = '';
    this.drawMap(floor, room, visited);
  }

  /**
   * Each frame: the floor of the band the body is in, where the arrow is, and the tunnel layer. The map is redrawn
   * only when one of them (or the view's yaw) changes; the tunnels are gathered at most every TUNNEL_REFRESH_S.
   */
  private updateMap(g: Game, dt: number) {
    this.mapYaw = g.player.yaw;
    if (!this.mapState || this.map.style.display === 'none') return;
    const b = g.player.body;
    const floor = g.floors.get(g.depth) ?? this.mapState.floor;
    if (floor !== this.mapState.floor) this.mapState = { floor, room: g.room, visited: g.visited };
    this.mapState.visited = g.visited;
    this.mapPlace = placeOnMap(floor, b.x, b.y, b.z);
    this.tunnelWait -= dt;
    if (g.tunnels.version !== this.tunnelStamp || g.depth !== this.tunnelDepth) {
      if (this.tunnelWait <= 0 || g.depth !== this.tunnelDepth) {
        const [y0, y1] = bandRange(g.depth);
        this.mapTunnels = g.tunnels.tiles(y0, y1, (x, y, z) => g.dw.get(x, y, z) === AIR);
        this.tunnelStamp = g.tunnels.version;
        this.tunnelDepth = g.depth;
        this.tunnelWait = TUNNEL_REFRESH_S;
      }
    }
    const [px, pz] = mapPx(this.mapPlace.u, this.mapPlace.v);
    const key = `${g.depth}:${this.mapState.room}:${Math.round(px)}:${Math.round(pz)}:${Math.round(this.mapYaw * 64)}:` +
      `${g.visited.size}:${this.lastCleared.size}:${this.tunnelStamp}`;
    if (key === this.mapDrawn) return;
    this.mapDrawn = key;
    this.drawMap(floor, this.mapState.room, g.visited);
  }

  /** Isaac-style minimap: visited rooms, their neighbours as outlines, special rooms marked, the dug tunnels, the player. */
  private drawMap(floor: FloorResult, current: number, visited: Set<number>) {
    const c = this.map, g = c.getContext('2d')!;
    const { w: cw, h: ch, gap } = MAP_CELL;
    const { w, h } = floor.plan;
    // the grid sits inside a border of rock (MAP_PAD), so the tunnels and the arrow in the floor's margin stay on it (#305)
    const [padX, padZ] = MAP_PAD;
    c.width = w * (cw + gap) + gap + 2 * padX; c.height = h * (ch + gap) + gap + 2 * padZ;
    g.clearRect(0, 0, c.width, c.height);
    g.translate(padX, padZ);
    const known = new Set<number>();
    const marks: [string, number, number][] = [];
    for (const r of floor.rooms) {
      if (!visited.has(r.id)) continue;
      known.add(r.id);
      for (const i of Object.values(floor.plan.rooms[r.id % ROOM_ID_STRIDE].links)) known.add(floor.rooms[i as number].id);
    }
    for (const r of floor.rooms) {
      if (!known.has(r.id)) continue;
      const x = gap + r.gx * (cw + gap), y = gap + r.gz * (ch + gap);
      // every room is one cell: the map tells how many rooms and how they join, never their size or shape
      const rw = cw, rh = ch;
      const visitedHere = visited.has(r.id);
      const paint = (px: number, py: number, pw: number, ph: number) => {
        if (visitedHere) {
          g.globalAlpha = this.lastCleared.has(r.id) && r.id !== current ? 0.5 : 1;
          g.fillStyle = r.id === current ? MAP.current : this.lastCleared.has(r.id) ? MAP.cleared : MAP.visited;
          g.fillRect(px, py, pw, ph);
        } else {
          g.globalAlpha = r.type === 'path' ? 0.35 : 0.25;
          if (r.type === 'path') { g.fillStyle = MAP.unvisited; g.fillRect(px, py, pw, ph); }
          else { g.strokeStyle = MAP.unvisited; g.lineWidth = 1; g.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1); }
        }
        g.globalAlpha = 1;
      };
      // a path of the Tree is a connector: a thin band from the middle of its cell to each neighbour,
      // reaching across the gap so the emanations it joins touch it with no break
      if (r.type === 'path') {
        const links = floor.plan.rooms[r.id % ROOM_ID_STRIDE].links;
        const bx = x + Math.floor(cw / 2) - 1, by = y + Math.floor(ch / 2) - 1;
        const west = links.W !== undefined, east = links.E !== undefined, north = links.N !== undefined, south = links.S !== undefined;
        if (west || east) {
          const x0 = west ? x - gap : bx, x1 = east ? x + cw + gap : bx + 3;
          paint(x0, by, x1 - x0, 3);
        }
        if (north || south) {
          const y0 = north ? y - gap : by, y1 = south ? y + ch + gap : by + 3;
          paint(bx, y0, 3, y1 - y0);
        }
        continue;
      }
      paint(x, y, rw, rh);
      if (r.type !== 'normal') marks.push([r.type, x + cw / 2, y + ch / 2]);
    }
    // the tunnels the player dug: a solid light trail over the rock, at least 2 px a column (DECISIONS §10.2, #305)
    if (this.mapTunnels.length && this.tunnelDepth === this.lastDepthOf(floor)) {
      g.fillStyle = MAP.tunnel;
      for (const [x, z] of this.mapTunnels) g.fillRect(...tunnelRect(x, z));
    }
    // the room marks over the tunnels, so a glyph always reads whole
    for (const [type, mx, mz] of marks) this.mapMark(g, type, mx, mz);
    // the player is always on the map: on the room's cell inside a room, on the body's place anywhere else
    const place = this.mapPlace;
    const here = current >= 0 ? floor.rooms.find(r => r.id === current) : undefined;
    if (place) { const [px, pz] = mapPx(place.u, place.v); this.mapArrow(g, px, pz, place.room >= 0); }
    else if (here) this.mapArrow(g, gap + here.gx * (cw + gap) + cw / 2, gap + here.gz * (ch + gap) + ch / 2, true);
  }

  /** The depth of a floor result on the map (its rooms carry their floor). */
  private lastDepthOf(floor: FloorResult): number {
    return floor.rooms[0]?.floor ?? this.lastDepth;
  }

  /** The player's arrow: a light border under the fill, so it reads on the dark map and on the room's cell (#305). */
  private mapArrow(g: CanvasRenderingContext2D, cx: number, cy: number, inRoom: boolean) {
    const dx = -Math.sin(this.mapYaw), dz = -Math.cos(this.mapYaw);
    g.beginPath();
    g.moveTo(cx + dx * 4.5, cy + dz * 4.5);
    g.lineTo(cx - dx * 2.5 + dz * 3, cy - dz * 2.5 - dx * 3);
    g.lineTo(cx - dx * 2.5 - dz * 3, cy - dz * 2.5 + dx * 3);
    g.closePath();
    // the stroke is centred on the edge: twice the border width leaves ARROW_BORDER_PX outside the fill
    g.strokeStyle = palCss(ARROW_BORDER);
    g.lineWidth = ARROW_BORDER_PX * 2;
    g.lineJoin = 'round';
    g.stroke();
    g.fillStyle = palCss(arrowFill(inRoom));
    g.fill();
  }

  /** Room marks are glyphs, never colour alone: a house, a hollow ◇, a ▭, a ▣. */
  private mapMark(g: CanvasRenderingContext2D, type: string, cx: number, cy: number) {
    const x = Math.round(cx), y = Math.round(cy);
    const dot = (dx: number, dy: number) => g.fillRect(x + dx, y + dy, 1, 1);
    g.fillStyle = (MAP as Record<string, string>)[type] ?? MAP.start;
    if (type === 'start') { dot(0, -2); dot(-1, -1); dot(0, -1); dot(1, -1); g.fillRect(x - 1, y, 3, 2); }
    else if (type === 'treasure') { dot(0, -2); dot(-1, -1); dot(1, -1); dot(-2, 0); dot(2, 0); dot(-1, 1); dot(1, 1); dot(0, 2); }
    else if (type === 'vault') { g.fillRect(x - 2, y - 1, 5, 1); g.fillRect(x - 2, y + 1, 5, 1); dot(-2, 0); dot(2, 0); }
    else if (type === 'challenge') { for (let i = -2; i <= 2; i++) { dot(i, i); dot(i, -i); } }
    else if (type === 'boss') { g.fillRect(x - 2, y - 2, 5, 5); g.fillStyle = palCss('ink.void'); g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = MAP.boss; dot(0, 0); }
  }

  // ───────────────────────── feedback ─────────────────────────

  /**
   * The Presence card: a name and a few lines read once, confirmed to continue (sotano-popups §2). `kicker` is an optional
   * short line above the name (the achievements' "Achievement", ACHIEVEMENTS §4). A param may be a function: it is
   * called again on every redraw, so a line that names a sentence built from other keys follows a language change.
   * `onRead` runs only when the player confirms this card (`confirmBanner`), never when it is cut off.
   */
  presenceCard(nameKey: MessageKey, lineKeys: readonly MessageKey[], params?: CardParams, kicker?: MessageKey, onRead?: () => void) {
    this.hideAchievement();
    this.lastBanner = null;
    this.lastCard = { nameKey, lineKeys, params, kicker, onRead };
    this.clearPresenceOfferState();
    this.renderCard(this.lastCard);
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('show');
    this.bannerOpen = true;
  }

  private renderCard(c: CardSpec) {
    const params: Params = {};
    for (const [k, v] of Object.entries(c.params ?? {})) params[k] = typeof v === 'function' ? v() : v;
    this.bannerEl.style.setProperty('--c', palCss('bone.paper'));
    this.bannerEl.style.setProperty('--gold', palCss('light.gold'));
    this.bannerEl.innerHTML =
      `<div class="ribbon slate"><div>${c.kicker ? `<em class="kicker">${th(c.kicker)}</em>` : ''}<b>${th(c.nameKey)}</b>` +
      c.lineKeys.map(k => `<span>${th(k, params)}</span>`).join('') +
      `<p class="dismiss">${th(forDevice('banner.continue', activeDevice()))}</p></div></div>`;
  }

  /** The consent card of an offer. `questionKey` says what the presence gives back when it is not the plain question
   *  (the Trickster's trade, the Echo's key or bomb); the card always names the exact part offered. */
  /** The consent card of a presence: `carried` is the part it asks for, or undefined for a gift it asks for nothing (`gift`). */
  presenceOfferCard(nameKey: MessageKey, carried: Carried | readonly Carried[] | undefined, questionKey?: MessageKey, gift = false, request?: PresenceRequestText, answers?: OfferAnswers) {
    this.hideAchievement();
    this.lastBanner = null;
    this.lastCard = null;
    this.lastPresenceOffer = { nameKey, carried, questionKey, gift, request, answers };
    this.bannerEl.dataset.offer = 'true';
    this.bannerEl.setAttribute('role', 'dialog');
    this.bannerEl.setAttribute('aria-modal', 'true');
    this.bannerEl.setAttribute('aria-labelledby', 'presence-offer-title');
    this.bannerEl.setAttribute('aria-describedby', 'presence-offer-question');
    this.bannerEl.style.setProperty('--c', palCss('bone.paper'));
    this.renderPresenceOffer();
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('show');
    this.bannerOpen = true;
  }

  private renderPresenceOffer() {
    const offer = this.lastPresenceOffer;
    if (!offer) return;
    const carried = offer.carried;
    const nameOf = (c: Carried) => typeof c === 'number' ? materialName(c) : isFlask(c) ? flaskName(c) : partText(c).name;
    // a multi-part agreement names every object in one sentence (AGREEMENTS.md; owner, #228, D11)
    const item = carried === undefined
      ? ''
      : Array.isArray(carried)
        ? offerList((carried as readonly Carried[]).map(nameOf))
        : nameOf(carried as Carried);
    this.bannerEl.innerHTML =
      `<div class="ribbon slate"><div><b id="presence-offer-title">${th(offer.nameKey)}</b>` +
      `<span class="offer-question" id="presence-offer-question">${th(offer.questionKey ?? 'presence.offer.question', { item, presence: t(offer.nameKey) })}</span>` +
      (offer.request ? `<span class="offer-request">${th(offer.request.ask)}<small>${th(offer.request.alt)}</small></span>` : '') +
      `<div class="offer-actions"><button type="button" class="offer-accept" data-act="presence-offer-accept">${th(offer.answers?.accept ?? (offer.gift ? 'presence.offer.take' : 'presence.offer.accept'))}</button>` +
      `<button type="button" class="offer-decline" data-act="presence-offer-decline">${th(offer.answers?.decline ?? (offer.gift ? 'presence.offer.leave' : 'presence.offer.decline'))}</button></div>` +
      `<small class="offer-controls"></small></div></div>`;
    this.renderPresenceOfferControls();
    this.bannerEl.querySelector<HTMLButtonElement>('.offer-accept')?.focus({ preventScroll: true });
  }

  private renderPresenceOfferControls() {
    const el = this.bannerEl.querySelector<HTMLElement>('.offer-controls');
    if (!el) return;
    const base = this.lastPresenceChoice ? 'presence.choice.controls' : this.lastPresenceOffer?.answers?.controls ?? (this.lastPresenceOffer?.gift ? 'presence.offer.take.controls' : 'presence.offer.controls');
    el.textContent = t(forDevice(base, activeDevice()), controlParams(activeDevice()));
  }

  closePresenceOffer() {
    this.clearPresenceOfferState();
    this.bannerOpen = false;
    this.bannerEl.classList.remove('show');
  }

  /** The choice card (see `lastPresenceChoice`): the presence asks, and the player picks one of its answers or declines. */
  presenceChoiceCard(nameKey: MessageKey, questionKey: MessageKey, options: readonly MessageKey[], request?: PresenceRequestText) {
    this.hideAchievement();
    this.lastBanner = null;
    this.lastCard = null;
    this.clearPresenceOfferState();
    this.lastPresenceChoice = { nameKey, questionKey, options, selected: 0, request };
    this.bannerEl.dataset.offer = 'true';
    this.bannerEl.setAttribute('role', 'dialog');
    this.bannerEl.setAttribute('aria-modal', 'true');
    this.bannerEl.setAttribute('aria-labelledby', 'presence-offer-title');
    this.bannerEl.setAttribute('aria-describedby', 'presence-offer-question');
    this.bannerEl.style.setProperty('--c', palCss('bone.paper'));
    this.renderPresenceChoice();
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth;
    this.bannerEl.classList.add('show');
    this.bannerOpen = true;
  }

  /** Moves the selected answer by one (navigate); wraps at the ends. */
  moveChoice(dx: number) {
    const c = this.lastPresenceChoice;
    if (!c || dx === 0) return;
    c.selected = (c.selected + Math.sign(dx) + c.options.length) % c.options.length;
    this.renderPresenceChoice();
  }

  private renderPresenceChoice() {
    const c = this.lastPresenceChoice;
    if (!c) return;
    const answers = c.options.map((key, i) =>
      `<button type="button" class="${i === c.selected ? 'on' : ''}" aria-pressed="${i === c.selected}" data-act="presence-choice-${i}">${th(key)}</button>`).join('');
    this.bannerEl.innerHTML =
      `<div class="ribbon slate"><div><b id="presence-offer-title">${th(c.nameKey)}</b>` +
      `<span class="offer-question" id="presence-offer-question">${th(c.questionKey)}</span>` +
      (c.request ? `<span class="offer-request">${th(c.request.ask)}<small>${th(c.request.alt)}</small></span>` : '') +
      `<div class="offer-actions choices">${answers}` +
      `<button type="button" class="offer-decline" data-act="presence-offer-decline">${th('presence.choice.decline')}</button></div>` +
      `<small class="offer-controls"></small></div></div>`;
    this.renderPresenceOfferControls();
    this.bannerEl.querySelector<HTMLButtonElement>('.offer-actions button.on')?.focus({ preventScroll: true });
  }

  private clearPresenceOfferState() {
    this.lastPresenceOffer = null;
    this.lastPresenceChoice = null;
    delete this.bannerEl.dataset.offer;
    delete this.bannerEl.dataset.practice;
    this.bannerEl.removeAttribute('role');
    this.bannerEl.removeAttribute('aria-modal');
    this.bannerEl.removeAttribute('aria-labelledby');
    this.bannerEl.removeAttribute('aria-describedby');
  }

  itemBanner(def: ItemDef, changes: { stat: StatName; from: number; to: number }[], synergies: SynergyDef[]) {
    this.hideAchievement();
    this.lastBanner = [def, changes, synergies];
    this.lastCard = null;
    this.clearPresenceOfferState();
    this.renderBanner(def, changes, synergies);
    this.bannerEl.dataset.practice = 'true';
    this.bannerEl.classList.remove('show');
    void this.bannerEl.offsetWidth; // restart the entrance animation
    this.bannerEl.classList.add('show');
    this.bannerOpen = true;
  }

  private renderBanner(def: ItemDef, changes: { stat: StatName; from: number; to: number }[], synergies: SynergyDef[]) {
    const lines = changes.map(c => {
      const up = c.to > c.from;
      return `<i class="${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${esc(statLabel(c.stat))} ${esc(fmtStat(c.stat, c.from))} → ${esc(fmtStat(c.stat, c.to))}</i>`;
    });
    const syn = synergies.map(s => { const st = synergyText(s); return `<i class="syn">✦ ${esc(st.name)} — ${esc(st.description)}</i>`; });
    const tx = itemText(def);
    this.bannerEl.style.setProperty('--c', hex(def.color));
    this.bannerEl.innerHTML =
      `<div class="ribbon slate"><img src="${iconDataUrl(def, 5)}" alt=""><div>` +
      `<b>${esc(tx.name)}</b><em class="q q${def.quality}">${qualityStars(def.quality)}</em>` +
      `<span>${esc(tx.description)}</span>` +
      `<p class="effect">${esc(fill(tx.effect, controlParams(activeDevice())))}</p>` +
      (tx.inspiredBy ? `<small>${th('banner.inspired', { credit: tx.inspiredBy })}</small>` : '') +
      `${lines.concat(syn).join('')}<p class="dismiss">${th(forDevice('banner.continue', activeDevice()))}</p></div></div>`;
  }

  /** The practice card (the item banner) is on screen: its text scrolls, and a tap's release closes it (#375). */
  get practiceOpen() { return this.bannerOpen && this.lastBanner !== null; }

  /** Scrolls the practice card's text by `dy` pixels: the keyboard, the pad stick, a wheel the card does not get. */
  scrollPractice(dy: number) {
    this.bannerEl.querySelector<HTMLElement>('.ribbon')?.scrollBy({ top: dy });
  }

  private practicePress(e: PointerEvent) {
    if (!this.practiceOpen) return;
    this.press = { id: e.pointerId, x: e.clientX, y: e.clientY, onCard: this.bannerEl.contains(e.target as Node), reach: 0, path: 0 };
  }

  private practiceMove(e: PointerEvent) {
    const p = this.press;
    if (!p || p.id !== e.pointerId) return;
    p.reach = Math.max(p.reach, Math.hypot(e.clientX - p.x, e.clientY - p.y));
    // a locked pointer keeps its position: only the movement tells how far a mouse went
    p.path += Math.hypot(e.movementX, e.movementY);
  }

  private practiceRelease(e: PointerEvent) {
    const p = this.press;
    this.press = null;
    if (!p || p.id !== e.pointerId || !this.practiceOpen) return;
    const target = e.target as Element | null;
    const endedOnCard = this.bannerEl.contains(target as Node);
    const endedOnClose = endedOnCard && !!target?.closest?.('.dismiss');
    if (practiceReleaseCloses({ startedOnCard: p.onCard, endedOnCard, endedOnClose, travel: Math.max(p.reach, p.path) })) this.confirmBanner();
  }

  /** Information banners stay until the player clicks (owner rule). */
  dismissBanner() {
    this.lastCard = null;
    this.clearPresenceOfferState();
    this.hideAchievement();
    this.bannerOpen = false;
    this.bannerEl.classList.remove('show');
  }

  /**
   * The player confirmed the window on screen: it closes, and the Presence card's `onRead` runs once (the achievement
   * notice takes no confirmation: it leaves by its timer). Any other close (a restart, another window) is `dismissBanner`,
   * which runs no `onRead`.
   */
  confirmBanner() {
    const read = this.lastCard?.onRead;
    this.dismissBanner();
    read?.();
  }

  /** Whether an achievement notice is on screen (the game shows the next one only when none is). */
  get achievementOpen() { return this.lastAchievement !== null; }

  /**
   * The achievement notice (sotano-popups §2, "Achievement notice"): a slate medal strip in the top-right corner with its
   * kicker, the achievement's name, what it does, and the mastery count. It is not blocking and takes no input: it leaves
   * by itself after `ms` (5 s, or 7 s for a long text), and then `onDone` runs once. A window that arrives first cuts it
   * off: `onDone` does not run, and the notice stays queued. One at a time.
   */
  achievementNotice(keys: CardKeys, level: number, ms: number, onDone: () => void) {
    this.hideAchievement();
    this.lastAchievement = { keys, level };
    this.renderAchievement(this.lastAchievement);
    this.achievementEl.classList.remove('show');
    void this.achievementEl.offsetWidth;
    this.achievementEl.classList.add('show');
    this.achievementDone = onDone;
    this.achievementLeft = ms;
  }

  /** Counts the notice down on game time: a paused game (the menu, a window) holds it, and so does a background tab. */
  private tickAchievement(dt: number) {
    if (!this.lastAchievement) return;
    this.achievementLeft -= dt * 1000;
    if (this.achievementLeft > 0) return;
    const done = this.achievementDone;
    this.hideAchievement();
    done?.();
  }

  private renderAchievement(a: { keys: CardKeys; level: number }) {
    this.achievementEl.innerHTML =
      `<div class="slate ach"><i class="ach-medal" aria-hidden="true"></i><div class="ach-text">` +
      `<em class="ach-kicker">${th(a.keys.kicker)}</em><b class="ach-name">${th(a.keys.name)}</b>` +
      `<span class="ach-desc">${th(a.keys.desc)}</span><small class="ach-mastery">${th(a.keys.mastery, { level: a.level })}</small></div></div>`;
  }

  /**
   * Closes the achievement notice without its answer: a restart, a death or another window cuts it off. `onRead` does not
   * run, so the notice stays queued for the next calm moment.
   */
  private hideAchievement() {
    if (!this.lastAchievement) return;
    this.achievementDone = undefined;
    this.lastAchievement = null;
    this.achievementEl.classList.remove('show');
  }

  flash(color: number) {
    // the flash budget: a full-screen effect never retriggers within 333 ms
    const now = performance.now();
    if (now - this.lastFlash < FLASH_BUDGET_MS) return;
    this.lastFlash = now;
    this.flashEl.style.setProperty('--c', hex(color));
    this.flashEl.classList.remove('on');
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add('on');
  }

  setBerserk(on: boolean) {
    this.berserkEl.classList.toggle('on', on);
    document.body.classList.toggle('berserk', on);
  }

  hurt(angle: number | null = null) {
    const el = angle === null ? this.hurtEl : this.hurtSideEl;
    if (angle !== null) {
      const at = hurtEdge(angle);
      el.style.setProperty('--hx', `${at.x.toFixed(1)}%`);
      el.style.setProperty('--hy', `${at.y.toFixed(1)}%`);
    }
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
    this.shake(0.2);
  }

  /** R: the screen eases to black over `seconds` (one transition, within the flash budget). */
  fadeOut(seconds: number) {
    this.fadeEl.style.setProperty('--fade-t', `${seconds}s`);
    this.fadeEl.classList.add('on');
  }

  /** …and back, a little slower, once the new run is ready. After the light of the ending it comes back from the
   *  light, and the fade's own dark returns only once it is clear. */
  fadeIn() {
    this.fadeEl.style.setProperty('--fade-t', '0.6s');
    this.fadeEl.style.opacity = '';
    this.fadeEl.classList.remove('on');
    this.bannerEl.classList.remove('over-light');
    if (this.fadeEl.classList.contains('light')) setTimeout(() => this.lightLevel(0), 700);
  }

  /**
   * The Fade in its light tone (the ending of illumination, ILLUMINATION.md): the screen whitens to `k` (0 → 1) in the
   * light's core colour, each change easing in over `easeS` seconds, with no ensō. A card opened over it stays on top.
   * 0 gives the screen back to the Fade's dark tone.
   */
  lightLevel(k: number, easeS = 0) {
    if (k > 0) {
      this.fadeEl.classList.add('light');
      this.fadeEl.style.setProperty('--fade-bg', palCss('light.core'));
      this.fadeEl.style.setProperty('--fade-t', `${easeS}s`);
      this.fadeEl.style.opacity = String(Math.min(1, k));
      this.bannerEl.classList.add('over-light');
      return;
    }
    if (this.fadeEl.classList.contains('on')) return;
    this.fadeEl.classList.remove('light');
    this.fadeEl.style.opacity = '';
    this.fadeEl.style.setProperty('--fade-bg', palCss('ink.void'));
    this.bannerEl.classList.remove('over-light');
  }

  shake(seconds: number) {
    this.shakeT = Math.max(this.shakeT, seconds);
    this.rumble?.(Math.min(1, seconds * 2), Math.min(400, seconds * 1000));
  }
  shakeAmount() { return this.shakeT > 0 ? Math.min(0.25, this.shakeT * 0.6) : 0; }

  /** A short notice that fades: a message key, in the player's language. */
  toast(key: MessageKey, params?: Params) { this.showToast(t(key, params)); }

  polarityHint(params: Params, marked: boolean) {
    if (!marked) { this.toast('toast.polarityHint', params); return; }
    this.showToast(t('toast.polarityHint', { ...params, polarity: `<b class="mark">${params.polarity}</b>` }), true);
  }

  /** A notice followed by the drink hint: which key or button drinks the flask or meal ('potion.drinkHint'). */
  toastDrinkHint(key: MessageKey, params?: Params) {
    this.showToast(`${key ? t(key, params) : ''} · ${t('potion.drinkHint', { key: keyLabel('drink', activeDevice()) })}`);
  }

  /** A notice raised by an item or synergy (`api.toast(id)`): one of its own `messages`. */
  effectToast(owner: ItemDef | SynergyDef, id: string, params?: Params) {
    const text = effectMessage(owner, id, params);
    if (text === null) { console.warn(`[i18n] ${owner.id} has no message "${id}"`); return; }
    this.showToast(text);
  }

  private showToast(text: string, html = false) {
    if (html) this.toastEl.innerHTML = text; else this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    this.toastTimer = performance.now() + Math.min(6000, Math.max(1500, 1200 + 50 * text.replace(/<[^>]*>/g, '').length));
  }

  /** Gives the HUD the completion percentage to show (COMPLETION.md). Redraws the pause card; the death screen takes it when it shows. */
  setCompletion(c: Completion) {
    this.completionView = c;
    this.renderCompletion();
  }

  /** Redraws the block; a focused download button keeps its focus across the redraw (a first time changes only the count). */
  private renderCompletion() {
    const el = document.getElementById('completion');
    if (!el) return;
    const focused = document.activeElement instanceof HTMLElement && document.activeElement.classList.contains('book-download') && el.contains(document.activeElement);
    el.innerHTML = this.completionHtml();
    if (focused) el.querySelector<HTMLElement>('.book-download')?.focus();
  }

  /**
   * The completion block, one render function for the pause card and the death screen: the percentage, then each part with
   * its own percentage (COMPLETION.md §4). Empty until the game gives a completion.
   */
  private completionHtml(): string {
    const c = this.completionView;
    if (!c) return '';
    const rows = PARTS.map(p => `<li><span>${th(`completion.part.${p}`)}</span><span>${th('completion.share', { share: partPercent(c.parts[p]) })}</span></li>`).join('');
    return `<section class="completion"><h2>${th('completion.title', { percent: c.percent })}</h2><ul>${rows}</ul>${bookButtonHtml(c.percent)}</section>`;
  }

  private seedText = '';
  private seedListener = false;

  /** Shown on the pause card, the inventory and the death screen; clicking it copies a share link. */
  setSeed(label: string) {
    this.seedText = label;
    this.renderSeed();
    if (this.seedListener) return;
    this.seedListener = true;
    // capture phase: copying must not also capture the mouse or fire
    addEventListener('mousedown', e => {
      const t = (e.target as HTMLElement | null)?.closest?.('.seed');
      if (!t) return;
      e.stopPropagation();
      // the link carries only the seed and generator version, never the language (?lang)
      const [code, v] = this.seedText.split(' · v');
      const url = `${location.origin}${location.pathname}?seed=${code.replace(' ', '-')}&v=${v}`;
      navigator.clipboard?.writeText(url).then(() => this.toast('seed.copied'), () => this.toast('seed.label', { seed: this.seedText }));
    }, true);
  }

  private renderSeed() {
    const el = document.getElementById('seed');
    if (el && this.seedText) el.textContent = t('seed.copy', { seed: this.seedText });
  }

  /** `tier`: the colour tier of the projection that held the player, when it was Yellow or Red. */
  showDeath(depth: number, items: readonly ItemDef[], source: string, tier?: Tier) {
    this.dismissBanner();
    document.exitPointerLock?.();
    this.lastDeath = [depth, items, source, tier];
    this.renderDeath(depth, items, source, tier);
    this.deathEl.classList.add('show');
  }

  private renderDeath(depth: number, items: readonly ItemDef[], source: string, tier?: Tier) {
    const cause = tieredCause(source, tier);
    this.deathEl.innerHTML =
      `<div class="card slate"><h1>${th('death.title')}</h1><p>${th('death.cause', { cause, n: depth })}</p>` +
      `<div class="icons">${items.map(i => `<img src="${iconDataUrl(i, 3)}" title="${esc(itemText(i).name)}" alt="">`).join('')}</div>` +
      `${this.completionHtml()}<p class="seed">${th('seed.label', { seed: this.seedText })}</p><button type="button" class="go" data-act="restart">${th(forDevice('death.restart', activeDevice()))}</button></div>`;
  }

  hideDeath() { this.deathEl.classList.remove('show'); }

  // ───────────────────────── inventory window ─────────────────────────

  /** Opens the screen on a tab (or switches tabs when it is open). Opening pauses the world. */
  openScreen(g: Game, tab: ScreenTab) {
    this.game = g;
    if (tab === 'map') g.starMapSeen = true;
    if (!this.screenOpen) {
      this.screenOpen = true;
      if (g.input.device === 'keyboard') g.input.unlockFor(); else g.input.release();
      this.selected = g.inventory.items.at(-1)?.def.id ?? null;
    }
    this.screenTab = tab;
    this.renderScreen(g);
  }

  /** Closes the screen and returns to play; on the keyboard the mouse is captured again. */
  closeScreen(g: Game) {
    if (!this.screenOpen) return;
    this.screenOpen = false;
    this.showTab('menu');
    if (g.input.device === 'keyboard') { g.input.release(); g.input.lock(); }
    else g.input.resume();
  }

  /** Tab, Y and the touch tab button: the same screen, two tabs (docs/architecture/input/README.md). */
  screenKey(g: Game, by: Device) {
    const touchTab = by === 'touch';
    if (this.screenOpen && (touchTab || this.screenTab === 'items')) this.closeScreen(g);
    else this.openScreen(g, touchTab ? 'menu' : 'items');
  }

  /** M, View and the map tab (D15): the screen on the star map, or closed when the map is what it shows. */
  mapKey(g: Game) {
    if (mapKeyOutcome(this.screenOpen, this.screenTab) === 'close') this.closeScreen(g);
    else this.openScreen(g, 'map');
  }

  /** J, D-pad Down and the Recipes tab: the screen on the Recipe Book, or closed when the book is what it shows.
   *  The game calls it only while the Book of Secrets is held. */
  recipesKey(g: Game) {
    if (recipesKeyOutcome(this.screenOpen, this.screenTab) === 'close') this.closeScreen(g);
    else this.openScreen(g, 'recipes');
  }

  /** Scrolls the Recipe Book a step (navigate up or down on its tab). */
  scrollRecipes(dy: number) {
    this.overlay.scrollBy({ top: dy * 120 });
  }

  /** The Recipes tab shows only while the practice is held; it carries a mark until the book is first opened. A book
   *  on screen whose practice has gone (a toll took it) falls back to the menu. */
  private syncRecipesTab(g: Game) {
    const held = g.stats.get('recipes') >= 1;
    if (held !== this.recipesHeld) {
      this.recipesHeld = held;
      if (!held) this.recipesRead = false;
      if (!held && this.screenTab === 'recipes') { this.screenTab = 'menu'; if (this.screenOpen) this.renderScreen(g); }
    }
    const tab = this.overlay.querySelector<HTMLElement>('.tabs button[data-tab="recipes"]');
    if (!tab) return;
    if (tab.hidden === held) tab.hidden = !held;
    tab.classList.toggle('new', held && !this.recipesRead);
  }

  private renderScreen(g: Game) {
    if (this.screenTab === 'recipes' && g.stats.get('recipes') < 1) this.screenTab = 'menu';
    this.showTab(this.screenTab);
    if (this.screenTab === 'items') this.renderInventory(g);
    if (this.screenTab === 'map') this.mapEl.innerHTML = starMapHtml(g.starMap(), activeDevice());
    if (this.screenTab === 'recipes') {
      this.recipesRead = true;
      this.bookEl.innerHTML = recipeBookHtml(recipeBook(), {
        flask: id => iconDataUrl({ id: `flask.${id}`, icon: flaskIcon(id) }, 3),
        material: m => this.slotUrl(m),
      }, activeDevice());
    }
  }

  /** The active carried item changed (the game calls this): an open screen redraws its outline. */
  carriedChanged() {
    if (this.screenOpen && this.game) this.renderScreen(this.game);
  }

  /** The carried item the inventory has highlighted, as its hand slot; -1 when a practice is highlighted. */
  selectedCarried(): number {
    const m = /^hand:(\d+)$/.exec(this.selected ?? '');
    return m ? Number(m[1]) : -1;
  }

  private showTab(tab: ScreenTab) {
    if (tab === this.shownTab) return;
    this.shownTab = tab;
    this.overlay.dataset.tab = tab;
    this.overlay.scrollTop = 0;
    for (const b of this.overlay.querySelectorAll<HTMLElement>('.tabs button')) {
      b.setAttribute('aria-selected', String(b.dataset.tab === tab));
    }
  }

  moveSelection(dx: number, dy: number) {
    const g = this.game;
    if (!g) return;
    const root = this.tollOpen ? this.tollEl : this.invEl;
    const tiles = [...root.querySelectorAll<HTMLElement>('.tile, .hand-row .slot')];
    if (!tiles.length) return;
    const cols = Math.max(1, tiles.filter(b => b.offsetTop === tiles[0].offsetTop).length);
    const at = Math.max(0, tiles.findIndex(b => b.dataset.id === this.selected));
    const next = Math.min(tiles.length - 1, Math.max(0, at + dx + dy * cols));
    this.selected = tiles[next].dataset.id!;
    if (this.tollOpen) this.renderToll(g); else this.renderInventory(g);
    root.querySelector<HTMLElement>('.tile.sel, .tile.cur, .slot.sel')?.scrollIntoView({ block: 'nearest' });
  }

  openToll(g: Game, k: number) {
    this.game = g;
    this.tollOpen = true;
    this.tollFloor = k;
    this.tollPicked.clear();
    this.tollEl.classList.add('show');
    g.input.unlockFor();
    this.selected = this.tollIds(g)[0];
    this.renderToll(g);
  }

  closeToll(g: Game) {
    this.tollOpen = false;
    this.tollEl.classList.remove('show');
    if (g.input.device === 'keyboard') { g.input.release(); g.input.lock(); }
    else g.input.resume();
  }

  confirmToll(g: Game) {
    if (this.selected) this.tollAct(g, this.selected);
  }

  private tollIds(g: Game): string[] {
    const toll = tollOf(this.tollFloor);
    const p = g.player;
    const ids: string[] = [];
    // a promised piece (the Mender's Thread) is never offered to a toll (GIFTS.md, the promised trait)
    if (toll?.practices) g.inventory.items.forEach((it, i) => { if (!isPromised(it.def)) ids.push(`item:${i}`); });
    else if (toll) {
      ids.push(...handTollIds(p.hand));
      for (let i = 0; i < p.keys; i++) ids.push(`key:${i}`);
      for (let i = 0; i < p.bombs; i++) ids.push(`bomb:${i}`);
      ids.push(...heartTollIds(p.hp, p.layers, Math.floor(g.stats.get('maxHearts'))));
    }
    return [...ids, 'pay', 'close'];
  }

  private tollAct(g: Game, id: string) {
    const toll = tollOf(this.tollFloor);
    if (!toll) return;
    if (id === 'close') { this.closeToll(g); return; }
    if (id === 'pay') {
      if (this.tollPicked.size !== toll.count) this.toast('toll.need', { n: toll.count });
      else if (g.payToll(this.tollFloor, [...this.tollPicked])) { this.closeToll(g); return; }
      else this.toast('toll.cannot');
      this.renderToll(g);
      return;
    }
    if (this.tollPicked.has(id)) this.tollPicked.delete(id);
    else if (this.tollPicked.size < toll.count) this.tollPicked.add(id);
    this.renderToll(g);
  }

  private renderToll(g: Game) {
    const toll = tollOf(this.tollFloor);
    if (!toll) return;
    const p = g.player;
    const ids = this.tollIds(g);
    const cur = this.selected && ids.includes(this.selected) ? this.selected : ids[0];
    const tile = (id: string, icon: string, label: string) =>
      `<button type="button" class="tile${this.tollPicked.has(id) ? ' on' : ''}${id === cur ? ' cur' : ''}" data-id="${id}"><img src="${icon}" alt=""><span class="lbl">${esc(label)}</span></button>`;
    const section = (key: MessageKey, body: string) => (body ? `<h3>${th(key)}</h3>${body}` : '');
    // each heart is its own tile: base hearts with the health they hold, bonus hearts by their type
    const hearts = heartTollIds(p.hp, p.layers, Math.floor(g.stats.get('maxHearts'))).map(id => {
      const [kind, at] = id.split(':'), i = Number(at);
      if (kind === 'heart') return tile(id, hudIconUrl(HUD_ICONS.heart), tollHeartLabel(t('toll.heart'), heartQuarters(p.hp, i)));
      const layer = p.layers[i];
      return tile(id, hudIconUrl(HEART_HUD[layer.kind]), tollHeartLabel(t(`toll.layer.${layer.kind}`), heartQuarters(layer.hp, 0)));
    }).join('');
    const keys = Array.from({ length: p.keys }, (_, i) => tile(`key:${i}`, hudIconUrl(HUD_ICONS.key), t('toll.key'))).join('');
    const bombs = Array.from({ length: p.bombs }, (_, i) => tile(`bomb:${i}`, hudIconUrl(HUD_ICONS.seed), t('toll.bomb'))).join('');
    const hands = p.hand.map((m, i) => (typeof m === 'number'
      ? tile(`hand:${i}`, this.slotUrl(m), materialName(m))
      : isFlask(m)
        ? tile(`hand:${i}`, iconDataUrl(carriedDef(m), 3), flaskName(m))
        : tile(`hand:${i}`, iconDataUrl(m, 3), partText(m).name))).join('');
    const items = g.inventory.items.map((it, i) => isPromised(it.def) ? '' : tile(`item:${i}`, iconDataUrl(it.def, 3), itemText(it.def).name)).join('');
    const body = toll.practices
      ? section('toll.sec.item', items)
      : section('toll.sec.hand', hands) + section('toll.sec.key', keys) + section('toll.sec.bomb', bombs) + section('toll.sec.heart', hearts);
    const ready = this.tollPicked.size === toll.count;
    const device = activeDevice();
    this.tollEl.innerHTML =
      `<div class="card slate"><header><h2>${th('toll.title')}</h2>` +
      `<small>${th(toll.practices ? 'toll.leadPractices' : 'toll.lead', { n: toll.count })} · <b class="count">${th('toll.chosen', { n: this.tollPicked.size, total: toll.count })}</b></small></header>` +
      `<p class="hint">${th('toll.hint', controlParams(device))}</p>` +
      `<p class="hint cost">${this.tollCost(g)}</p>` +
      `<div class="grid">${body || `<p class="none">${th('toll.none')}</p>`}</div>` +
      `<div class="go-row"><button type="button" class="tile go${ready ? '' : ' off'}${cur === 'pay' ? ' cur' : ''}" data-id="pay"><span class="lbl">${th('toll.go')}</span></button>` +
      `<button type="button" class="tile go${cur === 'close' ? ' cur' : ''}" data-id="close"><span class="lbl">${th('toll.stay')}</span></button></div></div>`;
    for (const b of this.tollEl.querySelectorAll<HTMLButtonElement>('.tile')) {
      b.addEventListener('mouseenter', () => this.moveCursor(b.dataset.id!));
      b.addEventListener('click', () => { this.moveCursor(b.dataset.id!); this.tollAct(g, b.dataset.id!); });
    }
  }

  /** What the picks would cost, in words: the bonus hearts by type, the base hearts, and the health and capacity left. */
  private tollCost(g: Game): string {
    const p = g.player, maxHearts = Math.floor(g.stats.get('maxHearts'));
    const { base, bonus } = splitHeartPicks(this.tollPicked);
    if (!base.length && !bonus.length) return th('toll.costNone');
    const plan = heartTollPlan(p.hp, maxHearts, p.layers, base, bonus);
    if (!plan) return th('toll.cannot');
    const lines: string[] = [];
    if (bonus.length) lines.push(th('toll.costBonus', { list: bonus.map(j => t(`toll.layer.${p.layers[j].kind}`)).join(', ') }));
    if (base.length) lines.push(th('toll.costBase', { n: base.length }));
    lines.push(th('toll.costNow', {
      hpFrom: fmtNum(p.hp / HEART, 2), hpTo: fmtNum(plan.hp / HEART, 2),
      capFrom: fmtNum(maxHearts, 0), capTo: fmtNum(plan.maxHearts, 0),
    }));
    return lines.join('<br>');
  }

  private moveCursor(id: string) {
    this.selected = id;
    this.tollEl.querySelector('.tile.cur')?.classList.remove('cur');
    this.tollEl.querySelector(`.tile[data-id="${id}"]`)?.classList.add('cur');
  }

  private renderInventory(g: Game) {
    const s = g.stats.all;
    const held = g.inventory.items.map(i => i.def);
    const counts = new Map<string, number>();
    for (const d of held) counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
    const unique = [...new Map(held.map(d => [d.id, d])).values()];
    const hand = g.player.hand, chosen = g.player.activeIndex;
    const ids =[...hand.map((_, i) => `hand:${i}`), ...unique.map(d => d.id)];
    const selId = ids.find(id => id === this.selected) ?? ids.at(-1);
    const sel = unique.find(d => d.id === selId);
    const handSel = selId?.startsWith('hand:') ? hand[Number(selId.slice(5))] : undefined;

    const tile = (id: string, c: number, icon: { id: string; icon: ItemDef['icon'] }, name: string, n: number) =>
      `<button class="tile${id === selId ? ' sel' : ''}" data-id="${id}" style="--c:${hex(c)}">` +
      `<img src="${iconDataUrl(icon, 3)}" alt=""><span class="lbl">${esc(name)}</span>${n > 1 ? `<i>×${n}</i>` : ''}</button>`;
    const grid = unique.map(d => tile(d.id, d.color, d, itemText(d).name, counts.get(d.id) ?? 1)).join('');
    const handBlock = hand.length ? `<h3>${th('inv.hand')}</h3><div class="hand-row"></div>` : '';
    const top = chosen >= 0 ? hand[chosen] : undefined;
    const inHand = top && isFlask(top) ? this.inHandBlock(top) : '';

    const detail = sel ? this.itemDetail(sel, g.inventory.items.filter(i => i.def.id === sel.id).map(i => i.stacks))
      : handSel ? this.carriedDetail(handSel)
      : `<p class="none">${th('inv.empty')}</p>`;

    const active = new Set(g.inventory.synergiesActive.map(x => x.id));
    const synRows = SYNERGIES.map(sy => {
      const met = sy.requires.filter(r => g.inventory.meets(r)).length;
      if (!active.has(sy.id) && met === 0) return '';
      const reqs = sy.requires.map(r => this.reqLabel(r, g)).join(' + ');
      const st = synergyText(sy);
      return active.has(sy.id)
        ? `<li class="on"><b>✦ ${esc(st.name)}</b><span>${esc(st.description)}</span><small>${reqs}</small></li>`
        : `<li class="off"><b>✧ ???</b><small>${reqs} (${met}/${sy.requires.length})</small></li>`;
    }).join('');

    // the Covenant (COVENANT.md): each piece held is a labelled tile with its gold seam and "promised"; nothing shows before
    // the first piece, so the set is never announced before it is begun
    const pieces = g.covenantPieces;
    const covenant = pieces.length
      ? `<h3>${th('covenant.title')} <small>${pieces.length}/${COVENANT_PIECES.length}</small></h3><ul class="covenant">` + pieces.map(p =>
        `<li class="piece"><b>${th(`covenant.piece.${p}` as MessageKey)}</b><span>${th(`covenant.from.${p}` as MessageKey)}</span><small>${th('covenant.promised')}</small></li>`).join('') + '</ul>'
      : '';

    const stats = STAT_ORDER.map(n => `<tr><td>${esc(statLabel(n))}</td><td>${esc(fmtStat(n, s[n]))}</td></tr>`).join('');

    this.invEl.innerHTML =
      `<div class="card slate"><header><h2>${th('inv.title')}</h2><small>${th('inv.held', { n: held.length })} · <span class="seed">${th('inv.seed', { seed: this.seedText })}</span> · ${th(forDevice('inv.close', activeDevice()))}</small><button type="button" class="close" data-act="inventory" aria-label="${th('inv.closeLabel')}">✕</button></header>` +
      `<div class="cols"><section class="left">${inHand}${handBlock}<div class="grid">${grid || '<p class="none">—</p>'}</div>${detail}` +
      `<h3>${th('inv.synergies')}</h3><ul class="syns">${synRows || `<li class="none">${th('inv.noSynergies')}</li>`}</ul>${covenant}</section>` +
      `<section class="right"><h3>${th('inv.state')}</h3><table>${stats}</table></section></div></div>`;

    // the carried items are the HUD's own hand slots, chosen by a click or a tap
    this.invEl.querySelector('.hand-row')?.replaceChildren(...hand.map((c, i) => {
      const slot = this.handSlot(c, i === chosen);
      slot.dataset.id = `hand:${i}`;
      slot.classList.toggle('sel', selId === slot.dataset.id);
      return slot;
    }));
    for (const b of this.invEl.querySelectorAll<HTMLElement>('.tile, .hand-row .slot')) {
      // only a new tile redraws: redrawing replaces the tile under the pointer, and a redraw between press and release
      // would send the click to no tile (#356)
      b.addEventListener('mouseenter', () => { if (hoverRedraws(this.selected, b.dataset.id!)) { this.selected = b.dataset.id!; this.renderInventory(g); } });
      b.addEventListener('click', () => {
        this.selected = b.dataset.id!;
        if (this.selected.startsWith('hand:')) g.chooseCarried(this.selectedCarried());
        this.renderInventory(g);
      });
    }
  }

  private carriedDetail(c: Carried) {
    return `<div class="detail"><header class="d-head"><div><b class="d-name">${esc(this.carriedLabel(c))}</b></div></header>` +
      `<section class="d-block"><p>${th(forDevice('inv.choose', activeDevice()))}</p></section></div>`;
  }

  private carriedLabel(c: Carried): string {
    if (typeof c === 'number') return materialName(c);
    if (isFlask(c)) return flaskName(c);
    return partText(c).name;
  }

  /**
   * A practice in three blocks, always in this order (issue #202): the teaching (a phrase that carries the practice into
   * everyday life, how to live it, and its credit), what it does in the game, and the stats it changes.
   */
  private itemDetail(d: ItemDef, copies: readonly number[] = []) {
    const fx = copyMods(d, 0).map(m => {
      const n = fmtNum(m.value);
      const v = m.layer === 'mul' ? t('unit.times', { n }) : m.layer === 'final' ? `= ${n}` : `${m.value > 0 ? '+' : ''}${n}`;
      const dir = m.layer === 'mul' ? (m.value >= 1 ? 'up' : 'down') : m.layer === 'final' ? 'set' : m.value >= 0 ? 'up' : 'down';
      return `<li class="${dir}"><span>${esc(statLabel(m.stat))}</span><b>${esc(v)}</b></li>`;
    }).join('');
    const paths = (d.tags ?? []).filter(isPath).map(p => `<em class="path" style="--p:${pathColor(p)}">${PATH_GLYPH[p as PathName]} ${esc(pathName(p))}</em>`).join('');
    const tx = itemText(d), lesson = practiceTeaching(d);
    return `<div class="detail" style="--c:${hex(d.color)}"><header class="d-head"><img src="${iconDataUrl(d, 6)}" alt="">` +
      `<div><b class="d-name">${esc(tx.name)}</b><span class="q q${d.quality}">${qualityStars(d.quality)}</span> ${paths}</div></header>` +
      `<section class="d-block d-teach"><h4>${th('inv.teaching')}</h4><blockquote>${esc(lesson.quote)}</blockquote><p>${esc(lesson.lesson)}</p>` +
      `${tx.inspiredBy ? `<small>${th('banner.inspired', { credit: tx.inspiredBy })}</small>` : ''}</section>` +
      `<section class="d-block d-game"><h4>${th('inv.inGame')}</h4><p>${esc(tx.description)}</p><p class="effect">${esc(tx.effect)}</p>` +
      `${d.stack && copies.length ? `<p class="stacks">${copies.map(n => th('inv.stacks', { n, max: d.stack!.max })).join(' · ')}</p>` : ''}</section>` +
      `<section class="d-block d-stats"><h4>${th('inv.stats')}</h4>${fx ? `<ul class="fx">${fx}</ul>` : `<p class="none">${th('inv.noStats')}</p>`}</section></div>`;
  }

  private reqLabel(r: Req, g: Game) {
    if (typeof r !== 'string') {
      const have = g.inventory.countTag(r.tag), need = r.count ?? 1;
      const label = isPath(r.tag) ? `${PATH_GLYPH[r.tag as PathName]} ${pathName(r.tag)}` : r.tag;
      return `<em class="path" style="--p:${isPath(r.tag) ? pathColor(r.tag) : palCss('bone.dim')}">${esc(label)} ${Math.min(have, need)}/${need}</em>`;
    }
    const held = g.inventory.has(r);
    const def = g.inventory.items.find(i => i.def.id === r)?.def;
    return held && def ? esc(itemText(def).name) : '???';
  }
}
