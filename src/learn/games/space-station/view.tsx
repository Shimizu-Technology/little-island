import React from "react";
import type { BoardProps } from "../../types";
import type { ScienceState } from "../weather-watch/model";
import { ScienceBoard, ScienceArt } from "../weather-watch/ScienceBoard";
export function Board(props: BoardProps<ScienceState>) {
  return <ScienceBoard {...props} game="space-station" />;
}
export function Art({ size }: { size: number }) {
  return <ScienceArt game="space-station" size={size} />;
}
