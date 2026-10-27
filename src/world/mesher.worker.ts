import { meshChunk } from './mesher';
import { meshElements } from './elem-mesher';

/** One request per chunk and layer: blocks (with the element layer for the warm glow) or elements. */
export interface MeshRequest { key: string; version: number; layer: 'blocks' | 'elem'; padded: Uint8Array; elem: Uint8Array; size: number }

self.onmessage = (e: MessageEvent<MeshRequest>) => {
  const { key, version, layer, padded, elem, size } = e.data;
  const m = layer === 'blocks' ? { ...meshChunk(padded, size, elem), groups: null } : meshElements(padded, elem, size);
  (self as unknown as Worker).postMessage(
    { key, version, layer, ...m },
    [m.positions.buffer, m.uvs.buffer, m.colors.buffer, m.indices.buffer],
  );
};
