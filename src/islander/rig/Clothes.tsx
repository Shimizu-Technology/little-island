import React from 'react';
import { G, Path } from 'react-native-svg';
import { buildFor, type IslanderLook } from '../look';
import type { Pose } from './poses';
type Colors = { primary: string; secondary: string; trim: string };
export function Clothes({look,pose,colors}:{look:IslanderLook;pose:Pose;colors:Colors}) {
 const sy=pose.joints.leftShoulder[1],hip=pose.joints.leftHip[1],front=pose.view==='front';
 const top=look.outfit==='mix'?look.top:look.outfit,bottom=look.outfit==='mix'?look.bottom:look.outfit;
 const skirt=['sundress','jersey-dress','skirt-tee','skirt'].includes(bottom!),separate=bottom==='skirt'||bottom==='skirt-tee';
 const build=buildFor(look), shoulder=build==='boy'?13:build==='girl'?11.5:12, waist=build==='girl'?8:10;
 if(pose.compact) return <G><Path d={`M26 ${sy}Q40 ${sy-8} 54 ${sy}Q63 122 48 127Q28 133 24 120Z`} fill={colors.primary}/><Path d={`M29 ${sy+3}Q42 ${sy} 49 ${sy+6}`} fill="none" stroke={colors.trim} strokeWidth={1.5}/></G>;
 const hem=hip+(skirt&&!separate?12:-2);
 return <G data-build={build} data-outfit={look.outfit}>
   <Path d={`M29 ${hip-4}H51L52 ${hip+5}H43L40 ${hip+1}L37 ${hip+5}H28Z`} fill={colors.secondary}/>
   <Path d={`M${40-shoulder} ${sy}Q40 ${sy-7} ${40+shoulder} ${sy}L${40+waist} ${hip-9}L${skirt&&!separate?56:52} ${hem}Q40 ${hem+4} ${skirt&&!separate?24:28} ${hem}L${40-waist} ${hip-9}Z`} fill={colors.primary}/>
   <Path d={`M${40+shoulder-3} ${sy+2}L${40+waist-3} ${hip-9}L${skirt&&!separate?51:48} ${hem}L${skirt&&!separate?56:52} ${hem}L${40+waist} ${hip-9}L${40+shoulder} ${sy}Z`} fill="#493E38" fillOpacity={.12} strokeWidth={0}/>
   {separate&&<Path data-garment="separate-skirt" d={`M30 ${hip-4}H50L57 ${hip+12}Q40 ${hip+16} 23 ${hip+12}Z`} fill={colors.secondary}/>}
   <Path d={`M30 ${hip-4}h20M34 ${sy-2}Q40 ${sy+6} 46 ${sy-2}M${skirt?27:30} ${hem-1}Q40 ${hem+2} ${skirt?53:50} ${hem-1}${skirt?`M32 ${hip+1}l-2 9M40 ${hip+2}v10M48 ${hip+1}l2 9`:''}`} fill="none" stroke={colors.trim} strokeWidth={1.2}/>
   {['polo','polo-shorts','aloha','aloha-shorts','lab-coat','explorer'].includes(top!)&&front&&<Path d={`M34 ${sy-2}L40 ${sy+5}L36 ${sy+8}L31 ${sy}M46 ${sy-2}L40 ${sy+5}L44 ${sy+8}L49 ${sy}M40 ${sy+6}V${hip-5}m0-10h.1m-.1 5h.1`} fill={colors.trim} strokeWidth={.9}/>}
   {['island','tee','skirt-tee'].includes(top!)&&front&&<Path d={`M35 ${sy+11}q5-6 10 0q-5-2-5 6q0-6-5-6ZM40 ${sy+12}l1 7M35 ${sy+19}q5-2 10 0`} fill={colors.trim} strokeWidth={.8}/>}
   {['aloha','aloha-shorts'].includes(top!)&&<G data-aloha-print="leaves"><Path d={`M31 ${sy+10}q-5-6 1-7q4 4-1 7l-2-4M45 ${sy+13}q-5-6 1-7q4 4-1 7l-2-4M36 ${sy+21}q-5-6 1-7q4 4-1 7l-2-4`} fill={colors.trim} strokeWidth={0}/></G>}
   {['hoodie','hoodie-top'].includes(top!)&&<Path d={front?`M33 ${sy-1}Q40 ${sy+9} 47 ${sy-1}M35 ${sy+3}v7m-1 0h2M45 ${sy+3}v7m-1 0h2M35 ${hip-12}q5-4 10 0l2 7H33Z`:`M32 ${sy}Q40 ${sy+18} 48 ${sy}Q40 ${sy-4} 32 ${sy}Z`} fill={colors.secondary} strokeWidth={1}/ >}
   {top==='explorer'&&<Path d={front?`M29 ${sy}L35 ${sy+2}L36 ${hip-3}H28ZM51 ${sy}L45 ${sy+2}L44 ${hip-3}H52ZM29 ${hip-12}h5v6h-5ZM46 ${hip-12}h5v6h-5Z`:`M29 ${sy}Q40 ${sy-4} 51 ${sy}L52 ${hip-3}H28ZM35 ${sy+10}h10`} fill={colors.trim} strokeWidth={1}/>}
   {top==='sundress'&&<Path d={`M31 ${sy+9}h18M33 ${sy+7}l-1-7m16 7l1-7M26 ${hem-5}Q40 ${hem-2} 54 ${hem-5}L56 ${hem}Q40 ${hem+4} 24 ${hem}Z`} fill={colors.trim} strokeWidth={.8}/>}
   {['jersey-top','jersey-dress','lagoon-jersey'].includes(top!)&&<Path d={`M35 ${sy+10}h10l-5 9M30 ${hip-5}h20`} fill="none" stroke={colors.trim} strokeWidth={1.7}/>}
   {top==='robot-tee'&&front&&<G><Path d={`M34 ${sy+11}h12v10H34Z`} fill={colors.trim} strokeWidth={1}/><Path d={`M40 ${sy+11}v-3m-4 7h2m4 0h2m-7 4q3 3 6 0`} fill="none" stroke={colors.primary} strokeWidth={1.2}/></G>}
   {top==='number-tee'&&<Path d={`M33 ${sy+11}h2v8m6-8h5l-5 8h5`} fill="none" stroke={colors.trim} strokeWidth={1.5}/>}
   {top==='board-shorts-set'&&<Path d={`M32 ${sy+12}q4-5 8 0q4 5 8 0M30 ${hip+2}h20`} fill="none" stroke={colors.trim} strokeWidth={1.8}/>}
   {top==='tank'&&<Path d={`M32 ${sy}v5q8 7 16 0v-5`} fill="none" stroke={colors.trim} strokeWidth={1.8}/>}
   {top==='overalls'&&<Path d={`M29 ${sy+5}h22M29 ${sy+9}h22M30 ${sy}l4 1 1 10h10l1-10 4-1 -2 24H32ZM36 ${sy+14}h8v6h-8ZM34 ${sy+11}h.1M46 ${sy+11}h.1`} fill={colors.secondary} strokeWidth={1}/>}
   {top==='pirate'&&<Path d={`M30 ${sy+9}h20M29 ${sy+15}h22M28 ${hip-3}l24 1 -3 5 -20-1Z`} stroke={colors.trim} fill={colors.trim} strokeWidth={2}/>}
   {top==='space-suit'&&<Path d={`M33 ${sy+8}h14v13H33ZM36 ${sy+11}h8v5h-8ZM29 ${hip-4}h22`} fill={colors.secondary} stroke={colors.trim} strokeWidth={1.2}/>}
   {top==='lab-coat'&&<Path d={front?`M29 ${sy}L35 ${sy+2}L37 ${hip+2}H27ZM51 ${sy}L45 ${sy+2}L43 ${hip+2}H53ZM30 ${hip-9}h5v5h-5ZM45 ${hip-9}h5v5h-5Z`:`M29 ${sy}Q40 ${sy-5} 51 ${sy}L53 ${hip+2}H43L40 ${hip-1}L37 ${hip+2}H27ZM40 ${sy+9}V${hip-3}`} fill="#FFF2DC" strokeWidth={1}/>}
   {['cargo-shorts','explorer'].includes(bottom!)&&<Path d={`M28 ${hip+2}h6v5h-6ZM46 ${hip+2}h6v5h-6Z`} fill={colors.primary} strokeWidth={.9}/>}
 </G>;
}
