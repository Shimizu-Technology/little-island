import React, { memo } from 'react';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { HIDDEN_POSE, type SpritePose } from '../../poses';
/** Same fixed sprite contract, with a discrete camera-depth painter order. */
export const DepthSprite = memo(function DepthSprite({ poses, index, width, height, children, rotate = true }: {
  poses: SharedValue<SpritePose[]>;
  index: number;
  width: number;
  height: number;
  children: React.ReactNode;
  /** A rolling coconut rotates its solid art separately from its ground shadow. */
  rotate?: boolean;
}) {
  const slot = useSharedValue<SpritePose>(HIDDEN_POSE);
  useAnimatedReaction(() => poses.value[index] ?? HIDDEN_POSE, p => {
    const old = slot.value;
    if (old.x !== p.x || old.y !== p.y || old.scale !== p.scale || old.angle !== p.angle || old.opacity !== p.opacity || old.frame !== p.frame) slot.set(p);
  }, [poses, index]);
  const style = useAnimatedStyle(() => {
    const p = slot.value;
    return {
      zIndex: p.frame ?? 0,
      opacity: p.opacity ?? 1,
      transform: [{ translateX: p.x }, { translateY: p.y }, { rotate: `${rotate ? p.angle ?? 0 : 0}rad` }, { scale: p.scale ?? 1 }],
    };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width, height }, style]}>{children}</Animated.View>;
});
