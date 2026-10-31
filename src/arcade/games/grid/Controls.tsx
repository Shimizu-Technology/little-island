import { PressControl, useSwipe } from "../../Input";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Animated, Platform, View, type ViewStyle } from "react-native";
import { Copy } from "../../../components/ui";
import { Text } from "../../../components/Text";
import { nativeDriver, useReducedMotion } from "../../../components/motion";
import { directions, type Direction } from "./rules";
export function useGridInput(active: boolean, move: (d: Direction) => void, repeat = false, onTap?: () => void) {
  const latest = useRef({ active, move, repeat });
  useLayoutEffect(() => {
    latest.current = { active, move, repeat };
  }, [active, move, repeat]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const keys: Record<string, Direction> = {
      ArrowUp: "up",
      ArrowRight: "right",
      ArrowDown: "down",
      ArrowLeft: "left",
      w: "up",
      d: "right",
      s: "down",
      a: "left",
    };
    const key = (e: KeyboardEvent) => {
      if (
        latest.current.active &&
        keys[e.key] &&
        (!e.repeat || latest.current.repeat) &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        latest.current.move(keys[e.key]);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return useSwipe(active, move, 16, undefined, onTap);
}
/** Retain a winning touch target until its finger is up, including a held repeat. */
export function useGridTouch() {
  const [touching, setTouching] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const release = () => setTouching(false);
    window.addEventListener("blur", release);
    return () => window.removeEventListener("blur", release);
  }, []);
  return {
    touching,
    handlers: {
      onTouchStart: () => setTouching(true),
      onTouchEnd: () => setTouching(false),
      onTouchCancel: () => setTouching(false),
    },
  };
}
export function DirectionPad({
  active,
  onMove,
  horizontal = false,
  repeat = false,
}: {
  active: boolean;
  onMove: (d: Direction) => void;
  horizontal?: boolean;
  repeat?: boolean;
}) {
  const icons = { up: "↑", right: "→", down: "↓", left: "←" };
  return (
    <View style={{ alignItems: "center", gap: 5 }}>
      <View style={{ width: horizontal ? 218 : 178, height: horizontal ? 118 : 108, position: "relative" }}>
        {directions.map((d) => (
          <PressControl
            key={d}
            disabled={!active}
            repeat={repeat ? { das: 170, arr: 120 } : undefined}
            accessibilityRole="button"
            accessibilityLabel={`Move ${d}`}
            onPress={() => onMove(d)}
            style={{
              position: "absolute",
              left: d === "left" ? 0 : d === "right" ? (horizontal ? 160 : 120) : horizontal ? 80 : 60,
              top: d === "up" ? 0 : 54,
              width: 58,
              height: 50,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 17,
              backgroundColor: "#FFF0C5",
              borderColor: "#C7934F",
              borderWidth: 2,
              borderBottomWidth: 5,
            }}
          >
            <Text style={{ fontSize: 31, fontWeight: "800", color: "#384F52", lineHeight: 36 }}>{icons[d]}</Text>
          </PressControl>
        ))}
      </View>
      <Copy style={{ color: "#E6F1DF", fontSize: 12 }}>Swipe or tap · arrows on keyboard</Copy>
    </View>
  );
}
/** Transform-only decoration; gameplay positions remain live under Reduce Motion. */
export function Bob({
  children,
  style,
  enabled = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  enabled?: boolean;
}) {
  const reduced = useReducedMotion(),
    [v] = React.useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced || !enabled) {
      v.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: nativeDriver }),
        Animated.timing(v, { toValue: 0, duration: 900, useNativeDriver: nativeDriver }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [v, reduced, enabled]);
  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["-2deg", "2deg"] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export function Juice({ event, text, bump = false }: { event: number; text: string; bump?: boolean }) {
  const reduced = useReducedMotion(),
    [v] = React.useState(() => new Animated.Value(1));
  useEffect(() => {
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration: reduced ? 1 : 650, useNativeDriver: nativeDriver });
    a.start();
    return () => a.stop();
  }, [event, reduced, v]);
  if (!event) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: "38%",
        left: 0,
        right: 0,
        alignItems: "center",
        opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : -44] }) },
          { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: reduced ? [1, 1, 1] : [1.15, 1, 1] }) },
        ],
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "900",
          color: bump ? "#FFE0C1" : "#FFE282",
          textShadowColor: "#263F47",
          textShadowRadius: 3,
          textShadowOffset: { width: 0, height: 2 },
        }}
      >
        {text}
      </Text>
      {!reduced && <Text style={{ fontSize: 27, color: "#FFE282" }}>✦ · ✧ · ✦</Text>}
    </Animated.View>
  );
}

export function Shake({ event, children }: { event: number; children: React.ReactNode }) {
  const reduced = useReducedMotion(),
    [v] = React.useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!event || reduced) return;
    const a = Animated.sequence(
      [-3, 3, -2, 0].map((toValue) => Animated.timing(v, { toValue, duration: 45, useNativeDriver: nativeDriver }))
    );
    a.start();
    return () => {
      a.stop();
      v.setValue(0);
    };
  }, [event, reduced, v]);
  return <Animated.View style={{ transform: [{ translateX: v }] }}>{children}</Animated.View>;
}

export function GridBudget({ budget }: { budget: import("../../loop").FrameBudget }) {
  return (
    <Copy style={{ color: "#CFDFD5", fontSize: 11, textAlign: "center" }}>
      {budget.fps.toFixed(1)} fps · p95 {budget.p95.toFixed(1)} ms / 16.7 ms · max {budget.max.toFixed(1)} ms ·{" "}
      {budget.dropped.toFixed(2)} s clamped
    </Copy>
  );
}
