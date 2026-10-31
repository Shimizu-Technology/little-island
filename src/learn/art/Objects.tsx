import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from "react-native-svg";
import { insideStyle, objectTop } from "../kit/scene";
import type { ReadingScene } from "../kit/reading";
import { sceneLabel } from "../kit/reading";

export const objectNames = [
  "shop",
  "chip",
  "back",
  "cape",
  "tape",
  "cat",
  "dog",
  "fox",
  "pig",
  "hen",
  "crab",
  "fish",
  "turtle",
  "bird",
  "box",
  "bus",
  "hat",
  "mat",
  "cup",
  "sun",
  "moon",
  "bed",
  "rug",
  "mug",
  "pot",
  "mango",
  "shell",
  "boat",
  "ship",
  "net",
  "jet",
  "van",
  "tree",
  "rock",
  "hut",
  "dish",
  "bell",
  "frog",
  "duck",
  "cake",
  "kite",
  "bike",
  "rope",
  "coat",
  "sheep",
  "star",
  "car",
  "fork",
  "bug",
  "cub",
  "rat",
  "toad",
  "seal",
  "bee",
  "log",
  "tub",
  "pond",
  "sand",
  "ring",
  "nest",
  "road",
  "rain",
  "leaf",
  "seed",
  "boot",
  "jar",
  "rose",
  "person",
  "goat",
  "moth",
] as const;
export type ObjectName = (typeof objectNames)[number];
const ink = "#183F39";
const colors: Record<string, string> = {
  coral: "#D68A6B",
  red: "#D64F43",
  blue: "#5B9ABA",
  green: "#79AB80",
  gold: "#E1B251",
};
/** When a sentence names no colour (coral), animals wear their everyday colours so they are easy to name. */
const natural: Record<string, string> = {
  fox: "#E07B39",
  hen: "#F3DFC1",
  bird: "#E1B251",
  duck: "#F2C94C",
  frog: "#72B26B",
  toad: "#A99560",
  fish: "#EE9F4A",
  seal: "#9AA6A6",
  goat: "#E9DCC6",
  bee: "#F2C14E",
  bug: "#72B26B",
  moth: "#C9A57E",
  cub: "#A0704A",
  rat: "#A3A39C",
};
const cream = "#FCFAF4",
  beakGold = "#E8A13A";
/** Cat, dog and pig share one friendly body; their ears, faces and tails tell them apart. */
const furry = ["cat", "dog", "pig"];
function Eye({ x, y, r = 2.6 }: { x: number; y: number; r?: number }) {
  return <Circle cx={x} cy={y} r={r} fill={ink} stroke="none" />;
}
function animal(name: string, fill: string): React.ReactNode {
  if (furry.includes(name))
    return (
      <>
        <Path d="M22 60 Q3 38 12 32" fill="none" />
        <Ellipse cx="47" cy="61" rx="29" ry="24" fill={fill} />
        <Ellipse cx="29" cy="84" rx="11" ry="5" fill={fill} />
        <Ellipse cx="66" cy="84" rx="11" ry="5" fill={fill} />
        {name === "cat" && (
          <>
            <Polygon points="49,33 49,8 64,25" fill={fill} />
            <Polygon points="70,24 85,8 85,40" fill={fill} />
          </>
        )}
        <Circle cx="66" cy="44" r="23" fill={fill} />
        {name === "cat" && <Path d="M48 48 L37 45 M48 53 L36 54 M82 48 L94 45 M82 53 L94 56" fill="none" />}
        {name === "dog" && (
          <>
            <Ellipse cx="47" cy="40" rx="8" ry="17" fill="#986C4E" />
            <Ellipse cx="86" cy="40" rx="8" ry="17" fill="#986C4E" />
            <Ellipse cx="72" cy="55" rx="13" ry="9" fill="#F9EDC9" />
            <Ellipse cx="72" cy="50" rx="5" ry="3.5" fill={ink} />
            <Path d="M70 60 Q72 66 75 60" fill="#E58C8C" />
          </>
        )}
        {name === "pig" && (
          <>
            {/* Floppy ears, a round snout with nostrils and a curly tail: clearly not a cat. */}
            <Path d="M50 30 Q46 12 60 22 Q58 30 50 30 Z" fill={fill} />
            <Path d="M80 22 Q94 12 90 30 Q82 30 80 22 Z" fill={fill} />
            <Ellipse cx="77" cy="52" rx="12" ry="9" fill="#F7C6B2" />
            <Ellipse cx="73" cy="52" rx="2.2" ry="3" fill={ink} />
            <Ellipse cx="81" cy="52" rx="2.2" ry="3" fill={ink} />
            <Path d="M19 56 q-9 -3 -6 -10 q4 -5 7 0 q2 5 -5 6" fill="none" />
          </>
        )}
        <Eye x={61} y={40} />
        <Eye x={76} y={40} />
        <Path d="M62 54 Q68 60 74 54" fill="none" />
      </>
    );
  switch (name) {
    case "fox":
      // Long pointed snout, tall ears, white muzzle and chest, dark socks and a bushy white-tipped tail.
      return (
        <>
          <Path d="M30 66 Q6 74 4 50 Q4 32 16 30 Q14 48 34 58 Z" fill={fill} />
          <Path d="M4 50 Q4 32 16 30 Q11 40 12 48 Z" fill={cream} />
          <Path d="M30 72 L28 90 L36 90 L38 72 Z M62 72 L60 90 L68 90 L70 72 Z" fill={ink} />
          <Ellipse cx="48" cy="64" rx="27" ry="15" fill={fill} />
          <Path d="M60 56 Q70 64 66 76 Q58 74 56 62 Z" fill={cream} />
          <Polygon points="60,38 61,12 75,31" fill={fill} />
          <Polygon points="73,31 85,11 88,38" fill={fill} />
          <Polygon points="64,31 64,21 70,29" fill={ink} stroke="none" />
          <Polygon points="78,29 83,20 85,33" fill={ink} stroke="none" />
          <Path d="M58 46 Q58 30 72 30 Q84 30 88 38 L98 50 Q94 56 86 56 Q74 60 64 57 Q58 53 58 46 Z" fill={fill} />
          <Path d="M68 51 Q80 47 97 50 Q94 56 86 56 Q74 60 64 57 Q64 53 68 51 Z" fill={cream} />
          <Circle cx="97" cy="50" r="3.2" fill={ink} />
          <Eye x={77} y={40} />
        </>
      );
    case "hen":
      // Plump round body, red comb and wattle, little beak, tail feathers and two thin legs.
      return (
        <>
          <Path d="M40 86 L40 94 M34 95 L46 95 M58 86 L58 94 M52 95 L64 95" stroke={beakGold} strokeWidth={4} />
          <Path d="M30 60 Q8 56 6 40 Q18 42 24 48 Q12 34 18 24 Q30 32 34 44 Q30 30 40 26 Q44 40 42 52 Z" fill={fill} />
          <Ellipse cx="50" cy="64" rx="30" ry="23" fill={fill} />
          <Path d="M36 62 Q50 50 64 62 Q52 78 36 62 Z" fill="none" />
          <Path d="M64 26 Q63 14 70 19 Q72 10 77 18 Q83 12 83 26 Z" fill="#D64F43" />
          <Circle cx="74" cy="36" r="14" fill={fill} />
          <Polygon points="86,32 98,37 86,42" fill={beakGold} />
          <Path d="M84 43 Q88 52 82 52 Q79 48 84 43 Z" fill="#D64F43" />
          <Eye x={77} y={33} />
        </>
      );
    case "bird":
      return (
        <>
          <Path d="M42 82 L40 92 M56 82 L58 92" />
          <Polygon points="30,56 8,46 12,66" fill={fill} />
          <Ellipse cx="48" cy="62" rx="24" ry="20" fill={fill} />
          <Path d="M34 60 Q46 50 58 62 Q46 72 34 60 Z" fill="none" />
          <Circle cx="68" cy="42" r="13" fill={fill} />
          <Polygon points="79,39 92,43 79,47" fill={beakGold} />
          <Eye x={71} y={39} />
        </>
      );
    case "duck":
      // Boat-shaped body, round head, wide flat bill and orange webbed feet.
      return (
        <>
          <Path d="M38 84 L32 93 L46 93 Z M60 84 L54 93 L68 93 Z" fill={beakGold} />
          <Path d="M62 46 Q58 58 62 64 L82 62 Q84 50 80 40 Z" fill={fill} />
          <Path d="M12 52 Q8 44 18 46 Q36 56 62 56 L86 56 Q92 82 62 86 L34 86 Q12 82 12 52 Z" fill={fill} />
          <Path d="M32 66 Q50 56 66 68 Q50 78 32 66 Z" fill="none" />
          <Circle cx="72" cy="36" r="15" fill={fill} />
          <Path d="M84 36 Q99 33 99 41 Q98 47 84 45 Z" fill={beakGold} />
          <Eye x={74} y={32} />
        </>
      );
    case "frog":
    case "toad": {
      const toad = name === "toad";
      // Front view: wide mouth and bulging eyes on top; the toad is lumpier with sleepy eyes.
      return (
        <>
          <Ellipse cx="20" cy="80" rx="16" ry="10" fill={fill} />
          <Ellipse cx="80" cy="80" rx="16" ry="10" fill={fill} />
          <Ellipse cx="50" cy="66" rx={toad ? 34 : 29} ry={toad ? 22 : 23} fill={fill} />
          {!toad && <Ellipse cx="50" cy="73" rx="16" ry="12" fill="#F4EBC8" />}
          <Ellipse cx="50" cy="44" rx={toad ? 34 : 31} ry="18" fill={fill} />
          <Circle cx="31" cy="28" r="10" fill={fill} />
          <Circle cx="69" cy="28" r="10" fill={fill} />
          <Circle cx="31" cy="28" r="5.5" fill={cream} />
          <Circle cx="69" cy="28" r="5.5" fill={cream} />
          <Eye x={31} y={29} r={3} />
          <Eye x={69} y={29} r={3} />
          {toad && <Path d="M22 25 Q31 18 40 25 M60 25 Q69 18 78 25" fill={fill} />}
          <Path d="M32 48 Q50 60 68 48" fill="none" />
          {toad && (
            <>
              <Circle cx="26" cy="62" r="3" fill="#7E6E45" stroke="none" />
              <Circle cx="38" cy="78" r="3" fill="#7E6E45" stroke="none" />
              <Circle cx="64" cy="76" r="3" fill="#7E6E45" stroke="none" />
              <Circle cx="76" cy="60" r="3" fill="#7E6E45" stroke="none" />
              <Circle cx="50" cy="66" r="2.5" fill="#7E6E45" stroke="none" />
            </>
          )}
          <Ellipse cx="38" cy="89" rx="8" ry="4" fill={fill} />
          <Ellipse cx="62" cy="89" rx="8" ry="4" fill={fill} />
        </>
      );
    }
    case "fish":
      return (
        <>
          <Polygon points="24,52 4,34 4,70" fill={fill} />
          <Path d="M46 40 Q54 22 66 36" fill={fill} />
          <Path d="M20 52 Q44 24 76 38 Q92 46 92 52 Q92 58 76 66 Q44 80 20 52 Z" fill={fill} />
          <Path d="M58 40 Q52 52 58 64" fill="none" />
          <Circle cx="77" cy="47" r="5" fill={cream} />
          <Eye x={78} y={47} r={2.4} />
          <Path d="M84 58 Q88 60 91 56" fill="none" />
        </>
      );
    case "seal":
      // Long smooth body lying down, head up, whiskered snout and flippers.
      return (
        <>
          <Path d="M14 80 L2 70 L4 90 Z" fill={fill} />
          <Path d="M10 84 Q12 64 42 62 Q58 60 64 44 L88 44 Q92 64 82 76 Q72 90 44 90 L16 90 Q10 90 10 84 Z" fill={fill} />
          <Path d="M54 80 Q62 96 74 86 Q66 82 62 74 Z" fill={fill} />
          <Circle cx="78" cy="36" r="16" fill={fill} />
          <Ellipse cx="90" cy="43" rx="9" ry="6.5" fill="#E3E8E6" />
          <Ellipse cx="95" cy="40" rx="3" ry="2.2" fill={ink} />
          <Path d="M88 46 L76 50 M90 47 L80 54 M94 47 L99 53" fill="none" strokeWidth={1.6} />
          <Eye x={79} y={31} />
        </>
      );
    case "sheep": {
      // A fluffy white cloud of wool with a coloured face and legs.
      const face = fill === natural.goat || fill === colors.coral ? "#5E5A55" : fill;
      return (
        <>
          <Path d="M30 72 L30 90 M40 74 L40 90 M60 74 L60 90 M70 72 L70 90" stroke={face} strokeWidth={6} />
          <Path
            d="M18 64 Q6 56 16 46 Q16 32 32 34 Q38 22 52 28 Q66 22 70 36 Q84 38 80 52 Q88 66 74 72 Q68 84 54 78 Q40 86 32 76 Q14 78 18 64 Z"
            fill={cream}
          />
          <Path d="M28 50 Q32 44 38 48 M46 40 Q50 34 56 38 M44 62 Q48 56 54 60 M60 54 Q64 48 70 52" fill="none" strokeWidth={1.8} />
          <Ellipse cx="80" cy="46" rx="11" ry="14" fill={face} />
          <Ellipse cx="70" cy="38" rx="7" ry="3.5" fill={face} />
          <Path d="M72 34 Q78 26 86 32" fill={cream} />
          <Circle cx="83" cy="43" r="2.6" fill={cream} stroke="none" />
        </>
      );
    }
    case "goat":
      // Tan body on four legs, curved horns, floppy ears and a little beard.
      return (
        <>
          <Path d="M26 70 L26 90 M37 70 L37 90 M60 70 L60 90 M71 70 L71 90" strokeWidth={6} />
          <Path d="M20 48 L10 38" />
          <Path d="M18 56 Q18 44 30 44 L64 44 Q74 44 74 56 L74 66 Q74 74 64 74 L28 74 Q18 74 18 66 Z" fill={fill} />
          <Path d="M70 24 Q66 6 54 8 M78 22 Q80 6 70 2" fill="none" strokeWidth={4} />
          <Path d="M62 48 L70 24 Q76 16 84 20 L94 36 Q96 42 88 44 L76 46 Z" fill={fill} />
          <Path d="M70 28 Q58 30 56 36 Q64 36 72 32 Z" fill={fill} />
          <Path d="M86 44 L84 58 L78 45 Z" fill={cream} />
          <Ellipse cx="93" cy="37" rx="2" ry="1.6" fill={ink} />
          <Eye x={80} y={29} />
        </>
      );
    case "bee":
      // Striped body, see-through wings, a stinger and antennae.
      return (
        <>
          <Path d="M36 76 L32 86 M50 79 L50 89 M64 76 L68 86" />
          <Ellipse cx="40" cy="32" rx="12" ry="20" fill="#E3F1F6" transform="rotate(-20 40 32)" />
          <Ellipse cx="58" cy="30" rx="12" ry="20" fill="#E3F1F6" transform="rotate(18 58 30)" />
          <Polygon points="20,58 4,60 20,66" fill={ink} />
          <Ellipse cx="48" cy="60" rx="30" ry="19" fill={fill} />
          <Path d="M36 43 Q30 60 36 77 M50 41 Q44 60 50 79 M64 44 Q58 60 64 76" fill="none" strokeWidth={6} />
          <Circle cx="82" cy="54" r="12" fill={fill} />
          <Path d="M84 43 Q86 32 94 30 M78 43 Q74 32 80 26" fill="none" />
          <Eye x={86} y={51} />
          <Path d="M84 59 Q88 62 91 58" fill="none" />
        </>
      );
    case "bug":
      // A round beetle seen from above: dark head, shell line, spots and six legs.
      return (
        <>
          <Path d="M28 46 L12 38 M26 60 L8 60 M28 74 L12 84 M72 46 L88 38 M74 60 L92 60 M72 74 L88 84" />
          <Path d="M44 20 Q40 8 32 8 M56 20 Q60 8 68 8" fill="none" />
          <Circle cx="50" cy="26" r="11" fill={ink} />
          <Ellipse cx="50" cy="60" rx="26" ry="30" fill={fill} />
          <Path d="M50 32 L50 90" fill="none" />
          <Circle cx="38" cy="50" r="4.5" fill={ink} stroke="none" />
          <Circle cx="62" cy="50" r="4.5" fill={ink} stroke="none" />
          <Circle cx="37" cy="70" r="4.5" fill={ink} stroke="none" />
          <Circle cx="63" cy="70" r="4.5" fill={ink} stroke="none" />
        </>
      );
    case "moth":
      // Big soft wings with eye spots, a thin body and feathery antennae.
      return (
        <>
          <Path d="M46 30 Q38 12 26 10 M54 30 Q62 12 74 10" fill="none" />
          <Path d="M30 13 L34 18 M36 15 L38 21 M70 13 L66 18 M64 15 L62 21" fill="none" strokeWidth={1.8} />
          <Path d="M48 38 Q24 14 6 30 Q2 52 46 54 Z" fill={fill} />
          <Path d="M52 38 Q76 14 94 30 Q98 52 54 54 Z" fill={fill} />
          <Path d="M46 54 Q18 58 20 80 Q36 88 48 64 Z" fill={fill} />
          <Path d="M54 54 Q82 58 80 80 Q64 88 52 64 Z" fill={fill} />
          <Circle cx="26" cy="38" r="6" fill={cream} />
          <Circle cx="74" cy="38" r="6" fill={cream} />
          <Ellipse cx="50" cy="56" rx="6" ry="26" fill="#8A6A4A" />
        </>
      );
    case "cub":
      // A bear cub: round ears, a light muzzle with a big nose, stubby tail.
      return (
        <>
          <Ellipse cx="47" cy="64" rx="29" ry="22" fill={fill} />
          <Ellipse cx="29" cy="85" rx="11" ry="5" fill={fill} />
          <Ellipse cx="64" cy="85" rx="11" ry="5" fill={fill} />
          <Circle cx="52" cy="22" r="9" fill={fill} />
          <Circle cx="82" cy="22" r="9" fill={fill} />
          <Circle cx="52" cy="22" r="4" fill="#E8C9A6" />
          <Circle cx="82" cy="22" r="4" fill="#E8C9A6" />
          <Circle cx="67" cy="42" r="22" fill={fill} />
          <Ellipse cx="70" cy="53" rx="11" ry="8" fill="#E8C9A6" />
          <Ellipse cx="70" cy="49" rx="4.5" ry="3.2" fill={ink} />
          <Eye x={61} y={38} />
          <Eye x={78} y={38} />
        </>
      );
    case "rat":
      // Long pointed snout with whiskers, round ears and a long thin tail.
      return (
        <>
          <Path d="M20 72 Q4 76 6 92 Q10 98 24 94" fill="none" strokeWidth={3.4} stroke="#C48E86" />
          <Path d="M18 76 Q18 52 44 50 Q62 48 70 56 L74 78 Q60 86 30 86 Q18 86 18 76 Z" fill={fill} />
          <Path d="M34 86 L32 92 M56 84 L56 92" />
          <Circle cx="64" cy="34" r="11" fill={fill} />
          <Circle cx="64" cy="34" r="6" fill="#E9B3AC" />
          <Path d="M56 56 Q56 38 72 40 Q86 44 98 58 Q90 64 76 64 Q60 64 56 56 Z" fill={fill} />
          <Circle cx="97" cy="58" r="3" fill="#C48E86" />
          <Path d="M92 60 L84 66 M93 61 L88 70" fill="none" strokeWidth={1.6} />
          <Eye x={78} y={50} />
        </>
      );
  }
  return null;
}
const animals = [
  "cat",
  "dog",
  "fox",
  "pig",
  "hen",
  "fish",
  "bird",
  "frog",
  "duck",
  "sheep",
  "bug",
  "cub",
  "rat",
  "toad",
  "seal",
  "bee",
  "goat",
  "moth",
];
/** Original flat SVG vocabulary. Coordinates are local to 0–100; callers can compose scenes. */
export function ObjectGlyph({
  name,
  color = "coral",
  x = 0,
  y = 0,
  size = 100,
}: {
  name: string;
  color?: string;
  x?: number;
  y?: number;
  size?: number;
}) {
  const fill = colors[color] ?? color;
  let shape: React.ReactNode;
  if (animals.includes(name)) shape = animal(name, color === "coral" ? (natural[name] ?? fill) : fill);
  else
    switch (name) {
      case "turtle":
        shape = (
          <>
            <Ellipse cx="48" cy="83" rx="30" ry="6" fill="#79AB80" />
            <Ellipse cx="43" cy="57" rx="34" ry="27" fill="#79AB80" />
            <Path d="M43 32 L27 54 L43 76 L60 55 Z" fill="#E1B251" />
            <Circle cx="82" cy="61" r="15" fill="#93BB88" />
            <Circle cx="87" cy="57" r="2" fill={ink} />
          </>
        );
        break;
      case "crab":
        shape = (
          <>
            <Path d="M20 66 L5 77 M25 75 L16 90 M75 66 L95 77 M70 75 L82 90 M23 52 L12 33 M77 52 L88 33" />
            <Ellipse cx="50" cy="62" rx="32" ry="22" fill={fill} />
            <Path
              d="M12 36 Q-3 18 7 14 L16 25 L22 11 Q35 28 12 36 M88 36 Q66 28 78 11 L84 25 L93 14 Q104 18 88 36"
              fill={fill}
            />
            <Circle cx="39" cy="41" r="7" fill="#FCFAF4" />
            <Circle cx="61" cy="41" r="7" fill="#FCFAF4" />
            <Circle cx="39" cy="40" r="2" fill={ink} />
            <Circle cx="61" cy="40" r="2" fill={ink} />
            <Path d="M40 67 Q50 75 60 67" fill="none" />
          </>
        );
        break;
      case "boat":
      case "ship":
        shape = (
          <>
            <Path d="M7 64 L94 64 L77 88 L26 88 Z" fill={fill} />
            <Path d="M49 64 L49 10 L83 53 L49 53" fill="#FCFAF4" />
            {name === "ship" && <Rect x="17" y="48" width="24" height="16" rx="3" fill="#E1B251" />}
            <Path d="M5 94 Q25 85 45 94 T95 94" fill="none" stroke="#5B9ABA" />
          </>
        );
        break;
      case "shop":
        shape = (
          <>
            <Rect x="16" y="35" width="68" height="54" rx="3" fill="#E6D3AC" />
            <Rect x="26" y="51" width="26" height="24" fill="#D9EDF0" />
            <Rect x="61" y="53" width="16" height="36" fill="#B8875C" />
            <Path d="M11 37 L20 16 L80 16 L89 37 Z" fill={fill} />
            <Path
              d="M29 17 L26 37 M46 17 L45 37 M63 17 L65 37 M80 17 L85 37"
              fill="none"
              stroke="#FCFAF4"
              strokeWidth="7"
            />
            <Path d="M11 37 L89 37" />
          </>
        );
        break;
      case "chip":
        shape = (
          <>
            <Ellipse cx="50" cy="80" rx="42" ry="12" fill="#FCFAF4" />
            <Path d="M17 52 Q30 15 61 30 Q87 30 80 64 Q66 84 39 72 Q16 74 17 52 Z" fill="#E1B251" />
            <Path d="M28 50 Q47 33 68 44 M29 60 Q48 42 70 54" fill="none" stroke="#B8875C" />
          </>
        );
        break;
      case "back":
        shape = (
          <>
            <Circle cx="50" cy="23" r="17" fill="#B8875C" />
            <Path d="M29 50 Q50 34 71 50 L80 75 L63 75 L62 95 L38 95 L37 75 L20 75 Z" fill={fill} />
            <Path d="M50 48 L50 78" fill="none" />
            <Path d="M93 63 L67 63 M74 55 L66 63 L74 71" fill="none" stroke="#386C9A" strokeWidth="4" />
          </>
        );
        break;
      case "cape":
        shape = (
          <>
            <Path d="M35 16 Q50 27 65 16 L91 88 Q70 82 50 93 Q30 82 9 88 Z" fill={fill} />
            <Path d="M35 16 Q50 3 65 16 M50 23 L42 36 M50 23 L58 36" fill="none" />
            <Path d="M35 39 L27 77 M65 39 L73 77" fill="none" stroke="#FCFAF4" />
          </>
        );
        break;
      case "tape":
        shape = (
          <>
            <Circle cx="45" cy="49" r="34" fill="#E1B251" />
            <Circle cx="45" cy="49" r="19" fill="#FCFAF4" />
            <Path d="M65 21 Q88 37 78 61 L69 84 L93 84 L93 94 L55 94 L67 61" fill="#E6D3AC" />
          </>
        );
        break;
      case "box":
        shape = (
          <>
            <Rect x="12" y="27" width="76" height="62" rx="5" fill="#D7B482" />
            <Path d="M12 27 L29 11 L75 11 L88 27 M50 28 L50 88" fill="none" />
          </>
        );
        break;
      case "bus":
      case "van":
      case "car":
        shape = (
          <>
            <Rect x="8" y={name === "car" ? 43 : 24} width="84" height={name === "car" ? 33 : 52} rx="12" fill={fill} />
            <Rect x="20" y="31" width="24" height="23" rx="4" fill="#D9EDF0" />
            <Rect x="50" y="31" width="25" height="23" rx="4" fill="#D9EDF0" />
            <Circle cx="26" cy="79" r="10" fill={ink} />
            <Circle cx="76" cy="79" r="10" fill={ink} />
          </>
        );
        break;
      case "hat":
        shape = (
          <>
            <Ellipse cx="50" cy="73" rx="43" ry="11" fill={fill} />
            <Path d="M22 70 L31 21 L70 21 L78 70 Z" fill={fill} />
            <Path d="M27 52 L74 52" />
          </>
        );
        break;
      case "mat":
        // A flat woven rectangle — clearly different from the fringed oval rug.
        shape = (
          <>
            <Rect x="8" y="52" width="84" height="30" rx="4" fill={fill} />
            <Path d="M22 52 L22 82 M36 52 L36 82 M50 52 L50 82 M64 52 L64 82 M78 52 L78 82" stroke="#F9EDC9" />
          </>
        );
        break;
      case "rug":
        shape = (
          <>
            <Path d="M4 60 L0 56 M4 66 L-1 66 M4 72 L0 76 M96 60 L100 56 M96 66 L101 66 M96 72 L100 76" />
            <Ellipse cx="50" cy="66" rx="44" ry="20" fill={fill} />
            <Path d="M18 66 L28 58 L38 66 L48 58 L58 66 L68 58 L78 66" stroke="#F9EDC9" fill="none" />
          </>
        );
        break;
      case "road":
        shape = (
          <>
            <Ellipse cx="50" cy="66" rx="44" ry="24" fill="#B5B8AD" />
            <Path d="M20 60 L78 60 M22 72 L75 72" stroke="#F9EDC9" />
          </>
        );
        break;
      case "cup":
        // A small teacup on a saucer.
        shape = (
          <>
            <Ellipse cx="50" cy="84" rx="40" ry="7" fill="#F9EDC9" />
            <Path d="M66 56 C86 50 84 74 64 72" fill="none" />
            <Path d="M24 50 L72 50 Q70 80 48 81 Q27 80 24 50 Z" fill={fill} />
          </>
        );
        break;
      case "mug":
        // A tall straight mug with a big handle.
        shape = (
          <>
            <Path d="M68 32 C98 30 98 70 68 68" fill="none" strokeWidth={6} />
            <Rect x="24" y="22" width="46" height="64" rx="8" fill={fill} />
            <Path d="M30 34 L64 34" stroke="#F9EDC9" />
          </>
        );
        break;
      case "tub":
        // A wide, low wash tub.
        shape = (
          <>
            <Path d="M4 46 L96 46 L86 82 L14 82 Z" fill={fill} />
            <Path d="M2 46 L98 46" strokeWidth={5} />
            <Ellipse cx="50" cy="46" rx="44" ry="6" fill="#9BD0E0" />
          </>
        );
        break;
      case "jar":
        // A tall jar with a lid.
        shape = (
          <>
            <Rect x="32" y="12" width="36" height="12" rx="3" fill="#E1B251" />
            <Path d="M30 26 L70 26 Q80 34 80 50 L80 80 Q80 88 70 88 L30 88 Q20 88 20 80 L20 50 Q20 34 30 26 Z" fill={fill} />
          </>
        );
        break;
      case "pot":
        shape = (
          <>
            <Path d="M77 40 C108 23 103 78 76 65" fill="none" />
            <Path d="M17 27 L81 27 L75 83 Q49 96 24 83 Z" fill={fill} />
            <Ellipse cx="49" cy="27" rx="32" ry="9" fill="#F9EDC9" />
            {name === "pot" && <Path d="M11 19 L87 19 M40 11 L58 11" />}
          </>
        );
        break;
      case "sun":
      case "moon":
      case "ring":
        shape = (
          <>
            {name === "sun" && (
              <Path d="M50 2 L50 14 M50 86 L50 98 M2 50 L14 50 M86 50 L98 50 M15 15 L24 24 M76 76 L85 85 M15 85 L24 76 M76 24 L85 15" />
            )}
            <Circle cx="50" cy="50" r="32" fill="#E1B251" />
            {name === "moon" && <Circle cx="68" cy="32" r="27" fill="#E3EEF8" stroke="none" />}
            {name === "ring" && <Circle cx="50" cy="50" r="21" fill="#FCFAF4" />}
          </>
        );
        break;
      case "bed":
        shape = (
          <>
            <Rect x="10" y="50" width="82" height="29" rx="6" fill={fill} />
            <Rect x="14" y="35" width="28" height="23" rx="7" fill="#FCFAF4" />
            <Path d="M8 28 L8 94 M92 44 L92 94" />
          </>
        );
        break;
      case "rose":
        shape = (
          <>
            <Path d="M50 85 L50 37 M50 70 Q25 50 24 67 Q35 82 50 75 M50 61 Q75 43 78 59 Q68 75 50 70" fill="#79AB80" />
            <Circle cx="50" cy="29" r="23" fill="#C56D50" />
            <Path d="M39 21 Q62 8 65 30 Q59 47 41 39 Q30 29 47 23 Q59 23 55 33 Q47 39 44 31" fill="none" />
          </>
        );
        break;
      case "mango":
      case "seed":
        shape = (
          <>
            <Path d="M55 16 Q99 38 72 78 Q37 108 19 69 Q6 29 55 16Z" fill="#E1B251" />
            <Path d="M50 18 Q54 3 74 5 Q73 23 50 18" fill="#79AB80" />
          </>
        );
        break;
      case "leaf":
        // A long leaf with a stem, middle vein and side veins.
        shape = (
          <>
            <Path d="M14 74 L4 82" strokeWidth={4} />
            <Path d="M12 74 Q24 34 94 40 Q74 84 12 74 Z" fill="#79AB80" />
            <Path d="M12 74 Q50 56 92 41 M36 64 L34 50 M50 58 L52 44 M64 52 L68 42 M38 66 L48 74 M54 60 L64 70 M68 54 L78 62" fill="none" strokeWidth={2} />
          </>
        );
        break;
      case "shell":
        // A seashell: a ridged fan with a little hinge at the bottom.
        shape = (
          <>
            <Path d="M38 80 L30 92 L70 92 L62 80 Z" fill="#F4B59A" />
            <Path d="M50 84 L16 58 Q8 30 30 18 Q50 8 70 18 Q92 30 84 58 Z" fill="#F7C9AE" />
            <Path d="M50 84 L20 50 M50 84 L30 26 M50 84 L50 16 M50 84 L70 26 M50 84 L80 50" fill="none" strokeWidth={2.4} />
          </>
        );
        break;
      case "dish":
        // A shallow bowl seen from the side.
        shape = (
          <>
            <Path d="M6 52 L94 52 Q88 82 50 84 Q12 82 6 52 Z" fill={fill} />
            <Ellipse cx="50" cy="52" rx="44" ry="8" fill="#F9EDC9" />
            <Path d="M34 84 L66 84" strokeWidth={5} />
          </>
        );
        break;
      case "nest":
        // A round bowl of woven twigs.
        shape = (
          <>
            <Path d="M8 52 Q10 88 50 88 Q90 88 92 52 Z" fill="#B8875C" />
            <Ellipse cx="50" cy="52" rx="42" ry="10" fill="#8C6239" />
            <Path d="M14 62 L44 78 M28 58 L66 84 M48 60 L84 70 M70 60 L40 86 M86 60 L58 84 M30 82 L16 64" fill="none" stroke="#5E4128" strokeWidth={2.2} />
          </>
        );
        break;
      case "net":
        shape = (
          <>
            <Circle cx="45" cy="38" r="31" fill="#D9EDF0" />
            <Path
              d="M22 18 L67 58 M14 36 L54 68 M30 10 L74 44 M22 58 L65 16 M14 40 L46 8 M38 67 L75 29 M66 65 L89 95"
              fill="none"
            />
          </>
        );
        break;
      case "jet":
        shape = (
          <Path
            d="M50 7 L59 43 L92 64 L92 73 L58 65 L56 84 L67 93 L33 93 L44 84 L42 65 L8 73 L8 64 L41 43 Z"
            fill={fill}
          />
        );
        break;
      case "tree":
        shape = (
          <>
            <Rect x="44" y="48" width="13" height="44" rx="3" fill="#B8875C" />
            <Circle cx="32" cy="37" r="25" fill="#79AB80" />
            <Circle cx="66" cy="35" r="27" fill="#79AB80" />
            <Circle cx="49" cy="22" r="19" fill="#79AB80" />
          </>
        );
        break;
      case "rock":
        shape = (
          <>
            <Path d="M8 74 L20 42 L43 31 L73 38 L92 75 L77 89 L25 88 Z" fill="#B3BBAF" />
            <Path d="M24 64 L45 54 L69 66" fill="none" />
          </>
        );
        break;
      case "sand":
        // A soft sand hill with grains.
        shape = (
          <>
            <Path d="M2 88 Q24 52 50 52 Q76 52 98 88 Z" fill="#E6D3AC" />
            <Path d="M30 72 L31 73 M46 64 L47 65 M60 74 L61 75 M70 66 L71 67 M40 80 L41 81 M56 84 L57 85" fill="none" strokeWidth={3} />
          </>
        );
        break;
      case "log":
        // A cut log lying down, with rings on its end.
        shape = (
          <>
            <Rect x="8" y="50" width="76" height="34" rx="6" fill="#B8875C" />
            <Path d="M20 60 L44 60 M30 74 L62 74 M52 58 L70 58" fill="none" stroke="#7E5A3A" />
            <Ellipse cx="84" cy="67" rx="11" ry="17" fill="#E6C49A" />
            <Ellipse cx="84" cy="67" rx="5" ry="8" fill="none" stroke="#B8875C" />
          </>
        );
        break;
      case "pond":
        // A flat oval of water with ripples and reeds.
        shape = (
          <>
            <Path d="M12 70 L10 36 M18 68 L22 42" stroke="#5E8F55" strokeWidth={4} />
            <Ellipse cx="11" cy="38" rx="3.5" ry="8" fill="#8C6239" />
            <Ellipse cx="50" cy="70" rx="46" ry="20" fill="#91C6D3" />
            <Path d="M30 66 Q38 62 46 66 M54 76 Q62 72 70 76 M60 62 Q66 59 72 62" fill="none" stroke="#5B9ABA" />
          </>
        );
        break;
      case "hut":
        shape = (
          <>
            <Rect x="22" y="43" width="58" height="47" rx="3" fill="#E6D3AC" />
            <Path d="M8 47 L50 9 L93 47 Z" fill={fill} />
            <Rect x="42" y="61" width="19" height="29" fill="#B8875C" />
          </>
        );
        break;
      case "bell":
        shape = (
          <>
            <Path d="M19 73 Q30 66 29 37 Q50 -1 71 37 Q70 66 81 73 Z" fill="#E1B251" />
            <Circle cx="50" cy="81" r="9" fill="#E1B251" />
          </>
        );
        break;
      case "cake":
        shape = (
          <>
            <Rect x="15" y="39" width="70" height="48" rx="8" fill={fill} />
            <Path d="M15 45 Q23 68 32 47 Q41 68 50 47 Q59 68 68 47 Q77 68 85 45" fill="#FCFAF4" />
            <Path d="M50 39 L50 17" />
            <Path d="M50 17 Q35 6 50 1 Q64 7 50 17" fill="#E1B251" />
          </>
        );
        break;
      case "kite":
        shape = (
          <>
            <Path d="M50 5 L81 38 L50 74 L18 38 Z" fill={fill} />
            <Path d="M50 5 L50 74 M18 38 L81 38 M50 74 Q20 81 49 96" fill="none" />
          </>
        );
        break;
      case "bike":
        shape = (
          <>
            <Circle cx="25" cy="72" r="21" fill="none" />
            <Circle cx="78" cy="72" r="21" fill="none" />
            <Path
              d="M25 72 L42 36 L58 72 L25 72 L61 42 L78 72 M34 33 L48 33 M62 42 L67 21 L79 21"
              fill="none"
              stroke={fill}
              strokeWidth="5"
            />
          </>
        );
        break;
      case "rope":
        shape = (
          <Path
            d="M22 82 C92 102 94 9 50 20 C3 30 28 82 62 63 C91 40 37 27 41 52"
            fill="none"
            stroke="#B8875C"
            strokeWidth="8"
          />
        );
        break;
      case "coat":
        shape = (
          <>
            <Path
              d="M32 16 L15 29 L3 59 L21 65 L28 49 L25 91 L75 91 L72 49 L79 65 L97 59 L85 29 L68 16 L50 26 Z"
              fill={fill}
            />
            <Line x1="50" y1="26" x2="50" y2="91" />
          </>
        );
        break;
      case "star":
        shape = <Polygon points="50,5 63,34 96,38 71,59 79,92 50,75 21,92 29,59 4,38 37,34" fill="#E1B251" />;
        break;
      case "fork":
        shape = <Path d="M35 8 L35 37 Q50 58 65 37 L65 8 M50 8 L50 94" fill="none" strokeWidth="7" />;
        break;
      case "rain":
        shape = (
          <>
            <Ellipse cx="50" cy="30" rx="41" ry="22" fill="#91C6D3" />
            <Path d="M26 62 L19 81 M51 59 L44 78 M76 62 L69 81" stroke="#5B9ABA" strokeWidth="7" />
          </>
        );
        break;
      case "boot":
        shape = <Path d="M31 10 L66 10 L65 58 Q95 56 94 84 L29 89 Z" fill={fill} />;
        break;
      case "person":
        shape = (
          <>
            <Circle cx="50" cy="23" r="17" fill="#D7A27B" />
            <Path d="M29 50 Q50 34 71 50 L80 75 L63 75 L62 95 L38 95 L37 75 L20 75 Z" fill={fill} />
          </>
        );
        break;
      default:
        shape = (
          <>
            <Ellipse cx="50" cy="66" rx="38" ry="21" fill="#D7B482" />
            <Path d="M21 59 L77 59 M23 70 L74 70" />
          </>
        );
    }
  return (
    <G
      transform={`translate(${x} ${y}) scale(${size / 100})`}
      stroke={ink}
      strokeWidth="2.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {shape}
    </G>
  );
}
export function PictureObject({ name, size = 100, color = "coral" }: { name: string; size?: number; color?: string }) {
  return (
    <View accessible accessibilityLabel={name}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <ObjectGlyph name={name} color={color} />
      </Svg>
    </View>
  );
}
export function Scene({ scene, width = 180, height = 124 }: { scene: ReadingScene; width?: number; height?: number }) {
  const small = scene.size === "little",
    s = scene.subjectSize ?? (small ? 39 : 61);
  const objectSize = scene.objectSize ?? (scene.relation === "under" ? 62 : 82);
  const objectY = scene.relation === "under" ? 0 : scene.relation === "on" ? 50 : 43;
  const inside = scene.relation === "in" ? insideStyle[scene.object] ?? "container" : null;
  // Feet sit on the object's top edge for "on"; inside a canopy they sit among the leaves.
  const subjectY =
    scene.relation === "on"
      ? Math.max(0, objectY + ((objectTop[scene.object] ?? 25) * objectSize) / 100 - 0.88 * s)
      : scene.relation === "under"
        ? 62
        : inside === "canopy"
          ? 18
          : 42;
  const front =
    inside === "water" ? "#91C6D3" : inside === "buried" ? "#E6D3AC" : scene.object === "bed" ? "#E1B251" : "#D7B482";
  return (
    <View accessible accessibilityLabel={sceneLabel(scene)}>
      <Svg width={width} height={height} viewBox="0 0 180 140">
        <Rect width="180" height="140" rx="16" fill="#FCFAF4" />
        <Ellipse cx="91" cy="124" rx="78" ry="9" fill="#E5EFE5" />
        <ObjectGlyph
          name={scene.object}
          x={scene.relation === "beside" ? 98 : 49}
          y={objectY}
          size={objectSize}
          color={animals.includes(scene.object) ? "coral" : "gold"}
        />
        <ObjectGlyph
          name={scene.subject}
          x={scene.relation === "beside" ? 13 : 89 - s / 2}
          y={subjectY}
          size={inside === "canopy" ? s * 0.8 : s}
          color={scene.color}
        />
        {inside === "water" && <Path d="M40 92 Q90 82 140 92 L140 112 Q90 122 40 112 Z" fill={front} opacity={0.85} />}
        {inside === "buried" && <Path d="M40 118 Q90 78 140 118 Z" fill={front} stroke={ink} strokeWidth="2" />}
        {inside === "blanket" && (
          <>
            <Rect x="52" y="86" width="78" height="26" rx="6" fill="#9CC3D9" stroke={ink} strokeWidth="2.5" />
            <Path d="M52 95 L130 95 M70 86 L70 112 M90 86 L90 112 M110 86 L110 112" stroke="#F9EDC9" strokeWidth="2.5" />
          </>
        )}
        {inside === "container" && (
          <>
            <Path d="M52 87 L128 87 L123 119 L58 119 Z" fill={front} stroke={ink} strokeWidth="2.5" />
            <Path d="M63 97 L117 97" stroke="#B8875C" strokeWidth="3" />
          </>
        )}
      </Svg>
    </View>
  );
}
