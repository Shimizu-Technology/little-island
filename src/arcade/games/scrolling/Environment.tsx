import React, { memo } from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import type { WorldId } from "../../types";
import { ArcadeSprite, type SpritePose } from "../../Sprite";
import type { SharedValue } from "react-native-reanimated";
import { SCENE_COUNT, SCENE_START, TEXTURE_START, TEXTURE_COUNT } from "./environmentPoses";
import { palette } from "./Art";
const SideObject = memo(function SideObject({ index, world }: { index: number; world: WorldId }) {
  const [,,sea,sand]=palette("lagoon-run",world),kind=index%4;
  return <Svg width={100} height={140} viewBox="0 0 100 140" accessible={false}><Ellipse cx={50} cy={135} rx={36} ry={5} fill="#28595A" opacity={.2}/><G stroke="#54614C" strokeWidth={2} strokeLinejoin="round">
    {kind===0 ? <G><Path d="M43 133Q58 83 50 36" stroke="#956C4D" strokeWidth={9} fill="none"/><Path d="M50 39Q14 8 3 47Q27 32 50 39Q79 8 98 42Q73 32 50 39Q12 38 12 72Q29 50 50 39Q86 36 90 74Q70 51 50 39Z" fill="#52866A"/><Circle cx={48} cy={48} r={5} fill="#A97B51"/></G>
    : kind===1 ? <G><Path d="M23 134V87H78V134" fill={world==="w4" ? "#C5B888" : "#C69C70"}/><Path d="M10 91L49 54L90 91Z" fill={world==="w2" ? "#C48B86" : "#A57A59"}/><Path d="M40 134V104H58V134" fill="#597164"/><Path d="M19 94H82" stroke={sand} strokeWidth={5}/></G>
    : kind===2 ? <G fill={world==="w5" ? "#8A85A2" : "#8AA298"}><Path d="M9 133L17 105L42 92L57 105L82 108L94 133Z"/><Path d="M34 130L44 105L66 97L78 132" fill={world==="w5" ? "#AEA2BA" : "#ADC1AA"}/><Path d="M17 124Q30 112 38 118" fill="none" stroke="#C8D7BE"/></G>
    : <G><Path d="M48 137V79" stroke="#9D795B" strokeWidth={7}/><Path d="M28 85Q1 59 11 116Q34 125 48 108Q56 81 83 91Q101 123 68 132H26" fill="#78A07A"/>{world==="w3" ? <G fill="#F1B1B7"><Circle cx={24} cy={104} r={7}/><Circle cx={73} cy={111} r={7}/></G> : world==="w6" ? <G fill="#EDCE72"><Circle cx={24} cy={104} r={7}/><Circle cx={73} cy={111} r={7}/></G> : <Path d="M50 79L51 65" stroke={sea} strokeWidth={4}/>}</G>}
  </G></Svg>;
});
export const RunEnvironment = memo(function RunEnvironment({ poses, world }: { poses: SharedValue<SpritePose[]>; world: WorldId }) {
  return <>{Array.from({length:SCENE_COUNT},(_,i)=><ArcadeSprite key={i} poses={poses} index={SCENE_START+i} width={100} height={140}><SideObject index={i} world={world}/></ArcadeSprite>)}{Array.from({length:TEXTURE_COUNT},(_,i)=><ArcadeSprite key={`t${i}`} poses={poses} index={TEXTURE_START+i} width={16} height={5}><Svg width={16} height={5}><Path d="M1 3L6 1M10 3L14 2" stroke="#B89B6C" opacity={.5} strokeWidth={1.5}/></Svg></ArcadeSprite>)}</>;
});
/** Far landmarks remain fixed and use six distinct silhouettes. */
export function Landmark({ world }: { world: WorldId }) {
  return <G stroke="#547E7D" strokeWidth={2} fill="#83AAA0" opacity={.8}>
    {world==="w1" ? <Path d="M7 207Q19 172 46 177L77 207ZM20 191Q26 173 30 186"/>
    : world==="w2" ? <G><Path d="M7 208V191L33 171L61 191V208M320 208V190L345 167L375 191V208"/><Path d="M60 188Q192 160 320 188" fill="none"/>{[95,135,175,215,255,295].map((x,i)=><Path key={x} d={`M${x} ${177-i%2*3}l10 3-6 13Z`} fill={i%2 ? "#F2C679":"#DDA18E"} strokeWidth={0}/>)}</G>
    : world==="w3" ? <G fill="#AD8FA9"><Path d="M4 209Q13 188 22 205Q29 167 46 196Q60 173 70 209M313 209Q320 173 337 193Q354 164 364 195Q375 185 387 209"/><Circle cx={37} cy={186} r={6}/></G>
    : world==="w4" ? <G><Path d="M5 209L25 168L45 209M38 209L65 155L94 209M295 209L323 171L348 209M333 209L366 153L389 209"/><Path d="M54 181L62 166L70 181" fill="#E1E8C6" strokeWidth={0}/></G>
    : world==="w5" ? <G fill="#A3A3B9"><Path d="M3 209L14 186H30L38 175H57L78 209M308 209L327 175H345L359 188H380L390 209"/><Path d="M20 189V204M338 180L347 203" stroke="#D9C4CB"/></G>
    : world==="w6" ? <G fill="#CBA37D"><Path d="M5 207L18 183L26 199L39 169L52 200L68 184L79 207M315 207L329 185L342 195L354 164L369 194L382 182L390 207"/><Circle cx={354} cy={173} r={8} fill="#FFE0A0" strokeWidth={0}/></G>
    : <G fill="#96C3AE"><Path d="M12 209V181H68V209M24 181V173H57V181M323 209V183H379V209"/><Path d="M33 192H47M40 186V200M338 191H356" stroke="#E6ECC0"/></G>}
  </G>;
}
const Canopy = memo(function Canopy({ near }: { near: boolean }) {
  return <Svg width={780} height={660} viewBox="0 0 780 660" accessible={false}><G fill={near?"#244C56":"#567A80"} opacity={near?.43:.25}>{[0,130,260,390,520,650,780].map((x,i)=><G key={x}><Path d={`M${x-9} 650Q${x+16} 380 ${x} ${170+i%3*30}h12q28 250 6 480Z`}/><Path d={`M${x+6} ${182+i%3*30}q-75-80-105-4q57-25 105 4q71-77 103 0q-57-26-103 0q-70 3-80 62q47-35 80-62q64 2 80 64q-43-38-80-64Z`}/></G>)}</G></Svg>;
});
export const FlightEnvironment = memo(function FlightEnvironment({ poses, debug = false }: { poses: SharedValue<SpritePose[]>; debug?: boolean }) {
  return <>{[0,1].map(i=><ArcadeSprite key={i} poses={poses} index={34+i} width={780} height={660}><Canopy near={i===1}/></ArcadeSprite>)}<Svg width={390} height={660} style={{position:"absolute"}} accessible={false}><Path d="M0 650H390V660H0Z" fill="#314E4D"/><Path d="M0 650Q40 642 79 650T158 650T237 650T316 650T395 650" stroke="#94AC87" strokeWidth={3} fill="none"/>{debug && <G stroke="#72FFB7" strokeWidth={1} opacity={.8}><Path d="M0 10H390M0 650H390"/></G>}</Svg></>;
});
