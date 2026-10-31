import React, { memo } from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import type { SharedValue } from "react-native-reanimated";
import type { OutfitId } from "../../progress";
import { ArcadeSprite, type SpritePose } from "../../Sprite";
import { BAT_RX, BAT_RY } from "../fruit-bat-flight/hull";
import { RUN_EXTRA } from "./character";
import { IslanderShape } from "../../../islander/rig/Islander";
import { backPoses, resolvePose } from "../../../islander/rig/poses";
import { useActiveIslanderLook } from "../../../islander/active";
import type { IslanderLook } from "../../../islander/look";
/** Static art per (frame, look); only the enclosing sprite opacity changes at 16 Hz. */
export const RunnerFrameArt = memo(function RunnerFrameArt({ frame, look, size = 132, front = false }: { frame: number; look: IslanderLook; size?: number; front?: boolean }) {
  const joints=backPoses[frame].joints, shoulder=joints.rightShoulder,elbow=joints.rightElbow,head=joints.head;
  return <Svg width={size*80/132} height={size} viewBox="0 0 80 132" accessible={false}><IslanderShape pose={front ? resolvePose('front', frame === 15 ? 'cheer' : frame === 14 ? 'try-again' : 'idle') : backPoses[frame]} look={look}/>{!front&&<Path d={`M${head[0]+15} ${head[1]-14}q5 6 4 14 M${shoulder[0]+3} ${shoulder[1]-2}L${elbow[0]+3} ${elbow[1]-2}`} fill="none" stroke="#FFE8A3" strokeWidth={1.3} strokeLinecap="round" opacity={.7}/>}</Svg>;
});
/** One depth root and the same 24 opacity-switched frames; no limb worklets. */
export const RunnerRig = memo(function RunnerRig({ poses }: { poses: SharedValue<SpritePose[]> }) {
  const look = useActiveIslanderLook();
  return <ArcadeSprite poses={poses} index={0} width={80} height={132}>{backPoses.map((_,i) => <ArcadeSprite key={i} poses={poses} index={i<16?80+i:RUN_EXTRA+i-16} width={80} height={132}><RunnerFrameArt frame={i} look={look}/></ArcadeSprite>)}</ArcadeSprite>;
});
function BatBody({ outfit, happy = false }: { outfit: OutfitId; happy?: boolean }) {
  return <G stroke="#392D45" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
    <Ellipse cx={45} cy={41} rx={20} ry={21} fill="#B87569"/>
    <Path d="M32 48Q39 60 55 50Q52 62 41 60Z" fill="#E6AE86" strokeWidth={0}/>
    <Path d="M51 20L51 5Q59 8 61 20M61 22L67 10Q72 15 68 28" fill="#AD797D"/>
    <Path d="M54 17L54 10L58 18M65 23L68 16L67 25" fill="#EFB3A1" strokeWidth={0}/>
    <Path d="M51 21Q64 15 70 27L75 34L69 39Q65 50 51 44Q40 34 51 21Z" fill="#DDA079"/>
    <Path d="M50 24Q56 20 60 22" fill="none" stroke="#F3C6A0" strokeWidth={2.5}/>
    {happy ? <Path d="M59 29Q63 24 67 29" fill="none"/> : <G strokeWidth={0}><Ellipse cx={62} cy={29} rx={5.5} ry={6.5} fill="#FFF3D8"/><Circle cx={64} cy={29} r={3} fill="#302B40"/><Circle cx={65} cy={27.5} r={1} fill="white"/></G>}
    <Ellipse cx={68} cy={36} rx={6} ry={4.5} fill="#F5CFAB" strokeWidth={0}/>
    <Path d="M70 32L75 34L70 36Z" fill="#392D45" strokeWidth={1}/>
    <Path d="M64 40Q68 43 71 38" fill="none" strokeWidth={1.5}/>
    <Ellipse cx={58} cy={38} rx={3} ry={2} fill="#E89287" strokeWidth={0}/>
    <Path d="M32 57L28 63M44 61L41 66" fill="none" strokeWidth={3}/>
    {outfit === "sunhat" ? <G stroke="#77513C" strokeWidth={1.3}><Path d="M52 17Q51 5 61 6Q71 5 72 17Z" fill="#F5CE78"/><Path d="M53 14H71" stroke="#DE846B" strokeWidth={3}/><Ellipse cx={62} cy={18} rx={17} ry={3} fill="#FFE4A0"/></G> : outfit === "explorer" ? <G><Path d="M49 28L74 29" stroke="#427E82" strokeWidth={3}/><Path d="M55 24Q62 21 70 25V34Q62 38 55 33Z" fill="#8CE7D6" fillOpacity={.55} stroke="#427E82" strokeWidth={1.4}/></G> : outfit === "starlight" ? <G fill="#FFE79B" stroke="#956B44" strokeWidth={1}><Path d="M55 5L57 10L62 11L58 14L59 19L55 16L51 19L52 14L48 11L53 10Z"/><Path d="M44 41L46 45L50 46L47 49L47 53L43 51L40 53L41 48L38 46L42 45Z"/></G> : null}
  </G>;
}
function BatWing({ far = false }: { far?: boolean }) {
  // A real 96px frame, with its shoulder at its centre. No zero-size native layers.
  return <Svg width={96} height={96} viewBox="-48 -48 96 96" accessible={false}><G stroke="#392D45" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
    <Path d="M0 0Q-12-25-40-32L-35-9Q-24-18-20 4Q-13-5-10 11Z" fill={far ? "#75618B" : "#A487BC"}/>
    <Path d="M0 0Q-18-20-37-28M-2 1L-27-12M-5 4L-18-1" stroke={far ? "#9E86AD" : "#DBC6E6"} strokeWidth={1.4} fill="none"/>
    <Path d="M-35-26L-31-17" stroke="#EEE1EF" strokeWidth={2} opacity={far ? .25 : .65}/>
  </G></Svg>;
}
export const BatRig = memo(function BatRig({ poses, outfit, debug = false }: { poses: SharedValue<SpritePose[]>; outfit: OutfitId; debug?: boolean }) {
  return <ArcadeSprite poses={poses} index={0} width={96} height={76}>
    <ArcadeSprite poses={poses} index={31} width={96} height={96}><BatWing far/></ArcadeSprite>
    <Svg width={96} height={76} viewBox="0 0 96 76"><BatBody outfit={outfit}/></Svg>
    <ArcadeSprite poses={poses} index={32} width={96} height={96}><BatWing/></ArcadeSprite>
    {debug && <Svg width={96} height={76} style={{position:"absolute"}}><Ellipse cx={48} cy={38} rx={BAT_RX} ry={BAT_RY} stroke="#72FFB7" strokeWidth={1.5} fill="#72FFB722"/><Circle cx={45} cy={32} r={2} fill="#FFDC72"/><Circle cx={43} cy={38} r={2} fill="#FFDC72"/></Svg>}
  </ArcadeSprite>;
});
export function CharacterPortrait({ bat, size, outfit, happy = false, dizzy = false, back = false, frame }: { bat: boolean; size: number; outfit: OutfitId; happy?: boolean; dizzy?: boolean; back?: boolean; frame?: number }) {
  const look = useActiveIslanderLook();
  return bat ? <Svg width={size} height={size} viewBox="-10 -14 100 100" accessible={false}><Ellipse cx={43} cy={77} rx={31} ry={4} fill="#374B5B" opacity={.18}/><G transform="translate(45 32) rotate(-35) translate(-48 -48)"><BatWing far/></G><BatBody outfit={outfit} happy={happy}/><G transform="translate(43 38) rotate(-14) translate(-48 -48)"><BatWing/></G></Svg> : <Svg width={size} height={size} viewBox="-26 -2 132 136" accessible={false}><Ellipse cx={40} cy={131} rx={29} ry={4} fill="#4C6171" opacity={.2}/><IslanderShape pose={back ? backPoses[frame ?? 0] : resolvePose("front", happy ? "cheer" : dizzy ? "try-again" : "idle")} look={look}/></Svg>;
}
