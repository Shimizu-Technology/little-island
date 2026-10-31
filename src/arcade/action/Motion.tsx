import React, { useEffect, useState } from "react";
import { Animated } from "react-native";
import { nativeDriver, useReducedMotion } from "../../components/motion";
export function Bob({ children, wiggle = false }: { children: React.ReactNode; wiggle?: boolean }) {
  const reduced = useReducedMotion(),
    [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) {
      t.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: wiggle ? 550 : 1100, useNativeDriver: nativeDriver }),
        Animated.timing(t, { toValue: 0, duration: wiggle ? 550 : 1100, useNativeDriver: nativeDriver }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [reduced, t, wiggle]);
  return (
    <Animated.View
      style={{
        transform: wiggle
          ? [{ rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["-3deg", "3deg"] }) }]
          : [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}
