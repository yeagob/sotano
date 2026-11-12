// The page stone (docs/design/not-built/levels/roots/PAGES.md §4): from the first book page on, the middle block
// of the start room's north wall carries a small square of limestone with the shown page's number cut in the
// serif of the prose panels, under the gold diamond. It is a decal on the block's face, not a new block. Like a
// panel, it is carved offscreen and swapped in one step; on tutorial pages it is hidden.

import * as THREE from 'three';
import { palCss } from '../content/palette';
import { fitLine, pageStoneMount, pageStoneShows } from './panel-layout';
import { carveSlab } from './tablets';

/** The stone's canvas: square, sharp enough for three digits at the distance of the room. */
export const STONE_PX = 256;

const SERIF = 'Georgia, "Times New Roman", serif';

/** Carves the stone with a page number on a STONE_PX square context. */
export function carvePageStone(g: CanvasRenderingContext2D, page: number) {
  const S = STONE_PX;
  carveSlab(g, `page-stone-${page}`, S, S, 12, 6);
  // the gold diamond above the number
  const cx = S / 2, cy = 58, r = 16;
  g.fillStyle = palCss('light.gold');
  g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); g.fill();
  g.save(); g.globalAlpha = 0.35; g.fillStyle = palCss('light.dusk');
  g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.closePath(); g.fill();
  g.restore();
  // the number, cut deep: as large as fits in the face
  const text = String(page);
  const fit = fitLine(text, S - 64, { from: 132, to: 64, step: 4 }, (s, px) => { g.font = `bold ${px}px ${SERIF}`; return g.measureText(s).width; });
  g.font = `bold ${fit.px}px ${SERIF}`;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  const base = 214;
  g.save(); g.globalAlpha = 0.55; g.fillStyle = palCss('limestone.hi'); g.fillText(text, cx + 2, base + 3); g.restore();
  g.fillStyle = palCss('ink.line'); g.fillText(text, cx, base);
  g.textAlign = 'left';
}

/** The stone on the start room's wall. Mount it once per run; `show` it for each page the walls turn to. */
export class PageStone {
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;
  private readonly mesh: THREE.Mesh;
  private page: number | undefined;

  constructor(private scene: THREE.Object3D) {
    this.canvas.width = this.canvas.height = STONE_PX;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.texture }));
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  /** Sets the stone into the start room whose interior corner is (x0, y0, z0). */
  mount(x0: number, y0: number, z0: number) {
    const m = pageStoneMount(x0, y0, z0);
    this.mesh.position.set(m.x, m.y, m.z);
    this.mesh.rotation.y = m.rotY;
    this.mesh.scale.set(m.w, m.h, 1);
  }

  /** Shows a page: its number on a book page, nothing on a tutorial page. Carved offscreen, swapped in one step. */
  show(page: number, kind: 'tutorial' | 'book') {
    if (!pageStoneShows(kind)) { this.mesh.visible = false; return; }
    if (page !== this.page) {
      const off = document.createElement('canvas');
      off.width = off.height = STONE_PX;
      carvePageStone(off.getContext('2d')!, page);
      this.canvas.getContext('2d')!.drawImage(off, 0, 0);
      this.texture.needsUpdate = true;
      this.page = page;
    }
    this.mesh.visible = true;
  }

  /** The block under it was broken: the stone goes with it until the next run. */
  hide() { this.mesh.visible = false; }

  dispose() {
    this.texture.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.scene.remove(this.mesh);
  }
}
