import React from 'react';
import { G, Path } from 'react-native-svg';
import { shoeColors, skinTones, type IslanderLook } from '../look';
import type { Point } from './poses';
export function Shoes({look,foot,back,lifted,compact}: {look:IslanderLook;foot:Point;back:boolean;lifted:boolean;compact:boolean}) {
 const [x,y]=foot, style=look.shoes??'sneakers', color=shoeColors[look.shoeColor??'cream'];
 const boot=style==='boots'||style==='rain-boots', open=style==='sandals'||style==='flip-flops';
 const sole=back&&lifted&&!compact;
 return <G data-shoe={style} transform={`translate(${x} ${y}) scale(1.15 1)`} strokeWidth={1.15}>
   <Path d={sole?'M-4.6-5Q0-9 4.6-5L5 1Q0 5-5 1Z':boot?'M-3.5-12H3.5L4-3Q7-2 6 1Q0 3-5 1L-4-3Z':'M-4-3Q0-7 4-3L5.5 0Q5.5 3 0 3Q-5.5 3-5.5 0Z'} fill={open?skinTones[look.skinTone]:color}/>
   <Path data-sole={sole?'lifted':'ground'} d={(sole?'M-3-4Q0-6 3-4L3 0Q0 2-3 0Z':'M-5.5 0Q0 2 5.5 0V2Q0 4-5.5 2Z')+(!open&&!boot&&!compact?'M-3-9H3L3.2-5H-3.2ZM-3-7H3':'')} fill="#FFF2D8"/>
   <Path d={sole?'M-1-3h2m-2 3h2':open?style==='sandals'?'M-4-3h8M-4-1h8':'M-4-3L0-1L4-3':boot?style==='boots'?'M-3-10h6M-2-7h4M-2-5h4M-2-3h4':'M-4-11h8M-3-9h6':'M-2-4l4 2m-4 0l4-2M-4 0Q0-3 4 0'} fill="none" stroke={open?color:back?'#B9A88D':'#7C766E'} strokeWidth={open?2: .85}/>
 </G>;
}
