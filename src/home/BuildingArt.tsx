import React from 'react';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import type { Building } from './camera';
/** One roof, floor beams and shoreline tie the rooms into a single island house. */
export function BuildingArt({building:b}:{building:Building}) {
 const bottom=b.height-60;
 return <Svg width="100%" height="100%" viewBox={`0 0 ${b.width} ${b.height}`} accessible={false}>
  <Rect x={12} y={110} width={b.width-24} height={bottom-110} rx={14} fill="#D2AF7C" stroke="#597466" strokeWidth={10}/>
  <Path d={`M4 118L${b.width*.12} 12H${b.width*.88}L${b.width-4} 118Z`} fill="#C77760" stroke="#6D6751" strokeWidth={10} strokeLinejoin="round"/>
  <Path d={`M${b.width*.12} 34H${b.width*.88}M${b.width*.08} 64H${b.width*.92}M${b.width*.045} 94H${b.width*.955}`} stroke="#E8AA80" strokeWidth={7}/>
  <Circle cx={b.width/2} cy={69} r={25} fill="#F6DFA9" stroke="#756E54" strokeWidth={7}/>
  {Array.from({length:b.floors-1},(_,n)=><Rect key={n} x={12} y={b.roof+(n+1)*b.roomHeight+n*b.gap} width={b.width-24} height={b.gap} fill="#A87852"/>)}
  <Path d={`M0 ${bottom}Q${b.width*.3} ${bottom-18} ${b.width} ${bottom}V${b.height}H0Z`} fill="#ECD3A0"/>
  <Path d={`M0 ${b.height-12}Q${b.width*.25} ${b.height-36} ${b.width*.5} ${b.height-12}T${b.width} ${b.height-12}`} fill="none" stroke="#8EC8BE" strokeWidth={22}/>
  {b.floors>1&&<G stroke="#6B805C" strokeLinecap="round"><Path d={`M${b.width/2-12} ${b.roof+100}V${bottom}`} strokeWidth={18}/><Path d={`M${b.width/2+22} ${b.roof+100}V${bottom}`} strokeWidth={12}/>{Array.from({length:Math.floor((bottom-b.roof-100)/55)},(_,n)=><Path key={n} d={`M${b.width/2-12} ${b.roof+130+n*55}h34`} strokeWidth={9}/>)}</G>}
 </Svg>;
}

/** Upstairs has a timber terrace; the shoreline belongs below the ground floor. */
export function TerraceArt() {
 return <Svg width="100%" height="100%" viewBox="0 0 800 215" accessible={false}>
  <Rect width={800} height={215} fill="#D7B589"/>
  {Array.from({length:7},(_,n)=><Path key={n} d={`M0 ${n*32}H800`} stroke="#B18D64" strokeWidth={3}/>)}
  <Path d="M0 194H800M0 205H800" stroke="#F3D3A1" strokeWidth={5}/>
 </Svg>;
}
export function BuildingTrim({building:b}:{building:Building}) {
 return <Svg width="100%" height="100%" viewBox={`0 0 ${b.width} ${b.height}`} accessible={false}>
  <Path d={`M12 120V${b.height-60}M${b.width-12} 120V${b.height-60}`} stroke="#9E7856" strokeWidth={14}/>
  {Array.from({length:b.floors-1},(_,n)=>{
   const y=b.roof+(n+1)*b.roomHeight+n*b.gap;
   return <G key={n}><Rect x={12} y={y} width={b.width-24} height={b.gap} fill="#A87852"/><Path d={`M12 ${y+4}H${b.width-12}`} stroke="#E0B886" strokeWidth={4}/></G>;
  })}
  {b.floors>1&&<G stroke="#716B4F" strokeLinecap="round"><Path d={`M${b.frame+800-14} ${b.roof+355}V${b.height-100}M${b.frame+800+14} ${b.roof+355}V${b.height-100}`} strokeWidth={7}/>{Array.from({length:Math.floor((b.height-b.roof-455)/45)},(_,n)=><Path key={n} d={`M${b.frame+800-14} ${b.roof+380+n*45}h28`} strokeWidth={5}/>)}</G>}
 </Svg>;
}
