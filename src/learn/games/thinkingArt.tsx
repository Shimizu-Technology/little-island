import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { C, Copy } from "../../components/ui";

const ink = "#365034";
const stones: Record<string, { fill: string; name: string; mark: React.ReactNode }> = {
  coral: { fill: "#DE795C", name: "coral ring", mark: <Circle cx="25" cy="25" r="8" fill="none" stroke="#FFF8E6" strokeWidth="4" /> },
  jade: { fill: "#5E9B75", name: "jade triangle", mark: <Path d="M25 15L35 33H15Z" fill="none" stroke="#FFF8E6" strokeWidth="3.5" strokeLinejoin="round" /> },
  blue: { fill: "#5D91B8", name: "blue cross", mark: <Path d="M25 15V35M15 25H35" stroke="#FFF8E6" strokeWidth="4" strokeLinecap="round" /> },
  gold: { fill: "#C99A42", name: "gold stripes", mark: <Path d="M16 19H34M16 25H34M16 31H34" stroke="#FFF8E6" strokeWidth="3.5" strokeLinecap="round" /> },
  plum: { fill: "#9D7DB0", name: "plum diamond", mark: <Path d="M25 13L37 25L25 37L13 25Z" fill="none" stroke="#FFF8E6" strokeWidth="3.5" strokeLinejoin="round" /> },
};

export function StoneGlyph({ color, size = 46 }: { color: string; size?: number }) {
  const stone = stones[color] ?? stones.coral;
  return <Svg width={size} height={size} viewBox="0 0 50 50" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Circle cx="25" cy="26" r="22" fill="#B7C9A4" opacity={0.4} />
    <Circle cx="25" cy="23" r="21" fill={stone.fill} stroke={ink} strokeWidth="2.5" />
    <Path d="M12 17Q16 9 25 8" fill="none" stroke="#FFF8E6" strokeWidth="3" strokeLinecap="round" opacity={0.65} />
    {stone.mark}
  </Svg>;
}

export function SeaGlyph({ kind, size = 42 }: { kind: string; size?: number }) {
  if (kind === "shell") return <Svg width={size} height={size} viewBox="0 0 50 50" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M7 37Q6 18 14 13Q18 10 25 16Q32 10 36 13Q44 18 43 37L39 42H11Z" fill="#EBAF8F" stroke={ink} strokeWidth="2.5" strokeLinejoin="round"/><Path d="M25 17V38M17 16L20 38M33 16L30 38M12 37H38" fill="none" stroke="#FFF6E8" strokeWidth="2.4" strokeLinecap="round"/><Path d="M10 38H40" stroke={ink} strokeWidth="2.5"/></Svg>;
  if (kind === "fish") return <Svg width={size} height={size} viewBox="0 0 50 50" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M9 25L2 14V36ZM8 25Q20 6 39 20Q45 25 39 30Q20 44 8 25Z" fill="#72B6B4" stroke={ink} strokeWidth="2.5" strokeLinejoin="round"/><Path d="M23 16L27 9L32 17M23 34L27 41L32 33" fill="#58A0A0" stroke={ink} strokeWidth="2"/><Circle cx="34" cy="23" r="2.5" fill={ink}/><Path d="M14 24Q20 20 24 24" fill="none" stroke="#E8F7E7" strokeWidth="2"/></Svg>;
  if (kind === "star") return <Svg width={size} height={size} viewBox="0 0 50 50" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M25 4L31 17L45 15L38 26L45 38L31 36L25 47L19 36L5 38L12 26L5 15L19 17Z" fill="#E9BF5C" stroke={ink} strokeWidth="2.5" strokeLinejoin="round"/><Circle cx="20" cy="24" r="1.6" fill={ink}/><Circle cx="30" cy="24" r="1.6" fill={ink}/><Path d="M21 30Q25 33 29 30" fill="none" stroke={ink} strokeWidth="1.8" strokeLinecap="round"/></Svg>;
  return <Svg width={size} height={size} viewBox="0 0 50 50" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M13 27L5 18M12 32L3 31M37 27L45 18M38 32L47 31M17 15L14 6M33 15L36 6" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round"/><Ellipse cx="25" cy="29" rx="15" ry="12" fill="#D98670" stroke={ink} strokeWidth="2.5"/><Circle cx="18" cy="15" r="5" fill="#D98670" stroke={ink} strokeWidth="2"/><Circle cx="32" cy="15" r="5" fill="#D98670" stroke={ink} strokeWidth="2"/><Circle cx="19" cy="15" r="1.5" fill={ink}/><Circle cx="31" cy="15" r="1.5" fill={ink}/><Path d="M20 33Q25 37 30 33" fill="none" stroke="#FFF6E8" strokeWidth="2" strokeLinecap="round"/></Svg>;
}

export function patternLabel(token: string): string {
  if (token.startsWith("stone:")) { const [,color,scale] = token.split(":"); return `${stones[color]?.name ?? color}${scale ? `, size ${scale}` : ""}`; }
  if (token.startsWith("shells:")) return `${token.split(":")[1]} shells`;
  if (token.startsWith("arrow:")) return `${token.split(":")[1]} arrow`;
  return token;
}

export function PatternGlyph({ token, size = 46 }: { token: string; size?: number }) {
  if (token.startsWith("stone:")) { const [,color,scale] = token.split(":"); const stoneSize = scale ? Math.min(size, 27 + Number(scale) * 7) : size; return <StoneGlyph color={color} size={stoneSize} />; }
  if (token.startsWith("shells:")) { const count = Number(token.split(":")[1]); return <View style={{ width: size + 10, flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>{Array.from({ length: count }, (_, i) => <SeaGlyph key={i} kind="shell" size={count > 4 ? 19 : 23} />)}</View>; }
  if (token.startsWith("arrow:")) { const direction = token.split(":")[1], degrees = ({ up: 0, right: 90, down: 180, left: 270 } as Record<string, number>)[direction] ?? 0; return <Svg width={size} height={size} viewBox="0 0 50 50" style={{ transform: [{ rotate: `${degrees}deg` }] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Circle cx="25" cy="25" r="22" fill="#D6E6D4" stroke={ink} strokeWidth="2"/><Path d="M25 9L12 25H20V41H30V25H38Z" fill="#5E9B75" stroke={ink} strokeWidth="2.5" strokeLinejoin="round"/></Svg>; }
  return <Copy style={{ color: C.ink, fontSize: token.length > 3 ? 21 : 27, fontWeight: "900", fontVariant: ["tabular-nums"] }}>{token}</Copy>;
}

export function ScaleGlyph({ size = 150 }: { size?: number }) { return <Svg width={size} height={size * .47} viewBox="0 0 150 70" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M75 9V57M48 58H102M36 16H114M75 8L36 16M75 8L114 16" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round"/><Circle cx="75" cy="8" r="5" fill="#E9BF5C" stroke={ink} strokeWidth="2"/><Path d="M29 17L18 43M43 17L54 43M107 17L96 43M121 17L132 43M16 43Q36 62 56 43ZM94 43Q114 62 134 43Z" fill="#E9BF5C" stroke={ink} strokeWidth="2.5" strokeLinejoin="round"/><Rect x="67" y="56" width="16" height="6" rx="3" fill={ink}/></Svg>; }
