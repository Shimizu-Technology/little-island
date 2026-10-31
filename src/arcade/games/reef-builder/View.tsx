import { Companion } from "../../../islander/Companion";
import { PlayButton, PressControl, uiThreadDrag } from "../../Input";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { Easing, measure, runOnJS, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useSharedValue, withSequence, withTiming, type AnimatedRef } from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { Text } from "../../../components/Text";
import { Button, Copy } from "../../../components/ui";
import { useReducedMotion } from "../../../components/motion";
import { Icon } from "../../../components/Icon";
import { useArcadeReducer } from "../../loop";
import { Hero, HudPill, MiniStars } from "../../Juice";
import { ReefFish } from "../../Art";
import { reefDrag, reefGrab } from "./geometry";
import { legalReefMoves, previewReefPlacement, reefGoalValue, reefResult, reefTransition, migrateReef, type CoralPiece, type ReefState } from "./engine";
import type { ArcadeResult } from "../../types";
const coralColors = ["#F58D8D", "#FFC45D", "#57CDB0", "#AB87DC"];
export const Coral = memo(function Coral({ color, variant = 0, fish = false, size }: { color: string; variant?: number; fish?: boolean; size: number }) {
  const shapes = ["M17 35V18L8 15V7Q8 3 13 5V11L18 12V5Q18 1 23 3V17L28 14V8Q33 4 34 9V18L23 24V35Z", "M9 35Q0 25 7 15Q8 6 15 9Q22-1 29 8Q40 11 35 22Q41 32 30 35Z", "M7 34Q-1 27 7 23L15 21L6 17Q2 10 10 10L20 17L17 6Q21-2 26 5L25 17L32 10Q40 9 37 17L27 25L34 29Q38 37 29 35Z", "M7 34L4 19Q3 11 9 13L13 20L12 8Q14 1 19 6L22 19L27 8Q33 3 34 10L32 24Q42 34 30 35Z"];
  return <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}><Rect x={1} y={1} width={38} height={38} rx={4} fill={color} fillOpacity={.55} stroke="#416A6B" strokeWidth={1.3}/><G transform="translate(7 7) scale(.65)"><Ellipse cx={21} cy={35} rx={16} ry={3} fill="#365D72" opacity={.24}/><Path d={shapes[variant % 4]} fill={color} stroke="#47697B" strokeWidth={1.7} strokeLinejoin="round"/><Path d={variant % 2 ? "M11 17Q14 10 18 12M26 12L29 15M12 29L15 30" : "M19 29V23M11 9V12M29 12V15"} fill="none" stroke="#FFF2C6" strokeWidth={2.6} strokeLinecap="round"/>{fish && <><Path d="M23 26L33 20V32Z" fill="#EF8D91" stroke="#546079" strokeWidth={1}/><Ellipse cx={18} cy={26} rx={9} ry={6} fill="#FFF1AE" stroke="#536F83" strokeWidth={1}/><Circle cx={15} cy={24} r={1.8} fill="#294D50"/></>}</G></Svg>;
});
function PieceArt({ piece, cell = 26, numbers = false }: { piece: CoralPiece; cell?: number; numbers?: boolean }) {
  const w = Math.max(...piece.cells.map(c => c[1])) + 1, h = Math.max(...piece.cells.map(c => c[0])) + 1;
  return <View style={{ width: w * cell, height: h * cell }}>{piece.cells.map(([r, c], i) => <View key={i} style={{ position: "absolute", top: r * cell, left: c * cell, width: cell, height: cell, alignItems: "center", justifyContent: "center" }}><Coral color={coralColors[piece.color % 4]} variant={piece.color} size={cell}/>{numbers && <View style={{ position: "absolute", backgroundColor: "#FFF4D9", borderRadius: 7, paddingHorizontal: 4 }}><Text style={{ fontSize: cell * .58, fontWeight: "900", color: "#244D60" }}>{piece.value}</Text></View>}</View>)}</View>;
}
function DraggablePiece({ piece, slot, selected, active, board, cell, numbers, compact, onSelect, onHover, onDrop }: { piece: CoralPiece; slot: number; selected: boolean; active: boolean; board: AnimatedRef<Animated.View>; cell: number; numbers: boolean; compact: boolean; onSelect: (slot: number) => void; onHover: (spot: { row: number; col: number } | null) => void; onDrop: (slot: number, row: number, col: number) => void }) {
  const point = useSharedValue({ x: 0, y: 0, down: false }), card = useAnimatedRef<Animated.View>(), art = useAnimatedRef<Animated.View>();
  const grab = useSharedValue({ row: 0, col: 0, x: .5, y: .5 }), origin = useSharedValue({ x: 0, y: 0, startX: 0, startY: 0 });
  const rect = useSharedValue({ x: 0, y: 0, cell }), trayCell = Math.min(compact ? 23 : 27, 70 / Math.max(...piece.cells.map(p => p[0] + 1), ...piece.cells.map(p => p[1] + 1)));
  // eslint-disable-next-line react-hooks/refs -- Gesture callbacks measure animated refs only on UI-thread touch events.
  const gesture = useMemo(() => uiThreadDrag(point).enabled(active).onBegin(e => {
    "worklet";
    // Capture the occupied cell at touch-down, before a quick native drag can move.
    point.set({ x: e.x, y: e.y, down: true });
    const tray = measure(card), pieceRect = measure(art), reef = measure(board);
    if (tray && pieceRect && reef) {
      rect.set({ x: reef.pageX, y: reef.pageY, cell });
      origin.set({ x: tray.pageX, y: tray.pageY, startX: e.x, startY: e.y });
      grab.set(reefGrab(piece.cells, tray.pageX + e.x - pieceRect.pageX, tray.pageY + e.y - pieceRect.pageY, trayCell));
    }
    runOnJS(onSelect)(slot);
  }).onEnd((e, success) => {
    "worklet";
    if (success && Math.hypot(e.x - origin.value.startX, e.y - origin.value.startY) > 8) {
      const spot = reefDrag(origin.value.x + e.x, origin.value.y + e.y, rect.value, grab.value);
      runOnJS(onDrop)(slot, spot.row, spot.col);
    }
    runOnJS(onHover)(null);
  }), [point, active, card, art, board, cell, rect, origin, grab, piece.cells, trayCell, onSelect, slot, onDrop, onHover]);
  useAnimatedReaction(() => {
    const p = point.value, o = origin.value, dragging = p.down && Math.hypot(p.x - o.startX, p.y - o.startY) > 8;
    const spot = reefDrag(o.x + p.x, o.y + p.y, rect.value, grab.value);
    return { dragging, row: spot.row, col: spot.col };
  }, (now, before) => {
    if (now.dragging !== before?.dragging || now.dragging && (now.row !== before?.row || now.col !== before?.col)) runOnJS(onHover)(now.dragging ? { row: now.row, col: now.col } : null);
  }, [onHover]);
  const floating = useAnimatedStyle(() => {
    const p = point.value, o = origin.value, spot = reefDrag(o.x + p.x, o.y + p.y, rect.value, grab.value);
    return { opacity: active && p.down && Math.hypot(p.x - o.startX, p.y - o.startY) > 8 ? 1 : 0, transform: [{ translateX: spot.left - o.x }, { translateY: spot.top - o.y }] };
  });
  return <GestureDetector gesture={gesture}><Animated.View ref={card} collapsable={false} style={{ zIndex: selected ? 100 : 1, ...(Platform.OS === "web" ? { touchAction: "none" as const } : {}) }}>
    <PressControl testID={`coral-piece-${slot}`} accessibilityLabel={`Piece ${slot + 1}, ${numbers ? `number ${piece.value}` : `${piece.cells.length} corals`}${selected ? ", selected" : ""}. Drag any coral, or tap then tap a reef cell.`} accessibilityState={{ selected, disabled: !active }} disabled={!active} onPress={() => onSelect(slot)} style={{ height: compact ? 96 : 106, width: 104, padding: 7, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: selected ? "#FFF0C5" : "#D8E9D5", borderColor: selected ? "#F2BD55" : "#7BAAA6", borderWidth: 3, borderRadius: 20 }}>
      <Animated.View ref={art} collapsable={false}><PieceArt piece={piece} numbers={numbers} cell={trayCell}/></Animated.View><Text style={{ color: "#345C67", fontSize: 11, fontWeight: "800" }}>{selected ? "READY" : slot + 1}</Text>
    </PressControl>
    <Animated.View pointerEvents="none" testID={`coral-lift-${slot}`} style={[{ position: "absolute", top: 0, left: 0 }, floating]}><PieceArt piece={piece} numbers={numbers} cell={cell}/></Animated.View>
  </Animated.View></GestureDetector>;
}
function ClearEffects({ state, cell, reduced }: { state: ReefState; cell: number; reduced: boolean }) {
  const age = useSharedValue(0);
  useEffect(() => { age.set(withTiming(1, { duration: 450, easing: Easing.linear })); }, [age]);
  const flash = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - age.value * 450 / 160) }));
  const fish = useAnimatedStyle(() => ({ opacity: 1 - age.value, transform: [{ translateY: reduced ? 0 : -age.value * cell * 1.5 }, { translateX: reduced ? 0 : age.value * cell }] }));
  const pop = useAnimatedStyle(() => ({ opacity: 1 - age.value, transform: [{ translateY: reduced ? 0 : -age.value * 20 }] }));
  const at = state.lastClear[0] ?? 0;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Animated.View style={[StyleSheet.absoluteFill, flash]}>{state.lastClear.map(i => <View key={i} style={{ position: "absolute", left: i % 8 * cell, top: Math.floor(i / 8) * cell, width: cell, height: cell, borderRadius: 9, backgroundColor: "#FFF1AE" }}/>)}</Animated.View>
    {state.lastFishCells.map(i => <Animated.View key={i} style={[{ position: "absolute", left: i % 8 * cell, top: Math.floor(i / 8) * cell }, fish]}><ReefFish size={cell}/></Animated.View>)}
    {!!state.lastClear.length && <Animated.View style={[{ position: "absolute", left: Math.min(6 * cell, at % 8 * cell), top: Math.max(0, (Math.floor(at / 8) - 1) * cell) }, pop]}><Text style={{ color: "#244D60", backgroundColor: "#FFF4D9", borderRadius: 8, paddingHorizontal: 6, fontWeight: "900", fontSize: 18 }}>+{state.lastPoints}</Text></Animated.View>}
  </View>;
}
export function ReefBoard({ initial, active, helper, onResult, onTone, width, height, onSave }: { width: number; height: number; initial: ReefState; onSave?: (state: ReefState) => void; active: boolean; helper: boolean; onResult: (result: ArcadeResult, helped?: boolean) => void; onTone: (tone: string) => void }) {
  const reduce = useCallback((before: ReefState, input: Parameters<typeof reefTransition>[1]) => {
    const next = reefTransition(before, input);
    if (next !== before && next.status === "playing") onSave?.(next);
    return next;
  }, [onSave]);
  const { snapshot: s, dispatch, state } = useArcadeReducer(migrateReef(initial) ?? initial, reduce, active);
  const firstState = useRef(initial);
  useEffect(() => { if (firstState.current.status === "playing") onSave?.(firstState.current); }, [onSave]);
  const selection = useRef<number | null>(0);
  const [selected, setSelected] = useState<number | null>(0), [hover, setHover] = useState<{ row: number; col: number } | null>(null), board = useAnimatedRef<Animated.View>(), reported = useRef(false);
  const [bumped, setBumped] = useState(false);
  const side = width > height, short = height < 500;
  const size = Math.floor(Math.max(8, Math.min(640, width - (side ? short ? 370 : 180 : 24), height - (side ? 130 : helper ? 300 : 245) - (initial.level === "endless" ? 48 : 0)))), cell = size / 8;
  const reduced = useReducedMotion(), shake = useSharedValue(0), shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  useEffect(() => { if (active && state.current.helper !== helper) dispatch({ type: "helper", value: helper }); }, [active, helper, dispatch, state]);
  // Keep the final fish release visible before handing the already-terminal engine result to the frame.
  useEffect(() => { const result = reefResult(s); if (!result || !active || reported.current) return; const timer = setTimeout(() => { if (!reported.current) { reported.current = true; onResult(result, helper || !!s.helped); } }, result.cleared ? 220 : 0); return () => clearTimeout(timer); }, [s, active, onResult, helper, reduced]);
  const select = useCallback((slot: number) => { selection.current = slot; setSelected(slot); setHover(null); }, []);
  const hoverAt = useCallback((spot: { row: number; col: number } | null) => setHover(old => old?.row === spot?.row && old?.col === spot?.col ? old : spot), []);
  const place = useCallback((slot: number, row: number, col: number) => {
    if (!active || state.current.status !== "playing") return;
    const before = state.current, next = dispatch({ type: "place", slot, row, col });
    if (next.moves !== before.moves) {
      onTone(next.lastClear.length ? "clear" : "coral"); setBumped(false); const nextSlot = next.pieces[slot] ? slot : next.pieces.findIndex(Boolean); selection.current = nextSlot < 0 ? null : nextSlot; setSelected(selection.current); setHover(null);
    } else { setBumped(true); onTone("bump"); if (!reduced) shake.set(withSequence(withTiming(-3, { duration: 45 }), withTiming(3, { duration: 65 }), withTiming(0, { duration: 70 }))); }
  }, [active, state, dispatch, onTone, reduced, shake]);
  const piece = selected === null ? null : s.pieces[selected], preview = piece && hover ? previewReefPlacement(s, piece, hover.row, hover.col) : null;
  const target = s.level !== "endless" ? s.level.targetSum : undefined, value = reefGoalValue(s), goal = s.level === "endless" ? "points" : s.level.goal, progress = s.level === "endless" ? `${s.score}` : `${value}/${s.level.target}`;
  const stars = s.level === "endless" ? 0 : s.moves <= s.level.greatMoves ? 3 : s.moves <= s.level.goodMoves ? 2 : 1;
  return <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 16 }}>
    <View style={{ width: "100%", maxWidth: 1000, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}><HudPill label={`${value} of ${s.level === "endless" ? "free play" : s.level.target} ${goal}`} icon={goal === "fish" ? <View style={{ width: 28, height: 28 }}><Hero size={28} active={false}/></View> : <Icon name={goal === "score" || goal === "points" ? "star-filled" : "flag"} color="#B67A35"/>}>{progress} {goal}</HudPill><HudPill><MiniStars stars={stars}/></HudPill><Copy style={{ color: "#FFF4D5", fontSize: 13, backgroundColor: "#24536A", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14 }}>{s.moves} moves</Copy></View>
    <View style={{ flexDirection: side ? "row" : "column", alignItems: "center", justifyContent: "center", gap: side ? 16 : 12, width: "100%" }}>
      <Animated.View style={shakeStyle}><Animated.View ref={board} collapsable={false} testID="reef-board" style={{ width: size, height: size, backgroundColor: "#DBDDB4", borderRadius: 22, borderWidth: 0, overflow: "hidden", flexDirection: "row", flexWrap: "wrap", boxShadow: "0 7px 0 #286777" }}>
        <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}><Svg width="100%" height="100%" viewBox="0 0 600 600" accessible={false}><Defs><LinearGradient id="reef-bed" x1="0" y1="0" x2=".8" y2="1"><Stop stopColor="#8FCABC"/><Stop offset=".6" stopColor="#C9D8A9"/><Stop offset="1" stopColor="#E9D8AA"/></LinearGradient></Defs><Rect width={600} height={600} fill="url(#reef-bed)"/><Path d="M0 0H105L400 600H275ZM260 0H320L600 510V600Z" fill="#FFFAD5" opacity={.19}/>{[0, 1, 2, 3].map(i => <Path key={i} d={`M-50 ${90 + i * 150}Q75 ${30 + i * 150} 185 ${100 + i * 150}T410 ${95 + i * 150}T650 ${100 + i * 150}`} fill="none" stroke="#FFF7CB" strokeWidth={4} opacity={.2}/>)}<Path d="M0 600Q30 540 12 510Q57 555 25 600M600 600Q559 549 580 511Q548 541 564 600" fill="#418D7D" opacity={.2}/></Svg></View>
        {s.board.map((value, i) => {
          const rock = s.level !== "endless" && s.level.rocks.includes(i), fish = s.fish.includes(i), highlighted = preview?.cells.includes(i), clears = preview?.clear.cells.includes(i), row = Math.floor(i / 8), col = i % 8;
          const invalid = !preview && hover && piece?.cells.some(([r, c]) => row === hover.row + r && col === hover.col + c);
          return <PressControl key={i} accessibilityRole="button" accessibilityLabel={`Reef row ${row + 1}, column ${col + 1}, ${rock ? "rock" : value ? target ? `number ${value}` : "coral" : "open"}${fish ? ", trapped fish" : ""}`} accessibilityState={{ disabled: !active || s.status !== "playing" }} disabled={!active || s.status !== "playing"} onPress={() => { if (selection.current !== null) place(selection.current, row, col); }} style={{ width: cell, height: cell, borderWidth: clears || highlighted || invalid ? 2 : .5, borderColor: invalid ? "#A4454F" : clears ? "#FFF5AB" : highlighted ? "#C88530" : "#428F8740", backgroundColor: invalid ? "#EDB7A6" : clears ? "#F2D77F" : highlighted ? "#FFF0BA" : (row + col) % 2 ? "#E7E4B11A" : "#4B9D9D0D", alignItems: "center", justifyContent: "center" }}>
            {rock ? <View style={{ width: cell * .72, height: cell * .65, borderRadius: cell * .22, backgroundColor: "#567C7F", borderWidth: 3, borderColor: "#B4C4B4" }}/> : value > 0 ? <><View style={{ opacity: highlighted ? .7 : 1 }}><Coral color={coralColors[highlighted && piece ? piece.color : s.appearance[i]]} variant={highlighted && piece ? piece.color : s.appearance[i]} fish={fish} size={cell}/></View>{target && <View style={{ position: "absolute", backgroundColor: "#FFF4D9", borderRadius: 8, paddingHorizontal: 5 }}><Text style={{ color: "#244D60", fontSize: cell * .45, fontWeight: "900" }}>{highlighted ? piece?.value : value}</Text></View>}</> : i % 7 === 0 ? <View style={{ width: 5, height: 3, borderRadius: 2, backgroundColor: "#7AA99B", opacity: .4 }}/> : null}
          </PressControl>;
        })}
      </Animated.View>{!!s.lastClear.length && <ClearEffects key={s.moves} state={s} cell={cell} reduced={reduced}/>}</Animated.View>
      <View style={{ alignItems: "center", gap: 12, maxWidth: side ? height < 500 ? 360 : 240 : undefined }}>
        {side && height >= 650 && <Hero game="reef-builder" size={100} cue={s.moves} mood={bumped ? "dizzy" : s.lastClear.length ? "happy" : "idle"} active={active}/>}
        <View style={{ flexDirection: side && height >= 500 ? "column" : "row", gap: 8, zIndex: 2 }}>{s.pieces.map((p, slot) => p ? <DraggablePiece key={slot} piece={p} slot={slot} numbers={!!target} compact={!side || height < 500} selected={selected === slot} active={active && s.status === "playing"} board={board} cell={cell} onSelect={select} onHover={hoverAt} onDrop={place}/> : <View key={slot} style={{ minWidth: 104, minHeight: side ? 100 : 92, borderRadius: 24, borderWidth: 2, borderStyle: "dashed", borderColor: "#C6E2CF", justifyContent: "center", alignItems: "center" }}><Icon name="flag" color="#C6E2CF"/></View>)}</View>
        {helper && <PlayButton quiet compact disabled={!active || selected === null || !piece || s.status !== "playing"} onPress={() => { const move = legalReefMoves(state.current)[0]; if (move) { select(move.slot); hoverAt({ row: move.row, col: move.col }); onTone("coral"); } }}>Show a fit</PlayButton>}
      </View>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 12 }}>
      {!side && height >= 600 && <Hero game="reef-builder" size={58} cue={`${s.moves}-${bumped}`} mood={bumped ? "dizzy" : s.lastClear.length ? "happy" : "idle"} active={active}/>}
      {height >= 600 && <Companion event={s.lastClear.length ? "correct" : "idle"} size={48} active={active}/>}
      <View accessibilityLiveRegion="polite" style={{ flexShrink: 1, maxWidth: 520 }}><Copy style={{ color: "#244C55", textAlign: "center", fontSize: 15, backgroundColor: "#FFF1D5", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 }}>{bumped ? s.message : s.status === "cleared" ? "Fish swimming free!" : preview?.clear.count ? `${preview.clear.count} line${preview.clear.count === 1 ? "" : "s"} will clear!` : target ? `${target} makes a line · find a partner` : s.moves === 0 ? "Plan room for all three pieces." : "Drag any coral · fill rows or columns"}</Copy></View>
    </View>
    {s.level === "endless" && <Button quiet compact disabled={!active} onPress={() => dispatch({ type: "finish" })}>Finish my free-play reef</Button>}
  </View>;
}
