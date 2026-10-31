import React, { memo } from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";
import type { OutfitId } from "../../progress";

/** Top-down rail, with its head and long beak pointing along +x. Rotate by a path tangent. */
export const RailArt = memo(function RailArt({ size, chick, outfit }: { size: number; chick: boolean; outfit: OutfitId }) {
  const body = chick ? "#F6CA63" : "#A47753", wing = chick ? "#FFE8A0" : "#D9B18A";
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
    <G stroke="#453A32" strokeWidth={4} strokeLinejoin="round">
      <Path d="M24 39L9 50L24 61" fill={body}/>
      <Ellipse cx={43} cy={50} rx={28} ry={30} fill={body}/>
      <Path d="M28 27Q47 13 60 37Q39 40 28 27M28 73Q47 87 60 63Q39 60 28 73" fill={wing}/>
      <Ellipse cx={64} cy={50} rx={21} ry={23} fill={chick ? "#FFE7A0" : "#EDCBA5"}/>
      <Path d="M82 43L98 50L82 57Z" fill="#F5B85C"/>
    </G>
    <Circle cx={72} cy={40} r={5} fill="#253B42"/><Circle cx={73} cy={39} r={1.5} fill="white"/>
    <Circle cx={72} cy={60} r={5} fill="#253B42"/><Circle cx={73} cy={59} r={1.5} fill="white"/>
    {!chick && outfit === "sunhat" && <Ellipse cx={54} cy={50} rx={12} ry={21} fill="#FFE5A0" stroke="#9D7039" strokeWidth={3}/>}
    {!chick && outfit === "explorer" && <Path d="M62 29V71" stroke="#84E1D8" strokeWidth={7}/>}
    {!chick && outfit === "starlight" && <Path d="M46 38L50 46L60 50L50 54L46 62L42 54L32 50L42 46Z" fill="#FFEA9A"/>}
  </Svg>;
});
