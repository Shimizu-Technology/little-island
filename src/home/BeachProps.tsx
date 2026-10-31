import React from 'react';
import Svg,{G,Path,Rect,Ellipse} from 'react-native-svg';
import {tintPalette,type TintId} from './catalogMore';
/** Small original starter props, isolated from the parallel ART-owned directory. */
export function BeachPropArt({item,size,mirrored=false,rotation=0,tint='original',layer='all'}:{item:string;size:number;mirrored?:boolean;rotation?:number;tint?:TintId;layer?:string}){
 if(layer==='front')return null;
 const flip=mirrored!==(rotation===180||rotation===270),color=tint==='original'?'#79BDB1':tintPalette[tint];
 return <Svg width={size} height={size} viewBox="0 0 150 150" accessible={false}><G transform={flip?'translate(150 0) scale(-1 1)':undefined} stroke="#493E38" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
 {item==='beach-towel'?<><Path d="M28 77L115 72L135 118L17 125Z" fill={color}/><Path d="M32 88L118 84M24 109L129 102" stroke="#FFF1D3" strokeWidth={9}/>{[27,43,59,75,91,107,123].map(x=><Path key={x} d={`M${x} 123v7`} stroke="#FFF1D3"/>)}</>:<><Ellipse cx={77} cy={133} rx={62} ry={5} fill="#493E38" opacity={.12} stroke="none"/><Path d="M17 45L41 98L133 107L124 121L33 110L8 50Z" fill="#D9B583"/><Path d="M20 48L43 94L129 103L125 113L37 105L13 51Z" fill={color}/><Path d="M22 54L43 97M49 98L125 106" stroke="#FFF1D3" strokeWidth={6}/><Path d="M38 111L29 134M118 120L126 134" stroke="#B88F60" strokeWidth={7}/><Rect x={16} y={41} width={24} height={16} rx={7} transform="rotate(64 16 41)" fill="#FFF1D3"/></>}
 </G></Svg>;
}
