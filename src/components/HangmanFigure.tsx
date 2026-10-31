import React, { useEffect, useState } from "react";
import { Animated } from "react-native";
import { easeOut, useReducedMotion } from "./motion";
import Svg, { Circle, G, Line, Path } from "react-native-svg";
import { C } from "./ui";

const AnimatedG = Animated.createAnimatedComponent(G);
function Part({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion(),
    [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: reduced ? 0 : 180,
      easing: easeOut,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [reduced, value]);
  return <AnimatedG opacity={value}>{children}</AnimatedG>;
}
export function HangmanFigure({ mistakes, won }: { mistakes: number; won: boolean }) {
  const stroke = { stroke: C.ink, strokeWidth: 4, strokeLinecap: "round" as const, fill: "none" };
  return (
    <Svg width={96} height={106} viewBox="0 0 130 142" accessibilityElementsHidden>
      <Path d="M10 132H82M25 131V12H89V28M25 31L44 12" {...stroke} stroke="#A99774" />
      {(mistakes > 0 || won) && (
        <Part>
          <Circle cx="89" cy="43" r="14" {...stroke} stroke={won ? C.teal : C.ink} />
        </Part>
      )}
      {(mistakes > 1 || won) && (
        <Part>
          <Line x1="89" y1="57" x2="89" y2="94" {...stroke} />
        </Part>
      )}
      {(mistakes > 2 || won) && (
        <Part>
          <Line x1="89" y1="66" x2={won ? 63 : 69} y2={won ? 48 : 83} {...stroke} />
        </Part>
      )}
      {(mistakes > 3 || won) && (
        <Part>
          <Line x1="89" y1="66" x2="110" y2={won ? 48 : 83} {...stroke} />
        </Part>
      )}
      {(mistakes > 4 || won) && (
        <Part>
          <Line x1="89" y1="94" x2="72" y2="119" {...stroke} />
        </Part>
      )}
      {(mistakes > 5 || won) && (
        <Part>
          <Line x1="89" y1="94" x2="105" y2="119" {...stroke} />
        </Part>
      )}
      {won && <Path d="M83 45Q89 52 95 45" {...stroke} strokeWidth={2} />}
    </Svg>
  );
}
