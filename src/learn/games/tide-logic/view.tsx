import React, { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { Button, C, Copy, Heading } from "../../../components/ui";
import { GameIcon } from "../../../components/GameIcon";
import type { BoardProps } from "../../types";
import { advance, counterAt, choices, complete, correct, ready, route, taskAt, type Item, type TideState } from "./engine";

function Cargo({ item, size = 56 }: { item: Item; size?: number }) {
  const fill = item.color === "blue" ? "#4E9BB9" : "#E9826B";
  return <Svg width={size} height={size} viewBox="0 0 64 64" accessible accessibilityLabel={`${item.size} ${item.color} ${item.kind}${item.bell ? ", bell" : ""}`}>
    {item.kind === "fish" ? <><Path d="M8 32 Q28 8 51 32 Q28 56 8 32 M48 32 L61 19 V45 Z" fill={fill} stroke={C.ink} strokeWidth="2"/><Circle cx="23" cy="28" r="2" fill={C.ink}/></> : <><Path d="M8 47 Q9 12 32 12 Q55 12 56 47 L32 56 Z" fill={fill} stroke={C.ink} strokeWidth="2"/><Path d="M32 15V51M18 23L28 51M46 23L36 51" stroke="#FFF" strokeWidth="2"/></>}
    {item.bell && <><Circle cx="51" cy="12" r="10" fill="#F1C75A"/><SvgText x="51" y="16" textAnchor="middle" fontSize="13">♪</SvgText></>}
  </Svg>;
}
const bucketLabel = (value: string) => value === "left" ? "← left bucket" : value === "right" ? "right bucket →" : value === "count left" ? "← left bucket + count" : "choose bucket";
function BucketPicture({ side }: { side: "left" | "right" }) { return <Svg width={30} height={30} viewBox="0 0 32 32" accessible accessibilityLabel={`${side} bucket picture`}><Path d="M5 8H27L24 27H8Z" fill={side === "left" ? "#5AAAB5" : "#EB9A79"} stroke={C.ink} strokeWidth="2"/><Path d="M4 8Q16 -2 28 8" fill="none" stroke={C.ink} strokeWidth="2"/></Svg>; }
export function Board({ session, update, practice, assistance, cheer, coach, active, width }: BoardProps<TideState>) {
  const s = session.state, done = complete(s), t = done ? null : taskAt(s.level, s.seed, s.index, s.version);
  const [editing, setEditing] = useState<keyof TideState["rule"] | null>(null);
  const [message, setMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [guess, setGuess] = useState<"left" | "right" | null>(null);
  const [failure, setFailure] = useState<number | null>(null);
  const current = t && s.running >= 0 ? Math.min(s.running, t.items.length - 1) : 0;
  const traceIndex = s.index % 2 ? 1 : 0;
  const traceAnswer = t ? route(t.items[traceIndex], t.target) : null;
  const change = (slot: keyof TideState["rule"], value: string) => { update({ ...s, rule: { ...s.rule, [slot]: value } }); setEditing(null); setMessage(""); setFailure(null); coach.done(); };
  const run = () => {
    if (!t || !ready(s) || (s.level === 5 && guess !== traceAnswer)) return;
    if (!correct(s)) {
      const wrong = t.items.findIndex((item) => route(item, s.rule) !== route(item, t.target));
      setFailure(wrong >= 0 ? wrong : 0);
      practice(s.level >= 3 ? "think.code-logic" : "think.code-condition", false);
      setMessage(wrong >= 0 ? `Catch ${wrong + 1} would go ${route(t.items[wrong], s.rule).toUpperCase()}, but it belongs ${route(t.items[wrong], t.target).toUpperCase()}. Change a block and try again.` : "The counter action is missing. Change the last block and try again.");
      return;
    }
    setFailure(null);
    update({ ...s, running: 0 }); setMessage("Watch each catch reach its bucket."); cheer("right");
  };
  const step = () => {
    if (!t) return;
    if (s.running >= t.items.length) { const next = advance(s); update(next); setMessage(""); setGuess(null); setFailure(null); if (complete(next)) cheer("big"); return; }
    const next = advance(s); update(next);
    if (next.running === t.items.length) { practice(s.level === 4 ? "think.code-events" : s.level >= 3 ? "think.code-logic" : "think.code-condition", true); cheer("right"); }
  };
  return <View style={{ gap: 12, paddingBottom: 20 }}>
    <Heading>{done ? "Dock sorter complete!" : `Belt ${s.index + 1} of 4`}</Heading>
    {t && <>
      <Copy>{t.prompt}</Copy>
      <View style={{ backgroundColor: "#E2F3F2", borderRadius: 18, padding: 12, gap: 8 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 5 }}>
          {t.items.map((item, i) => <View key={i} style={{ opacity: s.running >= 0 && i > current ? .35 : 1, alignItems: "center", minWidth: 62, borderWidth: i === failure || s.running === i ? 3 : 0, borderColor: i === failure ? "#B74431" : "#287A82", borderRadius: 12, backgroundColor: i === failure ? "#FFE0D8" : s.running === i ? "#FFF2BA" : "transparent", padding: 3 }}><Cargo item={item} size={item.size === "big" ? 64 : 49}/><Copy style={{ fontSize: 13, fontWeight: "700" }}>{item.size}</Copy></View>)}
        </View>
        <View style={{ height: 9, borderRadius: 5, backgroundColor: "#B49C77" }}/>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}><Copy>← LEFT BUCKET</Copy><Copy>RIGHT BUCKET →</Copy></View>
        {s.level === 4 && <View accessibilityLiveRegion="polite" style={{padding:10,borderRadius:12,backgroundColor:"#FFF2BA"}}><Copy style={{fontSize:22,fontWeight:"800"}}>Counter: {counterAt(s)}</Copy><Copy>{s.running >= 0 && s.running < t.items.length ? route(t.items[s.running],s.rule)==="left" && s.rule.action==="count left" ? "Next catch: +1 when you tap Next catch" : "Next catch: counter stays the same" : s.running < 0 ? "Starts at 0. Count matching bell catches." : "Final count · every matching bell catch counted once"}</Copy></View>}
        {s.running >= 0 && <Copy style={{ textAlign: "center", fontWeight: "700" }}>{s.running < t.items.length ? `Catch ${s.running + 1}: ${route(t.items[s.running], s.rule).toUpperCase()} ${s.rule.action === "count left" && route(t.items[s.running], s.rule) === "left" ? " · counter +1" : ""}` : `All sorted! ${t.items.filter((item) => route(item, s.rule) === "left").length} left · ${t.items.filter((item) => route(item, s.rule) === "right").length} right`}</Copy>}
        {failure !== null && <Copy style={{ textAlign: "center", color: "#8D3528", fontWeight: "800" }}>Look at the outlined catch: the sorter found a bug.</Copy>}
      </View>
      <View style={{ borderWidth: 2, borderColor: "#287A82", backgroundColor: "#FFF9EA", borderRadius: 16, padding: 12, gap: 7 }}>
        <Copy style={{ fontWeight: "700" }}>BUILD THE RULE</Copy>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", alignItems: "center" }}><Copy>IF</Copy>{t.slots.map((slot, i) => <React.Fragment key={slot}>{s.level === 1 && slot === "first" && !!s.rule.first && <View style={{ width: 23, height: 23, borderRadius: 12, backgroundColor: s.rule.first === "blue" ? "#4E9BB9" : "#E9826B", borderWidth: 2, borderColor: C.ink }}/>}{i === t.slots.length - 1 && <Copy>→</Copy>}{s.level === 1 && slot === "action" && <BucketPicture side={s.rule.action === "right" ? "right" : "left"}/>}<Button compact quiet selected={editing === slot} onPress={() => setEditing(editing === slot ? null : slot)} disabled={!active || s.running >= 0} label={`Choose ${slot}, currently ${s.rule[slot] || "empty"}`}>{slot === "action" ? bucketLabel(s.rule.action) : s.rule[slot] || (slot === "first" || slot === "second" ? "clue +" : s.level >= 4 ? "THEN +" : "AND/OR +")}</Button></React.Fragment>)}<Copy>ELSE → {bucketLabel(s.rule.action === "right" ? "left" : "right")}</Copy></View>
      </View>
      {editing && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{choices[editing].filter((v) => editing === "first" ? (s.level === 1 ? ["blue","coral"].includes(v) : s.level === 2 || s.level === 5 ? ["big","small"].includes(v) : s.level === 4 ? v === "bell" : ["blue","coral"].includes(v)) : editing === "second" ? s.level === 3 ? ["big","small"].includes(v) : ["blue","coral"].includes(v) : editing === "join" ? (s.level >= 4 ? v === "then" : v !== "then") : s.level === 4 ? v !== "right" : v !== "count left").map((v) => <Button key={v} compact onPress={() => change(editing, v)}>{editing === "action" ? bucketLabel(v) : s.level === 1 && editing === "first" ? `${v === "blue" ? "🔵" : "🟠"} ${v}` : v}</Button>)}</View>}
      {s.level === 5 && s.running < 0 && ready(s) && <View style={{ gap: 6, backgroundColor: "#E8F3EA", borderRadius: 14, padding: 10 }}><Copy style={{ fontWeight: "700" }}>TRACE IT · Catch {traceIndex + 1}: which bucket will it reach?</Copy><View style={{ flexDirection: "row", gap: 8 }}>{(["left", "right"] as const).map((bucket) => <Button key={bucket} compact quiet selected={guess === bucket} onPress={() => { setGuess(bucket); if (bucket !== traceAnswer) { practice("think.code-logic", false); setMessage("Follow the first check, then the inner check. Try again."); } else { setMessage("You traced it! Now run the belt."); cheer("right"); } }}>{bucket === "left" ? "← Left" : "Right →"}</Button>)}</View></View>}
      {!!message && <Copy>{message}</Copy>}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {s.running < 0 ? <Button onPress={run} disabled={!active || !ready(s) || (s.level === 5 && guess !== traceAnswer)}>▶ Run the belt</Button> : <Button onPress={step} disabled={!active}>{s.running < t.items.length ? "Next catch →" : "Next belt →"}</Button>}
        <Button quiet onPress={() => { assistance?.(); update({ ...s, rule: t.target, helped: true }); setEditing(null); setFailure(null); setShowHelp(true); }} disabled={!active || s.running >= 0}>Show rule</Button>
      </View>
      {showHelp && <Copy>Help filled the rule. Press Run to see why each catch goes there.</Copy>}
    </>}
  </View>;
}
export function Art({ size }: { size: number }) { return <GameIcon id="tide-logic" size={size}/>; }
