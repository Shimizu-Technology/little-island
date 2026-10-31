import React from "react";
import Svg, { Ellipse, Path } from "react-native-svg";
import { C } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { MathBoard } from "./MathBoard";
import type { MathRound } from "./round";
export const Board = (props: BoardProps<MathRound>) => <MathBoard {...props} game="shell-math" />;
export function Art({ size }: { size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Ellipse cx="50" cy="72" rx="43" ry="16" fill="#F2D9A6" />
    <Path d="M50 74C29 70 10 49 17 36Q24 25 34 33Q38 9 50 24Q66 10 68 33Q84 27 86 42C87 54 65 73 50 74Z" fill="#F2CA85" stroke={C.ink} strokeWidth="3" />
    <Path d="M50 72L30 36M50 72V28M50 72L71 37" fill="none" stroke={C.ink} strokeWidth="3" />
  </Svg>;
}
