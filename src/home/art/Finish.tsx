import React, { useEffect } from 'react';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { shade } from './Tint';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedGroup = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const woodIds = new Set(['bed','sofa','armchair','bunk-bed','dresser','bookcase','dollhouse']);
const softIds = new Set(['bed','beanbag','sofa','armchair','bunk-bed','floor-cushion']);
const leafyIds = new Set(['plant','potted-fern','cactus','flower-vase','banana-plant']);
const metalIds = new Set(['fridge','stove','sink-counter']);

/** Small material marks sit inside the shared 150 × 130 art box. No footprint changes. */
export function ItemFinish({ id, color }: { id: string; color: string }) {
  const shadow = shade(color, -.24), light = shade(color, .42);
  return <G fill="none" strokeLinecap="round" pointerEvents="none">
    {woodIds.has(id) && <G stroke="#956D50" strokeWidth={1.15} opacity={.7}>
      <Path d="M37 106q16-3 30-2m14-3q17-1 27-5M43 113q8 1 17-1M40 78q21-5 37-5m12-3q11-2 19-3"/>
      <Path d="M53 91q6-3 11 0m34-10q7-4 13-1"/>
    </G>}
    {softIds.has(id) && <G stroke={shadow} strokeWidth={1.3} opacity={.7}>
      <Path d="M37 88q5 5 9 5m56-18q5 4 10 4M51 102q12 3 21 2m16-3q8-1 12-4"/>
      <Path d="M61 73q9-4 16-2" stroke={light} strokeWidth={2}/>
    </G>}
    {leafyIds.has(id) && <G stroke="#4E8567" strokeWidth={1.4} opacity={.85}>
      <Path d="M73 49q-13-12-25-16m29 27q13-11 28-13M67 70q-12-6-23-8"/>
      <Path d="M58 103q15 4 31 0" stroke={light} strokeWidth={2.2}/>
    </G>}
    {metalIds.has(id) && <G stroke={light} strokeWidth={2.4} opacity={.85}>
      <Path d="M41 67q8-4 16-3m36-7q10-3 17-2M56 105q19-2 34-5"/>
    </G>}
    {['sofa','armchair'].includes(id) && <G stroke={shadow} strokeWidth={1.5} opacity={.8}>
      <Path d="M43 43q28-8 57-6M44 55q31-7 64-8M49 86q15 2 28-3m9-1q15-4 25-4"/>
      <Path d="M46 47q9 2 12 7m36-9q9 1 12 7" stroke={light} strokeWidth={2}/>
    </G>}
    {id==='fridge' && <G stroke={shadow} strokeWidth={1.5}><Path d="M48 65l75-10M48 69l75-10" opacity={.65}/><Path d="M61 83v12m0-45v6" stroke="#F8F3E5" strokeWidth={3}/><Circle cx={106} cy={77} r={3} fill="#D9B58A" stroke="none"/></G>}
    {['bed','bunk-bed'].includes(id) && <G stroke={light} strokeWidth={2} opacity={.8}><Path d="M42 53q11-5 25-4m26-5q9-2 19-1M44 82q14 8 28 5m18-9q14 3 24-2"/></G>}
    {['rug','mat','round-rug','striped-rug'].includes(id) && <G stroke={light} strokeWidth={1.6} opacity={.9}><Path d="M27 94q15 15 35 12m42-2q15-5 22-15"/></G>}
    {id==='aquarium' && <G stroke="#F9FFF1" strokeWidth={1.6} opacity={.85}><Path d="M34 37l9 26m79-18l-7 37"/><Circle cx={95} cy={77} r={3}/><Circle cx={105} cy={64} r={2}/></G>}
    {['potted-fern','flower-vase','plant'].includes(id) && <Path d="M57 98q15 4 34 0" stroke={light} strokeWidth={2.6} opacity={.85}/>}
  </G>;
}

/** Optional worklet-driven accent. Disabled by default and frozen for Reduce Motion. */
export function ItemLife({ id, color, active, animated = false, reduced = false }: { id: string; color: string; active: boolean; animated?: boolean; reduced?: boolean }) {
  if (!animated || reduced) return null;
  return <AnimatedItemLife id={id} color={color} active={active}/>;
}
function AnimatedItemLife({ id, color, active }: { id: string; color: string; active: boolean }) {
  const phase = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(phase);
    phase.value = 0;
    phase.value = withRepeat(withSequence(withTiming(1, { duration: active ? 190 : 1700, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: active ? 280 : 1700 })), -1);
    return () => cancelAnimation(phase);
  }, [active, phase]);
  const pulse = useAnimatedProps(() => ({ opacity: .28 + phase.value * .4 }));
  // SVG accepts React Native transform arrays. Reanimated cannot process an
  // animated SVG transform string on its UI runtime in the Release build.
  const fish = useAnimatedProps(() => ({ transform: [{ translateX: phase.value * 18 }] }));
  const tick = useAnimatedProps(() => ({ transform: [{ translateX: 75 }, { translateY: 65 }, { rotate: `${phase.value * 28}deg` }, { translateX: -75 }, { translateY: -65 }] }));
  if (id === 'aquarium') return <AnimatedGroup animatedProps={fish}><Path d="M83 78l7-6v12Z" fill="#E89982" stroke="#4E6A60" strokeWidth={1.5}/><Ellipse cx={76} cy={78} rx={9} ry={5} fill="#F3C76E" stroke="#4E6A60" strokeWidth={1.5}/><Circle cx={72} cy={77} r={1.3} fill="#4E6A60" stroke="none"/></AnimatedGroup>;
  if (['plant','potted-fern','banana-plant','flower-vase','cactus'].includes(id)) return <AnimatedEllipse animatedProps={pulse} cx={85} cy={33} rx={13} ry={4} fill={shade(color,.48)} stroke="none"/>;
  if (id === 'clock') return <AnimatedPath animatedProps={tick} d="M75 65V43" stroke="#50685D" strokeWidth={2.5} strokeLinecap="round" fill="none"/>;
  if (id === 'stove' || id === 'teapot') return <AnimatedPath animatedProps={pulse} d="M67 31q-6-8 1-15m15 12q7-8 1-16" stroke="#FFF4DC" strokeWidth={3} strokeLinecap="round" fill="none"/>;
  if (['string-lights','lamp','island-lamp','table-lamp','floor-lamp','lantern'].includes(id)) return <AnimatedCircle animatedProps={pulse} cx={75} cy={42} r={active?12:5} fill="#FFF1BA" stroke="none"/>;
  return <AnimatedEllipse animatedProps={pulse} cx={75} cy={117} rx={25} ry={2} fill={shade(color,.35)} stroke="none"/>;
}

/** One brief tap lift on the SVG UI thread; the scene box and hit target stay fixed. */
export function ItemMotion({ children, active, animated = false, reduced = false }: { children: React.ReactNode; active: boolean; animated?: boolean; reduced?: boolean }) {
  if (!animated || reduced) return <>{children}</>;
  return <AnimatedItemMotion active={active}>{children}</AnimatedItemMotion>;
}
function AnimatedItemMotion({ children, active }: { children: React.ReactNode; active: boolean }) {
  const lift = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(lift);
    lift.value = active ? withSequence(withTiming(-5,{duration:110}),withTiming(0,{duration:260})) : 0;
    return () => cancelAnimation(lift);
  }, [active, lift]);
  const props = useAnimatedProps(() => ({ transform: [{ translateY: lift.value }] }));
  return <AnimatedGroup animatedProps={props}>{children}</AnimatedGroup>;
}
