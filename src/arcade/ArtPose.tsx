import React, { memo } from "react";
import Animated, { useAnimatedProps, type SharedValue } from "react-native-reanimated";
import { Path, type PathProps } from "react-native-svg";
import type { SpritePose } from "./Sprite";

/** Art-only authored frame. No engine state, loop or shared Sprite API changes. */
export type ArtPose = SpritePose & { frame?: number };
const AnimatedPath = Animated.createAnimatedComponent(Path);
/** One path changes only at pose boundaries, rather than mounting every action pose. */
export const PosePath = memo(function PosePath({ poses, index = 0, paths, ...props }: Omit<PathProps, "d"> & {
  poses?: SharedValue<ArtPose[]>;
  index?: number;
  paths: string[];
}) {
  const animatedProps = useAnimatedProps(() => ({
    d: paths[Math.max(0, Math.min(paths.length - 1, poses?.value[index]?.frame ?? 0))],
  }));
  return <AnimatedPath {...props} animatedProps={animatedProps} />;
});
