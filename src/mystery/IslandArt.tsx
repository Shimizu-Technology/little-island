import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Polyline, Rect } from "react-native-svg";
import { Text } from "../components/Text";
import { BELL, MysteryView, Point, PUMP, TASKS, pathStep, playerColor, walkable } from "./engine";

export type Landmark = "garden" | "stars" | "picnic" | "dock" | "pump" | "bell";
export const PLACES = [
  ...TASKS.map((t) => ({
    id: t.id,
    name: { garden: "Garden", stars: "Lookout", picnic: "Picnic", dock: "Dock" }[t.id],
    x: t.x,
    y: t.y,
  })),
  { id: "pump" as const, name: "Water pump", ...PUMP },
  { id: "bell" as const, name: "Meeting bell", ...BELL },
];
export function placeName(point: Point) {
  return PLACES.find((p) => p.x === point.x && p.y === point.y)?.name ?? "Island path";
}
export function LandmarkArt({
  kind,
  size = 52,
  complete = false,
}: {
  kind: Landmark;
  size?: number;
  complete?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" accessibilityElementsHidden>
      {kind === "garden" ? (
        <>
          <Path d="M7 54 66 42 75 61 17 74Z" fill="#B88660" />
          {[18, 40, 60].map((x, i) => (
            <G key={x} transform={`translate(${x},${54 - i * 4})`}>
              <Path
                d="M0 1V-24M0-10Q-20-28-13-8Q-4-2 0-5M0-17Q18-36 15-16Q9-6 0-9"
                stroke="#3D7751"
                strokeWidth="4"
                fill={complete ? "#91BD59" : "#BFD67E"}
                strokeLinecap="round"
              />
              {complete && <Circle cx="0" cy="-26" r="6" fill="#E9B55A" />}
            </G>
          ))}
        </>
      ) : kind === "stars" ? (
        <>
          <Ellipse cx="39" cy="68" rx="30" ry="5" fill="#BBC5B2" />
          <Path d="M39 40 24 68M39 40 55 68M39 40v28" stroke="#846C4A" strokeWidth="5" strokeLinecap="round" />
          <G rotation="-25" origin="40,31">
            <Rect x="13" y="22" width="51" height="21" rx="5" fill="#5B85A0" />
            <Rect x="54" y="18" width="13" height="29" rx="3" fill="#DBB65E" />
            <Ellipse cx="67" cy="32" rx="3" ry="14" fill="#A7D8D9" />
          </G>
          <Path d="m16 5 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#E8BC55" />
        </>
      ) : kind === "picnic" ? (
        <>
          <Path d="m4 46 45-15 27 29-45 17Z" fill="#F0D9B9" />
          <Path d="m14 44 27 28m-9-34 27 28M9 56l45-15M20 68l45-15" stroke="#C67456" strokeWidth="7" opacity="0.55" />
          <Path d="M24 37q16-32 32 0" fill="none" stroke="#9D713D" strokeWidth="5" />
          <Path d="M18 34h47l-5 24H24Z" fill="#BF9355" stroke="#815E39" strokeWidth="2" />
          <Circle cx="31" cy="35" r="7" fill="#C96C53" />
          <Path d="M42 21h11v20H42Z" fill="#78ADB1" />
          <Path d="M53 31q7-10 12 1v9H53Z" fill="#E7C37A" />
        </>
      ) : kind === "dock" ? (
        <>
          <Path d="M3 59q12-8 24 0t24 0t24 0" fill="none" stroke="#74ABB0" strokeWidth="5" />
          <Path d="M6 35h62L54 56H20Z" fill="#BF7555" stroke="#7C553A" strokeWidth="2" />
          <Path d="M39 7v29H13ZM44 11v24h22Z" fill="#FFF1C8" stroke="#497B6F" strokeWidth="2" />
          <Path d="M66 66V39m-8 7h17" stroke="#9A7C50" strokeWidth="5" strokeLinecap="round" />
          <Path d="M53 51q20-10 15-13" stroke="#F1CB78" strokeWidth="3" fill="none" />
        </>
      ) : kind === "pump" ? (
        <>
          <Ellipse cx="39" cy="70" rx="25" ry="5" fill="#B7CCAD" />
          <Path d="M24 65V28q0-11 15-11h8v48Z" fill="#568F9B" stroke="#315D64" strokeWidth="3" />
          <Path d="M42 28h21v12M31 17 52 6" stroke="#315D64" strokeWidth="5" strokeLinecap="round" fill="none" />
          <Path d="M63 43q-12 15 0 15t0-15" fill="#8FC4CA" />
          <Circle cx="36" cy="41" r="8" fill="#E9CD82" />
          <Path d="M36 34v14m-7-7h14" stroke="#857343" strokeWidth="2" />
        </>
      ) : (
        <>
          <Path d="M13 67V15h55v52" stroke="#8B7350" strokeWidth="6" fill="none" strokeLinecap="round" />
          <Path d="M25 51q7-7 7-25 9-11 19 0 0 18 7 25Z" fill="#E8BC5E" stroke="#AC843B" strokeWidth="2" />
          <Circle cx="42" cy="56" r="5" fill="#9C7944" />
          <Path d="M42 10v8" stroke="#6A6851" strokeWidth="3" />
          <Path d="m19 28-7-3m52 3 7-3" stroke="#D3AE5D" strokeWidth="3" />
        </>
      )}
      {complete && (
        <G>
          <Circle cx="66" cy="13" r="11" fill="#397A62" />
          <Path d="m61 13 4 4 7-8" stroke="#FFF7DE" strokeWidth="3" fill="none" strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}
export function Islander({
  color,
  size = 44,
  ribbon = false,
  helper = false,
}: {
  color: string;
  size?: number;
  ribbon?: boolean;
  helper?: boolean;
}) {
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 64 74" accessibilityElementsHidden>
      <Ellipse cx="32" cy="68" rx="21" ry="4" fill="#385C4B" opacity="0.17" />
      <Path d="M24 51v13m16-13v13" stroke="#4D594E" strokeWidth="8" strokeLinecap="round" />
      <Path d="M16 38 9 48m39-10 7 10" stroke="#D5A47A" strokeWidth="7" strokeLinecap="round" />
      <Rect x="14" y="26" width="37" height="31" rx="14" fill={color} />
      <Rect x="10" y="32" width="10" height="20" rx="5" fill="#B78A55" />
      <Circle cx="32" cy="21" r="17" fill="#E9BD93" />
      <Path d="M15 16q2-22 29-12l5 12Z" fill={color} />
      <Path d="M14 16h38" stroke="#FFF1D5" strokeWidth="3" />
      <Circle cx="26" cy="23" r="2" fill="#294F45" />
      <Circle cx="39" cy="23" r="2" fill="#294F45" />
      <Path d="M28 30q5 5 10 0" stroke="#946C52" strokeWidth="2" fill="none" strokeLinecap="round" />
      {ribbon && (
        <Path
          d="M21 39q-16-18-13 0 2 8 13 0 14-16 16-2 0 12-16 2l-4 18m4-18 8 17"
          stroke="#E8BE54"
          fill="#F0D582"
          strokeWidth="3"
        />
      )}
      {helper && <Path d="m41 41 3 5 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1Z" fill="#F7E5A8" />}
    </Svg>
  );
}
function WalkingPlayer({
  player,
  width,
  self,
  ribbon,
}: {
  player: MysteryView["players"][number];
  width: number;
  self: boolean;
  ribbon: boolean;
}) {
  const unit = width / 9;
  const size = Math.max(24, Math.min(44, unit * 0.82));
  const [position] = useState(
    () => new Animated.ValueXY({ x: (player.x + 0.5) * unit - size / 2, y: (player.y + 0.5) * unit - size })
  );
  const reduced = useRef(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      reduced.current = value;
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      reduced.current = value;
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    const next = { x: (player.x + 0.5) * unit - size / 2, y: (player.y + 0.5) * unit - size };
    if (reduced.current) {
      position.setValue(next);
      return;
    }
    const movement = Animated.timing(position, {
      toValue: next,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: Platform.OS !== "web",
    });
    movement.start();
    return () => movement.stop();
  }, [player.x, player.y, position, size, unit]);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        alignItems: "center",
        width: size,
        opacity: player.connected ? 1 : 0.4,
        transform: position.getTranslateTransform(),
      }}
    >
      {self && (
        <View
          style={{
            position: "absolute",
            top: -3,
            width: size + 8,
            height: size + 8,
            borderRadius: 40,
            backgroundColor: "#FFFFFFAA",
            borderWidth: 2,
            borderColor: playerColor(player.id),
          }}
        />
      )}
      <Islander color={playerColor(player.id)} size={size} ribbon={ribbon} helper={player.out} />
      <Text
        numberOfLines={1}
        style={{
          position: "absolute",
          top: -16,
          fontSize: self ? 11 : 10,
          fontWeight: "800",
          color: "#234E43",
          backgroundColor: "#FFF9E9E6",
          paddingHorizontal: 3,
          borderRadius: 4,
          minWidth: size,
          textAlign: "center",
        }}
      >
        {self ? "YOU" : player.name}
      </Text>
    </Animated.View>
  );
}
export function IslandScene({
  view,
  width,
  goal,
  onGoal,
  enabled,
}: {
  view: MysteryView;
  width: number;
  goal: Point | null;
  onGoal: (point: Point) => void;
  enabled: boolean;
}) {
  const unit = width / 9,
    height = unit * 7;
  const current = view.players.find((p) => p.id === view.selfId)!;
  const route: Point[] = [current];
  if (goal)
    for (let i = 0; i < 35; i++) {
      const last = route.at(-1)!;
      const step = pathStep(last, goal);
      if (!step) break;
      route.push({ x: last.x + step.x, y: last.y + step.y });
    }
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 25,
        overflow: "hidden",
        backgroundColor: "#B9DDE0",
        borderWidth: 1,
        borderColor: "#94C4C3",
      }}
    >
      <Pressable
        disabled={!enabled}
        accessibilityRole="button"
        accessibilityLabel="Island path. Touch a place to walk there, or use the direction buttons."
        onPress={(e) => {
          const point = {
            x: Math.floor(e.nativeEvent.locationX / unit),
            y: Math.floor(e.nativeEvent.locationY / unit),
          };
          if (walkable(point)) onGoal(point);
        }}
        style={{ width, height }}
      >
        <Svg width={width} height={height} viewBox="0 0 900 700" accessibilityElementsHidden>
          <Path
            d="M5 87q65-23 130 0m624 5q55-20 120 0M28 580q45-20 99 0m636 30q58-21 125 0"
            fill="none"
            stroke="#DDF0E8"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <Path
            d="M85 190Q70 70 180 58L689 67q151-20 147 136l-7 316q20 109-128 115l-511-2Q59 639 79 516Z"
            fill="#F1DBA8"
            stroke="#E1C891"
            strokeWidth="13"
          />
          <Path
            d="M110 199Q90 93 193 88l490 10q117-13 115 112l-5 284q25 106-109 107H207q-116 5-105-97Z"
            fill="#CADCA5"
          />
          <Path
            d="M150 150H750V550H150ZM450 150V550M150 350H750"
            stroke="#ECDDB4"
            strokeWidth="48"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[
            { x: 350, y: 250 },
            { x: 550, y: 250 },
            { x: 350, y: 450 },
            { x: 550, y: 450 },
          ].map((p, i) => (
            <G key={i} transform={`translate(${p.x},${p.y})`}>
              <Ellipse cx="5" cy="21" rx="39" ry="13" fill="#A6C58B" />
              <Path d="M0 17q15-29 3-65" fill="none" stroke="#AF9060" strokeWidth="10" />
              <Path d="M2-35q-52-43-52 4 25-23 52-4-13-56 24-41-20 20-24 41 54-35 49 8-30-18-49-8" fill="#679B70" />
            </G>
          ))}
          <Path d="M94 558 5 610M128 578 37 639" stroke="#A98B60" strokeWidth="18" />
          <Path d="M107 562 20 623" stroke="#C3A674" strokeWidth="58" />
          {goal && (
            <Polyline
              points={route.map((p) => `${(p.x + 0.5) * 100},${(p.y + 0.5) * 100}`).join(" ")}
              stroke="#FFFBEA"
              strokeWidth="9"
              strokeDasharray="7 16"
              strokeLinecap="round"
              fill="none"
            />
          )}
          <Ellipse cx="681" cy="402" rx="20" ry="12" fill="#BDCF94" />
          <Ellipse cx="228" cy="239" rx="16" ry="9" fill="#BDCF94" />
        </Svg>
      </Pressable>
      {PLACES.map((place) => (
        <Pressable
          key={place.id}
          disabled={!enabled}
          onPress={() => onGoal(place)}
          accessibilityRole="button"
          accessibilityLabel={`Walk to ${place.name}`}
          style={{
            position: "absolute",
            left: (place.x + 0.5) * unit - 27,
            top: (place.y + 0.5) * unit - 38,
            width: 54,
            minHeight: 54,
            alignItems: "center",
          }}
        >
          <LandmarkArt
            kind={place.id}
            size={Math.min(52, unit * 1.2)}
            complete={place.id in view.tasks && view.tasks[place.id as keyof typeof view.tasks] === 3}
          />
          <Text
            style={{
              fontSize: 10,
              color: "#244F43",
              fontWeight: "800",
              backgroundColor: "#FFF7D8D9",
              paddingHorizontal: 3,
              borderRadius: 4,
            }}
          >
            {place.name}
          </Text>
        </Pressable>
      ))}
      {view.players
        .filter((player) => player.visible !== false)
        .map((player) => (
          <WalkingPlayer
            key={player.id}
            player={player}
            width={width}
            self={player.id === view.selfId}
            ribbon={(view.adventure?.ribbons[player.id] ?? 0) > view.tick}
          />
        ))}
    </View>
  );
}
