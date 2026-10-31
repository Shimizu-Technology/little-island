import React from "react";
import { View } from "react-native";
import { C, Copy, PressableScale } from "../../components/ui";
/** Whole words stay intact and all touch targets are at least 44 points. */
export function ReadingText({
  text,
  current,
  highlight,
  onWord,
  compact = false,
  disabled = false,
}: {
  text: string;
  current?: number;
  highlight?: string;
  onWord: (index: number, word: string) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
      {text.split(/\s+/).map((word, index) => {
        const next = current === index,
          read = current !== undefined && index < current;
        const marked = highlight === word.toLowerCase().replace(/[^a-z]/g, "");
        return (
          <PressableScale
            key={`${index}-${word}`}
            accessibilityRole="button"
            accessibilityLabel={`${word}${next ? ", next word" : read ? ", read" : ""}`}
            disabled={disabled}
            accessibilityState={{ selected: next, disabled }}
            onPress={() => onWord(index, word)}
            style={{
              minWidth: 44,
              minHeight: 44,
              paddingHorizontal: 6,
              justifyContent: "center",
              borderRadius: 9,
              backgroundColor: next ? C.gold : marked ? "#F5D3BF" : read ? C.success : C.paper,
              borderWidth: next || marked ? 2 : 1,
              borderColor: next || marked ? C.ink : C.line,
            }}
          >
            <Copy
              style={{ fontSize: compact ? 20 : 24, lineHeight: 32, color: C.ink, fontWeight: next ? "700" : "500" }}
            >
              {word}
            </Copy>
          </PressableScale>
        );
      })}
    </View>
  );
}
