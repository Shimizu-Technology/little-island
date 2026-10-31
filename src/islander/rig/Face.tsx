import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { IslanderLook } from '../look';
import type { Pose } from './poses';
export function Face({look,pose}: {look: IslanderLook; pose: Pose}) {
  if(pose.view !== 'front') return null;
  const [x,y]=pose.joints.head, e=pose.expression, stars=pose.id==='cheer'||pose.id==='dance-1'||pose.id==='dance-3', wink=pose.id==='dance-0'||pose.id==='dance-2';
  const brows=look.brows??'soft', lash=look.lashes==='lashes'||(look.lashes===undefined&&look.presentation==='girl');
  const star=(cx:number)=>`M${cx} 4l1.4 2.7 3 .4 -2.2 2.1 .5 3 -2.7-1.4 -2.7 1.4 .5-3 -2.2-2.1 3-.4Z`;
  return <G transform={`translate(${x} ${y})`} data-expression={stars?'star-eyes':wink?'wink':e}>
    {look.cheeks!=='none'&&<G fill="#E88D7D" fillOpacity={look.cheeks==='rosy'?.65:.45} strokeWidth={0}><Ellipse cx={-16} cy={13} rx={4.6} ry={2.7}/><Ellipse cx={16} cy={13} rx={4.6} ry={2.7}/></G>}
    <Path d={e==='thinking'?'M-14 0q3-4 7-3M7-1q3 0 7 2':e==='focused'?'M-14-1l7 2M7 1l7-2':e==='surprised'?'M-14-4q3-3 7 0M7-4q3-3 7 0':brows==='straight'?'M-14-1h6M8-1h6':brows==='arched'?'M-14 0q3-5 7-1M7-1q4-4 7 1':'M-14-1q3-2 7 0M7-1q3-2 7 0'} fill="none" strokeWidth={brows==='bold'?2.6:2.1}/>
    {stars?<Path d={star(-10)+star(10)} fill="#F6CD71" strokeWidth={1.1}/>:<G>
      {(e==='proud'||e==='sleepy'||e==='yum')&&!wink?<Path data-eyes={e==='sleepy'?'closed-arcs':undefined} d={e==='sleepy'?'M-16 7q6 8 12 0M4 7q6 8 12 0':'M-13 8q3-4 6 0M7 8q3-4 6 0'} fill="none" strokeWidth={e==='sleepy'?1.8:1.65}/>:<G fill="#302A2A" strokeWidth={0}>
        {wink?<Path d="M-13 8q3-4 6 0" fill="none" stroke="#493E38" strokeWidth={1.7}/>:<Circle cx={-9} cy={7.5} r={2.85}/>}
        <Circle cx={9} cy={7.5} r={2.85}/><Path d={`M8 6.4h.1${wink?'':'M-10 6.4h.1'}`} stroke="#FFFFFF" strokeWidth={1.4}/>
      </G>}
      {lash&&<Path d="M-12 7l-3-2M12 7l3-2" fill="none" strokeWidth={1.5}/>}
    </G>}
    <Path d={`M-.9 11Q-2 14 1 14Q3 13 1 11${e==='surprised'||stars?'':e==='thinking'?'M-2 20q3-2 5 0':e==='sleepy'?'M-2 20h4':e==='yum'?(pose.id==='drink'?'M-2 20q2-3 4 0q-2 3-4 0':'M-4 19q4 5 8 0M2 19q3-2 4 0'):e==='focused'?'M-3 20h6':'M-3 19q3 4 6 0'}`} fill="none" strokeWidth={1.15}/>
    {e==='surprised'?<Ellipse cx={0} cy={20} rx={2.6} ry={3.1} fill="#865555" strokeWidth={1.1}/>:stars?<><Path d="M-4 18H4Q4 26 0 25Q-4 25-4 18Z" fill="#865555" strokeWidth={1}/></>:null}
    {look.freckles==='freckles'&&<Path d="M-18 11h.1m4 0h.1m2 3h.1M18 11h.1m-4 0h.1m-2 3h.1" stroke="#95634B" strokeWidth={1.3}/>}
  </G>;
}
