import React, { useLayoutEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { C, Copy } from "../components/ui";
import { mathResult, type MathLimit, type MathQuestion } from "./questions";

/** Original scallop, shared by the three activities. No image or network dependency. */
export function Shell({ size = 40, muted = false, joined = false }: { size?: number; muted?: boolean; joined?: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 44 40" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Path d="M22 35C15 35 3 24 3 17C3 12 7 9 11 10C12 2 19 1 22 7C26 1 33 3 33 10C39 8 42 13 41 18C40 26 29 35 22 35Z" fill={muted ? C.sand : joined ? "#A9D9CD" : "#F2CA85"} stroke={C.ink} strokeWidth="2" />
    <Path d="M22 33L12 14M22 33V10M22 33L32 14" stroke={C.ink} strokeWidth="1.5" fill="none" />
  </Svg>;
}
export function ShellVisual({ question: q, steps, width }: { question: MathQuestion; steps: number; width: number }) {
  const add = q.operation === "add", total = add ? mathResult(q) : q.a;
  const current = mathResult({ ...q, b: steps });
  const label = add ? `${current} shells together. ${q.b - steps} waiting to join.` : `${q.a} shells to start. ${steps} taken away. ${current} left.`;
  return <View style={{ alignItems: "center", gap: 4 }}>
    <View accessible accessibilityLabel={label} style={{ width: Math.min(width, 400), alignItems: "center" }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", maxWidth: 290, gap: 3 }}>
        {Array.from({ length: total }, (_, i) => {
          const waiting = add && i >= q.a + steps, removed = !add && i >= q.a - steps;
          return <View key={i} style={{ width: 26, height: 30, opacity: waiting ? 0.35 : 1 }}>
            <Shell size={26} muted={waiting || removed} joined={add && i >= q.a && !waiting} />
            {removed && <Svg width={26} height={30} style={{ position: "absolute" }}><Path d="M3 27L23 3" stroke={C.error} strokeWidth="3" /></Svg>}
          </View>;
        })}
      </View>
    </View>
    <Copy style={{ color: C.ink, fontSize: 16, fontWeight: "700", textAlign: "center" }}>
      {add ? `${q.a} + ${steps} joined · ${current} together` : `${q.a} to start · ${steps} away · ${current} left`}
    </Copy>
    {add && steps < q.b && <Copy style={{ fontSize: 14 }}>{q.b - steps} pale shells waiting to join</Copy>}
  </View>;
}

/** One straight, horizontally scrollable line. Each curved arrow is exactly one unit. */
export function HopVisual({ question: q, steps, limit, width }: { question: MathQuestion; steps: number; limit: MathLimit; width: number }) {
  const scroll = useRef<ScrollView>(null), spacing = 46, pad = 26, current = mathResult({ ...q, b: steps });
  const visibleWidth = Math.max(220, Math.min(width, 700)), lineWidth = pad * 2 + limit * spacing;
  useLayoutEffect(() => {
    scroll.current?.scrollTo({ x: Math.max(0, pad + current * spacing - visibleWidth / 2), animated: false });
  }, [current, visibleWidth]);
  return <View style={{ alignItems: "center", gap: 4 }}>
    <Copy style={{ fontSize: 16, color: C.ink, fontWeight: "700", textAlign: "center" }}>
      Start {q.a} · {steps} of {q.b} hops {q.operation === "add" ? "forward" : "back"}
    </Copy>
    <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator style={{ width: visibleWidth, flexGrow: 0 }}
      accessibilityLabel={`Number line. Start ${q.a}. ${steps} hops ${q.operation === "add" ? "forward" : "back"}. Now at ${current}. Swipe to explore the line.`}>
      <Svg width={lineWidth} height={112} viewBox={`0 0 ${lineWidth} 112`}>
        <Line x1={pad} y1="65" x2={lineWidth - pad} y2="65" stroke={C.ink} strokeWidth="2" />
        {Array.from({ length: limit + 1 }, (_, n) => <G key={n}>
          <Line x1={pad + n * spacing} y1="61" x2={pad + n * spacing} y2="70" stroke={C.ink} strokeWidth="2" />
          {n === q.a && <Circle cx={pad + n * spacing} cy="89" r="17" fill={C.paper} stroke={C.ink} strokeWidth="2" />}
          {n === current && <Circle cx={pad + n * spacing} cy="89" r="17" fill={C.teal} />}
          <SvgText x={pad + n * spacing} y="95" textAnchor="middle" fontSize="19" fontWeight="700" fill={n === current ? C.paper : C.ink}>{n}</SvgText>
        </G>)}
        {Array.from({ length: steps }, (_, i) => {
          const direction = q.operation === "add" ? 1 : -1;
          const x = pad + (q.a + direction * i) * spacing, end = x + direction * spacing;
          return <G key={i}>
            <Path d={`M${x} 57 Q${(x + end) / 2} 9 ${end} 57`} stroke={C.teal} strokeWidth="3" fill="none" />
            <Path d={`M${end - direction * 10} 51L${end} 57L${end - direction * 2} 45`} stroke={C.teal} strokeWidth="3" fill="none" />
          </G>;
        })}
      </Svg>
    </ScrollView>
    <Copy style={{ fontSize: 14, textAlign: "center" }}>Now at {current} · slide to see the whole line</Copy>
  </View>;
}
