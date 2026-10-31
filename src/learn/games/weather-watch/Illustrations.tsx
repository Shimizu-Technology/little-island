import React from "react";
import { Circle, Ellipse, G, Line, Path, Rect, Defs, RadialGradient, Stop } from "react-native-svg";
import { IslanderShape } from "../../../islander/rig/Islander";
import { resolvePose } from "../../../islander/rig/poses";
import { anchorsFor } from "../../../islander/rig/wardrobe";
import { useActiveIslanderLook } from "../../../islander/active";
const ink = "#365653";
export function SkySun({ x = 45, y = 45, r = 23 }: { x?: number; y?: number; r?: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r + 10} fill="#F5D98A" opacity={0.28} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5;
        return (
          <Line
            key={i}
            x1={x + Math.cos(a) * (r + 5)}
            y1={y + Math.sin(a) * (r + 5)}
            x2={x + Math.cos(a) * (r + 12)}
            y2={y + Math.sin(a) * (r + 12)}
            stroke="#DCA74B"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={x} cy={y + 2} r={r} fill="#CDA65D" opacity={0.2} />
      <Circle cx={x} cy={y} r={r} fill="#F2C85D" stroke="#C99842" strokeWidth={1.6} />
      <Path
        d={`M${x - r * 0.6} ${y - r * 0.15}q${r * 0.15} ${-r * 0.55} ${r * 0.7} ${-r * 0.55}`}
        stroke="#FFE5A1"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}
export function PuffyCloud({
  x = 0,
  y = 0,
  scale = 1,
  storm = false,
}: {
  x?: number;
  y?: number;
  scale?: number;
  storm?: boolean;
}) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path
        d="M-39 16C-61 14-57-13-38-15C-37-38-8-43 4-25C25-41 47-23 44-6C65-4 63 22 43 24H-34Z"
        fill="#365653"
        opacity={0.1}
        transform="translate(0 4)"
      />
      <Path
        d="M-39 16C-61 14-57-13-38-15C-37-38-8-43 4-25C25-41 47-23 44-6C65-4 63 22 43 24H-34Z"
        fill={storm ? "#B4CCD0" : "#FFFCED"}
        stroke={storm ? "#71979E" : "#91B7B5"}
        strokeWidth={2}
      />
      <Path
        d="M-34-6q12-18 27-8M14-9q10-7 19 1"
        fill="none"
        stroke={storm ? "#D4E4E2" : "#FFFFFF"}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </G>
  );
}
export function EarthGlobe({ x, y, r, night = false }: { x: number; y: number; r: number; night?: boolean }) {
  const id = "earth" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <G transform={`translate(${x} ${y}) scale(${r / 50})`}>
      <Ellipse cx={3} cy={51} rx={42} ry={5} fill={ink} opacity={0.12} />
      <Defs>
        <RadialGradient id={id} cx="28%" cy="23%" r="78%">
          <Stop offset="0" stopColor="#A4D6D5" />
          <Stop offset="1" stopColor="#5696AE" />
        </RadialGradient>
      </Defs>
      <Circle r={50} fill={`url(#${id})`} stroke="#456E82" strokeWidth={2} />
      <Path
        d="M-33-34L-15-44 1-39 8-26-6-17-12-3-30-6-39-19ZM-8 2L8 0 19 14 10 38 0 44-7 25-15 15ZM27-29L40-25 47-9 38 0 29-11 16-14Z"
        fill="#9BBD7C"
        stroke="#639F80"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M-28-24Q-7-35 18-26M-35 13Q-10 4 10 12T39 14M-11 34q13-7 27-1"
        stroke="#F5FAEF"
        strokeWidth={3.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.8}
      />
      {night && <Path d="M0-50A50 50 0 0 1 0 50Z" fill="#263D59" opacity={0.82} />}
      <Path d="M-40-15A43 43 0 0 1-21-37" stroke="#B7DADD" strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}
export function MoonDisc({ x, y, r, phase = 4 }: { x: number; y: number; r: number; phase?: number }) {
  const id = "moon" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = Math.cos((phase * Math.PI) / 4),
    waxing = phase <= 4,
    outer = waxing ? 1 : 0,
    inner = waxing ? (c < 0 ? 1 : 0) : c < 0 ? 0 : 1;
  return (
    <G transform={`translate(${x} ${y}) scale(${r / 30})`}>
      <Defs>
        <RadialGradient id={id} cx="28%" cy="24%" r="85%">
          <Stop offset="0" stopColor="#FFF9E3" />
          <Stop offset="1" stopColor="#BEBDAF" />
        </RadialGradient>
      </Defs>
      <Circle r={30} fill="#40536C" stroke="#33475D" strokeWidth={1.5} />
      <Path
        d={`M0-30A30 30 0 0 ${outer} 0 30A${Math.max(0.001, Math.abs(c) * 30)} 30 0 0 ${inner} 0-30Z`}
        fill={`url(#${id})`}
      />
      <Circle cx={-11} cy={-12} r={5} fill="#AEB5B0" opacity={0.32} />
      <Circle cx={12} cy={9} r={7} fill="#AEB5B0" opacity={0.27} />
      <Circle cx={-5} cy={18} r={3} fill="#AEB5B0" opacity={0.3} />
      <Path
        d="M-23-10A25 25 0 0 1-12-22"
        fill="none"
        stroke="#F7F1DA"
        strokeWidth={2}
        opacity={0.5}
        strokeLinecap="round"
      />
    </G>
  );
}
/** Species silhouettes keep their anatomy distinct even at small palette sizes. */
export function Creature({ name, x = 0, y = 0, scale = 1 }: { name: string; x?: number; y?: number; scale?: number }) {
  const n = name.toLowerCase();
  let art: React.ReactNode;
  if (n.includes("shark") || n.includes("triggerfish"))
    art = n.includes("shark") ? (
      <>
        <Path d="M-40 0Q-12-18 22-6L43-23 37-2 44 17 21 7Q-7 23-40 8L-51 2Z" fill="#729CA8" />
        <Path d="M-7-11L6-33 14-8M1 13L18 28 15 10" fill="#648997" />
        <Path d="M-35 7Q-8 16 20 5" stroke="#D5E2DE" strokeWidth={6} />
        <Path d="M-17-3l-2 10m8-12-2 10" stroke={ink} strokeWidth={1.5} />
        <Circle cx={-32} cy={1} r={2} fill={ink} />
        <Path d="M-48 5h12" stroke={ink} strokeWidth={1.5} />
      </>
    ) : (
      <>
        <Path d="M-32 0Q-3-32 24-3L40-18 37 15 22 7Q-5 32-32 9Z" fill="#DFB068" />
        <Path d="M-3-17L8-32 17-13M-2 19L11 30 19 12" fill="#B88B50" />
        <Circle cx={-21} cy={2} r={2} fill={ink} />
        <Path d="M-10-13L0 16M3-16L13 14" stroke="#F4D69D" strokeWidth={4} />
      </>
    );
  else if (n.includes("parrot") || n.includes("grazer"))
    art = (
      <>
        <Path d="M-32-2Q-10-28 23-11L40-23 39 19 23 9Q-8 28-32 9L-40 7-40-1Z" fill="#69B7AC" />
        <Path d="M-10-19L10-29 23-11M-4 19L13 29 25 10" fill="#D18D78" />
        <Path d="M-30-3L-36 2-30 7" fill="#F4D296" />
        <Path d="M-8-13Q-19 2-7 16" fill="none" stroke="#E0D995" strokeWidth={4} />
        <Path d="M8-14L17 12M18-10L26 9" stroke="#439391" strokeWidth={2} />
        <Circle cx={-23} cy={0} r={2.5} fill={ink} />
      </>
    );
  else if (n.includes("turtle"))
    art = (
      <>
        <Path
          d="M-18-12L-36-27-40-14-23 0M16-10L31-29 37-18 23 0M-17 14L-28 29-12 24M14 14L27 28 14 24"
          fill="#77AA80"
        />
        <Ellipse rx={25} ry={21} fill="#86AB70" />
        <Path
          d="M0-16L13-8 14 8 0 16-14 8-13-8ZM-23 0H-14M14 0H24M0-16V-21M0 16V21"
          fill="#B3C689"
          stroke="#598364"
          strokeWidth={2}
        />
        <Ellipse cx={-34} cy={0} rx={12} ry={10} fill="#8CB98B" />
        <Circle cx={-38} cy={-3} r={2} fill={ink} />
      </>
    );
  else if (n.includes("octopus"))
    art = (
      <>
        <Path
          d="M-20 5Q-29 26-39 17M-12 10Q-16 37-27 29M-3 12Q-1 40-12 34M7 11Q18 39 23 26M16 7Q32 30 40 17"
          fill="none"
          stroke="#A58AAF"
          strokeWidth={9}
          strokeLinecap="round"
        />
        <Path d="M-22 5Q-28-31 0-31Q27-31 22 5Q0 20-22 5Z" fill="#B59ABD" />
        <Circle cx={-9} cy={-3} r={3} fill={ink} />
        <Circle cx={9} cy={-3} r={3} fill={ink} />
        <Path d="M-4 7q4 4 8 0" fill="none" stroke={ink} strokeWidth={1.5} />
      </>
    );
  else if (n.includes("urchin"))
    art = (
      <>
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i * Math.PI) / 7;
          return (
            <Line
              key={i}
              x1={Math.cos(a) * 18}
              y1={Math.sin(a) * 18}
              x2={Math.cos(a) * 34}
              y2={Math.sin(a) * 34}
              stroke="#7F718B"
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
        <Circle r={23} fill="#9986A3" />
        <Circle cx={-6} cy={-6} r={8} fill="#B4A1BB" opacity={0.6} />
      </>
    );
  else if (n.includes("crab"))
    art = (
      <>
        <Path
          d="M-19 3L-32 16M-16 12L-28 26M19 3L32 16M16 12L28 26M-18-5L-31-20M18-5L31-20"
          fill="none"
          stroke="#BA7A68"
          strokeWidth={4}
        />
        <Path d="M-38-25L-31-13-23-26M38-25L31-13 23-26" fill="#DC9B81" />
        <Ellipse rx={23} ry={16} fill="#DC9B81" />
        <Circle cx={-9} cy={-15} r={3} fill={ink} />
        <Circle cx={9} cy={-15} r={3} fill={ink} />
      </>
    );
  else
    art = (
      <>
        <Path d="M-30 0Q-5-25 20-6L37-20 37 20 20 7Q-7 26-30 9Z" fill="#EDC266" />
        <Path d="M-2-16L10-26 19-8M-3 18L11 27 20 8" fill="#D39662" />
        <Path d="M-6-13Q-17 0-5 16" fill="none" stroke="#FFF0BC" strokeWidth={3} />
        <Circle cx={-20} cy={1} r={2.5} fill={ink} />
      </>
    );
  return (
    <G
      transform={`translate(${x} ${y}) scale(${scale})`}
      stroke={ink}
      strokeWidth={1.6}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {art}
    </G>
  );
}
export function Seaweed({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`} fill="none" strokeLinecap="round">
      <Path d="M0 0Q-21-26-7-57M-2-5Q21-27 11-69M-3-8Q-32-29-25-43" stroke="#426F62" strokeWidth={9} />
      <Path d="M-1-2Q-17-27-5-55M0-4Q18-27 12-66M-3-9Q-27-30-24-41" stroke="#7DA679" strokeWidth={5} />
    </G>
  );
}
export function Coral({ x, y, scale = 1, health = 100 }: { x: number; y: number; scale?: number; health?: number }) {
  const color = health < 35 ? "#E4DCC9" : health < 60 ? "#CBBFA4" : "#D99B88";
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <Path
        d="M0 0V-55M0-25L-22-42V-60M0-37L21-53V-69M-21-43L-35-51M21-53L36-58M0-14L25-29V-42M-21-49L-10-57"
        stroke={ink}
        strokeWidth={10}
      />
      <Path
        d="M0 0V-55M0-25L-22-42V-60M0-37L21-53V-69M-21-43L-35-51M21-53L36-58M0-14L25-29V-42M-21-49L-10-57"
        stroke={color}
        strokeWidth={7}
      />
    </G>
  );
}
export function ReefHabitat({ health = 100 }: { health?: number }) {
  return (
    <G>
      <Rect width={360} height={220} rx={18} fill="#DDEFEA" />
      <Path d="M0 0H360V55Q210 22 0 70Z" fill="#EDF7EB" />
      <Path d="M15 0L67 0 150 160 115 160ZM235 0h25l-22 160h-35Z" fill="#FFFFFF" opacity={0.2} />
      <Path d="M0 188Q80 171 170 190T360 186V220H0Z" fill="#D7D7AF" />
      <Ellipse cx={74} cy={204} rx={56} ry={7} fill={ink} opacity={0.1} />
      <Coral x={60} y={204} scale={0.63} health={health} />
      <Coral x={307} y={200} scale={0.48} health={health} />
      <Seaweed x={337} y={202} scale={0.55} />
      {[20, 46, 96].map((y, i) => (
        <Circle key={y} cx={331 - i * 5} cy={y} r={2 + i} stroke="#A4C9C4" strokeWidth={1.4} fill="none" />
      ))}
    </G>
  );
}
export function WeatherExplorer({ gear }: { gear: string }) {
  const look = useActiveIslanderLook(),
    pose = resolvePose("front", "idle"),
    a = anchorsFor(pose),
    [hx, hy] = a.face,
    [nx, ny] = a.neck,
    [tx, ty] = a.torso,
    [hatx, haty] = a.headTop;
  const rain = gear.toLowerCase().includes("raincoat"),
    cold = gear.toLowerCase().includes("warm"),
    hat = gear.toLowerCase().includes("hat");
  return (
    <G transform="translate(137 28) scale(1.25)">
      <Ellipse cx={40} cy={132} rx={29} ry={4} fill={ink} opacity={0.16} />
      <IslanderShape pose={pose} look={look} />
      {(rain || cold) && (
        <G fill={rain ? "#EAC65E" : "#C38E76"} stroke="#695B44" strokeWidth={1.4} strokeLinejoin="round">
          <Path
            d={`M${tx - 15} ${ty - 13}Q${nx} ${ny - 4} ${tx + 15} ${ty - 13}L${tx + 20} ${ty + 24}Q${tx} ${ty + 29} ${tx - 20} ${ty + 24}Z`}
          />
          <Path
            d={`M${a.leftShoulder[0] - 1} ${a.leftShoulder[1]}L${a.leftElbow[0] - 4} ${a.leftElbow[1] + 10}M${a.rightShoulder[0] + 1} ${a.rightShoulder[1]}L${a.rightElbow[0] + 4} ${a.rightElbow[1] + 10}`}
            stroke={rain ? "#DAB245" : "#B07A66"}
            strokeWidth={10}
            strokeLinecap="round"
          />
          <Path d={`M${tx} ${ny + 5}v38`} fill="none" />
          <Path d={`M${tx - 14} ${ty + 9}h8v8h-8m20-8h8v8h-8`} fill="none" />
        </G>
      )}
      {rain && (
        <Path
          d={`M${nx - 11} ${ny - 2}Q${nx} ${ny + 13} ${nx + 11} ${ny - 2}`}
          stroke="#FFF1B7"
          strokeWidth={4}
          fill="none"
        />
      )}
      {cold && (
        <G fill="#648FA8" stroke="#416579" strokeWidth={1.2}>
          <Path d={`M${nx - 13} ${ny - 4}q13 8 26 0l-1 8q-12 6-25-1Z`} />
          <Path d={`M${nx + 4} ${ny + 5}l7 26 9-3-8-26Z`} />
        </G>
      )}
      {hat && (
        <G stroke="#A47C3F" strokeWidth={1.4}>
          <Path d={`M${hatx - 24} ${haty + 7}l5-15q19-8 38 0l5 15Z`} fill="#E7C778" />
          <Ellipse cx={hatx} cy={haty + 8} rx={35} ry={5} fill="#EDCE83" />
          <Path
            d={`M${hx - 22} ${hy - 1}q8-3 17 0v8q-10 6-17-1ZM${hx + 5} ${hy - 1}q8-3 17 0v7q-9 7-17 1Z`}
            fill="#405B64"
          />
          <Path d={`M${hx - 5} ${hy + 1}h10`} stroke="#405B64" strokeWidth={2} />
        </G>
      )}
    </G>
  );
}

/** Small pictures keep food-chain and web nodes readable before their labels are read. */
export function NodePicture({ name, x, y, scale = 1 }: { name: string; x: number; y: number; scale?: number }) {
  const n = name.toLowerCase();
  const art =
    n === "sun" || n === "sunlight" ? (
      <SkySun x={0} y={0} r={14} />
    ) : n.includes("algae") ? (
      <Seaweed x={0} y={20} scale={0.55} />
    ) : n.includes("coral") ? (
      <Coral x={0} y={20} scale={0.55} />
    ) : n.includes("plankton") ? (
      <>
        <Ellipse rx={17} ry={12} fill={n.startsWith("phyto") ? "#A9C482" : "#D2B5C9"} stroke={ink} strokeWidth={1.5} />
        <Circle cx={-4} cy={-2} r={5} fill="#F2E8B7" />
        <Path d="M-16-6l-10-8m10 16-10 8m41-13 12-10m-12 16 12 8" stroke={ink} strokeWidth={1.4} fill="none" />
      </>
    ) : n.includes("dead") ? (
      <>
        <Path d="M-19 9Q-28-24 19-15Q30 14-19 9Z" fill="#B79B75" stroke={ink} strokeWidth={1.5} />
        <Path d="M-19 15L11-9M-5 0v-11m3 12h13" stroke="#786D54" strokeWidth={1.5} fill="none" />
      </>
    ) : n.includes("decompos") ? (
      <>
        <Rect
          x={-23}
          y={-11}
          width={25}
          height={12}
          rx={6}
          rotation={-25}
          fill="#AE9FBB"
          stroke={ink}
          strokeWidth={1.5}
        />
        <Rect x={3} y={4} width={24} height={12} rx={6} rotation={20} fill="#8BB9B0" stroke={ink} strokeWidth={1.5} />
        <Circle cx={16} cy={-11} r={5} fill="#C7BE8D" />
      </>
    ) : n.includes("nutrient") ? (
      <>
        {[
          [-15, 1],
          [0, -12],
          [14, 8],
          [0, 15],
        ].map(([cx, cy], i) => (
          <Circle key={i} cx={cx} cy={cy} r={6} fill={i % 2 ? "#ABC887" : "#E4C777"} stroke={ink} strokeWidth={1.5} />
        ))}
      </>
    ) : (
      <Creature name={name} scale={0.66} />
    );
  return <G transform={`translate(${x} ${y}) scale(${scale})`}>{art}</G>;
}
