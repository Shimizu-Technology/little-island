import React, { useMemo } from "react";
import { Platform } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useSharedValue } from "react-native-reanimated";
import { cargoTouch, cargoTap, cargoSpeed } from "./gestures";
/** Recognition/thresholds run on UI. Only changed columns and discrete commands cross to the pure JS rules. */
export function CargoTouch({ active, cell, onGrab, onTouchDown, onColumns, onSoft, onDrop, onTap, children, width, height }: {
  active: boolean; cell: number; width: number; height: number; children: React.ReactNode;
  onGrab: () => void; /** Records which piece the finger landed on; pan activation must not overwrite it. */ onTouchDown: () => void; onColumns: (columns: number) => void; onSoft: (soft: boolean) => void; onDrop: () => void; onTap: () => void;
}) {
  const touch = useSharedValue({ start: 0, time: 0, y: 0, columns: 0, soft: false, dropped: false, distance: 0 });
  const pan = useMemo(() => Gesture.Pan().enabled(active).minDistance(0).maxPointers(1).onBegin(() => { runOnJS(onTouchDown)(); })
    .onStart(() => {
      // eslint-disable-next-line react-hooks/purity -- This runs only on UI-thread gesture start, never during render.
      const now = performance.now();
      touch.set({ start: now, time: now, y: 0, columns: 0, soft: false, dropped: false, distance: 0 });
      runOnJS(onGrab)();
    }).onUpdate(e => {
      const old = touch.value;
      if (old.dropped) return;
      // eslint-disable-next-line react-hooks/purity -- Event-time elapsed duration, inside the UI gesture callback.
      const now = performance.now();
      const next = cargoTouch(e.translationX, e.translationY, now - old.start, cell, cargoSpeed(e.translationY, old.y, now - old.time, e.velocityY));
      const distance = Math.max(old.distance, Math.hypot(e.translationX, e.translationY));
      if (next.columns !== old.columns) runOnJS(onColumns)(next.columns);
      if (next.flick) { runOnJS(onSoft)(false); runOnJS(onDrop)(); }
      else if (next.soft !== old.soft) runOnJS(onSoft)(next.soft);
      touch.set({ ...old, time: now, y: e.translationY, columns: next.columns, soft: next.soft && !next.flick, dropped: next.flick, distance });
    }).onEnd((_, success) => {
      if (cargoTap(touch.value.distance, touch.value.dropped, success)) runOnJS(onTap)();
    }).onFinalize(() => {
      runOnJS(onSoft)(false);
      touch.set({ ...touch.value, soft: false });
    }), [active, cell, touch, onGrab, onTouchDown, onColumns, onSoft, onDrop, onTap]);
  // iOS never activates a Pan for a motionless touch, so a still tap needs its own recognizer.
  // Race: whichever activates first wins; any drag or flick activates the pan and cancels the tap.
  // Record the piece at touch-down so a lock during the tap can never rotate its replacement.
  const tap = useMemo(() => Gesture.Tap().enabled(active).maxDistance(10).maxDuration(300).onBegin(() => { runOnJS(onTouchDown)(); }).onEnd((_, success) => {
    if (success) runOnJS(onTap)();
  }), [active, onTap, onTouchDown]);
  const gesture = useMemo(() => Gesture.Race(pan, tap), [pan, tap]);
  return <GestureDetector gesture={gesture}><Animated.View collapsable={false} testID="cargo-touch" accessible accessibilityRole="button" accessibilityLabel="Cargo board. Tap to rotate. Drag sideways to move. Pull down slowly and hold to fall faster. Flick down to land." onAccessibilityTap={() => { onTouchDown(); onTap(); }} style={{ width, height, ...(Platform.OS === "web" ? { touchAction: "none" as const } : {}) }}>{children}</Animated.View></GestureDetector>;
}
