import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useReducedMotion } from "../../../components/motion";
import { C, Copy, PressableScale } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { PatternGlyph, patternLabel, SeaGlyph } from "../thinkingArt";
import { help, place, taskAt, type PatternState } from "./engine";

export function Board({ session, update, practice, assistance, cheer, coach, active, width }: BoardProps<PatternState>) {
  const s = session.state, task = taskAt(s);
  const reduced = useReducedMotion();
  const [hint, setHint] = useState(false), [wrong, setWrong] = useState(false), [hopAt, setHopAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const trailWidth = Math.min(Math.max(width - 36, 278), 430), trailHeight = 292;
  const left = 35, middle = trailWidth / 2, right = trailWidth - 35;
  const matrix = task.tiles.length === 9;
  const points: [number, number][] = matrix ? Array.from({ length: 9 }, (_, i) => [[left, middle, right][i % 3], [46, 143, 240][Math.floor(i / 3)]]) : [[left,46],[middle,46],[right,46],[right,143],[middle,143],[left,143],[left,240],[middle,240],[right,240]];
  const choose = (tile: string) => {
    if (hopAt !== null) return;
    const rightAnswer = tile === task.answer;
    practice("think.pattern", rightAnswer);
    if (!rightAnswer) { setWrong(true); return; }
    setWrong(false); setHint(false);
    if (reduced || matrix) {
      update(place(s, tile)); cheer(s.index === 3 ? "big" : "right"); coach.done(); return;
    }
    setHopAt(0);
    let step = 0;
    timer.current = setInterval(() => {
      step += 1;
      if (step > task.missing) {
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        setHopAt(null);
        update(place(s, tile));
        cheer(s.index === 3 ? "big" : "right");
        coach.done();
      } else setHopAt(step);
    }, 85);
  };
  return <View style={{ gap: 15, paddingVertical: 8 }}>
    <Copy style={{ color: C.ink, fontSize: 22, fontWeight: "900" }}>{task.title}</Copy>
    <View style={{ backgroundColor: "#E4EED9", borderRadius: 25, paddingVertical: 13, alignItems: "center", overflow: "hidden" }}>
      <Copy style={{ color: "#365034", fontWeight: "900", alignSelf: "flex-start", marginLeft: 17 }}>TRAIL {s.index + 1} OF 4</Copy>
      <View style={{ width: trailWidth, height: trailHeight, marginTop: 7 }}>
        {!matrix && <Svg width={trailWidth} height={trailHeight} style={{ position: "absolute" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Path d={`M${left} 46 Q${middle} 25 ${right} 46 C${trailWidth+3} 78 ${trailWidth+3} 111 ${right} 143 Q${middle} 165 ${left} 143 C-3 177 -3 211 ${left} 240 Q${middle} 219 ${right} 240`} fill="none" stroke="#A4C69B" strokeWidth="18" strokeLinecap="round" />
          <Path d={`M${left} 46 Q${middle} 25 ${right} 46 C${trailWidth+3} 78 ${trailWidth+3} 111 ${right} 143 Q${middle} 165 ${left} 143 C-3 177 -3 211 ${left} 240 Q${middle} 219 ${right} 240`} fill="none" stroke="#F8F2D9" strokeWidth="5" strokeDasharray="4 12" strokeLinecap="round" />
        </Svg>}
        {task.tiles.map((tile, i) => {
          const [x,y] = points[i], missing = i === task.missing;
          return <View key={i} accessible accessibilityLabel={missing ? "Missing stone" : `Stone ${i + 1}: ${patternLabel(tile)}`} style={{ position: "absolute", left: x - 29, top: y - 29, width: 58, height: 58, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: missing ? "#FFF5CC" : "#FFFDF3", borderWidth: missing ? 3 : 2, borderColor: missing ? "#D6A53C" : "#789C75", shadowColor: missing ? "#E7B248" : "transparent", shadowOpacity: missing ? .55 : 0, shadowRadius: 11, elevation: missing ? 5 : 0 }}>
            {missing ? <><CircleGap size={39}/><Copy style={{ position: "absolute", color: "#8E6B2C", fontSize: 20, fontWeight: "900" }}>?</Copy></> : <PatternGlyph token={tile} size={tile.startsWith("shells:") ? 42 : 43} />}
            <View style={{ position: "absolute", right: -7, bottom: -8, width: 20, height: 20, borderRadius: 10, backgroundColor: "#3D6549", alignItems: "center", justifyContent: "center" }}><Copy style={{ color: "#FFFDF3", fontSize: 11, fontWeight: "900" }}>{i + 1}</Copy></View>
          </View>;
        })}
        {hopAt !== null && <View pointerEvents="none" style={{ position: "absolute", left: points[hopAt][0] - 16, top: points[hopAt][1] - 51 - (hopAt % 2 ? 8 : 0) }}><SeaGlyph kind="crab" size={34} /></View>}
      </View>
    </View>
    <Copy style={{ color: C.ink, fontWeight: "900", fontSize: 17 }}>Which stone fills the glowing gap?</Copy>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>{task.choices.map((tile, i) => <PressableScale key={`${tile}-${i}`} accessibilityRole="button" accessibilityLabel={`Place ${patternLabel(tile)} in the gap`} disabled={!active || hopAt !== null} onPress={() => choose(tile)} style={{ width: 69, minHeight: 65, padding: 6, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFDF2", borderWidth: 2, borderColor: "#7C9C75" }}><PatternGlyph token={tile} size={46} /></PressableScale>)}</View>
    {wrong && <Copy style={{ color: "#965633", fontWeight: "800" }}>Good try. Follow the path from stone 1 and watch what changes.</Copy>}
    <PressableScale accessibilityRole="button" accessibilityLabel="Help with this pattern" onPress={() => { assistance?.(); update(help(s)); setHint(true); }} style={{ alignSelf: "flex-start", padding: 14, borderRadius: 14, backgroundColor: "#E8F2DF" }}><Copy style={{ color: "#365034", fontWeight: "800" }}>Help me see the rule</Copy></PressableScale>
    {hint && <Copy style={{ color: C.ink, fontSize: 17 }}>{task.hint} The missing stone is {patternLabel(task.answer)}.</Copy>}
  </View>;
}
function CircleGap({ size }: { size: number }) { return <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Circle cx="20" cy="20" r="17" fill="#FFF9E5" stroke="#E9C36C" strokeWidth="2" strokeDasharray="3 3" /></Svg>; }
export function Art({ size }: { size: number }) { return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M7 75Q30 28 53 63T94 34" fill="none" stroke="#8EB5A0" strokeWidth="8" strokeLinecap="round"/><Circle cx="17" cy="69" r="13" fill="#E9866A" stroke="#365034" strokeWidth="3"/><Circle cx="50" cy="61" r="13" fill="#EDC654" stroke="#365034" strokeWidth="3"/><Circle cx="82" cy="43" r="13" fill="#E9866A" stroke="#365034" strokeWidth="3"/></Svg>; }
