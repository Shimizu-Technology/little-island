import React, { memo } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import type { SharedValue } from "react-native-reanimated";
import { ArcadeSprite, type SpritePose } from "../../Sprite";

/** Trunk edges retain the original 28px collision width and exact gap endpoints. */
export const FlightPalm = memo(function FlightPalm({ bottom = false }: { bottom?: boolean }) {
  return <Svg width={46} height={660} viewBox="0 0 46 660" accessible={false}>
    <G transform={bottom ? "translate(46 660) rotate(180)" : undefined} strokeLinejoin="round">
      <Defs><LinearGradient id="flight-bark" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#51384C"/><Stop offset=".27" stopColor="#A56968"/><Stop offset=".62" stopColor="#C78975"/><Stop offset="1" stopColor="#583D4E"/></LinearGradient></Defs>
      <Path d="M10-4H36L36 639Q23 646 10 639Z" fill="url(#flight-bark)" stroke="#302C43" strokeWidth={3}/>
      <Path d="M15 0L15 633M30 0L30 632" stroke="#E8AD89" strokeWidth={2} opacity={.7}/>
      {Array.from({ length: 16 }, (_, i) => <G key={i}><Path d={`M11 ${i * 42}q12 9 24 2`} fill="none" stroke="#634253" strokeWidth={2.5}/><Path d={`M20 ${i * 42 + 13}q6 3 13 1`} fill="none" stroke="#E0A383" strokeWidth={1.5}/></G>)}
      <Path d="M23 631Q7 626 2 641L8 640Q15 646 23 645Q31 646 38 640L44 641Q39 626 23 631Z" fill="#2D725F" stroke="#244C4F" strokeWidth={2}/>
      <Rect x={1} y={639} width={44} height={17} rx={5} fill="#397E68" stroke="#244C4F" strokeWidth={3}/>
      <Path d="M4 645Q22 642 42 645M9 651H37" stroke="#94C397" strokeWidth={2} fill="none"/>
    </G>
  </Svg>;
});
const ForestBand = memo(function ForestBand({ near }: { near: boolean }) {
  return <Svg width={780} height={660} viewBox="0 0 780 660" accessible={false}>
    <G fill={near ? "#163D4A" : "#69859B"} opacity={near ? .66 : .3}>
      {[0, 1].map(repeat => [25, 170, 320].map((offset, i) => {
        const x = repeat * 390 + offset, y = 270 + i % 2 * 45;
        return <G key={`${repeat}-${i}`}>
          <Path d={`M${x-7} 650Q${x+14} 440 ${x} ${y}h10q28 220 12 ${650-y}Z`}/>
          <Path d={`M${x+5} ${y+8}q-53-62-91-8q49-25 91 8q43-64 91-9q-53-20-91 9q-56 2-65 52q40-28 65-52q50 3 67 48q-41-28-67-48Z`}/>
        </G>;
      }))}
    </G>
  </Svg>;
});
/** Quiet, looping mid/far silhouettes leave the bat, fruit and gap edges dominant. */
export const FlightForest = memo(function FlightForest({ poses, debug = false }: { poses: SharedValue<SpritePose[]>; debug?: boolean }) {
  return <>
    {[0, 1].map(i => <ArcadeSprite key={i} poses={poses} index={34 + i} width={780} height={660}><ForestBand near={i === 1}/></ArcadeSprite>)}
    <Svg width={390} height={660} style={{ position: "absolute" }} accessible={false}>
      <Path d="M0 642Q54 631 109 643T218 642T327 643T436 642V660H0Z" fill="#173D48"/>
      <Path d="M0 647Q40 639 79 647T158 647T237 647T316 647T395 647" fill="none" stroke="#8FB69B" strokeWidth={3}/>
      {[20, 85, 145, 215, 280, 350].map((x, i) => <Circle key={x} cx={x} cy={654 + i % 2 * 3} r={1} fill="#D8D19E" opacity={.6}/>)}
      {debug && <G stroke="#72FFB7" strokeWidth={1} opacity={.8}><Path d="M0 10H390M0 650H390"/></G>}
    </Svg>
  </>;
});
/** Repeated shore texture travels at foreground speed, independent of the trunk slots. */
export const FlightShore = memo(function FlightShore({ poses }: { poses: SharedValue<SpritePose[]> }) {
  return <>{[0, 1].map(i => <ArcadeSprite key={i} poses={poses} index={36 + i} width={390} height={22}><Svg width={390} height={22} viewBox="0 0 390 22" accessible={false}><Rect width={390} height={22} fill="#BFA982"/><Path d="M0 3H390" stroke="#F4DAA5" strokeWidth={4}/>{Array.from({length:13},(_,j)=><G key={j}><Ellipse cx={j*31+8} cy={12+j%2*4} rx={6} ry={1.5} fill="#8F856F"/><Circle cx={j*31+24} cy={17} r={1.5} fill="#F3E2BC"/></G>)}</Svg></ArcadeSprite>)}</>;
});
export const FlightSky = memo(function FlightSky({ storm = false }: { storm?: boolean }) {
  return <Svg width={390} height={660} viewBox="0 0 390 660" accessible={false}>
    <Defs><LinearGradient id="flight-sky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={storm ? "#14283E" : "#192440"}/><Stop offset=".55" stopColor={storm ? "#365469" : "#4D5576"}/><Stop offset="1" stopColor="#AB777B"/></LinearGradient></Defs>
    <Rect width={390} height={660} fill="url(#flight-sky)"/>
    <Circle cx={304} cy={105} r={44} fill="#FFF0C0" opacity={.13}/><Circle cx={304} cy={105} r={34} fill="#FFF2D4"/><Circle cx={295} cy={95} r={25} fill="#FFF8E5" opacity={.55}/>
    {Array.from({length:31},(_,i)=><Circle key={i} cx={(i*137+21)%390} cy={(i*71+29)%360} r={i%5===0?2:1} fill="#FFF2D5" opacity={i%3===0?.8:.48}/>)}
    <Path d="M0 390Q44 355 79 385Q125 340 185 382Q242 352 288 387Q345 348 390 378V660H0Z" fill="#8F7B8B" opacity={.55}/>
    <Path d="M0 443Q57 416 110 444Q174 401 246 439Q304 415 390 442V660H0Z" fill="#536878"/>
    <Path d="M0 506Q61 495 125 507Q187 489 252 509Q320 492 390 508V660H0Z" fill="#34566A"/>
    <Path d="M0 544Q47 540 91 547T181 545T274 546T390 545" stroke="#B9C9BF" strokeWidth={3} fill="none" opacity={.35}/>
    {storm && <Path d="M38 88l-19 38M176 56l-19 38M355 226l-19 38" stroke="#B9CDD8" strokeWidth={2} opacity={.5}/>}
  </Svg>;
});
export const FlightWideSky = memo(function FlightWideSky() {
  return <Svg width="100%" height="100%" viewBox="0 0 1000 660" preserveAspectRatio="none" accessible={false}>
    <Defs><LinearGradient id="flight-wide-sky" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#192440"/><Stop offset=".55" stopColor="#4D5576"/><Stop offset="1" stopColor="#AB777B"/></LinearGradient></Defs>
    <Rect width={1000} height={660} fill="url(#flight-wide-sky)"/>
    {Array.from({length:42},(_,i)=><Circle key={i} cx={(i*223+37)%1000} cy={(i*79+17)%360} r={i%6===0?2:1} fill="#FFF2D5" opacity={.55}/>)}
    <Path d="M0 395Q100 350 200 392T400 389T600 391T800 390T1000 392V660H0Z" fill="#8F7B8B" opacity={.5}/>
    <Path d="M0 448Q100 403 200 445T400 439T600 444T800 441T1000 444V660H0Z" fill="#536878"/>
    <Path d="M0 511Q125 488 250 507T500 507T750 506T1000 507V660H0Z" fill="#34566A"/>
  </Svg>;
});
export function ShellMedal({ score }: { score: number }) {
  const fill = score >= 30 ? "#F4D687" : score >= 15 ? "#DCE5E0" : score >= 5 ? "#D99D7A" : "#C9DECF";
  return <Svg width={78} height={78} viewBox="0 0 78 78" accessible={false}><Circle cx={39} cy={39} r={36} fill="#FFF4D7"/><Circle cx={39} cy={39} r={31} fill="#E8C68E"/><Path d="M39 16Q57 11 63 31Q65 49 48 60H30Q13 49 15 31Q21 11 39 16Z" fill={fill} stroke="#8E674F" strokeWidth={2.5}/><Path d="M39 21V57M39 27Q24 24 21 36M39 27Q54 24 57 36M39 35Q25 35 24 46M39 35Q53 35 54 46M39 43Q30 45 30 52M39 43Q48 45 48 52" stroke="#FFF7DD" strokeWidth={2.6} fill="none" strokeLinecap="round"/><Path d="M29 59H49" stroke="#8E674F" strokeWidth={3}/></Svg>;
}
