import React from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { RoomId } from '../catalogMore';
const ink='#47655B', cream='#FFF1D3';
/** Permanent scenery stays above the floor's back edge, outside furniture depth. */
export function ShellWallDetails({room}:{room:Exclude<RoomId,'home'>}) {
  if(room==='kitchen') return <G stroke={ink} strokeWidth={2.5} strokeLinejoin="round">
    <Path d="M234 82L415 91V193L234 184Z" fill="#D5A87E" stroke="#536E62" strokeWidth={4}/>
    <Path d="M245 91L405 98V180L245 172Z" fill="#C9E8DB" stroke="none"/>
    <Path d="M245 145q42-31 81-7t79-3v45l-160-8Z" fill="#91C3AB" stroke="none"/>
    <Path d="M245 158q51-21 85-2t75-10v34l-160-8Z" fill="#6CA79B" stroke="none"/>
    <Path d="M325 94v84M245 132l160 8" stroke="#FFF2D7" strokeWidth={7}/>
    <Path d="M238 81q14 51 0 102l22 2q-8-51 4-101ZM406 90q-14 48 0 103l-23-3q8-50-3-102Z" fill="#EEB0A1" stroke="#705E5D" strokeWidth={2}/>
    <Path d="M246 89q8 38 0 83m12-80q-7 42 0 85m137-85q-7 42 0 89" fill="none" stroke="#FFE6D1" strokeWidth={2}/>
    <Path d="M231 184l188 10" stroke="#FFF2D7" strokeWidth={9}/>
    <Path d="M151 201L750 239V314L151 276Z" fill="#D8E8D6"/>
    {[0,1,2].map(n=><Path key={n} d={`M152 ${218+n*23}L750 ${256+n*23}`} stroke="#94B8A5"/>)}
    {Array.from({length:20},(_,n)=><Path key={n} d={`M${157+n*30} ${202+n*1.9}v73`} stroke="#94B8A5"/>)}
    <Path d="M154 263L748 301V315L154 277Z" fill="#BB815B"/><Path d="M153 261L748 299" stroke={cream} strokeWidth={7}/>
    <G transform="translate(492 106) rotate(3)">
      {[0,1].map(n=><G key={n} transform={`translate(0 ${n*76})`}>
        <Path d="M0 39H218V49H0Z" fill="#D8A26F"/><Path d="M15 50v13m186-13v13" strokeWidth={5}/>
        {[0,1,2].map(i=><G key={i} transform={`translate(${10+i*39} 0)`}><Rect y={7} width={27} height={30} rx={7} fill={['#E8B986','#A9CABA','#ECAC98'][i]}/><Rect x={-1} y={3} width={29} height={7} rx={3} fill="#C48D64"/><Path d="M7 17h12m-12 7h12" stroke={cream}/></G>)}
        <Ellipse cx={165} cy={22} rx={22} ry={17} fill={cream}/><Ellipse cx={165} cy={22} rx={14} ry={10} fill="none" stroke="#9CBDB1"/>
        <Path d="M192 33V14q0-8 10-8h9v27Z" fill="#F0CE7D"/>
      </G>)}
    </G>
    <Path d="M389 56V99" strokeWidth={5}/><Path d="M361 124Q363 96 389 96Q415 96 417 124Z" fill="#EDBB60"/><Ellipse cx={389} cy={124} rx={28} ry={6} fill={cream}/>
  </G>;
  if(room==='treehouse') return <G stroke={ink} strokeWidth={2.5} strokeLinecap="round">
    {Array.from({length:8},(_,n)=><G key={n}><Path d={`M149 ${53+n*31}L752 ${94+n*31}`} stroke="#98734E" opacity={.65}/><Path d={`M${170+n*57} ${66+n*27}q28-7 57 3m-41 7q21-4 39 2`} stroke="#B58B5D" fill="none"/></G>)}
    <Circle cx={318} cy={165} r={79} fill="#BE8D5C"/><Circle cx={318} cy={165} r={66} fill="#C9DFAB"/>
    <Path d="M259 192Q295 153 372 127M292 206Q314 165 320 105" fill="none" stroke="#98734E" strokeWidth={11}/>
    {[ [279,150],[333,132],[344,186],[292,114],[366,160] ].map(([x,y])=><Path key={x} d={`M${x} ${y}q-33-30-44-4q16 29 44 4q13-34 34-15q4 25-34 15`} fill="#78A878"/>)}
    <Circle cx={318} cy={165} r={67} fill="none" stroke={cream} strokeWidth={7}/>
    <Path d="M83 331Q103 261 77 191Q55 133 91 81M79 204Q107 177 133 166" fill="none" stroke="#775C42" strokeWidth={34}/><Path d="M83 327Q99 264 76 199Q56 143 91 86M79 204l49-36" fill="none" stroke="#BA8C60" strokeWidth={22}/><Path d="M78 287q10-34-1-64M79 169q-9-28 1-49" fill="none" stroke="#E0B37D" strokeWidth={3}/>
    <Path d="M432 82Q576 151 724 100" stroke="#7C7657" fill="none"/>
    {[445,480,515,550,585,620,655,690,720].map((x,i)=><G key={x}><Path d={`M${x} ${91+Math.sin(i/8*Math.PI)*35}v10`} strokeWidth={2}/><Circle cx={x} cy={105+Math.sin(i/8*Math.PI)*35} r={6} fill="#FFE6A0" stroke="#C9A56B"/></G>)}
  </G>;
  return <G stroke={ink} strokeWidth={2.5} strokeLinejoin="round">
    <Path d="M185 85L689 119V309L185 277Z" fill="#BCE2DC" stroke="#AE875A" strokeWidth={14}/>
    <Circle cx={531} cy={154} r={24} fill="#FFF0B4" stroke="none"/>
    <Path d="M192 196Q398 176 682 214V302L192 270Z" fill="#73BAB6" stroke="none"/><Path d="M192 246Q415 215 682 267V303L192 271Z" fill="#A6D3C3" stroke="none"/><Path d="M193 260Q412 228 682 281" stroke={cream} strokeWidth={5} fill="none"/>
    <Path d="M625 291Q566 228 598 146" stroke="#B68A60" strokeWidth={13} fill="none"/><Path d="M598 151Q557 104 522 143Q562 132 598 151Q620 103 666 136Q625 130 598 151Q547 151 542 191Q569 166 598 151Q645 147 668 186Q629 168 598 151" fill="#78A479"/>
    <Path d="M178 278L696 312" stroke="#E4BC87" strokeWidth={16}/>
    {[222,256,291,337,383,427].map((x,i)=><G key={x} transform={`translate(${x} ${276+(x-180)*.065})`}><Path d="M-8 0Q-14-18 0-15Q14-18 8 0Z" fill={i%2?'#F0C4AD':cream}/><Path d="M0-12V-1M-5-9l3 9m7-9L2 0" stroke="#B59679" strokeWidth={1}/></G>)}
    <G transform="translate(60 174) rotate(4)"><Path d="M0 128V37Q13-19 25 37V128Z" fill="#87B8AA"/><Path d="M31 124V21Q45-34 59 21V124Z" fill="#E4B68A"/><Path d="M43-4v124M9 20v105" stroke={cream} strokeWidth={4}/><Path d="M-4 75H67M-3 112H65" stroke="#876E50" strokeWidth={8}/></G>
  </G>;
}
export function ShellFloorDetails({room, patterned=false}:{room:Exclude<RoomId,'home'>;patterned?:boolean}) {
  if(room==='treehouse') return <G stroke="#9B784F" strokeWidth={2} fill="none" opacity={.65}>
    {[0,1,2,3,4,5,6,7,8].map(n=><G key={n}><Path d={`M${151+n*68} ${294+n*4}L${170+n*67} ${535-n*3}`}/><Path d={`M${165+n*68} ${325+n*3}q-8 35 1 64t0 66`}/><Ellipse cx={179+n*65} cy={409+n%3*28} rx={5} ry={13}/></G>)}
    <Path d="M73 382L133 340L200 349L143 395Z" fill="#B99062" strokeWidth={5}/><Path d="M83 380L135 347L185 352L140 386ZM108 369l48 6m-35-15l48 6" stroke="#EFCE95" strokeWidth={3}/>
  </G>;
  if(room==='beach') return <G stroke="#B7A88A" fill="none" opacity={.65}>
    <Path d="M34 374L145 291L758 330L779 508L162 535Z" fill="#FFF7DE" stroke="none" opacity={.3}/>
    {[0,1,2,3,4,5].map(n=><Path key={n} d={`M${53+n*20} ${359+n*29}L${762+n*3} ${351+n*31}`} strokeWidth={3}/>)}
    {[0,1,2,3,4,5,6].map(n=><Path key={n} d={`M${201+n*76} ${365+n%2*40}q38-9 61 1m-41 8h23`} strokeWidth={2}/>)}
    <Path d="M36 376Q67 379 94 404Q67 400 58 410ZM164 534Q205 510 294 526L164 534ZM707 512Q744 484 777 484L779 508Z" fill="#F8E6BA" stroke="none"/>
    {[ [78,399],[191,524],[218,521],[745,502],[756,493] ].map(([x,y])=><Circle key={x} cx={x} cy={y} r={2} fill="#C2A575" stroke="none"/>)}
  </G>;
  if(patterned) return null;
  // Checker tiles use the exact perspective cells of the unchanged floor grid.
  const point=(u:number,v:number)=>[151+u*68+v*(19-u/6),294+u*4+v*(241-u*7)/6];
  return <G fill="#709F91" opacity={.27}>{Array.from({length:12},(_,col)=>Array.from({length:9},(_,row)=>{
    const u=col-2,v=row-1;
    if((u+v)%2) return null;
    const p=[point(u,v),point(u+1,v),point(u+1,v+1),point(u,v+1)];
    return <Path key={`${u}-${v}`} d={`M${p.map(a=>a.join(' ')).join('L')}Z`}/>;
  }))}</G>;
}
