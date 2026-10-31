import React from "react";
import type { BoardProps } from "../../types";
import { bank, type State } from "./engine";
import { ReadingBoard, Creature } from "../letter-lagoon/ReadingBoard";
export function Board(p: BoardProps<State>) {
  return <ReadingBoard {...p} bank={bank} kind="studio" />;
}
export function Art({ size }: { size: number }) {
  return <Creature size={size} kind="studio" letter="Aa" />;
}
