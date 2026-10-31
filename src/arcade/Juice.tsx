import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { Copy } from "../components/ui";
import { useReducedMotion } from "../components/motion";
import { ArcadeArt, StarDisplay } from "./Art";
import type { ArcadeId } from "./types";
import type { OutfitId } from "./progress";

/** Small isolated transforms; no animated React state or layout. `active` stops decoration behind sheets. */
export function Hero({ game, size = 100, outfit, mood = "idle", cue = 0, active = true }: { game?: ArcadeId; size?: number; outfit?: OutfitId; mood?: "idle" | "happy" | "dizzy"; cue?: number | string; active?: boolean }) {
  const reduced = useReducedMotion(), move = useSharedValue(0), reaction = useSharedValue(0);
  useEffect(() => {
    move.value = 0;
    if (active && !reduced) move.value = withRepeat(withTiming(1, { duration: 2100, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(move);
  }, [active, reduced, move]);
  useEffect(() => {
    reaction.value = 0;
    if (active && !reduced && mood !== "idle") reaction.value = withSequence(withTiming(1, { duration: 100 }), withSpring(0, { damping: 7, stiffness: 170 }));
    return () => cancelAnimation(reaction);
  }, [cue, mood, active, reduced, reaction]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -move.value * 5 - (mood === "happy" ? reaction.value * 10 : 0) }, { rotate: `${mood === "dizzy" ? reaction.value * 14 : move.value * 3 - 1.5}deg` }, { scaleX: 1 + reaction.value * .07 }, { scaleY: 1 - reaction.value * .07 }] }));
  return <View accessibilityLabel={mood === "happy" ? "Happy island friend" : mood === "dizzy" ? "Your friend is ready to try again" : undefined}><Animated.View style={style}><ArcadeArt game={game} size={size} outfit={outfit} happy={mood === "happy"} dizzy={mood === "dizzy"}/>{game === "shell-song" && <View pointerEvents="none" style={{ position: "absolute", right: -size * .12, top: size * .4 }}><Svg width={size * .5} height={size * .5} viewBox="0 0 50 50" accessible={false}><Path d="M4 40Q14 21 24 26" stroke="#F6DCA3" strokeWidth={6} fill="none" strokeLinecap="round"/><Path d="M23 28L45 4" stroke="#FFF5D9" strokeWidth={3} strokeLinecap="round"/><Circle cx={45} cy={4} r={3} fill="#FFD16D"/></Svg></View>}</Animated.View></View>;
}
function RevealStar({ filled, index, reduced }: { filled: boolean; index: number; reduced: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => { scale.value = 1; if (filled && !reduced) scale.value = withDelay(index * 360 + 100, withSequence(withTiming(1.3, { duration: 130 }), withSpring(1, { damping: 9, stiffness: 210 }))); return () => cancelAnimation(scale); }, [filled, index, reduced, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}><Svg width={64} height={72} viewBox="0 0 64 72" accessible={false}><Path d="M32 7L40 24L59 27L45 41L48 61L32 52L15 61L18 41L4 27L24 24Z" fill={filled ? "#FFCF50" : "#779AA0"} stroke={filled ? "#9C642A" : "#436873"} strokeWidth={3}/>{filled && <Path d="M32 15L28 29L14 32M45 47L46 53" stroke="#FFF5BB" strokeWidth={3} strokeLinecap="round" fill="none"/>}</Svg></Animated.View>;
}
export function StarReveal({ stars, onTone, active = true }: { stars: number; onTone: (tone: string) => void; active?: boolean }) {
  const reduced = useReducedMotion(), [shown, setShown] = useState(0), tone = useRef(onTone), revealed = useRef(0);
  useEffect(() => { tone.current = onTone; }, [onTone]);
  useEffect(() => {
    if (!active) return;
    const remaining = Math.max(0, stars - revealed.current);
    const timers = Array.from({ length: remaining }, (_, i) => setTimeout(() => { const next = ++revealed.current; setShown(next); tone.current(`shell-${next}`); }, reduced ? 0 : 220 + i * 360));
    return () => timers.forEach(clearTimeout);
  }, [stars, reduced, active]);
  return <View accessibilityLabel={`${stars} of 3 stars earned`} style={{ flexDirection: "row", gap: 9 }}>{[0, 1, 2].map(i => <RevealStar key={i} filled={i < shown} index={0} reduced={reduced}/>)}</View>;
}
export function HudPill({ icon, children, label }: { icon?: React.ReactNode; children: React.ReactNode; label?: string }) {
  return <View accessibilityLabel={label} style={{ minHeight: 44, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 24, backgroundColor: "#FFF6DF", borderWidth: 2, borderColor: "#D9C69C", flexDirection: "row", alignItems: "center", gap: 7 }}>{icon}<Copy style={{ color: "#244C55", fontWeight: "800", fontSize: 17 }}>{children}</Copy></View>;
}
export function MiniStars({ stars }: { stars: number }) { return <StarDisplay stars={stars} size={20}/>; }
function Particle({ index, fish, reduced, originY }: { index: number; fish: boolean; reduced: boolean; originY?: number }) {
  const t = useSharedValue(0);
  useEffect(() => { t.value = 0; if (!reduced) t.value = withDelay(index * 28, withTiming(1, { duration: fish ? 850 : 650, easing: Easing.out(Easing.quad) })); return () => cancelAnimation(t); }, [index, fish, reduced, t]);
  const style = useAnimatedStyle(() => ({ opacity: reduced ? 1 : 1 - t.value, transform: [{ translateX: t.value * (fish ? -110 - index * 15 : (index % 2 ? 1 : -1) * (25 + index * 9)) }, { translateY: t.value * (-35 - index % 4 * 22) }, { scale: reduced ? 1 : 1 - t.value * .3 }] }));
  return <Animated.View style={[{ position: "absolute", left: `${12 + index * 12}%`, top: fish ? `${originY === undefined ? 24 + index % 3 * 18 : originY - 4 + index % 3 * 2}%` : "55%" }, style]}><Svg width={fish ? 44 : 24} height={fish ? 30 : 32} viewBox="0 0 44 32" accessible={false}>{fish ? <><Path d="M26 16L42 4V28Z" fill="#F58282" stroke="#7C5B68" strokeWidth={2}/><Ellipse cx={17} cy={16} rx={16} ry={12} fill={index % 2 ? "#FFE194" : "#ADF3DB"} stroke="#387D88" strokeWidth={2}/><Circle cx={11} cy={13} r={2.5} fill="#254E64"/></> : <><Path d="M12 31V9L29 4V23M12 9L29 4" stroke="#FFE9A4" strokeWidth={4} fill="none"/><Ellipse cx={7} cy={27} rx={6} ry={4} fill="#FFE9A4"/><Ellipse cx={24} cy={20} rx={6} ry={4} fill="#FFE9A4"/></>}</Svg></Animated.View>;
}
/** A keyed burst lives for 1.1 seconds; Reduce Motion keeps a still celebration. */
export function ActionBurst({ text, fish = false, originY }: { text: string; fish?: boolean; originY?: number }) {
  const reduced = useReducedMotion(), t = useSharedValue(0);
  useEffect(() => { if (!reduced) t.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }); return () => cancelAnimation(t); }, [reduced, t]);
  const style = useAnimatedStyle(() => ({ opacity: reduced ? 1 : t.value < .7 ? 1 : (1 - t.value) / .3, transform: [{ translateY: reduced ? 0 : -t.value * 34 }, { scale: reduced ? 1 : 1 + Math.sin(t.value * Math.PI) * .1 }] }));
  return <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{Array.from({ length: fish ? 6 : 4 }, (_, i) => <Particle key={i} index={i} fish={fish} reduced={reduced} originY={originY}/>)}<Animated.View style={[{ position: "absolute", top: "32%", alignSelf: "center", backgroundColor: "#FFF2C9", borderRadius: 24, paddingHorizontal: 20, paddingVertical: 9, borderWidth: 3, borderColor: "#DDA044" }, style]}><Copy style={{ color: "#684321", fontSize: 25, fontWeight: "900" }}>{text}</Copy></Animated.View></View>;
}
