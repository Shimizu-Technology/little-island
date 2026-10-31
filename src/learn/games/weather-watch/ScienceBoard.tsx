import React, { useState } from "react";
import { TextInput, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Rect, Text as SText } from "react-native-svg";
import { Button, Copy, PressableScale, font } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { SkySun, PuffyCloud, EarthGlobe, MoonDisc, Creature, Seaweed, ReefHabitat, WeatherExplorer, NodePicture } from "./Illustrations";
import { CoachSpot } from "../../Coach";
import {
  wrongFeedback, scienceSpeechKey, goalTranscript, scalePractice,
  planets,
  gravity,
  lightMinutes,
  visibleMoonPercent,
  reefModel,
  correct,
  currentTask,
  move,
  tasks,
  type Game,
  type ScienceState,
  type Task,
} from "./model";
const ink = "#254B4B",
  green = "#4F793B",
  blue = "#4D85A1",
  gold = "#E9B84D";
const multi = (q: Task) => ["cycle", "chain", "web", "planets", "kit"].includes(q.kind);
const Sun = SkySun;
function Fish({x,y,color=gold}:{x:number;y:number;color?:string}) { return <Creature name={color===blue?"reef shark":"small fish"} x={x} y={y} scale={.62}/>; }
function Algae({x,y}:{x:number;y:number}) { return <Seaweed x={x} y={y} scale={.75}/>; }
function label(text: string, x: number, y: number, size = 13, color = ink) {
  return (
    <SText x={x} y={y} textAnchor="middle" fontFamily={font ?? "Arial"} fontSize={size} fontWeight="700" fill={color}>
      {text}
    </SText>
  );
}
export function TokenArt({ text, size = 44 }: { text: string; size?: number }) {
  const s = text.toLowerCase();
  const phase = [
    "New Moon",
    "Waxing crescent",
    "First quarter",
    "Waxing gibbous",
    "Full Moon",
    "Waning gibbous",
    "Third quarter",
    "Waning crescent",
  ].indexOf(text);
  if (phase >= 0) {
    const cosine = Math.cos((phase * Math.PI) / 4),
      waxing = phase <= 4;
    const outer = waxing ? 1 : 0,
      inner = waxing ? (cosine < 0 ? 1 : 0) : cosine < 0 ? 0 : 1;
    return (
      <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityElementsHidden>
        <Circle cx={40} cy={40} r={26} fill="#2D3E52" />
        <Path d={`M40 14A26 26 0 0 ${outer} 40 66A${Math.abs(cosine) * 26} 26 0 0 ${inner} 40 14Z`} fill="#F9F4D7" />
      </Svg>
    );
  }

  if (s.includes("indoor") || s.includes("shelter"))
    return (
      <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityElementsHidden>
        <Path d="M9 34L40 8L71 34" stroke={ink} strokeWidth={5} fill={gold} />
        <Rect x={16} y={34} width={48} height={38} rx={3} fill="#ABD0BE" />
        <Rect x={34} y={48} width={16} height={24} fill={ink} />
        <Rect x={21} y={41} width={10} height={10} fill="#FFFCF1" />
      </Svg>
    );
  if (s.includes("tree"))
    return (
      <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityElementsHidden>
        <Path d="M40 72V32" stroke="#90674A" strokeWidth={10} />
        <Circle cx={40} cy={29} r={25} fill="#78A762" />
      </Svg>
    );
  if (s.includes("ocean"))
    return (
      <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityElementsHidden>
        {[28, 43, 58].map((y) => (
          <Path key={y} d={`M5 ${y}q12 -12 24 0t24 0t24 0`} stroke={blue} strokeWidth={5} fill="none" />
        ))}
      </Svg>
    );

  // Equipment must show the thing to place, rather than the weather word in its name.
  if (s.includes("coat") || s.includes("hat"))
    return (
      <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityElementsHidden>
        {s.includes("coat") ? (
          <Path
            d="M25 12h30l20 25 -13 12 -8 -9v31H26V40l-8 9L5 37Z"
            fill={s.includes("warm") ? "#C27D58" : gold}
            stroke={ink}
            strokeWidth={2}
          />
        ) : (
          <G>
            <Path d="M20 48l6 -27h28l6 27Z" fill={gold} />
            <Ellipse cx={40} cy={49} rx={34} ry={9} fill={gold} />
          </G>
        )}
      </Svg>
    );
  const p = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"].indexOf(text);
  if (p >= 0)
    return (
      <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityElementsHidden>
        <Circle
          cx={40}
          cy={40}
          r={[12, 18, 19, 15, 30, 26, 22, 22][p]}
          fill={["#AA9D8A", "#D5A266", "#649CA9", "#C27D58", "#C9A57A", "#DCC994", "#8CCAC9", "#6E8FBF"][p]}
          stroke={ink}
          strokeWidth={1.5}
        />
        {p === 5 && (
          <Ellipse
            cx={40}
            cy={40}
            rx={37}
            ry={10}
            rotation={-20}
            origin="40,40"
            stroke="#A8976D"
            strokeWidth={5}
            fill="none"
          />
        )}
        {p === 2 && <Path d="M28 25l16 -3 5 14 -15 14 -12 -8Z" fill="#94BA75" />}
        {p === 4 && <Path d="M15 32h50m-51 15h52" stroke="#AF8766" strokeWidth={5} />}
      </Svg>
    );

  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityElementsHidden>
      {s.includes("sun") || s === "day" ? (
        <Sun x={40} y={40} r={20} />
      ) : s.includes("algae") || s.includes("spring") || s.includes("summer") || s.includes("nutrient") ? (
        <Algae x={42} y={68} />
      ) : s.includes("fish") || s.includes("shark") || s.includes("turtle") || s.includes("octopus") || s.includes("urchin") || s.includes("crab") ? (
        <Creature name={text} x={40} y={40} scale={.72} />
      ) : s.includes("rain") || s.includes("water") || s.includes("vapor") ? (
        <G>
          <Ellipse cx={40} cy={25} rx={29} ry={15} fill={blue} />
          {[22, 40, 58].map((x) => (
            <Path key={x} d={`M${x} 48l-6 14`} stroke={blue} strokeWidth={5} />
          ))}
        </G>
      ) : s.includes("hat") ? (
        <G>
          <Path d="M20 48l6 -27h28l6 27Z" fill={gold} />
          <Ellipse cx={40} cy={49} rx={34} ry={9} fill={gold} />
        </G>
      ) : s.includes("coat") ? (
        <Path
          d="M25 12h30l20 25 -13 12 -8 -9v31H26V40l-8 9L5 37Z"
          fill={s.includes("warm") ? "#C27D58" : gold}
          stroke={ink}
          strokeWidth={2}
        />
      ) : s.includes("moon") || s.includes("night") ? (
        <G>
          <Circle cx={40} cy={40} r={27} fill="#C8D5DA" />
          <Circle cx={32} cy={30} r={6} fill="#9AAFB9" />
          <Circle cx={50} cy={49} r={9} fill="#9AAFB9" />
        </G>
      ) : s.includes("winter") ? (
        <G stroke={blue} strokeWidth={4}>
          {[0, 60, 120].map((a) => (
            <Line key={a} x1={15} y1={40} x2={65} y2={40} rotation={a} origin="40,40" />
          ))}
        </G>
      ) : s.includes("autumn") ? (
        <Path
          d="M40 70V20M40 50Q5 45 14 15Q46 10 40 50Q75 45 66 15Q34 10 40 50"
          fill="#C27D58"
          stroke="#98633F"
          strokeWidth={4}
        />
      ) : (
        <G>
          <Rect x={17} y={16} width={46} height={50} rx={12} fill="#ABD0BE" stroke={ink} strokeWidth={2} />
          <Path d="M27 42l9 10 19 -24" stroke={green} strokeWidth={5} fill="none" />
        </G>
      )}
    </Svg>
  );
}
function Scene({ game, q, values, records }: { game: Game; q: Task; values: number[]; records: number[][] }) {
  const a = values[0] ?? 0,
    b = values[1] ?? 0;
  const selected = values.map((v) => q.labels[v]).filter(Boolean);
  let description = "";
  let scene: React.ReactNode;
  if (q.kind === "rotation") {
    const day = a === 0;
    description = day ? "The island faces sunlight. Daytime." : "The island faces away from sunlight. Nighttime.";
    scene = (
      <>
        {!day && [75, 113, 300, 325].map((x, i) => <Circle key={x} cx={x} cy={25 + (i % 2) * 25} r={2} fill={ink} />)}
        <Sun />
        <Line x1={85} y1={70} x2={198} y2={70} stroke={gold} strokeWidth={4} />
        <EarthGlobe x={240} y={95} r={59} night />
        <Circle cx={day ? 192 : 288} cy={95} r={7} fill="#F3B181" stroke={ink} strokeWidth={2} />
        {label(day ? "Island: day" : "Island: night", 240, 183)}
        {label("Sunlight →", 113, 124)}
      </>
    );
  } else if (q.kind === "moon") {
    const angle = (a * Math.PI) / 4,
      r = 38;
    description = `${q.labels[a]}. Sunlit fraction visible: ${visibleMoonPercent(a)}%.`;
    scene = (
      <>
        <Sun x={35} y={90} r={17} />
        <Ellipse cx={173} cy={90} rx={76} ry={59} stroke={blue} fill="none" strokeDasharray="1 6" strokeLinecap="round" />
        <EarthGlobe x={173} y={90} r={21} />
        <Circle cx={173 - Math.cos(angle) * 76} cy={90 + Math.sin(angle) * 59} r={9} fill="#DAE4D9" />
        {label("Orbit view", 173, 182)}
        <MoonDisc x={295} y={90} r={r} phase={a} />
        {label("View from Earth", 289, 155, 11)}
      </>
    );
  } else if (q.kind === "planets") {
    description = selected.length ? selected.join(" → ") : "Empty orbit slots. Tap planets to place them.";
    const radii = [1.2, 3, 3.2, 1.7, 35, 29, 13, 12];
    const bodies = values.map((value) => planets.indexOf(q.labels[value]));
    const centers = bodies.map(
      (p, i) => 53 + radii[p] + bodies.slice(0, i).reduce((sum, earlier) => sum + radii[earlier] * 2 + 8, 0)
    );
    scene = (
      <>
        <Sun x={22} y={75} r={14} />
        {bodies.map((p, i) => (
          <G key={i}>
            <Circle
              cx={centers[i]}
              cy={95}
              r={radii[p]}
              fill={["#AA9D8A", "#D5A266", "#649CA9", "#C27D58", "#C9A57A", "#DCC994", "#8CCAC9", "#6E8FBF"][p]}
            />
            {label(planets[p].slice(0, 3), centers[i], i % 2 ? 168 : 151, 10)}
          </G>
        ))}
        {label("Planet sizes • Sun and spacing not to scale", 180, 184, 12)}
      </>
    );
  } else if (q.kind === "gravity") {
    const g = gravity[b];
    description = `Mass ${a} kg. Weight ${(a * g).toFixed(1)} N on ${q.labels[b]}.`;
    scene = (
      <>
        <Path d="M20 167Q180 70 340 167v33H20Z" fill={["#81B8A2", "#B6BDBB", "#CC8C6B", "#CBAD87"][b]} />
        <Rect x={145} y={65} width={70} height={52} rx={9} fill={gold} />
        {label(`${a} kg`, 180, 97, 18)}
        <Line x1={180} y1={118} x2={180} y2={Math.min(177, 125 + (a * g) / 20)} stroke={ink} strokeWidth={5} />
        {label(`${(a * g).toFixed(1)} N ↓`, 70, 58, 19)}
        {label(q.labels[b], 280, 58, 17)}
      </>
    );
  } else if (q.kind === "orbit") {
    description = [
      "Too little sideways speed: falls inward.",
      "Model orbit: gravity curves the path.",
      "Very fast: escapes this model.",
    ][a];
    scene = (
      <>
        <EarthGlobe x={180} y={100} r={32} />
        <Path
          d={a === 0 ? "M180 32L180 63" : a === 1 ? "M180 26A85 74 0 1 1 179 26" : "M180 26Q230 10 345 18"}
          fill="none"
          stroke={gold}
          strokeWidth={4}
          strokeDasharray="1 7" strokeLinecap="round"
        />
        <Circle cx={180} cy={26} r={8} fill={gold} />
        {label("Gravity pulls inward", 180, 192)}
      </>
    );
  } else if (q.kind === "tilt") {
    description = `Tilt ${a}°. North ${b === 0 ? "toward" : "away from"} Sun: ${a === 0 ? "no axial seasons in this model" : b === 0 ? "northern summer / southern winter" : "northern winter / southern summer"}.`;
    scene = (
      <>
        <Sun x={45} y={100} />
        <Path d="M90 73h90m-90 27h90m-90 27h90" stroke={gold} strokeWidth={3} />
        <EarthGlobe x={250} y={100} r={53} />
        <G rotation={b === 0 ? -a : a} origin="250,100">
          <Line x1={250} y1={25} x2={250} y2={176} stroke={ink} strokeWidth={4} />
          {label("N", 250, 19, 15)}
          <Ellipse cx={250} cy={100} rx={53} ry={9} fill="none" stroke="#ECEDD2" strokeWidth={2} />
        </G>
        {label("Axis keeps its direction through the year", 180, 199, 11)}
      </>
    );
  } else if (q.kind === "eclipse") {
    description =
      b === 1
        ? "Orbit tilted: shadow misses."
        : a === 0
          ? "Solar eclipse alignment: Moon shadow reaches Earth."
          : a === 1
            ? "Lunar eclipse alignment: Earth shadow reaches Moon."
            : "Bodies not aligned: no eclipse.";
    scene = (
      <>
        <Sun x={35} y={90} />
        <Path
          d={a === 0 ? "M115 78L300 53L300 127Z" : "M180 62L330 30L330 150Z"}
          fill={b ? "#DCE5D9" : "#A4B4AD"}
          opacity={0.6}
        />
        <EarthGlobe x={a === 0 ? 275 : 180} y={90} r={29} />
        <MoonDisc x={a === 0 ? 115 : 285} y={b ? 40 : a === 2 ? 158 : 90} r={12} />
        {label("Alignment diagram • not to scale", 180, 194, 12)}
      </>
    );
  } else if (q.kind === "distance") {
    description = `At ${a} AU, sunlight takes about ${lightMinutes(a).toFixed(1)} minutes. Your clock: ${b} min.`;
    scene = (
      <>
        <Sun x={30} y={90} />
        <Line x1={60} y1={90} x2={80 + a * 44} y2={90} stroke={gold} strokeWidth={5} strokeDasharray="8 5" />
        <EarthGlobe x={80 + a * 44} y={90} r={17} />
        {label(`${a} AU`, 180, 151, 20)}
        {label("Distance line • not to scale", 180, 185, 12)}
      </>
    );
  } else if (q.kind === "gauge") {
    description = scalePractice(records.length) ? `Read the thermometer and rain gauge scales. Your chart ${a} °C, ${b} mm.` : `Thermometer ${q.target[0]} °C, rain gauge ${q.target[1]} mm. Your chart ${a} °C, ${b} mm.`;
    scene = (
      <>
        <Rect x={35} y={21} width={24} height={143} rx={10} fill="#F8F5E6" stroke={ink} />
        <Rect x={41} y={164 - q.target[0] * 3} width={12} height={q.target[0] * 3} fill="#D47A63" />
        <Circle cx={47} cy={166} r={15} fill="#D47A63" />
        {label(scalePractice(records.length) ? "°C" : `${q.target[0]} °C`, 47, 202, 15)}
        <Rect x={100} y={44} width={38} height={120} fill="#F1F9F6" stroke={ink} />
        <Rect x={102} y={164 - q.target[1] * 3} width={34} height={q.target[1] * 3} fill="#6BA9C4" />
        {label(scalePractice(records.length) ? "mm" : `${q.target[1]} mm`, 119, 202, 15)}
        {Array.from({length:41}, (_, n) => n).map((n) => (
          <G key={n}>
            <Line x1={59} y1={164 - n * 3} x2={65} y2={164 - n * 3} stroke={ink} />
            {n % 10 === 0 && label(String(n), 76, 168 - n * 3, 10)}
            <Line x1={138} y1={164 - n * 3} x2={n % 5 === 0 ? 145 : 141} y2={164 - n * 3} stroke={ink} />
            {n % 10 === 0 && label(String(n), 153, 168 - n * 3, 10)}
          </G>
        ))}
        {[...records, [a, b]].map((r, i) => (
          <G key={i}>
            <Rect x={167 + i * 24} y={165 - r[1] * 3} width={14} height={r[1] * 3} fill={blue} />
            {label(["M", "T", "W", "T", "F", "S", "S"][i], 174 + i * 24, 183, 10)}
          </G>
        ))}
        {label("Week rain chart", 250, 30, 14)}
      </>
    );
  } else if (q.kind === "population" || q.kind === "pollution") {
    const { algae, health } = reefModel(q.kind, a);
    description = `Model: ${q.kind === "population" ? "grazers" : "pollution"} ${a}. Algae ${algae}. Coral health index ${health}. Baseline algae 60.`;
    scene = (
      <>
        <ReefHabitat health={health}/>
        <Creature name="turtle" x={289} y={103} scale={.42}/>
        <Creature name="octopus" x={83} y={163} scale={.38}/>
        {Array.from({ length: Math.ceil(algae / 10) }, (_, i) => (
          <Algae key={i} x={20 + i * 32} y={184} />
        ))}
        {Array.from({ length: q.kind === "population" ? a : 5 }, (_, i) => (
          <Creature key={i} name="parrotfish" x={30 + (i % 5) * 65} y={45 + Math.floor(i / 5) * 35} scale={.44}/>
        ))}
        <Rect x={20} y={193} width={320} height={9} rx={4} fill="#C0CEC0" />
        <Rect x={20} y={193} width={health * 3.2} height={9} rx={4} fill={green} />
        {label("Coral health index", 180, 227, 12)}
      </>
    );
  } else if (q.kind === "energy") {
    description = `Producer energy ${q.target[0] * 10}; primary consumers ${a}; secondary consumers ${b}.`;
    scene = (
      <>
        <Path d="M180 16L225 78h-90Z" fill="#D88D65" />
        {label(`${b} units`, 180, 64)}
        <Path d="M129 88h102l38 56H91Z" fill={gold} />
        {label(`${a} units`, 180, 122)}
        <Path d="M85 154h190l32 46H53Z" fill="#93BC74" />
        {label(`${q.target[0] * 10} producer units`, 180, 184)}
      </>
    );
  } else if (q.kind === "cycle") {
    description = selected.length ? selected.join(" → ") : "A water drop is ready for its journey.";
    scene = (
      <>
        <Sun x={40} y={40} />
        <Path d="M0 165Q100 146 180 165T360 165V220H0Z" fill="#83BCC8" />
        <Path d="M175 168L260 62L340 168" fill="#97BA80" />
        <Path d="M260 94Q230 140 210 171" stroke={blue} strokeWidth={8} fill="none" />
        {selected.some((x) => x.includes("Heat")) && (
          <Path d="M83 139v-53m-10 10 10 -10 10 10" stroke={gold} strokeWidth={5} fill="none" />
        )}
        {selected.some((x) => x.includes("Cool")) && (
          <PuffyCloud x={180} y={47} scale={.8}/>
        )}{" "}
        {selected.includes("Rain") &&
          [155, 185, 215].map((x) => (
            <Line key={x} x1={x} y1={75} x2={x - 12} y2={111} stroke={blue} strokeWidth={4} />
          ))}
        {label("Sea", 60, 195)}
        {label("River", 270, 183)}
      </>
    );
  } else if (q.kind === "web") {
    const edges = values.map((v) => q.labels[v].split(" → "));
    const nodes = Array.from(new Set(q.labels.flatMap((x) => x.split(" → "))));
    const positions: Record<string, [number, number]> = {};
    nodes.forEach((n, i) => {
      positions[n] = [i === 0 ? 70 : 230, 30 + (i === 0 ? 80 : (i - 1) * 61)];
    });
    // Separate the two grazer branches: a long edge must not pass through another organism.
    if (nodes.length > 4)
      Object.assign(positions, {
        Algae: [50, 65],
        Parrotfish: [180, 30],
        Urchin: [180, 100],
        Triggerfish: [300, 100],
        "Small fish": [180, 180],
        "Reef shark": [300, 180],
      });
    description = edges.length
      ? edges.map((e) => e.join(" feeds ")).join(". ")
      : "Reef nodes wait for your energy-flow arrows.";
    scene = (
      <>
        {edges.map(([from, to], i) => {
          const [x, y] = positions[from],
            [tx, ty] = positions[to],
            dx = tx - x,
            dy = ty - y,
            len = Math.hypot(dx, dy),
            ux = dx / len,
            uy = dy / len,
            edge = Math.min(43 / Math.abs(ux), 25 / Math.abs(uy)) + 3,
            ex = tx - ux * edge,
            ey = ty - uy * edge;
          return (
            <G key={i}>
              <Line x1={x + ux * edge} y1={y + uy * edge} x2={ex} y2={ey} stroke={green} strokeWidth={3} />
              <Path d={`M${ex} ${ey}l${-ux * 10 - uy * 5} ${-uy * 10 + ux * 5}l${uy * 10} ${-ux * 10}Z`} fill={green} />
            </G>
          );
        })}
        {nodes.map((n) => {
          const [x, y] = positions[n];
          return (
            <G key={n}>
              <Rect x={x - 42} y={y - 23} width={86} height={50} rx={14} fill="#365653" opacity={.08}/>
              <Rect x={x - 43} y={y - 25} width={86} height={50} rx={14} fill="#FFFAEB" stroke="#7C9D7D" strokeWidth={1.5}/>
              <NodePicture name={n} x={x} y={y-8} scale={.46}/>
              {label(n, x, y + 18, 9.5)}
            </G>
          );
        })}
      </>
    );
  } else if (q.kind === "feed") {
    description = `${q.labels[a]} is offered. ${correct(q, values) ? "The animal or producer receives usable energy." : "This does not meet its food or energy need."}`;
    scene = (
      <>
        <ReefHabitat/>
        {a === 0 && q.labels[0] === "Sunlight" ? (
          <Sun x={65} y={60} />
        ) : a === 0 ? (
          <Algae x={65} y={118} />
        ) : a === 1 ? (
          <Fish x={65} y={95} />
        ) : (
          <Rect x={50} y={70} width={25} height={45} rx={5} fill="#BDABA0" />
        )}
        <Path
          d="M107 95h85m-12-10 12 10-12 10"
          stroke={correct(q, values) ? green : "#A99D85"}
          strokeWidth={4}
          fill="none"
        />
        {q.title.includes("algae") ? <Algae x={268} y={150}/> : <Creature name={q.title.replace("Feed a ", "").replace("Feed an ", "")} x={267} y={104} scale={.85}/>}
        {label("energy", 151, 132, 12)}
        <Rect x={8} y={154} width={116} height={30} rx={12} fill="#FFF9E9" opacity={.96}/>
        <Rect x={200} y={154} width={151} height={30} rx={12} fill="#FFF9E9" opacity={.96}/>
        {label(q.labels[a], 65, 174, 12)}
        {label(q.title.replace("Feed a ", "").replace("Feed an ", ""), 275, 174, 12)}
      </>
    );
  } else if (["chain", "kit"].includes(q.kind)) {
    description = selected.length ? selected.join(" → ") : "Tap a picture below to add it to the scene.";
    scene = (
      <>
        <Rect width={360} height={220} rx={20} fill={game === "food-web" ? "#D8EDE7" : "#E6EBD0"} />
        {game === "food-web" && (
          <>
            <Algae x={35} y={198} />
            <Fish x={290} y={60} />
            <Fish x={283} y={140} color={blue} />
          </>
        )}
        {(q.kind === "feed" ? [a] : values).map((v, i) => (
          <G key={i}>
            <Rect
              x={16 + (i % 2) * 172}
              y={22 + Math.floor(i / 2) * 82}
              width={156}
              height={65}
              rx={12}
              fill="#FFF9E9"
              stroke={green}
            />
            {game === "food-web" && <NodePicture name={q.labels[v]} x={46 + (i % 2) * 172} y={54 + Math.floor(i/2)*82} scale={.65}/>}
            {label(q.labels[v], (game === "food-web" ? 112 : 94) + (i % 2) * 172, 59 + Math.floor(i / 2) * 82, game === "food-web" ? 10.5 : 13)}
            {i > 0 && (i % 2 ? <Path d={`M173 ${54+Math.floor(i/2)*82}h13m-5-5 5 5-5 5`} stroke={green} strokeWidth={2} fill="none"/> : <Path d="M266 88v7H94v8m-4-4 4 4 4-4" stroke={green} strokeWidth={2} fill="none"/>)}
          </G>
        ))}
      </>
    );
  } else if (q.kind === "season" || q.kind === "tropical") {
    const winter = q.kind === "season" && a === 3,
      autumn = q.kind === "season" && a === 2;
    description =
      q.kind === "season"
        ? `${q.labels[a]}: ${["new leaves and flowers", "full green leaves", "some leaves turn and fall", "many deciduous trees are bare"][a]}.`
        : `${q.labels[a]}: ${a ? "more rain fills the garden" : "less rain; plants still need water"}.`;
    scene = (
      <>
        <Rect width={360} height={220} fill={winter ? "#E8F0EE" : "#E8F0D2"} />
        <Path d="M0 183Q160 148 360 182v38H0Z" fill={winter ? "#FAFBF3" : "#A6C783"} />
        <Path d="M180 180V65m0 48-37 -29m37 14 39 -34" stroke="#90674A" strokeWidth={13} />
        {!winter && (
          <G fill={autumn ? "#D69E58" : "#78A762"}>
            <Circle cx={180} cy={67} r={42} />
            <Circle cx={145} cy={81} r={32} />
            <Circle cx={215} cy={76} r={34} />
          </G>
        )}
        {q.kind === "tropical" &&
          a === 1 &&
          [45, 90, 270, 310].map((x) => (
            <Path key={x} d={`M${x} 30l-10 25m10 20-10 25`} stroke={blue} strokeWidth={4} />
          ))}
        {q.kind === "season" &&
          a === 0 &&
          [140, 170, 205].map((x) => <Circle key={x} cx={x} cy={66} r={6} fill="#F3D2A1" />)}
      </>
    );
  } else {
    const indoors = q.kind === "safety" && a === 0;
    description =
      q.kind === "dress"
        ? `Explorer wears ${q.labels[a]}.`
        : q.kind === "safety"
          ? indoors
            ? "The explorer is inside a sturdy shelter."
            : a === 1
              ? "The explorer is outside by the sea."
              : "The explorer is outside under a tree."
          : `Scene setting: ${q.labels[a]}.`;
    scene = (
      <>
        <Rect width={360} height={220} fill={q.title.includes("Rain") ? "#D4E3DF" : "#EAF0D2"} />
        {q.title.includes("Sunny") || q.title.includes("Settled") ? <Sun x={65} y={45}/> : <PuffyCloud x={67} y={44} scale={.7} storm={q.title.includes("Storm") || q.title.includes("Rain")}/>}
        {(q.title.includes("Rain") || q.title.includes("Storm") || q.title.includes("pressure")) && [21,48,76,101].map((x,i)=><Path key={x} d={`M${x} ${77+i%2*9}l-7 18m2 15-5 13`} stroke="#7CA9B7" strokeWidth={2.5} strokeLinecap="round" fill="none"/>)}
        <Path d="M264 49q20-10 45-3m-33 13q26-7 44 0" fill="none" stroke="#9FBBB0" strokeWidth={2} strokeLinecap="round"/>
        <G transform="translate(317 125)"><Rect x={0} y={0} width={12} height={43} rx={6} fill="#FFFAE9" stroke={ink}/><Path d="M6 35V12" stroke="#D68B76" strokeWidth={4}/><Circle cx={6} cy={36} r={7} fill="#D68B76"/></G>
        {q.title.includes("Cold") && <G><Path d="M0 175L65 66 132 174 174 111 236 187Z" fill="#AFBFC0"/><Path d="M44 101L65 66 88 104 70 97 60 108Z" fill="#F5F5E8"/></G>}
        <Path d="M0 185Q170 145 360 180v40H0Z" fill={q.title.includes("Cold") ? "#C6D4C5" : "#A7C387"} />
        {indoors && (
          <G>
            <Path d="M70 35L188 2L308 35" fill="#B78C62" />
            <Rect x={80} y={35} width={220} height={185} rx={7} fill="#F4DFB2" />
            <Rect x={96} y={48} width={46} height={50} fill="#B7CFD0" stroke="#936F50" strokeWidth={4} />
            <Path d="M119 48v50m-23-25h46" stroke="#936F50" strokeWidth={3} />
            <Path d="M80 185h220v35H80Z" fill="#C5A27D" />
          </G>
        )}
        {q.kind === "safety" && a === 1 && <Path d="M0 174q30 -15 60 0t60 0v46H0Z" fill={blue} />}
        {q.kind === "safety" && a === 2 && (
          <G>
            <Path d="M285 185V55" stroke="#90674A" strokeWidth={12} />
            <Circle cx={285} cy={48} r={43} fill="#78A762" />
          </G>
        )}
        <WeatherExplorer gear={q.kind === "dress" ? q.labels[a] : ""}/>
        {label(q.labels[a] ?? "", 279, 112, 11)}
      </>
    );
  }
  return (
    <View
      style={{
        backgroundColor: "#F1F5E4",
        borderRadius: 22,
        padding: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: "#C7D8AD",
      }}
    >
      <Svg width="100%" height={220} viewBox="0 0 360 235" accessible accessibilityLabel={q.kind === "gauge" ? `Thermometer ${q.target[0]} degrees Celsius. Rain gauge ${q.target[1]} millimeters. ${description}` : description}>
        {scene}
      </Svg>
      <Copy style={{ fontSize: 14, textAlign: "center", color: ink, fontWeight: "700" }}>{description}</Copy>
      {game === "space-station" && (
        <Copy style={{ fontSize: 12, textAlign: "center", color: ink }}>
          Space diagrams simplify sizes and distances. Planet builder compares planet diameters; its Sun is a symbol.
        </Copy>
      )}
    </View>
  );
}
function Dial({
  name,
  value,
  max,
  step = 1,
  onChange,
}: {
  name: string;
  value: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Button
        quiet
        compact
        label={`Decrease ${name}`}
        disabled={value === 0}
        onPress={() => onChange(Math.max(0, value - step))}
      >
        −
      </Button>
      <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
        <Copy style={{ textAlign: "center", fontWeight: "800", fontSize: 14 }}>{name}</Copy>
        <TextInput
          accessibilityLabel={name}
          keyboardType="number-pad"
          selectTextOnFocus
          value={String(value)}
          maxLength={3}
          onChangeText={(text) => {
            if (/^\d{0,3}$/.test(text)) onChange(Math.min(max, Number(text)));
          }}
          style={{
            minHeight: 46,
            minWidth: 78,
            padding: 8,
            textAlign: "center",
            fontSize: 18,
            color: ink,
            backgroundColor: "#FFFCF1",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: green,
          }}
        />
      </View>
      <Button
        quiet
        compact
        label={`Increase ${name}`}
        disabled={value === max}
        onPress={() => onChange(Math.min(max, value + step))}
      >
        +
      </Button>
    </View>
  );
}
export function ScienceBoard(props: BoardProps<ScienceState> & { game: Game }) {
  const { session, game, update, active, cheer, practice, assistance, coach, sound, soundOn, stopSound } = props,
    s = session.state,
    q = currentTask(game, s);
  const [hint, setHint] = useState(false);
  if (!q) return <Copy style={{ textAlign: "center", fontWeight: "800" }}>Your discovery journal is complete!</Copy>;
  const send = (a: Parameters<typeof move>[2]) => {
    if (active) {
      stopSound();
      update(move(game, s, a));
      coach.done();
    }
  };
  const set = (slot: number, value: number) => send({ type: "set", slot, value });
  const numeric: Record<string, { name: string; max: number; step?: number }[]> = {
    gauge: [
      { name: "Temperature °C", max: 40 },
      { name: "Rain mm", max: 40, step: 5 },
    ],
    population: [{ name: "Grazers", max: 10 }],
    pollution: [{ name: "Pollution", max: 10 }],
    energy: [
      { name: "Primary energy", max: 500, step: 10 },
      { name: "Secondary energy", max: 100 },
    ],
    gravity: [{ name: "Mass kg", max: 30, step: 6 }],
    distance: [
      { name: "Distance AU", max: 5 },
      { name: "Light-time min", max: 42 },
    ],
    tilt: [{ name: "Tilt degrees", max: 30 }],
    eclipse: [{ name: "Orbit offset (0 = aligned)", max: 1 }],
  };
  const numericSlots = q.kind === "eclipse" ? [1] : [0, 1];
  const ready = s.tested && correct(q, s.values);
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Copy style={{ color: green, fontWeight: "900", fontSize: 13 }}>
          DISCOVERY {s.index + 1} / {tasks(game, s.level, s.seed).length}
        </Copy>
        <Copy style={{ color: ink, fontSize: 13 }}>Build · Test · Notice</Copy>
      </View>
      <Copy style={{ fontSize: 23, fontWeight: "900", color: ink }}>{q.title}</Copy>
      <Copy style={{ fontSize: 16, lineHeight: 23 }}>{q.goal}</Copy>
      <Button quiet compact icon="sound-on" disabled={!active || !soundOn} onPress={() => sound(scienceSpeechKey(goalTranscript(q)))}>Hear the goal</Button>
      {q.kind === "gauge" && <Copy>{scalePractice(s.records.length) ? "Your turn: read the scales without printed answers. Each small mark is 1 unit. Hint can help whenever you need it." : "First, learn the scales: each small mark is 1 °C on red and 1 mm on blue. Read the top of each colored column. Tomorrow, try without the printed answers."}</Copy>}
      <Scene game={game} q={q} values={s.values} records={s.records} />
      {!ready && (
        <CoachSpot active={coach.active}>
          <View style={{ gap: 10 }}>
            {(numeric[q.kind] ?? []).map((d, i) => (
              <Dial
                key={d.name}
                {...d}
                value={s.values[numericSlots[i]] ?? 0}
                onChange={(n) => set(numericSlots[i], n)}
              />
            ))}
            {q.labels.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {q.labels.map((name, i) => {
                  const slot = q.kind === "gravity" || q.kind === "tilt" ? 1 : 0;
                  const selected = multi(q) ? s.values.includes(i) : s.values[slot] === i;
                  return (
                    <PressableScale
                      key={name}
                      disabled={!active}
                      accessibilityRole="button"
                      accessibilityLabel={`${multi(q) ? "Add" : "Set"} ${name}`}
                      accessibilityState={{ selected }}
                      onPress={() => set(slot, i)}
                      style={{
                        flexGrow: 1,
                        flexBasis: q.labels.length > 4 ? "29%" : "44%",
                        minHeight: 82,
                        padding: 8,
                        borderRadius: 16,
                        borderWidth: 2,
                        borderColor: selected ? green : "#CDD7BC",
                        backgroundColor: selected ? "#DDECCA" : "#FFFCF1",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <TokenArt text={name} />
                      <Copy style={{ fontSize: 13, textAlign: "center", fontWeight: "800", color: ink }}>{name}</Copy>
                    </PressableScale>
                  );
                })}
              </View>
            )}
          </View>
        </CoachSpot>
      )}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          quiet
          compact
          disabled={!active}
          onPress={() => {
            send({ type: "reset" });
            setHint(false);
          }}
        >
          Reset
        </Button>
        <Button
          quiet
          compact
          disabled={!active}
          onPress={() => {
            assistance?.();
            setHint(!hint);
          }}
        >
          Hint
        </Button>
        {!ready && (
          <Button
            style={{ flex: 1 }}
            disabled={!active || s.actions === 0}
            onPress={() => {
              const ok = correct(q, s.values);
              practice(`sci.${game}`, ok);
              send({ type: "test" });
              if (ok) cheer("right");
            }}
          >
            Test model
          </Button>
        )}
      </View>
      {hint && (
        <Copy style={{ padding: 12, backgroundColor: "#FFF3CE", borderRadius: 12, fontSize: 15 }}>
          Try this setup: {q.hint}. You can reset and build it yourself.
        </Copy>
      )}
      {s.tested && (
        <View
          accessibilityLiveRegion="polite"
          style={{ padding: 14, gap: 10, borderRadius: 16, backgroundColor: ready ? "#E4EFD4" : "#FFF0CF" }}
        >
          <Copy style={{ fontSize: 17, fontWeight: "900", color: ink }}>
            {ready ? "You made a discovery!" : "Try another change"}
          </Copy>
          <Copy style={{ fontSize: 15, lineHeight: 22 }}>
            {ready
              ? q.fact
              : wrongFeedback(q, s.values)}
          </Copy>
          <Button quiet compact icon="sound-on" disabled={!active || !soundOn} onPress={() => sound(scienceSpeechKey(ready ? q.fact : wrongFeedback(q, s.values)))}>Hear why</Button>
          {ready && (
            <>
              <Copy style={{ fontWeight: "800" }}>What did you notice?</Copy>
              <Button
                disabled={!active}
                onPress={() => {
                  send({ type: "next" });
                  setHint(false);
                  cheer(s.index === s.items.length - 1 ? "big" : "right");
                }}
              >
                {q.notice}
              </Button>
            </>
          )}
        </View>
      )}
      {!s.tested && (
        <Copy style={{ fontSize: 12, color: ink }}>
          Tap a control first, then test. Change one thing and watch what happens.
        </Copy>
      )}
    </View>
  );
}
export function ScienceArt({ game, size }: { game: Game; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <TokenArt text={game === "weather-watch" ? "Sun" : game === "food-web" ? "Fish" : "Moon"} size={size * 0.85} />
    </View>
  );
}
