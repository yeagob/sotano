import type { Behaviour, Enemy } from '../../enemies/types';

export const still: Behaviour = {
  name: 'still',
  update(e: Enemy) {
    e.wishX = 0; e.wishZ = 0; e.pulse = 0;
  },
};
