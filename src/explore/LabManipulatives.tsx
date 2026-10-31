import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { Text } from "../components/Text";
import { Button, C, Copy, Heading, Label, PressableScale } from "../components/ui";
import { WorldId } from "./content";
import { EarthLabArt, GlobeMap, Motif } from "./ExploreArt";
import {
  FOOD_CHAIN,
  HABITATS,
  HABITAT_CHOICES,
  LabAction,
  LabState,
  PLACES,
  WATER_ACTIONS,
  WaterPlace,
} from "./activities";
import { GuidanceKey } from "./guidance";
const pinY: Record<string, number> = { guam: 110, japan: 54, australia: 164, africa: 110, antarctica: 207 };
const terms: Partial<Record<WorldId, { key: GuidanceKey; title: string; text: string }[]>> = {
  oceans: [
    {
      key: "term-phytoplankton",
      title: "Phytoplankton · fight-oh-plank-ton",
      text: "Tiny drifters that make food using sunlight.",
    },
    {
      key: "term-zooplankton",
      title: "Zooplankton · zoh-oh-plank-ton",
      text: "Tiny drifting animals. Some eat phytoplankton.",
    },
  ],
  animals: [
    {
      key: "term-habitat",
      title: "Habitat · hab-it-at",
      text: "A living thing’s whole home: food, water, shelter, and space.",
    },
  ],
  weather: [
    {
      key: "term-water-vapor",
      title: "Water vapor · vay-per",
      text: "Water in its invisible gas form. Visible clouds are tiny drops or ice.",
    },
  ],
};
export function LabGuidance({
  world,
  sound,
  onSpeak,
  onStop,
  speaking,
}: {
  world: WorldId;
  sound: boolean;
  onSpeak?: (key: GuidanceKey) => void;
  onStop?: () => void;
  speaking?: string;
}) {
  const [words, setWords] = useState(false);
  return (
    <View style={s.guide}>
      <View style={s.row}>
        {onSpeak && (
          <Button compact disabled={!sound} onPress={() => onSpeak(`lab-${world}`)}>
            Listen {speaking === `lab-${world}` ? "again" : "to the activity"}
          </Button>
        )}
        {onStop && (
          <Button quiet compact onPress={onStop}>
            Stop
          </Button>
        )}
        {terms[world] && (
          <Button compact quiet onPress={() => setWords(!words)}>
            {words ? "Hide" : "Word"} help
          </Button>
        )}
      </View>
      {words &&
        terms[world]?.map((term) => (
          <View key={term.key} style={{ gap: 5 }}>
            <Heading style={{ fontSize: 19 }}>{term.title}</Heading>
            <Copy style={s.small}>{term.text}</Copy>
            {onSpeak && (
              <Button quiet compact disabled={!sound} onPress={() => onSpeak(term.key)}>
                Hear this word
              </Button>
            )}
          </View>
        ))}
      {!sound && <Copy style={s.small}>Sound is off. The directions and word help are here to read.</Copy>}
    </View>
  );
}
function Tile({
  label,
  selected,
  disabled,
  onPress,
  children,
}: {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ selected: !!selected, disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={[s.tile, { borderColor: selected ? C.teal : C.line, backgroundColor: selected ? C.success : C.paper, opacity: disabled ? 0.5 : 1 }]}>
      {children}<Text style={s.tileText}>{label}</Text>
    </PressableScale>
  );
}

function FoodPicture({ index, compact = false }: { index: number; compact?: boolean }) {
  return (
    <Svg width={compact ? 45 : 72} height={compact ? 40 : 64} viewBox="0 0 100 80" accessible={false}>
      {index === 0 ? (
        <G transform="translate(15,0) scale(.6)">
          <Motif name="sun" />
        </G>
      ) : index < 3 ? (
        <>
          <Rect x="5" y="4" width="90" height="70" rx="12" fill="#DBEFF0" />
          {[24, 50, 74].map((x, i) => (
            <G key={x}>
              <Path
                d={`M${x - 5} ${22 + (i % 2) * 19}q-9 12 2 20t10-13`}
                fill={index === 1 ? "#6C9C69" : "#DFAC87"}
                stroke="#285F58"
                strokeWidth={2}
              />
              <Circle cx={x + 3} cy={31 + (i % 2) * 19} r="2" fill="#285F58" />
            </G>
          ))}
          {index === 1 && <Path d="M12 14l9 6m58-6-9 6" stroke="#C79C39" strokeWidth={3} />}
        </>
      ) : (
        <G transform={`translate(${index === 3 ? 24 : 10},0) scale(${index === 3 ? 0.5 : 0.7})`}>
          <Motif name="fish" />
        </G>
      )}
    </Svg>
  );
}
function HabitatPicture({ kind }: { kind: string }) {
  return (
    <Svg width={100} height={65} viewBox="0 0 140 90" accessible={false}>
      <Rect width="140" height="90" rx="10" fill={kind === "Leafy garden" ? "#E8F0D9" : "#DDEFF1"} />
      <Path d="M0 76Q40 62 80 77T140 75V90H0Z" fill="#E3CD99" />
      {kind === "Leafy garden" ? (
        <G transform="translate(25,2) scale(.65)">
          <Motif name="flower" />
        </G>
      ) : kind === "Coral reef" ? (
        <G transform="translate(25,0) scale(.65)">
          <Motif name="coral" />
        </G>
      ) : kind === "Freshwater pond" ? (
        <>
          <Path d="M5 65Q60 30 134 65Q80 82 5 65" fill="#80B9BD" />
          <Path d="M24 66V24m7 36V18m-15 43V30" stroke="#5F8B50" strokeWidth="4" />
          <Circle cx="100" cy="61" r="12" fill="#85AB6D" />
        </>
      ) : (
        <Path
          d="M15 76Q20 52 12 36m23 40q-5-42 5-54m14 54q16-35 8-60m12 60q3-38 14-56m14 56q-6-37 7-54m11 54q-7-32 4-45"
          stroke="#588D61"
          strokeWidth="5"
          fill="none"
        />
      )}
    </Svg>
  );
}
const waterLabels: Record<WaterPlace, string> = {
  ocean: "Ocean",
  vapor: "Vapor",
  cloud: "Cloud",
  rain: "Rain",
  ground: "Groundwater",
  ice: "Ice",
};
function WaterIcon({ place }: { place: WaterPlace }) {
  return (
    <Svg width={72} height={56} viewBox="0 0 100 80" accessible={false}>
      {place === "cloud" || place === "rain" ? (
        <>
          <Path
            d="M16 43Q5 25 28 23Q35 2 57 20Q81 8 88 35Q97 53 75 55H28Q14 55 16 43"
            fill="#A9CCD2"
            stroke="#366A76"
            strokeWidth="2"
          />
          {place === "rain" &&
            [30, 50, 70].map((x) => <Path key={x} d={`M${x} 60l-5 12`} stroke="#367E9A" strokeWidth="4" />)}
        </>
      ) : place === "ice" ? (
        <>
          <Rect x="24" y="15" width="50" height="50" rx="10" fill="#B4DDE4" stroke="#4B8594" strokeWidth="3" />
          <Path d="M34 24l26 30m-19 1 18-24" stroke="white" strokeWidth="4" />
        </>
      ) : place === "vapor" ? (
        <>
          {[25, 50, 75].map((x) => (
            <Path
              key={x}
              d={`M${x} 69q-13-15 0-26t0-30`}
              stroke="#507D87"
              strokeWidth="3"
              strokeDasharray="4 4"
              fill="none"
            />
          ))}
        </>
      ) : place === "ground" ? (
        <>
          <Path d="M10 35H90V75H10Z" fill="#B58E6D" />
          <Path d="M13 45q20 13 38 0t36 0M13 62q20 13 38 0t36 0" stroke="#3D8DA4" strokeWidth="5" fill="none" />
        </>
      ) : (
        <>
          <Path d="M5 38q18-18 36 0t36 0 20 0V75H5Z" fill="#73B6C9" />
          <Path d="M7 53q18-12 36 0t36 0" stroke="#EAF9F6" strokeWidth="3" fill="none" />
        </>
      )}
    </Svg>
  );
}
export function LabManipulative({
  world,
  state,
  act,
}: {
  world: WorldId;
  state: LabState;
  act: (a: LabAction) => void;
}) {
  if (world === "space")
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Turn Earth one eighth. Follow the coral place dot."
        onPress={() => act({ type: "turn", by: 1 })}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, minHeight: 190 })}
      >
        <EarthLabArt turn={state.turn} />
      </Pressable>
    );
  if (world === "oceans")
    return (
      <View style={{ gap: 10 }}>
        <View style={{ alignItems: "stretch" }}>
          {state.chain.map((item, i) => (
            <View key={item}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 8, borderRadius: 14, backgroundColor: "#E6F0DD" }}>
                <FoodPicture index={i} compact />
                <Text style={[s.small, { flex: 1 }]}>{item}</Text>
              </View>
              {i < state.chain.length - 1 && <Text accessibilityLabel="energy moves to" style={[s.arrow, { textAlign: "center" }]}>↓</Text>}
            </View>
          ))}
        </View>
        <Label>Tap the next energy link</Label>
        <View style={s.row}>
          {[3, 0, 4, 2, 1].map((i) => (
            <Tile
              key={i}
              label={FOOD_CHAIN[i]}
              selected={state.chain.includes(FOOD_CHAIN[i])}
              disabled={state.chain.includes(FOOD_CHAIN[i]) || state.chain.length === 5}
              onPress={() => act({ type: "chain", item: FOOD_CHAIN[i] })}
            >
              <FoodPicture index={i} />
            </Tile>
          ))}
        </View>
      </View>
    );
  if (world === "animals") {
    const animal = HABITATS[state.habitatFeedback ? state.habitat - 1 : state.habitat];
    if (!animal) return null;
    return (
      <View style={{ gap: 10 }}>
        <View style={s.animal}>
          <Svg width={120} height={110} viewBox="0 0 120 120" accessible={false}>
            <Motif name={animal.art} />
          </Svg>
          <Heading style={{ fontSize: 23 }}>{animal.animal}</Heading>
          <Copy style={s.small}>{state.habitatFeedback ? `Matched: ${animal.home}` : "Where could I live?"}</Copy>
        </View>
        {!state.habitatFeedback && <View style={s.row}>
          {HABITAT_CHOICES.map((kind) => (
            <Tile key={kind} label={kind} onPress={() => act({ type: "habitat", choice: kind })}>
              <HabitatPicture kind={kind} />
            </Tile>
          ))}
        </View>}
      </View>
    );
  }
  if (world === "weather")
    return (
      <View style={{ gap: 9 }}>
        <Label>Water wheel · choose a lit-up next step</Label>
        <View style={s.row}>
          {(Object.keys(waterLabels) as WaterPlace[]).map((place) => {
            const choice = WATER_ACTIONS[state.water].find((a) => a.next === place);
            return (
              <Tile
                key={place}
                label={
                  state.water === place
                    ? `${waterLabels[place]} · you are here`
                    : choice
                      ? choice.label
                      : waterLabels[place]
                }
                selected={state.water === place}
                disabled={!choice}
                onPress={() => {
                  if (choice) act({ type: "water", action: choice.action });
                }}
              >
                <WaterIcon place={place} />
              </Tile>
            );
          })}
        </View>
      </View>
    );
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      accessibilityLabel="World map with five tappable numbered pins. Swipe sideways if needed."
    >
      <View style={{ width: 400, height: 242 }}>
        <GlobeMap selected={state.visited.at(-1)} showPins={false} />
        <Svg
          pointerEvents="none"
          width={400}
          height={220}
          style={StyleSheet.absoluteFill}
          viewBox="0 0 400 220"
          accessible={false}
        >
          {PLACES.map((p) => (
            <Path key={p.id} d={`M${p.x} ${p.y}L${p.x} ${pinY[p.id]}`} stroke="#527E69" strokeWidth={2} />
          ))}
        </Svg>
        {PLACES.map((p, i) => {
          const y = pinY[p.id];
          return (
            <Pressable
              key={p.id}
              disabled={state.expedition === PLACES.length}
              accessibilityRole="button"
              accessibilityLabel={`${i + 1}. ${p.name}`}
              accessibilityState={{
                selected: state.visited.includes(p.id),
                disabled: state.expedition === PLACES.length,
              }}
              onPress={() => act({ type: "place", id: p.id })}
              style={({ pressed }) => [
                s.pin,
                {
                  left: p.x - 22,
                  top: y - 22,
                  backgroundColor: state.visited.includes(p.id) ? "#D38260" : C.teal,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={s.pinText}>{i + 1}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  guide: { padding: 12, borderRadius: 16, backgroundColor: "#EEF2E8", gap: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  small: { fontSize: 14, lineHeight: 21, color: C.ink },
  tile: {
    flexGrow: 1,
    flexBasis: 130,
    minHeight: 112,
    minWidth: 124,
    padding: 10,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  tileText: { fontSize: 15, fontWeight: "700", textAlign: "center", color: C.ink },
  link: { padding: 9, borderRadius: 14, backgroundColor: "#E6F0DD", alignItems: "center", maxWidth: 150 },
  arrow: { fontSize: 25, color: C.teal },
  animal: { alignItems: "center", backgroundColor: "#F6EFD9", borderRadius: 20, padding: 15, gap: 4 },
  pin: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pinText: { fontSize: 18, fontWeight: "800", color: "#FFF" },
});
