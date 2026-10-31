import React from "react";
import Svg, { Path, Rect, Text as SvgText } from "react-native-svg";
import { C } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { MathBoard } from "../shell-math/MathBoard";
import type { MathRound } from "../shell-math/round";
export const Board = (props: BoardProps<MathRound>) => <MathBoard {...props} game="quick-practice" />;
export function Art({ size }: { size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Rect x="10" y="13" width="80" height="74" rx="16" fill={C.paper} stroke={C.ink} strokeWidth="3" />
    <SvgText x="50" y="46" textAnchor="middle" fontSize="23" fontWeight="700" fill={C.ink}>3 + ?</SvgText>
    <Path d="M24 63H76" stroke={C.gold} strokeWidth="4" />
    <SvgText x="50" y="81" textAnchor="middle" fontSize="24" fontWeight="700" fill={C.teal}>= 5</SvgText>
  </Svg>;
}
