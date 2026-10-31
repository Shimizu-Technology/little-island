import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { Button, C, Copy, PressableScale } from "../../components/ui";
import type { Prediction } from "./science";
export function ChoicePicture({ up, size = 38 }: { up: boolean; size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      accessible
      accessibilityLabel={up ? "Floats or grows" : "Sinks or changes"}
    >
      <Path d="M3 29 Q12 23 22 29 T45 29" stroke={C.blue} strokeWidth="3" fill="none" />
      <Circle cx="24" cy={up ? 16 : 38} r="8" fill={up ? C.teal : C.coral} />
    </Svg>
  );
}
/** Selection is saved before Try becomes available; observation never gates on correctness. */
export function PredictTry({
  choices,
  value,
  onPredict,
  onTry,
  sound,
  promptKey,
  disabled = false,
  showTry = true,
  pictures,
}: {
  choices: [string, string];
  value: Prediction | null;
  onPredict: (p: Prediction) => void;
  onTry: () => void;
  sound: (key: string) => void;
  promptKey: string;
  disabled?: boolean;
  showTry?: boolean;
  pictures?: [React.ReactNode, React.ReactNode];
}) {
  useEffect(() => {
    if (!disabled) sound(promptKey);
  }, [promptKey, sound, disabled]);
  return (
    <View style={{ gap: 8 }}>
      <Copy style={{ fontWeight: "700", color: C.ink }}>What do you think will happen?</Copy>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {choices.map((label, i) => (
          <PressableScale
            key={label}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Predict: ${label}`}
            accessibilityState={{ selected: value === i, disabled }}
            onPress={() => onPredict(i as Prediction)}
            style={{
              flex: 1,
              minHeight: 64,
              borderRadius: 14,
              padding: 6,
              backgroundColor: value === i ? C.soft : C.paper,
              borderColor: value === i ? C.teal : C.line,
              borderWidth: 2,
              alignItems: "center",
            }}
          >
            {pictures?.[i] ?? <ChoicePicture up={i === 0} />}
            <Copy style={{ fontSize: 14, textAlign: "center" }}>{label}</Copy>
          </PressableScale>
        ))}
      </View>
      {showTry && (
        <Button compact disabled={disabled || value === null} onPress={onTry}>
          Try it
        </Button>
      )}
    </View>
  );
}
