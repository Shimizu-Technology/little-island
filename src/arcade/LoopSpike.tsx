/** Both production hooks, one worklet-safe engine and one static sprite layer. No save writes. */
import React, { memo, useCallback, useState } from "react";
import { View } from "react-native";
import { useSharedValue, type SharedValue } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Button, Copy } from "../components/ui";
import { ArcadeSprite, type SpritePose } from "./Sprite";
import { useArcadeLoop } from "./loop";
import { useArcadeUiLoop } from "./uiLoop";
import type { ArcadeResult } from "./types";
const SECONDS = 22;
type State = { time: number; event: number; score: number };
const initial: State = { time: 0, event: 0, score: 0 };
function step(s: State, input: number, dt: number): State {
  "worklet";
  const time = s.time + dt;
  return { time, event: Math.floor(time * 4) + input, score: Math.floor(time * 4) };
}
function result(s: State): ArcadeResult | null {
  "worklet";
  return s.time >= SECONDS ? { cleared: true, outcome: "cleared", stars: 0, score: s.score, detail: "Benchmark complete" } : null;
}
const Dots = memo(function Dots({ poses }: { poses: SharedValue<SpritePose[]> }) {
  return <View pointerEvents="none" style={{ height: 160, overflow: "hidden", backgroundColor: "#D8EEF0", borderRadius: 16 }}>{Array.from({ length: 60 }, (_, i) => <ArcadeSprite key={i} poses={poses} index={i} width={12} height={12}><Svg width={12} height={12}><Circle cx={6} cy={6} r={5} fill="#246858"/></Svg></ArcadeSprite>)}</View>;
});
function useProbe() {
  const poses = useSharedValue<SpritePose[]>([]), samples = useSharedValue<number[]>([]), previous = useSharedValue(0);
  const publish = useCallback((s: State) => {
    "worklet";
    const now = Date.now();
    if (s.time > 2 && previous.value > 0 && s.time < SECONDS) samples.set([...samples.value, now - previous.value]);
    previous.set(now);
    poses.set(Array.from({ length: 60 }, (_, i) => ({ x: (i * 13 + s.time * 80) % 330, y: 8 + i % 8 * 18 })));
  }, [poses, samples, previous]);
  return { poses, samples, publish };
}
function Report({ pipeline, samples, score, done }: { pipeline: string; samples: SharedValue<number[]>; score: number; done: boolean }) {
  const [report, setReport] = useState("");
  // Read samples only on explicit capture after the run; never poll UI shared values on render.
  return <View style={{ gap: 8 }}><Copy>{pipeline} · {score} discrete events · {done ? "Complete" : "Measuring…"}</Copy>{done && <Button compact onPress={() => {
    const times = samples.value, sorted = [...times].sort((a, b) => a - b);
    const data = { pipeline, frames: times.length, fps: 1000 * times.length / times.reduce((a, b) => a + b, 0), p95: sorted[Math.floor(sorted.length * .95)], max: Math.max(...times), over25: times.filter(n => n > 25).length };
    setReport(JSON.stringify(data)); console.info("ARCADE_LOOP_SPIKE", JSON.stringify(data));
  }}>Capture loop report</Button>}<Copy>{report}</Copy></View>;
}
function JsProbe() {
  const { poses, samples, publish } = useProbe();
  const [active, setActive] = useState(true);
  const frame = useCallback((s: State) => { publish(s); if (result(s)) setActive(false); }, [publish]);
  const { snapshot } = useArcadeLoop({ initial, step, reduce: (s: State) => s, input: 0, active, onFrame: frame });
  return <View><Dots poses={poses}/><Report pipeline="JS fixed-step" samples={samples} score={snapshot.score} done={!active}/></View>;
}
function selectScore(s: State) { "worklet"; return { score: s.score }; }
function UiProbe() {
  const { poses, samples, publish } = useProbe(), input = useSharedValue(0);
  const [done, setDone] = useState(false);
  const { snapshot } = useArcadeUiLoop({ initial, step, result, select: selectScore, input, active: !done, onFrame: publish, onResult: () => setDone(true) });
  return <View><Dots poses={poses}/><Report pipeline="UI worklet fixed-step" samples={samples} score={snapshot.score} done={done}/></View>;
}
export function LoopSpike() {
  const [mode, setMode] = useState<"js" | "ui" | null>(null), [run, setRun] = useState(0);
  return <View style={{ gap: 10 }}><Copy>Loop comparison: 60 static dots, 4 event edges/second, 2s warmup + 20s. On web both run on the browser thread; native runs the UI option in the worklet runtime.</Copy><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}><Button compact onPress={() => { setMode("js"); setRun(r => r + 1); }}>Run JS loop</Button><Button compact onPress={() => { setMode("ui"); setRun(r => r + 1); }}>Run UI loop</Button></View>{mode === "js" ? <JsProbe key={run}/> : mode === "ui" ? <UiProbe key={run}/> : null}</View>;
}
