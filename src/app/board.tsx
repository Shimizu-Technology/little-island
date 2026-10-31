import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import { isBoardId } from "../board";
import { BoardScreen } from "../board/Screen";
export default function BoardRoute() {
  const { game } = useLocalSearchParams<{ game?: string }>();
  return isBoardId(game) ? <BoardScreen key={game} game={game} /> : <Redirect href="/" />;
}
