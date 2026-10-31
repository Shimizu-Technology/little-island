import { characterDropRoom, resolveDrop, type DropBody, type DropWorld, type DropBox } from "./drop";
import { CameraPan } from "./HouseCamera";
import React, { useContext, type ReactNode } from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedProps,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Polygon, Line } from "react-native-svg";
export type Preview = {
  active: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  wall: boolean;
  valid: boolean;
  box?:DropBox;
  on?: string;
  surfaceX?: number;
  surfaceY?: number;
  px?: number;
  py?: number;
};
export const emptyPreview: Preview = { active: false, x: 0, y: 0, w: 1, h: 1, wall: false, valid: false };
export type DragConfig = {
  center?:{x:number;y:number};
  grouped?:boolean;
  motion?: SharedValue<{id:string;dx:number;dy:number}>;
  rooms?:{id:string;origin:{x:number;y:number};world:DropWorld}[];
  sourceOrigin?:{x:number;y:number};
  world?: DropWorld;
  subject?: DropBody | {slot:number};
  preview: SharedValue<Preview>;
  origin: { x: number; y: number };
  scale: number;
  footprint?: { w: number; h: number; wall: boolean; id: string; small?: boolean };
  blockers: { id: string; x: number; y: number; w: number; h: number; wall: boolean; layer: string; on?: string; surface?: boolean; sx?: number; sy?: number; radius?: number }[];
  layer?: string;
  /** Scene-local foot point; tray items use the pointer's absolute position. */
  foot?: { x: number; y: number };
};
/** Worklet-only drag feedback. No React state or reducer writes during pointer movement. */
function updatePreview(config:DragConfig,absX:number,absY:number,dx:number,dy:number){
 "worklet";
 if(!config.world||!config.subject)return;
 const px=config.foot?config.foot.x+dx/config.scale:(absX-config.origin.x)/config.scale;
 const py=config.foot?config.foot.y+dy/config.scale:(absY-config.origin.y)/config.scale;
 const contacts='slot' in config.subject?[{x:(absX-config.origin.x)/config.scale,y:(absY-config.origin.y)/config.scale},...(config.center?[{x:config.center.x+dx/config.scale,y:config.center.y+dy/config.scale}]:[])]:[];
 let world=config.world,targetX=px,targetY=py,offsetX=0,offsetY=0;
 if(config.rooms&&config.sourceOrigin){const wx=px+config.sourceOrigin.x,wy=py+config.sourceOrigin.y;const target=characterDropRoom(config.rooms,'slot' in config.subject?config.subject.slot:-1,[...contacts.map(p=>({x:p.x+config.sourceOrigin!.x,y:p.y+config.sourceOrigin!.y})),{x:wx,y:wy}]);if(!target){config.preview.value={...emptyPreview,active:true};return;}world=target.world;targetX=wx-target.origin.x;targetY=wy-target.origin.y;offsetX=target.origin.x-config.sourceOrigin.x;offsetY=target.origin.y-config.sourceOrigin.y;}
 const result=resolveDrop(world,config.subject,targetX,targetY,contacts.map(p=>({x:p.x-offsetX,y:p.y-offsetY})));
 if(result&&config.rooms){result.px+=offsetX;result.py+=offsetY;if(result.box)result.box={left:result.box.left+offsetX,right:result.box.right+offsetX,top:result.box.top+offsetY,bottom:result.box.bottom+offsetY};}
 const f=config.footprint;
 config.preview.value={active:true,valid:!!result,x:result?.x??0,y:result?.y??0,w:f?.w??1,h:f?.h??1,wall:f?.wall??false,box:result?.box,px:result?.px??px,py:result?.py??py,...(result&&(result.kind!=='floor'||config.rooms)?{on:result.on??result.itemId??'person',surfaceX:result.px,surfaceY:result.py}:{})};
}
export function Drag({
  children,
  style,
  enabled,
  reduced,
  config,
  onDrop,
  onTap,
  onStart,
  tray = false,
  ...a11y
}: ViewProps & {
  children: ReactNode;
  style: ViewStyle;
  enabled: boolean;
  reduced: boolean;
  config: DragConfig;
  onDrop: (x: number, y: number, dx: number, dy: number) => void;
  onTap: () => void;
  onStart?: () => void;
  tray?: boolean;
}) {
  const dx = useSharedValue(0),
    dy = useSharedValue(0),
    lift = useSharedValue(0),
    dragging = useSharedValue(false),
    pinching = useSharedValue(false),
    returning=useSharedValue(false);
  const preview = config.preview;
  const motion=config.motion;
  const cameraPan = useContext(CameraPan);
  const panBase = Gesture.Pan().enabled(enabled).maxPointers(1).minDistance(8);
  if (cameraPan) panBase.blocksExternalGesture(cameraPan.pan,cameraPan.pinch);
  // Vertical exit preserves the inventory's native horizontal scrolling.
  if (tray) panBase.activeOffsetY([-8, 8]).failOffsetX([-14, 14]);
  const pan = panBase
    // eslint-disable-next-line react-hooks/immutability -- UI-thread shared preview handle.
    .onTouchesDown(e => { if(e.allTouches.length > 1) {pinching.value = true;dx.value=0;dy.value=0;lift.value=0;if(motion)motion.set({id:"",dx:0,dy:0});preview.value=emptyPreview;} })
    .onStart(() => {
      "worklet";
      returning.value=false;
      dx.value=0;dy.value=0;
      dragging.value = true;
      lift.value = reduced || config.grouped ? 0 : withTiming(1, { duration: 100 });
      if (onStart) runOnJS(onStart)();
    })
    .onUpdate((e) => {
      "worklet";
      if (e.numberOfPointers > 1 || pinching.value) return;
      if(motion && config.subject && "id" in config.subject)motion.set({id:config.subject.id,dx:e.translationX,dy:e.translationY});
      dx.value = e.translationX;
      dy.value = e.translationY;
      updatePreview(config, e.absoluteX, e.absoluteY, e.translationX, e.translationY);
    })
    .onEnd((e) => {
      "worklet";
      if(!pinching.value){
        updatePreview(config,e.absoluteX,e.absoluteY,e.translationX,e.translationY);
        returning.value=!!config.world&&!!config.subject&&!preview.value.valid;
        if(returning.value){dx.value=reduced||config.grouped?0:withSpring(0,{damping:22,stiffness:260});dy.value=reduced||config.grouped?0:withSpring(0,{damping:22,stiffness:260});}
        else runOnJS(onDrop)(e.absoluteX,e.absoluteY,e.translationX,e.translationY);
      }
    })
    .onFinalize(() => {
      "worklet";
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable UI-thread handles, not React props.
      preview.value = emptyPreview;
      if(motion)motion.set({id:"",dx:0,dy:0});
      dragging.value = false;
      pinching.value = false;
      if(!returning.value){dx.value=0;dy.value=0;}
      lift.value = reduced ? 0 : withSpring(0, { damping: 12, stiffness: 260, mass: 0.45 });
    });
  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd((_e, success) => {
      "worklet";
      if (success) runOnJS(onTap)();
    });
  const animated = useAnimatedStyle(() => ({
    transform: [{ rotate: "0deg" }, { translateX: dx.value }, { translateY: dy.value - lift.value * 7 }, { scale: 1 + lift.value * 0.06 }],
    zIndex: dragging.value ? 500 : 0,
  }));
  // A pose-key remount owns fresh handles; cancel any pending lift/return on unmount.
  React.useEffect(()=>()=>{cancelAnimation(dx);cancelAnimation(dy);cancelAnimation(lift);dx.set(0);dy.set(0);lift.set(0);dragging.set(false);pinching.set(false);returning.set(false);},[dx,dy,lift,dragging,pinching,returning]);
  return (
    <View pointerEvents="box-none" style={style}>
    <View pointerEvents="none" style={{position:'absolute',left:'25%',right:'25%',bottom:0,height:8,borderRadius:50,backgroundColor:'#38545120'}}/>
    <GestureDetector gesture={Gesture.Race(pan, tap)} touchAction={tray ? "pan-x" : "none"}>
      <Animated.View {...a11y} accessible focusable tabIndex={0} style={[{width:style.width,height:style.height}, animated]}>
        {children}
      </Animated.View>
    </GestureDetector>
    </View>
  );
}
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
export function Footprint({
  offset={x:0,y:0},
  preview,
  scale,
  width,
  height,
}: {
  offset?:{x:number;y:number};
  preview: SharedValue<Preview>;
  scale: number;
  width: number;
  height: number;
}) {
  const propsFor = (p: Preview, valid: boolean) => {
    "worklet";
    const point = (x: number, y: number) =>
      p.wall
        ? `${(offset.x + 54 + x * 46 - 23) * scale},${(offset.y + 124 + y * 56 - 28) * scale}`
        : `${(offset.x + 43 + x * 37.5 + y * 1.5 - 18.75) * scale},${(offset.y + 386 + y * 14.4 - 7.2) * scale}`;
    return {
      points: p.box ? [[p.box.left,p.box.top],[p.box.right,p.box.top],[p.box.right,p.box.bottom],[p.box.left,p.box.bottom]].map(([x,y])=>`${(offset.x+x)*scale},${(offset.y+y)*scale}`).join(" ") : p.on ? [[-48,-12],[48,-12],[48,12],[-48,12]].map(([x,y]) => `${(offset.x+p.surfaceX!+x)*scale},${(offset.y+p.surfaceY!+y)*scale}`).join(" ") : [point(p.x, p.y), point(p.x + p.w, p.y), point(p.x + p.w, p.y + p.h), point(p.x, p.y + p.h)].join(" "),
      opacity: p.active && p.valid === valid ? 1 : 0,
    };
  };
  // Animate geometry/opacity only. Static SVG colors avoid platform-specific
  // color adaptation leaving an accepted preview painted with its initial red.
  const validProps = useAnimatedProps(() => propsFor(preview.value, true));
  const invalidProps = useAnimatedProps(() => propsFor(preview.value, false));
  return (
    <View pointerEvents="none" style={{ position: "absolute", width, height }}>
      <Svg width={width} height={height}>
        <AnimatedPolygon
          id="home-valid-footprint"
          animatedProps={validProps}
          fill="#70C3A488"
          stroke="#277961"
          strokeWidth={2}
        />
        <AnimatedPolygon
          id="home-invalid-footprint"
          animatedProps={invalidProps}
          fill="#EF887E88"
          stroke="#AD403C"
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}
export function FloorGrid({ scale, width, height }: { scale: number; width: number; height: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", width, height }}>
      <Svg width={width} height={height} opacity={0.24}>
        {Array.from({ length: 13 }, (_, y) => (
          <Line
            key={`y${y}`}
            x1={(24 + y * 1.5) * scale}
            y1={(379 + y * 14.4) * scale}
            x2={(780 + y * 1.5) * scale}
            y2={(379 + y * 14.4) * scale}
            stroke="#427468"
            strokeDasharray="3 5"
          />
        ))}
        {Array.from({ length: 21 }, (_, x) => (
          <Line
            key={`x${x}`}
            x1={(24 + x * 37.5) * scale}
            y1={350 * scale}
            x2={(45 + x * 37.5) * scale}
            y2={560 * scale}
            stroke="#427468"
            strokeDasharray="3 5"
          />
        ))}
      </Svg>
    </View>
  );
}

export function TrayGhost({
  preview,
  children,
  size,
  scale,
}: {
  preview: SharedValue<Preview>;
  children: ReactNode;
  size: number;
  scale: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: preview.value.active ? 0.85 : 0,
    transform: [
      { translateX: (preview.value.px ?? 0) * scale - size / 2 },
      { translateY: (preview.value.py ?? 0) * scale - size * 0.85 - 7 },
    ],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: 0, top: 0, width: size, height: size, zIndex: 800 }, style]}
    >
      {children}
    </Animated.View>
  );
}

/** Shared item translation keeps socket occupants and furniture fronts under the same finger. */
export function MotionLink({motion,owner,children}:{motion:SharedValue<{id:string;dx:number;dy:number}>;owner?:string;children:ReactNode}){
 const style=useAnimatedStyle(()=>({transform:[{translateX:owner&&motion.value.id===owner?motion.value.dx:0},{translateY:owner&&motion.value.id===owner?motion.value.dy:0}]}));
 return <Animated.View pointerEvents="box-none" style={[{position:'absolute',left:0,top:0,width:'100%',height:'100%'},style]}>{children}</Animated.View>;
}
