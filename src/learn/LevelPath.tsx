import React from "react";
import { View } from "react-native";
import { C, Copy, Heading, PressableScale } from "../components/ui";
import { levelInfo, levelNumbers, levelTitle, type LearningLevel } from "./levels";
import type { LearnId } from "./types";

/** Five beach stones, all reachable. Selection never replaces a round until Start. */
export function LevelPath({ game, level, onChoose }: { game: LearnId; level: LearningLevel; onChoose: (level: LearningLevel) => void }) {
  return <View style={{ gap: 12, alignSelf: "stretch", backgroundColor: "#F6EFD9", padding: 16, borderRadius: 25 }}>
    <Heading style={{ fontSize: 22 }}>Your island path</Heading>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 3 }} accessibilityRole="radiogroup" accessibilityLabel="Choose a learning level">
      <View pointerEvents="none" style={{ position: "absolute", left: 12, right: 12, top: 26, height: 5, borderRadius: 4, backgroundColor: "#D6C7A7" }}/>
      {levelNumbers.map(n => <PressableScale key={n} accessibilityRole="radio" accessibilityLabel={`Choose ${levelTitle(game, n)}`} accessibilityState={{ checked: level === n }} aria-checked={level === n} onPress={() => onChoose(n)} style={{ minWidth: 45, minHeight: 56, flex: 1, maxWidth: 76, borderRadius: 28, borderWidth: level === n ? 3 : 2, borderColor: level === n ? C.teal : "#CDBF9D", backgroundColor: level === n ? C.teal : C.paper, alignItems: "center", justifyContent: "center", shadowColor: "#6A5A3A", shadowOpacity: 0.16, shadowOffset: { width: 0, height: 4 }, shadowRadius: 1, elevation: 3 }}>
        <Copy style={{ fontSize: 12, lineHeight: 14, color: level === n ? "#FFE29A" : C.gold }}>★</Copy>
        <Copy style={{ fontSize: 20, lineHeight: 24, fontWeight: "900", color: level === n ? C.paper : C.ink }}>{n}</Copy>
      </PressableScale>)}
    </View>
    <Heading style={{ fontSize: 19 }}>{levelTitle(game, level)}</Heading>
    <Copy>{levelInfo(game, level).description}</Copy>
    <Copy style={{ fontSize: 13 }}>Every stone is open. Choose where to play.</Copy>
  </View>;
}
