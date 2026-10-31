import { describe, expect, it, vi } from 'vitest';
import { place } from '../src/audio/sfx';

// The AudioParam path (Chromium) and the setPosition path (Firefox, where positionX is missing).
describe('placing a panner or the listener', () => {
  it('sets the AudioParams when the browser has them', () => {
    const node = { positionX: { value: 0 }, positionY: { value: 0 }, positionZ: { value: 0 }, setPosition: vi.fn() };
    place(node as unknown as AudioListener, 1, 2, 3);
    expect([node.positionX.value, node.positionY.value, node.positionZ.value]).toEqual([1, 2, 3]);
    expect(node.setPosition).not.toHaveBeenCalled();
  });

  it('falls back to setPosition when positionX is missing (Firefox) instead of throwing', () => {
    const node = { setPosition: vi.fn() };
    expect(() => place(node as unknown as AudioListener, 1, 2, 3)).not.toThrow();
    expect(node.setPosition).toHaveBeenCalledWith(1, 2, 3);
  });
});
