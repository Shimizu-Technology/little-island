import React, { memo } from "react";
import Animated, { type SharedValue, useAnimatedStyle, useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { HIDDEN_POSE, type SpritePose } from "./poses";
export type { SpritePose } from "./poses";
/** Keep art static. Move only this absolute wrapper; no layout or React updates per frame. */
export const ArcadeSprite = memo(function ArcadeSprite({ poses, index, width, height, children }: { poses: SharedValue<SpritePose[]>; index: number; width: number; height: number; children: React.ReactNode }) {
  const slot = useSharedValue<SpritePose>(HIDDEN_POSE);
  // Shared arrays may change every display frame; native styles only change for moving slots.
  useAnimatedReaction(() => poses.value[index] ?? HIDDEN_POSE, p => {
    const old = slot.value;
    if (old.x !== p.x || old.y !== p.y || old.angle !== p.angle || old.scale !== p.scale || old.opacity !== p.opacity) slot.set(p);
  }, [poses, index]);
  const motion = useAnimatedStyle(() => {
    const p = slot.value;
    return { opacity: p?.opacity ?? 1, transform: [{ translateX: p?.x ?? 0 }, { translateY: p?.y ?? 0 }, { rotate: `${p?.angle ?? 0}rad` }, { scale: p?.scale ?? 1 }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width, height }, motion]}>{children}</Animated.View>;
});
