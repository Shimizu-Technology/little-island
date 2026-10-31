import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { Island } from "./types";

/** Island emblems: book, numbered stones, sprouting flask, puzzle piece. Original geometric art in the app palette. */
export function LearnArt({ island, size = 64 }: { island: Island; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={4} y={4} width={56} height={56} rx={16} fill="#FFFCF3" />
      {island === "reading" && (
        <>
          <Path d="M12 20c7-3 13-3 20 1v28c-7-4-13-4-20-1z" fill="#E3EEF8" stroke="#386C9A" strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M52 20c-7-3-13-3-20 1v28c7-4 13-4 20-1z" fill="#FBE6DC" stroke="#C56D50" strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M17 27h9M17 33h9M38 27h9M38 33h9" stroke="#183F39" strokeWidth={2} strokeLinecap="round" />
        </>
      )}
      {island === "numbers" && (
        <>
          <Path d="M8 46c8-6 16-6 24 0s16 6 24 0" stroke="#7CC4C9" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Circle cx={16} cy={36} r={8} fill="#E1B251" />
          <Circle cx={32} cy={30} r={8} fill="#C56D50" />
          <Circle cx={48} cy={24} r={8} fill="#2F737C" />
          <Path d="M16 32v8M30 27h4l-4 6h4M46 21h4l-2 3a2 2 0 1 1-2 3" stroke="#FFFCF3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      {island === "science" && (
        <>
          <Path d="M26 12h12M28 12v14L17 46a4 4 0 0 0 3.5 6h23a4 4 0 0 0 3.5-6L36 26V12" fill="#DDEFF5" stroke="#2C6E8F" strokeWidth={2.5} strokeLinejoin="round" />
          <Path d="M21 40h22l3.5 6a2 2 0 0 1-1.7 3H19.2a2 2 0 0 1-1.7-3z" fill="#7CC4C9" />
          <Path d="M32 40v-8M32 34c-4-1-6-4-6-7 4 0 6 3 6 7zM32 32c3-1 5-3 5-6-3 0-5 2-5 6z" fill="#5E9B5A" stroke="#3E7A3A" strokeWidth={1.5} />
        </>
      )}
      {island === "coding" && (
        <>
          <Rect x={11} y={15} width={42} height={37} rx={9} fill="#B6C8EB" stroke="#3D5A9A" strokeWidth={2.5}/>
          <Path d="M32 15V9" stroke="#3D5A9A" strokeWidth={2.5}/><Circle cx={32} cy={8} r={3} fill="#E1B251"/>
          <Circle cx={24} cy={29} r={3} fill="#294470"/><Circle cx={40} cy={29} r={3} fill="#294470"/>
          <Path d="M23 39q9 9 18 0" fill="none" stroke="#294470" strokeWidth={2.5} strokeLinecap="round"/>
          <Path d="M18 53v4m28-4v4" stroke="#3D5A9A" strokeWidth={3} strokeLinecap="round"/>
        </>
      )}
      {island === "thinking" && (
        <>
          <Path
            d="M14 22h10a5 5 0 1 1 10 0h10v10a5 5 0 1 0 0 10v10H34a5 5 0 1 0-10 0H14V42a5 5 0 1 1 0-10z"
            fill="#FBE6DC"
            stroke="#B0563A"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <Circle cx={29} cy={37} r={4} fill="#E1B251" />
        </>
      )}
    </Svg>
  );
}
