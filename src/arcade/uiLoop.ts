import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { runOnJS, useFrameCallback, useSharedValue, type SharedValue } from "react-native-reanimated";
import { advanceClock, FIXED_DT } from "./clock";
import { arcadeEvent } from "./events";
import { interpolatePoses, samePublication, type PoseBuilder, type SpritePose } from "./poses";
import type { ArcadeResult } from "./types";
/**
 * Opt in only with worklet-safe state/step/result/select/build/onFrame (no refs, native modules or JS closures).
 * Own the round with a React key. Gesture worklets write input; poses stay on UI.
 * React receives compact changed HUD/event fields and results; unchanged HUD ticks send nothing.
 */
export function useArcadeUiLoop<S, I, H>({ initial, input, step, result, onFrame, onResult, active, pose, select, drain }: {
  initial: S; input: SharedValue<I>; step: (s: S, input: I, dt: number) => S;
  result?: (s: S) => ArcadeResult | null; onFrame?: (s: S) => void;
  pose?: PoseBuilder<S>; select: (s: S) => H;
  /** UI-owned mailbox: remove only commands acknowledged by the fixed step. */
  drain?: (input: I, state: S) => I;
  onResult?: (result: ArcadeResult) => void; active: boolean;
}) {
  const state = useSharedValue(initial), enabled = useSharedValue(false), reported = useSharedValue(false);
  const clock = useSharedValue({ remainder: 0, ticks: 0, dropped: 0 }), lastHud = useSharedValue(0);
  const [snapshot, setSnapshot] = useState(() => select(initial));
  const [outcome, setOutcome] = useState<ArcadeResult | null>(null);
  const sent = useSharedValue(select(initial));
  const previousPose = useSharedValue<SpritePose[]>([]), currentPose = useSharedValue<SpritePose[]>([]);
  const live = useRef({ active, onResult }), mounted = useRef(true), pending = useRef<ArcadeResult | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pending.current = null; }; }, []);
  useEffect(() => { if (active && pending.current) { const end = pending.current; pending.current = null; onResult?.(end); } }, [active, onResult]);
  useLayoutEffect(() => { live.current = { active, onResult }; }, [active, onResult]);
  const publish = useCallback((next: H, end: ArcadeResult | null) => {
    if (!mounted.current) return;
    setSnapshot(next);
    if (end) setOutcome(end);
    if (end) { if (live.current.active) live.current.onResult?.(end); else pending.current = end; }
  }, []);
  const callback = useCallback<Parameters<typeof useFrameCallback>[0]>(info => {
    "worklet";
    if (!enabled.value || reported.value) return;
    const before = arcadeEvent(state.value), advanced = advanceClock(clock.value, (info.timeSincePreviousFrame ?? 0) / 1000);
    clock.set(advanced.clock);
    if (pose && !currentPose.value.length) {
      const p = pose.build(state.value); previousPose.set(p); currentPose.set(p);
    }
    let next = state.value, end: ArcadeResult | null = null;
    for (let i = 0; i < advanced.steps; i++) {
      next = step(next, input.value, FIXED_DT);
      if (drain) input.set(drain(input.value, next));
      if (pose) { previousPose.set(currentPose.value); currentPose.set(pose.build(next)); }
      end = result?.(next) ?? null;
      if (end) break;
    }
    if (advanced.steps) state.set(next);
    if (pose) pose.target.set(interpolatePoses(previousPose.value, currentPose.value, end ? 1 : advanced.clock.remainder / FIXED_DT, pose.snapDistance));
    onFrame?.(next);
    if (end || before !== arcadeEvent(next) || info.timestamp - lastHud.value >= 100) {
      lastHud.set(info.timestamp);
      const payload = select(next);
      if (end || !samePublication(sent.value, payload)) { sent.set(payload); runOnJS(publish)(payload, end); }
    }
    if (end) reported.set(true);
  }, [enabled, reported, state, clock, step, input, result, onFrame, lastHud, publish, pose, select, drain, sent, previousPose, currentPose]);
  const frame = useFrameCallback(callback, false);
  useEffect(() => {
    enabled.set(active);
    clock.set({ ...clock.value, remainder: 0 }); lastHud.set(0); previousPose.set(currentPose.value);
    frame.setActive(active);
    return () => { enabled.set(false); frame.setActive(false); };
  }, [active, frame, enabled, clock, lastHud, previousPose, currentPose]);
  return { snapshot, outcome, state, clock };
}
