// ?gallery=book (docs/design/not-built/levels/roots/PANELS.md §9): every panel of every page of the Roots' book,
// in English and Spanish, for keyboard, gamepad and touch where the panel depends on the device, carved by the
// game's own renderer (src/render/tablets.ts). A panel whose text runs past its lines or its width is outlined in
// red and named; a panel whose image file is missing is outlined in yellow (it shows the neutral placeholder).
// The summary at the top lists both, and `window.__book` holds it for scripts. Then the panels on a wall of the
// Roots seen from where a player stands, and the page stone.
// Not part of `?gallery` (all): it carves several hundred panels. Parameters:
//   &lang=en|es  &device=keyboard|gamepad|touch  &page=7  &id=7-gift-n  &scale=1 (default 0.5)
//   &view=room   only the room view and the page stone; &view=panels only the panels

import * as THREE from 'three';
import { loadBook, pageCount, type Book, type Lang, type Panel } from '../../content/book';
import { MATERIALS } from '../../content/materials';
import { pal, palCss } from '../../content/palette';
import type { Device } from '../../input/bindings';
import { materialCanvas } from '../../render/atlas';
import { STONE_PX, carvePageStone } from '../../render/page-stone';
import { PANEL_H, PANEL_W, panelImageIds, panelMount } from '../../render/panel-layout';
import { carvePanel, panelImages, type PanelReport, type PanelVoice } from '../../render/tablets';
import type { GalleryKit } from '../gallery';

const LANGS: Lang[] = ['en', 'es'];
const DEVICES: Device[] = ['keyboard', 'gamepad', 'touch'];

/** A panel changes with the device only when it draws a key cap or fills a control placeholder. */
const byDevice = (p: Panel) => (p.layout === 'lesson' && p.key !== undefined) || ((p.layout === 'lesson' || p.layout === 'plate') && p.text.includes('{'));

/** The panels a page carries itself (the slots it leaves out show page 1's), in book order. */
function ownPanels(book: Book, page: number): Panel[] {
  const out: Panel[] = [];
  for (const slot of Object.values(book.pages[page - 1].panels)) for (const p of Object.values(slot ?? {})) if (p) out.push(p);
  return out;
}

/** The remembered panels of the easy layout (EASY-LAYOUT §4), in book order: the easy-* ids. */
function rememberedPanels(book: Book): Panel[] {
  const out: Panel[] = [];
  for (const slot of Object.values(book.easy ?? {})) for (const p of Object.values(slot ?? {})) if (p) out.push(p);
  return out;
}

function carved(panel: Panel, page: number, voice: PanelVoice): { canvas: HTMLCanvasElement; report: PanelReport } {
  const c = document.createElement('canvas');
  c.width = PANEL_W; c.height = PANEL_H;
  const report = carvePanel(c.getContext('2d')!, panel, page, voice);
  return { canvas: c, report };
}

function shrink(src: HTMLCanvasElement, k: number): HTMLCanvasElement {
  if (k === 1) return src;
  const c = document.createElement('canvas');
  c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export async function bookGallery(kit: GalleryKit, params: URLSearchParams) {
  const langs = LANGS.filter(l => !params.get('lang') || params.get('lang') === l);
  const devices = DEVICES.filter(d => !params.get('device') || params.get('device') === d);
  const pageOnly = params.get('page') ? Number(params.get('page')) : undefined;
  const idOnly = params.get('id') ?? kit.only;
  const k = Number(params.get('scale') ?? 0.5);
  const roomOnly = params.get('view') === 'room';
  const panelsOnly = params.get('view') === 'panels';

  const books = Object.fromEntries(LANGS.map(l => [l, loadBook(l)])) as Record<Lang, Book>;
  const ids = new Set<string>();
  for (const l of LANGS) for (let page = 1; page <= pageCount(books[l]); page++) for (const p of ownPanels(books[l], page)) for (const id of panelImageIds(p)) ids.add(id);
  for (const l of LANGS) for (const p of rememberedPanels(books[l])) for (const id of panelImageIds(p)) ids.add(id);
  await panelImages.preload(ids);

  const summary = document.createElement('pre');
  summary.style.cssText = `color:${palCss('bone.paper')};font-size:13px;white-space:pre-wrap;margin:8px 0`;
  kit.head('Book panels (PANELS.md): every page, both languages, every device');
  kit.root.appendChild(summary);

  const overflow: string[] = [], missing = new Map<string, Set<string>>();
  if (!roomOnly) for (const lang of langs) {
    const book = books[lang];
    const sections: { title: string; page: number; panels: Panel[] }[] = [];
    for (let page = 1; page <= pageCount(book); page++) {
      if (pageOnly !== undefined && page !== pageOnly) continue;
      sections.push({ title: `${lang.toUpperCase()} · page ${page} (${book.pages[page - 1].id}, ${book.pages[page - 1].kind})`, page, panels: ownPanels(book, page) });
    }
    // the remembered panels (easy-*): the easy layout's slots, carved as page 1 (they carry no page number)
    if (pageOnly === undefined) sections.push({ title: `${lang.toUpperCase()} · remembered panels (easy layout, easy-*)`, page: 1, panels: rememberedPanels(book) });
    for (const sec of sections) {
      const page = sec.page;
      const panels = sec.panels.filter(p => !idOnly || p.id === idOnly);
      if (panels.length === 0) continue;
      kit.head(sec.title);
      const r = kit.row();
      for (const panel of panels) {
        for (const device of byDevice(panel) ? devices : [devices[0] ?? 'keyboard']) {
          const { canvas, report } = carved(panel, page, { lang, device });
          const shown = shrink(canvas, k);
          const flags: string[] = [];
          if (report.overflow.length) {
            flags.push(`OVERFLOW: ${report.overflow.join(', ')}`);
            overflow.push(`${panel.id} · ${lang} · ${device}: ${report.overflow.join(', ')}`);
            shown.style.outline = `6px solid ${palCss('attack.red.base')}`;
          }
          for (const id of report.missing) {
            flags.push(`NO IMAGE: ${id}`);
            if (!missing.has(id)) missing.set(id, new Set());
            missing.get(id)!.add(panel.id);
            if (!report.overflow.length) shown.style.outline = `6px solid ${palCss('attack.warn.base')}`;
          }
          const label = `${panel.id} · ${panel.layout} · ${lang} · ${byDevice(panel) ? device : 'every device'}${flags.length ? ' · ' + flags.join(' · ') : ''}`;
          kit.fig(r, shown, label);
          shown.dataset.panel = panel.id;
          shown.dataset.flags = flags.join(' | ');
        }
      }
    }
  }

  const missingLines = [...missing].map(([img, panels]) => `${img} (${[...panels].join(', ')})`);
  summary.textContent = [
    `Overflow: ${overflow.length === 0 ? 'none' : ''}`, ...overflow.map(s => `  ${s}`),
    `Missing images: ${missingLines.length === 0 ? 'none' : missingLines.length}`, ...missingLines.map(s => `  ${s}`),
  ].join('\n');
  (window as unknown as { __book: unknown }).__book = { overflow, missing: Object.fromEntries([...missing].map(([i, p]) => [i, [...p]])) };

  if (panelsOnly) return;
  roomView(kit, books, langs);
  kit.head('The page stone (pages 7, 54 and 100), ×1');
  const sr = kit.row();
  for (const page of [7, 54, 100]) {
    const c = document.createElement('canvas');
    c.width = c.height = STONE_PX;
    carvePageStone(c.getContext('2d')!, page);
    kit.fig(sr, c, `page ${page}`);
  }
}

/**
 * The panels as a player sees them: on a wall of packed earth (floor 0's material) in the dungeon's fog, from eye
 * height, at 2.5, 4 and 6.5 blocks (a 13 × 7 room: close, from its middle, and from the far wall), in a 960 × 540
 * frame at the game's field of view. One WebGL context for every frame.
 */
function roomView(kit: GalleryKit, books: Record<Lang, Book>, langs: Lang[]) {
  const W = 960, H = 540;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  const loam = MATERIALS.find(m => m.key === 'loam')!.id;
  const wallTex = new THREE.CanvasTexture(materialCanvas(loam));
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
  wallTex.magFilter = THREE.NearestFilter;
  wallTex.colorSpace = THREE.SRGBColorSpace;
  wallTex.repeat.set(13, 5);
  const sample = ['1-hall-n', '1-step-n', '1-hall-s', '3-dig-n', '7-hall-s', '7-gift-n'];
  for (const lang of langs) {
    kit.head(`${lang.toUpperCase()} · on the wall, from eye height, in the dungeon fog (2.5, 4 and 6.5 blocks, at 960 × 540)`);
    const r = kit.row();
    for (const id of sample) {
      const page = Number(id.split('-')[0]);
      const panel = ownPanels(books[lang], page).find(p => p.id === id);
      if (!panel) continue;
      const c = document.createElement('canvas');
      c.width = PANEL_W; c.height = PANEL_H;
      carvePanel(c.getContext('2d')!, panel, page, { lang, device: 'keyboard' });
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy() >= 4 ? 4 : 1;
      const m = panelMount(id.startsWith('1-step') ? 'roots-step' : 'roots-hall', 'north', 0, 0, 0);
      for (const dist of [2.5, 4, 6.5]) {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(pal('fog.f1'));
        scene.fog = new THREE.Fog(pal('fog.f1'), 6, 34);
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(13, 5), new THREE.MeshBasicMaterial({ map: wallTex }));
        wall.position.set(6.5, 2.5, 0);
        scene.add(wall);
        const slab = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h),new THREE.MeshBasicMaterial({ map: tex }));
        slab.position.set(m.x, m.y, m.z);
        scene.add(slab);
        const cam = new THREE.PerspectiveCamera(75, W / H, 0.05, 200);
        cam.position.set(m.x + 1.2, 1.62, dist);
        cam.lookAt(m.x, m.y, 0);
        renderer.render(scene, cam);
        const out = document.createElement('canvas');
        out.width = W; out.height = H;
        out.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
        kit.fig(r, out, `${id} · ${dist} blocks`);
        wall.geometry.dispose(); (wall.material as THREE.Material).dispose();
        slab.geometry.dispose(); (slab.material as THREE.Material).dispose();
      }
      tex.dispose();
    }
  }
  wallTex.dispose();
  renderer.dispose();
}
