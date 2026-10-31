import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { ArtLayer, ItemVisualState } from '../world';
import { material, shade } from './Tint';
import type { TintId } from '../catalogMore';

import { seatSockets } from './sockets';

const ink = '#385451', wood = '#D99E6C', cream = '#FFF1D3';
export { seatSockets } from './sockets';
export const hasSeatArt = (id: string) => !!seatSockets[id];
export function SeatShape({ id, layer = 'all', tint = 'original', state }: { id: string; layer?: ArtLayer; tint?: TintId; state?: ItemVisualState }) {
  const color = material(tint, id === 'beanbag' ? '#B9A8CE' : ['hammock','chair','armchair'].includes(id) ? '#EC9989' : '#79BDB1'), light = shade(color, .35);
  const back = layer !== 'front', front = layer !== 'back';
  const bed = id === 'bed' || id === 'cloud-bed' || id === 'bunk-bed';
  const bedding = (y: number) => <G transform={`translate(0 ${y})`}>
    {back && <>{id !== 'bunk-bed' && <Path d="M10 94V40Q11 32 23 32H131V94" fill={wood}/>}<Rect x={12} y={56} width={126} height={39} rx={9} fill={cream}/><Path data-pillow="white" d="M4 44Q30 35 65 44L66 99Q35 110 4 100Q-1 73 4 44Z" fill="#FFFEF6"/><Path d="M8 48Q32 41 60 48M8 96Q31 104 60 96" stroke="#E9DFCA" fill="none"/></>}
    {front && <><Path d="M60 61Q65 40 85 48Q96 64 105 56Q111 42 124 54Q129 61 134 56Q138 51 142 56Q147 54 147 67V96Q105 106 60 98Z" fill={color}/><Path d="M62 61Q72 53 82 57L82 64Q71 60 62 68Z" fill={light}/><Path d="M77 61q-7 10-4 24m42-22q-8 9-5 22m26-17q-4 7-3 13" stroke={light} strokeWidth={2} fill="none"/><Path d="M5 103H147V110H5Z" fill={wood}/><Path d="M10 110v7m132-7v7" stroke={wood} strokeWidth={6}/></>}
  </G>;
  return <G fill="none" stroke={ink} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
    {bed ? id === 'bunk-bed' ? <>{back && <Path d="M8 12V144M141 12V144" stroke={wood} strokeWidth={7}/ >}{bedding(29)}{bedding(-31)}{front && <Path d="M121 65v78m17-78v78m-17-57h17m-17 20h17m-17 20h17" stroke={wood} strokeWidth={4}/>}</> : bedding(0)
    : id === 'hammock' ? <>
      {back && <>{state?.on && <Path d="M55 23q12-7 25 0m-18 7q12-7 25 0" fill="none" stroke={light}/>}<Path d="M9 27L15 130M141 27L135 130M5 130h24m92 0h24" stroke={wood} strokeWidth={6}/><Path d="M11 48Q75 101 139 48L125 100Q75 129 25 100Z" fill={light}/><Ellipse cx={35} cy={76} rx={23} ry={24} fill={cream}/></>}
      {front && <><Path d="M57 59Q67 44 85 50Q98 63 108 55Q118 47 129 54Q139 53 148 45L148 101Q100 132 27 107L22 91Q43 102 57 101Z" fill={color}/><Path d="M32 103Q77 121 124 88M64 78v32m19-23v26m20-23v16" fill="none" stroke={light} strokeWidth={2}/></>}
    </> : id === 'sofa' ? <>
      {back && <><Rect x={8} y={40} width={134} height={69} rx={18} fill={color}/><Rect x={14} y={49} width={122} height={45} rx={12} fill={light}/><Rect x={5} y={49} width={58} height={62} rx={12} fill={cream}/><Path d="M16 112v12m117-12v12" stroke={wood} strokeWidth={6}/></>}
      {front && <><Path d="M58 64Q70 49 86 56Q99 71 109 62Q122 52 132 66V111H58Z" fill={color}/><Path d="M60 66Q70 57 81 62m25 9q10-10 21-1" stroke={light} strokeWidth={5}/><Rect x={7} y={99} width={136} height={14} rx={6} fill={color}/><Rect x={129} y={67} width={15} height={44} rx={7} fill={light}/></>}
    </> : id === 'bathtub' || id === 'bubble-bath' ? <>
      {back && <><Path d="M13 72Q75 47 137 72V108H13Z" fill={cream}/><Ellipse cx={75} cy={76} rx={61} ry={19} fill="#A7D7D3"/><Path d="M119 62V38Q119 29 108 33v9" stroke={wood} strokeWidth={6} fill="none"/></>}
      {front && <><Path d="M12 76Q75 85 138 76L130 121Q75 140 20 121Z" fill={material(tint, cream)}/><Path d="M15 70H135V84H15Z" fill="#A7D7D3" stroke="none"/><Path d="M13 76Q75 85 137 76" stroke="#F9FAF0" strokeWidth={7}/><Path d="M30 127v9m90-9v9" stroke={wood} strokeWidth={6}/>{[27,47,98,120].map((x,i)=><G key={x} stroke="#B1D6CE" strokeWidth={1}><Circle cx={x} cy={77-i%2*3} r={id === 'bubble-bath' ? 10 : 5} fill="#F4FAEF"/><Circle cx={x+8} cy={75} r={id === 'bubble-bath' ? 6 : 3} fill="#F4FAEF"/></G>)}</>}
    </> : <>
      {back && <>
        {['armchair','chair','rocking-chair','beanbag'].includes(id) && <Rect x={16} y={40} width={118} height={70} rx={id === 'beanbag' ? 36 : 15} fill={color}/>}
        {id === 'rocking-chair' ? <Path d="M39 103v29m73-29v29M19 130Q75 148 131 130" stroke={wood} strokeWidth={6} fill="none"/> : !['floor-cushion','beanbag'].includes(id) && <Path d="M35 102v29m80-29v29" stroke={wood} strokeWidth={6}/>}
        <Ellipse cx={75} cy={id === 'stool' ? 94 : id === 'floor-cushion' ? 117 : 100} rx={id === 'bench' ? 69 : id === 'stool' ? 46 : 59} ry={12} fill={light}/>
      </>}
      {back && id === 'stool' && <Path d="M35 119h80" stroke={wood} strokeWidth={4}/>}
      {back && id === 'bench' && <><Path d="M9 99H141V107H9Z" fill={wood}/><Path d="M15 94H135" stroke={cream} strokeWidth={2}/></>}
      {back && id === 'floor-cushion' && <Path d="M26 114Q75 99 124 114V124Q75 137 26 124Z" fill={color}/>}
      {front && id === 'armchair' && <><Rect x={23} y={72} width={16} height={40} rx={8} fill={color}/><Rect x={111} y={72} width={16} height={40} rx={8} fill={color}/><Path d="M26 77h10m78 0h10" stroke={light} strokeWidth={3}/></>}
      {front && id === 'beanbag' && <Path d="M23 95Q29 92 43 101L45 119Q18 122 18 104ZM107 101Q121 92 127 95L132 104Q132 122 105 119Z" fill={color}/>}

    </>}
  </G>;
}
export function SeatArt({ id, size = 120, layer = 'all', mirrored = false, rotation = 0, tint, state, motion }: { id: string; size?: number; layer?: ArtLayer; mirrored?: boolean; rotation?: number; tint?: TintId; state?: ItemVisualState; motion?: (art: React.ReactNode) => React.ReactNode }) {
  const flip = mirrored !== (rotation === 180 || rotation === 270);
  const art = <SeatShape id={id} layer={layer} tint={tint} state={state}/>;
  return <Svg width={size} height={size} viewBox="0 0 150 150" accessible={false}><G transform={flip ? 'translate(150 0) scale(-1 1)' : undefined}>{motion ? motion(art) : art}</G></Svg>;
}
