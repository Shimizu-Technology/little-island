import React from "react";
import { View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from "react-native-svg";
import { Text } from "../components/Text";
import { Button, C, Copy, Heading, PressableScale } from "../components/ui";
import { MysteryIntent, MysteryView, REPAIR_CHOICES, STAR_TARGETS, TASKS, TaskId } from "./engine";
import { LandmarkArt } from "./IslandArt";
const colors = ["#BD684B", "#367B85", "#8668A3"];
const shapes = ["round", "square", "triangle"];
function Shape({ index, size = 26 }: { index: number; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessibilityElementsHidden>
      {index === 0 ? (
        <Circle cx="20" cy="20" r="14" fill={colors[index]} />
      ) : index === 1 ? (
        <Rect x="7" y="7" width="26" height="26" rx="4" fill={colors[index]} />
      ) : (
        <Polygon points="20,4 37,34 3,34" fill={colors[index]} />
      )}
    </Svg>
  );
}
function Food({ index, size = 54 }: { index: number; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 70 70" accessibilityElementsHidden>
      {index === 0 ? (
        <>
          <Rect x="24" y="10" width="22" height="9" rx="3" fill="#4F777A" />
          <Path d="M26 20h18l7 12v29H19V32Z" fill="#98C8CF" stroke="#4E888C" strokeWidth="3" />
          <Path d="M21 42h28v15H21Z" fill="#DDF0E9" />
        </>
      ) : index === 1 ? (
        <>
          <Path d="M34 24C4 7 4 62 29 63q6-6 12 0c25-2 28-57-3-39Z" fill="#C97553" />
          <Path d="M35 24V11q15-12 23-4-6 14-22 9" fill="#6A9B66" stroke="#557A49" strokeWidth="3" />
        </>
      ) : (
        <>
          <Path d="M7 40q0-30 28-30t28 30v16q-28 13-56 0Z" fill="#DFB979" stroke="#A57C45" strokeWidth="3" />
          <Path d="m21 17 5 17m10-21 4 19m9-13 3 15" stroke="#FFF0C5" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
function Plot({ grown }: { grown: boolean }) {
  return (
    <Svg width="70" height="80" viewBox="0 0 70 80" accessibilityElementsHidden>
      <Ellipse cx="35" cy="65" rx="29" ry="10" fill="#B88B60" />
      <Path
        d={
          grown
            ? "M35 64V23M35 46Q7 19 14 45q7 11 21 5M35 36q27-28 23-3-8 16-23 9"
            : "M35 65V48m0 7q-17-21-20-5 7 11 20 7m0-5q18-22 21-6-9 12-21 9"
        }
        stroke="#4E8457"
        strokeWidth="4"
        fill="#8DBD72"
        strokeLinecap="round"
      />
      {grown ? (
        <G>
          <Circle cx="35" cy="18" r="12" fill="#E5B656" />
          <Circle cx="35" cy="18" r="5" fill="#AD7748" />
        </G>
      ) : (
        <Path d="M53 6q-14 19 0 19t0-19" fill="#80B9C0" />
      )}
    </Svg>
  );
}
export function IslandJob({
  taskId,
  view,
  enabled,
  intent,
}: {
  taskId: TaskId;
  view: MysteryView;
  enabled: boolean;
  intent: (i: MysteryIntent) => void;
}) {
  const task = TASKS.find((t) => t.id === taskId)!;
  const progress = view.tasks[taskId];
  const blocked = !enabled || !!view.sabotage || progress === 3;
  const action = (choice: number) => intent({ type: "task", task: taskId, choice });
  const data = view.adventure?.taskData;
  return (
    <View
      style={{
        backgroundColor: "#FFFDF4",
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: "#DFE4D3",
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <LandmarkArt kind={taskId} size={40} complete={progress === 3} />
        <View style={{ flex: 1 }}>
          <Heading style={{ fontSize: 20 }}>{task.name}</Heading>
          <Copy style={{ fontSize: 12 }}>
            {progress === 3 ? "Ready for the picnic. Well done!" : `${progress} of 3 ready`}
          </Copy>
        </View>
      </View>
      {!data ? (
        <>
          <Copy>{task.prompt}</Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {task.choices.map((choice, i) => (
              <Button key={choice} compact quiet disabled={blocked} onPress={() => action(i)}>
                {choice}
              </Button>
            ))}
          </View>
        </>
      ) : taskId === "garden" ? (
        <>
          <Copy style={{ fontSize: 13 }}>Water each thirsty bed. Any order works.</Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map((i) => {
              const grown = !!(data.garden & (1 << i));
              return (
                <PressableScale
                  key={i}
                  disabled={blocked || grown}
                  accessibilityRole="button"
                  accessibilityLabel={`Water garden bed ${i + 1}${grown ? ", already growing" : ""}`}
                  onPress={() => action(i)}
                  style={{
                    minWidth: 70,
                    minHeight: 104,
                    alignItems: "center",
                    borderRadius: 14,
                    backgroundColor: grown ? "#E4EDD3" : "#F2E8D3",

                  }}
                >
                  <Plot grown={grown} />
                  <Text style={{ fontWeight: "700", color: C.ink, fontSize: 13 }}>
                    {grown ? "Growing!" : `Water ${i + 1}`}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </>
      ) : taskId === "stars" ? (
        <>
          <Copy style={{ fontSize: 13 }}>Turn the pointer to the gold star, then align.</Copy>
          <View style={{ alignItems: "center" }}>
            <Svg width="154" height="154" viewBox="0 0 180 180" accessibilityElementsHidden>
              <Circle cx="90" cy="90" r="80" fill="#E4EEF2" />
              <Circle cx="90" cy="90" r="62" fill="#355E76" />
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i * Math.PI) / 4,
                  x = 90 + Math.sin(a) * 58,
                  y = 90 - Math.cos(a) * 58;
                return i === STAR_TARGETS[progress] ? (
                  <G key={i} transform={`translate(${x},${y})`}>
                    <Path d="m0-12 4 8 9 1-7 6 2 10-8-5-8 5 2-10-7-6 9-1Z" fill="#F1CB65" />
                  </G>
                ) : (
                  <Circle key={i} cx={x} cy={y} r="3" fill="#D2E4E1" />
                );
              })}
              <G rotation={data.stars * 45} origin="90,90">
                <Path
                  d="M90 99V43m-9 13 9-17 9 17"
                  fill="none"
                  stroke="#FFF7D6"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </G>
              <Circle cx="90" cy="90" r="8" fill="#E6BA62" />
            </Svg>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
            <Button compact quiet disabled={blocked} label="Turn telescope left" onPress={() => action(0)}>
              ← Turn
            </Button>
            <Button compact disabled={blocked} onPress={() => action(2)}>
              Align star
            </Button>
            <Button compact quiet disabled={blocked} label="Turn telescope right" onPress={() => action(1)}>
              Turn →
            </Button>
          </View>
        </>
      ) : taskId === "picnic" ? (
        <>
          <Copy style={{ fontSize: 13 }}>Put water, fruit and bread into the basket.</Copy>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
            {["Water", "Fruit", "Bread"].map((name, i) => {
              const packed = !!(data.picnic & (1 << i));
              return (
                <PressableScale
                  key={name}
                  disabled={blocked || packed}
                  accessibilityRole="button"
                  accessibilityLabel={`Pack ${name.toLowerCase()}${packed ? ", packed" : ""}`}
                  onPress={() => action(i)}
                  style={{
                    minWidth: 75,
                    minHeight: 94,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: packed ? "#93B28E" : "#E7DBBE",
                    backgroundColor: packed ? "#E9EFD9" : "#FCF6E7",

                  }}
                >
                  <Food index={i} />
                  <Text style={{ color: C.ink, fontSize: 13, fontWeight: "700" }}>{packed ? "Packed!" : name}</Text>
                </PressableScale>
              );
            })}
          </View>
          <View
            style={{
              borderRadius: 12,
              borderWidth: 3,
              borderColor: "#BA9155",
              backgroundColor: "#F1E0BD",
              minHeight: 60,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {[0, 1, 2]
              .filter((i) => data.picnic & (1 << i))
              .map((i) => (
                <Food key={i} index={i} size={46} />
              ))}
            {!data.picnic && <Copy style={{ fontSize: 12 }}>Your picnic basket</Copy>}
          </View>
        </>
      ) : (
        <>
          <Copy style={{ fontSize: 13 }}>Choose a boat rope, then its matching shore cleat.</Copy>
          <View style={{ minHeight: 180, backgroundColor: "#D4E9E7", borderRadius: 14, overflow: "hidden" }}>
            <Svg width="100%" height="180" viewBox="0 0 300 180" preserveAspectRatio="none" accessibilityElementsHidden>
              <Path d="M225 0h75v180h-75Z" fill="#D7C19A" />
              <Path d="M5 25h78v130H5Z" fill="#BC7656" />
              <Path d="M20 30v120m18-120v120" stroke="#D9A381" strokeWidth="5" />
              {[0, 1, 2].map((i) => (
                <Line
                  key={i}
                  x1="72"
                  y1={30 + i * 59}
                  x2="246"
                  y2={30 + i * 59}
                  stroke={data.dock & (1 << i) ? colors[i] : "#A7C8C5"}
                  strokeWidth={data.dock & (1 << i) ? 6 : 2}
                  strokeDasharray={data.dock & (1 << i) ? undefined : "4 5"}
                />
              ))}
            </Svg>
            {[0, 1, 2].map((i) => (
              <React.Fragment key={i}>
                <PressableScale
                  disabled={blocked || !!(data.dock & (1 << i))}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${shapes[i]} boat rope`}
                  accessibilityState={{ selected: data.rope === i }}
                  onPress={() => action(i)}
                  style={{
                    position: "absolute",
                    left: 5,
                    top: 5 + i * 58,
                    minWidth: 56,
                    minHeight: 50,
                    borderRadius: 12,
                    borderWidth: data.rope === i ? 3 : 1,
                    borderColor: colors[i],
                    backgroundColor: "#FFF8E4",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shape index={i} />
                </PressableScale>
                <PressableScale
                  disabled={blocked || !!(data.dock & (1 << i))}
                  accessibilityRole="button"
                  accessibilityLabel={`Connect to ${shapes[i]} shore cleat`}
                  onPress={() => action(i + 3)}
                  style={{
                    position: "absolute",
                    right: 5,
                    top: 5 + i * 58,
                    minWidth: 56,
                    minHeight: 50,
                    borderRadius: 12,
                    backgroundColor: "#FFF8E4",
                    borderWidth: 2,
                    borderColor: colors[i],
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shape index={i} />
                </PressableScale>
              </React.Fragment>
            ))}
          </View>
        </>
      )}
      {view.sabotage && (
        <Copy style={{ fontSize: 12, color: "#9B533C" }}>The plants need water. Repair the pump first.</Copy>
      )}
    </View>
  );
}
export function PumpJob({
  view,
  enabled,
  intent,
}: {
  view: MysteryView;
  enabled: boolean;
  intent: (i: MysteryIntent) => void;
}) {
  const progress = view.sabotage?.progress ?? 0;
  return (
    <View style={{ padding: 14, borderRadius: 20, backgroundColor: "#E5EFF0", gap: 10 }}>
      <Heading style={{ fontSize: 20 }}>Restore the water · {view.solo ? `${view.sabotage?.left} beats` : "no time limit"}</Heading>
      <Copy style={{ fontSize: 13 }}>Open supply → close valve → connect pipe.</Copy>
      <Svg width="100%" height="54" viewBox="0 0 280 54" accessibilityElementsHidden>
        {[0, 1, 2].map((i) => (
          <G key={i}>
            <Path
              d={`M${i * 90 + 13} 27h70`}
              stroke={progress > i ? "#488F96" : "#BACBC7"}
              strokeWidth="14"
              strokeLinecap="round"
            />
            <Circle
              cx={i * 90 + 48}
              cy="27"
              r="17"
              fill={progress > i ? "#78ADA7" : "#F5F8EE"}
              stroke="#5D8D83"
              strokeWidth="2"
            />
            <Path d={`M${i * 90 + 48} 17v20m-10-10h20`} stroke="#4B756D" strokeWidth="3" />
          </G>
        ))}
      </Svg>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {REPAIR_CHOICES.map((choice, i) => (
          <Button
            key={choice}
            compact
            quiet
            disabled={!enabled || !view.sabotage}
            onPress={() => intent({ type: "repair", choice: i })}
          >
            {choice}
          </Button>
        ))}
      </View>
    </View>
  );
}
