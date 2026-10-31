import { useEffect, useState } from "react";
import { AccessibilityInfo, Easing, Platform } from "react-native";

/** Strong ease-out for entrances and press feedback; never ease-in for interface motion. */
export const easeOut = Easing.bezier(0.23, 1, 0.32, 1);
/** For things already on screen that move or morph. */
export const easeInOut = Easing.bezier(0.77, 0, 0.175, 1);
export const nativeDriver = Platform.OS !== "web";

/** Follows the system Reduce Motion setting. Movement becomes a short fade or nothing; state changes still show. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (live) setReduced(value);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
