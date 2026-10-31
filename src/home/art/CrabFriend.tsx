import React, { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
export type CrabPose = 'stand' | 'sit' | 'lie' | 'held';
/** Original coral crab, with a ground contact at (60, 96), in a 120×110 box. */
export const CrabFriend = memo(function CrabFriend({ pose = 'stand', size = 120, mirrored = false, reduced = false }: { pose?: CrabPose; size?: number; mirrored?: boolean; reduced?: boolean }) {
  const asleep = pose === 'lie', tucked = pose === 'sit' || pose === 'held';
  return <Svg width={size} height={size * 110 / 120} viewBox="0 0 120 110" accessible={false}><G transform={mirrored ? 'translate(120 0) rotate(0) scale(-1 1)' : 'translate(0 0) rotate(0) scale(1 1)'} stroke="#493E38" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <G transform={asleep ? 'translate(0 145) rotate(0) scale(1 -1)' : tucked ? 'translate(0 6) rotate(0) scale(1 1)' : 'translate(0 0) rotate(0) scale(1 1)'}>
      {[0,1,2].map(n=><Path key={n} d={`M37 ${68+n*6}L${tucked ? 29 : 18-n*2} ${75+n*7}l${tucked ? 5 : -6} 9M83 ${68+n*6}L${tucked ? 91 : 102+n*2} ${75+n*7}l${tucked ? -5 : 6} 9`} fill="none"/>)}
      <Path d="M35 66L23 53M85 66L97 53" fill="none" stroke="#EC9989" strokeWidth={8}/>
      <Path d="M23 56Q8 56 10 38L22 46L28 34Q40 51 23 56ZM97 56Q80 51 92 34L98 46L110 38Q112 56 97 56Z" fill="#EC9989"/>
      <Ellipse cx={60} cy={73} rx={32} ry={23} fill="#EC9989"/><Ellipse cx={60} cy={81} rx={22} ry={12} fill="#F4CC76"/>
      <Path d="M45 55V42M75 55V42" fill="none" stroke="#EC9989" strokeWidth={8}/>
      {[45,75].map(x=><G key={x}><Circle cx={x} cy={38} r={9} fill="#FFF1D3"/>{asleep ? <Path d={`M${x-4} 38q4 4 8 0`} fill="none"/> : <><Circle cx={x} cy={38} r={3} fill="#493E38"/><Circle cx={x-1} cy={37} r={1} fill="white" stroke="none"/></>}</G>)}
      <Path d="M54 72Q60 79 66 72" fill="none"/>
    </G>
    {asleep && !reduced && <Path d="M88 24h9l-9 9h9m5-19h6l-6 6h6" stroke="#79BDB1" fill="none"/>}
  </G></Svg>;
});
