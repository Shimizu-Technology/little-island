import React, { memo, useEffect, useId } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { useReducedMotion } from "../components/motion";
import type { ArcadeId, WorldId } from "./types";

import { worldPalettes, nightPalettes, worldMotifs } from "./worlds";
export const scenePalette = (game?: ArcadeId, world: WorldId = "w1") => (game === "shell-song" ? nightPalettes : worldPalettes)[world];

/** Original vector scenery. Static art is memoized; only the small ambient layer moves. */
export const WorldArt = memo(function WorldArt({ game, world = "w1" }: { game?: ArcadeId; world?: WorldId }) {
  const id = useId().replace(/:/g, ""), night = game === "shell-song", p = scenePalette(game, world), motif = worldMotifs[world];
  return <><Svg width="100%" height="100%" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" accessible={false}>
    <Defs><LinearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1"><Stop stopColor={p.top}/><Stop offset=".58" stopColor={p.water}/><Stop offset="1" stopColor={p.sand}/></LinearGradient><LinearGradient id={`${id}-sand`} x1="0" y1="0" x2="0" y2="1"><Stop stopColor={night ? "#CCC0D8" : "#E8D8AA"}/><Stop offset="1" stopColor={night ? "#8E8AAE" : "#B4CFB5"}/></LinearGradient></Defs>
    <Rect width={600} height={900} fill={`url(#${id}-sea)`}/>
    <G fill={p.accent} stroke={p.accent} opacity={.18}>{Array.from({ length: motif.count }, (_, i) => {
      const x = 35 + i * 530 / motif.count, y = 110 + i % 3 * 56;
      return motif.kind === "leaves" ? <Path key={i} d={`M${x} ${y}q-22-32 10-48q18 28-10 48Z`}/> : motif.kind === "pearls" ? <Circle key={i} cx={x} cy={y} r={10 + i % 3 * 3} fill="none" strokeWidth={3}/> : motif.kind === "ripples" ? <Path key={i} d={`M${x-20} ${y}q20-12 40 0`} fill="none" strokeWidth={3}/> : <Path key={i} d={`M${x} ${y-10}l3 7l8 3l-8 3l-3 7l-3-7l-8-3l8-3Z`}/>;
    })}</G>
    {night ? <>
      {Array.from({ length: 26 }, (_, i) => <Circle key={i} cx={(i * 103 + 18) % 600} cy={(i * 71 + 22) % 340} r={i % 4 === 0 ? 2.8 : 1.3} fill="#FFF1CE" opacity={.4 + i % 3 * .2}/>)}
      <Path d="M0 350Q90 319 166 353T330 352T600 345V600H0Z" fill="#3A678E"/>
      <Path d="M0 396Q94 358 202 397T401 394T600 393M0 445Q120 418 260 452T600 446M70 480Q160 463 225 482M360 471H530" fill="none" stroke="#A8CFDB" strokeWidth={5} opacity={.4}/>
      <Path d="M0 555Q170 482 350 540T600 517V900H0Z" fill={`url(#${id}-sand)`}/>
      <Path d="M0 555Q170 482 350 540T600 517" fill="none" stroke="#E4E2F3" strokeWidth={13} opacity={.65}/>
      <Path d="M24 0Q102 71 54 203M600 225Q533 132 590 11" stroke="#162E43" strokeWidth={21} fill="none"/>
      <Path d="M60 88Q5 50 0 90L60 88Q91 27 157 44L60 88Q122 70 155 125L60 88Q105 118 97 159M580 122Q522 69 475 98L580 122Q513 122 514 171L580 122Q589 70 600 65" fill="#244D5E"/>
      {[32, 508].map((x, i) => <G key={x} transform={`translate(${x} ${700 + i * 55})`}><Path d="M0 30L19 0L38 28L22 22L18 45L11 25Z" fill="#F4CD8E" stroke="#997F8D" strokeWidth={2}/><Circle cx={16} cy={17} r={2} fill="#997F8D"/></G>)}
    </> : <>
      <Circle cx={110} cy={-5} r={145} fill="#FFF2A4" opacity={.3}/>
      <Path d="M15 0L95 0L365 750H218ZM170 0H205L580 690H500M355 0H375L600 345V480Z" fill="#FFFCD6" opacity={.12}/>
      {[0, 1, 2, 3].map(i => <Path key={i} d={`M-40 ${155 + i * 122}Q85 ${100 + i * 122} 196 ${160 + i * 122}T409 ${151 + i * 122}T650 ${165 + i * 122}`} stroke="#B3F6DB" strokeWidth={3} opacity={.14} fill="none"/>)}
      <Path d="M0 740Q154 660 322 726T600 708V900H0Z" fill={`url(#${id}-sand)`}/>
      <Path d="M-20 824Q167 770 327 827T640 814" stroke="#FFF3C8" strokeWidth={3} opacity={.4} fill="none"/>
      {[18, 545].map((x, i) => <G key={x} transform={`translate(${x} ${660 + i * 25})`}><Path d="M0 160Q33 87 8 10Q62 84 23 160M20 160Q43 102 60 54Q67 130 40 160M0 160Q-25 102 -15 62Q16 115 10 160" fill={i ? "#227E79" : "#329A83"}/></G>)}
      <G stroke="#AD5B74" strokeWidth={13} fill="none" strokeLinecap="round"><Path d="M56 892V815M56 851L28 831V800M56 828L78 806V781M541 892V831M541 859L566 846V820"/></G>
      <G fill="#EEAB87" stroke="#9E6069" strokeWidth={2}><Ellipse cx={100} cy={878} rx={32} ry={18}/><Ellipse cx={507} cy={890} rx={38} ry={20}/></G>
      {Array.from({ length: 11 }, (_, i) => <Ellipse key={i} cx={(i * 89 + 18) % 600} cy={790 + (i * 29) % 108} rx={3 + i % 3} ry={2} fill="#738F8A" opacity={.35}/>)}
      <G transform="translate(500 250)" opacity={.4} fill="#C5F2CE"><Path d="M0 0Q-25-20-43 0Q-25 20 0 0L14-10V10ZM-48 18Q-66 5-80 18Q-66 31-48 18L-39 10V26Z"/></G>
    </>}
  </Svg>{night && <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} accessible={false}><Circle cx="84%" cy="13%" r={65} fill="#FFF1CE" opacity={.07}/><Circle cx="84%" cy="13%" r={48} fill="#FFF1CE" opacity={.1}/><Circle cx="84%" cy="13%" r={31} fill="#FFF1CE"/><Circle cx="84%" cy="13%" r={9} fill="#E1CCA5" opacity={.5}/></Svg>}</>;
});
function Ambient({ night, active }: { night: boolean; active: boolean }) {
  const reduced = useReducedMotion(), drift = useSharedValue(0);
  useEffect(() => {
    drift.value = 0;
    if (active && !reduced) drift.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(drift);
  }, [active, reduced, drift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -drift.value * 24 }, { translateX: drift.value * 9 }], opacity: .4 + drift.value * .35 }));
  return <Animated.View style={[StyleSheet.absoluteFill, style]}><Svg width="100%" height="100%" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" accessible={false}>{[0, 1, 2, 3, 4, 5].map(i => <Circle key={i} cx={30 + (i * 113) % 550} cy={140 + (i * 139) % 620} r={night ? 2.5 : 4 + i % 3 * 3} fill={night ? "#FFE49B" : "none"} stroke={night ? "none" : "#BEF5E6"} strokeWidth={2}/>)}</Svg></Animated.View>;
}
function SeaGrass({ active, right = false }: { active: boolean; right?: boolean }) {
  const reduced = useReducedMotion(), sway = useSharedValue(0);
  useEffect(() => { sway.value = 0; if (active && !reduced) sway.value = withRepeat(withTiming(1, { duration: right ? 3100 : 2600, easing: Easing.inOut(Easing.sin) }), -1, true); return () => cancelAnimation(sway); }, [active, reduced, right, sway]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${sway.value * (right ? -5 : 5)}deg` }] }));
  return <Animated.View style={[{ position: "absolute", bottom: 7, left: right ? undefined : -16, right: right ? -16 : undefined, width: 90, height: 170 }, style]}><Svg width={90} height={170} viewBox="0 0 90 170" accessible={false}><Path d="M20 170Q58 76 26 4Q87 84 43 170M38 170Q65 100 83 54Q88 130 56 170M18 170Q-4 105 3 69Q39 132 30 170Z" fill={right ? "#27877F" : "#3A9D87"} stroke="#63B39B" strokeWidth={1.5}/></Svg></Animated.View>;
}
export function ArcadeScene({ game, world = "w1", active = true }: { game?: ArcadeId; world?: WorldId; active?: boolean }) {
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><WorldArt game={game} world={world}/><Ambient night={game === "shell-song"} active={active}/>{game !== "shell-song" && <><SeaGrass active={active}/><SeaGrass active={active} right/></>}</View>;
}
