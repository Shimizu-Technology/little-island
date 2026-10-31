import React from "react";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
export function FeatureArt({ kind, size = 96 }: { kind: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      {kind === "explore" ? (
        <>
          <Circle cx="50" cy="50" r="36" fill="#83BACC" />
          <Path d="M23 25L44 19 48 35 36 48 18 42M55 49L74 39 85 56 65 79 58 65Z" fill="#45785A" />
          <Ellipse cx="50" cy="50" rx="19" ry="36" fill="none" stroke="#FCFAF4" strokeWidth="2" />
          <Path d="M15 50H85M22 30H78M22 70H78" stroke="#FCFAF4" strokeWidth="2" />
        </>
      ) : kind === "racer" ? (
        <>
          <Path d="M9 80L26 58 45 65 65 41 92 50V87H9Z" fill="#8DB58B" />
          <Circle cx="50" cy="27" r="10" fill="#C16A4C" />
          <Path
            d="M48 40L39 58 57 67M44 48L66 45M40 57L23 69M79 15V47M79 15L95 20 79 27"
            fill="none"
            stroke="#245F55"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      ) : kind === "island-mystery" ? (
        <>
          <Ellipse cx="50" cy="66" rx="46" ry="26" fill="#8CC0CB" />
          <Ellipse cx="50" cy="59" rx="39" ry="24" fill="#DCCB97" />
          <Path d="M20 58Q50 24 80 58L71 74H28Z" fill="#A4BD83" />
          <Path d="M31 52V23M29 32Q8 20 16 17Q33 17 31 32M31 31Q45 8 51 20Q46 31 31 31" fill="#46785D" stroke="#46785D" strokeWidth="3" />
          <Path d="M53 65L64 48 83 61 71 74Z" fill="#E3A16D" />
          <Circle cx="48" cy="49" r="8" fill="#C56D50" />
          <Path d="M41 61Q48 52 55 61V71H41Z" fill="#386C9A" />
        </>
      ) : kind === "word-imposter" ? (
        <>
          <Path d="M20 73V45Q20 19 50 19T80 45V73L65 67 50 76 35 67Z" fill="#477668" />
          <Rect x="29" y="34" width="42" height="20" rx="10" fill="#C4E2E6" />
          <Circle cx="61" cy="44" r="4" fill="#245F55" />
          <Path d="M44 86H56" stroke="#C16A4C" strokeWidth="5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Rect x="16" y="21" width="43" height="62" rx="8" fill="#BBA4D0" transform="rotate(-12 35 50)" />
          <Rect
            x="40"
            y="15"
            width="43"
            height="62"
            rx="8"
            fill="#FFF9E8"
            stroke="#246858"
            strokeWidth="2"
            transform="rotate(10 61 45)"
          />
          {kind === "go-fish" ? (
            <>
              <Ellipse cx="60" cy="45" rx="13" ry="9" fill="#4C91AD" />
              <Path d="M72 45L83 37V53Z" fill="#4C91AD" />
              <Circle cx="55" cy="42" r="2" fill="#FCFAF4" />
            </>
          ) : (
            <>
              <Circle cx="62" cy="37" r="8" fill="none" stroke="#C16A4C" strokeWidth="5" />
              <Circle cx="62" cy="53" r="9" fill="none" stroke="#C16A4C" strokeWidth="5" />
            </>
          )}
        </>
      )}
    </Svg>
  );
}
