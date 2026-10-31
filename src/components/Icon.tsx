import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

export type IconName =
  | "back"
  | "sound-on"
  | "sound-off"
  | "help"
  | "star"
  | "star-filled"
  | "up"
  | "down"
  | "left"
  | "right"
  | "undo"
  | "flag"
  | "refresh"
  | "close"
  | "eye"
  | "eye-off";

/** One rounded outline set (24-unit grid, 2px stroke) so controls read as one family instead of text glyphs. */
export function Icon({ name, size = 22, color = "#183F39" }: { name: IconName; size?: number; color?: string }) {
  const stroke = { stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {name === "back" && <Path d="M15 5l-7 7 7 7" {...stroke} />}
      {name === "left" && <Path d="M19 12H5m6-6l-6 6 6 6" {...stroke} />}
      {name === "right" && <Path d="M5 12h14m-6-6l6 6-6 6" {...stroke} />}
      {name === "up" && <Path d="M12 19V5m-6 6l6-6 6 6" {...stroke} />}
      {name === "down" && <Path d="M12 5v14m-6-6l6 6 6-6" {...stroke} />}
      {(name === "sound-on" || name === "sound-off") && (
        <>
          <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" {...stroke} />
          {name === "sound-on" ? (
            <Path d="M15.5 9a4 4 0 010 6m2.5-8.5a7.5 7.5 0 010 11" {...stroke} />
          ) : (
            <Path d="M16 9.5l5 5m0-5l-5 5" {...stroke} />
          )}
        </>
      )}
      {name === "help" && (
        <>
          <Circle cx={12} cy={12} r={9} {...stroke} />
          <Path d="M9.6 9.4a2.5 2.5 0 014.8.9c0 1.7-2.4 2.1-2.4 3.7" {...stroke} />
          <Circle cx={12} cy={17} r={0.6} fill={color} stroke={color} strokeWidth={1} />
        </>
      )}
      {(name === "star" || name === "star-filled") && (
        <Path
          d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"
          {...stroke}
          fill={name === "star-filled" ? color : "none"}
        />
      )}
      {name === "undo" && <Path d="M9 7L4.5 11.5 9 16M5 11.5h9a5 5 0 010 10h-2" {...stroke} />}
      {name === "flag" && <Path d="M6 21V4m0 1h11l-2.5 4L17 13H6" {...stroke} fill={color} fillOpacity={0.9} />}
      {name === "refresh" && <Path d="M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4v4h-4" {...stroke} />}
      {name === "close" && <Path d="M6 6l12 12M18 6L6 18" {...stroke} />}
      {(name === "eye" || name === "eye-off") && (
        <>
          <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" {...stroke} />
          <Circle cx={12} cy={12} r={3} {...stroke} />
          {name === "eye-off" && <Path d="M4 4l16 16" {...stroke} />}
        </>
      )}
    </Svg>
  );
}
