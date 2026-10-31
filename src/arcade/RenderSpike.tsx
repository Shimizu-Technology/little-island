/** Reproducible 60-sprite renderer comparison. /arcade?spike=1; no saved game changes. */
import React, { memo, useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import { Text } from "../components/Text";
import { Button, Copy, Heading } from "../components/ui";

import { LoopSpike } from "./LoopSpike";
const COUNT = 60, DURATION = 20000, WARMUP = 2000;
type Point = { x: number; y: number };
export type FrameReport = { renderer: string; sprites: number; frames: number; seconds: number; fps: number; p95: number; over25: number; max: number; stepP95: number };
function points(t: number): Point[] {
  return Array.from({ length: COUNT }, (_, i) => ({ x: (i * 53 + t * (25 + i % 5 * 7)) % 580, y: 22 + i % 9 * 35 + Math.sin(t * 1.5 + i) * 14 }));
}
function Fish() { return <Svg width={30} height={24} viewBox="0 0 30 24"><Path d="M20 12L29 4V20Z" fill="#EC806B"/><Ellipse cx={12} cy={12} rx={11} ry={8} fill="#F0C764"/><Circle cx={7} cy={10} r={2} fill="#163E49"/></Svg>; }
const Sprite = memo(function Sprite({ positions, index }: { positions: SharedValue<Point[]>; index: number }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: positions.value[index].x }, { translateY: positions.value[index].y }] }));
  return <Animated.View style={[{ position: "absolute", left: 0, top: 0, width: 30, height: 24 }, style]}><Fish /></Animated.View>;
});
const percentile = (a: number[], p: number) => [...a].sort((a, b) => a - b)[Math.min(a.length - 1, Math.floor(a.length * p))] ?? 0;
export function RenderSpike() {
  const [renderer, setRenderer] = useState("shared"), [run, setRun] = useState(0), [report, setReport] = useState<FrameReport | null>(null);
  const [reactPoints, setReactPoints] = useState(() => points(0)), positions = useSharedValue(points(0));
  const samples = useRef<number[]>([]);
  useEffect(() => {
    let id = 0, start = 0, previous = 0, ended = false;
    const times: number[] = [], steps: number[] = [];
    const frame = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      if (previous && elapsed > WARMUP) times.push(now - previous);
      previous = now;
      const before = performance.now(), next = points(elapsed / 1000);
      if (renderer === "shared") positions.value = next;
      else setReactPoints(next);
      if (elapsed > WARMUP) steps.push(performance.now() - before);
      if (elapsed < WARMUP + DURATION) id = requestAnimationFrame(frame);
      else if (!ended) {
        ended = true; samples.current = times;
        const result: FrameReport = { renderer, sprites: COUNT, frames: times.length, seconds: times.reduce((a, b) => a + b, 0) / 1000, fps: 1000 / (times.reduce((a, b) => a + b, 0) / times.length), p95: percentile(times, .95), over25: times.filter(n => n > 25).length, max: Math.max(...times), stepP95: percentile(steps, .95) };
        setReport(result);
        console.info("ARCADE_RENDER_SPIKE", JSON.stringify(result));
      }
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [renderer, run, positions]);
  return <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}><Heading>60 fish · renderer spike</Heading><Copy>2 second warmup + 20 second sample. JavaScript frame intervals, not physical GPU timing.</Copy>
    <View style={{ flexDirection: "row", gap: 8 }}><Button onPress={() => { setReport(null); setRenderer("shared"); setRun(r => r + 1); }}>Shared transforms</Button><Button quiet onPress={() => { setReport(null); setRenderer("react"); setRun(r => r + 1); }}>React SVG</Button></View>
    <View style={{ width: "100%", maxWidth: 640, height: 370, backgroundColor: "#D8EEF0", overflow: "hidden", borderRadius: 20 }}>
      {renderer === "shared" ? Array.from({ length: COUNT }, (_, index) => <Sprite key={index} index={index} positions={positions} />) : <Svg width="100%" height={370} viewBox="0 0 640 370">{reactPoints.map((p, i) => <G key={i} transform={`translate(${p.x},${p.y})`}><Path d="M20 12L29 4V20Z" fill="#EC806B"/><Ellipse cx={12} cy={12} rx={11} ry={8} fill="#F0C764"/><Circle cx={7} cy={10} r={2} fill="#163E49"/></G>)}</Svg>}
    </View>
    <LoopSpike/>
    <Text selectable testID="spike-report">{report ? JSON.stringify(report) : `Measuring ${renderer}…`}</Text>
  </ScrollView>;
}
