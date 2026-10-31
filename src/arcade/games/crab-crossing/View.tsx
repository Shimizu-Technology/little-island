import React, { useCallback, useEffect, useRef, memo, useMemo, useState } from "react";
import { View, Platform, type ViewStyle } from "react-native";
import { crabHopFrame } from "../../feelArt";
import type { ArtPose } from "../../ArtPose";
import Animated, { useAnimatedStyle, useSharedValue, useFrameCallback } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { HeartsHud, HitReaction } from "../../LivesHud";
import { GridFeedback } from "../grid/Feedback";
import { Button, Copy, PressableScale } from "../../../components/ui";
import { Text } from "../../../components/Text";
import { useReducedMotion } from "../../../components/motion";

import { ArcadeSprite, type SpritePose } from "../../Sprite";
import { useArcadeLoop } from "../../loop";
import { GridHero, GridObject } from "../grid/Art";
import { CrabLane, CrabVehicle } from "./CrabArt";
import { crabFollow, crabFraming, crabProject, crabGroundTransform } from "./camera";
import { GridBudget, Shake, useGridInput, useGridTouch } from "../grid/Controls";
import type { Direction } from "../grid/rules";
import type { ArcadeResult } from "../../types";
import type { OutfitId } from "../../progress";
import {
  crabConfig,
  crabPosition,
  CRAB_HOP,
  crabLanes,
  crabLearning,
  crabResult,
  crabStep,
  crabTransition,
  laneObjects,
  waterLane,
  type CrabInput,
  type CrabState,
} from "./engine";
const tick: CrabInput = { type: "tick" };
export function CrabBoard({
  initial,
  active,
  helper,
  outfit,
  onResult,
  onTone,
  size: allottedSize,
  height: availableHeight,
  debug,
}: {
  initial: CrabState;
  active: boolean;
  helper: boolean;
  outfit: OutfitId;
  onResult: (r: ArcadeResult) => void;
  onTone: (s: string, haptic?: boolean) => void;
  size: number;
  height: number;
  wide: boolean;
  debug: boolean;
}) {
  const touch = useGridTouch();
  const viewportWidth = Math.max(1, allottedSize);
  const viewportHeight = Math.max(1, availableHeight);
  const { unit, heroSize } = crabFraming(viewportWidth, viewportHeight);
  const worldWidth = unit * 9;
  const coastTiles = viewportWidth > unit * 8 ? [-1, 0, 1] : [0];
  const poses = useSharedValue<ArtPose[]>([]), reduced = useReducedMotion();
  const start = crabPosition(initial);
  const startGround = crabProject((start.x + 0.5) * unit, (start.y + 0.5) * unit);
  const cameraIdentity = useSharedValue<string | number | undefined>(initial.lives.hit);
  const camera = useSharedValue({ x: viewportWidth / 2 - startGround.x, y: viewportHeight * 0.76 - startGround.y });
  // Follow ground contact, never the hop arc. Presentation cannot change the rules.
  useFrameCallback(frame => {
    const target = poses.value[59];
    if (!target || !active) return;
    const identity = poses.value[0]?.identity;
    const reset = cameraIdentity.value !== identity;
    if (reset) cameraIdentity.value = identity;
    const dt = (frame.timeSincePreviousFrame ?? 16.67) / 1000;
    const x = crabFollow(camera.value.x, target.x, dt, reduced || reset);
    const y = crabFollow(camera.value.y, target.y, dt, reduced || reset);
    if (Math.abs(camera.value.x - x) + Math.abs(camera.value.y - y) > 0.001) camera.value = { x, y };
  });
  const cameraStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: camera.value.x }, { translateY: camera.value.y }],
  }));
  // Kit v3: pose-only interpolation, including a respawn identity guard.
  const build = useCallback(
    (s: CrabState) => {
      const hero = crabPosition(s),
        bounce = s.hop ? Math.sin((s.hop.age / CRAB_HOP) * Math.PI) : 0,
        lanes = crabLanes(s),
        p: ArtPose[] = [
          {
            identity: s.lives.hit,
            x: (hero.x + 0.5) * unit - heroSize / 2,
            y: (hero.y + 0.5 - hero.arc) * unit - heroSize * 0.78,
            scale: 1 + bounce * 0.08,
            frame: reduced ? 0 : crabHopFrame(s.hop?.age, CRAB_HOP),
            angle: reduced ? 0 : s.respawn > 0 ? 0.18 : Math.sin(s.time * 3) * 0.025,
          },
        ];
      for (let row = 0; row < 9; row++) {
        const l = lanes.find((l) => l.row === row),
          objects = l ? laneObjects(l, s.travel) : [];
        for (let i = 0; i < 6; i++)
          p.push({
            x: ((objects[i] ?? 0) - (l?.span ?? 1) / 2 + 0.5) * unit,
            y: row * unit,
            opacity: l && i < objects.length ? 1 : 0,
          });
      }
      for (let i = 0; i < 3; i++)
        p.push({ x: ((i * 3 + (reduced ? 0 : s.time * 0.4)) % 9) * unit, y: (2.4 + i * 0.6) * unit, opacity: 0.3 });
      p.push({ x: hero.x * unit, y: hero.y * unit, scale: 1 - bounce * 0.24, opacity: 0.28 - bounce * 0.14 });
      const ground = crabProject((hero.x + 0.5) * unit, (Math.max(3, hero.y) + 0.5) * unit);
      p.push({ x: viewportWidth / 2 - ground.x, y: viewportHeight * 0.76 - ground.y });
      p.push({ x: (hero.x + 0.5) * unit - heroSize * 0.65, y: (hero.y + 0.5) * unit, opacity: reduced ? 0 : s.hop ? Math.max(0, 0.7 - s.hop.age / CRAB_HOP) : 0 });
      return p;
    },
    [reduced, unit, heroSize, viewportWidth, viewportHeight]
  );
  const pose = useMemo(() => ({ build, target: poses, snapDistance: unit * 2 }), [build, poses, unit]);
  const {
      snapshot: s,
      dispatch,
      state,
      budget,
    } = useArcadeLoop({ initial, step: crabStep, reduce: crabTransition, input: tick, active, pose }),
    reported = useRef(false),
    [homes, setHomes] = useState<{ crossed: number; slots: number[] }>({ crossed: initial.crossed, slots: [] }),
    last = useRef({ crossed: 0, bumps: 0, cursor: 0 });
  useEffect(() => {
    if (active && state.current.helper !== helper) dispatch({ type: "helper", value: helper });
  }, [active, helper, dispatch, state]);
  useEffect(() => {
    if (s.crossed > last.current.crossed || s.cursor > last.current.cursor) onTone("coral");
    if (crabLearning(s) && s.bumps > last.current.bumps) onTone("shell-0");
    last.current = { crossed: s.crossed, bumps: s.bumps, cursor: s.cursor };
    const r = crabResult(s);
    if (r && active && (!r.cleared || !touch.touching) && !reported.current) {
      // Keep the winning control mounted through finger-up, then show the shared result.
      // This also gives the local clear pose/particles a brief, unobstructed beat.
      const timer = setTimeout(
        () => {
          if (!reported.current) {
            reported.current = true;
            onResult(r);
          }
        },
        r.cleared ? 300 : 0
      );
      return () => clearTimeout(timer);
    }
  }, [s, active, touch.touching, onResult, onTone]);
  if (s.crossed > homes.crossed) {
    const slot = [1, 4, 7].reduce((best, x) => Math.abs(s.impact.x - x) < Math.abs(s.impact.x - best) ? x : best, 1);
    setHomes({ crossed: s.crossed, slots: [...(homes.crossed % 3 === 0 ? [] : homes.slots), slot] });
  }
  const move = useCallback(
    (direction: Direction) => {
      if (active) {
        dispatch({ type: "hop", direction });
        onTone("shell-3", false);
      }
    },
    [active, dispatch, onTone]
  );
  const pan = useGridInput(active, move, true, () => move("up")),
    learning = crabLearning(s),
    l = crabConfig(s),
    [lanes] = useState(() => crabLanes(initial));
  const compactChip = { backgroundColor: "#102F39DC", borderRadius: 16, paddingHorizontal: 9, minHeight: 38, justifyContent: "center" as const };
  return (
    <View {...touch.handlers} testID="crab-world" style={{ flex: 1, overflow: "hidden", backgroundColor: "#488A70" }}>
      <Shake event={s.bumps}>
        <View {...pan} accessible accessibilityRole="button" accessibilityLabel={`Crab Crossing world. Tap to hop forward, swipe left, right, or back. ${s.hops} hops, ${s.bumps} bumps.`}
          onAccessibilityTap={() => move("up")}
          style={{ width: viewportWidth, height: viewportHeight, overflow: "hidden", ...(Platform.OS === "web" ? ({ touchAction: "none" } as ViewStyle) : {}) }}>
          <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width: worldWidth, height: unit * 11 }, cameraStyle]}>
            <View style={{ width: worldWidth, height: unit * 11, transform: crabGroundTransform(worldWidth, unit * 11) }}>
            {Array.from({ length: 40 }, (_, index) => {
              const row = index - 14;
              const lane = lanes.find(item => item.row === row);
              return <View key={row} style={{ position: "absolute", top: row * unit, left: -unit * 4, width: unit * 17, height: unit }}>
                {coastTiles.map(tile => <View key={tile} style={{ position: "absolute", left: tile * unit * 17 }}>
                  <CrabLane row={row} lane={lane} learning={learning} width={unit * 17} height={unit}/>
                </View>)}
              </View>;
            })}
            {[1, 4, 7].map(x => <View key={`burrow-${x}`} style={{ position: "absolute", left: x * unit - unit * 0.1, top: -unit * 0.1 }}>
              <GridObject kind="burrow" size={unit * 1.2}/>
              {homes.slots.includes(x) && <View style={{ position: "absolute", left: unit * 0.3, top: unit * 0.38 }}><GridHero crab happy size={unit * 0.65}/></View>}
            </View>)}
            {learning && l.numbers.map((n, i) => <React.Fragment key={i}>
              {[l.stones[i], (l.stones[i] + 3) % 9].map((x, j) => <View key={j} style={{ position: "absolute", top: (9 - i) * unit + 2, left: x * unit + 1, width: unit - 2, height: unit - 4, borderRadius: unit / 3, backgroundColor: i < s.cursor ? "#AEDCBA" : "#FFF0C7", borderWidth: 2, borderBottomWidth: 6, borderColor: i === s.cursor && j === 0 && helper ? "#E6A149" : "#7A9A91", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#2E5558", fontSize: unit * 0.42, fontWeight: "900" }}>{j ? n + (n === 1 ? 2 : 1) : n}</Text>
              </View>)}
            </React.Fragment>)}
            <CrabTraffic poses={poses} unit={unit} lanes={lanes} debug={debug}/>
            <ArcadeSprite poses={poses} index={60} width={heroSize * 1.3} height={heroSize * 0.4}>
              <View style={{ width: heroSize * 1.3, height: heroSize * 0.24, borderRadius: heroSize, borderWidth: 2, borderColor: lanes.some(item => item.row === Math.round(crabPosition(s).y) && waterLane(item)) ? "#D7FFFF" : "#F8E4B1", backgroundColor: "transparent" }}/>
            </ArcadeSprite>
            <HitReaction hit={s.lives.hit} onTone={onTone}><CrabActor poses={poses} unit={unit} heroSize={heroSize} outfit={outfit} debug={debug} happy={s.phase === "cleared"}/></HitReaction>
            <GridFeedback event={s.crossed + s.lives.hit} x={s.impact.x} y={s.impact.y} kind={s.impact.kind} unit={unit} cols={9} rows={11} text={s.impact.kind === "score" ? "+100" : s.impact.kind === "splash" ? "SPLASH!" : "BONK!"} textWidth={110}/>
            </View>
          </Animated.View>
        </View>
      </Shake>
      <View pointerEvents="box-none" style={{ position: "absolute", top: 72, left: 10, right: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={compactChip} accessibilityLabel={`Score ${s.score}. ${s.crossed} of ${s.level === "endless" ? "endless" : l.target} burrows`}>
          <Text style={{ fontSize: 36, lineHeight: 42, fontWeight: "900", color: "#FFF4C7", textShadowColor: "#183B44", textShadowRadius: 2, textShadowOffset: { width: 2, height: 3 } }}>{learning ? l.numbers[s.cursor] ?? "HOME" : s.score}</Text>
          <Text style={{ fontSize: 12, fontWeight: "900", color: "#FFF4C7" }}>{learning ? "NEXT STONE" : `BURROWS ${s.crossed}/${s.level === "endless" ? "∞" : l.target}`}</Text>
        </View>
        <View style={{ gap: 5, alignItems: "flex-end" }}>
          {!learning && <View style={compactChip}><HeartsHud lives={s.lives}/></View>}
          <View style={compactChip}><Text style={{ color: "#FFF4C7", fontWeight: "900", fontSize: 15 }}>⌂ {s.crossed}/{s.level === "endless" ? "∞" : l.target}</Text></View>
        </View>
      </View>
      <View pointerEvents="box-none" style={{ position: "absolute", right: 10, bottom: 12, gap: 4, alignItems: "center" }}>
        <OverlayArrow label="Move forward" glyph="↑" onPress={() => move("up")} active={active}/>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <OverlayArrow label="Move left" glyph="←" onPress={() => move("left")} active={active}/>
          <OverlayArrow label="Move back" glyph="↓" onPress={() => move("down")} active={active}/>
          <OverlayArrow label="Move right" glyph="→" onPress={() => move("right")} active={active}/>
        </View>
      </View>
      {s.hops < 3 && <View pointerEvents="none" style={{ position: "absolute", bottom: 12, left: 10, backgroundColor: "#102F39CC", padding: 8, borderRadius: 12 }}><Copy style={{ color: "#FFF4C7", fontSize: 13 }}>Tap to hop · swipe to steer</Copy></View>}
      {s.level === "endless" && <View style={{ position: "absolute", left: 10, bottom: 48 }}><Button quiet compact disabled={!active} onPress={() => dispatch({ type: "finish" })}>Finish crossing</Button></View>}
      {debug && <View pointerEvents="none" style={{ position: "absolute", left: 10, bottom: 4 }}><GridBudget budget={budget}/></View>}
    </View>
  );
}

function OverlayArrow({ label, glyph, onPress, active }: { label: string; glyph: string; onPress: () => void; active: boolean }) {
  return <PressableScale accessibilityRole="button" accessibilityLabel={label} disabled={!active} onPress={onPress} style={{ width: 44, height: 44, borderRadius: 13, justifyContent: "center", alignItems: "center", backgroundColor: "#102F39B8", borderWidth: 1, borderColor: "#DDF3D2A8" }}><Text style={{ color: "#FFF7D9", fontSize: 27, fontWeight: "900" }}>{glyph}</Text></PressableScale>;
}

const CrabActor = memo(function CrabActor({
  poses,
  unit,
  heroSize,
  outfit,
  happy,
  debug,
}: {
  poses: SharedValue<SpritePose[]>;
  unit: number;
  heroSize: number;
  outfit: OutfitId;
  debug: boolean;
  happy: boolean;
}) {
  const hopShape = useAnimatedStyle(() => {
    const frame = poses.value[0]?.frame ?? 0;
    const shape = frame === 1 || frame === 4 ? { x: 1.14, y: 0.84 } : frame === 2 ? { x: 0.86, y: 1.2 } : { x: 1, y: 1 };
    return { transform: [{ scaleX: shape.x }, { scaleY: shape.y }] };
  });
  return (
    <>
    <ArcadeSprite poses={poses} index={58} width={unit} height={unit}>
      <View style={{ position: "absolute", left: unit * 0.5 - heroSize * 0.36, top: unit * 0.5, width: heroSize * 0.72, height: heroSize * 0.18, borderRadius: unit, backgroundColor: "#163E4B" }} />
    </ArcadeSprite>
    <ArcadeSprite poses={poses} index={0} width={heroSize} height={heroSize}>
      <Animated.View style={hopShape}>
      <GridHero crab size={heroSize} outfit={outfit} happy={happy} poses={poses} />
      </Animated.View>
      {debug && (
        <View
          style={{
            position: "absolute",
            left: heroSize * 0.2,
            top: heroSize * 0.38,
            width: heroSize * 0.6,
            height: heroSize * 0.44,
            borderWidth: 1,
            borderColor: "#FF3366",
            borderRadius: unit * 0.2,
          }}
        />
      )}
    </ArcadeSprite>
    </>
  );
});
const CrabTraffic = memo(function CrabTraffic({
  poses,
  unit,
  lanes,
  debug,
}: {
  poses: SharedValue<SpritePose[]>;
  unit: number;
  lanes: ReturnType<typeof crabLanes>;
  debug: boolean;
}) {
  return (
    <>
      {lanes.map((l) =>
        Array.from({ length: 6 }, (_, i) => (
          <ArcadeSprite
            key={`${l.row}-${i}`}
            poses={poses}
            index={1 + l.row * 6 + i}
            width={unit * l.span}
            height={unit * 1.18}
          >
            <CrabVehicle kind={l.kind} width={unit * l.span} height={unit * 1.18} variant={i + l.row} left={l.speed < 0} />
            {debug && (
              <View
                style={{
                  position: "absolute",
                  left: waterLane(l) ? 0 : unit * l.span * 0.04,
                  top: unit * 0.26,
                  width: unit * l.span * (waterLane(l) ? 1 : 0.92),
                  height: unit * 0.58,
                  borderWidth: 1,
                  borderColor: waterLane(l) ? "#C1FFE4" : "#FF3366",
                }}
              />
            )}
          </ArcadeSprite>
        ))
      )}
    </>
  );
});
