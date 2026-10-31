import React from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Pattern, Rect, Stop } from "react-native-svg";
import type { HomeState } from "../model";
import type { RoomId } from "../catalogMore";
import { BadgeGlyph } from "../../badges/BadgeArt";
import { tracks, badgeInfo, type BadgeId } from "../../badges/engine";

const ink = "#64554C";
const wood = "#BD8C66";
const ivory = "#FFF4DE";
const wallColors: Record<HomeState["theme"]["wallpaper"], string> = {cream:"#F5E6C8",lagoon:"#C5DED3",night:"#A5ADC9",peach:"#F1CEC0","math-lab":"#B6CABE",library:"#E7CFAD","night-sky":"#B5BDD3","arcade-neon":"#C9C5DA"};
const floorColors: Record<HomeState["theme"]["floor"], string> = {sand:"#EBD7B2",honey:"#DDAE7D",seafoam:"#AACDC1",rose:"#DCB9AA","island-breeze":"#D9C79B","game-room":"#BCCBC0"};
type Room = RoomId;

function Window({ round = false, wide = false }: { round?: boolean; wide?: boolean }) {
  const x = wide ? 245 : 112, y = wide ? 75 : 86, w = wide ? 310 : 200, h = wide ? 210 : 205;
  return <G>
    {round ? <><Circle cx={400} cy={181} r={104} fill="#A5D9DB" stroke={wood} strokeWidth={19}/><Circle cx={400} cy={181} r={83} fill="#D7E9CE"/><Path d="M316 207Q408 124 483 182V255H316Z" fill="#7FAF9A"/><Path d="M320 227Q406 193 480 220" stroke="#F6F0D8" strokeWidth={7} fill="none"/><Circle cx={400} cy={181} r={102} fill="none" stroke={ink} strokeWidth={3}/></> :
      <><Rect x={x} y={y} width={w} height={h} rx={18} fill="#A4D4D8" stroke={ink} strokeWidth={3}/>
        <Circle cx={x+w-44} cy={y+52} r={29} fill="#FFF0C1"/>
        <Path d={`M${x} ${y+133}Q${x+70} ${y+89} ${x+145} ${y+129}T${x+w} ${y+112}V${y+h}H${x}Z`} fill="#9FC5A4"/>
        <Path d={`M${x} ${y+164}Q${x+110} ${y+130} ${x+w} ${y+166}V${y+h}H${x}Z`} fill="#78B9AF"/>
        <Path d={`M${x+w/2} ${y}V${y+h}M${x} ${y+h/2}H${x+w}`} stroke={ivory} strokeWidth={10}/>
        <Rect x={x-10} y={y-10} width={w+20} height={h+20} rx={23} fill="none" stroke={wood} strokeWidth={14}/>
        <Path d={`M${x-17} ${y+h+12}h${w+34}`} stroke={ink} strokeWidth={4}/></>}
  </G>;
}

function Shelf({ x, y, kitchen = false }: { x: number; y: number; kitchen?: boolean }) {
  return <G stroke={ink} strokeWidth={2}>
    <Rect x={x} y={y+66} width={195} height={12} rx={4} fill={wood}/>
    {[0,1,2,3].map(n => kitchen ?
      <G key={n}><Ellipse cx={x+32+n*42} cy={y+61} rx={16} ry={5} fill={ivory}/><Rect x={x+17+n*42} y={y+28+n%2*8} width={30} height={32-n%2*8} rx={4} fill={["#B9D9CF","#E8B4A3","#EBCB8F","#AFC6D2"][n]}/><Path d={`M${x+22+n*42} ${y+37+n%2*8}h20`} stroke={ivory}/></G> :
      <G key={n}><Rect x={x+15+n*43} y={y+25+n%2*8} width={25} height={40-n%2*8} rx={3} fill={["#8BB7AC","#E8A899","#E9C77F","#9BA6C5"][n]}/><Path d={`M${x+20+n*43} ${y+34+n%2*8}h14m-14 20h14`} stroke={ivory} strokeWidth={2}/></G>)}
    <Path d={`M${x+15} ${y+78}v12m165-12v12`} stroke={wood} strokeWidth={5}/>
  </G>;
}

function Plant({ x, y }: { x: number; y: number }) {
  return <G stroke={ink} strokeWidth={2}>
    <Path d={`M${x-26} ${y}h52l-9 45h-34Z`} fill="#D9A482"/>
    <Path d={`M${x} ${y}v-100m0 55q-28-35-44-34m44 10q27-38 45-38`} stroke="#638D6C" strokeWidth={6} fill="none"/>
    {[-36,-19,0,19,37].map((dx,n)=><Ellipse key={dx} cx={x+dx} cy={y-82-(n%2)*23} rx={22} ry={11} transform={`rotate(${dx<0?-25:25} ${x+dx} ${y-82-(n%2)*23})`} fill={n%2?"#85AF78":"#6E9E77"}/>)}
    <Path d={`M${x-18} ${y+11}h36`} stroke={ivory} opacity={.8}/>
  </G>;
}

export function StageRoom({ room, theme, badges = [], onBadgePress }: { room: Room; theme: HomeState["theme"]; badges?: readonly BadgeId[]; onBadgePress?: (id: BadgeId) => void }) {
  const tree = room === "treehouse", kitchen = room === "kitchen", beach = room === "beach";
  const wall = wallColors[theme.wallpaper], floor = floorColors[theme.floor];
  return <Svg width="100%" height="100%" viewBox="0 0 800 560" accessible={false}>
    <Defs>
      <LinearGradient id="stage-wall" x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor={wall}/><Stop offset="1" stopColor={tree?"#C9A37D":beach?"#E9D4B2":"#F1DFC1"}/></LinearGradient>
      <LinearGradient id="stage-floor" x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor={floor}/><Stop offset="1" stopColor={tree?"#B88559":beach?"#F5E0B6":"#D5AB82"}/></LinearGradient>
      <Pattern id="stage-wall-lines" width={tree?88:beach?24:52} height={tree?31:beach?70:52} patternUnits="userSpaceOnUse"><Path d={tree?"M0 30H88M21 4q24-4 43 1":beach?"M3 0V70M17 0V70":"M2 0V52"} stroke={tree?"#8C6849":beach?"#B89C75":"#FFFFFF"} strokeWidth={tree?3:2} opacity={.28} fill="none"/></Pattern>
      <Pattern id="stage-floor-lines" width={kitchen?50:100} height={kitchen?50:46} patternUnits="userSpaceOnUse"><Path d={kitchen?"M0 0H50M0 0V50":"M0 0H100M50 0V46"} stroke={kitchen?"#8EB4A8":"#8F6E53"} opacity={.35} fill="none" strokeWidth={2}/></Pattern>
      {(["math-lab","library","night-sky","arcade-neon"] as const).map((name,n)=><Pattern key={name} id={name} width={64} height={64} patternUnits="userSpaceOnUse"><Rect width={64} height={64} fill={wallColors[name]}/><Path d={n===1?"M4 53h56M10 18v35m12-28v28m14-38v38m12-31v31":"M0 0h64M0 0v64M32 0v64"} stroke={n===2?"#FFF0C5":"#77978D"} strokeWidth={2} opacity={.45}/></Pattern>)}
      {(["island-breeze","game-room"] as const).map(name=><Pattern key={name} id={name} width={48} height={48} patternUnits="userSpaceOnUse"><Rect width={48} height={48} fill={floorColors[name]}/><Path d="M0 0h48M0 0v48M24 0v48" stroke="#8D9C83" strokeWidth={2}/></Pattern>)}
    </Defs>
    <Rect width={800} height={560} fill={theme.wallpaper in {"math-lab":1,library:1,"night-sky":1,"arcade-neon":1}?`url(#${theme.wallpaper})`:"url(#stage-wall)"}/>
    <Rect width={800} height={352} fill="url(#stage-wall-lines)"/>
    {kitchen && <><Rect y={244} width={800} height={108} fill="#D9E5D9"/>{Array.from({length:20},(_,n)=><Path key={n} d={`M${n*42} 244v108`} stroke="#A5C6B7" strokeWidth={2}/>)}{[272,300,328].map(y=><Path key={y} d={`M0 ${y}h800`} stroke="#A5C6B7" strokeWidth={2}/>)}</>}
    {tree && <G>{Array.from({length:9},(_,n)=><Path key={n} d={`M0 ${n*39}h800`} stroke="#956D4D" opacity={.42} strokeWidth={4}/>)}</G>}
    <Path d="M0 352H800V560H0Z" fill={theme.floor === "island-breeze" || theme.floor === "game-room"?`url(#${theme.floor})`:"url(#stage-floor)"} stroke={ink} strokeWidth={3}/>
    <Rect y={352} width={800} height={208} fill="url(#stage-floor-lines)"/>
    <Path d="M0 351H800" stroke={ivory} strokeWidth={13}/>
    <Path d="M0 360H800" stroke={wood} strokeWidth={6}/>
    <Path d="M240 360L60 560M560 360L740 560" stroke="#9A795C" strokeWidth={2} opacity={.18}/>
    <Path d="M340 355L465 355L570 545L260 545Z" fill={beach?"#FFF4D9":"#FFF3DF"} opacity={.17}/>
    {room==="home" && <>
      <Window/><Path d="M100 75q27 68 0 206l30 9q-16-103 3-215ZM324 76q-17 82 4 210l-31 3q14-112-7-213Z" fill="#E5A7A0" stroke={ink} strokeWidth={2}/>
      <Path d="M112 90q13 77 1 169m201-171q-15 77-3 174" stroke={ivory} fill="none" strokeWidth={3}/>
      <Path d="M18 50Q190 100 395 55" stroke={wood} strokeWidth={3} fill="none"/>
      {[54,103,151,200,249,298,345].map((x,n)=><G key={x}><Path d={`M${x} ${65+n%2*6}v13`} stroke={wood} strokeWidth={2}/><Circle cx={x} cy={80+n%2*6} r={6} fill={n%2?"#F4D391":"#F6C7B6"} stroke={ink} strokeWidth={1}/></G>)}
      <Shelf x={516} y={224}/><Plant x={732} y={303}/>
      <Rect x={524} y={26} width={178} height={172} rx={11} fill="#B88562" stroke={ink} strokeWidth={3}/>
      <Rect x={531} y={33} width={164} height={158} rx={7} fill="#E9CC9E"/>
      {tracks.flatMap((track,row)=>([1,2,3,4] as const).map((tier,col)=>{
        const id: BadgeId = `${track}-${tier}`, earned = badges.includes(id), info = badgeInfo(id);
        return <G key={id} transform={`translate(${536+col*39} ${37+row*22})`} onPress={()=>onBadgePress?.(id)} accessible accessibilityLabel={`${info.name}. ${earned?'Earned':info.rule}. Open My badges`}>
          <Rect width={34} height={22} rx={4} fill={earned?"#FFF3D4":"#CFAE88"} stroke="#B28D66" strokeWidth={1}/>
          <G transform="translate(4 0) scale(.25)"><BadgeGlyph id={id} earned={earned}/></G>
        </G>;
      }))}
      <Rect x={412} y={118} width={83} height={96} rx={5} fill="#C7956F" stroke={ink} strokeWidth={3}/><Path d="M422 196l21-33 16 18 11-27 16 42Z" fill="#85B5A5"/><Circle cx={470} cy={143} r={9} fill="#F4CF86"/>
      <Path d="M386 254h113" stroke={wood} strokeWidth={11}/><Path d="M396 249h92" stroke={ivory} strokeWidth={3}/><Rect x={393} y={217} width={19} height={33} rx={2} fill="#83B5AB" stroke={ink}/><Rect x={419} y={227} width={17} height={23} rx={2} fill="#E9B397" stroke={ink}/><Circle cx={464} cy={236} r={14} fill="#E9C588" stroke={ink}/><Circle cx={455} cy={227} r={7} fill="#E9C588"/><Circle cx={473} cy={227} r={7} fill="#E9C588"/>
      <Path d="M34 98h55v73H34Z" fill="#EAC29F" stroke={ink} strokeWidth={3}/><Path d="M45 110h33v49H45Z" fill="#F7EAD1"/><Path d="M46 151l13-22 18 23" fill="#EAA993"/>
      <Circle cx={772} cy={130} r={16} fill="#F6D995"/><Path d="M772 146v47" stroke={wood} strokeWidth={5}/>
    </>}
    {kitchen && <>
      <Window wide/><Shelf x={31} y={111} kitchen/><Shelf x={563} y={110} kitchen/>
      <Path d="M240 291h321" stroke={wood} strokeWidth={11}/><Path d="M251 285h299" stroke={ivory} strokeWidth={3}/>
      {[286,318,495,527].map((x,n)=><G key={x}><Rect x={x} y={258+n%2*9} width={19} height={27-n%2*9} rx={3} fill={n%2?"#E9BA9C":"#B6D2C5"} stroke={ink}/><Path d={`M${x+4} 268h11`} stroke={ivory}/></G>)}
      <Path d="M593 225h160" stroke={wood} strokeWidth={8}/>{[610,666,720].map((x,n)=><G key={x}><Path d={`M${x} 229v28`} stroke={ink} strokeWidth={3}/><Ellipse cx={x} cy={272} rx={n===1?24:18} ry={n===1?16:12} fill="#B6BDB4" stroke={ink} strokeWidth={3}/></G>)}
      <Rect x={282} y={310} width={235} height={34} rx={6} fill="#D2A47D" stroke={ink} strokeWidth={3}/><Ellipse cx={398} cy={322} rx={42} ry={9} fill="#B4D0D0"/><Path d="M419 319v-31q0-15-19-14v11" fill="none" stroke={ink} strokeWidth={5}/>
      <Rect x={584} y={42} width={160} height={46} rx={5} fill="#DEB18B" stroke={ink} strokeWidth={3}/>
    </>}
    {tree && <>
      <Window round/><Path d="M70 0v330M730 0v330" stroke="#8C6849" strokeWidth={24}/><Path d="M69 0v330M729 0v330" stroke="#D4AD79" strokeWidth={10}/>
      <Path d="M535 0q-32 105-8 196M579 0q-28 124-7 219" fill="none" stroke="#6F9A6C" strokeWidth={8}/>
      <Plant x={558} y={280}/><Shelf x={100} y={148}/>
      <Path d="M212 0v128m376-128v128" stroke="#987451" strokeWidth={5}/><Path d="M201 127h33l-4 48h-25Z" fill="#E7C688" stroke={ink} strokeWidth={3}/><Path d="M576 127h33l-4 48h-25Z" fill="#E7C688" stroke={ink} strokeWidth={3}/><Circle cx={217} cy={153} r={10} fill="#FFF2BC"/><Circle cx={592} cy={153} r={10} fill="#FFF2BC"/>
      <Path d="M647 0v110m71-110v110" stroke="#9B7F5B" strokeWidth={5}/><Path d="M625 110h115l-18 62h-79Z" fill="#E9C383" stroke={ink} strokeWidth={3}/><Ellipse cx={682} cy={164} rx={42} ry={11} fill="#FFE3A9"/>
    </>}
    {beach && <>
      <Window wide/><Path d="M228 62v225m345-225v225" stroke={wood} strokeWidth={15}/>
      <Path d="M240 50q157 48 320 0" stroke={wood} strokeWidth={3} fill="none"/>{[270,315,360,405,450,495,540].map((x,n)=><G key={x}><Path d={`M${x} ${58+Math.sin(n/6*Math.PI)*17}v17`} stroke={wood} strokeWidth={2}/><Path d={`M${x-8} ${78+Math.sin(n/6*Math.PI)*17}q8-18 16 0q-8 12-16 0`} fill={n%2?"#F5D0AC":"#F8EDD4"} stroke={ink}/></G>)}
      <Path d="M226 90l-86 62v139l88-40ZM573 90l88 63v138l-88-40Z" fill="#D5AB79" stroke={ink} strokeWidth={3}/>
      <Path d="M91 96h45v210H91Z" fill="#7BB6B0" stroke={ink} strokeWidth={3}/><Path d="M154 79h46v228h-46Z" fill="#E8B58D" stroke={ink} strokeWidth={3}/><Path d="M99 170h96M108 99v198m70-209v209" stroke={ivory} strokeWidth={4}/>
      <Path d="M75 311h160" stroke={wood} strokeWidth={13}/><Plant x={715} y={314}/>
      <Path d="M589 81q78 15 146 0" fill="none" stroke={wood} strokeWidth={3}/>{[605,634,665,695,723].map((x,n)=><G key={x}><Path d={`M${x} 88v22`} stroke={wood}/><Path d={`M${x-8} 111q8-20 16 0q-8 10-16 0`} fill={n%2?"#F3C9AD":"#FFF0D7"} stroke={ink}/></G>)}
    </>}
    {room==="home" && <G stroke={ink} strokeWidth={2}><Rect x={8} y={276} width={155} height={70} rx={7} fill="#D6AA80"/><Path d="M16 305h140M55 305v36m56-36v36" stroke="#8B725B" strokeWidth={3}/><Rect x={23} y={285} width={22} height={19} rx={3} fill="#80B1A5"/><Circle cx={79} cy={295} r={11} fill="#F0C98D"/><Path d="M122 285l17 18h-34Z" fill="#E99E94"/></G>}
    {kitchen && <G stroke={ink} strokeWidth={2}><Rect x={0} y={296} width={202} height={52} rx={6} fill="#C89E78"/><Rect x={6} y={302} width={91} height={43} rx={3} fill="#E7C7A1"/><Rect x={104} y={302} width={91} height={43} rx={3} fill="#E7C7A1"/><Circle cx={84} cy={325} r={3} fill={wood}/><Circle cx={118} cy={325} r={3} fill={wood}/><Path d="M0 296h202" stroke={ivory} strokeWidth={7}/><Rect x={640} y={302} width={160} height={46} rx={5} fill="#C89E78"/><Path d="M650 314h140m-140 20h140" stroke="#F1D4B0"/></G>}
    {tree && <G stroke={ink} strokeWidth={2}><Path d="M0 293h173v55H0Z" fill="#B98A5F"/><Path d="M11 304h151m-151 30h151M62 304v30m53-30v30" stroke="#E7BE88" strokeWidth={3}/><Rect x={14} y={271} width={31} height={21} rx={4} fill="#E7C18C"/><Rect x={52} y={275} width={26} height={17} rx={4} fill="#8CB3A0"/><Path d="M646 300h154v48H646Z" fill="#B98A5F"/><Path d="M655 311h136m-136 26h136" stroke="#E7BE88" strokeWidth={3}/></G>}
    {beach && <G stroke={ink} strokeWidth={2}><Path d="M0 314h170v34H0Z" fill="#CDAF83"/><Path d="M0 312h170" stroke={ivory} strokeWidth={6}/><Path d="M631 316h169v32H631Z" fill="#CDAF83"/><Path d="M640 320q12-12 24 0l-4 22h-16Zm45 0q12-12 24 0l-4 22h-16Zm45 0q12-12 24 0l-4 22h-16Z" fill="#E9CE9C"/><Path d="M640 330h114" stroke="#AD8C61" strokeWidth={2}/></G>}
  </Svg>;
}
