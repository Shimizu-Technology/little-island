import React from "react";
import type { BoardProps } from "../../types";
import type { ScienceState } from "../weather-watch/model";
import { ScienceBoard, ScienceArt } from "../weather-watch/ScienceBoard";
export function Board(props: BoardProps<ScienceState>) {
  return <ScienceBoard {...props} game="food-web" />;
}
export function Art({ size }: { size: number }) {
  return <ScienceArt game="food-web" size={size} />;
}
