import { describe, expect, it } from 'vitest';
import { stageWidth } from '../src/home/stage';

describe('2.2 review fixes', () => {
  it('fits the Island Home stage to the available height in landscape', () => {
    const available = 390 - 120 - 21;
    const w = stageWidth({ width: 844, height: 390 }, 0, available, 560);
    expect(w * 560 / 800).toBeLessThanOrEqual(available + 1e-9);
    expect(w).toBeLessThanOrEqual(844);
  });
  it('keeps a life-sized, sideways-scrolling stage in portrait', () => {
    const available = 844 - 120 - 80;
    const w = stageWidth({ width: 390, height: 844 }, 0, available, 560);
    expect(w).toBeGreaterThanOrEqual(390);
    expect(w).toBeCloseTo(available * 800 / 560, 6);
  });
  it('never goes negative', () => {
    expect(stageWidth({ width: 844, height: 390 }, 900, -10, 560)).toBe(0);
  });
});
