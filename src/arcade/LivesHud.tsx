import React, { memo, useEffect, useRef } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useReducedMotion } from "../components/motion";
import type { Lives } from "./lives";
/** One accessibility announcement rather than five individually focusable hearts. */
export const HeartsHud = memo(function HeartsHud({ lives }: { lives: Lives }) {
  return <View accessible accessibilityLabel={`${lives.hearts} of ${lives.maxHearts} hearts`} accessibilityLiveRegion="polite" testID="hearts-hud" style={{ flexDirection: "row", gap: 3, backgroundColor: "#24536A", padding: 8, borderRadius: 18 }}>
    {Array.from({ length: lives.maxHearts }, (_, i) => <Svg key={i} width={24} height={24} viewBox="0 0 24 24" accessible={false}><Path d="M12 21C8 17 2 13 2 7C2 1 10 1 12 6C14 1 22 1 22 7C22 13 16 17 12 21Z" fill={i < lives.hearts ? "#F28B87" : "#486978"} stroke="#FFE8CE" strokeWidth={1.5}/></Svg>)}
  </View>;
});
/** Wrap only the hero/board. The sound callback owns the existing audio/haptic policy. */
export function HitReaction({ hit, onTone, children }: { hit: number; onTone: (tone: string, haptic?: boolean) => void; children: React.ReactNode }) {
  const opacity = useSharedValue(1), reduced = useReducedMotion(), previous = useRef(hit);
  useEffect(() => {
    if (hit === previous.current) return;
    previous.current = hit; onTone("bump", true);
    opacity.value = reduced ? withSequence(withTiming(.65, { duration: 80 }), withTiming(1, { duration: 80 })) : withRepeat(withSequence(withTiming(.35, { duration: 100 }), withTiming(1, { duration: 100 })), 6);
    return () => { cancelAnimation(opacity); opacity.value = 1; };
  }, [hit, onTone, opacity, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
