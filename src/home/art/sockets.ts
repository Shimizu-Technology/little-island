import type { Socket } from '../world';
const socket = (id: string, kind: Socket['kind'], x: number, y: number, covered = true): Socket => ({ id, kind, at: [x / 150, y / 150], facing: kind === 'lie' ? 'left' : 'front', covered });
/** Coordinates use the square SVG viewport, including its padding. */
export const seatSockets: Record<string, readonly Socket[]> = {
  bed: [socket('pillow', 'lie', 34, 73)],
  'bunk-bed': [socket('lower', 'lie', 34, 102), socket('upper', 'lie', 34, 42)],
  hammock: [socket('sling', 'lie', 35, 77)],
  sofa: [socket('pillow', 'lie', 34, 81)],
  armchair: [socket('seat', 'sit', 75, 100)],
  beanbag: [socket('seat', 'sit', 75, 105)],
  chair: [socket('seat', 'sit', 75, 100, false)],
  'rocking-chair': [socket('seat', 'sit', 75, 100, false)],
  stool: [socket('seat', 'sit', 75, 94, false)],
  bench: [socket('left', 'sit', 47, 98, false), socket('right', 'sit', 104, 98, false)],
  'floor-cushion': [socket('seat', 'sit', 75, 117, false)],
  bathtub: [socket('water', 'bathe', 75, 79)],
  'bubble-bath': [socket('water', 'bathe', 75, 79)],
};
