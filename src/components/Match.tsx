import { learnerPortraitOwner } from "../islander/reactions";
import { IslanderPortrait } from "../islander/Companion";
import { useStore } from "../state/Store";
import { personFor } from "../personalization/model";
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { Text } from "./Text";
import { C, Chip, Copy, font, styles } from "./ui";
import { Match, NAME_MAX, RoundResult, Seat, settle } from "../games/match";

/**
 * Running family score. Shows the tally including a finished current round,
 * and rings whoever's turn it is. `marks` render each player's piece (X/O, colour…).
 */
export function Scoreboard({
  match,
  result = null,
  active = null,
  marks,
  solo = false,
}: {
  match: Match;
  solo?: boolean;
  result?: RoundResult;
  active?: Seat | null;
  marks?: [React.ReactNode, React.ReactNode];
}) {
  const { save } = useStore();
  const shown = settle(match, result);
  const winner = typeof result === "number" ? result : null;
  const summary =
    `${shown.names[0]} ${shown.wins[0]}, ${shown.names[1]} ${shown.wins[1]}` +
    (shown.draws ? `, ${shown.draws} ${shown.draws === 1 ? "draw" : "draws"}` : "") +
    (active !== null ? `. ${shown.names[active]}’s turn` : "");
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Score: ${summary}`}
      accessibilityLiveRegion="polite"
      style={{ flexDirection: "row", alignItems: "stretch", gap: 8, marginBottom: 12, alignSelf: "stretch" }}
    >
      {([0, 1] as const).map((seat) => {
        const on = active === seat,
          won = winner === seat;
        return (
          <View
            key={seat}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: on ? C.teal : won ? "#91B488" : "transparent",
              backgroundColor: won ? C.success : on ? C.paper : C.sand,
            }}
          >
            {(() => {
              const name = shown.names[seat];
              const owner = learnerPortraitOwner(name, save.learning?.people ?? [], save.learning?.active ?? "family", solo && seat === 1);
              return owner ? <IslanderPortrait look={personFor(save, owner).look}/> : marks?.[seat];
            })()}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ fontFamily: font, fontSize: 15, fontWeight: "700", color: C.ink }}>
                {shown.names[seat]}
              </Text>
              <Text style={{ fontFamily: font, fontSize: 12, color: on ? C.teal : C.muted, fontWeight: on ? "700" : "400" }}>
                {won ? "Won this round" : on ? "Your turn" : " "}
              </Text>
            </View>
            <Text style={{ fontFamily: font, fontSize: 26, fontWeight: "800", color: C.ink, fontVariant: ["tabular-nums"] }}>
              {shown.wins[seat]}
            </Text>
          </View>
        );
      })}
      {shown.draws > 0 && (
        <View style={{ justifyContent: "center", alignItems: "center", paddingHorizontal: 4 }}>
          <Text style={{ fontFamily: font, fontSize: 18, fontWeight: "800", color: C.muted }}>{shown.draws}</Text>
          <Text style={{ fontFamily: font, fontSize: 11, color: C.muted }}>{shown.draws === 1 ? "draw" : "draws"}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Two name fields with remembered family names as one-tap chips.
 * Empty fields fall back to "Player 1"/"Player 2" when the round starts.
 */
export function PlayerNames({
  names,
  onChange,
  remembered = [],
  labels = ["First player", "Second player"],
  marks,
}: {
  names: [string, string];
  onChange: (names: [string, string]) => void;
  remembered?: string[];
  labels?: [string, string];
  marks?: [React.ReactNode, React.ReactNode];
}) {
  const [target, setTarget] = useState<Seat>(0);
  const set = (seat: Seat, value: string) => {
    const next: [string, string] = [...names];
    next[seat] = value;
    onChange(next);
  };
  return (
    <View style={{ gap: 10 }}>
      {([0, 1] as const).map((seat) => (
        <View key={seat} style={[styles.row, { gap: 10 }]}>
          {marks && <View style={{ width: 36, alignItems: "center" }}>{marks[seat]}</View>}
          <TextInput
            accessibilityLabel={labels[seat]}
            placeholder={labels[seat]}
            placeholderTextColor="#8A958F"
            value={names[seat]}
            onFocus={() => setTarget(seat)}
            onChangeText={(value) => set(seat, value)}
            maxLength={NAME_MAX + 4}
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            returnKeyType={seat === 0 ? "next" : "done"}
            style={[styles.input, { flex: 1, borderColor: target === seat ? C.teal : C.line, minHeight: 48, paddingVertical: 11 }]}
          />
        </View>
      ))}
      {remembered.length > 0 && (
        <View style={{ gap: 6 }}>
          <Copy style={{ fontSize: 13, lineHeight: 18 }}>Tap a name to fill {labels[target].toLowerCase()}:</Copy>
          <View style={[styles.row, { flexWrap: "wrap", gap: 8 }]}>
            {remembered.map((name) => (
              <Chip
                key={name}
                selected={names[target] === name}
                onPress={() => {
                  set(target, name);
                  setTarget(target === 0 ? 1 : 0);
                }}
              >
                {name}
              </Chip>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
