import React, { memo, useId } from "react";
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { PosePath, type ArtPose } from "../ArtPose";
import type { SharedValue } from "react-native-reanimated";
import type { OutfitId } from "../progress";
import type { WorldId } from "../types";
export const AmbientFriend = memo(function AmbientFriend({ night = false }: { night?: boolean }) {
  return (
    <Svg width={44} height={32} viewBox="0 0 44 32" accessible={false}>
      {night ? (
        <G>
          <Circle cx={22} cy={16} r={13} fill="#FFF0A0" opacity={0.1} />
          <Circle cx={22} cy={16} r={6} fill="#FFF1A8" />
          <Ellipse cx={17} cy={9} rx={5} ry={3} fill="#B8EEDE" />
          <Ellipse cx={27} cy={9} rx={5} ry={3} fill="#B8EEDE" />
        </G>
      ) : (
        <Path
          d="M3 20Q12 4 22 17Q32 4 41 20Q30 12 22 22Q14 12 3 20"
          fill="#FFF6D7"
          stroke="#467E8E"
          strokeWidth={1.5}
        />
      )}
    </Svg>
  );
});
export const palettes = {
  w1: ["#086D86", "#4FC7BF", "#FFE1A0"],
  w2: ["#3762A1", "#9BCFDF", "#F6C585"],
  w3: ["#192D68", "#8A7FC8", "#F0B98C"],
  w4: ["#37665D", "#91BC9D", "#DDCA8B"],
  w5: ["#564770", "#BA9AC3", "#E7B6AA"],
  w6: ["#A16153", "#E6AC85", "#FFE1A0"],
  learn: ["#247A67", "#A8D9AB", "#FFE7A0"],
} satisfies Record<WorldId, [string, string, string]>;
const star = "M0-9L3-3L10-2L5 3L6 10L0 7L-6 10L-5 3L-10-2L-3-3Z";
function Outfit({ outfit }: { outfit: OutfitId }) {
  return outfit === "sunhat" ? (
    <G stroke="#603E29" strokeWidth={3}>
      <Ellipse cx={50} cy={29} rx={33} ry={6} fill="#FFF0A6" />
      <Path d="M29 26Q30 3 50 7Q70 5 72 26Z" fill="#FFD06C" />
      <Path d="M30 22H70" stroke="#F27F6C" strokeWidth={6} />
    </G>
  ) : outfit === "explorer" ? (
    <G fill="#BAF5ED" stroke="#245B68" strokeWidth={3}>
      <Rect x={21} y={37} width={58} height={20} rx={8} />
      <Path d="M80 44H88V17" fill="none" stroke="#F59A5D" strokeWidth={6} />
    </G>
  ) : outfit === "starlight" ? (
    <G fill="#FFE67D" stroke="#7E572F" strokeWidth={1}>
      <Path d={star} transform="translate(30 20)" />
      <Path d={star} transform="translate(70 15) scale(.7)" />
      <Path d={star} transform="translate(88 30) scale(.5)" />
    </G>
  ) : (
    <Path d="M25 28Q48 6 76 28L55 28Q58 7 37 11L45 28Z" fill="#BCE25E" stroke="#245E41" strokeWidth={3} />
  );
}
export const ActionHero = memo(function ActionHero({
  palm,
  size = 110,
  outfit = "island",
  happy = false,
  poses,
}: {
  palm: boolean;
  size?: number;
  outfit?: OutfitId;
  happy?: boolean;
  poses?: SharedValue<ArtPose[]>;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Defs>
        <LinearGradient id={`action-hero-${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={palm ? "#E8AF69" : "#FFFFFF"} />
          <Stop offset="1" stopColor={palm ? "#A85D38" : "#FFAE77"} />
        </LinearGradient>
      </Defs>
      <Ellipse cx={50} cy={91} rx={33} ry={5} fill="#194C5A" opacity={0.2} />
      {/* Coco's feet stay planted; the throwing hand releases at arena (launcher, 532). */}
      <Path d="M35 83L29 91H19M65 83L71 91H81" stroke={palm ? "#75432D" : "#23596E"} strokeWidth={7} strokeLinecap="round"/>
      <Circle
        cx={50}
        cy={56}
        r={34}
        fill={`url(#action-hero-${id})`}
        stroke={palm ? "#75432D" : "#23596E"}
        strokeWidth={4}
      />
      {palm ? (
        <Path
          d="M24 42Q17 60 29 73M70 35Q82 55 75 73"
          stroke="#F4D1A1"
          strokeWidth={5}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <G>
          <Path d="M50 23Q26 48 50 89Q59 65 50 23" fill="#F77E70" />
          <Path d="M50 23Q78 44 81 68Q56 63 50 23" fill="#5CCCBF" />
          <Path d="M50 23Q27 30 18 54Q34 44 50 23" fill="#F7CE5D" />
        </G>
      )}
      <PosePath poses={poses} index={57} paths={[
        "M23 60L11 54M77 60L87 43L76 34",
        "M23 60L12 54M77 60L72 39L50 24.36",
        "M23 60L10 54M77 60L89 48L87 30",
      ]} stroke={palm ? "#75432D" : "#23596E"} strokeWidth={7} strokeLinecap="round" fill="none"/>
      <Circle cx={38} cy={54} r={5} fill="#FFFDF0" />
      <Circle cx={64} cy={54} r={5} fill="#FFFDF0" />
      <Circle cx={39} cy={55} r={2.8} fill="#253E46" />
      <Circle cx={63} cy={55} r={2.8} fill="#253E46" /><Circle cx={39.8} cy={54} r={.9} fill="white"/><Circle cx={63.8} cy={54} r={.9} fill="white"/>
      <Path
        d={happy ? "M38 65Q51 86 65 65Z" : "M42 66Q51 75 60 66"}
        fill={happy ? "#713C3A" : "none"}
        stroke="#653D34"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Ellipse cx={30} cy={64} rx={6} ry={3} fill="#F59F7F" />
      <Ellipse cx={72} cy={64} rx={6} ry={3} fill="#F59F7F" />
      {!palm && outfit === "island" ? <G stroke="#23596E" strokeWidth={2.5}><Path d="M24 30Q48 18 75 30L76 37Q50 29 24 37Z" fill="#F58070"/><Path d="M48 33Q68 26 83 36Q67 43 48 39Z" fill="#FFE4A2"/></G> : <Outfit outfit={outfit} />}
    </Svg>
  );
});
export const BeetleArt = memo(function BeetleArt({ size, boss = false, poses, poseIndex = 0 }: { size: number; boss?: boolean; poses?: SharedValue<ArtPose[]>; poseIndex?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Defs>
        <LinearGradient id={`action-bug-${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={boss ? "#CE95ED" : "#D39561"} />
          <Stop offset="1" stopColor={boss ? "#764893" : "#7E4C38"} />
        </LinearGradient>
      </Defs>
      <G stroke="#3E3640" strokeWidth={5} strokeLinecap="round">
        <PosePath poses={poses} index={poseIndex} paths={[
          "M27 36L13 26M25 51L10 52M27 65L13 77M73 36L87 26M75 51L90 52M73 65L87 77",
          "M27 36L10 40M25 51L14 65M27 65L18 84M73 36L82 18M75 51L89 39M73 65L91 63",
        ]}/>
        <Ellipse cx={50} cy={52} rx={29} ry={34} fill={`url(#action-bug-${id})`} />
        <Path d="M50 29V82" stroke="#6B4339" strokeWidth={3} />
        <Path d="M35 29Q29 48 34 59" stroke="#F5CD9C" strokeWidth={5} />
        <Path d="M39 25Q30 3 45 8L51 20Q63 9 65 17L62 31" fill={boss ? "#A56DB9" : "#BC855C"} />
      </G>
      <Circle cx={39} cy={35} r={6} fill="#FFF4D8" />
      <Circle cx={62} cy={35} r={6} fill="#FFF4D8" />
      <Circle cx={40} cy={37} r={3} fill="#303F4F" />
      <Circle cx={61} cy={37} r={3} fill="#303F4F" />
      <Path d="M44 47Q50 51 56 47" stroke="#402C30" strokeWidth={2.5} fill="none" />
      {boss && <Path d="M28 14L24 2L39 8L50 0L61 8L76 2L72 17" fill="#FFDA65" stroke="#7D562A" strokeWidth={3} />}
    </Svg>
  );
});
export const HuskArt = memo(function HuskArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Ellipse cx={20} cy={20} rx={13} ry={17} fill="#DFA660" stroke="#6C4934" strokeWidth={3} />
      <Path d="M13 10Q7 20 14 28M21 5Q16 19 22 34" stroke="#FFE2A6" strokeWidth={3} fill="none" />
    </Svg>
  );
});
export const BallArt = memo(function BallArt({ size, outline = 2 }: { size: number; outline?: number }) {
  const clip = useId();
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" accessible={false}>
      <Defs><ClipPath id={clip}><Circle cx={30} cy={30} r={28.5 - outline * 30 / size}/></ClipPath></Defs>
      <G clipPath={`url(#${clip})`}>
      <Circle cx={30} cy={30} r={30} fill="#FFF9DC" />
      <Path d="M30 3Q9 31 30 57Q41 34 30 3" fill="#F27F72" />
      <Path d="M30 3Q55 12 57 34L34 30Z" fill="#59CBBF" />
      <Path d="M30 3Q10 4 4 26L24 20Z" fill="#F6C94E" />

      <Ellipse cx={18} cy={15} rx={6} ry={3} fill="white" transform="rotate(-35 18 15)" />
      </G>
      <Circle cx={30} cy={30} r={28.5 - outline * 30 / size} fill="none" stroke="#234958" strokeWidth={outline * 60 / size} />
    </Svg>
  );
});
export const TurtleArt = memo(function TurtleArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <G fill="#A4D8A1" stroke="#285E53" strokeWidth={3}>
        <Ellipse cx={50} cy={18} rx={13} ry={15} />
        <Path d="M29 40Q2 23 10 53L27 58M71 40Q98 23 90 53L73 58M30 69L18 90L40 80M70 69L82 90L60 80" />
        <Circle cx={50} cy={50} r={35} fill="#53A88F" />
        <Path d="M50 30L69 46L61 71H39L31 46Z" fill="#BDE09D" />
      </G>
      <Path d="M41 15L47 17M54 17L60 15" stroke="#285E53" strokeWidth={3} strokeLinecap="round" />
      <Path d="M76 10H89L76 24H89" fill="none" stroke="#F8F6D0" strokeWidth={3} />
    </Svg>
  );
});
function Palm({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path d="M0 100Q19 39 1 0" stroke="#75472E" strokeWidth={15} fill="none" />
      <Path d="M-1 84L13 87M2 65L16 67M4 44L16 47" stroke="#D69E65" strokeWidth={5} />
      <Path
        d="M0 0Q-48-40-70 1Q-37-8 0 0M0 0Q34-48 67-13Q35-18 0 0M0 0Q-45-8-47 37Q-21 13 0 0M0 0Q46-13 52 29Q25 7 0 0M0 0Q-7-40 18-49Q9-17 0 0"
        fill="#4CAB73"
        stroke="#21674E"
        strokeWidth={2}
      />
      <Circle cx={-6} cy={7} r={9} fill="#C68A4E" />
      <Circle cx={10} cy={7} r={8} fill="#B57542" />
    </G>
  );
}
export const Scene = memo(function Scene({
  palm,
  world = "w1",
  width,
  height,
}: {
  palm: boolean;
  world?: WorldId;
  width: number;
  height: number;
}) {
  const p = palettes[world],
    id = useId().replace(/:/g, "");
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 360 600"
      preserveAspectRatio="none"
      style={{ position: "absolute" }}
      accessible={false}
    >
      <Defs>
        <LinearGradient id={`action-sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p[0]} />
          <Stop offset=".65" stopColor={p[1]} />
          <Stop offset="1" stopColor={p[2]} />
        </LinearGradient>
        <LinearGradient id={`action-sand-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBE2A4" />
          <Stop offset="1" stopColor="#DDA664" />
        </LinearGradient>
      </Defs>
      <Rect width={360} height={600} fill={`url(#action-sky-${id})`} />
      <G opacity={palm ? 1 : 0.18}>
      {/* Sky fills the arena; celestial discs keep a uniform scale on wide tablets. */}
      <Ellipse cx={292} cy={90} rx={37 * Math.min(1, height * 360 / (width * 600))} ry={37 * Math.min(1, width * 600 / (height * 360))} fill={world === "w3" ? "#FFF1BE" : "#FFF3B2"} opacity={0.9} />
      <Ellipse cx={292} cy={90} rx={49 * Math.min(1, height * 360 / (width * 600))} ry={49 * Math.min(1, width * 600 / (height * 360))} fill="#FFF4CE" opacity={0.13} />
      {world === "w3" &&
        [22, 75, 135, 202, 330].map((x, i) => (
          <Path key={x} d={star} fill="#FFE6B1" transform={`translate(${x} ${42 + (i % 3) * 35}) scale(.35)`} />
        ))}
      <Path d="M0 184Q62 160 124 182T248 182T372 182V600H0Z" fill="#228F9C" opacity={0.45} />
      <Path d="M0 206Q80 188 162 208T360 202" fill="none" stroke="#C5F4E2" strokeWidth={3} opacity={0.5} />
      <Path
        d={palm ? "M0 457Q95 437 180 452T360 445V600H0Z" : "M0 245Q95 221 180 244T360 231V600H0Z"}
        fill={`url(#action-sand-${id})`}
      />
      <Path
        d={palm ? "M0 458Q100 438 190 455T360 447" : "M0 244Q100 224 190 246T360 234"}
        fill="none"
        stroke="#FFFAE4"
        strokeWidth={8}
        opacity={0.8}
      />
      </G>
      {palm ? (
        <>
          <Palm x={-5} y={431} scale={0.85} />
          <Palm x={355} y={428} scale={0.8} />
          <Palm x={38} y={546} scale={0.4} />
          <Palm x={320} y={541} scale={0.45} />
          <Path d="M23 553Q180 530 336 553" stroke="#A97645" strokeWidth={3} strokeDasharray="2 13" fill="none" />
        </>
      ) : (
        <>
          <Rect x={18} y={48} width={324} height={504} rx={48} fill="#FFF0CB" opacity={0.09}/>
          <Path d="M22 300H338" stroke="#FFF9DA" strokeWidth={2} strokeDasharray="8 10" opacity={0.35}/>
          <Circle cx={180} cy={300} r={58} fill="none" stroke="#FFF9DA" strokeWidth={2} opacity={0.35}/>
          {/* Rails mark the engine’s ball-centre reflection planes. End lines stay open. */}
          <Path d="M12 0V600M348 0V600" stroke="#F8EFCE" opacity={0.8} strokeWidth={2}/>
          <Path d="M12 0H348M12 600H348" stroke="#B5F1DF" opacity={0.5} strokeWidth={3} strokeDasharray="2 10"/>
          <Path d="M172 16L180 8L188 16M172 584L180 592L188 584" stroke="#FFF4CF" strokeWidth={3} fill="none"/>
          <Palm x={-8} y={377} scale={0.55} />
          <Palm x={368} y={110} scale={0.55} />
        </>
      )}
      {[28, 80, 145, 214, 295, 332].map((x, i) => (
        <G key={x} opacity={0.4}>
          <Ellipse cx={x} cy={570 - (i % 3) * 40} rx={3} ry={1.5} fill="#926841" />
          <Circle cx={x + 7} cy={577 - (i % 3) * 40} r={1.5} fill="#FFF4D5" />
        </G>
      ))}
      <Path
        d="M31 129Q37 122 43 129Q49 122 55 129M110 77Q116 70 122 77Q128 70 134 77"
        fill="none"
        stroke="#E7F8DE"
        strokeWidth={2}
        opacity={0.65}
      />
    </Svg>
  );
});
export function ChestArt({ size = 150, open = false }: { size?: number; open?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140" accessible={false}>
      <Defs>
        <LinearGradient id={`action-chest-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#DA9A4D" />
          <Stop offset="1" stopColor="#9C5638" />
        </LinearGradient>
      </Defs>
      <Ellipse cx={70} cy={122} rx={54} ry={8} fill="#6D4A30" opacity={0.15} />
      {open && (
        <G fill="#FFDD67">
          {[0, 1, 2, 3, 4].map((i) => (
            <Path key={i} d={star} transform={`translate(${16 + i * 27} ${30 - (i % 2) * 12}) scale(.7)`} />
          ))}
        </G>
      )}
      <Rect
        x={20}
        y={65}
        width={100}
        height={54}
        rx={10}
        fill={`url(#action-chest-${id})`}
        stroke="#613D2C"
        strokeWidth={4}
      />
      <Path
        d={open ? "M20 62L28 25Q72 4 112 25L120 62Z" : "M20 68V53Q20 25 70 25Q120 25 120 53V68Z"}
        fill="#CC8542"
        stroke="#613D2C"
        strokeWidth={4}
      />
      <Path d="M35 44V116M105 44V116M20 70H120" stroke="#F9CC66" strokeWidth={9} />
      <Rect x={58} y={63} width={24} height={28} rx={5} fill="#FFE092" stroke="#8B5E30" strokeWidth={3} />
      <Path d={star} transform="translate(70 76) scale(.6)" fill="#B56F33" />
    </Svg>
  );
}

export const NetArt = memo(function NetArt({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessible={false}>
      <Path d="M14 38Q50 92 86 38Q74 96 50 94Q26 96 14 38Z" fill="#D1F4DF66" stroke="#F9E5A8" strokeWidth={3} />
      <Path
        d="M20 50L70 83M31 65L57 91M80 50L30 83M69 65L43 91M36 49L64 83M64 49L36 83"
        fill="none"
        stroke="#FFEDC8"
        strokeWidth={2}
      />
      <Ellipse cx={50} cy={38} rx={37} ry={12} fill="none" stroke="#8B6941" strokeWidth={4} />
    </Svg>
  );
});
