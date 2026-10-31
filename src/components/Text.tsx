import React, { createContext, forwardRef, useContext } from "react";
import { Text as NativeText, TextProps, useWindowDimensions } from "react-native";

const LayoutScale = createContext(1);
export function TextLayoutProvider({ children }: { children: React.ReactNode }) {
  const { fontScale } = useWindowDimensions();
  return <LayoutScale.Provider value={fontScale}>{children}</LayoutScale.Provider>;
}
/** Refresh native text measurement after a live Dynamic Type change without remounting routes or game state. */
export const Text = forwardRef<NativeText, TextProps>(function Text(props, ref) {
  const fontScale = useContext(LayoutScale);
  return <NativeText key={fontScale} ref={ref} {...props} />;
});
