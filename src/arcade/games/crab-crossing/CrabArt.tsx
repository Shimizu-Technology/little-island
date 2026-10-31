import React, { memo } from "react";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import type { Lane } from "./engine";
import { safeLaneScenery, type CoastPropKind } from "./scenery";

/** Scenery is painted into the lane only. The engine owns every walkable cell. */
function CoastProp({ kind, x, y, scale = 1 }: { kind: CoastPropKind; x: number; y: number; scale?: number }) {
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>
    <Ellipse cx={0} cy={0} rx={35} ry={9} fill="#244E50" opacity={0.28}/>
    {kind === "palm" ? <G>
      <Path d="M-7-3L-3-52L6-58L8-3Z" fill="#865A3F"/><Path d="M-3-52L6-58L8-3H1Z" fill="#C2915A"/>
      <Path d="M3-66L-38-74L-46-61L-9-54Z M3-68L-24-91L-8-94L10-72Z M4-69L24-93L42-84L14-57Z M7-67L47-69L43-54L5-57Z M-1-64L-37-51L-23-43L11-62Z" fill="#205F52"/>
      <Path d="M3-66L-38-74L-17-68L-9-54Z M4-69L24-93L29-78L14-57Z M7-67L47-69L28-62L5-57Z" fill="#65B56E"/>
      <Circle cx={1} cy={-60} r={5} fill="#B98555"/><Circle cx={9} cy={-57} r={4} fill="#D6A46A"/>
    </G> : kind === "rock" ? <G>
      <Path d="M-32-4L-25-24L-8-33L19-27L31-11L24 1H-24Z" fill="#667A84"/>
      <Path d="M-32-4L-25-24L-8-33L19-27L7-12L-4-6Z" fill="#A8B7AB"/>
      <Path d="M19-27L31-11L24 1H-4L7-12Z" fill="#536C77"/>
    </G> : kind === "flowers" ? <G>
      <Path d="M-33-3L-26-25L-10-18L0-31L13-19L27-27L35-4Z" fill="#398A61"/>
      <Path d="M-33-3L-26-25L-10-18L0-31L13-19L27-27L35-4Z" fill="#62AF70" opacity={0.55}/>
      {[-23,-11,3,17,29].map((dx, i) => <G key={dx}><Circle cx={dx} cy={-17 - i % 2 * 7} r={6} fill={i % 2 ? "#F6B6A0" : "#FFE19A"}/><Circle cx={dx} cy={-17 - i % 2 * 7} r={2} fill="#E5796B"/></G>)}
    </G> : kind === "umbrella" ? <G>
      <Path d="M0-3V-62" stroke="#845B48" strokeWidth={6}/>
      <Path d="M-39-53L-24-76L0-85L26-76L42-53L22-57L0-52L-21-58Z" fill="#E67F70"/>
      <Path d="M0-85L26-76L42-53L22-57L0-52Z" fill="#F4C476"/>
      <Path d="M-39-53L-24-76L0-85L0-52L-21-58Z" fill="#F2A995"/>
    </G> : <G>
      <Path d="M-28-4V-42L0-60L29-43V-4Z" fill="#C69062"/>
      <Path d="M0-60L29-43V-4H0Z" fill="#A96F4F"/>
      <Path d="M-38-38L-8-69H17L39-38L30-32L0-53L-28-31Z" fill="#408967"/>
      <Path d="M-8-69H17L39-38H9Z" fill="#7BB774"/>
      <Rect x={-7} y={-28} width={14} height={24} rx={3} fill="#6B4C42"/>
    </G>}
  </G>;
}

/** Faceted coast tiles share the same nine-column grid as the collision engine. */
export const CrabLane = memo(function CrabLane({ row, lane, learning, width, height }: {
  row: number; lane?: Lane; learning: boolean; width: number; height: number;
}) {
  const terrainRow = Math.min(row, 10);
  const water = learning ? row > 0 && row < 10 : !!lane && ["log", "turtle", "canoe", "island"].includes(lane.kind);
  const road = !!lane && !water;
  const grass = terrainRow === 0 || terrainRow === 5 || terrainRow === 10;
  const boardwalk = terrainRow === 5;
  const top = road ? "#536175" : water ? "#2CAAC4" : boardwalk ? "#CF9B63" : grass ? "#7EBA70" : "#EAC98D";
  const front = road ? "#354358" : water ? "#147C9F" : boardwalk ? "#926745" : grass ? "#4C8A61" : "#B7835E";
  return <Svg width={width} height={height} viewBox="0 0 900 100" preserveAspectRatio="none" accessible={false}>
    <Rect width={900} height={100} fill={front} />
    <Path d="M0 0H900V66L870 91H0Z" fill={top} />
    <Path d="M0 66H900L870 91H0Z" fill={front} />
    <Path d="M900 0V66L870 91V24Z" fill="#263E4C" opacity={0.16} />
    <Path d="M0 0H900V9H0Z" fill={road ? "#69778A" : water ? "#74D9DC" : grass ? "#A4D88A" : "#F6DDA9"} opacity={0.72} />
    {boardwalk ? <G>
      {Array.from({ length: 10 }, (_, i) => <G key={i}><Path d={`M${i * 96} 12V75`} stroke="#8A603F" strokeWidth={5} opacity={0.55} /><Path d={`M${i * 96 + 7} 18V64`} stroke="#F4CD88" strokeWidth={3} opacity={0.75} /></G>)}
      <Path d="M0 65H900" stroke="#F1C886" strokeWidth={7} opacity={0.7} />
    </G> : road ? <G>
      {Array.from({ length: 6 }, (_, i) => <Path key={i} d={`M${i * 165 + 30} 42h84l-10 7h-84Z`} fill="#EBDDB4" opacity={0.82} />)}
      <Path d="M0 70H900" stroke="#C9AB8C" strokeWidth={3} opacity={0.48} />
    </G> : water ? <G>
      {Array.from({ length: 10 }, (_, i) => <G key={i}>
        <Path d={`M${(i * 137 + row * 61) % 920} ${18 + i % 3 * 18}h42l-10 5h-42Z`} fill="#D8F9DD" opacity={0.72} />
        <Rect x={(i * 191 + row * 37) % 900} y={68 + i % 2 * 11} width={12} height={3} fill="#A4E9DC" />
      </G>)}
    </G> : <G>
      {Array.from({ length: 13 }, (_, i) => <Rect key={i} x={(i * 143 + row * 47) % 900} y={19 + i % 4 * 14} width={i % 3 === 0 ? 17 : 9} height={i % 3 === 0 ? 7 : 4} fill={grass ? "#5B9E68" : "#CBAB74"} opacity={0.58} />)}
    </G>}
    {safeLaneScenery(row, lane).map(([kind, x, y, scale], i) => <CoastProp key={i} kind={kind} x={x} y={y} scale={scale}/>)}
  </Svg>;
});

const paints = ["#ED826C", "#F3C85E", "#78BF9E", "#8FA9DA", "#D395C0", "#EAA969"];
/** Traffic and floating decks are purely visual; hit boxes remain the engine's spans. */
export const CrabVehicle = memo(function CrabVehicle({ kind, width, height, variant = 0, left = false }: {
  kind: Lane["kind"]; width: number; height: number; variant?: number; left?: boolean;
}) {
  const color = paints[variant % paints.length];
  const water = ["log", "turtle", "canoe", "island"].includes(kind);
  return <Svg width={width} height={height} viewBox="0 0 160 100" preserveAspectRatio="none" accessible={false}>
    <G transform={left ? "translate(160 0) scale(-1 1)" : undefined}>
      <Ellipse cx={78} cy={82} rx={65} ry={10} fill="#163E52" opacity={water ? 0.16 : 0.3} />
      {kind === "log" ? <G>
        <Path d="M5 41L18 27H149L157 40V66L145 76H16L5 65Z" fill="#85553B" />
        <Path d="M5 41L18 27H149L157 40H5Z" fill="#C89558" />
        <Path d="M157 40V66L145 76V53Z" fill="#684436" />
        <Path d="M31 34H128M22 48H138M38 60H119" stroke="#E8B876" strokeWidth={4} opacity={0.75} />
      </G> : kind === "canoe" ? <G>
        <Path d="M5 39H156L141 74H21Z" fill="#865A43" />
        <Path d="M5 39L24 25H142L156 39L141 54H21Z" fill={color} />
        <Path d="M29 39L39 32H129L137 39L127 46H38Z" fill="#684B45" />
        <Path d="M66 30V55M97 30V55" stroke="#F8DF9E" strokeWidth={5} />
      </G> : kind === "turtle" ? <G>
        <Path d="M20 46L7 34L3 53L22 63M136 46L154 32L157 55L137 64" fill="#7FB887" />
        <Path d="M26 60L12 74L35 76M124 60L143 75L120 77" fill="#86BD88" />
        <Path d="M29 53L52 29H110L134 53L112 75H49Z" fill="#3B8164" />
        <Path d="M52 29H110L134 53H29Z" fill="#8BC779" />
        <Path d="M76 30L66 49L81 62L101 48L92 30" fill="#B7D984" />
        <Circle cx={143} cy={48} r={10} fill="#9ACD91" /><Circle cx={147} cy={45} r={2} fill="#264B45" />
      </G> : kind === "island" ? <G>
        <Path d="M9 46L28 32H143L155 45V65L139 78H26L9 64Z" fill="#B78156" />
        <Path d="M9 46L28 32H143L155 45H9Z" fill="#E5CD89" />
        <Path d="M60 37V19H70V37" fill="#956849" /><Path d="M39 20L60 5H92L105 20L87 33H57Z" fill="#5AA96B" /><Path d="M60 5H92L105 20H39Z" fill="#91D27B" />
      </G> : kind === "bike" ? <G>
        <Ellipse cx={42} cy={69} rx={19} ry={10} fill="#31465C" /><Ellipse cx={118} cy={69} rx={19} ry={10} fill="#31465C" />
        <Path d="M24 57L43 47L62 57L42 65Z M99 57L118 47L137 57L117 65Z" fill="#E1EEF0" />
        <Path d="M35 51L59 28H106L126 51L109 61H51Z" fill={color} />
        <Path d="M59 28H106L119 45H43Z" fill="#FFE7A8" />
        <Path d="M106 28L119 45L126 51L109 61V39Z" fill="#AF7561" opacity={0.5} />
      </G> : <G>
        <Path d="M11 57L25 45H145L155 57V70L143 80H23L11 69Z" fill="#314960" />
        <Path d="M11 57L25 45H145L155 57H11Z" fill={color} />
        <Path d={kind === "bus" ? "M21 45L37 21H123L145 45Z" : "M31 45L50 29H106L125 45Z"} fill={color} />
        <Path d={kind === "bus" ? "M37 23H120L134 41H25Z" : "M52 31H104L117 42H39Z"} fill="#BCE4E5" />
        <Path d="M73 24L69 42M102 27L104 42" stroke="#6A8996" strokeWidth={4} />
        <Path d="M145 45L155 57V70L143 80V55Z" fill="#9F685E" opacity={0.55} />
        <Rect x={29} y={70} width={20} height={10} fill="#25374A" /><Rect x={116} y={70} width={20} height={10} fill="#25374A" />
        <Rect x={17} y={55} width={9} height={6} fill="#FFF2B4" /><Rect x={140} y={55} width={9} height={6} fill="#FFF2B4" />
        {kind === "bus" && [45,68,91].map(x => <Rect key={x} x={x} y={26} width={13} height={12} fill="#EAF5DB" opacity={0.7} />)}
      </G>}
    </G>
  </Svg>;
});
