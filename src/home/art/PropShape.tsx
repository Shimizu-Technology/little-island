import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { material } from './Tint';
import type { TintId } from '../catalogMore';
import type { HoldableId } from './living';
import type { ItemVisualState } from '../world';
/** SVG content in a 24×24 box. Pass directly to Islander.held, without a View. */
export function HandProp({ id, state = {}, tint = 'original' }: { id: HoldableId; state?: ItemVisualState; tint?: TintId }) {
  const paint = (color: string) => material(tint, color);
  return <G fill="none" stroke="#493E38" strokeWidth={.8} strokeLinecap="round" strokeLinejoin="round">
    {id === 'mango' ? <><Path d="M17 5Q24 10 18 19Q11 25 5 18Q0 11 8 6Q13 3 17 5Z" fill="#F3BA59"/><Path d="M8 8Q3 12 7 17" fill="none" stroke="#FFE29A" strokeWidth={1.5}/><Path d="M14 6Q14 1 20 2Q20 6 14 6" fill="#79B090"/></>
    : id === 'banana' ? <><Path d="M4 4Q3 17 20 17Q15 25 5 18Q-1 13 2 5Z" fill="#F4CE70"/><Path d="M4 7Q6 18 17 19" fill="none" stroke="#D99E6C"/><Path d="M2 4l3-1m14 14 2-1" strokeWidth={2}/></>
    : id === 'rice-ball' ? <><Path d="M9 4Q12-1 15 4L22 17Q23 22 18 22H6Q1 22 3 17Z" fill="#FFFAE8"/><Rect x={8} y={14} width={8} height={8} rx={1} fill="#53796A"/><Path d="M8 8h.2m5-3h.2m4 6h.2m-12 4h.2" stroke="#D9C7A6"/></>
    : id === 'cupcake' ? <><Path d="M5 13H20L18 23H7Z" fill="#79BDB1"/><Path d="M9 16v4m4-4v5m4-5v4" stroke="#D9EEE1"/><Path d="M4 13Q1 9 6 7Q5 2 11 3Q15-1 18 5Q24 6 21 11L20 13Z" fill="#F4C0B0"/><Circle cx={13} cy={3} r={2} fill="#D97D68"/></>
    : id === 'coconut-drink' ? <><Path d="M4 10Q1 22 12 23Q23 22 20 10Z" fill="#AD805C"/><Ellipse cx={12} cy={10} rx={8} ry={4} fill="#FFF2D4"/>{!state.empty && <Ellipse cx={12} cy={10} rx={6} ry={2.3} fill="#C4E1D2"/>}<Path d="M13 12L15 2H10" fill="none" stroke="#79BDB1" strokeWidth={1.7}/><Path d="M6 16l1 3m11-3-1 3" stroke="#D6B38A"/>{state.empty && <Path d="M8 16h8" stroke="#E1C8A7"/>}</>
    : id === 'juice' ? <><Path d="M5 7L8 3H19L21 7V23H5Z" fill={state.empty?'#E8DDC6':'#E9BF69'}/><Path d="M5 7H21M8 3L11 7" fill="none"/><Rect x={7} y={10} width={12} height={10} rx={2} fill="#FFF1D3"/>{!state.empty && <><Circle cx={13} cy={15} r={3} fill="#EC9989"/><Path d="M13 12l2-2" stroke="#79B090"/></>}<Path d="M16 11V1H10" fill="none" stroke="#79BDB1" strokeWidth={1.5}/>{state.empty && <Path d="M9 16h8" stroke="#B3A48A"/>}</>
    : id === 'teddy' ? <><Circle cx={5} cy={5} r={4} fill={paint("#D9B583")}/><Circle cx={19} cy={5} r={4} fill={paint("#D9B583")}/><Ellipse cx={12} cy={17} rx={7} ry={6} fill={paint("#D9B583")}/><Circle cx={12} cy={9} r={8} fill={paint("#D9B583")}/><Ellipse cx={12} cy={12} rx={4} ry={3} fill="#FFF1D3"/><Circle cx={9} cy={8} r={.7} fill="#493E38"/><Circle cx={15} cy={8} r={.7} fill="#493E38"/><Path d="M11 11h2l-1 1Z" fill="#493E38"/><Path d={state.on ? "M4 15l-2-6m18 6 2 4M7 22h-3m13 0h3" : "M4 15l-2 4m18-4 2 4M7 22h-3m13 0h3"} stroke={paint("#D9B583")} strokeWidth={4}/></>
    : id === 'ball' ? <><Circle cx={12} cy={12} r={10} fill={paint("#EC9989")}/>{state.on && <Circle cx={7} cy={6} r={2} fill="#FFF1D3" stroke="none"/>}<Path d="M4 6Q15 6 19 19M6 20Q10 8 21 8" fill="none" stroke="#FFF1D3" strokeWidth={2}/></>
    : id === 'book' ? <><Path d="M3 3L20 1V20L3 23Z" fill={paint("#79BDB1")}/><Path d="M3 20L20 17V21L3 23Z" fill="#FFF1D3"/><Path d="M6 4V18" stroke="#D1E8DC"/><Path d="M10 8l6-1m-6 4 6-1" stroke="#FFF1D3"/></>
    : <><Path d="M11 22Q-2 15 2 7Q4 3 8 6Q11-2 15 5Q21 0 22 8Q27 16 13 22Z" fill={paint("#EEC4AE")}/><Path d="M12 20L5 8m8 12L12 6m2 14 5-12" stroke="#BD8F7C" fill="none"/></>}
  </G>;
}
