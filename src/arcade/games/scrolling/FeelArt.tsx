import type { WorldId } from "../../types";
import React, { memo, useEffect } from "react";
import Svg, { Circle, Defs, LinearGradient, Stop, G, Path, Rect } from "react-native-svg";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "../../../components/motion";
import { projectTrack, roadEdge } from "../lagoon-run/camera";
import { palette } from "./Art";
/** Split palms move as whole static pieces: moving gaps never wait for a React render. */
export const PalmPiece = memo(function PalmPiece({ bottom = false }: { bottom?: boolean }) {
  return <Svg width={46} height={660} viewBox="0 0 46 660"><G transform={bottom ? "translate(46 660) rotate(180)" : undefined}><Path d="M11-10H35L33 645H12Z" fill="#B77A73" stroke="#4A364F" strokeWidth={3}/>{Array.from({ length: 14 }, (_, i) => <Path key={i} d={`M12 ${i * 47}l22 8`} stroke="#744559" strokeWidth={3}/>)}<Path d="M23 640Q4 622 1 650L15 649Q23 668 30 650L45 651Q42 625 23 640" fill="#5E9D7E" stroke="#284E52" strokeWidth={3}/></G></Svg>;
});
export const TrackBackdrop = memo(function TrackBackdrop({ world }: { world: WorldId }) {
  const [sky, horizon, sea, sand] = palette("lagoon-run", world), l = roadEdge(1.18, false), r = roadEdge(1.18, true), h = projectTrack(1, 0), bankL = projectTrack(-1.5, 1.18), bankR = projectTrack(3.5, 1.18), fogL=roadEdge(.68,false), fogR=roadEdge(.68,true);
  return <Svg width={390} height={660} viewBox="0 0 390 660"><Defs><LinearGradient id="run-haze" x1="0" y1="0" x2="0" y2="100%"><Stop offset="0" stopColor="#FFF3CF" stopOpacity={.55}/><Stop offset="1" stopColor="#FFF3CF" stopOpacity={0}/></LinearGradient></Defs><Rect width={390} height={660} fill={sky}/><Circle cx={310} cy={78} r={31} fill="#FFE3A2"/><Path d="M0 211Q60 145 142 211Q245 140 390 211" fill={horizon}/><Rect y={211} width={390} height={449} fill={sea}/><Path d={`M${h.x} ${h.y}L${bankR.x} ${bankR.y}H${bankL.x}Z`} fill="#D4BA87"/><Path d={`M${h.x} ${h.y}L${r.x} ${r.y}H${l.x}Z`} fill={sand} stroke="#E9CB9B" strokeWidth={2}/>{[-.5, .5, 1.5, 2.5].map(lane => { const p = projectTrack(lane, 1.18); return <Path key={lane} d={`M${h.x} ${h.y}L${p.x} ${p.y}`} stroke="#FFF1CE" strokeWidth={lane === -.5 || lane === 2.5 ? 4 : 1.5} opacity={.8}/>; })}<Path d={`M${h.x} ${h.y}L${fogR.x} ${fogR.y}H${fogL.x}Z`} fill="url(#run-haze)"/><Path d="M0 340Q30 320 54 338M345 340Q373 318 390 330M0 470Q20 455 32 466M370 480L390 474" stroke="#B8E9DB" strokeWidth={5} fill="none"/><G stroke="#715244" strokeWidth={9} fill="#48886D"><Path d="M22 270L36 136M368 268L350 136"/><Path d="M36 139Q-10 95 0 152Q20 128 36 139Q78 96 92 141Q59 128 36 139M350 139Q310 95 295 145Q326 130 350 139Q388 97 400 149Q373 130 350 139" strokeWidth={2}/></G></Svg>;
});
export { BatRig, RunnerRig } from "./CharacterArt";

/** A finite UI animation remains visible after the terminal engine has stopped. */
export function LastHit({ dead, x, y, bat = false, children }: { dead: boolean; x: number; y: number; bat?: boolean; children: React.ReactNode }) {
  const progress = useSharedValue(0), reduced = useReducedMotion();
  useEffect(() => { progress.set(dead ? withTiming(1, { duration: 280 }) : 0); return () => cancelAnimation(progress); }, [dead, progress]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : progress.value * (bat ? 38 : 8) }, { rotate: `${reduced ? 0 : progress.value * (bat ? 2 : -.3)}rad` }] }));
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", width: 390, height: 660, transformOrigin: `${x}px ${y}px` }, style]}>{children}</Animated.View>;
}
