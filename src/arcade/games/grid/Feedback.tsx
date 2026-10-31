import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { Text } from "../../../components/Text";
import { useReducedMotion } from "../../../components/motion";
/** Local, 450 ms impact particles and score. Never covers the middle of the board with instructions. */
export function GridFeedback({
  event,
  x,
  y,
  unit,
  cols,
  rows,
  kind,
  text = "",
  textWidth = 64,
}: {
  event: number;
  x: number;
  y: number;
  unit: number;
  cols: number;
  rows: number;
  kind: "splash" | "splat" | "score";
  text?: string;
  textWidth?: number;
}) {
  const age = useSharedValue(1),
    reduced = useReducedMotion();
  useEffect(() => {
    if (!event) return;
    age.value = 0;
    age.value = withTiming(1, { duration: 450 });
    return () => cancelAnimation(age);
  }, [event, age]);
  const motion = useAnimatedStyle(() => ({
    opacity: 1 - age.value,
    transform: [{ translateY: reduced ? 0 : -age.value * unit * 0.3 }, { scale: reduced ? 1 : 0.7 + age.value * 0.5 }],
  }));
  if (!event) return null;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <Animated.View
        style={[
          { position: "absolute", left: (x - 0.5) * unit, top: (y - 0.5) * unit, width: unit * 2, height: unit * 2 },
          motion,
        ]}
      >
        <Svg width={unit * 2} height={unit * 2} viewBox="0 0 100 100" accessible={false}>
          {kind === "splash" ? (
            <>
              <Ellipse
                cx={50}
                cy={58}
                rx={35}
                ry={13}
                stroke="#BAF3EF"
                strokeWidth={4}
                fill="#8AE3E8"
                fillOpacity={0.35}
              />
              <Path
                d="M23 48L17 29M39 35L37 16M65 38L74 18M79 49L89 36"
                stroke="#C5FFFF"
                strokeWidth={5}
                strokeLinecap="round"
              />
            </>
          ) : kind === "splat" ? (
            <>
              <Ellipse cx={50} cy={63} rx={39} ry={10} fill="#D8AC79" opacity={0.7}/>
              <Path d="M14 58Q4 36 23 39Q21 20 42 33Q55 10 69 33Q94 27 87 51Q104 66 78 69H27Z" fill="#F7D5A3" stroke="#AC7855" strokeWidth={2}/>
              <Path d="M30 43L22 30M70 44L80 25M48 31V17" stroke="#FFF0CF" strokeWidth={4} strokeLinecap="round"/>
              <Circle cx={12} cy={26} r={4} fill="#E8BD87"/><Circle cx={91} cy={22} r={3} fill="#E8BD87"/>
            </>
          ) : (
            <>
              <Path
                d="M50 12L58 37L85 24L72 47L94 60L67 64L64 88L48 70L25 88L31 62L7 51L34 43L28 21Z"
                fill={kind === "score" ? "#FFE18F" : "#F8B59C"}
                opacity={0.85}
              />
              <Circle cx={20} cy={18} r={4} fill="#FFE9BA" />
              <Circle cx={89} cy={79} r={4} fill="#FFE9BA" />
            </>
          )}
        </Svg>
      </Animated.View>
      {!!text && (
        <Animated.View
          style={[
            {
              position: "absolute",
              left: Math.max(0, Math.min(cols * unit - textWidth, (x + 0.8) * unit)),
              top: Math.max(4, Math.min((rows - 1) * unit, (y - 0.65) * unit)),
              width: textWidth,
            },
            motion,
          ]}
        >
          <Text
            style={{
              color: "#FFF1B0",
              fontWeight: "900",
              fontSize: 20,
              textShadowColor: "#203E4D",
              textShadowRadius: 2,
            }}
          >
            {text}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
