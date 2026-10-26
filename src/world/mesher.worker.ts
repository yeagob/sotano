import { meshChunk } from './mesher';

export interface MeshRequest { key: string; version: number; padded: Uint8Array; size: number }

self.onmessage = (e: MessageEvent<MeshRequest>) => {
  const { key, version, padded, size } = e.data;
  const m = meshChunk(padded, size);
  (self as unknown as Worker).postMessage(
    { key, version, ...m },
    [m.positions.buffer, m.uvs.buffer, m.colors.buffer, m.indices.buffer],
  );
};
