import React from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Copy } from "../components/ui";
import type { BoardProps } from "./types";
import type { LearnView } from "./views";
/** Placeholder until a game's worker replaces its view. Never shipped. */
export const stubView: LearnView = {
  Board: (_: BoardProps<unknown>) => <View style={{ padding: 24 }}><Copy>Coming soon</Copy></View>,
  Art: ({ size }: { size: number }) => <Svg width={size} height={size} viewBox="0 0 100 100"><Circle cx={50} cy={50} r={40} fill="#E6F0EC" stroke="#2F6F6A" strokeWidth={4}/></Svg>,
};
