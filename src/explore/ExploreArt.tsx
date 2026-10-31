import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from "react-native-svg";
import { ExploreTopic, WORLDS, WorldId } from "./content";
import { PLACES, dayNightDot } from "./activities";
const ink = "#254E4B",
  blue = "#91C5D0",
  green = "#80A97D",
  sand = "#F0D397",
  coral = "#D4896C";
export function Motif({ name }: { name: string }) {
  const stroke = { stroke: ink, strokeWidth: 3, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (["sun", "stars", "sky", "seasons"].includes(name))
    return (
      <G>
        <Circle cx={60} cy={55} r={24} fill={sand} {...stroke} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <Line key={a} x1={60} y1={18} x2={60} y2={10} rotation={a} origin="60,55" {...stroke} />
        ))}
        {name === "stars" && <Path d="m100 18 4 10 11 2-9 7 2 11-8-6-9 6 2-11-8-7 11-2Z" fill={coral} />}
      </G>
    );
  if (name === "moon")
    return (
      <G>
        <Circle cx={59} cy={57} r={40} fill="#E5D8B1" {...stroke} />
        <Circle cx={44} cy={41} r={9} fill="#C1B994" />
        <Circle cx={76} cy={70} r={13} fill="#C1B994" />
        <Circle cx={40} cy={78} r={6} fill="#C1B994" />
        <Path d="M60 17a40 40 0 0 1 0 80Z" fill="#6E769B" />
      </G>
    );
  if (["earth", "globe", "planets", "mars", "saturn", "gravity"].includes(name))
    return (
      <G>
        {name === "gravity" && <Path d="M60 3v20m-8-8 8 8 8-8" fill="none" {...stroke} />}
        <Circle cx={60} cy={61} r={34} fill={name === "mars" ? coral : name === "saturn" ? sand : blue} {...stroke} />
        {name === "mars" ? (
          <G fill="#AE624F">
            <Ellipse cx={45} cy={47} rx={13} ry={6} />
            <Circle cx={74} cy={76} r={8} />
          </G>
        ) : name === "saturn" ? (
          <Ellipse
            cx={60}
            cy={61}
            rx={55}
            ry={14}
            rotation={-20}
            origin="60,61"
            fill="none"
            stroke={ink}
            strokeWidth={6}
          />
        ) : (
          <Path d="m36 37 17 4 9 14-14 13-5 20m36-53-6 19 12 11-6 16" fill={green} {...stroke} />
        )}
        {name === "planets" && (
          <>
            <Circle cx={14} cy={21} r={9} fill={coral} {...stroke} />
            <Circle cx={105} cy={21} r={12} fill={sand} {...stroke} />
          </>
        )}
      </G>
    );
  if (name === "rocket")
    return (
      <G rotation={16} origin="60,60">
        <Path d="M45 80V48q0-27 15-39 15 12 15 39v32Z" fill="#FFF9E6" {...stroke} />
        <Path d="m45 59-18 30 18-9m30-21 18 30-18-9" fill={coral} {...stroke} />
        <Circle cx={60} cy={49} r={10} fill={blue} {...stroke} />
        <Path d="M51 86q9 40 18 0" fill={sand} />
      </G>
    );
  if (name === "asteroid")
    return (
      <G>
        <Path d="m32 17 42-4 24 31-6 39-36 18-38-32Z" fill="#AFAB9D" {...stroke} />
        <Circle cx={46} cy={46} r={11} fill="#888B81" />
        <Circle cx={75} cy={71} r={8} fill="#888B81" />
        <Path d="m12 12 10 8M99 4l-6 11M110 91l-9-5" {...stroke} />
      </G>
    );
  if (["turtle", "habitat"].includes(name))
    return (
      <G>
        <Ellipse cx={59} cy={62} rx={31} ry={26} fill={green} {...stroke} />
        <Ellipse cx={99} cy={54} rx={13} ry={10} fill="#A8C69A" {...stroke} />
        <Path d="m39 39-12-15m12 63-12 15m46-63 12-15m-12 63 12 15M59 37v50M30 59h57" fill="none" {...stroke} />
        <Circle cx={102} cy={51} r={2} fill={ink} />
      </G>
    );
  if (name === "dolphin")
    return (
      <G>
        {/* Arched mammal body, beak, dorsal fin, pectoral flipper and broad tail flukes. */}
        <Path
          d="M9 65q15-23 45-27l5-19q14 4 17 22 14 6 24 17l10-8 9-1-5 13 5 14-11-3-10-6q-25 18-57 7L17 77l-10-5 17-4Z"
          fill="#82AEB7"
          {...stroke}
        />
        <Path d="M31 67q27 12 53-1" stroke="#D9E7E5" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d="M55 65q7 15 22 18l-9-20" fill="#5F8C9D" {...stroke} />
        <Circle cx={25} cy={58} r={2.8} fill={ink} />
        <Path d="M41 43l6-1" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      </G>
    );
  if (name === "tadpole")
    return (
      <G>
        {/* A swimming larva: rounded body and a long finned tail, with no adult legs. */}
        <Path d="M57 57q30-37 55-19-22 9-19 26 1 20-31 20Z" fill="#9DBCA6" {...stroke} />
        <Path d="M58 66q23-14 37-19" fill="none" stroke="#D7E4C3" strokeWidth={4} />
        <Ellipse cx={40} cy={75} rx={27} ry={22} fill={green} {...stroke} />
        <Circle cx={29} cy={68} r={3} fill={ink} />
        <Path d="M24 84q7 5 14 1" fill="none" {...stroke} />
      </G>
    );
  if (name === "caterpillar")
    return (
      <G>
        {/* Leaf-eating larva: segmented body and short legs; no adult wings. */}
        <Path d="M10 99q43-42 101-10-39 28-101 10Z" fill="#B8CDA0" {...stroke} />
        <Path d="M15 98l87-6" stroke="#80A97D" strokeWidth={2} />
        {[30, 46, 62, 78].map((x, i) => (
          <G key={x}>
            <Path d={`M${x} 78v10m7-10 2 9`} {...stroke} />
            <Circle cx={x} cy={68 - (i % 2) * 3} r={13} fill={i % 2 ? "#A9C38B" : green} {...stroke} />
          </G>
        ))}
        <Circle cx={93} cy={59} r={16} fill="#A9C38B" {...stroke} />
        <Path d="M87 44l-5-10m16 9 5-10" fill="none" {...stroke} />
        <Circle cx={99} cy={55} r={3} fill={ink} />
        <Path d="M98 65q5 3 9-1" fill="none" {...stroke} />
      </G>
    );
  if (["fish", "foodchain"].includes(name))
    return (
      <G>
        <Path d="M12 59q38-46 76 0-38 46-76 0Zm76 0 27-23v46Z" fill={blue} {...stroke} />
        <Path d="m45 33 16-19 9 25m-25 45 15 18 9-23" fill={blue} {...stroke} />
        <Circle cx={29} cy={54} r={4} fill={ink} />
        {name === "foodchain" && (
          <>
            <Circle cx={23} cy={8} r={6} fill={green} />
            <Path d="m39 7 20 0-6-5m6 5-6 5" {...stroke} fill="none" />
          </>
        )}
      </G>
    );
  if (["coral", "reef", "seagrass"].includes(name))
    return (
      <G>
        <Path d="M15 105q45-18 90 0" fill={sand} />
        {[25, 60, 90].map((x, i) => (
          <Path
            key={x}
            d={
              name === "seagrass"
                ? `M${x} 98q-30-30 0-75q-8 45 7 75`
                : `M${x} 98V${30 + i * 8}m0 40-15-13v-17m15 20 14-12v-20`
            }
            fill={name === "seagrass" ? green : "none"}
            stroke={name === "seagrass" ? ink : coral}
            strokeWidth={name === "seagrass" ? 2 : 9}
            strokeLinecap="round"
          />
        ))}
      </G>
    );
  if (name === "octopus")
    return (
      <G>
        <Path d="M35 59V38q25-44 50 0v21" fill="#B29EC3" {...stroke} />
        <Path
          d="M35 56q-35 46-25 4m30 3q-10 56-19 19m27-18q-4 55-4 28m15-28v39m10-39q4 55 4 28m7-28q10 56 19 19m-14-25q35 46 25 4"
          fill="none"
          stroke="#8F78A6"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <Circle cx={47} cy={39} r={3} fill={ink} />
        <Circle cx={72} cy={39} r={3} fill={ink} />
      </G>
    );
  if (name === "plankton")
    return (
      <G>
        {[
          [35, 40],
          [79, 63],
          [31, 90],
        ].map(([x, y], i) => (
          <G key={i}>
            <Ellipse cx={x} cy={y} rx={14} ry={10} fill={i % 2 ? blue : green} {...stroke} />
            <Path d={`M${x - 14} ${y}l-10-7m38 7 10-7m-24-3v-10m0 30v10`} {...stroke} />
            <Circle cx={x} cy={y} r={3} fill={ink} />
          </G>
        ))}
      </G>
    );
  if (name === "submarine")
    return (
      <G>
        <Rect x={13} y={40} width={94} height={48} rx={22} fill={sand} {...stroke} />
        <Path d="M55 40V22h20m24 39 17-13v31l-17-8" fill="none" {...stroke} />
        {[37, 68].map((x) => (
          <Circle key={x} cx={x} cy={64} r={11} fill={blue} {...stroke} />
        ))}
      </G>
    );
  if (["butterfly", "camouflage", "migration", "wings", "bee"].includes(name))
    return (
      <G>
        {name === "bee" ? (
          <>
            <Ellipse cx={60} cy={66} rx={25} ry={30} fill={sand} {...stroke} />
            <Ellipse cx={34} cy={39} rx={17} ry={24} rotation={-30} origin="34,39" fill="#F5FCFA" {...stroke} />
            <Ellipse cx={86} cy={39} rx={17} ry={24} rotation={30} origin="86,39" fill="#F5FCFA" {...stroke} />
            <Path d="M37 55h46M36 72h48M44 89h32" stroke={ink} strokeWidth={7} />
          </>
        ) : (
          <>
            <Path
              d="M57 54C-11-13-5 73 47 66-5 89 53 128 58 70m4-16c68-67 62 19 10 12 52 23-6 62-11 4"
              fill={name === "camouflage" ? green : "#D6A3AD"}
              {...stroke}
            />
            {[30, 90].map((x) => (
              <Circle key={x} cx={x} cy={43} r={8} fill={sand} {...stroke} />
            ))}
          </>
        )}
        <Path d="M60 37v44m-2-42-10-15m14 15 10-15" {...stroke} />
        {name === "migration" && <Path d="M5 110h110m-9-7 9 7-9 7" {...stroke} fill="none" />}
      </G>
    );
  if (name === "bat")
    return (
      <G>
        <Path
          d="M60 49Q33 7 3 38l9 38q16-26 26 7 12-21 22 12 10-33 22-12 10-33 26-7l9-38Q87 7 60 49Z"
          fill="#7F83A0"
          {...stroke}
        />
        <Path d="m48 43 1-19 13 12 12-12 0 24" fill="#7F83A0" {...stroke} />
        <Circle cx={55} cy={47} r={2} fill={ink} />
        <Circle cx={68} cy={47} r={2} fill={ink} />
      </G>
    );
  if (name === "frog")
    return (
      <G>
        <Ellipse cx={60} cy={70} rx={36} ry={28} fill={green} {...stroke} />
        {[39, 80].map((x) => (
          <G key={x}>
            <Circle cx={x} cy={41} r={14} fill={green} {...stroke} />
            <Circle cx={x} cy={40} r={5} fill={ink} />
          </G>
        ))}
        <Path d="M46 71q14 14 28 0M30 81 10 97h26m54-16 20 16H84" fill="none" {...stroke} />
      </G>
    );
  if (name === "feather")
    return (
      <G>
        <Path d="M22 100C-1 35 49 12 103 9c2 57-17 107-81 91Z" fill={blue} {...stroke} />
        <Path d="m16 111 73-84m-49 59-4-33m20 15 36-1m-18-23-1-20" fill="none" {...stroke} />
      </G>
    );
  if (["cloud", "rain", "rainbow", "wind", "lightning", "storm", "forecast", "cycle"].includes(name))
    return (
      <G>
        {name === "rainbow" &&
          ["#CE8065", sand, green, blue].map((color, i) => (
            <Path
              key={color}
              d={`M${10 + i * 8} 100a${50 - i * 8} ${50 - i * 8} 0 0 1 ${100 - i * 16} 0`}
              fill="none"
              stroke={color}
              strokeWidth={8}
            />
          ))}
        <Path d="M26 63C-3 62 2 31 28 33c0-31 48-37 57-6 35-8 44 39 14 39Z" fill="#FDFDF7" {...stroke} />
        {["rain", "cycle", "storm"].includes(name) &&
          [29, 58, 87].map((x) => <Path key={x} d={`m${x} 80-7 15`} {...stroke} />)}
        {["lightning", "storm"].includes(name) && <Path d="m64 65-17 27h14l-8 22 28-35H66l10-14Z" fill={sand} />}{" "}
        {name === "wind" && <Path d="M12 83h77q28-14 8-20M23 101h52q21 9 8 17" fill="none" {...stroke} />}{" "}
        {name === "forecast" && <Rect x={40} y={80} width={40} height={27} rx={5} fill={sand} {...stroke} />}
      </G>
    );
  if (["salt", "tides", "waves", "trench", "river"].includes(name))
    return (
      <G>
        {name === "trench" && <Path d="M0 70h30l25 43 23-43h42" fill={sand} {...stroke} />}{" "}
        {[28, 54, 80].map((y, i) => (
          <Path
            key={y}
            d={`M5 ${y}q14 -${12 + i * 2} 28 0t28 0 28 0 28 0`}
            fill="none"
            stroke={blue}
            strokeWidth={7}
            strokeLinecap="round"
          />
        ))}
        {name === "salt" && (
          <G fill="#FFF" stroke={ink}>
            {[25, 50, 75, 98].map((x, i) => (
              <Rect key={x} x={x} y={85 + (i % 2) * 10} width={8} height={8} />
            ))}
          </G>
        )}
      </G>
    );
  if (["guam", "island", "map"].includes(name))
    return (
      <G>
        <Ellipse cx={60} cy={88} rx={56} ry={19} fill={blue} />
        <Path d="M19 81 45 64 58 25 79 38 93 77 65 94Z" fill={green} {...stroke} />
        <Path d="m61 76 0-27m-1 0q-29-25-29-2 18-6 29 5 12-27 30-11-14-1-30 11" fill={green} {...stroke} />
        {name === "map" && <Path d="M4 4h18m-9-8v16m87 92h18m-9-8v16" {...stroke} />}
      </G>
    );
  if (name === "compass")
    return (
      <G>
        <Circle cx={60} cy={60} r={44} fill="#FFF9E9" {...stroke} />
        <Path d="m60 20 13 40-13 40-13-40Z" fill={coral} {...stroke} />
        <Path d="M60 20v80" {...stroke} />
        <Path d="M60 3v8m0 98v8M3 60h8m98 0h8" {...stroke} />
      </G>
    );
  return (
    <G>
      <Path d="M9 105 45 29l16 28 16-49 37 97Z" fill={name === "volcano" ? coral : green} {...stroke} />
      <Path d="m64 35 13-27 13 27-13-8Z" fill={sand} />
      {name === "volcano" && <Path d="M77 2q-20-17 0-28" {...stroke} fill="none" />}
    </G>
  );
}
export function TopicArt({ topic, compact = false }: { topic: ExploreTopic; compact?: boolean }) {
  const world = WORLDS.find((w) => w.id === topic.world)!;
  return (
    <Svg
      width="100%"
      height={compact ? 112 : 196}
      viewBox="0 0 320 196"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect width={320} height={196} rx={22} fill={world.tint} />
      <Circle cx={257} cy={42} r={20} fill="#FFFFFF" opacity={0.55} />
      <Path d="M12 154q65-25 120 0t176 0" stroke={world.color} strokeWidth={2} opacity={0.2} fill="none" />
      <G transform="translate(100,30) scale(1.12)">
        <Motif name={topic.illustration} />
      </G>
    </Svg>
  );
}
export function WorldGlyph({ world, size = 80 }: { world: WorldId; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden>
      <Motif
        name={{ space: "saturn", oceans: "turtle", animals: "butterfly", weather: "rainbow", world: "guam" }[world]}
      />
    </Svg>
  );
}
export function EarthLabArt({ turn }: { turn: number }) {
  const position = dayNightDot(turn);
  const x = 219 + position.x * 48,
    y = 95 + position.y * 48;
  return (
    <Svg width="100%" height={190} viewBox="0 0 340 190" accessibilityElementsHidden>
      <Rect width={340} height={190} rx={20} fill="#EEEAF6" />
      <Circle cx={49} cy={95} r={29} fill={sand} />
      {[72, 95, 118].map((y) => (
        <Path key={y} d={`M93 ${y}h56m-7-4 7 4-7 4`} stroke="#D4AC59" strokeWidth={3} fill="none" />
      ))}
      <Circle cx={219} cy={95} r={57} fill={blue} />
      <G rotation={-turn * 45} origin="219,95">
        <Path d="m183 60 21 8-6 25-24 16m51-45 25 24-8 28" fill={green} />
      </G>
      <Path d="M219 38a57 57 0 0 1 0 114Z" fill="#25304E" opacity={0.72} />
      <Circle cx={x} cy={y} r={8} fill={coral} stroke="#FFF" strokeWidth={3} />
    </Svg>
  );
}
export function GlobeMap({ selected, showPins = true }: { selected?: string; showPins?: boolean }) {
  return (
    <Svg width="100%" height={220} viewBox="0 0 400 220" accessibilityElementsHidden>
      <Rect width={400} height={220} rx={18} fill="#DBEDF0" />
      {[55, 110, 165].map((y) => (
        <Line key={y} x1={8} y1={y} x2={392} y2={y} stroke="#ADCBD0" strokeDasharray="4 6" />
      ))}
      <Path
        d="m20 45 22-21 38 4 35 25-22 24-19 4-8 28-19-20-9-25ZM92 109l37 18 12 30-17 38-16-25-7-33ZM174 36l30-10 26 13 28-13 39 8 22 24-12 20-15 15-20-5-18-27-24 9-31-13-24-6ZM175 85l43-8 26 36-21 44-25-9-16-37ZM333 53l6 8-2 15-5-8ZM314 91l5 10-3 10-4-10ZM287 148l26-10 36 11 7 22-35 13-30-13ZM18 200l66-9 47 6 48-7 41 6 61-6 65 8 36-1v20H18Z"
        fill="#9BBF92"
        stroke="#537F68"
        strokeWidth={1.5}
      />
      <Path d="M367 23v27m-7-18 7-9 7 9" fill="none" stroke={ink} strokeWidth={2} />
      {showPins &&
        PLACES.map((p, i) => (
          <G key={p.id}>
            <Circle
              cx={p.x}
              cy={p.y}
              r={selected === p.id ? 12 : 7}
              fill={selected === p.id ? coral : "#285F58"}
              stroke="#FFF"
              strokeWidth={2}
            />
            <Line x1={p.x} y1={p.y} x2={p.x + 17} y2={p.y - 10} stroke={ink} />
            <Circle cx={p.x + 22} cy={p.y - 13} r={8} fill="#FFF9E6" />
            {/* The accessible numbered destination list below provides readable labels at every text size. */}
            <Path
              d={
                i === 0
                  ? `M${p.x + 22} ${p.y - 17}v8`
                  : i === 1
                    ? `M${p.x + 19} ${p.y - 16}q6-5 6 0l-6 7h7`
                    : i === 2
                      ? `M${p.x + 19} ${p.y - 17}q8-2 4 4 7 7-4 5`
                      : i === 3
                        ? `m${p.x + 23} ${p.y - 18}-5 7h8m-3-7v12`
                        : `M${p.x + 25} ${p.y - 17}h-6v5q10-4 6 5h-6`
              }
              stroke={ink}
              strokeWidth={1.4}
              fill="none"
            />
          </G>
        ))}
    </Svg>
  );
}
