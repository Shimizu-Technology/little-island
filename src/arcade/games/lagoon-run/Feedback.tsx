import React from 'react';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import { useReducedMotion } from '../../../components/motion';
import type { SpritePose } from '../../poses';
const Glints=Animated.createAnimatedComponent(Path);
/** Reuses rule-owned pickup lifetimes; no timers, engine fields or extra actor slots. */
export function PickupGlints({poses}:{poses:SharedValue<SpritePose[]>}) {
  const reduced=useReducedMotion();
  const props=useAnimatedProps(()=>{
    let d='';
    if(!reduced)for(let i=0;i<15;i++){
      const p=poses.value[132+i],t=p?.opacity??0;if(t<=0)continue;
      for(let j=0;j<4;j++){
        const a=j*Math.PI/2+.4,r=14+(1-t)*35,x=p.x+24+Math.cos(a)*r,y=p.y+24+Math.sin(a)*r,h=3*t;
        d+=`M${x-h} ${y}h${h*2}M${x} ${y-h}v${h*2}`;
      }
    }
    return {d:d||'M0 0'};
  });
  return <Svg width={390} height={660} style={{position:'absolute'}} accessible={false}><Glints animatedProps={props} fill="none" stroke="#FFF8D8" strokeWidth={2.5} strokeLinecap="round"/></Svg>;
}
