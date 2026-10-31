import React, { useEffect, useState } from "react";
import { Animated, ViewStyle } from "react-native";
import { C, PressableScale } from "../components/ui";
import { nativeDriver, useReducedMotion } from "../components/motion";

/** Shared raised answer surface. Feedback never blocks the next answer. */
export function AnswerTile({ children, label, onPress, disabled, selected, wrong, correct, style }: {
  children: React.ReactNode; label: string; onPress: () => void; disabled?: boolean;
  selected?: boolean; wrong?: boolean; correct?: boolean; style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const [motion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if ((!wrong && !correct) || reduced) return;
    motion.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 105, useNativeDriver: nativeDriver }),
      Animated.timing(motion, { toValue: 0, duration: 145, useNativeDriver: nativeDriver }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [wrong, correct, reduced, motion]);
  return <Animated.View style={{ flex: style?.flex ?? undefined, transform: [{ translateX: wrong && !reduced ? motion.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) : 0 }, { scale: correct && !reduced ? motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) : 1 }] }}>
    <PressableScale accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} amount={0.95}
      style={[{ minHeight: 68, borderRadius: 20, borderWidth: 2, borderColor: correct ? "#4F8A66" : wrong ? C.gold : selected ? C.teal : C.line, backgroundColor: correct ? C.success : selected ? C.soft : C.paper, alignItems: "center", justifyContent: "center", padding: 10, shadowColor: C.ink, shadowOpacity: 0.18, shadowOffset: { width: 0, height: 5 }, shadowRadius: 0, elevation: 4 }, style]}>
      {children}
    </PressableScale>
  </Animated.View>;
}
