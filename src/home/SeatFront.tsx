import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import type { Instance } from './model';
import { material, shade } from './art/Tint';
/** Paint only the near edge over a seated friend's legs. Full seats and backs paint first. */
export function SeatFront({ item, size }: { item: Instance; size:number }) {
 const flip = item.mirrored !== (item.rotation === 180 || item.rotation === 270);
 const color = material(item.tint ?? 'original', ['#79BDB1','#EC9989','#E9C475'][item.item.length % 3]);
 const dark = shade(color,-.18);
 return <Svg width={size} height={size} viewBox="0 0 150 130" accessible={false}><G transform={flip ? 'translate(150 0) scale(-1 1)' : undefined} stroke="#385451" strokeWidth={2.5} strokeLinejoin="round">
  {item.item === 'bed' && <Path d="M37 96L131 84V92L36 105Z" fill="#D99E6C"/>}
  {item.item === 'beanbag' && <Path d="M24 103Q75 118 128 98L124 112Q75 130 28 115Z" fill={material(item.tint ?? 'original','#79BDB1')}/>}
  {['sofa','armchair','floor-cushion'].includes(item.item) && <Path d="M39 98L124 89L125 95L38 104L24 94V87Z" fill={color}/>}
  {item.item === 'rocking-chair' && <Path d="M28 84L49 104L130 91V84L48 97Z" fill={dark}/>}
  {item.item === 'stool' && <Path d="M42 75Q75 91 108 75V84Q75 100 42 84Z" fill={dark}/>}
  {item.item === 'hammock' && <Path d="M40 89Q82 112 116 65Q105 116 65 101Z" fill={color}/>}
  {item.item === 'bunk-bed' && <Path d="M20 98L39 115L134 105V97L39 107L20 90Z" fill="#D99E6C"/>}
 </G></Svg>;
}
