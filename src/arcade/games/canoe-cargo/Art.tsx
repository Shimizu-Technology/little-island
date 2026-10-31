import React, { memo, useId } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import type { OutfitId } from "../../progress";
import { pieceCells, type CargoPiece, type CargoKind } from "./engine";
export const cargoPalette = { crate: ["#C88B4D", "#F7CD83"], coconut: ["#708F46", "#CFDA83"], fish: ["#618FAD", "#C7E4E3"], taro: ["#A17591", "#E3B4CB"] };
export const CargoTile = memo(function CargoTile({ kind, value = 0, stuck = false, size = 32 }: { kind: CargoKind; value?: number; stuck?: boolean; size?: number }) {
  const [base, light] = cargoPalette[kind];
  return <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
    <Rect x={1} y={3} width={38} height={36} rx={4} fill="#172C39" opacity={.4}/>
    <Rect x={1} y={1} width={38} height={37} rx={4} fill={base} stroke="#253C3F" strokeWidth={2}/>
    <Path d="M8 7Q20 3 31 7" stroke={light} strokeWidth={3} strokeLinecap="round" fill="none"/>
    <G transform="translate(7 7) scale(.65)" opacity={.8}>{kind === "crate" ? <G stroke="#69482E" strokeWidth={2}><Path d="M6 12H34M6 27H34M11 12L29 27M29 12L11 27"/>{stuck && <Rect x={16} y={15} width={8} height={9} rx={2} fill="#FFE5A1"/>}</G> : kind === "coconut" ? <G fill="#3F512C"><Circle cx={15} cy={19} r={2}/><Circle cx={23} cy={16} r={2}/><Circle cx={22} cy={23} r={2}/><Path d="M10 29Q15 25 18 30" stroke={light} strokeWidth={2}/></G> : kind === "fish" ? <G><Path d="M26 19L33 13V26Z" fill={light}/><Ellipse cx={18} cy={20} rx={10} ry={6} fill={light}/><Circle cx={13} cy={19} r={1.8} fill="#253C3F"/><Path d="M8 29H32" stroke="#335D75" strokeWidth={2}/></G> : <G><Path d="M12 29Q7 16 19 13Q31 15 28 29Z" fill={light}/><Path d="M20 14Q15 7 11 11M20 14Q23 5 29 11" stroke="#486343" strokeWidth={3} fill="none"/><Path d="M18 20L20 27M24 19L25 25" stroke={base} strokeWidth={2}/></G>}
    </G>
    {!!value && <><Circle cx={20} cy={22} r={11} fill="#FFF7DC" stroke="#253C3F" strokeWidth={1.5}/><SvgText x={20} y={28} textAnchor="middle" fill="#203541" fontSize={18} fontWeight="900">{value}</SvgText></>}
  </Svg>;
});
/** One exterior boundary for the whole bundle; no internal cell borders in this layer. */
export const CargoOutline = memo(function CargoOutline({ piece, cell, ghost = false }: { piece: CargoPiece; cell: number; ghost?: boolean }) {
  const cells = pieceCells(piece), has = (r: number, c: number) => cells.some(p => p[0] === r && p[1] === c);
  const d = cells.flatMap(([r, c]) => [
    !has(r - 1, c) ? `M${c * cell} ${r * cell}h${cell}` : "",
    !has(r, c + 1) ? `M${(c + 1) * cell} ${r * cell}v${cell}` : "",
    !has(r + 1, c) ? `M${c * cell} ${(r + 1) * cell}h${cell}` : "",
    !has(r, c - 1) ? `M${c * cell} ${r * cell}v${cell}` : "",
  ]).join(" ");
  return <Svg width={cell * 4} height={cell * 4} viewBox={`0 0 ${cell * 4} ${cell * 4}`} style={{ overflow: "visible" }} accessible={false}>{ghost && cells.map(([r, c]) => <Rect key={`${r}-${c}`} x={c * cell + 2} y={r * cell + 2} width={Math.max(0, cell - 4)} height={Math.max(0, cell - 4)} rx={3} fill="#E7E6B1" opacity={.18}/>)}<Path d={d} fill="none" stroke={ghost ? "#DCE9C7" : "#FFF3C6"} strokeWidth={ghost ? 1.8 : 2} strokeLinejoin="round" opacity={ghost ? .85 : .95} strokeDasharray={ghost ? "4 4" : undefined}/></Svg>;
});
export const CargoCaptain = memo(function CargoCaptain({ size = 120, outfit = "island", happy = false, dizzy = false }: { size?: number; outfit?: OutfitId; happy?: boolean; dizzy?: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 160 160" accessible={false}>
    <Ellipse cx={80} cy={144} rx={49} ry={8} fill="#193C4B" opacity={.2}/>
    <Path d="M46 132L33 143H62L61 130M97 132L86 143H115L112 130" fill="#DFA751" stroke="#634831" strokeWidth={3}/>
    <Ellipse cx={79} cy={106} rx={39} ry={33} fill="#FBF1CF" stroke="#304553" strokeWidth={3}/>
    <Path d={happy ? "M49 99Q14 68 22 57Q38 62 61 84M103 94Q129 58 142 66Q138 90 111 112" : "M48 94Q26 100 38 126Q50 133 64 117M107 94Q131 105 115 130L96 117"} fill="#C4D6CF" stroke="#304553" strokeWidth={3}/>
    <Path d="M52 89L72 98L81 91L105 89L109 117Q80 133 49 116Z" fill={outfit === "explorer" ? "#899C67" : outfit === "starlight" ? "#635E9A" : "#327A82"}/><Path d="M58 91L72 104L79 94L87 104L100 91" fill="#F4BE68"/>
    <Circle cx={74} cy={114} r={2} fill="#F4BE68"/><Circle cx={88} cy={114} r={2} fill="#F4BE68"/><Path d="M53 78Q43 57 54 39Q64 24 81 29Q103 30 106 54Q109 77 91 88Q69 95 53 78Z" fill="#FFF5DA" stroke="#304553" strokeWidth={3}/>
    <Path d="M86 65Q100 60 116 67Q120 70 115 76L109 73Q100 83 88 80Z" fill="#E8B35C" stroke="#74502F" strokeWidth={3}/><Path d="M89 72Q103 72 115 69" stroke="#BF7A40" strokeWidth={2}/>
    {dizzy ? <Path d="M62 53L70 61M70 53L62 61M85 48L93 56M93 48L85 56" stroke="#304553" strokeWidth={3}/> : happy ? <Path d="M60 58Q65 51 70 58M84 53Q89 46 94 53" fill="none" stroke="#304553" strokeWidth={3} strokeLinecap="round"/> : <G><Ellipse cx={65} cy={56} rx={7} ry={9} fill="#FFFFFF"/><Ellipse cx={86} cy={54} rx={7} ry={9} fill="#FFFFFF"/><Circle cx={67} cy={57} r={4} fill="#304553"/><Circle cx={88} cy={55} r={4} fill="#304553"/><Circle cx={68} cy={55} r={1.4} fill="white"/><Circle cx={89} cy={53} r={1.4} fill="white"/></G>}
    <Ellipse cx={59} cy={70} rx={7} ry={4} fill="#E8AC87"/>
    {outfit === "sunhat" ? <G><Ellipse cx={76} cy={34} rx={39} ry={7} fill="#D3A151" stroke="#74502F" strokeWidth={2}/><Path d="M53 33Q51 6 76 10Q99 8 101 34Z" fill="#F6D786" stroke="#74502F" strokeWidth={2}/><Path d="M54 27H99" stroke="#CF7C54" strokeWidth={5}/></G> : outfit === "explorer" ? <G><Path d="M52 34Q50 12 74 13Q96 13 100 32Z" fill="#9DAA71" stroke="#304553" strokeWidth={2}/><Path d="M45 34H106" stroke="#304553" strokeWidth={4}/></G> : outfit === "starlight" ? <G fill="#FFE5A1" stroke="#AE7F42"><Path d="M76 2L82 17L99 19L87 29L90 45L76 37L61 45L64 29L52 19L69 17Z"/><Circle cx={119} cy={28} r={4}/><Circle cx={35} cy={49} r={3}/></G> : <G><Path d="M49 32L48 18Q73 3 100 17L102 32Z" fill="#29475A" stroke="#203643" strokeWidth={3}/><Path d="M49 32Q76 27 103 32Q97 44 78 42L54 39Z" fill="#304553"/><Path d="M53 29Q76 24 98 29" fill="none" stroke="#F0C36A" strokeWidth={3}/><Circle cx={76} cy={16} r={2.4} fill="none" stroke="#F0C36A" strokeWidth={1.7}/><Path d="M76 19V25M70 21Q70 28 76 26Q82 28 82 21M73 21H79" fill="none" stroke="#F0C36A" strokeWidth={1.7} strokeLinecap="round"/></G>}
  </Svg>;
});
export const CargoCanoe = memo(function CargoCanoe({ size = 100 }: { size?: number }) { return <Svg width={size} height={size * .5} viewBox="0 0 160 80" accessible={false}><Path d="M8 45Q76 71 151 42L132 66Q80 86 28 66Z" fill="#C58D55" stroke="#543E32" strokeWidth={4}/><Path d="M41 47V30H66V51M73 53V24H101V51M110 49V34H130V47" fill="#C4D582" stroke="#543E32" strokeWidth={3}/><Path d="M76 27V3L104 23Z" fill="#FFE2A0" stroke="#543E32" strokeWidth={2}/><Path d="M4 74Q35 65 64 74T128 74" stroke="#A5E4DE" fill="none" strokeWidth={3}/></Svg>; });
export function CargoScene({ world }: { world: string }) {
  const id = useId().replace(/:/g, ""), night = world === "w3", learn = world === "learn";
  return <Svg width="100%" height="100%" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" accessible={false}><Defs><LinearGradient id={`cargoSky-${id}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={night ? "#172B52" : learn ? "#397F85" : "#72BFC3"}/><Stop offset="1" stopColor={night ? "#485784" : "#F4D39C"}/></LinearGradient></Defs><Rect width={600} height={800} fill={`url(#cargoSky-${id})`}/><Circle cx={480} cy={85} r={40} fill={night ? "#FFF0C2" : "#FFE5A4"}/>{night && [40, 95, 180, 275, 370, 540].map((x, i) => <Circle key={x} cx={x} cy={35 + i % 3 * 46} r={3} fill="#FFE7AF"/>)}<Path d="M-40 220Q80 110 190 210Q260 128 380 224L650 230V800H0Z" fill={night ? "#263F57" : "#4B8E7D"}/><Path d="M0 264Q160 228 300 269T600 258V800H0Z" fill={night ? "#244F6A" : "#307F8A"}/>{[310, 400, 500, 620, 740].map((y, i) => <Path key={y} d={`M-60 ${y}Q75 ${y - 35} 210 ${y}T480 ${y}T750 ${y}`} stroke={night ? "#7794AC" : "#A5D8CB"} strokeWidth={i % 2 ? 4 : 2} opacity={.5} fill="none"/>)}<Path d="M0 185L38 169L60 185M525 183L549 168L573 183" stroke="#36576A" strokeWidth={4} fill="none"/><Path d="M0 790Q85 712 180 786M410 800Q516 713 600 780" fill="#E6C08B"/></Svg>;
}
