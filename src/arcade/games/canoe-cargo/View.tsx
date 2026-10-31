import { Companion } from "../../../islander/Companion";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { Text } from "../../../components/Text";
import { useReducedMotion } from "../../../components/motion";
import { PressControl, uiThreadDrag } from "../../Input";
import { ArcadeSprite, type SpritePose } from "../../Sprite";
import { useArcadeLoop } from "../../loop";
import type { OutfitId } from "../../progress";
import type { ArcadeResult } from "../../types";
import { CargoCaptain, CargoCanoe, CargoScene, CargoTile, CargoOutline } from "./Art";
import { COLS, ROWS, cargoRowPreview, cargoGoalValue, cargoResult, cargoStep, cargoTransition, pieceCells, type CargoInput, type CargoPiece, type CargoState } from "./engine";
import { cargoPoses } from "./poses";
import { CargoTouch } from "./Touch";
const idle: CargoInput = { type: "idle" }, ink = "#FFF5D7";
const SettledCargo = memo(function SettledCargo({ board, cell, learning }: { board: CargoState["board"]; cell: number; learning: boolean }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>{board.map((tile, i) => tile && <View key={i} style={{ position: "absolute", left: i % COLS * cell, top: Math.floor(i / COLS) * cell }}><CargoTile kind={tile.kind} value={learning ? tile.value : 0} stuck={tile.stuck} size={cell}/></View>)}</View>;
});
const Bundle = memo(function Bundle({ piece, cell, learning }: { piece: CargoPiece; cell: number; learning: boolean }) {
  const cells = pieceCells(piece);
  return <View style={{ width: (Math.max(...cells.map(c => c[1])) + 1) * cell, height: (Math.max(...cells.map(c => c[0])) + 1) * cell }}>{cells.map(([r, c], i) => <View key={i} style={{ position: "absolute", top: r * cell, left: c * cell }}><CargoTile kind={piece.kind} size={cell} value={learning ? piece.value : 0}/></View>)}</View>;
});
const MovingCargo = memo(function MovingCargo({ poses, piece, value, cell }: { poses: SharedValue<SpritePose[]>; piece: CargoPiece; value: number; cell: number }) {
  return <><ArcadeSprite poses={poses} index={5} width={cell * 4} height={cell * 4}><CargoOutline piece={piece} cell={cell} ghost/></ArcadeSprite>{[0, 1, 2, 3].map(i => <ArcadeSprite key={i} poses={poses} index={i} width={cell} height={cell}><CargoTile kind={piece.kind} value={value} size={cell}/></ArcadeSprite>)}<ArcadeSprite poses={poses} index={4} width={cell * 4} height={cell * 4}><CargoOutline piece={piece} cell={cell}/></ArcadeSprite></>;
});
function LockEffects({ s, cell, reduced }: { s: CargoState; cell: number; reduced: boolean }) {
  const age = useSharedValue(0);
  useEffect(() => { age.set(0); age.set(withTiming(1, { duration: 450, easing: Easing.linear })); }, [s.event, age]);
  const flash = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - age.value * 450 / 160) }));
  const trail = useAnimatedStyle(() => ({ opacity: reduced ? 0 : Math.max(0, 1 - age.value * 450 / 140) * .42 }));
  const pop = useAnimatedStyle(() => ({ opacity: 1 - age.value, transform: [{ translateY: reduced ? 0 : -age.value * 25 }] }));
  const row = s.lastRows.length ? Math.min(...s.lastRows) : ROWS - 1;
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {s.lastDrop && <Animated.View style={[StyleSheet.absoluteFill, trail]}>{s.lastDrop.cells.map(i => <View key={i} style={{ position: "absolute", left: ((i % COLS + COLS) % COLS) * cell + cell * .2, top: Math.floor(i / COLS) * cell, width: cell * .6, height: (s.lastDrop!.distance + 1) * cell, borderRadius: cell / 3, backgroundColor: "#C7E5D3" }}/>)}</Animated.View>}
    <Animated.View style={[StyleSheet.absoluteFill, flash]}>{s.lastRows.map(r => <View key={r} style={{ position: "absolute", left: 0, top: r * cell, height: cell, width: COLS * cell, backgroundColor: "#FFF2B1", borderRadius: 8 }}/>)}</Animated.View>
    {!reduced && !!s.lastRows.length && <Animated.View style={[{ position: "absolute", left: COLS * cell / 2, top: row * cell }, pop]}>{[-2, -1, 1, 2].map((v, i) => <View key={v} style={{ position: "absolute", left: v * cell * .65, top: i % 2 * -cell * .4, width: 7, height: 7, borderRadius: i % 2 ? 4 : 1, backgroundColor: "#FFF2B1" }}/>)}</Animated.View>}
    {!!s.lastRows.length && <Animated.View style={[{ position: "absolute", right: 7, top: Math.max(cell, (row - 1) * cell) }, pop]}><Text style={{ color: "#FFF2B1", fontSize: 18, fontWeight: "900", textShadowColor: "#183B49", textShadowRadius: 2 }}>+{s.lastPoints}</Text></Animated.View>}
  </View>;
}
function Control({ label, text, onPress, disabled, testID, repeat = false }: { label: string; text: string; onPress: () => void; disabled: boolean; testID: string; repeat?: boolean }) {
  return <PressControl repeat={repeat} testID={testID} accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[ui.control, { opacity: disabled ? .55 : 1 }]}><Text style={ui.symbol}>{text}</Text></PressControl>;
}
function SoftDrop({ active, onChange, onTap }: { active: boolean; onChange: (held: boolean) => void; onTap: () => void }) {
  const point = useSharedValue({ x: 0, y: 0, down: false });
  const gesture = useMemo(() => uiThreadDrag(point).enabled(active), [point, active]);
  useAnimatedReaction(() => point.value.down, (down, before) => { if (down !== before) runOnJS(onChange)(down); }, [onChange]);
  const style = useAnimatedStyle(() => ({ opacity: point.value.down ? .72 : 1 }));
  return <GestureDetector gesture={gesture}><Animated.View collapsable={false} testID="cargo-soft" accessible accessibilityRole="button" accessibilityLabel="Soft drop, hold to fall twenty times faster" accessibilityState={{ disabled: !active }} onAccessibilityTap={onTap} style={[{ ...ui.control, ...(Platform.OS === "web" ? { touchAction: "none" as const } : {}) }, style]}><Text style={ui.symbol}>↓</Text></Animated.View></GestureDetector>;
}
export function CargoBoard({ initial, active, helper, outfit, onResult, onTone, debug = false, width, height }: { width: number; height: number; initial: CargoState; active: boolean; helper: boolean; outfit: OutfitId; onResult: (result: ArcadeResult, helped?: boolean) => void; onTone: (tone: string) => void; debug?: boolean }) {
  const reduced = useReducedMotion(), wide = width > height, compact = height < 500, learning = initial.level !== "endless" && !!initial.level.targetSum;
  // The parent measures below its header and safe areas. Reserve all controls before sizing the grid.
  const cell = Math.max(1, Math.min(43, (width - (wide ? 226 : 30)) / COLS, (height - (wide ? compact ? 142 : 110 : 262) - (learning ? 80 : 0) - (initial.level === "endless" ? 48 : 0) - (debug ? 14 : 0)) / ROWS));
  const boardW = cell * COLS, boardH = cell * ROWS;
  const poses = useSharedValue<SpritePose[]>([]), reported = useRef(false), helped = useRef(helper);
  const build = useCallback((s: CargoState) => {
    return cargoPoses(s, cell);
  }, [cell]);
  const pose = useMemo(() => ({ build, target: poses, snapDistance: cell * 2 }), [build, poses, cell]);
  const { snapshot: s, dispatch, state: stateRef, budget } = useArcadeLoop({ initial, step: cargoStep, reduce: cargoTransition, input: idle, active, pose });
  const heard = useRef(0), bumped = useRef(0);
  useEffect(() => { if (active) { dispatch({ type: "helper", value: helper }); dispatch({ type: "soft", value: false }); if (helper) helped.current = true; } }, [active, helper, dispatch]);
  useEffect(() => {
    const result = cargoResult(s); if (!result || !active || reported.current) return;
    const timer = setTimeout(() => { reported.current = true; onResult(result, helped.current || !!s.helped); }, result.cleared ? 200 : 0);
    return () => clearTimeout(timer);
  }, [s, active, onResult]);
  useEffect(() => {
    if (s.event !== heard.current) { heard.current = s.event; onTone(s.lastRows.length ? "clear" : "coral"); }
    if (s.bump !== bumped.current) { bumped.current = s.bump; onTone("bump"); }
  }, [s.event, s.lastRows.length, s.bump, onTone]);
  const act = useCallback((input: CargoInput) => {
    if (!active) return;
    const before = stateRef.current, after = dispatch(input);
    if (after !== before && after.bump === before.bump && after.loads === before.loads && !["helper", "soft", "idle"].includes(input.type)) onTone(input.type === "rotate" ? "shell-2" : "coral");
  }, [active, stateRef, dispatch, onTone]);
  const soft = useCallback((value: boolean) => act({ type: "soft", value }), [act]);
  useEffect(() => {
    if (Platform.OS !== "web" || !active) return;
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches?.("input,textarea,select")) return;
      const keys: Record<string, CargoInput["type"]> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "rotate", " ": "drop", h: "hold", H: "hold" };
      if (e.key === "ArrowDown") { e.preventDefault(); soft(e.type === "keydown"); }
      else if (keys[e.key] && e.type === "keydown" && (!e.repeat || e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); act({ type: keys[e.key] } as CargoInput); }
    };
    const blur = () => soft(false);
    window.addEventListener("keydown", key); window.addEventListener("keyup", key); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", key); window.removeEventListener("keyup", key); window.removeEventListener("blur", blur); };
  }, [act, active, soft]);
  const grab = useRef({ col: 0, loads: 0 });
  const onGrab = useCallback(() => { const now = stateRef.current; grab.current = { col: now.col, loads: now.loads }; }, [stateRef]);
  const onColumns = useCallback((columns: number) => {
    const origin = grab.current;
    if (stateRef.current.loads !== origin.loads) return;
    const target = Math.max(0, Math.min(COLS - 1, origin.col + columns));
    for (let n = 0; n < COLS && stateRef.current.col !== target; n++) {
      const before = stateRef.current.col; act({ type: before < target ? "right" : "left" });
      if (stateRef.current.col === before) break;
    }
  }, [stateRef, act]);
  const touchSoft = useCallback((value: boolean) => { if (!value || stateRef.current.loads === grab.current.loads) soft(value); }, [stateRef, soft]);
  const touchDrop = useCallback(() => { if (stateRef.current.loads === grab.current.loads) act({ type: "drop" }); }, [stateRef, act]);
  // The tap recognizer records the piece at touch-down (still taps never start the pan), so a
  // piece that locks mid-tap is not rotated, and every new piece still rotates on its first tap.
  const landed = useRef(0);
  const onTouchDown = useCallback(() => { landed.current = stateRef.current.loads; }, [stateRef]);
  const touchTap = useCallback(() => { if (stateRef.current.loads === landed.current) act({ type: "rotate" }); }, [stateRef, act]);
  const goal = s.level === "endless" ? `${s.score}` : `${cargoGoalValue(s)}/${s.level.target}`;
  const controls = <View style={{ flexDirection: "row", justifyContent: "center", flexWrap: wide ? "wrap" : "nowrap", gap: 6, maxWidth: wide ? 180 : undefined }}>
    <Control testID="cargo-left" label="Move cargo left" text="←" repeat onPress={() => act({ type: "left" })} disabled={!active}/>
    <Control testID="cargo-rotate" label="Rotate cargo" text="↻" onPress={() => act({ type: "rotate" })} disabled={!active}/>
    <Control testID="cargo-right" label="Move cargo right" text="→" repeat onPress={() => act({ type: "right" })} disabled={!active}/>
    <SoftDrop active={active && s.status === "playing"} onChange={soft} onTap={() => act({ type: "down" })}/>
    <Control testID="cargo-drop" label="Hard drop cargo" text="⇓" onPress={() => act({ type: "drop" })} disabled={!active}/>
  </View>;
  const preview = <View style={{ flexDirection: wide && !compact ? "column" : "row", alignItems: "center", justifyContent: "center", gap: compact ? 8 : 12 }}>
    <PressControl testID="cargo-hold" disabled={!active || s.holdUsed} accessibilityLabel={`Hold cargo${s.holdUsed ? ", used until this piece lands" : ", swap once per piece"}`} onPress={() => act({ type: "hold" })} style={[ui.pill, { minWidth: compact ? 76 : 84, minHeight: compact ? 60 : 70, paddingVertical: compact ? 4 : 7, alignItems: "center", justifyContent: "center", gap: 4, opacity: s.holdUsed ? .55 : 1 }]}><Text style={ui.label}>HOLD{s.holdUsed ? " ✓" : ""}</Text>{s.held ? <Bundle piece={s.held} cell={14} learning={learning}/> : <Text style={{ color: ink, fontSize: 12 }}>Tap to store</Text>}</PressControl>
    <View style={{ alignItems: "center", gap: 7 }}><Text style={ui.label}>NEXT</Text><View style={{ flexDirection: "row", gap: 10 }}>{s.next.map((p, i) => <Bundle key={i} piece={p} cell={compact ? 12 : 18} learning={learning}/>)}</View></View>
  </View>;
  return <View testID="cargo-scene" style={{ flex: 1, width: "100%", justifyContent: "center", backgroundColor: "#2B6677", borderRadius: 24, overflow: "hidden", padding: 9, gap: 8 }}>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}><CargoScene world={s.level === "endless" ? "w3" : s.level.world}/></View>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 5 }}>
      {(!wide || compact) && <View testID="cargo-crew" pointerEvents="none" style={{ flexDirection: "row", alignItems: "flex-end", borderBottomWidth: 4, borderBottomColor: "#C58D55" }}><Companion event={s.lastRows.length ? "correct" : "idle"} size={compact ? 48 : 64} active={active}/><CargoCaptain size={compact ? 32 : 40} outfit={outfit} happy={!!s.lastRows.length}/></View>}<View style={ui.pill}><Text accessibilityLabel={`Goal progress ${goal}`} style={ui.stat}>{goal} {s.level === "endless" || s.level.goal === "score" ? "points" : s.level.goal === "crates" ? "crates" : "canoes"}</Text></View>{learning && <View style={ui.pill}><Text style={ui.stat}>Σ {s.level !== "endless" && s.level.targetSum}</Text></View>}<View style={ui.pill}><Text style={ui.stat}>★ {s.score}</Text></View></View>
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: wide ? 14 : 0 }}>
      <View style={{ alignItems: "center", gap: 7 }}>{!wide && preview}<View testID="cargo-board" style={{ width: boardW + 10, height: boardH + 10, borderWidth: 5, borderColor: "#A8794B", borderRadius: 8, backgroundColor: "#193E4C", overflow: "hidden" }}><CargoTouch active={active && s.status === "playing"} cell={cell} width={boardW} height={boardH} onGrab={onGrab} onTouchDown={onTouchDown} onColumns={onColumns} onSoft={touchSoft} onDrop={touchDrop} onTap={touchTap}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>{Array.from({ length: COLS * ROWS }, (_, i) => <View key={i} style={{ position: "absolute", left: i % COLS * cell, top: Math.floor(i / COLS) * cell, width: cell, height: cell, borderRightWidth: .5, borderBottomWidth: .5, borderColor: "#31546080" }}/>)}</View>
        <SettledCargo board={s.board} cell={cell} learning={learning}/><MovingCargo poses={poses} piece={s.piece} value={learning ? s.piece.value : 0} cell={cell}/>
        {!!s.event && <LockEffects key={s.event} s={s} cell={cell} reduced={reduced}/>}
      </CargoTouch></View></View>
      {wide && <View style={{ width: 200, alignItems: "center", gap: compact ? 8 : 20 }}>{!compact && <View testID="cargo-crew" pointerEvents="none" style={{ flexDirection: "row", alignItems: "flex-end", borderBottomWidth: 5, borderBottomColor: "#C58D55" }}><Companion event={s.lastRows.length ? "correct" : "idle"} size={100} active={active}/><CargoCaptain size={64} outfit={outfit} happy={!!s.lastRows.length}/></View>}{preview}{controls}</View>}
    </View>
    {learning && <View accessibilityLiveRegion="polite" style={{ gap: 2 }}>{cargoRowPreview(s).map(p => <Text key={p.row} style={{ color: ink, textAlign: "center", fontSize: 13 }}>Row {p.row + 1}: {p.values.join(" + ")} = {p.sum}{p.missing ? ` · ${p.missing} spaces left` : ` · ${p.canoes} canoes`}</Text>)}</View>}
    {!wide && controls}
    <Text style={{ color: ink, textAlign: "center", fontSize: 12 }}>{learning ? "Full row = 1 canoe. Exact target sum = 1 bonus canoe (2 total)." : "Tap to turn · drag to slide · pull & hold ↓ · flick to land"}</Text>
    {s.level === "endless" && <Pressable accessibilityRole="button" onPress={() => act({ type: "finish" })} style={{ minHeight: 44, justifyContent: "center", alignItems: "center" }}><CargoCanoe size={24}/><Text style={ui.label}>Dock my canoe · finish</Text></Pressable>}
    {debug && <Text testID="cargo-budget" style={{ color: ink, fontSize: 10, textAlign: "center" }}>{budget.fps.toFixed(1)} fps · p95 {budget.p95.toFixed(1)} ms · max {budget.max.toFixed(1)} ms · clamp {budget.dropped.toFixed(3)} s · {budget.ticks} ticks</Text>}
  </View>;
}
const ui = StyleSheet.create({ control: { minWidth: 48, minHeight: 48, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F5D894", borderRadius: 16, borderWidth: 2, borderBottomWidth: 4, borderColor: "#755535" }, symbol: { color: "#293F49", fontWeight: "900", fontSize: 24 }, pill: { backgroundColor: "#173E50", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "#7FB0B4" }, stat: { fontSize: 16, fontWeight: "900", color: ink }, label: { color: ink, fontSize: 12, fontWeight: "800" } });
