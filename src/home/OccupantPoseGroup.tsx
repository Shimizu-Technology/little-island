import React, {useEffect, type ReactNode} from 'react';
import Animated, {cancelAnimation, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
/** Pose-keyed host: swap geometry atomically, then reveal the complete new silhouette.
 * Never rotate a standing rig through the old lying viewport. */
export function OccupantPoseGroup({width,height,mirrored,reduced,children}:{width:number;height:number;mirrored:boolean;reduced:boolean;children:ReactNode}){
 const opacity=useSharedValue(reduced?1:0);
 useEffect(()=>{
  opacity.set(reduced?1:withTiming(1,{duration:120}));
  return()=>{cancelAnimation(opacity);opacity.set(1);};
 },[opacity,reduced]);
 const animated=useAnimatedStyle(()=>({opacity:opacity.get()}));
 return <Animated.View pointerEvents="none" style={[{width,height,transform:[{translateX:0},{translateY:0},{rotate:'0deg'},{scaleX:mirrored?-1:1},{scaleY:1}]},animated]}>{children}</Animated.View>;
}
