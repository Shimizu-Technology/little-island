import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ArcadeScene } from "./Scene";
import type { ArcadeId, WorldId } from "./types";

export type ArcadeSceneProps = { world: WorldId; active: boolean; width: number; height: number };
/** Measure each illustration's own canvas, including map cards. Decorative art never receives touches. */
export function PlayScene({ Scene, game, world = "w1", active = true }: {
  Scene?: React.ComponentType<ArcadeSceneProps>; game: ArcadeId; world?: WorldId; active?: boolean;
}) {
  const [size, setSize] = useState({ width: 390, height: 844 });
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { overflow: "hidden" }]} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}>{Scene ? <Scene world={world} active={active} {...size}/> : <ArcadeScene game={game} world={world} active={active}/>}</View>;
}
