import React, { useCallback, useEffect, useRef, memo, useMemo } from "react";
import { View, Platform, type ViewStyle } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { HeartsHud, HitReaction } from "../../LivesHud";
import { GridFeedback } from "../grid/Feedback";
import { Copy, Button } from "../../../components/ui";
import { Text } from "../../../components/Text";
import { PictureObject } from "../../../learn/art/Objects";
import { useReducedMotion } from "../../../components/motion";
import { StarDisplay } from "../../Art";
import { ArcadeSprite, type SpritePose } from "../../Sprite";
import { useArcadeLoop } from "../../loop";
import type { ArcadeResult } from "../../types";
import type { OutfitId } from "../../progress";
import { GridBackdrop, GridHero, GridObject } from "../grid/Art";
import { DirectionPad, GridBudget, Shake, useGridInput, useGridTouch } from "../grid/Controls";
import { RailArt } from "../grid/RailArt";
import { railHeading } from "../../feelArt";
import type { Direction } from "../grid/rules";
import {
  railHedges,
  railWaiting,
  railBodyPose,
  railTick,
  railLearning,
  railResult,
  railStars,
  railSnake,
  railStep,
  railTarget,
  railTransition,
  type RailInput,
  type RailState,
} from "./engine";
const tick: RailInput = { type: "tick" };
export function RailBoard({
  initial,
  active,
  helper,
  outfit,
  onResult,
  onTone,
  size: allottedSize,
  height: availableHeight,
  wide,
  debug,
}: {
  initial: RailState;
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
  const size = Math.max(
    120,
    Math.min(
      allottedSize - (wide ? 46 : 12),
      wide ? Infinity : (availableHeight - 284 - (initial.level === "endless" ? 54 : 0) - (debug ? 37 : 0)) * 1
    )
  );
  const poses = useSharedValue<SpritePose[]>([]),
    reduced = useReducedMotion(),
    unit = (size - 6) / 10;
  const clearVisual = useRef<{ state: RailState | null; started: number }>({ state: null, started: 0 });
  // Kit v3: render interpolation only; engine and authored art remain unchanged.
  const build = useCallback(
    (s: RailState) => {
      let learningClearAge: number | undefined;
      if (railLearning(s) && s.phase === "cleared") {
        const now = performance.now();
        if (clearVisual.current.state !== s) clearVisual.current = { state: s, started: now };
        learningClearAge = (now - clearVisual.current.started) / 1000;
      }
      const fraction = s.respawn > 0 || s.phase !== "play" ? 0 : s.elapsed / railTick(s),
        snake = railSnake(s, railLearning(s) ? 0 : fraction),
        body = railBodyPose(s, learningClearAge);
      return [
        ...Array.from({ length: 40 }, (_, i) => {
          const p = body[i];
          return {
            identity: s.lives.hit,
            x: (p?.x ?? 0) * unit,
            y: (p?.y ?? 0) * unit,
            opacity: p ? 1 : 0,
            angle: railHeading(railLearning(s) ? s.previous : s.body, i, s.direction),
            scale: i === 0 ? 1 : 0.85,
          };
        }),
        ...Array.from({ length: 6 }, (_, i) => ({
          // The head drawing points right: keep it at the right end of the connected body.
          x: (snake[snake.length - 1 - i]?.x ?? 0) * unit,
          y: (snake[snake.length - 1 - i]?.y ?? 0) * unit,
          opacity: snake[i] ? 1 : 0,
        })),
        ...[0, 1, 2].map((i) => ({
          x: (2 + i * 3) * unit + (reduced ? 0 : Math.sin((s.moves + s.elapsed) * 0.7 + i) * 9),
          y: (2 + i * 2) * unit + (reduced ? 0 : Math.cos((s.moves + s.elapsed) * 0.5 + i) * 6),
          opacity: 0.65,
        })),
      ];
    },
    [reduced, unit]
  );
  const pose = useMemo(() => ({ build, target: poses, snapDistance: unit * 2 }), [build, poses, unit]);
  const {
      snapshot: s,
      dispatch,
      state,
      budget,
    } = useArcadeLoop({ initial, step: railStep, reduce: railTransition, input: tick, active, pose }),
    reported = useRef(false),
    last = useRef({ collected: 0, bumps: 0 });
  useEffect(() => {
    if (active && state.current.helper !== helper) dispatch({ type: "helper", value: helper });
  }, [active, helper, dispatch, state]);
  useEffect(() => {
    if (s.collected > last.current.collected) onTone("coral");
    if (railLearning(s) && s.bumps > last.current.bumps) onTone("shell-0");
    last.current = { collected: s.collected, bumps: s.bumps };
    const r = railResult(s);
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
  const move = useCallback(
    (direction: Direction) => {
      if (active) {
        dispatch({ type: "turn", direction });
        onTone("shell-2", false);
      }
    },
    [active, dispatch, onTone]
  );
  const pan = useGridInput(active, move),
    learning = railLearning(s),
    sequence = s.level !== "endless" ? s.level.sequence : [],
    next = sequence[s.collected],
    world = s.level === "endless" ? "w3" : s.level.world;
  return (
    <View
      {...touch.handlers}
      style={{
        alignItems: "center",
        gap: 8,
        flexDirection: wide ? "row" : "column",
        justifyContent: "center",
        flex: 1,
      }}
    >
      <View>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            justifyContent: "space-between",
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <View
            accessibilityLabel="Chick goal"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#102F39CC",
              borderRadius: 16,
              paddingHorizontal: 8,
              minHeight: 36,
            }}
          >
            <GridHero chick size={28} />
            <Copy style={{ color: "#FFF0BE", fontWeight: "800", fontSize: 16 }}>
              {railWaiting(s) ? "Ready · tap a direction" : learning ? `Next ${next ?? "✓"}` : `${s.collected}/${railTarget(s) === Infinity ? "∞" : railTarget(s)}`}
            </Copy>
          </View>
          {s.level !== "endless" && s.level.word && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFEDC6",
                borderRadius: 12,
                paddingHorizontal: 6,
              }}
            >
              <PictureObject name={s.level.word} size={34} />
              <Text style={{ fontSize: 20, color: "#384B4C", letterSpacing: 3 }}>
                {sequence.map((t, i) => (i < s.collected ? t : "_")).join("")}
              </Text>
            </View>
          )}
          <View
            accessibilityLabel={`Star goal ${railStars({ ...s, phase: "cleared" })} of 3, score ${s.score}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#102F39CC",
              borderRadius: 16,
              paddingHorizontal: 8,
              minHeight: 36,
            }}
          >
            <StarDisplay stars={railStars({ ...s, phase: "cleared" })} size={13} />
            <Text style={{ color: "#FFF0BE", fontSize: 13, fontWeight: "800" }}>{s.score}</Text>
          </View>
        </View>
        {!learning && (
          <View style={{ alignItems: "center", marginBottom: 6 }}>
            <HeartsHud lives={s.lives} />
          </View>
        )}
        <Shake event={s.bumps}>
          <View
            {...pan}
            accessibilityLabel={`Garden playfield. Mama at column ${s.body[0].x + 1}, row ${s.body[0].y + 1}. Chick at column ${s.food.x + 1}, row ${s.food.y + 1}. ${s.moves} steps, ${s.collected} chicks, ${s.bumps} bumps. ${learning ? `Find ${next}` : "Collect the chick"}. ${s.message}`}
            style={{
              width: size,
              height: size,
              borderRadius: 25,
              overflow: "hidden",
              borderWidth: 3,
              borderColor: "#B8CF81",
              ...(Platform.OS === "web" ? ({ touchAction: "none" } as ViewStyle) : {}),
            }}
          >
            <GridBackdrop crab={false} world={world} width={size} height={size} />
            {Array.from({ length: 10 }, (_, i) => (
              <React.Fragment key={i}>
                <View pointerEvents="none" style={{ position: "absolute", top: i * unit, width: size, height: 1, backgroundColor: "#FFFFFF", opacity: 0.07 }} />
                <View pointerEvents="none" style={{ position: "absolute", left: i * unit, height: size, width: 1, backgroundColor: "#FFFFFF", opacity: 0.07 }} />
              </React.Fragment>
            ))}
            {railHedges(s).map((p) => (
              <View key={`${p.x}-${p.y}`} style={{ position: "absolute", left: p.x * unit, top: p.y * unit }}>
                <GridObject kind="hedge" size={unit} />
              </View>
            ))}
            <View
              style={{
                position: "absolute",
                left: s.food.x * unit,
                top: s.food.y * unit,
                width: unit,
                height: unit,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: learning ? "#FFE5A0" : "#FFF8D355",
                borderRadius: unit / 2,
                borderWidth: 1.5,
                borderColor: "#FFF5C6",
              }}
            >
              {learning ? (
                <Text style={{ fontSize: unit * 0.65, fontWeight: "900", color: "#3A4D4F" }}>{next}</Text>
              ) : (
                <RailArt size={unit} chick outfit="island" />
              )}
            </View>
            {learning && s.phase === "play" && (
              <View
                style={{
                  position: "absolute",
                  left: s.decoy.x * unit,
                  top: s.decoy.y * unit,
                  width: unit,
                  height: unit,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#D1E9C8",
                  borderRadius: unit / 2,
                  borderWidth: 2,
                  borderColor: "#648F70",
                }}
              >
                <Text style={{ fontSize: unit * 0.6, fontWeight: "800", color: "#384F4B" }}>
                  {s.level !== "endless" && s.level.word ? (next === "a" ? "o" : "a") : String(Number(next) + 1)}
                </Text>
              </View>
            )}
            <HitReaction hit={s.lives.hit} onTone={onTone}>
              <RailTrain poses={poses} unit={unit} outfit={outfit} />
            </HitReaction>
            <RailScenery poses={poses} unit={unit} />
            {s.respawn > 0 && <View pointerEvents="none" accessibilityLiveRegion="polite" accessibilityLabel="Gathering the parade. Collected chicks stay counted." style={{ position: "absolute", left: Math.max(0, (s.body[0].x - 1) * unit), top: Math.max(0, (s.body[0].y - 1) * unit), width: unit * 3, height: unit * 3, borderRadius: unit * 1.5, borderWidth: 2, borderStyle: "dashed", borderColor: "#FFF0B6", backgroundColor: "#FFF0B61A" }} /> }
            <GridFeedback
              event={s.collected + s.lives.hit}
              x={s.impact.x}
              y={s.impact.y}
              unit={unit}
              cols={10}
              rows={10}
              kind={s.impactKind}
              text={s.impactKind === "splat" ? "" : "+40"}
            />
          </View>
        </Shake>
      </View>
      <View style={{ gap: 10, alignItems: "center", maxWidth: wide ? 235 : undefined }}>
        <Copy style={{ color: "#FFF0C7", fontSize: 15, textAlign: "center", minHeight: 21 }}>
          {learning
            ? "One swipe. One step. No hurry."
            : s.moves < 4
              ? "Mama keeps moving. Turn toward the chick!"
              : "Keep the parade together!"}
        </Copy>
        <DirectionPad active={active} onMove={move} horizontal={wide} />
        {s.level === "endless" && (
          <Button quiet compact disabled={!active} onPress={() => dispatch({ type: "finish" })}>
            Finish parade
          </Button>
        )}
        {debug && <GridBudget budget={budget} />}
      </View>
    </View>
  );
}

const RailTrain = memo(function RailTrain({
  poses,
  unit,
  outfit,
}: {
  poses: SharedValue<SpritePose[]>;
  unit: number;
  outfit: OutfitId;
}) {
  return (
    <>
      {Array.from({ length: 40 }, (_, i) => (
        <ArcadeSprite key={i} poses={poses} index={i} width={unit} height={unit}>
          <RailArt size={unit} chick={i > 0} outfit={outfit} />
        </ArcadeSprite>
      ))}
    </>
  );
});
const RailScenery = memo(function RailScenery({ poses, unit }: { poses: SharedValue<SpritePose[]>; unit: number }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <ArcadeSprite key={i} poses={poses} index={40 + i} width={unit} height={unit}>
          <GridObject kind={i === 0 ? "snake" : "snake-body"} size={unit} />
        </ArcadeSprite>
      ))}
      {[0, 1, 2].map((i) => (
        <ArcadeSprite key={`fly-${i}`} poses={poses} index={46 + i} width={10} height={10}>
          <View style={{ width: 5, height: 5, backgroundColor: "#FFE6A2", borderRadius: 5 }} />
        </ArcadeSprite>
      ))}
    </>
  );
});
