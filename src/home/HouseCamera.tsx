import React, { createContext, useEffect, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector, type PinchGesture, type PanGesture } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withDecay, withTiming } from 'react-native-reanimated';
import { boundedPan, buildingRoomAt, roomOrigin, panRange, roomCamera, softPan, type Building } from './camera';
export const CameraPan = createContext<{pan:PanGesture;pinch:PinchGesture} | undefined>(undefined);
export type HouseCameraHandle = { reveal:(index:number,box:{left:number;top:number;right:number;bottom:number},explicit?:boolean)=>void; jump:(index:number)=>void; zoomRoom:(index:number)=>void; tap:(index:number)=>void; canActivate:()=>boolean };
/** Child object drags block the empty-floor pan; pinch runs across the scene. */
export function HouseCamera({children,initialIndex,width,height,building,focusXs,scale,zoom,minZoom,maxZoom,reduced,onZoom,onRoom,onNavigate,cameraRef}:{
 children:ReactNode;focusXs?:number[];initialIndex:number;width:number;height:number;building:Building;scale:number;zoom:number;minZoom:number;maxZoom:number;reduced:boolean;
 onZoom:(zoom:number)=>void;onRoom:(index:number)=>void;onNavigate:()=>void;cameraRef:React.Ref<HouseCameraHandle>;
}) {
 const x=useSharedValue(0),y=useSharedValue(0),startX=useSharedValue(0),startY=useSharedValue(0),transient=useSharedValue(1);
 const pinchX=useSharedValue(0),pinchY=useSharedValue(0),focus=useSharedValue(initialIndex),moving=useSharedValue(false),lastPan=useSharedValue(0), pendingAxes=useSharedValue(0);
 const previous=useRef({zoom,scale,width,height}),pinchCommit=useRef(false),tapTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),lastTap=useRef(-1);
 useEffect(()=>()=>clearTimeout(tapTimer.current),[]);
 const cameraAt=(index:number)=>{const p=roomCamera(index,building,scale,width,height);return {...p,x:boundedPan(p.x+(400-(focusXs?.[index]??400))*scale,width,building.width*scale)};};
 const animate=(value:number)=>reduced?value:withTiming(value,{duration:260});
 const jump=(index:number)=>{
  focus.set(index);onRoom(index);onNavigate();
  if(zoom!==1)onZoom(1);
  else {const p=cameraAt(index);x.set(animate(p.x));y.set(animate(p.y));}
 };
 const toggle=(index:number)=>{focus.set(index);onRoom(index);onNavigate();onZoom(zoom>minZoom*1.15?minZoom:1);};
 useImperativeHandle(cameraRef,()=>({jump,zoomRoom:toggle,reveal:(index,box,explicit=false)=>{
  const origin=roomOrigin(index,building),left=(origin.x+box.left)*scale,right=(origin.x+box.right)*scale,top=(origin.y+box.top)*scale,bottom=(origin.y+box.bottom)*scale;
  if(reduced&&!explicit)return;
  let nx=width/2-(left+right)/2,ny=height/2-(top+bottom)/2;
  if(right-left<=width-32){if(left+nx<16)nx=16-left;else if(right+nx>width-16)nx=width-16-right;}
  if(bottom-top<=height-24){if(top+ny<12)ny=12-top;else if(bottom+ny>height-12)ny=height-12-bottom;}
  x.set(animate(boundedPan(nx,width,building.width*scale)));y.set(animate(boundedPan(ny,height,building.height*scale)));
 },canActivate:()=>!moving.get()&&Date.now()-lastPan.get()>300,tap:index=>{
  if(moving.get()||Date.now()-lastPan.get()<300)return;
  if(tapTimer.current&&lastTap.current===index){clearTimeout(tapTimer.current);tapTimer.current=undefined;toggle(index);}
  else {clearTimeout(tapTimer.current);lastTap.current=index;tapTimer.current=setTimeout(()=>{tapTimer.current=undefined;if(zoom<=minZoom*1.15)jump(index);else onRoom(index);},280);}
 }}));
 useLayoutEffect(()=>{
  const old=previous.current;previous.current={zoom,scale,width,height};
  if(pinchCommit.current){pinchCommit.current=false;x.set(boundedPan(x.get(),width,building.width*scale));y.set(boundedPan(y.get(),height,building.height*scale));transient.set(1);return;}
  const p=cameraAt(focus.get());
  if(old.scale!==scale&&old.width===width&&old.height===height&&!reduced){transient.set(old.scale/scale);transient.set(withTiming(1,{duration:260}));x.set(withTiming(p.x,{duration:260}));y.set(withTiming(p.y,{duration:260}));}
  else{x.set(p.x);y.set(p.y);transient.set(1);}
 // Furniture edits keep the child's camera; a fresh focus applies on room entry or viewport change.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[scale,zoom,width,height,building,reduced,focus,x,y,transient]);
 const settle=(index:number)=>{focus.set(index);onRoom(index);onNavigate();};
 const commitZoom=(next:number,index:number)=>{pinchCommit.current=true;focus.set(index);onRoom(index);onNavigate();if(next===zoom){x.set(boundedPan(x.get(),width,building.width*scale));y.set(boundedPan(y.get(),height,building.height*scale));transient.set(1);pinchCommit.current=false;}else onZoom(next);};
 const finishPan=(finished?:boolean)=>{
  'worklet';
  if(!finished)return;pendingAxes.set(pendingAxes.value-1);
  if(pendingAxes.value===0)runOnJS(settle)(buildingRoomAt((width/2-x.value)/scale,(height/2-y.value)/scale,building));
 };
 const pan=Gesture.Pan().maxPointers(1).minDistance(8)
 .onStart(()=>{pendingAxes.set(0);cancelAnimation(x);cancelAnimation(y);moving.set(true);startX.set(x.value);startY.set(y.value);})
 .onUpdate(e=>{if(e.numberOfPointers>1)return;x.set(softPan(startX.value+e.translationX,width,building.width*scale));y.set(softPan(startY.value+e.translationY,height,building.height*scale));})
 .onEnd(e=>{
  const [xmin,xmax]=panRange(width,building.width*scale),[ymin,ymax]=panRange(height,building.height*scale);
  runOnJS(onNavigate)();pendingAxes.set(2);
  x.set(reduced?boundedPan(x.value,width,building.width*scale):withDecay({velocity:e.velocityX,clamp:[xmin,xmax],rubberBandEffect:true},finishPan));
  y.set(reduced?boundedPan(y.value,height,building.height*scale):withDecay({velocity:e.velocityY,clamp:[ymin,ymax],rubberBandEffect:true},finishPan));
  if(reduced)runOnJS(settle)(buildingRoomAt((width/2-x.value)/scale,(height/2-y.value)/scale,building));
 })
 // eslint-disable-next-line react-hooks/purity -- Input callback, never evaluated while rendering.
 .onFinalize(()=>{if(moving.value){lastPan.set(Date.now());moving.set(false);}});
 const pinch=Gesture.Pinch().onStart(e=>{cancelAnimation(x);cancelAnimation(y);moving.set(true);pinchX.set(e.focalX);pinchY.set(e.focalY);startX.set(x.value);startY.set(y.value);})
 .onUpdate(e=>{const ratio=Math.max(minZoom,Math.min(maxZoom,zoom*e.scale))/zoom;transient.set(ratio);x.set(e.focalX-(pinchX.value-startX.value)*ratio);y.set(e.focalY-(pinchY.value-startY.value)*ratio);})
 // eslint-disable-next-line react-hooks/refs -- Gesture Handler invokes commitZoom only after input, outside render.
 .onEnd(e=>{const next=Math.max(minZoom,Math.min(maxZoom,zoom*e.scale));runOnJS(commitZoom)(next,buildingRoomAt((e.focalX-x.value)/(scale*transient.value),(e.focalY-y.value)/(scale*transient.value),building));})
 // A cancelled pinch never commits, so restore the pre-pinch transform rather than leaving the house at a temporary scale.
 // eslint-disable-next-line react-hooks/purity -- Input callback records the end of an actual pinch.
 .onFinalize((_e,success)=>{if(!success&&transient.value!==1){transient.set(1);x.set(startX.value);y.set(startY.value);}lastPan.set(Date.now());moving.set(false);});
 const style=useAnimatedStyle(()=>({transform:[{translateX:x.value},{translateY:y.value},{scale:transient.value}],transformOrigin:'left top'}));
 return <CameraPan.Provider value={{pan,pinch}}><GestureDetector gesture={Gesture.Simultaneous(pinch,pan)} touchAction="none"><View testID="house-viewport" style={{width,height,overflow:'hidden'}}><Animated.View testID="house-camera" style={[{width:building.width*scale,height:building.height*scale},style]}>{children}</Animated.View></View></GestureDetector></CameraPan.Provider>;
}
