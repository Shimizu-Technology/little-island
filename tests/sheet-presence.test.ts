import { afterEach, describe, expect, it, vi } from 'vitest';
import { holdSheet, sheetsHeldForTest } from '../src/components/sheetPresence';

describe('sheet presence coordinator', () => {
  afterEach(() => { vi.useRealTimers(); });
  it('counts held sheets and releases each token exactly once', () => {
    const before = sheetsHeldForTest();
    const a = holdSheet(), b = holdSheet();
    expect(sheetsHeldForTest()).toBe(before + 2);
    a(); a();
    expect(sheetsHeldForTest()).toBe(before + 1);
    b();
    expect(sheetsHeldForTest()).toBe(before);
  });
});
