import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { arcadeEvent } from "./events";
import { advanceClock, FIXED_DT, type FixedClock } from "./clock";
import { interpolatePoses, type PoseBuilder, type SpritePose } from "./poses";
export type FrameBudget = { fps: number; p95: number; max: number; dropped: number; ticks: number };
/** Focus, native background, and browser visibility share one source of truth. */
export function useArcadeForeground() {
  const [focused, setFocused] = useState(false), [foreground, setForeground] = useState(Platform.OS === "web" ? typeof document === "undefined" || !document.hidden : AppState.currentState === "active");
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    const sub = AppState.addEventListener("change", s => setForeground(s === "active"));
    const visibility = () => setForeground(!document.hidden);
    if (Platform.OS === "web" && typeof document !== "undefined") document.addEventListener("visibilitychange", visibility);
    return () => { sub.remove(); if (Platform.OS === "web" && typeof document !== "undefined") document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return focused && foreground;
}
/**
 * JS rules stay pure and testable; publish sprite poses to shared values in onFrame.
 * React gets event/score/terminal edges on the same rAF and ordinary HUD updates at 10 Hz.
 * Memoize sprite art on primitive props; HUD snapshots must not redraw it.
 * An active=false sheet/focus/background cancels the frame and discards the remainder.
 */
export function useArcadeLoop<S, I>({ initial, step, reduce, input, active, onFrame, pose }: { initial: S; step: (s: S, input: I, dt: number) => S; reduce: (s: S, input: I) => S; input: I; active: boolean; onFrame?: (s: S) => void; pose?: PoseBuilder<S> }) {
  const state = useRef(initial), previousPose = useRef<SpritePose[]>([]), currentPose = useRef<SpritePose[]>([]), live = useRef({ active, step, reduce, input, onFrame, pose });
  const [snapshot, setSnapshot] = useState(initial), [budget, setBudget] = useState<FrameBudget>({ fps: 0, p95: 0, max: 0, dropped: 0, ticks: 0 });
  useLayoutEffect(() => { live.current = { active, step, reduce, input, onFrame, pose }; }, [active, step, reduce, input, onFrame, pose]);
  useEffect(() => {
    if (!active) return;
    let id = 0, previous = 0, lastHud = 0, lastBudget = 0, samples: number[] = [], clock: FixedClock = { remainder: 0, ticks: 0, dropped: 0 };
    const frame = (now: number) => {
      if (!live.current.active) return;
      const builder = live.current.pose;
      if (builder && !currentPose.current.length) currentPose.current = previousPose.current = builder.build(state.current);
      const beforeEvent = arcadeEvent(state.current);
      if (previous) {
        const elapsed = (now - previous) / 1000, advanced = advanceClock(clock, elapsed); clock = advanced.clock;
        for (let i = 0; i < advanced.steps; i++) {
          state.current = live.current.step(state.current, live.current.input, FIXED_DT);
          if (builder) { previousPose.current = currentPose.current; currentPose.current = builder.build(state.current); }
        }
        samples.push(now - previous);
      }
      previous = now;
      if (builder) builder.target.set(interpolatePoses(previousPose.current, currentPose.current, clock.remainder / FIXED_DT, builder.snapDistance));
      live.current.onFrame?.(state.current);
      if (beforeEvent !== arcadeEvent(state.current) || now - lastHud >= 100) { setSnapshot(state.current); lastHud = now; }
      if (now - lastBudget >= 1000 && samples.length) {
        const ordered = [...samples].sort((a, b) => a - b);
        setBudget({ fps: 1000 / (samples.reduce((a, b) => a + b) / samples.length), p95: ordered[Math.floor(ordered.length * .95)], max: ordered[ordered.length - 1], dropped: clock.dropped, ticks: clock.ticks }); samples = []; lastBudget = now;
      }
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(id); previousPose.current = currentPose.current; };
  }, [active]);
  const dispatch = useCallback((action: I) => {
    if (!live.current.active) return state.current;
    state.current = live.current.reduce(state.current, action);
    // Discrete controls (turn/rotate/drop) are immediate; reset history to avoid rewinding them.
    const builder = live.current.pose;
    if (builder) { currentPose.current = previousPose.current = builder.build(state.current); builder.target.set(currentPose.current); }
    setSnapshot(state.current); live.current.onFrame?.(state.current);
    return state.current;
  }, []);
  return { snapshot, state, dispatch, budget };
}
/** Synchronous action ownership prevents fast queued taps from using an old board. */
export function useArcadeReducer<S, I>(initial: S, reduce: (s: S, input: I) => S, active: boolean) {
  const state = useRef(initial), live = useRef({ reduce, active }); const [snapshot, setSnapshot] = useState(initial);
  useLayoutEffect(() => { live.current = { reduce, active }; }, [reduce, active]);
  const dispatch = useCallback((input: I) => { if (live.current.active) { state.current = live.current.reduce(state.current, input); setSnapshot(state.current); } return state.current; }, []);
  return { snapshot, dispatch, state };
}
