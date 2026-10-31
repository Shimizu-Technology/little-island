import React from 'react';
import { Circle, G, Path, Rect } from 'react-native-svg';
import { type IslanderLook } from '../look';
import type { Pose } from './poses';
import { anchorsFor } from './wardrobe';
const leiFlowers = [-1, 1].flatMap(side => [0, 1, 2].map(i => ({ x: side * (10 - i * 3), y: 4 + i * 6, coral: i === 1 })));
const flowerPath = (x: number, y: number) => `M${x} ${y-4}q5-1 3 4q4 4-1 4q-2 4-4 0q-5 0-1-4q-2-5 3-4Z`;
/** Reward details use the same rig coordinates and inherited ink as starter clothing. */
export function RewardArt({look, pose, layer}: {look: IslanderLook; pose: Pose; layer: 'hat' | 'accessory' | 'clothing' | 'hair' | 'wrist' | 'neckwear'}) {
  const a = anchorsFor(pose), [x,y] = pose.joints.head, front = pose.view === 'front', small = !!pose.compact;

  if (layer === 'hair') return <G fill="none" stroke={look.hairColor === 'galaxy' ? '#8982BF' : '#FFE49A'} strokeWidth={look.hairColor === 'galaxy' ? 1.3 : 3}>{['galaxy','lightning-streak'].includes(look.hairColor) && <Path d={`M${x+3} ${y-(small?10:21)}q-7 6 -3 ${small?10:17}${look.hairColor === 'galaxy' ? (small ? 'm7 -10q-5 4 -2 8' : 'm7 -15q-5 6 -2 11') : ''}`}/>}</G>;
  if (layer === 'hat') return <G transform={`translate(${a.headTop[0]} ${a.headTop[1]}) scale(${small?.55:1.13} ${small?.55:1})`}>
    {look.hat === 'bookworm-beanie' && <G fill="#95718C"><Path d="M-22 7Q-24-5 0-5Q24-5 22 7Z"/><Rect x={-23} y={2} width={46} height={9} rx={3}/><Path d="M-4 3h8v7h-8Z" fill="#FFF0D1"/><Path d="M0 4v5M-13-5v6M12-5v6" fill="none" stroke="#C6A1B5"/></G>}
    {look.hat === 'woven-sunhat' && <G fill="#DABB7D"><Path d="M-19 6L-15-3Q0-5 15-3L19 6Z"/><Path d="M-29 8Q-27 3-18 4H18Q27 3 29 8Q0 19-29 8Z"/><Path d="M-14-3L13 5M-8-3L18 2M-14 4L8-3M-5 6L15-3M-22 8Q0 14 22 8" fill="none" stroke="#9D8156" strokeWidth={1}/></G>}
    {look.hat === 'runner-headband' && <G><Path d="M-22 10Q0 3 22 10L22 16Q0 9-22 16Z" fill="#83BCB4"/><Path d="M-6 10h12" stroke="#FFF0D1" strokeWidth={2}/></G>}
    {look.hat === 'captain-cap' && <G><Path d="M-23 5Q-27-4 0-4Q27-4 23 5Z" fill="#FFF0D1"/><Path d="M-22 5H22V11H-22Z" fill="#526579"/><Path d="M-16 11Q0 22 16 11Z" fill="#526579"/><Path d="M0-4v8m-4-4q4 8 8 0" fill="none" stroke="#D7AC58" strokeWidth={2}/></G>}
  </G>;
  const neckwear = ['flower-lei', 'checker-scarf'].includes(look.accessory);
  const accessory = layer === 'wrist' ? (look.accessory === 'calculator-watch' ? look.accessory : 'none') : layer === 'neckwear' ? (!front && neckwear ? look.accessory : 'none') : (look.accessory === 'calculator-watch' || (!front && neckwear) ? 'none' : look.accessory);
  return <G>
    {['reading-glasses','safety-goggles'].includes(accessory) && (front ? <G transform={`translate(${x} ${y+7})`} fill="#D4EDE5" fillOpacity={.25} strokeWidth={1.7}>{accessory === 'reading-glasses' ? <><Circle cx={-8} r={6}/><Circle cx={8} r={6}/></> : <><Rect x={-17} y={-6} width={34} height={12} rx={4}/><Path d="M0-5V5"/></>}<Path d="M-2 0H2M-22-1H-15M15-1H22" fill="none"/></G> : <Path d={`M${x-(small?12:28)} ${y+6}Q${x} ${y+13} ${x+(small?12:28)} ${y+6}`} fill="none" stroke={accessory === 'safety-goggles' ? '#83BCB4' : '#95718C'} strokeWidth={3}/>)}
    {accessory === 'coder-headset' && <G transform={`translate(${x} ${y})`}><Path d="M-23 6Q-24-22 0-23Q24-22 23 6" fill="none" stroke="#425D8E" strokeWidth={4}/><Rect x={-26} y={2} width={8} height={18} rx={4} fill="#7D9BCD"/><Rect x={18} y={2} width={8} height={18} rx={4} fill="#7D9BCD"/><Path d="M22 17q-1 13-14 13" fill="none" stroke="#425D8E" strokeWidth={2}/><Circle cx={8} cy={30} r={3} fill="#E5B665"/></G>}
    {accessory === 'calculator-watch' && (()=>{const e=pose.joints.rightElbow,h=pose.joints.rightHand; const wx=e[0]+(h[0]-e[0])*.8,wy=e[1]+(h[1]-e[1])*.8; return <G transform={`translate(${wx} ${wy}) rotate(${Math.atan2(h[1]-e[1],h[0]-e[0])*180/Math.PI-90}) scale(.72)`}><Rect x={-5} y={-4} width={10} height={8} rx={2} fill="#526579"/><Rect x={-3} y={-3} width={6} height={3} rx={.6} fill="#A8D3C3"/><Path d="M-2 2h1m2 0h1" stroke="#FFF0D1"/></G>;})()}
    {accessory === 'flower-lei' && <G transform={`translate(${a.neck[0]} ${a.neck[1]}) scale(${small?.45:.8})`}><Path d="M-10 0Q-12 18 0 20Q12 18 10 0" stroke="#639477" fill="none" strokeWidth={3}/>{[false,true].map(coral=><Path key={String(coral)} d={leiFlowers.filter(f=>f.coral===coral).map(f=>flowerPath(f.x,f.y)).join('')} fill={coral?'#F58062':'#FFF0D1'} strokeWidth={.6}/>)}{leiFlowers.map(f=><Circle key={`${f.x}:${f.y}`} cx={f.x} cy={f.y} r={1.3} fill="#E9AF4A" strokeWidth={.6}/>)}</G>}
    {accessory === 'checker-scarf' && <G transform={`translate(${a.neck[0]} ${a.neck[1]}) scale(${small?.45:.8})`}><Path d="M-11-1Q0 5 11-1L10 6Q0 12-10 6ZM5 6L12 7L15 23L7 22Z" fill="#FFF0D1"/><Path d="M-9 1h3v3h-3ZM-3 3h3v3h-3ZM3 2h3v3H3ZM9 1h2v3H9ZM8 9h3v3H8ZM11 12h3v3h-3ZM9 15h3v3H9ZM12 18h3v3h-3Z" fill="#95718C" strokeWidth={0}/></G>}
  </G>;
}
