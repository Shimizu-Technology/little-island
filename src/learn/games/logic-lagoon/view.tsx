import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { C, Copy, PressableScale } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { ScaleGlyph, SeaGlyph } from "../thinkingArt";
import { enter, hint, taskAt, valueAt, type LogicState } from "./engine";

function Symbol({ value, size = 36 }: { value: string; size?: number }) {
  return ["shell", "fish", "star", "crab"].includes(value) ? <SeaGlyph kind={value} size={size} /> : <Copy style={{ fontSize: size * .68, fontWeight: "900", color: C.ink, fontVariant: ["tabular-nums"] }}>{value}</Copy>;
}

export function Board({ session, update, practice, assistance, cheer, coach, active, width }: BoardProps<LogicState>) {
  const s = session.state, task = taskAt(s);
  const [selected, setSelected] = useState<number | null>(null), [message, setMessage] = useState("");
  const [reveal, setReveal] = useState<string | null>(null);
  const choose = (value: number) => {
    setReveal(null);
    if (selected === null) return;
    const answer = task.kind === "grid" ? task.solution[selected] : task.answer;
    const next = enter(s, selected, value), right = value === answer;
    practice(task.kind === "grid" ? "think.logic" : "think.balance", right);
    update(next);
    if (right) { cheer(next.index > s.index ? "big" : "right"); coach.done(); setMessage(""); if (next.index > s.index) setSelected(null); }
    else setMessage("Not quite. Look at the clues and try another value.");
  };
  const showHelp = () => { assistance?.(); const h = hint(s); setSelected(h.cell); setMessage(h.reason); setReveal(`Try ${task.kind === "grid" ? task.symbols[h.value - 1] : h.value} in the glowing spot.`); update(h.state); };
  const size = task.kind === "grid" ? Math.max(44, Math.min(56, Math.floor((width - 34) / task.size) - 2)) : 0;
  const step = size + 2;
  // Cells never shrink below a 44pt target; a board wider than the card scrolls sideways.
  const scroll = task.kind === "grid" && step * task.size + 14 > width - 20;
  return <View style={{ gap: 14, paddingVertical: 8 }}>
    <Copy style={{ fontSize: 21, fontWeight: "900", color: C.ink }}>{task.title}</Copy>
    <Copy style={{ color: C.ink, fontWeight: "800" }}>PUZZLE {s.index + 1} OF 4</Copy>
    {task.kind === "grid" ? <>
      <Copy style={{ color: C.ink }}>{task.cages.length ? "Purple dashed pairs add to their Σ total. Use 1–4 once in each row, column and box." : `One of each ${s.level <= 2 || s.level === 3 && s.index < 2 ? "picture" : "number"} in every row and column.${task.boxRows > 1 ? " Each outlined box also needs one of each." : ""}`}</Copy>
      {task.writtenClue && <Copy style={{ color: C.ink, fontWeight: "800", backgroundColor: "#FFF4D6", padding: 12, borderRadius: 12 }}>{task.writtenClue.text}</Copy>}
      <ScrollView horizontal scrollEnabled={scroll} showsHorizontalScrollIndicator={scroll} style={{ alignSelf: scroll ? "stretch" : "center", flexGrow: 0 }} contentContainerStyle={{ flexGrow: scroll ? 0 : 1, justifyContent: "center" }}><View style={{ alignSelf: "center", padding: 7, borderRadius: 18, backgroundColor: "#E8EFDA" }}>
        {Array.from({ length: task.size }, (_, r) => <View key={r} style={{ flexDirection: "row" }}>{Array.from({ length: task.size }, (_, c) => { const i = r * task.size + c, v = valueAt(s, i), given = !!task.givens[i]; return <PressableScale key={i} accessibilityRole="button" accessibilityLabel={`Row ${r + 1}, column ${c + 1}: ${v ? task.symbols[v - 1] : "empty"}${given ? ", clue" : ""}`} disabled={!active || given} onPress={() => setSelected(i)} style={{ width: size, height: size, margin: 1, borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: selected === i ? "#FFE8A5" : given ? "#D8EACD" : "#FFFDF3", borderWidth: 2, borderColor: task.cages.length ? "#D1D8C5" : c % task.boxCols === 0 || r % task.boxRows === 0 ? "#668A66" : "#B6CCAB" }}>{v ? <Symbol value={task.symbols[v - 1]} size={task.size === 6 ? 31 : 38} /> : null}</PressableScale>; })}</View>)}
        {task.cages.length > 0 && <Svg width={step * task.size} height={step * task.size} style={{ position: "absolute", left: 7, top: 7 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{task.cages.map((cage, i) => { const cell = cage.cells[0], r = Math.floor(cell / task.size), c = cell % task.size; return <Rect key={i} x={c * step + 1} y={r * step + 1} width={step * 2 - 2} height={step - 2} rx={8} fill="none" stroke="#86619A" strokeWidth={3} strokeDasharray="6 4" />; })}</Svg>}
        {task.cages.map((cage, i) => { const cell = cage.cells[0], r = Math.floor(cell / task.size), c = cell % task.size; return <View key={i} pointerEvents="none" style={{ position: "absolute", left: 10 + c * step, top: 9 + r * step, backgroundColor: "#FFF6E6", borderRadius: 4, paddingHorizontal: 2 }}><Copy style={{ fontSize: 11, fontWeight: "900", color: "#664574" }}>Σ{cage.sum}</Copy></View>; })}
      </View></ScrollView>
      <Copy style={{ color: C.ink, fontWeight: "800" }}>{selected === null ? "Tap an empty square" : "Choose a value for the glowing square"}</Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 9 }}>{task.symbols.map((symbol, i) => <PressableScale key={i} accessibilityRole="button" accessibilityLabel={`Place ${symbol}`} disabled={!active || selected === null} onPress={() => choose(i + 1)} style={{ minWidth: 54, minHeight: 56, padding: 7, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FDF6DF", borderWidth: 2, borderColor: "#87AA72" }}><Symbol value={symbol} size={41} /></PressableScale>)}</View>
    </> : <>
      <Copy style={{ color: C.ink, fontSize: 17 }}>The left scale holds {task.left} shells. The right holds {task.right} shells plus a mystery bag. How many shells are in the bag?</Copy>
      <View style={{ alignItems: "center", padding: 16, backgroundColor: "#E5F0E0", borderRadius: 20 }}><ScaleGlyph /><View style={{ flexDirection: "row", justifyContent: "space-around", alignSelf: "stretch" }}><Copy style={{ fontSize: 20, fontWeight: "900", color: C.ink }}>{task.left} shells</Copy><Copy style={{ fontSize: 20, fontWeight: "900", color: C.ink }}>{task.right} + bag</Copy></View></View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>{Array.from({ length: 10 }, (_, i) => <PressableScale key={i} accessibilityRole="button" accessibilityLabel={`Put ${i + 1} shells in the mystery bag`} disabled={!active} onPress={() => { setReveal(null); const next = enter(s, 0, i + 1); practice("think.balance", i + 1 === task.answer); update(next); if (i + 1 === task.answer) { setMessage(""); cheer("big"); } else setMessage("The scales are still uneven. Try another number."); }} style={{ width: 53, minHeight: 53, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8DE" }}><Copy style={{ fontSize: 24, color: C.ink }}>{i + 1}</Copy></PressableScale>)}</View>
    </>}
    {!!message && <View accessibilityLiveRegion="polite"><Copy style={{ color: "#79512D", fontWeight: "800" }}>{message}</Copy></View>}
    {reveal && <PressableScale accessibilityRole="button" accessibilityLabel="Show this value" onPress={() => { setMessage(`${message} ${reveal}`); setReveal(null); }} style={{ padding: 14, borderRadius: 14, backgroundColor: "#FFF4D6" }}><Copy>Show this value</Copy></PressableScale>}
    <PressableScale accessibilityRole="button" accessibilityLabel="Help with this puzzle" onPress={showHelp} style={{ alignSelf: "flex-start", padding: 14, borderRadius: 14, backgroundColor: "#E4EFDD" }}><Copy style={{ fontWeight: "800", color: C.ink }}>Help me find a step</Copy></PressableScale>
  </View>;
}
export function Art({ size }: { size: number }) { return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M10 10H90V90H10ZM10 50H90M50 10V90" fill="#FFF9E9" stroke="#365034" strokeWidth="4"/><Circle cx="30" cy="30" r="12" fill="#E9916F"/><Circle cx="70" cy="70" r="12" fill="#5C9FA0"/><Path d="M62 31L69 23L76 31L69 39Z" fill="#D8AE55"/></Svg>; }
