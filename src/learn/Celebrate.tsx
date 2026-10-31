import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { easeOut, nativeDriver, useReducedMotion } from "../components/motion";

const COLORS = ["#E1B251", "#C56D50", "#246858", "#386C9A", "#79AB80", "#E58C8C"];

/**
 * A short burst of stars and a big check that plays once per `burst` change (a counter).
 * It owns a clipped layout cell so no frame can paint over text or characters. Under Reduce Motion
 * shows a brief still check instead.
 */
export function Celebrate({ burst, big = false }: { burst: number; big?: boolean }) {
  const reduced = useReducedMotion();
  const [t] = useState(() => new Animated.Value(0));
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!burst) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Shows the overlay for the length of its animation.
    setVisible(true);
    t.setValue(0);
    const anim = Animated.timing(t, { toValue: 1, duration: reduced ? 500 : big ? 1100 : 750, easing: easeOut, useNativeDriver: nativeDriver });
    anim.start(({ finished }) => finished && setVisible(false));
    return () => anim.stop();
  }, [burst, big, reduced, t]);
  if (!burst) return null;
  const pieces = big ? 14 : 8;
  return (
    <View testID="celebration-cell" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: big ? 88 : 64, height: big ? 88 : 64, alignSelf: "center", overflow: "hidden", opacity: visible ? 1 : 0, alignItems: "center", justifyContent: "center" }}>
      {!reduced &&
        Array.from({ length: pieces }, (_, i) => {
          const angle = (i / pieces) * Math.PI * 2;
          const dist = big ? 30 : 20;
          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                opacity: t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
                transform: [
                  { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] }) },
                  { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] }) },
                  { scale: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.1, 0.8] }) },
                ],
              }}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path d="M12 2l2.6 6.4L21 9l-5 4.3L17.6 20 12 16.6 6.4 20 8 13.3 3 9l6.4-.6z" fill={COLORS[i % COLORS.length]} />
              </Svg>
            </Animated.View>
          );
        })}
      <Animated.View
        style={{
          opacity: t.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ scale: reduced ? 1 : t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.6, 1.08, 1] }) }],
        }}
      >
        <Svg width={big ? 56 : 40} height={big ? 56 : 40} viewBox="0 0 64 64">
          <Circle cx={32} cy={32} r={29} fill="#246858" />
          <Path d="M19 33l9 9 18-20" stroke="#FFFFFF" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}
