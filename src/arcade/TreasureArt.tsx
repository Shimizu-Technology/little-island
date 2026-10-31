import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { useReducedMotion } from "../components/motion";
import { StickerArt } from "./Art";
import type { StickerId } from "./progress";
/** The promised sticker is always visible, including before opening. No random reward. */
export function ChestArt({ sticker, open = false, size = 200, active = true }: { sticker: StickerId; open?: boolean; size?: number; active?: boolean }) {
  const reduced = useReducedMotion(), wiggle = useSharedValue(0);
  useEffect(() => { wiggle.value = 0; if (active && !open && !reduced) wiggle.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true); return () => cancelAnimation(wiggle); }, [active, open, reduced, wiggle]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(wiggle.value * Math.PI * 2) * 2.5}deg` }] }));
  return <View style={{ width: size, height: size * .86 }}><Animated.View style={[{ width: size, height: size * .86 }, style]}><Svg width={size} height={size * .86} viewBox="0 0 240 206" accessible={false}>
    <Ellipse cx={120} cy={188} rx={94} ry={12} fill="#4D5778" opacity={.18}/>
    {open && <G fill="#FFD268" stroke="#FFEAB1" strokeWidth={3}>{[0, 1, 2, 3, 4].map(i => <Path key={i} d="M0-9L3-3L10 0L3 3L0 10L-3 3L-10 0L-3-3Z" transform={`translate(${22 + i * 49} ${i % 2 ? 28 : 71})`}/>)}<Path d="M70 110L52 10L104 71L135 0L149 76L201 28L181 123Z" opacity={.6} stroke="none"/></G>}
    <Path d={open ? "M39 92L27 48Q118 2 211 48L201 96Z" : "M30 116V90Q30 48 74 48H166Q211 48 211 90V116Z"} fill="#B97046" stroke="#533F50" strokeWidth={5}/>
    <Path d={open ? "M48 79Q120 34 193 76" : "M45 89Q45 63 76 63H165Q192 63 196 89"} fill="none" stroke="#F2B16C" strokeWidth={6} strokeLinecap="round"/>
    <Path d="M29 111H211L200 177Q198 187 183 187H56Q42 187 40 176Z" fill="#975333" stroke="#533F50" strokeWidth={5}/>
    <Path d="M45 136H195M45 159H195" stroke="#653F3C" strokeWidth={3}/>
    <Path d="M63 111L68 186M177 111L172 186" stroke="#EAC078" strokeWidth={17}/><Path d="M29 111H211" stroke="#FFD88B" strokeWidth={13}/>
    <Rect x={101} y={109} width={38} height={43} rx={10} fill="#FFCE65" stroke="#744F3B" strokeWidth={3}/><Circle cx={120} cy={125} r={6} fill="#75453A"/><Path d="M120 126V138" stroke="#75453A" strokeWidth={5} strokeLinecap="round"/>
    <Circle cx={51} cy={124} r={3} fill="#FFE6A2"/><Circle cx={188} cy={124} r={3} fill="#FFE6A2"/>
  </Svg></Animated.View><View style={{ position: "absolute", width: size * .38, height: size * .38, left: size * .31, top: open ? -size * .04 : size * .09, backgroundColor: "#FFF6DA", borderRadius: size * .2, borderWidth: 3, borderColor: "#E8BA62", alignItems: "center", justifyContent: "center", transform: [{ rotate: open ? "-8deg" : "7deg" }] }}><StickerArt id={sticker} size={size * .32}/></View></View>;
}
