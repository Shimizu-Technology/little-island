import React from "react";
import type { BoardProps } from "../../types";
import type { ScienceState } from "./model";
import { ScienceBoard, ScienceArt } from "./ScienceBoard";
export function Board(props: BoardProps<ScienceState>) {
  return <ScienceBoard {...props} game="weather-watch" />;
}
export function Art({ size }: { size: number }) {
  return <ScienceArt game="weather-watch" size={size} />;
}
