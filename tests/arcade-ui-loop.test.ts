import { beforeEach, describe, expect, it, vi } from "vitest";
import { useArcadeUiLoop } from "../src/arcade/uiLoop";
const runtime = vi.hoisted(() => ({ slots: [] as unknown[], index: 0, effects: [] as (() => void)[], cleanups: [] as (() => void)[], queued: [] as (() => void)[], active: false, frame: null as null | ((info: { timestamp: number; timeSincePreviousFrame: number | null; timeSinceFirstFrame: number }) => void) }));
vi.mock("react", () => {
  const useRef = (value: unknown) => { const index = runtime.index++; return runtime.slots[index] ?? (runtime.slots[index] = { current: value }); };
  return { useRef, useState: (value: unknown) => { const index = runtime.index++; if (!(index in runtime.slots)) runtime.slots[index] = typeof value === "function" ? value() : value; return [runtime.slots[index], (next: unknown) => { runtime.slots[index] = next; }]; },
    useCallback: (fn: unknown, deps: unknown[]) => {
      const index = runtime.index++, old = runtime.slots[index] as { fn: unknown; deps: unknown[] } | undefined;
      if (old && deps.length === old.deps.length && deps.every((v, i) => Object.is(v, old.deps[i]))) return old.fn;
      runtime.slots[index] = { fn, deps }; return fn;
    },
    useLayoutEffect: (fn: () => void) => { fn(); },
    useEffect: (fn: () => void | (() => void), deps: unknown[]) => {
      const index = runtime.index++, old = runtime.slots[index] as { deps: unknown[]; cleanup?: () => void } | undefined;
      if (old && deps.length === old.deps.length && deps.every((v, i) => Object.is(v, old.deps[i]))) return;
      runtime.effects.push(() => { old?.cleanup?.(); const cleanup = fn(); runtime.slots[index] = { deps, cleanup }; if (cleanup) runtime.cleanups.push(cleanup); });
    } };
});
vi.mock("react-native-reanimated", async () => {
  const { useRef } = await import("react");
  return { useSharedValue: (value: unknown) => {
    const slot = useRef({ value, set(next: unknown) { this.value = next; } }); return slot.current;
  }, runOnJS: (fn: (...args: unknown[]) => void) => (...args: unknown[]) => runtime.queued.push(() => fn(...args)),
  useFrameCallback: (fn: NonNullable<typeof runtime.frame>) => { runtime.frame = fn; return useRef({ setActive: (active: boolean) => { runtime.active = active; } }).current; } };
});
const initial = { ticks: 0, event: 0, score: 0 };
const input = { value: 0 } as import("react-native-reanimated").SharedValue<number>;
const step = (s: typeof initial, n: number) => ({ ticks: s.ticks + 1, event: s.event + n, score: s.score + n });
const end = (s: typeof initial) => s.ticks >= 2 ? { cleared: false, outcome: "game-over" as const, stars: 0 as const, score: s.score, detail: "Done" } : null;
function flush() { for (const fn of runtime.effects.splice(0)) fn(); }
const onFrame = () => {};
const select = (s: typeof initial) => ({ score: s.score, event: s.event });
function RenderHarness(active: boolean, onResult: (result: import("../src/arcade/types").ArcadeResult) => void) {
  runtime.index = 0;
  const loop = useArcadeUiLoop({ initial, input, step, select, result: end, onFrame, onResult, active }); flush(); return loop;
}
function frame(timestamp: number, dt: number | null) { if (runtime.active) runtime.frame!({ timestamp, timeSincePreviousFrame: dt, timeSinceFirstFrame: 0 }); }
function delivery() { for (const fn of runtime.queued.splice(0)) fn(); }
beforeEach(() => { runtime.slots = []; runtime.index = 0; runtime.effects = []; runtime.cleanups = []; runtime.queued = []; runtime.active = false; input.value = 0; });
describe("UI loop boundary", () => {
  it("keeps the native frame subscription stable across HUD renders and active changes", () => {
    const result = vi.fn(); RenderHarness(true, result); const callback = runtime.frame;
    RenderHarness(true, result); expect(runtime.frame).toBe(callback);
    RenderHarness(false, result); expect(runtime.frame).toBe(callback);
  });
  it("steps from shared input and queues discrete snapshots/results once", () => {
    const result = vi.fn(); const loop = RenderHarness(true, result); input.value = 1;
    frame(1000, null); delivery(); frame(1017, 17); expect(loop.state.value.ticks).toBe(1); expect(runtime.queued.length).toBe(1); delivery();
    frame(1034, 17); delivery(); expect(result).toHaveBeenCalledOnce(); expect(result).toHaveBeenCalledWith(expect.objectContaining({ outcome: "game-over", score: 2 }));
    frame(1051, 17); delivery(); expect(loop.state.value.ticks).toBe(2); expect(result).toHaveBeenCalledOnce();
  });
  it("retains a result queued just before pause and delivers it on resume without stepping again", () => {
    const result = vi.fn(); RenderHarness(true, result); frame(1000, null); delivery(); frame(1017, 17); delivery(); frame(1034, 17);
    RenderHarness(false, result); expect(runtime.active).toBe(false); delivery(); expect(result).not.toHaveBeenCalled();
    const resumed = RenderHarness(true, result); expect(result).toHaveBeenCalledOnce(); frame(2000, null); delivery(); expect(resumed.state.value.ticks).toBe(2);
  });
  it("discards background remainder and ignores queued callbacks after unmount", () => {
    const result = vi.fn(); const loop = RenderHarness(true, result); frame(1000, null); frame(1008, 8); expect(loop.clock.value.remainder).toBeGreaterThan(0);
    RenderHarness(false, result); expect(loop.clock.value.remainder).toBe(0); RenderHarness(true, result); frame(2000, null); frame(2017, 17); frame(2034, 17);
    for (const cleanup of runtime.cleanups) cleanup(); delivery(); expect(result).not.toHaveBeenCalled(); expect(runtime.active).toBe(false);
  });
});

describe("UI loop render and publication rates", () => {
  it("interpolates at half ticks, drains on fixed steps and does not cross unchanged HUD ticks", () => {
    const target = { value: [] as import("../src/arcade/poses").SpritePose[], set(next: import("../src/arcade/poses").SpritePose[]) { this.value = next; } } as import("react-native-reanimated").SharedValue<import("../src/arcade/poses").SpritePose[]>;
    const mailbox = { value: 0, set: vi.fn() } as unknown as import("react-native-reanimated").SharedValue<number>;
    runtime.index = 0;
    const loop = useArcadeUiLoop({ initial, input: mailbox, active: true, step, select: () => ({ score: 0 }), drain: n => n,
      pose: { target, build: s => [{ x: s.ticks * 10, y: 0 }] } }); flush();
    frame(1000, null); frame(1017, 17); frame(1025, 8);
    expect(loop.state.value.ticks).toBe(1); expect(target.value[0].x).toBeCloseTo(5);
    expect(mailbox.set).toHaveBeenCalledOnce();
    for (let t = 1033; t < 1600; t += 8) frame(t, 8);
    expect(runtime.queued).toHaveLength(0);
  });
});
