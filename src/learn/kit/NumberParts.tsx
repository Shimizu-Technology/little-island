import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { Text } from "../../components/Text";
import { C, PressableScale } from "../../components/ui";
import { easeInOut, easeOut, nativeDriver, useReducedMotion } from "../../components/motion";
import { winding } from "./numbers";
import { CoachSpot } from "../Coach";

const ink = C.ink;

/* ───────────────────────── Reef pictures ───────────────────────── */

/** A side-view sea turtle (easy to name). `coral` is the second player's orange turtle. */
export function Turtle({ size = 40, coral = false }: { size?: number; coral?: boolean }) {
  const shell = coral ? "#E07B55" : "#2F8A74",
    dark = coral ? "#9C432D" : "#1B5A4B",
    skin = coral ? "#F4C29A" : "#A8D5A2";
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 100 72" accessible={false}>
      <Ellipse cx="27" cy="61" rx="10" ry="7" fill={skin} stroke={ink} strokeWidth="2.5" />
      <Ellipse cx="63" cy="61" rx="10" ry="7" fill={skin} stroke={ink} strokeWidth="2.5" />
      <Path d="M11 50 L1 55 L12 58Z" fill={skin} stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
      <Circle cx="83" cy="39" r="14" fill={skin} stroke={ink} strokeWidth="2.5" />
      <Circle cx="87" cy="35" r="3" fill={ink} />
      <Path d="M83 45 Q89 50 95 44" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M7 56 Q10 9 45 8 Q80 9 82 56 Z" fill={shell} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <Path
        d="M30 22 L45 17 L60 22 L60 38 L45 44 L30 38 Z M30 22 L20 17 M60 22 L70 18 M30 38 L16 46 M60 38 L74 46 M45 44 L45 56"
        fill="none"
        stroke={dark}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <Rect x="5" y="52" width="80" height="7" rx="3.5" fill={dark} />
    </Svg>
  );
}
/** The tide: a rolling blue wave that races the shared turtle in "With a grown-up". */
export function Tide({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 100 72" accessible={false}>
      <Path
        d="M4 68 Q8 26 46 14 Q78 6 92 30 Q74 18 60 30 Q52 40 66 46 Q50 52 46 68 Z"
        fill="#5B9ABA"
        stroke={ink}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <Path d="M18 58 Q24 34 50 24" stroke="#D9EDF0" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Circle cx="70" cy="22" r="4" fill="#D9EDF0" />
    </Svg>
  );
}
export function WaveIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Path d="M2 34 Q4 12 22 8 Q36 6 38 20 Q30 14 25 21 Q22 28 30 30 Q18 32 14 36 Z" fill="#5B9ABA" stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M8 30 Q11 18 22 14" stroke="#D9EDF0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}
export function CrabIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <G stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 26 L3 31 M11 30 L6 36 M31 26 L37 31 M29 30 L34 36" />
        <Path d="M8 17 Q1 9 5 5 L9 10 L11 4 Q17 11 8 17 M32 17 Q23 11 29 4 L31 10 L35 5 Q39 9 32 17" fill="#D9724F" />
        <Path d="M16 17 L15 11 M24 17 L25 11" />
        <Ellipse cx="20" cy="25" rx="13" ry="9" fill="#D9724F" />
        <Circle cx="15" cy="10" r="2.6" fill="#FCFAF4" />
        <Circle cx="25" cy="10" r="2.6" fill="#FCFAF4" />
        <Path d="M16 27 Q20 30 24 27" fill="none" />
      </G>
    </Svg>
  );
}
export function ShellIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <G stroke={ink} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        <Path d="M20 35 L13 31 Q2 24 4 14 Q8 4 20 4 Q32 4 36 14 Q38 24 27 31 Z" fill="#F4B59A" />
        <Path d="M20 33 L10 12 M20 33 L20 6 M20 33 L30 12" fill="none" />
        <Rect x="14" y="31" width="12" height="6" rx="2" fill="#E8977A" />
      </G>
    </Svg>
  );
}
export function FlagIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path d="M5 22 V3" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      <Path d="M6 3 H19 L16 7.5 L19 12 H6 Z" fill={C.coral} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export type Special = "wave" | "crab" | "shell";
const specialFill: Record<Special, string> = { wave: "#CFE6F0", crab: "#F8D7C8", shell: "#FBE6C2" };
export const specialIcon = (kind: Special, size: number) =>
  kind === "wave" ? <WaveIcon size={size} /> : kind === "crab" ? <CrabIcon size={size} /> : <ShellIcon size={size} />;

export type Token = { kind: "teal" | "coral" | "tide"; at: number; label: string; active: boolean };

/** A token that hops from stone to stone. Reduce Motion places it without the hop. */
function HopToken({ x, y, w, r, token, section }: { x: number; y: number; w: number; r: number; token: Token; section: number }) {
  const reduced = useReducedMotion();
  const [pos] = useState(() => new Animated.ValueXY({ x, y }));
  const [lift] = useState(() => new Animated.Value(0));
  const last = useRef({ section });
  useEffect(() => {
    if (reduced || last.current.section !== section) {
      last.current.section = section;
      pos.setValue({ x, y });
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(pos, { toValue: { x, y }, duration: 300, easing: easeInOut, useNativeDriver: nativeDriver }),
      Animated.sequence([
        Animated.timing(lift, { toValue: 1, duration: 150, easing: easeOut, useNativeDriver: nativeDriver }),
        Animated.timing(lift, { toValue: 0, duration: 150, easing: easeOut, useNativeDriver: nativeDriver }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [x, y, section, reduced, pos, lift]);
  const h = w * 0.72;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: -w / 2,
        top: -h - r * 0.3,
        width: w,
        alignItems: "center",
        transform: [
          { translateX: pos.x },
          { translateY: Animated.add(pos.y, lift.interpolate({ inputRange: [0, 1], outputRange: [0, -16] })) },
        ],
      }}
    >
      {token.kind === "tide" ? <Tide size={w} /> : <Turtle size={w} coral={token.kind === "coral"} />}
    </Animated.View>
  );
}

/** A soft looping pulse for the stone to tap next. Reduce Motion keeps a still gold ring. */
function usePulse(on: boolean) {
  const reduced = useReducedMotion();
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!on || reduced) {
      t.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 480, easing: easeOut, useNativeDriver: nativeDriver }),
        Animated.timing(t, { toValue: 0, duration: 560, easing: easeOut, useNativeDriver: nativeDriver }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [on, reduced, t]);
  return t;
}
/** A gentle side-to-side bounce, played each time `key` changes. */
export function useShake(key: number) {
  const reduced = useReducedMotion();
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!key || reduced) return;
    t.setValue(0);
    const anim = Animated.sequence(
      [8, -8, 6, -4, 0].map((v) => Animated.timing(t, { toValue: v, duration: 70, useNativeDriver: nativeDriver }))
    );
    anim.start();
    return () => anim.stop();
  }, [key, reduced, t]);
  return t;
}

function Stone({
  n,
  x,
  y,
  r,
  special,
  next,
  wrong,
  disabled,
  onPress,
  coach,
}: {
  n: number;
  x: number;
  y: number;
  r: number;
  special?: Special;
  next: boolean;
  wrong: number;
  disabled: boolean;
  onPress: () => void;
  coach: boolean;
}) {
  const pulse = usePulse(next);
  const shake = useShake(wrong);
  const hit = Math.max(22, r + 2);
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: x - hit,
        top: y - hit,
        width: hit * 2,
        height: hit * 2,
        transform: [{ translateX: shake }, { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) }],
      }}
    >
      <CoachSpot active={coach}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Stone ${n}${special ? `, ${special}` : ""}${next ? ", tap this one next" : ""}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        amount={0.9}
        style={{ width: hit * 2, height: hit * 2, alignItems: "center", justifyContent: "center" }}
      >
        <View
          style={{
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            backgroundColor: next ? "#FFF3C9" : special ? specialFill[special] : C.cream,
            borderWidth: next ? 4 : 2.5,
            borderColor: next ? "#D79A22" : "#7C9C93",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#183F39",
            shadowOpacity: 0.18,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Text style={{ fontSize: Math.round(r * 0.8), fontWeight: "900", color: ink }}>{n}</Text>
        </View>
        {special && (
          <View pointerEvents="none" style={{ position: "absolute", right: -4, top: -6 }}>
            {specialIcon(special, Math.round(r * 0.95))}
          </View>
        )}
      </PressableScale>
      </CoachSpot>
    </Animated.View>
  );
}

/**
 * A board-game reef: a winding sandy path of big round numbered stones across the water, from a
 * START dock to the FINISH island. Tokens (turtles or the tide) stand on their stones and hop.
 */
export function ReefBoard({
  width,
  height,
  first,
  last,
  end,
  section,
  tokens,
  specials,
  next,
  wrong,
  disabled,
  onStone,
  coach,
}: {
  width: number;
  height: number;
  first: number;
  last: number;
  end: number;
  section: number;
  tokens: Token[];
  specials: Record<number, Special>;
  next: number | null;
  wrong: { n: number; key: number };
  disabled: boolean;
  onStone: (n: number) => void;
  coach: boolean;
}) {
  const layout = React.useMemo(() => {
    // Leave room for the dock and its START sign, and for the island's palm and flag.
    const guess = Math.min(30, Math.max(18, Math.sqrt((width * height) / (last - first + 1)) * 0.3));
    return winding(width, height, last - first + 1, {
      top: last === end ? guess * 1.5 : 10,
      bottom: first === 0 ? guess * 0.9 : 0,
      startInset: first === 0 ? guess * 0.5 : 0,
      endInset: last === end ? guess * 0.7 : 0,
    });
  }, [width, height, first, last, end]);
  const { points, r } = layout;
  const at = (n: number) => points[n - first];
  const start = points[0],
    goal = points[points.length - 1];
  const tw = Math.round(r * 2.3);
  const label = tokens.map((t) => `${t.label} on ${t.at === 0 ? "the start dock" : `stone ${t.at}`}`).join(". ");
  return (
    <View
      accessibilityLabel={`Reef path from ${first === 0 ? "the start dock" : `stone ${first}`} to ${
        last === end ? "the finish island" : `stone ${last}`
      }. ${label}.`}
      style={{ width, height, alignSelf: "center" }}
    >
      <Svg width={width} height={height} style={{ position: "absolute" }} accessible={false}>
        <Rect x="0" y="0" width={width} height={height} rx="20" fill="#BFE3E6" />
        {Array.from({ length: Math.round((width * height) / 22000) }, (_, i) => {
          const wx = ((i * 97) % Math.max(1, width - 40)) + 14,
            wy = ((i * 61) % Math.max(1, height - 30)) + 14;
          return <Path key={i} d={`M${wx} ${wy} q6 -5 12 0 t12 0`} stroke="#9FD0D6" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
        })}
        <Path d={layout.d} stroke="#E9D3A3" strokeWidth={r * 2 + 16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={layout.d} stroke="#F5E6C4" strokeWidth={r * 2 + 6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {first === 0 && (
          <G>
            <Rect x={start.x - r * 1.35} y={start.y - r * 1.1} width={r * 2.7} height={r * 2.2} rx="6" fill="#B98A5E" stroke={ink} strokeWidth="2.5" />
            {[-0.55, 0, 0.55].map((k) => (
              <Path key={k} d={`M${start.x - r * 1.35} ${start.y + k * r} H${start.x + r * 1.35}`} stroke="#8A5F3A" strokeWidth="2" />
            ))}
            <Rect x={start.x - r * 1.25} y={start.y + r * 1.2} width={r * 2.5} height={r * 0.85} rx="6" fill={C.cream} stroke={ink} strokeWidth="2" />
            <SvgText x={start.x} y={start.y + r * 1.82} fontSize={r * 0.58} fontWeight="900" fontFamily="Avenir Next, Helvetica, Arial, sans-serif" fill={ink} textAnchor="middle">
              START
            </SvgText>
          </G>
        )}
        {last === end && (
          <G>
            <Path d={`M${goal.x + r * 0.9} ${goal.y - r * 0.6} Q${goal.x + r * 1.1} ${goal.y - r * 1.6} ${goal.x + r * 0.55} ${goal.y - r * 2.4}`} stroke="#8A5F3A" strokeWidth={r * 0.24} fill="none" strokeLinecap="round" />
            <Path
              d={`M${goal.x + r * 0.55} ${goal.y - r * 2.4} q${-r} ${-r * 0.1} ${-r * 1.2} ${r * 0.6} M${goal.x + r * 0.55} ${goal.y - r * 2.4} q${r} ${-r * 0.2} ${r * 1.1} ${r * 0.6} M${goal.x + r * 0.55} ${goal.y - r * 2.4} q${-r * 0.1} ${-r * 0.6} ${-r * 0.8} ${-r * 0.4}`}
              stroke="#4E8F5B"
              strokeWidth={r * 0.32}
              fill="none"
              strokeLinecap="round"
            />
            <Ellipse cx={goal.x} cy={goal.y + r * 0.25} rx={r * 1.6} ry={r * 1.35} fill="#E9C98A" stroke={ink} strokeWidth="2.5" />
            <Ellipse cx={goal.x} cy={goal.y + r * 0.1} rx={r * 1.3} ry={r * 1.05} fill="#F5E2B5" />
            <Path d={`M${goal.x - r * 0.9} ${goal.y - r * 0.7} V${goal.y - r * 2.5}`} stroke={ink} strokeWidth="3" strokeLinecap="round" />
            <Path
              d={`M${goal.x - r * 0.88} ${goal.y - r * 2.5} h${r * 1.15} l${-r * 0.32} ${r * 0.42} l${r * 0.32} ${r * 0.42} h${-r * 1.15} Z`}
              fill={C.coral}
              stroke={ink}
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </G>
        )}
        {last !== end && (
          <Path
            d={`M${goal.x - 10} ${goal.y - r - 5} l10 -9 l10 9`}
            stroke={ink}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </Svg>
      {points.map((p, i) => {
        const n = first + i;
        if (n === 0) return null;
        return (
          <Stone
            key={n}
            n={n}
            x={p.x}
            y={p.y}
            r={r}
            special={specials[n]}
            next={next === n}
            wrong={wrong.n === n ? wrong.key : 0}
            disabled={disabled}
            onPress={() => onStone(n)}
            coach={coach && next === n}
          />
        );
      })}
      {tokens.map((t, i) => {
        if (t.at < first || t.at > last) return null;
        const p = at(t.at);
        const together = tokens.filter((o) => o.at === t.at).length > 1;
        const dx = together ? (i === 0 ? -r * 0.55 : r * 0.55) : 0;
        return <HopToken key={i} x={p.x + dx} y={p.y} w={tw} r={r} token={t} section={section} />;
      })}
    </View>
  );
}

/** For long paths: a thin race line with the dock, the island flag and both tokens. */
export function RaceBar({ end, tokens, width }: { end: number; tokens: Token[]; width: number }) {
  const w = width - 56;
  return (
    <View
      accessibilityLabel={tokens.map((t) => `${t.label}: ${end - t.at} to go`).join(". ")}
      style={{ flexDirection: "row", alignItems: "center", gap: 6, height: 34 }}
    >
      <View style={{ width: 18, height: 12, backgroundColor: "#B98A5E", borderRadius: 3, borderWidth: 1.5, borderColor: ink }} />
      <View style={{ width: w, height: 30, justifyContent: "center" }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: "#F5E6C4", borderWidth: 1.5, borderColor: "#C9AE78" }} />
        {tokens.map((t, i) => (
          <View key={i} style={{ position: "absolute", left: (t.at / end) * (w - 30), top: i === 0 ? -2 : 8 }}>
            {t.kind === "tide" ? <Tide size={30} /> : <Turtle size={30} coral={t.kind === "coral"} />}
          </View>
        ))}
      </View>
      <FlagIcon size={22} />
    </View>
  );
}

/* ───────────────────────── Spinner and dice ───────────────────────── */

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};
function DieFace({ n, size }: { n: number; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Rect x="4" y="4" width="92" height="92" rx="20" fill={C.paper} stroke={ink} strokeWidth="5" />
      {(PIPS[n] ?? []).map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r="9" fill={ink} />
      ))}
    </Svg>
  );
}
const WEDGE = ["#E1B251", "#E58C6C", "#6FB3A2"];
function SpinnerFace({ size, lit }: { size: number; lit: number | null }) {
  const wedge = (i: number) => {
    const a0 = ((-90 - 60 + i * 120) * Math.PI) / 180,
      a1 = ((-90 + 60 + i * 120) * Math.PI) / 180;
    return `M50 50 L${50 + 46 * Math.cos(a0)} ${50 + 46 * Math.sin(a0)} A46 46 0 0 1 ${50 + 46 * Math.cos(a1)} ${50 + 46 * Math.sin(a1)} Z`;
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Circle cx="50" cy="50" r="48" fill={C.paper} stroke={ink} strokeWidth="4" />
      {[0, 1, 2].map((i) => (
        <Path key={i} d={wedge(i)} fill={WEDGE[i]} opacity={lit === null || lit === i + 1 ? 1 : 0.45} stroke={ink} strokeWidth="2.5" />
      ))}
      {[0, 1, 2].map((i) => {
        const a = ((-90 + i * 120) * Math.PI) / 180;
        return (
          <SvgText key={i} x={50 + 32 * Math.cos(a)} y={50 + 32 * Math.sin(a) + 8} fontSize="23" fontWeight="900" fontFamily="Avenir Next, Helvetica, Arial, sans-serif" fill={ink} textAnchor="middle">
            {i + 1}
          </SvgText>
        );
      })}
    </Svg>
  );
}
function Arrow({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Path d="M50 29 L57 46 L50 54 L43 46 Z" fill={ink} stroke={C.paper} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="50" cy="50" r="9" fill={C.coral} stroke={ink} strokeWidth="3" />
    </Svg>
  );
}

/**
 * The big thing to tap on your turn: a 1–2–3 spinner (Gentle), one die or two dice.
 * When `spin` changes it visibly spins or tumbles, lands on `values`, then calls `onLanded`.
 */
export function Spinner({
  kind,
  values,
  spin,
  onLanded,
  onPress,
  disabled,
  size,
  label,
  rolling,
}: {
  kind: "spinner" | "die" | "dice";
  values: number[];
  /** True from the tap until `onLanded` (the Board owns it). */
  rolling: boolean;
  spin: number;
  onLanded: () => void;
  onPress: () => void;
  disabled: boolean;
  size: number;
  label: string;
}) {
  const reduced = useReducedMotion();
  const target = values[0] ?? 1;
  const [turn] = useState(() => new Animated.Value(values.length ? (target - 1) * 120 : 0));
  const [face, setFace] = useState<number[]>([]);
  const landed = useRef(onLanded);
  const angle = useRef(values.length ? (target - 1) * 120 : 0);
  useEffect(() => {
    landed.current = onLanded;
  }, [onLanded]);
  useEffect(() => {
    if (!spin) return;
    let ticker: ReturnType<typeof setInterval> | null = null;
    const done = () => {
      if (ticker) clearInterval(ticker);
      landed.current();
    };
    if (reduced) {
      angle.current = (target - 1) * 120;
      turn.setValue(angle.current);
      const t = setTimeout(done, 250);
      return () => clearTimeout(t);
    }
    if (kind !== "spinner") {
      let k = 0;
      ticker = setInterval(() => {
        k++;
        setFace(values.map((_, i) => 1 + ((k * (3 + i) + i) % 6)));
      }, 90);
    }
    const startAt = angle.current;
    const finish = Math.ceil(startAt / 360) * 360 + 3 * 360 + (target - 1) * 120;
    angle.current = kind === "spinner" ? finish : Math.ceil((startAt + 400) / 360) * 360;
    const anim =
      kind === "spinner"
        ? Animated.timing(turn, { toValue: finish, duration: 1300, easing: easeOut, useNativeDriver: nativeDriver })
        : Animated.sequence([
            Animated.timing(turn, { toValue: startAt + 400, duration: 700, easing: easeOut, useNativeDriver: nativeDriver }),
            Animated.timing(turn, { toValue: Math.ceil((startAt + 400) / 360) * 360, duration: 220, easing: easeOut, useNativeDriver: nativeDriver }),
          ]);
    anim.start(({ finished }) => finished && done());
    return () => {
      anim.stop();
      if (ticker) clearInterval(ticker);
    };
    // Spin only when asked; the landing values come from the saved roll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin]);
  const shown = rolling && kind !== "spinner" && face.length ? face : values;
  const rotate = turn.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] });
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      amount={0.93}
      style={{ width: kind === "dice" ? size * 1.9 : size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      {kind === "spinner" ? (
        <View style={{ width: size, height: size }}>
          <SpinnerFace size={size} lit={rolling || !values.length ? null : target} />
          <Animated.View style={{ position: "absolute", width: size, height: size, transform: [{ rotate }] }}>
            <Arrow size={size} />
          </Animated.View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: size * 0.1 }}>
          {(shown.length ? shown : kind === "dice" ? [5, 2] : [5]).map((n, i) => (
            <Animated.View key={i} style={{ transform: [{ rotate: i ? turn.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "-360deg"] }) : rotate }] }}>
              <DieFace n={n} size={size * 0.86} />
            </Animated.View>
          ))}
        </View>
      )}
    </PressableScale>
  );
}

/* ───────────────────────── Market pictures ───────────────────────── */

export function Mango({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Path d="M27 9C9 3 2 20 9 31C17 43 37 31 34 18Z" fill="#F0B84B" stroke="#9A6A1F" strokeWidth="2" />
      <Path d="M12 26 Q16 32 24 31" stroke="#E58C3C" strokeWidth="3" fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M25 10Q26 1 36 4Q34 12 25 10" fill="#4E8F5B" stroke="#2C5E3A" strokeWidth="1.5" />
    </Svg>
  );
}
/** A wooden crate holding ten mangoes (two rows of five you can count). */
export function Crate({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.72} viewBox="0 0 100 72" accessible={false}>
      {Array.from({ length: 10 }, (_, i) => (
        <Ellipse key={i} cx={14 + (i % 5) * 18} cy={14 + Math.floor(i / 5) * 14} rx="8.5" ry="7.5" fill="#F0B84B" stroke="#9A6A1F" strokeWidth="1.5" />
      ))}
      <Path d="M3 30L97 30 92 70 8 70Z" fill="#C99362" stroke="#6E4426" strokeWidth="3" strokeLinejoin="round" />
      <Path d="M7 44H93M8 57H92M28 30V70M72 30V70" stroke="#6E4426" strokeWidth="2.5" />
    </Svg>
  );
}
/** A pretend shell coin with its value. */
export function ShellCoin({ size = 40, value }: { size?: number; value: number }) {
  const fill = value === 1 ? "#F8E3C8" : value === 5 ? "#F4B59A" : value === 10 ? "#BFE0D6" : "#E8C7EC";
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Path d="M20 37 L13 33 Q1 26 3 14 Q7 3 20 3 Q33 3 37 14 Q39 26 27 33 Z" fill={fill} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="20" cy="19" r="11" fill={C.paper} stroke={ink} strokeWidth="1.5" />
      <SvgText x="20" y={value >= 10 ? 23.5 : 24} fontSize={value >= 10 ? 12 : 14} fontWeight="900" fontFamily="Avenir Next, Helvetica, Arial, sans-serif" fill={ink} textAnchor="middle">
        {value}
      </SvgText>
    </Svg>
  );
}

const PEOPLE = [
  { name: "Auntie", skin: "#B87452", shirt: C.coral, hair: "#2E211B" },
  { name: "Kiko", skin: "#8E5A3B", shirt: "#2F8A74", hair: "#1F1712" },
  { name: "Grandpa", skin: "#D49A72", shirt: C.blue, hair: "#E9E6DF" },
  { name: "Mia", skin: "#E2B08A", shirt: "#E1B251", hair: "#5A3A26" },
] as const;
export const customerName = (who: number) => PEOPLE[who % PEOPLE.length].name;
/** A friendly named customer. `happy` raises their arms and widens the smile. */
export function Customer({ who, size = 100, happy = false }: { who: number; size?: number; happy?: boolean }) {
  const p = PEOPLE[who % PEOPLE.length];
  const kind = who % PEOPLE.length;
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 100 115" accessible={false}>
      <G stroke={ink} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {happy ? (
          <Path d="M24 76 L10 50 M76 76 L90 50" stroke={p.skin} strokeWidth="9" />
        ) : (
          <Path d="M24 78 L16 100 M76 78 L84 100" stroke={p.skin} strokeWidth="9" />
        )}
        <Path d="M20 113 Q18 76 50 70 Q82 76 80 113 Z" fill={p.shirt} />
        {kind === 0 && <Circle cx="50" cy="14" r="11" fill={p.hair} />}
        {kind === 3 && (
          <>
            <Circle cx="22" cy="36" r="10" fill={p.hair} />
            <Circle cx="78" cy="36" r="10" fill={p.hair} />
          </>
        )}
        <Circle cx="50" cy="42" r="25" fill={p.skin} />
        {kind === 0 && <Path d="M25 40 Q26 16 50 16 Q74 16 75 40 Q64 26 50 28 Q36 26 25 40 Z" fill={p.hair} />}
        {kind === 1 && <Path d="M26 38 Q24 14 50 15 Q78 14 74 38 L68 28 L60 32 L52 25 L44 32 L36 26 Z" fill={p.hair} />}
        {kind === 2 && (
          <>
            <Path d="M25 44 Q24 30 32 26 M75 44 Q76 30 68 26" stroke={p.hair} strokeWidth="7" />
            <Path d="M40 54 Q50 49 60 54" stroke={p.hair} strokeWidth="5" />
          </>
        )}
        {kind === 3 && <Path d="M26 40 Q27 17 50 17 Q73 17 74 40 Q62 28 50 31 Q38 28 26 40 Z" fill={p.hair} />}
      </G>
      <Circle cx="41" cy="42" r="3.3" fill={ink} />
      <Circle cx="59" cy="42" r="3.3" fill={ink} />
      {happy ? (
        <>
          <Path d="M38 55 Q50 68 62 55 Z" fill="#7A2E22" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
          <Circle cx="33" cy="52" r="4" fill="#E58C8C" opacity={0.7} />
          <Circle cx="67" cy="52" r="4" fill="#E58C8C" opacity={0.7} />
        </>
      ) : (
        <Path d="M42 56 Q50 62 58 56" stroke={ink} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
    </Svg>
  );
}
/** A woven basket outline drawn behind the packed things. */
export function BasketShape({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 100" preserveAspectRatio="none" style={{ position: "absolute" }} accessible={false}>
      <Path d="M6 14 H194 L178 96 H22 Z" fill="#E2B985" stroke="#8A5F3A" strokeWidth="3" strokeLinejoin="round" />
      {[34, 54, 74].map((y) => (
        <Path key={y} d={`M${6 + (y - 14) * 0.2} ${y} H${194 - (y - 14) * 0.2}`} stroke="#B98A5E" strokeWidth="2.5" />
      ))}
      <Rect x="2" y="8" width="196" height="12" rx="6" fill="#C99362" stroke="#8A5F3A" strokeWidth="3" />
    </Svg>
  );
}
/** The market stall picture (used on the game card and the finish). */
export function MarketArt({ size = 160 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.62} viewBox="0 0 200 124" accessible={false}>
      <Path d="M10 40L32 8H168L190 40Z" fill={C.coral} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      <Path d="M52 8L46 40M88 8L86 40M124 8L126 40M160 8L166 40" stroke="#F6D2A6" strokeWidth="12" />
      <Path d="M24 40V120M176 40V120" stroke="#8A5F3A" strokeWidth="6" />
      <Rect x="14" y="80" width="172" height="40" rx="6" fill="#D4A878" stroke={ink} strokeWidth="3" />
      {[44, 76, 108, 140].map((x) => (
        <G key={x} transform={`translate(${x - 14} 52) scale(0.8)`}>
          <Path d="M27 9C9 3 2 20 9 31C17 43 37 31 34 18Z" fill="#F0B84B" stroke="#9A6A1F" strokeWidth="2" />
          <Path d="M25 10Q26 1 36 4Q34 12 25 10" fill="#4E8F5B" />
        </G>
      ))}
    </Svg>
  );
}
