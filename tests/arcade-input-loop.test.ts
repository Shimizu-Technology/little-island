import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PressControl, useSwipe, uiThreadTap, uiThreadSwipe, uiThreadHold } from "../src/arcade/Input";
import { useArcadeLoop } from "../src/arcade/loop";
const runtime = vi.hoisted(() => ({ effects: [] as (() => void | (() => void))[], cleanups: [] as (() => void)[], setters: [] as ReturnType<typeof vi.fn>[], frames: new Map<number, FrameRequestCallback>(), id: 0, haptic: vi.fn() }));
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useRef: (value: unknown) => ({ current: value }), useMemo: (fn: () => unknown) => fn(), useCallback: (fn: unknown) => fn,
    useLayoutEffect: (fn: () => void) => fn(), useEffect: (fn: () => void | (() => void)) => runtime.effects.push(fn),
    useState: (value: unknown) => { const setter = vi.fn(); runtime.setters.push(setter); return [value, setter]; } };
});
vi.mock("expo-router", () => ({ useFocusEffect: () => {} }));
vi.mock("react-native", () => ({ Platform: { OS: "web" }, AppState: {}, StyleSheet: { flatten: (s: unknown) => s }, PanResponder: { create: (handlers: unknown) => ({ panHandlers: handlers }) } }));
vi.mock("react-native-reanimated", () => ({ default: { View: "view" }, runOnJS: (fn: (...args: unknown[]) => void) => fn }));
vi.mock("react-native-gesture-handler", () => {
  const make = () => {
    const handlers: Record<string, unknown> = {};
    const g = new Proxy({ handlers }, { get: (target, key) => key === "handlers" ? handlers : (...args: unknown[]) => { handlers[String(key)] = args[0]; return g; } });
    return g;
  };
  return { Gesture: { Manual: make, Pan: make }, GestureDetector: "detector" };
});
vi.mock("../src/components/ui", () => ({ PressableScale: "button" }));
vi.mock("../src/components/feel", () => ({ feel: runtime.haptic }));
function mount() { for (const fn of runtime.effects.splice(0)) { const cleanup = fn(); if (cleanup) runtime.cleanups.push(cleanup); } }
function frame(now: number) { const [id, fn] = runtime.frames.entries().next().value!; runtime.frames.delete(id); fn(now); }
beforeEach(() => { vi.useFakeTimers(); runtime.effects = []; runtime.cleanups = []; runtime.setters = []; runtime.frames.clear(); runtime.haptic.mockClear(); vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => { runtime.frames.set(++runtime.id, fn); return runtime.id; }); vi.stubGlobal("cancelAnimationFrame", (id: number) => runtime.frames.delete(id)); });
afterEach(() => { for (const fn of runtime.cleanups) fn(); vi.useRealTimers(); vi.unstubAllGlobals(); });
describe("touch-down control timing", () => {
  it("acts on down, repeats at DAS/ARR, and stops on out, blur and unmount", () => {
    const action = vi.fn();
    const control = PressControl({ onPress: action, repeat: { das: 170, arr: 50 } }) as React.ReactElement<{ onPressIn: () => void; onPressOut: () => void; onBlur: (event: unknown) => void }>;
    expect((control.props as { delayPressIn?: number }).delayPressIn).toBe(0);
    mount(); control.props.onPressIn(); expect(action).toHaveBeenCalledTimes(1); expect(runtime.haptic).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(169); expect(action).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1); expect(action).toHaveBeenCalledTimes(2); vi.advanceTimersByTime(100); expect(action).toHaveBeenCalledTimes(4);
    control.props.onPressOut(); vi.advanceTimersByTime(500); expect(action).toHaveBeenCalledTimes(4);
    control.props.onPressIn(); control.props.onBlur({}); vi.advanceTimersByTime(500); expect(action).toHaveBeenCalledTimes(5);
    control.props.onPressIn(); for (const fn of runtime.cleanups) fn(); vi.advanceTimersByTime(500); expect(action).toHaveBeenCalledTimes(6);
  });
  it("does nothing while disabled and native accessibility still activates", () => {
    const action = vi.fn();
    const disabled = PressControl({ onPress: action, disabled: true }) as React.ReactElement<{ onPressIn: () => void; onAccessibilityTap: () => void }>;
    mount(); disabled.props.onPressIn(); disabled.props.onAccessibilityTap(); expect(action).not.toHaveBeenCalled();
    const accessible = PressControl({ onPress: action }) as typeof disabled; mount(); accessible.props.onAccessibilityTap(); expect(action).toHaveBeenCalledOnce();
  });
  it("swipes once when the threshold is crossed, before release, and resets for the next touch", () => {
    const move = vi.fn(), tap = vi.fn();
    const swipe = useSwipe(true, move, 24, tap) as unknown as { onPanResponderGrant: (event: unknown) => void; onPanResponderMove: (e: unknown, g: { dx: number; dy: number }) => void };
    swipe.onPanResponderGrant({ nativeEvent: { locationX: 80, locationY: 100 } }); expect(tap).toHaveBeenCalledWith(80, 100);
    swipe.onPanResponderMove({}, { dx: 23, dy: 2 }); expect(move).not.toHaveBeenCalled();
    swipe.onPanResponderMove({}, { dx: 24, dy: 2 }); expect(move).toHaveBeenCalledWith("right");
    swipe.onPanResponderMove({}, { dx: 80, dy: 2 }); expect(move).toHaveBeenCalledOnce();
    swipe.onPanResponderGrant({ nativeEvent: { locationX: 80, locationY: 100 } }); swipe.onPanResponderMove({}, { dx: 0, dy: -25 }); expect(move).toHaveBeenLastCalledWith("up"); expect(move).toHaveBeenCalledTimes(2);
  });
});
describe("production JS loop snapshot edges", () => {
  it("publishes an event/terminal edge on that frame instead of waiting for the HUD interval", () => {
    type State = { ticks: number; event: number; status: string };
    const initial = { ticks: 0, event: 0, status: "playing" }, publish = vi.fn();
    const loop = useArcadeLoop<State, number>({ initial, active: true, input: 0, reduce: s => s, step: s => ({ ticks: s.ticks + 1, event: Number(s.ticks >= 1), status: s.ticks >= 2 ? "over" : "playing" }), onFrame: publish });
    mount(); const snapshot = runtime.setters[0]; frame(1000); snapshot.mockClear();
    frame(1017); expect(snapshot).not.toHaveBeenCalled(); // ordinary movement remains HUD-throttled
    frame(1034); expect(snapshot).toHaveBeenLastCalledWith({ ticks: 2, event: 1, status: "playing" });
    frame(1051); expect(snapshot).toHaveBeenLastCalledWith({ ticks: 3, event: 1, status: "over" });
    expect(loop.state.current.ticks).toBe(3); expect(publish).toHaveBeenCalledTimes(4);
    for (const fn of runtime.cleanups) fn(); expect(runtime.frames.size).toBe(0);
  });
});

describe("UI gesture mailbox timing", () => {
  type Box = import("../src/arcade/mailbox").Commands<string>;
  const shared = <T,>(value: T) => ({ value, set(next: T) { this.value = next; } }) as import("react-native-reanimated").SharedValue<T>;
  const handlers = (gesture: unknown) => (gesture as { handlers: Record<string, (...args: unknown[]) => void> }).handlers;
  it("tap writes before JS feedback and hold releases on cancellation", () => {
    const box = shared<Box>({ helper: false, queue: [] });
    const feedback = vi.fn(() => expect(box.value.queue[0].action).toBe("flap"));
    const manager = { begin: vi.fn(), activate: vi.fn(), end: vi.fn(), fail: vi.fn() };
    const tap = handlers(uiThreadTap(box, "flap", feedback));
    tap.onTouchesDown({}, manager); expect(feedback).toHaveBeenCalledOnce();
    expect(box.value.queue.map(c => c.action)).toEqual(["flap"]);
    tap.onTouchesUp({ allTouches: [1], changedTouches: [1] }, manager); expect(manager.end).toHaveBeenCalledOnce();
    const hold = handlers(uiThreadHold(box, "down", "up"));
    hold.onTouchesDown({}, manager); hold.onTouchesCancelled({}, manager); hold.onFinalize();
    expect(box.value.queue.map(c => c.action)).toEqual(["flap", "down", "up"]);
  });
  it("swipe writes mid-move once and resets on the next gesture", () => {
    const box = shared<Box>({ helper: false, queue: [] }), fired = shared(false), feedback = vi.fn();
    const swipe = handlers(uiThreadSwipe(box, { left: "left", right: "right", up: "jump", down: "duck" }, fired, 20, feedback));
    swipe.onBegin({}); swipe.onUpdate({ translationX: 19, translationY: 0 }); expect(box.value.queue).toEqual([]);
    swipe.onUpdate({ translationX: 21, translationY: 0 }); swipe.onUpdate({ translationX: 90, translationY: 0 }); expect(box.value.queue.map(c => c.action)).toEqual(["right"]);
    swipe.onBegin({}); swipe.onUpdate({ translationX: 0, translationY: -22 }); expect(box.value.queue.map(c => c.action)).toEqual(["right", "jump"]);
    expect(feedback).toHaveBeenCalledTimes(2);
  });
  it("the JS production loop renders a halfway pose on a display frame with no simulation step", () => {
    const target = shared<import("../src/arcade/poses").SpritePose[]>([]);
    const loop = useArcadeLoop({ initial: { x: 0 }, input: 0, active: true, step: s => ({ x: s.x + 10 }), reduce: s => s,
      pose: { target, build: s => [{ x: s.x, y: 0 }] } });
    mount(); frame(1000); frame(1017); frame(1025);
    expect(loop.state.current.x).toBe(10); expect(target.value[0].x).toBeCloseTo(5);
  });
});
