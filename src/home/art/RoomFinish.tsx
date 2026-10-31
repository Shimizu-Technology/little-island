import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/** Shared surface finish, drawn inside the original wall and floor polygons. */
export function RoomWallFinish({ room }: { room: 'home' | 'kitchen' | 'treehouse' | 'beach' }) {
  return <G pointerEvents="none">
    <G fill="none" stroke={room === 'treehouse' ? '#70573F' : '#FFFFFF'} opacity={room === 'treehouse' ? .16 : .18} strokeWidth={2}>
      {Array.from({ length: 19 }, (_, n) => <Path key={n} d={`M${162+n*31} ${58+n*2}q4 53 0 103t1 107`}/>)}
    </G>
    <G fill="#FFFFFF" opacity={.18}>{Array.from({length:34},(_,n)=><Circle key={n} cx={177+(n*127)%552} cy={73+(n*61)%177} r={n%3===0?2:1}/>)}</G>
    {room === 'home' && <>
      <Path d="M193 59Q354 94 570 74" fill="none" stroke="#A88767" strokeWidth={2}/>
      {[225,275,326,378,429,481,532].map((x,i)=><G key={x}><Path d={`M${x} ${66+i%2*9}v9`} stroke="#92775E" strokeWidth={1.5}/><Circle cx={x} cy={78+i%2*9} r={4} fill={i%2?'#EAC7A1':'#EBCB91'} opacity={.8}/></G>)}
      <Path d="M156 105L182 101V250L157 257ZM426 110L445 112V247L426 248Z" fill="#DB968E" stroke="#745E58" strokeWidth={2}/>
      <Path d="M161 108q14 51 1 109m10-109q-10 60 1 115m262-104q-14 60-1 116" fill="none" stroke="#FFE5CB" strokeWidth={2} opacity={.8}/>
      <Path d="M481 260L580 267" stroke="#A87959" strokeWidth={9}/><Path d="M482 255L580 262" stroke="#F7D9A8" strokeWidth={5}/>
      <Rect x={496} y={216} width={21} height={40} rx={3} fill="#C88377" stroke="#45645B" strokeWidth={2}/><Rect x={523} y={226} width={15} height={32} rx={2} fill="#7EAEA6" stroke="#45645B" strokeWidth={2}/>
      <Path d="M553 260l-6-25h24l-6 26Z" fill="#DBA980" stroke="#45645B" strokeWidth={2}/><Path d="M560 237v-29m0 22q-19-7-13-18q14-2 13 18m1-10q5-18 17-13q2 11-17 13" fill="#78A277" stroke="#45645B" strokeWidth={1.5}/>
      <Path d="M91 268l27-17 4 43-33 22Z" fill="#D4A079" stroke="#45645B" strokeWidth={2}/><Path d="M99 274l13-8 2 19-14 9Z" fill="#EECDB0"/><Circle cx={105} cy={281} r={4} fill="#E9B86D"/>
      <Path d="M107 285l-8-16h29l-6 21Z" fill="#C98E70" stroke="#52695C" strokeWidth={2}/><Path d="M113 270v-57m-1 35q-23-13-29-34q24-5 29 34m2-18q10-29 32-23q-3 22-32 23m-6 41q-24-5-29-22q24-5 29 22" fill="#78A47F" stroke="#52695C" strokeWidth={2}/>
    </>}
    {room === 'kitchen' && <>
      <Path d="M184 177L313 184" stroke="#A87859" strokeWidth={8}/>
      {[200,239,278].map((x,i)=><G key={x}><Rect x={x} y={139+i%2*6} width={23} height={36} rx={4} fill={['#E0AA91','#E8CF91','#A5C6B1'][i]} stroke="#536F62" strokeWidth={1.6}/><Path d={`M${x+4} ${150+i%2*6}h15`} stroke="#FFF6DF" strokeWidth={2}/></G>)}
      <Path d="M347 208h70v29h-70Z" fill="#FFF2DB" stroke="#5B7164" strokeWidth={2}/><Path d="M355 220h54m-48 8h41" stroke="#9DB8AB" strokeWidth={1.5}/>
    </>}
    {room === 'treehouse' && <>
      <Path d="M601 69q-15 52 1 94m22-88q-14 45 1 89m25-87q-13 53 3 94" fill="none" stroke="#65906E" strokeWidth={5} opacity={.8}/>
      {[604,626,651].map((x,i)=><Path key={x} d={`M${x} ${103+i*8}q-22-13-22 4q10 11 22-4q14-12 21 3q-12 9-21-3`} fill="#83AF81" stroke="#526A50" strokeWidth={1.5}/>)}
      <Path d="M475 217l56 5v36l-56-4Z" fill="#D8B27F" stroke="#735841" strokeWidth={2}/><Path d="M481 224l42 3v23l-42-2Z" fill="#E9D0A5"/><Path d="M488 237q10-16 19 2q8-13 13 3" fill="none" stroke="#78A27B" strokeWidth={3}/>
      <Path d="M666 262h65" stroke="#765D42" strokeWidth={8}/><Path d="M671 259h56" stroke="#E2B47D" strokeWidth={5}/><Circle cx={688} cy={245} r={11} fill="#E9C277" stroke="#765D42" strokeWidth={2}/>
    </>}
    {room === 'beach' && <>
      <Path d="M72 122q-5 62 12 115m5-113q-4 62 9 111" stroke="#A68C67" strokeWidth={3} fill="none"/>
      <Path d="M64 135q20-18 29 2q-16 13-29-2m6 26q23-13 30 7q-18 10-30-7m0 28q24-12 30 10q-19 11-30-10" fill="#79A57F" stroke="#526A50" strokeWidth={1.5}/>
      <Path d="M194 107q8 59 0 129m9-125q-4 71 2 126M682 119q-12 66 0 134m-10-129q7 77-2 133" stroke="#E6B69E" strokeWidth={13} opacity={.9}/>
      <Path d="M192 111q-5 48 0 78m12-77q4 56 0 79M684 119q4 50-1 82" fill="none" stroke="#FFE2C1" strokeWidth={2}/>
      <Path d="M471 286l64 4" stroke="#8D7255" strokeWidth={8}/><Path d="M476 282l53 4" stroke="#F4DEB5" strokeWidth={4}/><Path d="M490 272q-8-18 7-19q10 5 4 19m15 3q-5-13 6-16q10 8 3 16" fill="#F6C9B3" stroke="#765D54" strokeWidth={1.5}/>
    </>}
  </G>;
}

export function RoomFloorFinish({ room }: { room: 'home' | 'kitchen' | 'treehouse' | 'beach' }) {
  return <G pointerEvents="none">
    <Path d="M220 310L421 321L538 477L372 492Z" fill="#FFF9E5" opacity={room==='beach'?.13:.19}/>
    <Path d="M230 315L352 321L463 474L389 479Z" fill="#FFF9E5" opacity={.13}/>
    {room !== 'kitchen' && <G fill="none" stroke={room==='treehouse'?'#926B4B':'#B9936F'} strokeWidth={1.25} opacity={.47}>
      {Array.from({length:13},(_,n)=><Path key={n} d={`M${166+n*47} ${327+n*2}q7 61 3 118t3 75`}/>)}
      {Array.from({length:9},(_,n)=><Path key={n} d={`M${158+n*6} ${326+n*24}L${765+n*2} ${342+n*23}`}/>)}
    </G>}
    {room!=='kitchen' && <G>
      <Ellipse cx={390} cy={454} rx={room==='beach'?158:183} ry={room==='beach'?43:55} fill={room==='treehouse'?'#D6BB8C':room==='beach'?'#E8D5AF':'#D9CDB4'} opacity={.65}/>
      <Ellipse cx={390} cy={454} rx={room==='beach'?143:168} ry={room==='beach'?34:45} fill="none" stroke="#FFF3D8" strokeWidth={3} opacity={.8}/>
      {Array.from({length:14},(_,n)=><Path key={n} d={`M${230+n*23} ${436+(n%3)*5}q7 15 0 29`} stroke={room==='treehouse'?'#BA9B6C':'#C7B398'} strokeWidth={1.4} fill="none" opacity={.62}/>)}
    </G>}
    {room==='beach' && <G fill="#B89469" opacity={.55}>{Array.from({length:32},(_,n)=><Circle key={n} cx={90+(n*97)%680} cy={367+(n*43)%144} r={n%4===0?2:1}/>)}</G>}
  </G>;
}
