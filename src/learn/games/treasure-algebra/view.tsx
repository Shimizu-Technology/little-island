import React, { useEffect, useState } from "react";
import { Animated, Platform, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { useReducedMotion } from "../../../components/motion";
import { Button, C, Copy, Heading, PressableScale } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { initialValue, solved, workedHint, seaLineRange, type AlgebraState, type AlgebraTask } from "./engine";

const navy = "#315D88", teal = "#217B8A", coral = "#D66E57", sand = "#FFF1C8";


function Diver({ size = 62 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 70 70" accessible={false}>
    <Ellipse cx="34" cy="57" rx="20" ry="6" fill={navy} opacity={0.16}/>
    <Path d="M16 43L7 37L9 31L22 38M50 43L62 36L61 31L46 37" fill="#F6C369" stroke={navy} strokeWidth="3" strokeLinejoin="round"/>
    <Path d="M23 49L17 62L10 64M44 49L52 62L60 64" fill="none" stroke={navy} strokeWidth="5" strokeLinecap="round"/>
    <Path d="M21 31Q34 24 48 31L46 53Q34 60 22 53Z" fill={coral} stroke={navy} strokeWidth="3"/>
    <Circle cx="35" cy="23" r="17" fill="#F7CF9C" stroke={navy} strokeWidth="3"/>
    <Path d="M19 22Q18 6 35 6Q52 6 51 22" fill={teal} stroke={navy} strokeWidth="3"/>
    <Rect x="22" y="16" width="26" height="12" rx="6" fill="#D7F3F2" stroke={navy} strokeWidth="2.5"/>
    <Circle cx="30" cy="22" r="2" fill={navy}/><Circle cx="41" cy="22" r="2" fill={navy}/>
    <Path d="M31 31Q35 35 39 31" fill="none" stroke={navy} strokeWidth="2" strokeLinecap="round"/>
    <Circle cx="60" cy="13" r="3" fill="#D7F3F2" stroke={teal} strokeWidth="1.5"/>
  </Svg>;
}

function SeaLine({ value, start }: { value: number; start?: number }) {
  const reduced = useReducedMotion();
  const { min, max } = seaLineRange(value, start);
  const lineY = (n: number) => 290 - (n - min) / (max - min) * 250;
  const ticks = Array.from({ length: 6 }, (_, i) => Math.round(min + (max - min) * i / 5));
  const targetY = lineY(value) - 165;
  const [motion] = useState(() => new Animated.Value(targetY));
  useEffect(() => {
    const toValue = targetY;
    if (reduced) { motion.stopAnimation(); motion.setValue(toValue); return; }
    const move = Animated.timing(motion, { toValue, duration: 220, useNativeDriver: true });
    move.start();
    return () => move.stop();
  }, [motion, targetY, reduced]);
  return <View style={{ alignItems: "center", gap: 7 }}>
    <View accessibilityLabel={`Vertical sea-level number line. Diver at ${value}${start === undefined ? "" : `, start ${start}`}`} style={{ width: 286, height: 330, borderRadius: 24, overflow: "hidden", borderWidth: 3, borderColor: navy, backgroundColor: "#E3F6F2" }}>
      <Svg width="286" height="330" viewBox="0 0 286 330" accessible={false}>
        <Rect width="286" height={lineY(0)} fill="#E9F6DC"/><Rect y={lineY(0)} width="286" height={330-lineY(0)} fill="#C4E9EE"/>
        <Circle cx="47" cy="43" r="20" fill="#F8CC67"/><Path d="M47 10v10M47 66v10M14 43h10M70 43h10M23 19l7 7M64 61l7 7M71 19l-7 7M30 61l-7 7" stroke="#E6A63F" strokeWidth="3" strokeLinecap="round"/>
        <Path d={`M0 ${lineY(0)}H286`} fill="none" stroke={teal} strokeWidth="5"/>
        <Path d="M10 238Q55 223 102 240M26 275Q79 262 120 279M16 306Q54 295 85 307" fill="none" stroke="#8FCBD0" strokeWidth="4" strokeLinecap="round"/>
        <Path d="M15 316q9-24 18 0m16 0q8-19 16 0" fill="none" stroke={teal} strokeWidth="3"/>
        <Line x1="192" y1="14" x2="192" y2="316" stroke={navy} strokeWidth="4"/>
        {ticks.map(n => <G key={n}><Line x1="181" y1={lineY(n)} x2="204" y2={lineY(n)} stroke={n === 0 ? coral : navy} strokeWidth={n === 0 ? "4" : "2"}/><SvgText x="218" y={lineY(n)+5} fill={n === 0 ? "#A94D36" : navy} fontWeight="800" fontSize="16">{n > 0 ? `+${n}` : n}</SvgText></G>)}
        {start !== undefined && <G><Circle cx="192" cy={lineY(start)} r="8" fill="#F7C25E" stroke={navy} strokeWidth="2"/><SvgText x="105" y={lineY(start)-10} fill={navy} fontSize="12" fontWeight="800">START</SvgText></G>}
      </Svg>
      <Animated.View pointerEvents="none" style={{ position: "absolute", left: 104, top: 133, transform: [{ translateY: motion }] }}><Diver size={62}/></Animated.View>
    </View>
    <Copy style={{ color: navy, fontWeight: "900", fontSize: 18 }}>Diver at {value} {value === 0 ? "· sea level" : value > 0 ? "· above water" : "· below water"}</Copy>
  </View>;
}

function Weight({ value }: { value: number }) {
  return <Svg width={46} height={45} viewBox="0 0 46 45" accessible={false}><Path d="M16 12h14l8 28H8Z" fill="#D6995A" stroke={navy} strokeWidth="2.5"/><Rect x="17" y="4" width="12" height="10" rx="4" fill="#F2CB84" stroke={navy} strokeWidth="2"/><SvgText x="23" y="34" fontSize="17" fontWeight="900" textAnchor="middle" fill={navy}>{value}</SvgText></Svg>;
}
function BalanceBoard({ task, state, remove, divide }: { task: AlgebraTask; state: AlgebraState; remove: () => void; divide: () => void }) {
  const left = task.a + state.offset, right = task.b + state.offset;
  const removal = <Button compact quiet onPress={remove}>−{task.a} both</Button>;
  const dragWeight = Platform.OS === "web" ? React.createElement("div", { draggable: left > 0, onDragStart: e => e.dataTransfer.setData("text/plain", "balance-weight"), style: { cursor: "grab" } }, removal) : removal;
  const dropBasket = Platform.OS === "web" ? React.createElement("div", { role: "button", "aria-label": "Drop weight to remove it from both pans", onDragOver: e => e.preventDefault(), onDrop: e => { e.preventDefault(); if (e.dataTransfer.getData("text/plain") === "balance-weight") remove(); }, style: { border: `2px dashed ${navy}`, borderRadius: 14, padding: 10, textAlign: "center", color: navy, fontWeight: 800, minWidth: 110 } }, "Drop weight here") : <Copy style={{ color: navy, fontWeight: "800" }}>Take the weight off both pans.</Copy>;
  return <View style={{ backgroundColor: "#E6F1E4", borderRadius: 22, padding: 14, gap: 10, borderWidth: 2, borderColor: navy }}>
    <Copy style={{ color: navy, fontWeight: "900", textAlign: "center", fontSize: 18 }}>{task.kind === "inequality" ? "KEEP THE ≤ RELATION" : "BALANCE BOTH PANS"}</Copy>
    <View style={{ flexDirection: "row", gap: 8 }}>
      <View style={{ flex: 1, backgroundColor: C.paper, borderRadius: 16, borderWidth: 2, borderColor: navy, minHeight: 105, alignItems: "center", justifyContent: "center", gap: 3 }}><Copy style={{ fontSize: 23, fontWeight: "900", color: navy }}>{state.divided || task.extra === 1 ? "x" : `${task.extra}x`} {left > 0 ? `+ ${left}` : ""}</Copy>{left > 0 && <Weight value={left}/>}</View>
      {task.kind === "inequality" && <Copy style={{ alignSelf: "center", fontSize: 26, fontWeight: "900" }}>≤</Copy>}
      <View style={{ flex: 1, backgroundColor: C.paper, borderRadius: 16, borderWidth: 2, borderColor: navy, minHeight: 105, alignItems: "center", justifyContent: "center", gap: 3 }}><Copy style={{ fontSize: 23, fontWeight: "900", color: navy }}>{state.divided ? right / task.extra : right}</Copy>{!state.divided && <Weight value={right}/>}</View>
    </View>
    <Svg height="50" width="100%" viewBox="0 0 300 50"><Path d="M20 3H280M150 3V34M127 47L150 30L173 47Z" fill="#F7C25E" stroke={navy} strokeWidth="4" strokeLinejoin="round"/></Svg>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>{left > 0 && dragWeight}{left > 0 && dropBasket}{left <= 0 && task.extra > 1 && !state.divided && <Button compact quiet onPress={divide}>÷{task.extra} both</Button>}</View>
    {left <= 0 && <Copy style={{ color: navy, textAlign: "center", fontWeight: "800" }}>{task.extra > 1 && !state.divided ? `Now split both sides into ${task.extra} equal groups.` : task.kind === "inequality" ? `x ≤ ${task.answer}. Choose any integer at or below ${task.answer}.` : "Both sides still match. Find x below."}</Copy>}
  </View>;
}

function StepControls({ value, balance, change }: { value: number; balance: boolean; change: (v: number) => void }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>{[-10,-5,-1,1,5,10].map(step => <PressableScale key={step} accessibilityRole="button" accessibilityLabel={`${step > 0 ? "Add" : "Subtract"} ${Math.abs(step)} ${balance ? "from x" : "steps"}`} onPress={() => change(Math.max(-20, Math.min(100, value + step)))} style={{ width: 48, minHeight: 52, borderRadius: 13, backgroundColor: C.paper, borderWidth: 2, borderColor: navy, alignItems: "center", justifyContent: "center" }}><Copy style={{ color: navy, fontSize: 18, fontWeight: "900" }}>{step > 0 ? "+" : ""}{step}</Copy></PressableScale>)}</View>;
}

export function Board({ session, update, practice, assistance, cheer, coach }: BoardProps<AlgebraState>) {
  const state = session.state, task = state.tasks[state.index];
  const [feedback, setFeedback] = useState(""), [hint, setHint] = useState(false);
  if (!task) return null;
  const balance = ["balance", "two-step", "inequality"].includes(task.kind);
  const change = (patch: Partial<AlgebraState>) => { update({ ...state, ...patch }); setFeedback(""); coach.done(); };
  const check = () => {
    const right = solved(state);
    practice(task.kind === "steps" || task.kind === "pattern" ? "num.patterns" : task.kind === "depth" ? "num.integers" : task.kind === "missing" || task.kind === "expression" ? "num.expressions" : task.kind === "balance" ? "num.balance" : "num.two-step", right);
    if (!right) { setFeedback("The chest is still locked. Check the line or both pans and try again."); return; }
    cheer("right"); setFeedback(""); setHint(false);
    update({ ...state, index: state.index + 1, value: initialValue(state.tasks[state.index + 1]), offset: 0, divided: false });
  };
  const title = task.kind === "steps" || task.kind === "depth" ? `Start at ${task.a}. ${task.b > 0 ? "Climb" : "Dive"} ${Math.abs(task.b)} steps.`
    : task.kind === "missing" ? `□ + ${task.b} = ${task.a}`
    : task.kind === "balance" ? `x + ${task.a} = ${task.b}`
    : task.kind === "two-step" ? `${task.extra}x + ${task.a} = ${task.b}`
    : task.kind === "substitution" ? `If x = ${task.extra}, find ${task.a} + ${task.b} × x`
    : task.kind === "pattern" ? `Continue ${task.a}, ${task.a+task.b}, ${task.a+2*task.b}, ...`
    : task.kind === "expression" ? `Find ${task.a} + ${task.b} × ${task.extra}`
    : `${task.extra}x + ${task.a} ≤ ${task.b}`;
  const instruction = task.kind === "inequality" ? "Keep ≤ as you remove and divide both sides. Choose an integer that makes the inequality true." : task.kind === "pattern" ? "Find the repeated step. Move the diver to the next number after the last shown." : task.kind === "expression" ? "Multiply before adding. Move the diver to the result." : balance ? "Remove the same treasure from both pans. Split both sides if x has a group, then set x." : task.kind === "missing" ? "What number is hiding in the box? Move the diver to show x." : task.kind === "substitution" ? "Put the given x into the expression. Multiply before adding." : "The diver begins at START. Use the steps to move up or down.";
  return <View style={{ gap: 14, paddingBottom: 20 }}>
    <View style={{ backgroundColor: sand, borderRadius: 19, padding: 16, gap: 7 }}><Copy style={{ color: navy, fontWeight: "900" }}>CHEST {state.index + 1} OF 5</Copy><Heading>{title}</Heading><Copy>{instruction}</Copy></View>
    {balance && <BalanceBoard task={task} state={state} remove={() => change({ offset: -task.a, divided: false })} divide={() => change({ divided: true })}/>}
    {!balance && task.kind === "substitution" && <View style={{ backgroundColor: "#E6F1E4", borderRadius: 20, padding: 15, alignItems: "center" }}><Copy style={{ color: navy, fontSize: 26, fontWeight: "900" }}>{task.a} + {task.b} × {task.extra} = ?</Copy></View>}
    <SeaLine value={state.value} start={task.kind === "steps" || task.kind === "depth" ? task.a : undefined}/>
    <StepControls value={state.value} balance={balance} change={value => change({ value })}/>
    {hint && <View style={{ backgroundColor: "#FFF8DC", borderRadius: 13, padding: 12 }}><Copy style={{ fontWeight: "700" }}>{workedHint(task)}</Copy></View>}
    {!!feedback && <Copy style={{ color: C.error, fontWeight: "800" }}>{feedback}</Copy>}
    <View style={{ flexDirection: "row", gap: 8 }}><Button style={{ flex: 1 }} onPress={check}>Open chest</Button><Button quiet compact onPress={() => { if (!hint) assistance?.(); setHint(!hint); update({ ...state, helped: true }); }}>Hint</Button></View>
  </View>;
}

export function Art({ size }: { size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
    <Ellipse cx="50" cy="82" rx="44" ry="9" fill={navy} opacity={0.17}/>
    <Path d="M12 40Q50 9 88 40V75H12Z" fill="#E5AC68" stroke={navy} strokeWidth="4"/>
    <Path d="M12 40Q50 20 88 40L78 49Q50 34 22 49Z" fill="#F4C984" stroke={navy} strokeWidth="3"/>
    <Rect x="12" y="49" width="76" height="30" rx="5" fill="#BC7540" stroke={navy} strokeWidth="4"/>
    <Path d="M50 38V79M12 60H88" stroke="#F6DA83" strokeWidth="6"/>
    <Circle cx="50" cy="61" r="9" fill="#FFE8A6" stroke={navy} strokeWidth="2"/><Path d="M50 56v10" stroke={navy} strokeWidth="3" strokeLinecap="round"/>
    <Path d="M8 26l4-8m76 8l-4-8M50 12V3" stroke="#E7AC52" strokeWidth="3" strokeLinecap="round"/>
  </Svg>;
}
