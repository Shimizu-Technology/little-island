import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export type Feel = "tap" | "select" | "success" | "warning";

/**
 * Light physical confirmation on iPhone. iPad has no Taptic Engine and the system
 * setting (Settings → Sounds & Haptics) can turn it off, so nothing depends on it.
 * Web is skipped: browser vibration is unreliable and can surprise a child.
 */
export function feel(kind: Feel) {
  if (Platform.OS === "web") return;
  try {
    const done =
      kind === "success"
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : kind === "warning"
          ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          : kind === "select"
            ? Haptics.selectionAsync()
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void done.catch(() => {});
  } catch {
    /* Haptics are optional feedback. */
  }
}

/** Feedback tones double as haptic cues so every game gets the same feel. */
export const toneFeel: Record<string, Feel> = { tap: "tap", match: "select", win: "success" };
