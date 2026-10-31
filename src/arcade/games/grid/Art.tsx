import React, { memo, useId } from "react";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { PosePath, type ArtPose } from "../../ArtPose";
import type { SharedValue } from "react-native-reanimated";
import type { OutfitId } from "../../progress";
import type { WorldId } from "../../types";
export const palettes = {
  rail: {
    w1: { sky: "#173F3D", ground: "#357955", light: "#A3CF71", accent: "#FFCE69" },
    w2: { sky: "#153D56", ground: "#285A65", light: "#6EBE9A", accent: "#FFA56E" },
    w3: { sky: "#282D55", ground: "#414965", light: "#9EBA87", accent: "#FFE49B" },
    w4: { sky: "#36564A", ground: "#70865B", light: "#C2D596", accent: "#FFE2A0" },
    w5: { sky: "#51415E", ground: "#7C6684", light: "#D5BAD3", accent: "#F6C4D6" },
    w6: { sky: "#82544A", ground: "#A37C59", light: "#E6CD91", accent: "#FFE9A1" },
    learn: { sky: "#59476C", ground: "#776C8B", light: "#BAD58E", accent: "#FFE49B" },
  },
  crab: {
    w1: { sky: "#0B5466", ground: "#0C8C9C", light: "#A9E4D7", accent: "#FFD481" },
    w2: { sky: "#365180", ground: "#277D9C", light: "#AFDCD8", accent: "#FFC99B" },
    w3: { sky: "#242D5C", ground: "#3B5F8E", light: "#B6DDDD", accent: "#FFE8A6" },
    w4: { sky: "#316159", ground: "#599B86", light: "#C1E4B8", accent: "#F5DF96" },
    w5: { sky: "#564C75", ground: "#80739D", light: "#D6C9E6", accent: "#F4C3D6" },
    w6: { sky: "#9B6253", ground: "#BA8C74", light: "#F3D6AF", accent: "#FFE697" },
    learn: { sky: "#375E69", ground: "#4397A0", light: "#D3E9BC", accent: "#FFE49B" },
  },
} satisfies Record<"rail" | "crab", Record<WorldId, { sky: string; ground: string; light: string; accent: string }>>;
function Outfit({ outfit }: { outfit: OutfitId }) {
  return outfit === "sunhat" ? (
    <G stroke="#493528" strokeWidth={2}>
      <Ellipse cx={50} cy={29} rx={29} ry={5} fill="#EFAF49" />
      <Path d="M33 29Q32 9 50 11Q68 9 67 29Z" fill="#FFE7A1" />
      <Path d="M34 24H67" stroke="#EE8664" strokeWidth={5} />
    </G>
  ) : outfit === "explorer" ? (
    <G stroke="#233E4F" strokeWidth={3}>
      <Rect x={29} y={31} width={42} height={17} rx={7} fill="#9EF2E7" />
      <Path d="M72 38H81V17" stroke="#FFCE69" fill="none" />
    </G>
  ) : outfit === "starlight" ? (
    <G fill="#FFE68A" stroke="#8A5D32">
      <Path d="M50 4L54 15L65 16L57 23L60 34L50 28L40 34L43 23L35 16L46 15Z" />
      <Circle cx={23} cy={26} r={3} />
      <Circle cx={78} cy={21} r={3} />
    </G>
  ) : null;
}
export const GridHero = memo(function GridHero({
  crab = false,
  chick = false,
  size = 100,
  outfit = "island",
  happy = false,
  poses,
  poseIndex = 0,
}: {
  crab?: boolean;
  chick?: boolean;
  size?: number;
  outfit?: OutfitId;
  happy?: boolean;
  poses?: SharedValue<ArtPose[]>;
  poseIndex?: number;
}) {
  const gradient = useId();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Defs>
        <LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={crab ? "#FFB583" : chick ? "#FFE8A3" : "#D7B18B"} />
          <Stop offset="1" stopColor={crab ? "#EC6C53" : chick ? "#E6AF43" : "#916347"} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={50} cy={88} rx={32} ry={6} fill="#132B3C" opacity={0.18} />
      {crab ? (
        <G stroke="#603D3E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <PosePath poses={poses} index={poseIndex} paths={[
            "M28 59L10 67L15 76M29 68L17 82M72 59L90 67L85 76M71 68L83 82",
            "M28 60L16 68L23 75M29 68L25 78M72 60L84 68L77 75M71 68L75 78",
            "M28 57L8 66L6 81M29 68L12 89M72 57L92 66L94 81M71 68L88 89",
            "M28 57L24 64L33 70M29 66L34 75M72 57L76 64L67 70M71 66L66 75",
            "M28 57L5 59L10 72M29 67L10 78M72 57L95 59L90 72M71 67L90 78",
          ]} fill="none" />
          <PosePath poses={poses} index={poseIndex} paths={[
            "M28 53L14 43L10 26L22 33L25 23L31 43M72 53L86 43L90 26L78 33L75 23L69 43",
            "M28 55L18 50L12 35L24 41L28 31L33 49M72 55L82 50L88 35L76 41L72 31L67 49",
            "M28 53L13 36L11 15L23 25L26 13L32 35M72 53L87 36L89 15L77 25L74 13L68 35",
            "M28 53L24 38L28 20L34 32L42 24L37 44M72 53L76 38L72 20L66 32L58 24L63 44",
            "M28 53L10 46L4 29L17 35L19 23L29 41M72 53L90 46L96 29L83 35L81 23L71 41",
          ]} fill="#F59B76" />
          <Ellipse cx={50} cy={59} rx={30} ry={22} fill={`url(#${gradient})`} />
          <Path d="M37 42L35 29M63 42L65 29" />
          <Circle cx={35} cy={28} r={8} fill="#FFFAE8" />
          <Circle cx={65} cy={28} r={8} fill="#FFFAE8" />
          <Circle cx={37} cy={28} r={3.5} fill="#263E4D" />
          <Circle cx={63} cy={28} r={3.5} fill="#263E4D" />
          <Path d="M30 51Q45 42 60 47" fill="none" stroke="#FFDAB5" strokeWidth={4} />
        </G>
      ) : (
        <G stroke="#533D35" strokeWidth={2.7} strokeLinejoin="round">
          <Path d="M41 77L36 89L27 89M61 77L64 89L73 89" fill="none" stroke="#D6A461" strokeWidth={4} />
          <Path d="M29 57L12 48L20 69" fill="#856146" />
          <Ellipse cx={47} cy={62} rx={29} ry={22} fill={`url(#${gradient})`} />
          <Path d="M31 61Q43 45 54 61Q50 78 32 72" fill={chick ? "#F8CD66" : "#91684D"} />
          <Circle cx={63} cy={40} r={22} fill={`url(#${gradient})`} />
          <Path d="M80 41L97 47L80 52" fill="#E9B568" />
          <Path d="M48 29Q59 19 71 27" stroke="#F8DBB5" strokeWidth={4} fill="none" />
          <Circle cx={67} cy={38} r={7} fill="#FFFAEA" />
          <Circle cx={69} cy={39} r={3.5} fill="#263E4D" />
          <Circle cx={70} cy={37} r={1.2} fill="white" />
        </G>
      )}
      <Path
        d={crab ? happy ? "M43 61Q50 75 59 61Z" : "M44 63Q50 69 57 62" : happy ? "M73 50Q78 57 82 49Z" : "M73 50Q78 54 82 49"}
        stroke="#603D3E"
        strokeWidth={2.5}
        fill={happy ? "#6D3D43" : "none"}
        strokeLinecap="round"
      />
      <Ellipse cx={crab ? 32 : 58} cy={crab ? 61 : 50} rx={5} ry={3} fill="#F48C77" opacity={0.7} />
      {!chick && <G transform={crab ? outfit === "sunhat" || outfit === "explorer" ? "translate(0 -10)" : undefined : outfit === "sunhat" ? "translate(12 -6)" : "translate(12 0)"}><Outfit outfit={outfit} /></G>}
    </Svg>
  );
});
export const GridObject = memo(function GridObject({ kind, size = 60 }: { kind: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      {kind === "burrow" ? (
        <G stroke="#755741" strokeWidth={3}>
          <Path d="M8 84Q10 17 50 18Q90 17 92 84Z" fill="#F1CD88" />
          <Path d="M26 83Q26 39 50 39Q74 39 74 83Z" fill="#684D3F" />
          <Path d="M21 40Q30 26 44 27" stroke="#FFF0BF" fill="none" strokeWidth={5} />
          <Path d="M7 84H93" stroke="#A47D4E" />
        </G>
      ) : kind === "snake-body" ? (
        <G>
          <Path d="M-5 54Q23 25 51 50Q75 74 105 46" stroke="#4C352E" strokeWidth={30} fill="none" />
          <Path d="M-5 49Q23 20 51 45Q75 69 105 41" stroke="#AD7546" strokeWidth={21} fill="none" />
          <Path d="M23 31L21 50M53 40L47 57M80 49L76 64" stroke="#DEAF6A" strokeWidth={6} />
        </G>
      ) : kind === "snake" ? (
        <G>
          <Path
            d="M13 54Q28 31 49 52Q72 74 90 47"
            stroke="#4C352E"
            strokeWidth={30}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M13 49Q28 27 49 48Q72 70 90 43"
            stroke="#AD7546"
            strokeWidth={21}
            fill="none"
            strokeLinecap="round"
          />
          <Path d="M23 40L26 58M46 43L41 59M66 53L63 69" stroke="#DEAF6A" strokeWidth={6} />
          <Circle cx={85} cy={38} r={5} fill="#FFF5D5" />
          <Circle cx={86} cy={38} r={2.5} fill="#2D3433" />
          <Path d="M90 51L99 55" stroke="#DF7A77" strokeWidth={3} />
        </G>
      ) : kind === "hedge" ? (
        <G stroke="#1C4A40" strokeWidth={3}>
          <Rect x={10} y={24} width={80} height={66} rx={20} fill="#356647" />
          <Circle cx={30} cy={34} r={22} fill="#65A25F" />
          <Circle cx={68} cy={35} r={24} fill="#73B067" />
          <Path d="M25 23L35 18M57 23L70 20" stroke="#A8D483" strokeWidth={5} />
          <Circle cx={51} cy={51} r={7} fill="#FFA58B" />
        </G>
      ) : kind === "turtle" ? (
        <G stroke="#244E4C" strokeWidth={3}>
          <Path d="M25 40L8 29L13 53M73 40L92 27L87 54M25 67L10 80L35 79M72 67L88 79L65 79" fill="#8CC99C" />
          <Ellipse cx={50} cy={51} rx={30} ry={34} fill="#75AE75" />
          <Path d="M50 27L68 39L66 63L50 76L33 63L31 39Z" fill="#B6D17C" />
          <Path d="M50 27V76M31 39L66 63M68 39L33 63" stroke="#75AE75" />
          <Ellipse cx={50} cy={13} rx={13} ry={12} fill="#A8D5A1" />
          <Circle cx={45} cy={10} r={2} />
          <Circle cx={55} cy={10} r={2} />
        </G>
      ) : ["log", "canoe"].includes(kind) ? (
        <G stroke="#614638" strokeWidth={4}>
          <Path
            d={kind === "canoe" ? "M5 23Q50 61 95 23L83 70Q50 94 17 70Z" : "M10 27Q50 16 90 27V72Q50 86 10 72Z"}
            fill={kind === "canoe" ? "#E7B769" : "#BA8A59"}
          />
          <Path d="M23 35Q50 48 77 35M20 61Q50 73 80 61" stroke="#F1C98A" fill="none" />
          <Path d="M29 48H59" stroke="#8D6442" />
        </G>
      ) : ["bus", "pickup", "bike"].includes(kind) ? (
        <G stroke="#263D51" strokeWidth={3} strokeLinejoin="round">
          <Circle cx={27} cy={77} r={12} fill="#31465A" />
          <Circle cx={76} cy={77} r={12} fill="#31465A" />
          <Circle cx={27} cy={77} r={5} fill="#C5D8D8" />
          <Circle cx={76} cy={77} r={5} fill="#C5D8D8" />
          {kind === "bike" ? (
            <>
              <Path d="M27 76L44 41L76 76H27L52 57M67 34H80M46 39H34" stroke="#FFCD6E" strokeWidth={6} fill="none" />
              <Circle cx={56} cy={26} r={11} fill="#FFD5A7" />
              <Path d="M51 38L60 55L75 57" stroke="#F19C85" strokeWidth={9} fill="none" />
            </>
          ) : (
            <>
              <Rect
                x={8}
                y={kind === "bus" ? 19 : 43}
                width={84}
                height={41}
                rx={10}
                fill={kind === "bus" ? "#FFD16E" : "#F39777"}
              />
              <Path d="M16 43V28Q16 22 23 22H50L61 43Z" fill="#B5E7ED" />
              <Path d="M35 23V43M70 31H83" stroke="#FFF1B8" strokeWidth={4} />
              <Path d="M16 53H82" stroke="#FFEFBC" strokeWidth={4} />
              <Rect x={83} y={49} width={8} height={9} rx={2} fill="#FFF3BC" />
            </>
          )}
        </G>
      ) : null}
    </Svg>
  );
});
export const GridBackdrop = memo(function GridBackdrop({
  crab,
  world = "w1",
  width,
  height,
}: {
  crab: boolean;
  world?: WorldId;
  width: number;
  height: number;
}) {
  const gradient = useId();
  const p = palettes[crab ? "crab" : "rail"][world];
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 400 480"
      preserveAspectRatio="none"
      style={{ position: "absolute" }}
      accessible={false}
    >
      <Defs>
        <LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.sky} />
          <Stop offset="1" stopColor={p.ground} />
        </LinearGradient>
      </Defs>
      <Rect width={400} height={480} fill={`url(#${gradient})`} />
      {Array.from({ length: 32 }, (_, i) => (
        <G key={i} opacity={crab ? 0.35 : 0.16}>
          <Path
            d={`M${(i * 73) % 390} ${(i * 97) % 480}q8 -8 16 0t16 0`}
            fill="none"
            stroke={p.light}
            strokeWidth={2}
          />
          {!crab && <Circle cx={(i * 83) % 390} cy={(i * 101) % 480} r={(i % 3) + 2} fill={p.accent} />}
        </G>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <G key={i} transform={`translate(${i % 2 ? 390 : 0} ${60 + i * 125}) rotate(${i % 2 ? 160 : -20})`}>
          <Path
            d="M0 0Q30-20 67 10Q28 28 0 0M0 0Q15-42 43-46Q50-13 0 0M0 0Q28 35 49 55Q10 60 0 0"
            fill={p.light}
            stroke={p.sky}
            strokeWidth={3}
            opacity={crab ? 0.6 : 0.28}
          />
        </G>
      ))}
    </Svg>
  );
});

export function ChestArt({ size = 140, open = false }: { size?: number; open?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140" accessible={false}>
      <Ellipse cx={70} cy={123} rx={55} ry={8} fill="#243A4A" opacity={0.15} />
      {open && (
        <G stroke="#F4BA57" strokeWidth={4}>
          {[0, 45, 90, 135, 180].map((a) => (
            <Path key={a} d="M70 56V10" transform={`rotate(${a - 90} 70 56)`} />
          ))}
        </G>
      )}
      <Path d="M18 68H122V112Q70 131 18 112Z" fill="#C07F45" stroke="#623F32" strokeWidth={4} />
      <Path
        d={open ? "M18 55V23Q70 3 122 23V55Z" : "M18 68V43Q70 15 122 43V68Z"}
        fill="#E6AA57"
        stroke="#623F32"
        strokeWidth={4}
      />
      <Path d={open ? "M39 19V53M101 19V53" : "M39 36V68M101 36V68"} stroke="#FFE39A" strokeWidth={10} />
      <Path d="M40 72V117M100 72V117" stroke="#F5CC70" strokeWidth={10} />
      <Rect x={59} y={61} width={22} height={29} rx={5} fill="#FFE29B" stroke="#623F32" strokeWidth={3} />
      <Circle cx={70} cy={72} r={4} fill="#623F32" />
      <Path d="M70 73V80" stroke="#623F32" strokeWidth={3} />
    </Svg>
  );
}

/** Exact lane-space deck/hull bounds. No nested scale or square art inside a wider collision box. */
export const CoastalObject = memo(function CoastalObject({
  kind,
  width,
  height,
  left = false,
}: {
  kind: string;
  width: number;
  height: number;
  left?: boolean;
}) {
  const water = ["log", "turtle", "canoe", "island"].includes(kind);
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none" accessible={false}>
      {water ? <Path d="M3 80Q24 85 47 80T97 80" fill="none" stroke="#BDECE1" strokeWidth={2} opacity={.45}/> : <Ellipse cx={50} cy={85} rx={46} ry={4} fill="#172F3B" opacity={.3}/>}
      {water ? (
        <>
          <Path
            d={kind === "canoe" ? "M.5 53L10 32H88L99.5 53L88 75H10Z" : kind === "log" ? "M8 32H92Q99.5 32 99.5 53.5Q99.5 75 92 75H8Q.5 75 .5 53.5Q.5 32 8 32Z" : "M.5 45Q.5 32 14 32H86Q99.5 32 99.5 45V62Q99.5 75 86 75H14Q.5 75 .5 62Z"}
            fill={kind === "turtle" ? "#568B69" : kind === "island" ? "#EACB89" : kind === "canoe" ? "#E7B769" : "#BA8A59"}
            stroke={kind === "island" ? "#A9D3A2" : "#614638"} strokeWidth={1}
          />
          {kind === "log" && <><Ellipse cx={7} cy={53.5} rx={5} ry={19} fill="#E4BE83" stroke="#936740"/><Ellipse cx={7} cy={53.5} rx={2.5} ry={12} fill="none" stroke="#936740"/></>}
          {kind === "canoe" && <><Path d="M12 53L20 40H80L88 53L80 67H20Z" fill="#936740"/><Path d="M29 38V69M70 38V69" stroke="#FFE3A8" strokeWidth={4}/></>}
          {kind === "turtle" ? (
            [16, 50, 84].map((x) => (
              <G key={x}>
                <Ellipse cx={x} cy={52} rx={17} ry={25} fill="#B6D17C" stroke="#4C886C" strokeWidth={1.3} />
                <Path
                  d={`M${x} 30V74M${x - 10} 45L${x + 10} 62M${x + 10} 45L${x - 10} 62`}
                  stroke="#75AE75"
                  strokeWidth={1.5}
                />
                <Ellipse cx={x} cy={23} rx={5} ry={10} fill="#A8D5A1" />
              </G>
            ))
          ) : (
            <>
              <Path
                d="M5 42Q50 32 95 42M5 63Q50 72 95 63"
                fill="none"
                stroke={kind === "island" ? "#FFF0BC" : "#F1C98A"}
                strokeWidth={2}
              />
              <Path d="M19 52H38M61 55H83" stroke={kind === "island" ? "#8CA975" : "#936740"} strokeWidth={2} />
            </>
          )}
        </>
      ) : (
        <G transform={left ? "translate(100 0) scale(-1 1)" : undefined} stroke="#263D51" strokeWidth={1.8} strokeLinejoin="round">
          <Ellipse cx={23} cy={74} rx={9} ry={11} fill="#31465A" />
          <Ellipse cx={77} cy={74} rx={9} ry={11} fill="#31465A" />
          {kind === "bike" ? (
            <>
              <Path d="M9 71L34 38L82 71H9L51 51M58 28H80" stroke="#FFD479" strokeWidth={6} fill="none" />
              <Ellipse cx={51} cy={27} rx={10} ry={12} fill="#FFD5A7" />
              <Path d="M47 40L58 54L76 53" stroke="#F19C85" strokeWidth={8} />
            </>
          ) : (
            <>
              <Rect x={4} y={26} width={92} height={49} rx={8} fill={kind === "bus" ? "#FFD16E" : "#F39777"} />
              <Rect x={12} y={32} width={kind === "bus" ? 70 : 40} height={23} rx={4} fill="#B5E7ED" />
              <Path d="M32 32V55M52 32V55M8 63H90" stroke="#FFF1B8" strokeWidth={2} />
              <Rect x={89} y={58} width={6} height={9} fill="#FFF3BC" />
            </>
          )}
        </G>
      )}
    </Svg>
  );
});
