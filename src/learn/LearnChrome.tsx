import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { C, Copy } from "../components/ui";
import { growthProgress, growthQuestions } from "./growth/engine";
import { islandProgress } from "./games/hafa-adai/engine";
import { dock } from "./games/float-sink/engine";
import { boardEnd, reefRound } from "./games/reef-race/engine";
import type { Island, LearnSession } from "./types";

export const subjectTheme: Record<Island, { sky: string; land: string; accent: string; ink: string }> = {
  numbers: { sky: "#FFF1B9", land: "#F3C979", accent: "#B05B20", ink: "#563B22" },
  reading: { sky: "#DDF4EF", land: "#91D3CC", accent: "#227B80", ink: "#174A51" },
  science: { sky: "#E9F3CE", land: "#A9D385", accent: "#4F793B", ink: "#31512F" },
  thinking: { sky: "#F0F3D8", land: "#B8D494", accent: "#57793D", ink: "#365034" },
  coding: { sky: "#E3E9F7", land: "#9FB4E0", accent: "#3D5A9A", ink: "#2A3B63" },
};

/** Decorative island scenery keeps the question and touch targets on an opaque card. */
export function IslandBackdrop({ island, colors }: { island: Island; colors?: typeof subjectTheme[Island] }) {
  const t = colors ?? subjectTheme[island];
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 245, overflow: "hidden" }}>
    <Svg width="100%" height="100%" viewBox="0 0 800 245" preserveAspectRatio="xMidYMid slice">
      <Path d="M0 0h800v245H0z" fill={t.sky}/>
      <Circle cx="678" cy="54" r="33" fill="#FFF9DD"/>
      <Path d="M0 185c95-56 181-40 273 0 86-80 183-60 253-2 94-75 198-56 274 10v52H0z" fill={t.land}/>
      <Path d="M0 209c110-30 207-15 291 13 120-53 217-47 304-6 72-37 137-35 205-7v36H0z" fill={t.accent} opacity={0.22}/>
      <Path d="M44 174V98m0 16-28-20m28 7 27-24M742 179v-69m0 21-28-19m28 10 26-29" stroke={t.accent} strokeWidth="8" strokeLinecap="round" opacity={0.55}/>
      <Ellipse cx="42" cy="91" rx="25" ry="17" fill={t.accent} opacity={0.45}/>
      <Ellipse cx="72" cy="77" rx="23" ry="17" fill={t.accent} opacity={0.45}/>
      <Ellipse cx="723" cy="106" rx="25" ry="17" fill={t.accent} opacity={0.45}/>
      <Ellipse cx="768" cy="90" rx="28" ry="19" fill={t.accent} opacity={0.45}/>
    </Svg>
  </View>;
}

export function roundProgress(session: LearnSession): { current: number; total: number } | null {
  const s = session.state as Record<string, unknown>;
  const ownTotal = Array.isArray(s.puzzles) ? s.puzzles.length : Array.isArray(s.tasks) ? s.tasks.length : 0;
  if (ownTotal && typeof s.done === "number") return { current: Math.min(s.done, ownTotal), total: ownTotal };
  if (session.options.stage && s.type === "growth") {
    const questions = growthQuestions(session.game, session.options, session.state as never);
    return { current: growthProgress(session.state as never, questions).index, total: questions.length };
  }
  // Own-level engines can expose their round size without a game-specific branch.
  if (Number.isInteger(s.total) && (s.total as number) > 0 && typeof s.index === "number") {
    return { current: Math.min(s.index, s.total as number), total: s.total as number };
  }
  if (session.game === "hafa-adai") {
    const p = islandProgress(session.state as never);
    return { current: s.activity === "explore" ? p.visited.size : p.cursor, total: (s.items as unknown[]).length };
  }
  if (session.game === "float-sink") {
    const d = dock(session.state as never, session.options);
    return { current: d?.index ?? (s.items as unknown[]).length, total: (s.items as unknown[]).length };
  }
  if (session.game === "crab-commands") return { current: (s.completed as unknown[]).length, total: (s.levels as unknown[]).length };
  if (session.game === "turtle-tales") return { current: s.page as number, total: (s.sides as unknown[]).length };
  if (session.game === "reef-race") return { current: Math.max(...reefRound(session.state as never, session.options).positions), total: boardEnd(session.options) };
  const total = Array.isArray(s.tasks) ? s.tasks.length : Array.isArray(s.questions) ? s.questions.length : Array.isArray(s.missions) ? s.missions.length :
    Array.isArray(s.orders) ? s.orders.length : Array.isArray(s.ids) ? s.ids.length :
    Array.isArray(s.items) ? s.items.length : typeof s.total === "number" ? s.total : session.game === "sound-boat" ? 10 : 0;
  return total && typeof s.index === "number" ? { current: Math.min(s.index, total), total } : null;
}

export function RoundProgress({ session, island, finished, colors }: { session: LearnSession; island: Island; finished: boolean; colors?: typeof subjectTheme[Island] }) {
  const progress = roundProgress(session);
  if (!progress) return null;
  const t = colors ?? subjectTheme[island];
  const count = Math.min(progress.total, 12);
  return <View accessibilityLabel={`${finished ? progress.total : progress.current} of ${progress.total} parts complete`} style={{ gap: 7, marginVertical: 7 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Copy style={{ color: t.ink, fontSize: 13, fontWeight: "900" }}>YOUR JOURNEY</Copy><Copy style={{ color: t.ink, fontSize: 13, fontWeight: "800", marginLeft: "auto" }}>{finished ? progress.total : progress.current}/{progress.total}</Copy></View>
    <View style={{ flexDirection: "row", gap: 4 }}>{Array.from({ length: count }, (_, i) => <View key={i} style={{ flex: 1, height: 10, borderRadius: 8, backgroundColor: (finished || i < progress.current * count / progress.total) ? t.accent : C.paper, borderWidth: 1, borderColor: t.accent }}/>)}</View>
  </View>;
}
