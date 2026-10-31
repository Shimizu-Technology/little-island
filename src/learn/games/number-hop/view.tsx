import React from "react";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { C } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { MathBoard } from "../shell-math/MathBoard";
import type { MathRound } from "../shell-math/round";
export const Board = (props: BoardProps<MathRound>) => <MathBoard {...props} game="number-hop" />;
export function Art({ size }: { size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Line x1="10" y1="63" x2="90" y2="63" stroke={C.ink} strokeWidth="3" />
    <Path d="M15 57Q32 5 50 57Q67 5 85 57M75 52L85 57L83 45" stroke={C.teal} strokeWidth="4" fill="none" />
    {[3, 4, 5].map((n, i) => <React.Fragment key={n}><Circle cx={15 + i * 35} cy="74" r="13" fill={i === 2 ? C.teal : C.paper} /><SvgText x={15 + i * 35} y="80" textAnchor="middle" fontSize="18" fontWeight="700" fill={i === 2 ? C.paper : C.ink}>{n}</SvgText></React.Fragment>)}
  </Svg>;
}
