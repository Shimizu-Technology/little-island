import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { Text } from "../../../components/Text";
import { Heading } from "../../../components/ui";
import { nativeDriver, useReducedMotion } from "../../../components/motion";
import { GridHero } from "./Art";
export function GridTeaching({ crab, learning }: { crab: boolean; learning: boolean }) {
  const reduced = useReducedMotion(),
    [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const a = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(v, { toValue: 1, duration: 550, useNativeDriver: nativeDriver }),
        Animated.delay(900),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: nativeDriver }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [v, reduced]);
  return (
    <View
      style={{
        width: 280,
        height: 130,
        alignSelf: "center",
        borderRadius: 24,
        backgroundColor: crab ? "#65AFB3" : "#6E9864",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Text style={{ position: "absolute", left: 140, color: "#FFF0C1", fontSize: 35 }}>→</Text>
      <View
        style={{
          position: "absolute",
          left: 200,
          width: 60,
          height: 60,
          backgroundColor: "#FFE6AA",
          borderRadius: 20,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {learning ? <Heading>1</Heading> : <GridHero chick={!crab} crab={crab} size={50} />}
      </View>
      <Animated.View
        style={{
          width: 75,
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [20, 120] }) }],
        }}
      >
        <GridHero crab={crab} size={75} />
      </Animated.View>
    </View>
  );
}
