import React from "react";
import { View } from "react-native";
import { Button, Copy, Heading } from "../components/ui";

export type ArcadeTeachProps = {
  learning: boolean; together: boolean; goal: string;
  onTone: (tone: string, haptic?: boolean) => void;
};
/** Game demos supply only their teaching content; the frame owns the sheet and completion. */
export function PlayTeaching({ children, goal, detail, onHear, onPlay }: {
  children: React.ReactNode; goal: string; detail: string; onHear: () => void; onPlay: () => void;
}) {
  return <View style={{ gap: 16, alignItems: "center" }}>{children}
    <Heading style={{ textAlign: "center", fontSize: 23 }}>{goal}</Heading>
    <Copy style={{ textAlign: "center" }}>{detail}</Copy>
    <Button quiet onPress={onHear}>Hear how to play</Button>
    <Button onPress={onPlay}>I’m ready · let’s play</Button>
  </View>;
}
