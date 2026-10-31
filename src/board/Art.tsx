import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import { BoardId } from "./index";
/** Original, simple shapes remain distinct in monochrome: round coconut / pointed leaf. */
export function Piece({
  kind,
  size = 32,
  seat = 0,
}: {
  kind: "coconut" | "shell" | "canoe" | "urchin" | "pearl" | "flag" | "ripple";
  size?: number;
  seat?: number;
}) {
  const color = seat === 0 ? "#805538" : "#286B69";
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessible={false}>
      {kind === "coconut" &&
        (seat === 0 ? (
          <G>
            <Circle cx="24" cy="25" r="18" fill={color} />
            <Path d="M12 17 Q20 7 31 12" stroke="#C89B65" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Circle cx="28" cy="27" r="2.2" fill="#EEDABB" />
            <Circle cx="20" cy="28" r="2.2" fill="#EEDABB" />
            <Circle cx="24" cy="34" r="2.2" fill="#EEDABB" />
          </G>
        ) : (
          <G>
            <Path d="M24 3 Q48 23 24 45 Q0 23 24 3" fill={color} />
            <Path d="M24 11 L24 37 M15 20 L24 26 L34 18" stroke="#BEE2D4" strokeWidth="2.5" fill="none" />
          </G>
        ))}
      {kind === "shell" && (
        <G>
          <Path
            d="M9 34 Q1 14 12 12 Q17 1 24 9 Q34 2 38 13 Q49 21 38 34 L29 41 L19 41 Z"
            fill="#E6BC73"
            stroke="#805538"
            strokeWidth="2"
          />
          <Path d="M24 36 L12 17 M24 36 L23 12 M24 36 L35 17" stroke="#A46D37" strokeWidth="2" />
        </G>
      )}
      {kind === "canoe" && (
        <G>
          <Path d="M3 24 Q24 44 45 24 L39 35 Q24 45 9 35 Z" fill="#A66A42" stroke="#633E2C" strokeWidth="2" />
          <Path d="M24 5 L24 27 L39 25 Z" fill="#F0CB7A" stroke="#805538" strokeWidth="2" />
          <Path d="M5 43 Q15 37 24 43 Q34 47 44 41" fill="none" stroke="#528E9E" strokeWidth="2" />
        </G>
      )}
      {kind === "urchin" && (
        <G>
          {Array.from({ length: 12 }, (_, i) => (
            <Line
              key={i}
              x1="24"
              y1="24"
              x2={24 + 21 * Math.cos((i * Math.PI) / 6)}
              y2={24 + 21 * Math.sin((i * Math.PI) / 6)}
              stroke="#675078"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ))}
          <Circle cx="24" cy="24" r="12" fill="#675078" />
          <Circle cx="20" cy="22" r="2" fill="#FFF" />
          <Circle cx="28" cy="22" r="2" fill="#FFF" />
        </G>
      )}
      {kind === "pearl" && (
        <G>
          <Circle cx="24" cy="24" r="15" fill="#FCF8E9" stroke="#9A925F" strokeWidth="2" />
          <Ellipse cx="19" cy="18" rx="5" ry="3" fill="#FFF" />
        </G>
      )}
      {kind === "flag" && (
        <G>
          <Path
            d="M14 42 L14 6 L38 10 L32 23 L14 20"
            fill="#D78B50"
            stroke="#70482E"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <Path d="M7 43 L27 43" stroke="#70482E" strokeWidth="3" strokeLinecap="round" />
        </G>
      )}
      {kind === "ripple" && (
        <G>
          <Ellipse cx="24" cy="27" rx="19" ry="9" stroke="#538896" strokeWidth="2" fill="none" />
          <Ellipse cx="24" cy="26" rx="10" ry="4" stroke="#538896" strokeWidth="2" fill="none" />
        </G>
      )}
    </Svg>
  );
}
export function BoardArt({ game, size = 96 }: { game: BoardId; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Path
        d="M7 75 Q0 52 12 26 Q25 4 51 9 Q84 0 94 33 Q107 65 86 86 Q49 105 17 87 Z"
        fill={game === "shell-pits" ? "#E1CA9B" : "#BBDCD3"}
      />
      <Path d="M11 80 Q30 72 50 80 Q72 91 91 78" stroke="#7FAEA5" strokeWidth="3" fill="none" />
      {game === "coconut-drop" && (
        <G>
          <Rect x="19" y="21" width="64" height="52" rx="9" fill="#447B69" />
          {[0, 1, 2, 3].map((i) => (
            <G key={i}>
              <Circle cx={28 + i * 15} cy="61" r="6" fill="#875B3A" />
              <Circle cx={28 + i * 15} cy="43" r="6" fill={i % 2 ? "#FCFAF4" : "#E3BB73"} />
            </G>
          ))}
        </G>
      )}
      {game === "fishing-nets" && (
        <G>
          <Rect x="26" y="27" width="46" height="43" fill="#E5BC78" />
          <Path
            d="M26 27 L72 27 L72 70 L26 70 Z M49 27 L49 70 M26 49 L72 49"
            stroke="#497D72"
            strokeWidth="3"
            fill="none"
          />
          {[26, 49, 72].flatMap((x) =>
            [27, 49, 70].map((y) => <Circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#274F43" />)
          )}
        </G>
      )}
      {game === "hidden-canoes" && (
        <G>
          <Path d="M15 53 Q49 87 86 53 L76 72 Q49 86 24 70 Z" fill="#9F6942" />
          <Path d="M49 15 L49 58 L78 53 Z" fill="#F6D68C" stroke="#875B3A" strokeWidth="2" />
          <Line x1="49" x2="49" y1="15" y2="64" stroke="#875B3A" strokeWidth="3" />
        </G>
      )}
      {game === "shell-pits" && (
        <G>
          <Rect x="11" y="26" width="78" height="47" rx="19" fill="#9B704B" />
          {[29, 50, 71].flatMap((x) =>
            [39, 60].map((y) => (
              <G key={`${x}-${y}`}>
                <Ellipse cx={x} cy={y} rx="9" ry="8" fill="#6B4B35" />
                <Circle cx={x - 3} cy={y - 2} r="2.5" fill="#F2D593" />
                <Circle cx={x + 3} cy={y + 2} r="2.5" fill="#F2D593" />
              </G>
            ))
          )}
        </G>
      )}
      {game === "reef-sweep" && (
        <G>
          <Rect x="23" y="22" width="55" height="54" rx="7" fill="#497B6A" />
          <Path d="M23 40 L78 40 M23 58 L78 58 M41 22 L41 76 M59 22 L59 76" stroke="#BEE1D0" strokeWidth="2" />
          <Circle cx="33" cy="31" r="6" fill="#FFF6D9" />
          <Circle cx="50" cy="49" r="6" fill="#FFF6D9" />
          <Path d="M66 68 L66 42 L78 46 L76 55 L66 54" fill="#F0BE70" stroke="#765333" strokeWidth="2" />
        </G>
      )}
      <Circle cx="13" cy="18" r="3" fill="#DEAD65" />
      <Circle cx="89" cy="15" r="2" fill="#DEAD65" />
    </Svg>
  );
}
