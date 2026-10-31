import React from 'react';
import { it, expect, vi } from 'vitest';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { writeFileSync } from 'node:fs';
import { RoomShellArt, MoreItemArt } from '../src/home/art/More';
import { roomDefaultTheme } from '../src/home/art/roomDefaults';
vi.mock('react-native-reanimated',()=>({default:{createAnimatedComponent:(c:unknown)=>c},useSharedValue:(value:number)=>({value}),useAnimatedProps:()=>({}),cancelAnimation:()=>{},withRepeat:()=>0,withSequence:()=>0,withTiming:()=>0,Easing:{inOut:()=>0,sin:0}}));
vi.mock('react-native-svg',()=>Object.fromEntries(Object.entries({default:'svg',G:'g',Circle:'circle',Ellipse:'ellipse',Rect:'rect',Path:'path',Defs:'defs',ClipPath:'clipPath',Pattern:'pattern',Text:'text',LinearGradient:'linearGradient',Stop:'stop',Filter:'filter',FeColorMatrix:'feColorMatrix'}).map(([name,tag])=>[name,({children,accessible:_a,...props}:Record<string,unknown>)=>React.createElement(tag,props,children as React.ReactNode)])));
vi.mock('../src/home/art/Room',()=>({wallColors:{cream:'#F5E6C8',lagoon:'#C5DED3',night:'#A5ADC9',peach:'#F1CEC0'},floorColors:{sand:'#EBD7B2',honey:'#DDAE7D',seafoam:'#AACDC1',rose:'#DCB9AA'}}));
const rooms=['kitchen','treehouse','beach'] as const;
it('keeps child-selected palette and earned patterns on every distinct shell',()=>{
  for(const room of rooms){
    const svg=render(<RoomShellArt room={room} theme={{wallpaper:'peach',floor:'rose'}}/>);
    expect(svg).toContain('#F1CEC0');expect(svg).toContain('#DCB9AA');
    expect(svg).toContain('M0 352H800V560H0Z');
    expect(render(<RoomShellArt room={room} theme={{wallpaper:'night-sky',floor:'island-breeze'}}/>)).toContain('url(#island-breeze)');
    expect(roomDefaultTheme[room]).toBeDefined();
  }
});
it('exports empty, six-item and theme-override comparison fixtures',()=>{
  const dir=process.env.ROOM_R2_EVIDENCE;if(!dir)return;
  let html='<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#faf2df;color:#385451;font:16px system-ui}h2{margin:12px} .room{position:relative;width:100%;aspect-ratio:800/560}.room>svg{position:absolute;inset:0} .item{position:absolute} .item svg{width:100%;height:100%}</style>';
  for(const room of rooms)for(const mode of ['empty','six-items','override']){
    const theme=mode==='override'?{wallpaper:'night-sky' as const,floor:'game-room' as const}:process.env.ROOM_R2_BEFORE?{wallpaper:'cream' as const,floor:'sand' as const}:roomDefaultTheme[room];
    html+=`<section id="${room}-${mode}"><h2>${room} · ${mode}</h2><div class="room">${render(<RoomShellArt room={room} theme={theme}/> )}`;
    if(mode==='six-items')for(const [id,x,y,size] of [['sofa',260,365,130],['side-table',410,375,100],['potted-fern',412,330,65],['floor-lamp',620,370,115],['teddy',515,455,70],['round-rug',325,475,125]] as const){
      html+=`<div class="item" style="left:${(x-size/2)/8}%;top:${(y-size)/5.6}%;width:${size/8}%;height:${size/5.6}%">${render(<MoreItemArt id={id} size={size}/>)}</div>`;
    }
    html+='</div></section>';
  }
  writeFileSync(`${dir}/${process.env.ROOM_R2_BEFORE?'before':'after'}.html`,html);
});
