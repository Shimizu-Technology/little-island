import React from "react";
import { TextInput, View } from "react-native";
import { Chip, Copy, styles } from "../components/ui";
import { newMatch, type Match } from "../games/match";
import type { Strength } from "./games/beach-ball/engine";
export type ArcadeFamily = { mode: "solo" | "together"; strength: Strength; names: [string, string] };
export function FamilySetup({ mode, strength, match, onMode, onStrength, onMatch }: {
  mode: ArcadeFamily["mode"]; strength: Strength; match: Match;
  onMode: (mode: ArcadeFamily["mode"]) => void; onStrength: (strength: Strength) => void;
  onMatch: React.Dispatch<React.SetStateAction<Match>>;
}) {
  return <View style={{ width: "100%", gap: 10 }}>
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
      <Chip selected={mode === "solo"} onPress={() => onMode("solo")}>With Bibi</Chip>
      <Chip selected={mode === "together"} onPress={() => onMode("together")}>2 players</Chip>
    </View>
    {mode === "together" ? <>
      <Copy style={{ textAlign: "center" }}>Sit at opposite ends. Both paddles move at once.</Copy>
      {match.names.map((name, i) => <TextInput key={i} accessibilityLabel={`Player ${i + 1} name`} value={name} maxLength={16} style={styles.input}
        onChangeText={value => onMatch(previous => {
          const next = newMatch(previous.names.map((n, j) => i === j ? value : n));
          return { ...next, names: next.names.map((n, j) => i === j ? value : n) as [string, string] };
        })} onEndEditing={() => onMatch(previous => ({ ...previous, names: newMatch(previous.names).names }))}/>)}
      <Copy style={{ textAlign: "center" }}>Family match · {match.wins[0]} : {match.wins[1]}</Copy>
    </> : <View style={{ flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 7 }}>
      {(["gentle", "steady", "zippy"] as const).map(value => <Chip key={value} selected={strength === value} onPress={() => onStrength(value)}>{value === "gentle" ? "• Gentle" : value === "steady" ? "•• Steady" : "••• Zippy"}</Chip>)}
    </View>}
  </View>;
}
