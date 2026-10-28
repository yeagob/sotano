import { pal } from '../palette';
import { chase } from '../../enemies/behaviours';
import { defineEnemy, TX } from '../../enemies/types';

const crate = (x: number, y: number, z: number, w: number, h: number) => ({ size: [w * TX, h * TX, w * TX] as [number, number, number], pos: [x * TX, y * TX, z * TX] as [number, number, number], color: pal('husk.doubt.base') });

const laters = (id: string, name: string, hp: number, speed: number, scale: number, split: string[] | undefined, minFloor: number, maxFloor: number, cost: number) => defineEnemy({
  id,
  name,
  pattern: 'Later',
  hp,
  speed,
  size: [0.3 * scale, 0.9 * scale],
  contactDamage: 3,
  cost,
  minFloor,
  maxFloor,
  split,
  behaviour: chase({ hesitate: { every: 2.5, pause: 1 } }),
  model: [
    crate(-3, 0, 0, 6, 5),
    crate(3, 0, -2, 5, 4),
    crate(0, 5, 0, 6, 4),
    { size: [2 * TX, 2 * TX, TX / 2], pos: [-1 * TX, 7 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
    { size: [2 * TX, 2 * TX, TX / 2], pos: [2 * TX, 7 * TX, 3.25 * TX], color: pal('cold.white'), glow: true, name: 'tell' },
  ],
});

export const procrastinationC = laters('procrastination-c', 'Later', 4, 1.9, 0.5, undefined, 99, 99, 1);
export const procrastinationB = laters('procrastination-b', 'Later', 9, 1.4, 0.75, ['procrastination-c', 'procrastination-c'], 99, 99, 1);

export default laters('procrastination', 'Procrastination', 18, 0.9, 1, ['procrastination-b', 'procrastination-b'], 2, 5, 2);
