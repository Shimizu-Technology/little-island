import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from "react-native-svg";
import { GameId } from "../games";
export function Symbol({ name, size = 48, color = "#246858" }: { name: string; size?: number; color?: string }) {
  const stroke = {
    stroke: color,
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden>
      {name === "shell" ? (
        <>
          <Path {...stroke} fill="#F5D6B8" d="M12 41C-1 16 21 6 32 21 44 5 65 17 52 41L38 53H26Z" />
          <Path {...stroke} d="M32 22v30M15 22l12 29M49 22L37 51M11 34l15 17M53 34L38 51" />
        </>
      ) : name === "fish" ? (
        <>
          <Path {...stroke} fill="#B9DDE0" d="M8 31C23 9 43 14 50 31 43 48 23 53 8 31Z" />
          <Path {...stroke} d="M50 31l11-12v25ZM22 21q-7 11 0 21" />
          <Circle cx="15" cy="29" r="2" fill={color} />
        </>
      ) : name === "star" ? (
        <Polygon {...stroke} fill="#F2CE77" points="32,7 39,24 57,26 43,38 47,56 32,46 17,56 21,38 7,26 25,24" />
      ) : name === "boat" ? (
        <>
          <Path {...stroke} fill="#D39372" d="M9 43h47L45 55H20Z" />
          <Path {...stroke} fill="#F1CC75" d="M31 8v30H10Z" />
          <Path {...stroke} d="M35 15l17 23H35M5 60q7-5 14 0t14 0 14 0 13 0" />
        </>
      ) : name === "sun" ? (
        <>
          <Circle {...stroke} fill="#F3CC76" cx="32" cy="32" r="14" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <Line key={a} {...stroke} x1="32" y1="4" x2="32" y2="11" rotation={a} origin="32,32" />
          ))}
        </>
      ) : name === "leaf" ? (
        <>
          <Path {...stroke} fill="#B8D3AF" d="M12 52C-1 18 24 8 55 8c0 31-10 54-43 44Z" />
          <Path {...stroke} d="M13 51L43 22M24 40V25M34 31h14" />
        </>
      ) : name === "moon" ? (
        <Path {...stroke} fill="#E8CF8F" d="M44 8C12 1-4 43 27 56c14 6 26-2 30-13C30 52 14 22 44 8Z" />
      ) : name === "flower" ? (
        <>
          <Path {...stroke} d="M32 37v24M32 52l-13-9M32 57l14-12" />
          {[0, 72, 144, 216, 288].map((a) => (
            <Ellipse
              key={a}
              cx="32"
              cy="16"
              rx="8"
              ry="12"
              fill="#D89791"
              stroke={color}
              strokeWidth="2"
              rotation={a}
              origin="32,28"
            />
          ))}
          <Circle cx="32" cy="28" r="8" fill="#F2CE77" stroke={color} strokeWidth="2" />
        </>
      ) : name === "crab" ? (
        <>
          <Ellipse {...stroke} fill="#DC9B7E" cx="32" cy="37" rx="17" ry="12" />
          <Path
            {...stroke}
            d="M16 32L7 19V9m0 10 9-8M48 32l9-13V9m0 10-9-8M17 41 5 46M19 48l-9 9M47 41l12 5M45 48l9 9M25 26v-8M39 26v-8"
          />
          <Circle cx="25" cy="16" r="3" fill={color} />
          <Circle cx="39" cy="16" r="3" fill={color} />
        </>
      ) : name === "heart" ? (
        <Path {...stroke} fill="#D89791" d="M32 54 9 32C-6 13 19-1 32 17 45-1 70 13 55 32Z" />
      ) : name === "kite" ? (
        <>
          <Polygon {...stroke} fill="#F2CE77" points="32,4 52,24 32,46 12,24" />
          <Path {...stroke} d="M32 4v42M12 24h40M32 46q-15 10-2 16" />
        </>
      ) : name === "tree" ? (
        <>
          <Path {...stroke} d="M32 32v28" />
          <Path {...stroke} fill="#B8D3AF" d="m32 4 20 24H42l15 16H7l15-16H12Z" />
        </>
      ) : null}
    </Svg>
  );
}
export function GameArt({ game, size = 112 }: { game: GameId; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden>
      {game === "tic-tac-toe" ? (
        <G rotation="-8" origin="60,60">
          <Rect x="17" y="16" width="88" height="88" rx="18" fill="#FFF9E9" />
          {[46, 76].map((n) => (
            <G key={n}>
              <Line x1={n} y1="26" x2={n} y2="96" stroke="#789BAF" strokeWidth="3" />
              <Line x1="26" y1={n} x2="96" y2={n} stroke="#789BAF" strokeWidth="3" />
            </G>
          ))}
          <Path
            d="m27 28 13 13m0-13L27 41m30 17 13 13m0-13L57 71"
            stroke="#BD7054"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <Circle cx="89" cy="33" r="9" fill="none" stroke="#397263" strokeWidth="5" />
          <Circle cx="33" cy="87" r="9" fill="none" stroke="#397263" strokeWidth="5" />
        </G>
      ) : game === "word-rescue" ? (
        <G>
          <Rect x="12" y="10" width="96" height="100" rx="20" fill="#FFF9E9" />
          <Path d="M24 94H92M34 94V24H75V34M34 39L49 24" fill="none" stroke="#A99774" strokeWidth="4" strokeLinecap="round" />
          <Circle cx="75" cy="46" r="11" fill="none" stroke="#246858" strokeWidth="3" />
          <Path d="M75 57V78M75 63L61 69M75 63L89 69M75 78L63 91M75 78L86 91" fill="none" stroke="#246858" strokeWidth="3" strokeLinecap="round" />
        </G>
      ) : game === "memory" ? (
        <G rotation="-9" origin="60,60">
          <Rect x="11" y="28" width="54" height="72" rx="11" fill="#B0A2CA" />
          <Rect x="48" y="14" width="58" height="78" rx="12" fill="#FFFCF2" stroke="#D8C9E6" strokeWidth="2" />
          <Path d="m77 30 6 15 16 2-12 11 3 16-13-8-14 8 3-16-12-11 17-2Z" fill="#E5B850" />
        </G>
      ) : game === "checkers" ? (
        <G rotation="-8" origin="60,60">
          <Rect x="17" y="20" width="88" height="88" rx="12" fill="#FCF1DA" />
          {[0, 1, 2, 3].flatMap((r) =>
            [0, 1, 2, 3].map((c) =>
              (r + c) % 2 === 1 ? (
                <Rect key={r * 4 + c} x={20 + c * 20} y={23 + r * 20} width="20" height="20" fill="#AFCABB" />
              ) : null
            )
          )}
          <Circle cx="50" cy="73" r="18" fill="#CD8061" stroke="#FFF0CE" strokeWidth="3" />
          <Circle cx="79" cy="44" r="18" fill="#347160" stroke="#FFF0CE" strokeWidth="3" />
          <Path d="m68 44 3 7h16l3-7-7 3-4-8-4 8Z" fill="#F1D085" />
        </G>
      ) : game === "maze" ? (
        <G rotation="-6" origin="60,60">
          <Rect x="15" y="15" width="91" height="91" rx="15" fill="#FFFBEF" />
          <Path
            d="M30 32h60v25H52v33h38M30 48v42m39-58v9M90 73H70"
            stroke="#5A8070"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <Path d="M35 25h62v37H60v34" stroke="#E5B44E" strokeWidth="3" strokeDasharray="4 5" fill="none" />
          <Path d="M38 100V74l18 6-18 7" stroke="#BD7054" strokeWidth="3" fill="#D69A7A" />
        </G>
      ) : (
        <G rotation="-9" origin="60,60">
          <Rect x="13" y="44" width="50" height="50" rx="12" fill="#FCFAEF" />
          {[
            [28, 59],
            [48, 59],
            [28, 79],
            [48, 79],
          ].map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r="4" fill="#36776B" />
          ))}
          <Rect x="60" y="18" width="48" height="49" rx="12" fill="#E8BC60" />
          <Path d="M74 31h20L80 55" stroke="#476F62" strokeWidth="5" fill="none" strokeLinecap="round" />
          <Circle cx="84" cy="88" r="19" fill="#A5CBC7" />
          <Path d="M76 88h16m-8-8v16" stroke="#2C6C65" strokeWidth="4" strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}
export function TicMark({ mark, size }: { mark: "X" | "O"; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden>
      {mark === "X" ? (
        <Path d="M15 15 49 49M49 15 15 49" fill="none" stroke="#C56D50" strokeWidth="9" strokeLinecap="round" />
      ) : (
        <Circle cx="32" cy="32" r="21" fill="none" stroke="#246858" strokeWidth="8" />
      )}
    </Svg>
  );
}
export function RocketProgress({ progress, size = 100 }: { progress: number; size?: number }) {
  const ghost = "#D5D8CA",
    outline = "#819483";
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden>
      <Ellipse cx="60" cy="108" rx="30" ry="5" fill="#E1E5D7" />
      <G>
        <Path d="M42 76 33 99l21-13M78 76l9 23-21-13" fill={progress >= 0.5 ? "#BD7054" : ghost} />
        <Path
          d="M44 80V51q0-28 16-39 16 11 16 39v29Z"
          fill={progress > 0 ? "#FFF9E9" : "#ECEEE4"}
          stroke={outline}
          strokeWidth="2"
          strokeDasharray={progress > 0 ? undefined : "4 4"}
        />
        <Path d="M46 34q14-30 28 0" fill={progress >= 0.3 ? "#C87961" : ghost} />
        <Circle
          cx="60"
          cy="54"
          r="10"
          fill={progress >= 0.65 ? "#99C9CF" : ghost}
          stroke={progress >= 0.65 ? "#285F58" : outline}
          strokeWidth="3"
        />
        {progress >= 1 && (
          <>
            <Path d="M51 88q9 35 18 0" fill="#E8BC58" />
            <Path d="M56 88q4 18 8 0" fill="#E6944D" />
            <Path d="m20 32 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z" fill="#E1B251" />
            <Circle cx="96" cy="51" r="4" fill="#E1B251" />
          </>
        )}
      </G>
    </Svg>
  );
}
export function Island({ width = 250 }: { width?: number }) {
  return (
    <Svg width={width} height={width * 0.65} viewBox="0 0 300 195" accessibilityElementsHidden>
      <Circle cx="246" cy="43" r="25" fill="#E7BC62" />
      <Ellipse cx="152" cy="165" rx="130" ry="20" fill="#B1D2CC" />
      <Ellipse cx="152" cy="150" rx="94" ry="25" fill="#EBD5A1" />
      <Path d="M137 144q-6-64 16-97" fill="none" stroke="#A77A4F" strokeWidth="11" strokeLinecap="round" />
      <Path
        d="M153 49Q95 5 79 48q32-12 69 9Q91 43 89 84q22-24 62-27Q145 6 176 8q-13 17-17 41Q201 5 230 39q-27-5-69 17Q218 34 231 81q-28-23-72-23"
        fill="#43846D"
      />
      <Path d="m211 138 12-27 20 27Z" fill="#CE8769" />
      <Path d="M207 139h40l-7 9h-25Z" fill="#A16A50" />
      <Path
        d="M26 178q25-13 48 0m148-1q25-13 48 0"
        fill="none"
        stroke="#83B5AF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Circle cx="107" cy="147" r="5" fill="#B98265" />
    </Svg>
  );
}
