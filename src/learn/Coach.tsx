import React, { useEffect, useState } from "react";
import { Animated, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { easeOut, nativeDriver, useReducedMotion } from "../components/motion";

/** A friendly pointing hand. Original art in the app palette. */
export function Hand({ size = 54 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M24 30V12a5 5 0 0 1 10 0v15l2-1a5 5 0 0 1 6 2l1 1a5 5 0 0 1 6 2l1 1a5 5 0 0 1 6 3v12c0 9-7 15-16 15h-4c-6 0-10-3-13-8l-8-12a5 5 0 0 1 8-6z"
        fill="#FFF6E5"
        stroke="#183F39"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <Path d="M36 29v8M45 32v6" stroke="#183F39" strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

/**
 * Wraps the thing a child should touch first. While `active`, a ring pulses around it and a hand
 * taps it, so a non-reader can see the first move. Reduce Motion shows the ring and hand still.
 * The Board calls `coach.done()` when the child makes that move. Wrap a set of answer choices
 * with `handAt="none"` so the hand never points at one answer: the ring alone says "tap one of these".
 */
export function CoachSpot({
  active,
  children,
  style,
  handAt = "bottom-right",
}: {
  active: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  handAt?: "bottom-right" | "bottom-left" | "top-right" | "none";
}) {
  const reduced = useReducedMotion();
  const [tap] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!active || reduced) {
      tap.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tap, { toValue: 1, duration: 420, easing: easeOut, useNativeDriver: nativeDriver }),
        Animated.timing(tap, { toValue: 0, duration: 520, easing: easeOut, useNativeDriver: nativeDriver }),
        Animated.delay(380),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduced, tap]);
  const corner =
    handAt === "bottom-left"
      ? { left: -18, bottom: -30 }
      : handAt === "top-right"
        ? { right: -20, top: -26 }
        : { right: -20, bottom: -30 };
  return (
    <View style={[{ position: "relative" }, style]}>
      {children}
      {active && (
        <>
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -6,
              left: -6,
              right: -6,
              bottom: -6,
              borderRadius: 20,
              borderWidth: 4,
              borderColor: "#E1B251",
              opacity: tap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
              transform: [{ scale: tap.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
            }}
          />
          {handAt !== "none" && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                ...corner,
                transform: [
                  { translateY: tap.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                  { scale: tap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] }) },
                ],
              }}
            >
              <Hand />
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
}
