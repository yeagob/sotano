import * as THREE from 'three';
import { palCss } from '../content/palette';
import { MASTERY_STONE, masteryStoneMount, masteryStoneWidth, romanNumeral } from './mastery-layout';
import { fitLine } from './panel-layout';
import { carveSlab } from './tablets';

const SERIF = 'Georgia, "Times New Roman", serif';

export function masteryStonePx(level: number): { w: number; h: number } {
  const s = MASTERY_STONE;
  return { w: Math.round(masteryStoneWidth(level) * s.pxPerBlock), h: Math.round(s.h * s.pxPerBlock) };
}

function trackedWidth(g: CanvasRenderingContext2D, text: string, px: number): number {
  g.font = `bold ${px}px ${SERIF}`;
  let w = 0;
  for (const ch of text) w += g.measureText(ch).width;
  return w + Math.max(0, text.length - 1) * px * MASTERY_STONE.tracking;
}

function interpunct(g: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  g.fillStyle = palCss('light.gold');
  g.beginPath(); g.moveTo(cx, cy - r); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r, cy); g.closePath(); g.fill();
  g.save(); g.globalAlpha = 0.35; g.fillStyle = palCss('light.dusk');
  g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.lineTo(cx, cy + r); g.closePath(); g.fill();
  g.restore();
}

export function carveMasteryStone(g: CanvasRenderingContext2D, level: number) {
  const s = MASTERY_STONE;
  const { w: W, h: H } = masteryStonePx(level);
  const text = romanNumeral(level);
  carveSlab(g, `mastery-stone-${text}`, W, H, 16, 8);
  const r = s.dot, gap = s.dotGap;
  const room = W - 2 * s.margin - 2 * (gap + 2 * r);
  const px = fitLine(text, room, { from: s.fontPx, to: 96, step: 4 }, (t, p) => trackedWidth(g, t, p)).px;
  g.font = `bold ${px}px ${SERIF}`;
  const m = g.measureText(text);
  const half = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  const base = H / 2 + half, mid = H / 2;
  const width = trackedWidth(g, text, px);
  const left = (W - width) / 2;
  interpunct(g, left - gap - r, mid, r);
  interpunct(g, left + width + gap + r, mid, r);
  g.font = `bold ${px}px ${SERIF}`;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  let x = left;
  for (const ch of text) {
    g.save(); g.globalAlpha = 0.55; g.fillStyle = palCss('limestone.hi'); g.fillText(ch, x + 3, base + 4); g.restore();
    g.fillStyle = palCss('ink.line'); g.fillText(ch, x, base);
    x += g.measureText(ch).width + px * s.tracking;
  }
}

export class MasteryStone {
  private readonly canvas = document.createElement('canvas');
  private readonly texture: THREE.CanvasTexture;
  private readonly mesh: THREE.Mesh;

  constructor(private scene: THREE.Object3D) {
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: this.texture }));
    this.mesh.visible = false;
    scene.add(this.mesh);
  }

  mount(x0: number, y0: number, z0: number, level: number) {
    const m = masteryStoneMount(x0, y0, z0, level);
    this.mesh.position.set(m.x, m.y, m.z);
    this.mesh.rotation.y = m.rotY;
    this.mesh.scale.set(m.w, m.h, 1);
    const px = masteryStonePx(level);
    this.canvas.width = px.w;
    this.canvas.height = px.h;
    carveMasteryStone(this.canvas.getContext('2d')!, level);
    this.texture.needsUpdate = true;
    this.mesh.visible = true;
  }

  hide() { this.mesh.visible = false; }

  dispose() {
    this.texture.dispose();
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.scene.remove(this.mesh);
  }
}
