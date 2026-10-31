import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { GestureDetector } from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import { Text } from "../../components/Text";
import { Button, Heading } from "../../components/ui";
import { useReducedMotion } from "../../components/motion";
import { beachWallContact } from "../feelArt";
import type { ArtPose } from "../ArtPose";
import { ArcadeSprite, type SpritePose } from "../Sprite";
import { uiThreadDrag, multiTouchDrag, type DragPoint, type TouchPoints } from "../Input";
import { palmPoses, beachPoses } from "./poses";
import { HIDDEN_POSE } from "../poses";
import { palmHud, beachHud } from "../publication";
import { useArcadeUiLoop } from "../uiLoop";
import { HeartsHud, HitReaction } from "../LivesHud";
import type { ArcadeResult } from "../types";
import type { OutfitId } from "../progress";
import { ActionHero, BallArt, BeetleArt, HuskArt, NetArt, Scene, TurtleArt } from "./Art";
import { palmWorkedHint, palmResult, type PalmState } from "../games/palm-patrol/engine";
import { beachResult, type BeachState } from "../games/beach-ball/engine";
import { arenaTransform, arenaTouch, type Arena, BALL_RADIUS } from "./arena";
import {
  aimPoint,
  mapSeatPointers,
  palmFrameStep,
  beachFrameStep,
  type SeatPointers,
  type PalmFrame,
  type BeachFrame,
} from "./controls";
const gestureStyle: ViewStyle = Platform.OS === "web" ? ({ touchAction: "none", userSelect: "none" } as ViewStyle) : {};
function useArena(width: number, height: number) {
  const [size, setSize] = useState({ width, height });
  const arena = useSharedValue(arenaTransform(width, height));
  const camera = useMemo(() => arenaTransform(size.width, size.height), [size.width, size.height]);
  return {
    size,
    camera,
    arena,
    layout: (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.layout;
      arena.set(arenaTransform(width, height));
      setSize({ width, height });
    },
  };
}
function Pill({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: "#123F51EE",
        borderWidth: 1,
        borderColor: "#CFF4DE66",
      }}
    >
      <Heading style={{ color: "#FFF3C7", fontSize: 16 }}>{children}</Heading>
    </View>
  );
}
const ArenaScene = memo(function ArenaScene({
  palm,
  world,
  camera,
}: {
  palm: boolean;
  world: "w1" | "w2" | "w3" | "w4" | "w5" | "w6" | "learn";
  camera: Arena;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: camera.x,
        top: camera.y,
        width: camera.width,
        height: camera.height,
        overflow: "hidden",
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: "#FFFFFF44",
      }}
    >
      <Scene palm={palm} world={world} width={camera.width} height={camera.height} />
    </View>
  );
});
/** Stable layer: the HUD never rebuilds the beetles, nets, husks or impact art. */
const PalmSprites = memo(function PalmSprites({ poses, scale }: { poses: SharedValue<SpritePose[]>; scale: number }) {
  return (
    <>
      {Array.from({ length: 15 }, (_, i) => (
        <React.Fragment key={i}>
          <ArcadeSprite poses={poses} index={i} width={58 * scale} height={58 * scale}>
            <View testID={`palm-beetle-${i}`}>
              <BeetleArt size={58 * scale} poses={poses} poseIndex={i} />
            </View>
          </ArcadeSprite>
          {i === 0 && (
            <ArcadeSprite poses={poses} index={15} width={87 * scale} height={87 * scale}>
              <View testID="palm-boss-0">
                <BeetleArt size={87 * scale} boss poses={poses} poseIndex={15} />
              </View>
            </ArcadeSprite>
          )}
          <ArcadeSprite poses={poses} index={30 + i} width={58 * scale} height={58 * scale}>
            <NetArt size={58 * scale} />
          </ArcadeSprite>
          <ArcadeSprite poses={poses} index={73 + i} width={14 * scale} height={7 * scale}>
            <View
              style={{
                width: 14 * scale,
                height: 7 * scale,
                backgroundColor: "#FFE174",
                borderRadius: 4 * scale,
                borderWidth: scale,
                borderColor: "#69402D",
              }}
            />
          </ArcadeSprite>
        </React.Fragment>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <ArcadeSprite key={`h${i}`} poses={poses} index={45 + i} width={20 * scale} height={20 * scale}>
          <HuskArt size={20 * scale} />
        </ArcadeSprite>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <ArcadeSprite key={`p${i}`} poses={poses} index={58 + i} width={6 * scale} height={6 * scale}>
          <View
            style={{
              width: 6 * scale,
              height: 6 * scale,
              borderRadius: 3 * scale,
              backgroundColor: i % 2 ? "#FFE58C" : "#B6F7DF",
            }}
          />
        </ArcadeSprite>
      ))}
    </>
  );
});
const PalmHero = memo(function PalmHero({
  poses,
  scale,
  outfit,
  hit,
  onTone,
}: {
  poses: SharedValue<SpritePose[]>;
  scale: number;
  outfit: OutfitId;
  hit: number;
  onTone: (key: string, haptic?: boolean) => void;
}) {
  return (
    <HitReaction hit={hit} onTone={onTone}>
      <ArcadeSprite poses={poses} index={57} width={78 * scale} height={78 * scale}>
        <View testID="palm-launcher">
          <ActionHero palm size={78 * scale} outfit={outfit} poses={poses} />
        </View>
      </ArcadeSprite>
    </HitReaction>
  );
});
export function PalmBoard({
  initial,
  width = 360,
  height = 600,
  active,
  helper,
  outfit,
  onResult,
  onTone,
  debug,
}: {
  initial: PalmState;
  width?: number;
  height?: number;
  active: boolean;
  helper: boolean;
  outfit: OutfitId;
  onResult: (r: ArcadeResult, assisted: boolean) => void;
  onTone: (key: string, haptic?: boolean) => void;
  debug: boolean;
}) {
  const { size, camera, arena, layout } = useArena(width, height),
    reduced = useReducedMotion(),
    point = useSharedValue<DragPoint>({ x: 180, y: 552, down: false }),
    flags = useSharedValue({ helper, taps: 0, finish: false, help: false }),
    keyboard = useSharedValue({ x: 180, firing: false, used: false }),
    poses = useSharedValue<ArtPose[]>(Array(88).fill(HIDDEN_POSE)),
    entrance = useSharedValue({ group: "", started: 0 }),
    reported = useRef(false);
  const gesture = useMemo(
    () =>
      uiThreadDrag(point)
        .enabled(active)
        .onTouchesDown(() => {
          "worklet";
          flags.set({ ...flags.value, taps: flags.value.taps + 1 });
        }),
    [point, active, flags]
  );
  const input = useDerivedValue<PalmFrame>(() => ({
    x: point.value.down
      ? aimPoint(point.value, arena.value)
      : keyboard.value.used
        ? keyboard.value.x
        : flags.value.taps
          ? aimPoint(point.value, arena.value)
          : 180,
    down: point.value.down || keyboard.value.firing,
    taps: flags.value.taps,
    helper: flags.value.helper,
    finish: flags.value.finish,
    help: flags.value.help,
  }));
  const build = useCallback(
    (s: PalmState) => {
      "worklet";
      const group = `${s.wave}-${s.relay}-${s.fact}`;
      if (entrance.value.group !== group) entrance.set({ group, started: s.time });
      const entry = Math.max(0, 1 - (s.time - entrance.value.started) / 0.2);
      return palmPoses(s, arena.value, reduced, entry);
    },
    [arena, reduced, entrance]
  );
  const pose = useMemo(() => ({ build, target: poses }), [build, poses]);
  const { snapshot: s, outcome, state, clock } = useArcadeUiLoop({ initial, input, active, step: palmFrameStep, result: palmResult, select: palmHud, pose });
  const sounds = useRef({ event: 0, shots: 0 });
  useEffect(() => {
    flags.set({ ...flags.value, helper });
    if (!active) {
      point.set({ ...point.value, down: false });
      keyboard.set({ ...keyboard.value, firing: false });
    }
  }, [active, helper, flags, point, keyboard]);
  useEffect(() => {
    const r = outcome;
    if (r && active && !reported.current) {
      reported.current = true;
      onResult(r, s.helped);
    }
  }, [s, outcome, active, onResult]);
  useEffect(() => {
    const shots = s.shots - sounds.current.shots;
    if (shots > 0) onTone("coral", false);
    if (s.event - sounds.current.event > shots && s.cue !== "hit")
      onTone(s.cue === "net" ? "clear" : s.cue === "shield" ? "shell-1" : "shell-2", true);
    sounds.current = { shots: s.shots, event: s.event };
  }, [s.event, s.shots, s.cue, onTone]);
  useEffect(() => {
    if (!active || Platform.OS !== "web") return;
    const down = (e: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", " "].includes(e.key)) return;
      e.preventDefault();
      const k = keyboard.value;
      keyboard.set({
        x: e.key === " " ? k.x : Math.max(24, Math.min(336, state.value.launcher + (e.key === "ArrowLeft" ? -18 : 18))),
        firing: e.key === " " || k.firing,
        used: true,
      });
      if (e.key === " " && !e.repeat) flags.set({ ...flags.value, taps: flags.value.taps + 1 });
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === " ") keyboard.set({ ...keyboard.value, firing: false });
    };
    const blur = () => keyboard.set({ ...keyboard.value, firing: false });
    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [active, keyboard, flags, state]);
  const learning = s.world === "learn",
    scale = camera.scale;
  return (
    <View style={{ flex: 1 }}>
    <GestureDetector gesture={gesture} touchAction="none">
      <Animated.View
        collapsable={false}
        testID="palm-playfield"
        accessibilityLabel={learning ? "Palm Patrol playfield. Slide to aim. Press once for each math fact." : "Palm Patrol playfield. Slide to aim. Hold to toss."}
        onLayout={layout}
        style={[{ flex: 1, overflow: "hidden", minHeight: 210, backgroundColor: "#143E3D" }, gestureStyle]}
      >
        <ArenaScene palm world={s.world} camera={camera} />
        <PalmSprites poses={poses} scale={scale} />
        {[72, 180, 288].map((x, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: camera.x + (x - 38) * scale,
              top: camera.y + 475 * scale,
              width: 76 * scale,
              height: 20 * scale,
            }}
          >
            <Svg width={76 * scale} height={20 * scale} viewBox="0 0 76 20" accessible={false}>
              <Path d="M2 19Q38 10 74 19" fill="none" stroke="#4B5036" strokeWidth={3} opacity={.25}/>
              {s.shields[i] ? <>
                <Path d="M1 17Q5 1 38 1Q71 1 75 17Z" fill={s.shields[i] === 1 ? "#A7BE63" : "#68BC70"} stroke="#285D43" strokeWidth={2}/>
                <Path d="M5 15Q38 5 71 15" fill="none" stroke="#CBE89A" strokeWidth={2}/>
                <Path d="M38 16V3M22 16L29 7M54 16L47 7M10 15L17 9M66 15L59 9" fill="none" stroke="#347A4D" strokeWidth={1.5}/>
                {s.shields[i] < 3 && <Path d="M23 3L29 10L25 17" fill="none" stroke="#285D43" strokeWidth={2}/>}
                {s.shields[i] < 2 && <Path d="M53 3L47 10L51 17" fill="none" stroke="#285D43" strokeWidth={2}/>}
              </> : <Path d="M6 17Q38 11 70 17" fill="none" stroke="#936D43" strokeWidth={2} strokeDasharray="4 5"/>}
            </Svg>
          </View>
        ))}
        <PalmHero poses={poses} scale={scale} outfit={outfit} hit={s.lives.hit} onTone={onTone} />
        {learning &&
          s.answers.map((b) => (
            <ArcadeSprite poses={poses} index={b.id} width={58 * scale} height={58 * scale} key={b.id}><View
              key={b.id}
              testID={`palm-answer-${b.id}`}
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 4 * scale,
                top: 48 * scale,
                width: 50 * scale,
                alignItems: "center",
                backgroundColor: "#173F38",
                borderRadius: 12,
              }}
            >
              <Heading style={{ color: "#FFF4CD", fontSize: 22 * scale }}>{b.value}</Heading>
            </View></ArcadeSprite>
          ))}
        <ArcadeSprite poses={poses} index={66} width={110 * scale} height={24 * scale}>
          <Text
            style={{
              color: "#FFF9D0",
              fontSize: 18 * scale,
              textAlign: "center",
              textShadowColor: "#26394C",
              textShadowRadius: 3,
            }}
          >
            {s.feedback}
          </Text>
        </ArcadeSprite>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 7,
            left: 8,
            right: 8,
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 3,
            alignItems: "center",
          }}
        >
          <View accessible accessibilityLabel={`Wave ${s.wave} of ${s.level === "endless" ? "endless" : s.level.waves}, group ${s.relay} of ${s.relays}, ${s.caught} beetles netted`} style={{ padding: 7, gap: 4, backgroundColor: "#123F51EE", borderRadius: 14 }}>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}><Text style={{ color: "#FFF3C7", fontWeight: "800", fontSize: 13 }}>Wave {s.wave}/{s.level === "endless" ? "∞" : s.level.waves}</Text>{Array.from({ length: s.waves }, (_, i) => <View key={i} style={{ width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: "#FFF0BE", backgroundColor: i + 1 <= s.wave ? "#B6EFCC" : "transparent" }}/>)}</View>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
              <Text style={{ color: "#D3EEE0", fontSize: 11 }}>Group</Text>
              {Array.from({ length: s.relays }, (_, i) => <View key={i} style={{ width: 9, height: 9, borderRadius: i + 1 < s.relay ? 2 : 5, borderWidth: 1.5, borderColor: "#FFF0BE", backgroundColor: i + 1 <= s.relay ? "#FFCE74" : "transparent" }}/>) }
            </View>
          </View>
          {!learning && (
            <View style={camera.x >= 150 ? { position: "absolute", left: 0, top: 44 } : undefined}>
              <HeartsHud lives={s.lives} />
            </View>
          )}
          <Pill label={`${s.score} points`}>★ {s.score}</Pill>
        </View>
        {learning && (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 54,
              alignSelf: "center",
              backgroundColor: "#FFF5D8",
              borderRadius: 18,
              paddingHorizontal: 18,
              paddingVertical: 4,
            }}
          >
            <Text accessibilityLabel={`Math fact ${s.prompt}`} style={{ fontSize: 26, color: "#294D43" }}>
              {s.prompt}
            </Text>
          </View>
        )}
        {s.tip && (camera.x >= 150 || camera.y >= 30) && (
          <View
            testID="palm-aim-tip"
            pointerEvents="none"
            style={{ position: "absolute", bottom: 12, ...(camera.x >= 150 ? { left: 8 } : { alignSelf: "center" }) }}
          >
            <Pill>{learning ? "Slide · press for each fact ↑" : "← Slide · hold to toss ↑"}</Pill>
          </View>
        )}
        {s.level === "endless" && (
          <View style={{ position: "absolute", bottom: 12, left: 10 }}>
            <Button quiet compact disabled={!active} onPress={() => flags.set({ ...flags.value, finish: true })}>
              Finish
            </Button>
          </View>
        )}
        {debug && (
          <Text style={{ position: "absolute", bottom: 2, left: 4, color: "white", fontSize: 10 }}>
            {size.width}×{size.height} · UI loop · {clock.value.ticks} ticks
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
        {learning && <View style={{ position: "absolute", top: camera.y + 260 * scale, left: 14, right: 14, alignItems: "center", gap: 6 }}>
          <Button quiet compact disabled={!active} onPress={() => flags.set({ ...flags.value, help: true })}>Help · count it together</Button>
          {s.helped && <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ backgroundColor: "#FFF5D8", padding: 10, borderRadius: 18, maxWidth: 430, gap: 5 }}>
            <Text style={{ color: "#294D43", fontSize: 16, textAlign: "center" }}>{palmWorkedHint(s).text}</Text>
            {palmWorkedHint(s).groups.map((g,i) => <View key={i} accessible accessibilityLabel={`${g.filter(Boolean).length} objects${g.some(v => !v) ? `, ${g.filter(v => !v).length} crossed out` : ""}`} style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "center" }}>{g.map((v,j) => <Text key={j} style={{ color: v ? i ? "#99452F" : "#246858" : "#89796E", fontSize: 22 }}>{v ? "●" : "×"}</Text>)}</View>)}
          </View>}
        </View>}
    </View>
  );
}
const BallStretch = memo(function BallStretch({
  poses,
  index,
  scale,
}: {
  poses: SharedValue<SpritePose[]>;
  index: number;
  scale: number;
}) {
  const style = useAnimatedStyle(() => {
    const squash = poses.value[index]?.scale ?? 1;
    return { transform: [{ scaleX: 1 / squash }, { scaleY: squash }] };
  });
  return (
    <Animated.View testID={`beach-ball-${index}`} style={style}>
      <BallArt size={((BALL_RADIUS * 2) / 0.95) * scale} />
    </Animated.View>
  );
});
const BeachSprites = memo(function BeachSprites({
  poses,
  scale,
  helper,
  together,
}: {
  poses: SharedValue<SpritePose[]>;
  scale: number;
  helper: boolean;
  together: boolean;
}) {
  return (
    <>
      {[0, 1].map((i) => (
        <ArcadeSprite
          key={`b${i}`}
          poses={poses}
          index={i}
          width={((BALL_RADIUS * 2) / 0.95) * scale}
          height={((BALL_RADIUS * 2) / 0.95) * scale}
        >
          <BallStretch poses={poses} index={i} scale={scale} />
        </ArcadeSprite>
      ))}
      {[0, 1].map((i) => {
        const width = (helper && (i === 0 || together) ? 116 : 86) * scale;
        return (
          <ArcadeSprite key={`p${i}`} poses={poses} index={2 + i} width={width} height={20 * scale}>
            <View
              testID={`beach-paddle-${i}`}
              style={{
                width,
                height: 20 * scale,
                borderRadius: 10 * scale,
                borderWidth: 2 * scale,
                borderColor: i ? "#773B45" : "#1B6372",
                borderTopColor: "#FFF6D8",
                backgroundColor: i ? "#EC8177" : "#3AC9C0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 15 * scale, color: "#163F4B", lineHeight: 16 * scale }}>{i ? "◆" : "●"}</Text>
            </View>
          </ArcadeSprite>
        );
      })}
      <ArcadeSprite poses={poses} index={12} width={86 * scale} height={86 * scale}>
        <TurtleArt size={86 * scale} />
      </ArcadeSprite>
      {Array.from({ length: 48 }, (_, i) => (
        <ArcadeSprite key={`s${i}`} poses={poses} index={14 + i} width={5 * scale} height={5 * scale}>
          <View style={{ width: 5 * scale, height: 5 * scale, borderRadius: 2 * scale, backgroundColor: "#FFE275" }} />
        </ArcadeSprite>
      ))}
    </>
  );
});
export function BeachBoard({
  initial,
  width = 360,
  height = 600,
  active,
  helper,
  onResult,
  onTone,
  debug,
  names,
}: {
  initial: BeachState;
  width?: number;
  height?: number;
  active: boolean;
  helper: boolean;
  onResult: (r: ArcadeResult, winner?: 0 | 1 | null) => void;
  onTone: (key: string, haptic?: boolean) => void;
  debug: boolean;
  names: [string, string];
}) {
  const { camera, arena, layout } = useArena(width, height),
    reduced = useReducedMotion(),
    poses = useSharedValue<SpritePose[]>(Array(72).fill(HIDDEN_POSE)),
    walls = useSharedValue<{ time: number; balls: BeachState["balls"]; serial: number; sparks: { x: number; y: number; at: number }[] }>({ time: initial.time, balls: initial.balls, serial: 0, sparks: [] }),
    points = useSharedValue<TouchPoints>({}),
    mapping = useSharedValue<SeatPointers>({ owners: [null, null], seats: {} }),
    input = useSharedValue<BeachFrame>({ x: [null, null], helper, finish: false }),
    reported = useRef(false);
  const gesture = useMemo(() => multiTouchDrag(points).enabled(active), [points, active]);
  // Audio is an observer of the UI-owned wall serial; builders capture only worklet-safe values.
  useAnimatedReaction(() => walls.value.serial, (serial, before) => {
    if (before !== null && serial > before) runOnJS(onTone)("wall", false);
  }, [walls, onTone]);
  useAnimatedReaction(
    () => points.value,
    (next) => {
      mapping.value = mapSeatPointers(mapping.value, next, arena.value);
      const x: BeachFrame["x"] = [...input.value.x];
      for (let seat = 0; seat < 2; seat++) {
        const id = mapping.value.owners[seat];
        if (id !== null && next[id]) x[seat] = arenaTouch(arena.value, next[id].x, next[id].y).x;
      }
      input.value = { ...input.value, x };
    }
  );
  const build = useCallback(
    (s: BeachState) => {
      "worklet";
      const previous = walls.value, dt = s.time - previous.time;
      const sparks = previous.sparks.filter(e => s.time - e.at < 0.1);
      let serial = previous.serial;
      if (dt > 0) {
        for (let i = 0; i < s.balls.length; i++) {
          const contact = previous.balls[i] && beachWallContact(previous.balls[i], s.balls[i], dt);
          if (contact) { sparks.push({ ...contact, at: s.time }); serial++; }
        }
        walls.set({ time: s.time, balls: s.balls, serial, sparks: sparks.slice(-2) });
      }
      return beachPoses(s, arena.value, reduced, sparks.slice(-2));
    },
    [arena, reduced, walls]
  );
  const pose = useMemo(() => ({ build, target: poses }), [build, poses]);
  const { snapshot: s, outcome, state, clock } = useArcadeUiLoop({ initial, input, active, step: beachFrameStep, result: beachResult, select: beachHud, pose });
  useEffect(() => {
    input.set({ ...input.value, helper });
    if (!active) {
      points.set({});
      mapping.set({ owners: [null, null], seats: {} });
    }
  }, [active, helper, input, points, mapping]);
  useEffect(() => {
    const r = outcome;
    if (r && active && !reported.current) {
      reported.current = true;
      onResult(r, s.winner);
    }
  }, [s, outcome, active, onResult]);
  useEffect(() => {
    if (s.event) onTone(s.cue === "point" ? "clear" : "shell-0", s.cue === "point");
  }, [s.event, s.cue, onTone]);
  useEffect(() => {
    if (!active || Platform.OS !== "web") return;
    const down = (e: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(e.key)) return;
      e.preventDefault();
      const seat = ["a", "d", "A", "D"].includes(e.key) ? 1 : 0,
        x: BeachFrame["x"] = [...input.value.x];
      x[seat] = state.value.paddles[seat] + (["ArrowLeft", "a", "A"].includes(e.key) ? -18 : 18);
      input.set({ ...input.value, x });
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [active, input, state]);
  const config = s.config,
    scale = camera.scale;
  return (
    <GestureDetector gesture={gesture} touchAction="none">
      <Animated.View
        collapsable={false}
        testID="beach-playfield"
        accessibilityLabel="Beach Ball court. Drag your paddle. Two players use opposite ends."
        onLayout={layout}
        style={[{ flex: 1, overflow: "hidden", minHeight: 210, backgroundColor: "#173E50" }, gestureStyle]}
      >
        <ArenaScene palm={false} world={config.world} camera={camera} />
        {(config.turtle || config.balls === 2
          ? [
              { x: 132, y: config.turtle ? 250 : 300 },
              { x: 228, y: config.turtle ? 350 : 300 },
            ]
          : [{ x: 180, y: 300 }]
        ).map((p, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: "absolute",
              left: camera.x + (p.x - 8) * scale,
              top: camera.y + (p.y - 8) * scale,
              width: 16 * scale,
              height: 16 * scale,
              borderRadius: 8 * scale,
              borderWidth: 2 * scale,
              borderColor: "#FFFAE199",
            }}
          />
        ))}
        {[68, 69, 70, 71].map(i => <ArcadeSprite key={`trail${i}`} poses={poses} index={i} width={7 * scale} height={7 * scale}><View style={{ width: 7 * scale, height: 7 * scale, borderRadius: 4 * scale, backgroundColor: "#FFF5CB" }}/></ArcadeSprite>)}
        <BeachSprites poses={poses} scale={scale} helper={s.helper} together={s.mode === "together"} />
        {[0, 1].map(i => <ArcadeSprite key={`wall${i}`} poses={poses} index={66 + i} width={18 * scale} height={18 * scale}><Svg width={18 * scale} height={18 * scale} viewBox="0 0 18 18" accessible={false}><Path d="M9 1V5M9 13V17M1 9H5M13 9H17M4 4L6 6M12 12L14 14M4 14L6 12M12 6L14 4" stroke="#FFF0B1" strokeWidth={2} strokeLinecap="round"/></Svg></ArcadeSprite>)}
        {[0, 1].map((i) => (
          <ArcadeSprite key={`pop${i}`} poses={poses} index={62 + i} width={65 * scale} height={26 * scale}>
            <Text
              style={{
                color: "#FFF8CE",
                fontSize: 22 * scale,
                textAlign: "center",
                textShadowColor: "#365063",
                textShadowRadius: 3,
              }}
            >
              +{config.countBy}
            </Text>
          </ArcadeSprite>
        ))}
        {[0, 1].map((i) => (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: "absolute",
              top: camera.y + (i ? 5 : 562) * scale,
              alignSelf: "center",
              maxWidth: camera.width - 16,
              transform: i && s.mode === "together" ? [{ rotate: "180deg" }] : [],
            }}
          >
            <Pill label={`${names[i]}, ${s.points[i] * config.countBy} points`}>
              {i ? "◆" : "●"} {names[i]} · {s.points[i] * config.countBy}/{config.target * config.countBy}
            </Pill>
          </View>
        ))}
        {config.countBy > 1 && (
          <View pointerEvents="none" style={{ position: "absolute", left: 8, top: 8 }}>
            <Pill>Count +{config.countBy}</Pill>
          </View>
        )}
        {s.tip && (
          <View
            pointerEvents="none"
            style={{ position: "absolute", left: camera.x + 12 * scale, top: camera.y + 455 * scale }}
          >
            <Text style={{ color: "#FFF6D8", fontSize: 14 * scale }}>← Drag ● →</Text>
          </View>
        )}
        {s.level === "endless" && (
          <View style={{ position: "absolute", bottom: 12, left: 10 }}>
            <Button quiet compact disabled={!active} onPress={() => input.set({ ...input.value, finish: true })}>
              Finish
            </Button>
          </View>
        )}
        {debug && (
          <Text style={{ position: "absolute", bottom: 2, left: 4, color: "white", fontSize: 10 }}>
            UI loop · {clock.value.ticks} ticks · rally {s.bestRally}
          </Text>
        )}
      </Animated.View>
    </GestureDetector>
  );
}
