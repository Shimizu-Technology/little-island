import React, {useEffect,useState} from 'react';
import {View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import {CrabFriend,type CrabPose} from './art/CrabFriend';
/** A finite tap surprise. The pet stays still when motion is reduced. */
export function CrabCompanion({pose,size,reduced,clacking}:{pose:CrabPose;size:number;reduced:boolean;clacking:boolean}){
 const [beat,setBeat]=useState(false);
 useEffect(()=>{if(!clacking||reduced)return;const timer=setInterval(()=>setBeat(v=>!v),160);return()=>clearInterval(timer);},[clacking,reduced]);
 return <View><CrabFriend pose={pose} size={size} reduced={reduced}/>{clacking&&<Svg pointerEvents="none" width={size} height={size*110/120} viewBox="0 0 120 110" style={{position:'absolute',top:0,left:0}}><>{beat&&!reduced&&<><Path d="M14 42L22 46L28 39M92 39L98 46L106 42" stroke="#493E38" strokeWidth={5}/><Path d="M14 42L22 46L28 39M92 39L98 46L106 42" stroke="#EC9989" strokeWidth={3}/></>}<Path d={beat&&!reduced?'M12 28l-4-6m15 4v-7m9 9 4-5M88 28l-4-5m13 3v-7m11 9 4-6':'M8 32l-6-2m21-5v-5m14 13 5-3M78 33l5-3m14-5v-5m15 12 6-2'} stroke="#493E38" strokeWidth={2.4} strokeLinecap="round"/></></Svg>}</View>;
}
