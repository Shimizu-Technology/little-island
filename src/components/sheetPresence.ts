import { useEffect, useSyncExternalStore } from "react";

/**
 * iOS will not present a modal while another is still on screen or animating
 * closed; React would then believe the new sheet is open while nothing shows,
 * leaving the screen unresponsive. Sheets hold a presence token while mounted
 * and for a short settle after they hide; auto-presented sheets wait for none.
 */
const SETTLE_MS = 350;
let held = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());

export function holdSheet(): () => void {
  held++;
  emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    held--;
    emit();
  };
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

/** True when no other sheet or native modal is visible or still dismissing. */
export function useSheetsClear(): boolean {
  return useSyncExternalStore(subscribe, () => held === 0, () => true);
}

/** Hold presence while `shown`, and for a settle period after it hides or unmounts. */
export function useSheetPresence(shown: boolean, enabled = true) {
  useEffect(() => {
    if (!shown || !enabled) return;
    const release = holdSheet();
    return () => { setTimeout(release, SETTLE_MS); };
  }, [shown, enabled]);
}

export const sheetsHeldForTest = () => held;
