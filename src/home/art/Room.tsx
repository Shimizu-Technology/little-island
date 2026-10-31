import React from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { StageRoom } from "./Stage";
import type { BadgeId } from "../../badges/engine";
import type { HomeState } from "../model";
export const wallColors = { cream: "#F5E6C8", lagoon: "#C5DED3", night: "#A5ADC9", peach: "#F1CEC0", "math-lab": "#B6CABE", library: "#E7CFAD", "night-sky": "#B5BDD3", "arcade-neon": "#C9C5DA" };
export const floorColors = { sand: "#EBD7B2", honey: "#DDAE7D", seafoam: "#AACDC1", rose: "#DCB9AA", "island-breeze": "#D9C79B", "game-room": "#BCCBC0" };
export function RoomArt({theme, badges, onBadgePress}: {theme: HomeState["theme"]; badges?: readonly BadgeId[]; onBadgePress?: (id: BadgeId) => void; reduced?: boolean}) {
  return <StageRoom room="home" theme={theme} badges={badges} onBadgePress={onBadgePress}/>;
}

/** Quiet outdoor layers extend the stage below its floor in tall layouts. */
export function SkyArt() {
  return <Svg width="100%" height="100%" viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid slice" accessible={false}>
    <Rect width={800} height={1200} fill="#C5E5E1"/>
    <Path d="M0 0H800V690Q420 650 0 720Z" fill="#D8EEDE" opacity={.34}/>
    <Circle cx={650} cy={190} r={56} fill="#FFF0BA"/>
    <Circle cx={650} cy={190} r={78} fill="#FFF0BA" opacity={.13}/>
    <G fill="#F7F6E9" opacity={0.85}>
      <Path d="M50 185Q38 158 70 151Q75 116 111 131Q142 115 157 151Q189 151 187 177Q135 194 50 185Z"/>
      <Path d="M490 320Q470 295 502 286Q510 252 541 271Q575 255 585 287Q618 289 611 312Z"/>
      <Path d="M250 430q-20-14 0-24q2-21 25-16q21-8 31 10q20 0 23 16q-34 23-79 14Z" opacity={.62}/>
    </G>
    <Path d="M0 942Q180 900 360 948T800 934V1080H0Z" fill="#A6C9AA" opacity={.5}/>
    <Path d="M0 995Q220 949 412 1001T800 985V1120H0Z" fill="#91C3B2" opacity={.7}/>
    <Path d="M0 1050Q300 1010 800 1040V1200H0Z" fill="#78BCBA"/>
    <Path d="M0 1090Q230 1052 450 1093T800 1081" fill="none" stroke="#D9F3DC" strokeWidth={8} opacity={.6}/>
  </Svg>;
}
export function ShoreArt({ depth = 215 }: { depth?: number }) {
  return <Svg width="100%" height="100%" viewBox={`0 0 800 ${depth}`} accessible={false}>
    <Rect width={800} height={depth} fill="#F0D9AB"/>
    <Path d={`M0 27Q245 45 491 17T800 19V${depth}H0Z`} fill="#F7E5BA" opacity={.55}/>
    <Path d="M130 0L780 0L760 35L158 50L85 20Z" fill="#C79A70" stroke="#577162" strokeWidth={3}/>
    <Path d="M153 18L765 8M159 34L759 22" stroke="#E8BD89" strokeWidth={3}/>
    <Path d={`M0 ${depth - 45}Q180 ${depth - 83} 400 ${depth - 46}T800 ${depth - 52}V${depth}H0Z`} fill="#76BDBB"/>
    <Path d={`M0 ${depth - 46}Q180 ${depth - 84} 400 ${depth - 47}T800 ${depth - 53}`} fill="none" stroke="#FFF4D6" strokeWidth={9}/>
    <Path d={`M0 ${depth - 31}Q180 ${depth - 70} 400 ${depth - 33}T800 ${depth - 38}`} fill="none" stroke="#C2E2D5" strokeWidth={3} opacity={.8}/>
    <Path d="M723 134Q681 72 713 15" fill="none" stroke="#AE7D59" strokeWidth={13}/>
    <Path d="M712 23Q669-3 646 30Q681 17 712 23Q748-10 780 20Q746 16 712 23Q668 31 667 65Q689 44 712 23Q751 22 776 61Q740 41 712 23" fill="#649B77" stroke="#4C7861" strokeWidth={2}/>
    <G fill="none" stroke="#D7B889" strokeWidth={3}><Path d="M95 102l20-4M310 144l15 3M528 82l20-3M620 126l12 4"/></G>
    <G fill="#C5A476" opacity={.65}>{Array.from({length:38},(_,n)=><Circle key={n} cx={31+(n*103)%739} cy={31+(n*47)%Math.max(70,depth-95)} r={n%5===0?2:1}/>)}</G>
    {[ [160,99],[361,66],[570,116] ].map(([x,y],i)=><G key={x} transform={`translate(${x} ${y}) rotate(${i*29})`}><Path d="M-12 8Q-16-9-5-10Q0-16 5-10Q16-9 12 8Z" fill={i%2?'#F1C0AA':'#FFF2D6'} stroke="#B8997D" strokeWidth={2}/><Path d="M0 6V-8M-8 5l5-10M8 5L3-5" stroke="#D0A994" strokeWidth={1.2}/></G>)}
  </Svg>;
}
