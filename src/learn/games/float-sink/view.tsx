import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { Button, C, Copy, IconButton, PressableScale } from "../../../components/ui";
import { easeInOut, easeOut, nativeDriver, useReducedMotion } from "../../../components/motion";
import type { BoardProps } from "../../types";
import { CoachSpot } from "../../Coach";
import type { Prediction } from "../../kit/science";
import { act, capacity, dock, objects, shapesFor, truth, type FloatState, type Shape } from "./engine";
export function ObjectArt({ id, size = 62 }: { id: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" accessible accessibilityLabel={id.replaceAll("-", " ")}>
      <G stroke={C.ink} strokeWidth="2">
        {id.includes("bottle") ? (
          <G>
            <Path d="M30 8H50V22L58 30V71H22V30L30 22Z" fill={id.startsWith("full") ? "#83BAC8" : "#E6F2F0"} />
            <Rect x="30" y="5" width="20" height="8" fill={C.teal} />
            {id.startsWith("empty") && <Circle cx="40" cy="43" r="10" fill={C.paper} stroke="none" />}
          </G>
        ) : ["toy-boat", "clay-boat", "bowl", "wide", "foil"].includes(id) ? (
          <G>
            <Path
              d={id === "wide" ? "M4 36Q40 60 76 36L65 62H15Z" : "M10 28Q40 55 70 28L61 62H19Z"}
              fill={id === "foil" ? "#B8C8CD" : C.coral}
            />
            <Path d="M10 28Q40 55 70 28" fill="none" stroke={C.cream} strokeWidth="5" />
            {id === "toy-boat" && <Path d="M40 29V5L62 26H40" fill={C.gold} />}
          </G>
        ) : id === "leaf" ? (
          <G>
            <Path d="M10 65Q0 12 68 9Q74 65 10 65Z" fill={C.teal} />
            <Path d="M10 65L58 20" stroke={C.cream} />
          </G>
        ) : id === "key" ? (
          <G>
            <Circle cx="26" cy="24" r="15" fill={C.gold} />
            <Path d="M36 35L66 65M55 54L63 46M63 62L72 53" stroke={C.gold} strokeWidth="9" />
          </G>
        ) : id === "spoon" ? (
          <G>
            <Ellipse cx="27" cy="22" rx="14" ry="19" rotation="-30" origin="27,22" fill="#B0C2CB" />
            <Path d="M37 38L65 70" stroke="#91A5B0" strokeWidth="9" />
          </G>
        ) : id === "shell" ? (
          <G>
            <Path d="M9 50Q0 14 40 10Q80 14 71 50L43 70H37Z" fill="#E4B69C" />
            <Path d="M40 14V65M15 29L35 64M65 29L45 64" stroke={C.cream} />
          </G>
        ) : id === "log" || id === "cork" ? (
          <G>
            <Rect x="6" y={id === "log" ? 22 : 15} width="63" height="42" rx="12" fill="#B98E67" />
            <Ellipse cx="63" cy="43" rx="10" ry="20" fill="#E1C39A" />
            <Path d="M12 34H45M16 49H43" stroke={C.cream} />
          </G>
        ) : id === "rock" ? (
          <G>
            <Path d="M10 58L16 30L36 18L60 24L72 46L64 64L30 68Z" fill="#9A9C98" />
            <Path d="M26 36L38 30M50 50L60 46" stroke="#C9CBC6" strokeWidth="3" />
          </G>
        ) : id === "coconut" ? (
          <G>
            <Circle cx="40" cy="42" r="28" fill="#7A5534" />
            <Path d="M18 34L24 38M22 52L28 50M54 58L58 52M60 30L56 36M38 66L40 60" stroke="#B48A5E" strokeWidth="2" />
            <Circle cx="34" cy="26" r="3.5" fill="#3B2617" stroke="none" />
            <Circle cx="44" cy="26" r="3.5" fill="#3B2617" stroke="none" />
            <Circle cx="39" cy="34" r="3.5" fill="#3B2617" stroke="none" />
          </G>
        ) : id === "sponge" ? (
          <G>
            <Rect x="9" y="18" width="62" height="48" rx="10" fill={C.gold} />
            {[20, 40, 60].map((x) => (
              <Circle key={x} cx={x} cy={(x % 40) + 30} r="5" fill="#B98E67" />
            ))}
          </G>
        ) : (
          <G>
            <Circle
              cx="40"
              cy="42"
              r={id === "coin" ? 20 : 28}
              fill={
                id === "apple" || id === "clay" || id === "ball"
                  ? C.coral
                  : id === "coconut"
                    ? "#92714D"
                    : id === "coin"
                      ? C.gold
                      : "#A2A4A0"
              }
            />
            {id === "apple" ? (
              <Path d="M39 17Q37 3 51 8" stroke={C.teal} strokeWidth="5" fill="none" />
            ) : (
              <Path d="M24 40Q33 24 48 31" stroke={C.cream} fill="none" />
            )}
          </G>
        )}
      </G>
    </Svg>
  );
}
const name = (id: string) => objects.find((x) => x.id === id)?.name ?? id;
function PebblePile({ size = 54 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size * 0.7}
      viewBox="0 0 60 42"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {[
        [14, 32, 10],
        [32, 33, 11],
        [48, 32, 9],
        [22, 18, 9],
        [40, 18, 9],
        [31, 6, 7],
      ].map(([x, y, r], i) => (
        <Ellipse
          key={i}
          cx={x}
          cy={y}
          rx={r}
          ry={r * 0.78}
          fill={["#8E9692", "#A7ADA6", "#7D8682"][i % 3]}
          stroke={C.ink}
          strokeWidth="1.5"
        />
      ))}
    </Svg>
  );
}
function Water({ children, width, height = 150 }: { children?: React.ReactNode; width: number; height?: number }) {
  return (
    <View style={{ height, width: Math.min(width, 420), alignSelf: "center" }}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 320 150"
        preserveAspectRatio="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Rect x="8" y="22" width="304" height="124" rx="18" fill="#EFF6F4" stroke={C.blue} strokeWidth="3" />
        <Path d="M10 66Q38 56 64 66T120 66T176 66T232 66T310 66V128Q310 144 294 144H26Q10 144 10 128Z" fill="#9DCBD9" />
        <Path d="M10 140H310" stroke="#C9B48F" strokeWidth="6" />
      </Svg>
      {children}
    </View>
  );
}
/** Float looks like a thing resting on the waves; Sink looks like a thing on the bottom. */
function GuessPicture({ id, sink }: { id: string; sink: boolean }) {
  return (
    <View style={{ width: 96, height: 78 }}>
      <Svg
        width={96}
        height={78}
        viewBox="0 0 96 78"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Rect x="2" y="26" width="92" height="50" rx="9" fill="#BFDDE6" />
        <Path d="M2 28Q14 21 26 28T50 28T74 28T94 28" stroke={C.blue} strokeWidth="3" fill="none" />
        <Path d="M4 72H92" stroke="#C9B48F" strokeWidth="5" strokeLinecap="round" />
        {sink ? (
          <Path d="M14 36V56M8 50L14 57L20 50" stroke={C.blue} strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <Path d="M14 22V6M8 12L14 5L20 12" stroke={C.blue} strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </Svg>
      <View style={{ position: "absolute", left: 30, top: sink ? 38 : 0 }}>
        <ObjectArt id={id} size={34} />
      </View>
    </View>
  );
}
const shapeName: Record<Shape, string> = { ball: "Clay ball", bowl: "Clay bowl", wide: "Wide boat", foil: "Foil boat" };
export function Board({ session, update, practice, sound, width, active, coach, cheer }: BoardProps<FloatState>) {
  const s = session.state,
    o = session.options,
    d = dock(s, o)!,
    reduced = useReducedMotion();
  const [moving, setMoving] = useState<{ id: string; sinks: boolean } | null>(null);
  // The result shows (and is said) once the object has landed, so she watches first.
  const [landed, setLanded] = useState(true);
  const landing = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (landing.current) clearTimeout(landing.current);
    },
    []
  );
  const [t] = useState(() => new Animated.Value(0));
  const [boatY] = useState(() => new Animated.Value(4));
  const running = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => () => running.current?.stop(), []);
  const object = d.phase === "predict" ? objects.find((x) => x.id === s.items[d.index]) : undefined;
  const seat = ((s.starter + d.boat) % 2) as 0 | 1,
    who = (n: number) => session.names?.[n] || `Player ${n + 1}`;
  const lastId = d.shelf[d.shelf.length - 1],
    lastRight = lastId !== undefined && d.guesses[d.guesses.length - 1] === truth(lastId);
  const max = d.shape ? capacity(d.shape, o.pace === "hard") : 0,
    sank = !!d.shape && (d.shape === "ball" || d.pebbles > max);
  // Boat sits a little lower with each pebble, then sinks.
  useEffect(() => {
    const to = !d.shape ? 4 : sank ? 62 : 4 + (d.pebbles / (max + 1)) * 30;
    const a = Animated.timing(boatY, {
      toValue: to,
      duration: reduced ? 0 : sank ? 700 : 320,
      easing: easeInOut,
      useNativeDriver: nativeDriver,
    });
    a.start();
    return () => a.stop();
  }, [d.shape, d.pebbles, sank, max, reduced, boatY]);
  // Say the boat job once the last object's reason (drop 0.7 s, cheer tone, a line of up to 4.8 s) has finished.
  useEffect(() => {
    if (!active || d.phase !== "shape") return;
    const timer = setTimeout(() => sound("float-sink-build", true), d.boat === 0 ? 6300 : 300);
    return () => clearTimeout(timer);
  }, [active, d.phase, d.boat, sound]);
  const guess = (p: Prediction) => {
    if (!active || !object || moving) return;
    const right = p === truth(object.id);
    practice("sci.predict", right);
    practice(object.skill, right);
    update(act(s, { kind: "predict", value: p }, o));
    if (coach.active) coach.done();
    const reveal = () => {
      setLanded(true);
      if (right) cheer("right", `float-sink-right-${object.id}`);
      else sound(`float-sink-surprise-${object.id}`, true);
    };
    if (reduced) return reveal();
    setLanded(false);
    landing.current = setTimeout(reveal, 700);
    setMoving({ id: object.id, sinks: !object.floats });
    t.setValue(0);
    running.current = Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: 650, easing: easeInOut, useNativeDriver: nativeDriver }),
      Animated.delay(550),
      Animated.timing(t, { toValue: 2, duration: 520, easing: easeOut, useNativeDriver: nativeDriver }),
    ]);
    running.current.start(() => setMoving(null));
  };
  const load = () => {
    if (!active || d.phase !== "load") return;
    practice("sci.shape-buoyancy", true);
    const n = d.pebbles + 1;
    update(act(s, { kind: "load" }, o));
    if (n > max) {
      cheer("right", `float-sink-held-${max}`);
    } else sound(`float-sink-count-${n}`, true);
  };
  const prompt =
    d.phase === "predict" && object
      ? `float-sink-object-${object.id}`
      : d.phase === "shape"
        ? "float-sink-build"
        : d.phase === "load"
          ? d.pebbles > 0
            ? `float-sink-count-${d.pebbles}`
            : "float-sink-load"
          : d.shape === "ball"
            ? "float-sink-ball-sank"
            : `float-sink-held-${max}`;
  const title =
    d.phase === "predict" || moving
      ? "Float or sink?"
      : d.phase === "shape"
        ? "Pick a boat!"
        : d.phase === "load"
          ? "How many pebbles can it hold?"
          : d.shape === "ball"
            ? "The clay ball sank right away!"
            : `The boat held ${max} pebbles!`;
  const showResult = !!lastId && (d.phase === "predict" || (d.phase === "shape" && d.boat === 0 && d.shape === null));
  const shelfItems = d.shelf.filter((id) => id !== moving?.id);
  const tankWidth = Math.min(width, 420);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Copy style={{ fontWeight: "700", color: C.ink, flex: 1, fontSize: 20 }}>{title}</Copy>
        <IconButton icon="sound-on" label="Hear this instruction" onPress={() => sound(prompt)} />
      </View>
      {o.mode === "versus" && d.phase !== "done" && (
        <Copy style={{ fontSize: 14, color: C.ink }}>
          {d.phase === "predict"
            ? `Guess together, then each load a boat.`
            : d.phase === "pass"
              ? `${who(seat)}'s boat held ${max}.`
              : `${who(seat)}'s boat`}
        </Copy>
      )}
      {d.phase === "predict" || (d.phase === "shape" && moving) ? (
        <Water width={width}>
          {moving ? (
            <Animated.View
              accessible
              accessibilityLabel={`${name(moving.id)} ${moving.sinks ? "sinks" : "floats"}`}
              style={{
                position: "absolute",
                top: 0,
                alignSelf: "center",
                opacity: t.interpolate({ inputRange: [0, 1, 1.6, 2], outputRange: [1, 1, 1, 0] }),
                transform: [
                  {
                    translateX: t.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, 0, (moving.sinks ? 1 : -1) * tankWidth * 0.25],
                    }),
                  },
                  {
                    translateY: t.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0, moving.sinks ? 74 : 24, moving.sinks ? 150 : 110],
                    }),
                  },
                  { scale: t.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 1, 0.5] }) },
                ],
              }}
            >
              <ObjectArt id={moving.id} size={70} />
            </Animated.View>
          ) : object ? (
            <View style={{ position: "absolute", top: 0, alignSelf: "center" }}>
              <ObjectArt id={object.id} size={70} />
            </View>
          ) : null}
        </Water>
      ) : (
        d.phase !== "shape" && (
          <Water width={width}>
            <Animated.View
              accessible
              accessibilityLabel={`${shapeName[d.shape!]} with ${d.pebbles} pebbles${sank ? ", sunk" : ""}`}
              style={{ position: "absolute", top: 0, alignSelf: "center", transform: [{ translateY: boatY }] }}
            >
              <ObjectArt id={d.shape === "ball" ? "clay" : d.shape!} size={96} />
              <View
                style={{
                  position: "absolute",
                  top: 26,
                  left: 18,
                  width: 60,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                {Array.from({ length: Math.min(d.pebbles, 8) }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 11,
                      height: 9,
                      borderRadius: 5,
                      margin: 0.5,
                      backgroundColor: "#8E9692",
                      borderWidth: 1,
                      borderColor: C.ink,
                    }}
                  />
                ))}
              </View>
            </Animated.View>
            {d.shape !== "ball" && (
              <View
                style={{
                  position: "absolute",
                  right: 18,
                  top: 28,
                  minWidth: 54,
                  padding: 4,
                  borderRadius: 14,
                  backgroundColor: C.paper,
                  alignItems: "center",
                }}
              >
                <Copy style={{ fontSize: 30, lineHeight: 34, fontWeight: "700", color: C.ink }}>
                  {sank ? max : d.pebbles}
                </Copy>
              </View>
            )}
          </Water>
        )
      )}
      {showResult && lastId && landed && (
        <View
          accessibilityLiveRegion="polite"
          style={{ borderRadius: 14, padding: 10, backgroundColor: lastRight ? C.success : "#FCEFD2", gap: 2 }}
        >
          <Copy style={{ fontWeight: "700", color: C.ink, fontSize: 17 }}>
            {lastRight ? "You guessed it! " : "Surprise! "}
            {name(lastId)} {truth(lastId) === 0 ? "floats" : "sinks"}.
          </Copy>
          <Copy style={{ fontSize: 15, color: C.ink }}>{objects.find((x) => x.id === lastId)?.why}</Copy>
        </View>
      )}
      {(d.phase === "predict" || (d.phase === "shape" && moving)) && (object || moving) && (
        <CoachSpot active={coach.active && !moving} handAt="none">
          <View style={{ flexDirection: "row", gap: 10 }}>
            {([0, 1] as const).map((p) => (
              <PressableScale
                key={p}
                accessibilityRole="button"
                accessibilityLabel={`${p === 0 ? "Float" : "Sink"}: guess that the ${name((object ?? moving)!.id).toLowerCase()} will ${p === 0 ? "float" : "sink"}`}
                disabled={!active || !!moving}
                onPress={() => guess(p)}
                style={{
                  flex: 1,
                  minHeight: 108,
                  borderRadius: 18,
                  borderWidth: 3,
                  borderColor: p === 0 ? "#7FB6C6" : "#D9A88F",
                  backgroundColor: C.paper,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  opacity: moving ? 0.55 : 1,
                }}
              >
                <GuessPicture id={moving?.id ?? object!.id} sink={p === 1} />
                <Copy style={{ fontSize: 20, fontWeight: "700", color: C.ink }}>{p === 0 ? "Float" : "Sink"}</Copy>
              </PressableScale>
            ))}
          </View>
        </CoachSpot>
      )}
      {d.phase === "shape" && !moving && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {shapesFor(o.pace).map((shape) => (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Pick the ${shapeName[shape].toLowerCase()}`}
              key={shape}
              disabled={!active || !!moving}
              style={{
                flexGrow: 1,
                flexBasis: shapesFor(o.pace).length > 3 ? "45%" : "30%",
                minHeight: 92,
                padding: 6,
                backgroundColor: C.paper,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => {
                practice("sci.shape-buoyancy", shape !== "ball");
                update(act(s, { kind: "shape", value: shape }, o));
                sound(shape === "ball" ? "float-sink-ball-sank" : "float-sink-load", true);
              }}
            >
              <ObjectArt id={shape === "ball" ? "clay" : shape} size={54} />
              <Copy style={{ fontSize: 15, fontWeight: "700", color: C.ink }}>{shapeName[shape]}</Copy>
            </PressableScale>
          ))}
        </View>
      )}
      {d.phase === "load" && (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Add a pebble. ${d.pebbles} in the boat`}
          disabled={!active}
          onPress={load}
          style={{
            minHeight: 84,
            borderRadius: 18,
            backgroundColor: C.paper,
            borderWidth: 3,
            borderColor: "#B9C3BE",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <PebblePile size={64} />
          <Copy style={{ fontSize: 20, fontWeight: "700", color: C.ink }}>Add a pebble</Copy>
        </PressableScale>
      )}
      {(d.phase === "pass" || d.phase === "done") && (
        <View style={{ gap: 8 }}>
          <Copy style={{ fontSize: 15, color: C.ink }}>
            {d.shape === "ball"
              ? "A ball has no room for air. A bowl shape can hold air and float."
              : `One more pebble was too heavy for the boat.`}
          </Copy>
          {o.mode === "versus" && d.phase === "done" && (
            <Copy style={{ fontWeight: "700", color: C.ink, fontSize: 17 }}>
              {who(0)}: {d.held[0]} · {who(1)}: {d.held[1]}
            </Copy>
          )}
          {d.phase === "pass" && (
            <Button
              onPress={() => update(act(s, { kind: "pass" }, o))}
            >{`Pass to ${who(((s.starter + 1) % 2) as 0 | 1)}`}</Button>
          )}
        </View>
      )}
      {d.shelf.length > 0 && (d.phase === "predict" || d.phase === "shape") && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {([0, 1] as const).map((p) => (
            <View
              key={p}
              accessible
              accessibilityLabel={`${p === 0 ? "Floats" : "Sinks"} shelf: ${
                shelfItems
                  .filter((id) => truth(id) === p)
                  .map(name)
                  .join(", ") || "empty"
              }`}
              style={{
                flex: 1,
                backgroundColor: p === 0 ? "#E4F1F4" : "#F6E8DE",
                borderRadius: 12,
                padding: 6,
                minHeight: 64,
              }}
            >
              <Copy style={{ fontSize: 13, fontWeight: "700", color: C.ink }}>{p === 0 ? "Floats" : "Sinks"}</Copy>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
                {shelfItems
                  .filter((id) => truth(id) === p)
                  .map((id) => (
                    <ObjectArt key={id} id={id} size={32} />
                  ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
export function Art({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: "center", overflow: "hidden" }}>
      <Water width={size} height={size * 0.6}>
        <View style={{ position: "absolute", top: size * 0.04, alignSelf: "center" }}>
          <ObjectArt id="toy-boat" size={size * 0.4} />
        </View>
      </Water>
    </View>
  );
}
