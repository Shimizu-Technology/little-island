import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { Text } from "../components/Text";
import { Button, C, Copy, PressableScale, font } from "../components/ui";
import { other } from "../games/match";
import { Piece } from "./Art";
import { BoardId, engines, Position } from "./index";
import { edgeDots, edgeFromDots } from "./fishing-nets/engine";
import { lines } from "./coconut-drop/engine";
import { coordinate } from "./hidden-canoes/engine";
import { sowPath } from "./shell-pits/engine";
import { urchins } from "./reef-sweep/engine";
type Props = {
  game: BoardId;
  state: Position;
  width: number;
  onMove: (m: number) => void;
  locked?: boolean;
  hint?: number | null;
  flag?: boolean;
  speak: (key: string) => unknown;
};
const tone = ["#805538", "#286B69"];
function NumberText({
  children,
  size = 22,
  color = C.ink,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
}) {
  return (
    <Text style={{ color, fontSize: size, fontFamily: font, fontWeight: "800", textAlign: "center" }}>{children}</Text>
  );
}
export function Boards(props: Props) {
  return props.game === "coconut-drop" ? (
    <Coconuts {...props} />
  ) : props.game === "fishing-nets" ? (
    <Nets {...props} />
  ) : props.game === "shell-pits" ? (
    <Pits {...props} />
  ) : props.game === "hidden-canoes" ? (
    <Canoes {...props} />
  ) : (
    <Reef {...props} />
  );
}
function Coconuts({ state: s, width, onMove, locked, hint }: Props) {
  const cell = Math.min(width, 490) / 7,
    available = engines["coconut-drop"].legal(s);
  const winning =
    typeof s.outcome === "number" ? lines.filter((line) => line.every((i) => s.board[i] === s.outcome)).flat() : [];
  return (
    <View
      style={{ alignSelf: "center", width: cell * 7, borderRadius: 20, backgroundColor: "#D4E2CC", paddingVertical: 8 }}
    >
      <View style={{ flexDirection: "row" }}>
        {Array.from({ length: 7 }, (_, c) => (
          <PressableScale
            key={c}
            accessibilityRole="button"
            accessibilityLabel={`Drop in column ${c + 1}`}
            disabled={locked || !available.includes(c)}
            accessibilityState={{ disabled: !!locked || !available.includes(c) }}
            onPress={() => onMove(c)}
            style={{
              width: cell,
              alignItems: "center",
              borderRadius: 12,
              backgroundColor: hint === c ? "#F4D58F" : undefined,
              paddingVertical: 6,
            }}
          >
            <NumberText size={20} color={available.includes(c) ? C.teal : C.muted}>
              {hint === c ? "↓" : c + 1}
            </NumberText>
            {Array.from({ length: 6 }, (_, r) => {
              const owner = s.board[r * 7 + c];
              return (
                <View
                  key={r}
                  style={{
                    width: cell - 6,
                    height: cell - 6,
                    margin: 3,
                    borderRadius: cell,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: winning.includes(r * 7 + c) ? "#F4D58F" : C.cream,
                    borderWidth: winning.includes(r * 7 + c) ? 3 : 1,
                    borderColor: winning.includes(r * 7 + c) ? "#96601E" : "#B5CBB2",
                  }}
                >
                  {owner !== -1 && <Piece kind="coconut" seat={owner} size={cell - 8} />}
                </View>
              );
            })}
          </PressableScale>
        ))}
      </View>
      <Copy style={{ textAlign: "center", fontSize: 12 }}>Circle coconuts · pointed leaf coconuts</Copy>
    </View>
  );
}
function Nets({ state: s, width, onMove, locked, hint }: Props) {
  const [dot, setDot] = useState<number | null>(null),
    [notice, setNotice] = useState("");
  const n = s.size,
    step = Math.min((width - 44) / n, 74),
    total = step * n + 44,
    offset = 22;
  const xy = (d: number) => ({ x: offset + (d % (n + 1)) * step, y: offset + Math.floor(d / (n + 1)) * step });
  const tie = (d: number) => {
    if (dot === null) {
      setDot(d);
      return;
    }
    if (dot === d) {
      setDot(null);
      return;
    }
    const e = edgeFromDots(n, dot, d);
    if (e === null) {
      setDot(d);
      setNotice("Choose a neighboring dot, across or down.");
      return;
    }
    if (!engines["fishing-nets"].legal(s).includes(e)) {
      setDot(null);
      setNotice("That rope is already tied. Choose another pair of dots.");
      return;
    }
    setDot(null);
    setNotice("");
    onMove(e);
  };
  const hinted: number[] = hint === null || hint === undefined ? [] : edgeDots(n, hint);
  return (
    <View style={{ alignItems: "center", gap: 8 }}>
      <Copy style={{ textAlign: "center", fontSize: 14 }}>
        {notice ||
          (s.outcome !== null
            ? "Every net is tied. Count your reef shapes!"
            : dot === null
              ? "Tap a dot, then its neighbor to tie a rope."
              : "Now tap a neighboring dot.")}
      </Copy>
      <View style={{ width: total, height: total, backgroundColor: "#E0EFEB", borderRadius: 20 }}>
        <Svg pointerEvents="none" width={total} height={total} accessible={false}>
          {s.marks.map((owner, b) => {
            const p = xy(Math.floor(b / n) * (n + 1) + (b % n));
            return (
              <React.Fragment key={b}>
                <Rect
                  x={p.x + 4}
                  y={p.y + 4}
                  width={step - 8}
                  height={step - 8}
                  rx={8}
                  fill={owner === 0 ? "#EBD7B3" : owner === 1 ? "#A3D0C5" : "#D4E6DF"}
                />
                {owner >= 0 &&
                  (owner === 0 ? (
                    <Circle cx={p.x + step / 2} cy={p.y + step / 2} r={7} fill={tone[owner]} />
                  ) : (
                    <Rect x={p.x + step / 2 - 6} y={p.y + step / 2 - 6} width={12} height={12} fill={tone[owner]} />
                  ))}
              </React.Fragment>
            );
          })}
          {s.board.map((owner, e) => {
            const [a, b] = edgeDots(n, e),
              p = xy(a),
              q = xy(b);
            return (
              <Line
                key={e}
                x1={p.x}
                y1={p.y}
                x2={q.x}
                y2={q.y}
                stroke={e === hint ? "#BD7C28" : owner < 0 ? "#A5C6B9" : tone[owner]}
                strokeWidth={owner < 0 ? 2 : 5}
                strokeDasharray={owner < 0 ? "3 5" : undefined}
                strokeLinecap="round"
              />
            );
          })}
        </Svg>
        {Array.from({ length: (n + 1) ** 2 }, (_, d) => {
          const p = xy(d);
          return (
            <PressableScale
              key={d}
              accessibilityRole="button"
              accessibilityLabel={`Dot ${String.fromCharCode(65 + (d % (n + 1)))}${Math.floor(d / (n + 1)) + 1}`}
              disabled={locked || s.outcome !== null}
              accessibilityState={{ selected: dot === d }}
              onPress={() => tie(d)}
              style={{
                position: "absolute",
                left: p.x - 22,
                top: p.y - 22,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 22,
                borderWidth: dot === d || hinted.includes(d) ? 3 : 0,
                borderColor: dot === d ? C.teal : "#BD7C28",
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: C.ink,
                  borderWidth: 2,
                  borderColor: C.paper,
                }}
              />
            </PressableScale>
          );
        })}
      </View>
      <Copy style={{ fontSize: 14 }}>
        ● {s.scores[0]} nets · ■ {s.scores[1]} nets
      </Copy>
    </View>
  );
}
function Pits({ state: s, width, onMove, locked, hint, speak }: Props) {
  const [selected, setSelected] = useState<number | null>(null),
    [count, setCount] = useState(0),
    [counting, setCounting] = useState(false);
  const pit = selected ?? hint ?? null,
    path = pit === null ? [] : sowPath(s, pit),
    last = path[path.length - 1],
    step = Math.min((width - 12) / 6, 72),
    legal = engines["shell-pits"].legal(s);
  useEffect(() => {
    if (!counting || !path.length) return;
    let at = 0;
    const timer = setInterval(() => {
      at++;
      setCount(at);
      speak(`board-count-${at}`);
      if (at >= path.length) {
        clearInterval(timer);
        setCounting(false);
      }
    }, 750);
    return () => clearInterval(timer);
  }, [counting, path.length, speak]);
  const render = (i: number) => (
    <PressableScale
      key={i}
      accessibilityRole="button"
      accessibilityLabel={`Pit ${i < 6 ? i + 1 : i - 6}, ${i < 6 ? "circle" : "square"} side, ${s.board[i]} shells`}
      accessibilityState={{ disabled: !!locked || !legal.includes(i), selected: pit === i }}
      disabled={locked || !legal.includes(i)}
      onPress={() => {
        setSelected(i);
        setCount(0);
        setCounting(false);
      }}
      style={{
        width: step - 2,
        minHeight: 80,
        borderRadius: 26,
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: pit === i || last === i ? 3 : 1,
        borderColor: last === i ? "#B97A26" : pit === i ? C.teal : "#B79A70",
        backgroundColor: count > 0 && path[count - 1] === i ? "#F8D98A" : i < 6 ? "#EEE0C2" : "#D5E6DA",
      }}
    >
      <Piece kind="shell" size={Math.min(30, step - 10)} />
      <NumberText size={23}>{s.board[i]}</NumberText>
      <NumberText size={11}>
        {i < 6 ? "●" : "■"}
        {i < 6 ? i + 1 : i - 6}
      </NumberText>
    </PressableScale>
  );
  return (
    <View
      style={{
        alignSelf: "center",
        width: step * 6 + 12,
        gap: 12,
        padding: 6,
        borderRadius: 24,
        backgroundColor: "#DFC69D",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 }}>
        {[13, 6].map((i) => (
          <View
            key={i}
            style={{
              padding: 8,
              borderRadius: 16,
              borderWidth: 3,
              borderColor: last === i ? "#B97A26" : "transparent",
              backgroundColor: count > 0 && path[count - 1] === i ? "#F8D98A" : "#EFE2C8",
            }}
          >
            <NumberText size={17}>
              {i === 13 ? "■" : "●"} Store {s.board[i]}
            </NumberText>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>{[12, 11, 10, 9, 8, 7].map(render)}</View>
      <Copy style={{ textAlign: "center", fontSize: 13 }}>← square side · sow around →</Copy>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>{[0, 1, 2, 3, 4, 5].map(render)}</View>
      {pit !== null && path.length > 0 ? (
        <View style={{ gap: 8, padding: 6 }}>
          <Copy style={{ fontSize: 14, color: C.ink }}>
            {s.board[pit]} shells. Last shell →{" "}
            {last === 6
              ? "circle store"
              : last === 13
                ? "square store"
                : `${last < 6 ? "circle" : "square"} pit ${last < 6 ? last + 1 : last - 6}`}
            .{last === 6 + s.turn * 7 ? " Another turn!" : ""}
          </Copy>
          <Copy style={{ fontSize: 13 }}>
            {count ? `Counting: ${count} of ${path.length}` : "The gold ring marks the last pit."}
          </Copy>
          <Button
            quiet
            compact
            disabled={counting || locked}
            onPress={() => {
              setCount(0);
              setCounting(true);
            }}
          >
            Count shells aloud
          </Button>
          <Button disabled={locked} onPress={() => onMove(pit)}>
            Sow shells
          </Button>
        </View>
      ) : (
        <Copy style={{ textAlign: "center", fontSize: 14 }}>
          {s.outcome !== null
            ? "All shells are resting in the stores."
            : "Choose a pit on your side to preview its shells."}
        </Copy>
      )}
    </View>
  );
}
function Canoes({ state: s, width, onMove, locked, hint }: Props) {
  const [own, setOwn] = useState(false),
    seat = typeof s.outcome === "number" ? s.outcome : s.turn,
    cell = Math.min((width - 26) / 6, 60),
    marks = s.marks.slice(seat * 36, (seat + 1) * 36);
  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        <Button compact quiet onPress={() => setOwn(!own)}>
          {own ? "Back to search" : "My private canoe chart"}
        </Button>
      </View>
      <Copy style={{ textAlign: "center", fontSize: 14 }}>
        {own ? "Your canoes · keep this chart to yourself" : "Search the other lagoon · one coordinate per turn"}
      </Copy>
      <View style={{ width: cell * 6 + 26, backgroundColor: "#D8EBEF", borderRadius: 18, paddingBottom: 6 }}>
        <View style={{ flexDirection: "row", paddingLeft: 26 }}>
          {"ABCDEF".split("").map((c) => (
            <View key={c} style={{ width: cell }}>
              <NumberText size={16}>{c}</NumberText>
            </View>
          ))}
        </View>
        {Array.from({ length: 6 }, (_, r) => (
          <View key={r} style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 26 }}>
              <NumberText size={16}>{r + 1}</NumberText>
            </View>
            {Array.from({ length: 6 }, (_, c) => {
              const i = r * 6 + c,
                found = own ? s.board[seat * 36 + i] > 0 : marks[i] === 2,
                visited = own ? s.marks[other(seat) * 36 + i] > 0 : marks[i] > 0;
              return (
                <PressableScale
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={`${own ? "Own chart" : "Search"} ${coordinate(i)}${found ? ", canoe" : visited ? ", open water" : ""}`}
                  disabled={locked || own || visited || s.outcome !== null}
                  onPress={() => onMove(i)}
                  style={{
                    width: cell - 2,
                    height: cell - 2,
                    margin: 1,
                    backgroundColor: hint === i ? "#F1D495" : found ? "#ECD9B6" : visited ? "#F3F5ED" : "#BCDCE4",
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: hint === i ? 3 : 1,
                    borderColor: hint === i ? "#BA7D2B" : "#90B8C2",
                  }}
                >
                  {found ? (
                    <Piece kind="canoe" size={cell - 10} />
                  ) : visited ? (
                    <Piece kind="ripple" size={cell - 12} />
                  ) : (
                    <Text style={{ color: C.teal, fontSize: 12 }}>~</Text>
                  )}
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
      <Copy style={{ fontSize: 14 }}>{s.scores[seat]} of 7 canoe spaces found</Copy>
    </View>
  );
}
function Reef({ state: s, width, onMove, locked, hint, flag }: Props) {
  const cell = Math.min(width / s.size, 58),
    count = s.board.length;
  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <Copy style={{ fontSize: 14 }}>
        {urchins(s.size)} sea urchins · {s.marks.filter((m) => m === 2).length} flags · {s.scores[0]} pearls
      </Copy>
      <View style={{ width: cell * s.size, backgroundColor: "#CADFD0", borderRadius: 18, overflow: "hidden" }}>
        {Array.from({ length: s.size }, (_, r) => (
          <View key={r} style={{ flexDirection: "row" }}>
            {Array.from({ length: s.size }, (_, c) => {
              const i = r * s.size + c,
                revealed = s.marks[i] === 1,
                marked = s.marks[i] === 2,
                showUrchin = s.outcome !== null && s.board[i] === -1,
                chosen = hint !== null && hint !== undefined && hint % count === i;
              return (
                <PressableScale
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={`Reef ${String.fromCharCode(65 + c)}${r + 1}, ${showUrchin ? "sea urchin" : revealed ? `${s.board[i]} neighboring urchins` : marked ? "flag" : "closed"}`}
                  disabled={locked || revealed || s.outcome !== null}
                  onPress={() => onMove(i + (flag ? count : 0))}
                  style={{
                    width: cell - 4,
                    height: cell - 4,
                    minHeight: 40,
                    margin: 2,
                    borderRadius: 10,
                    backgroundColor: revealed ? "#FAF5E6" : marked ? "#EDDBB6" : "#64947C",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: chosen ? 3 : 1,
                    borderColor: chosen ? "#B77725" : "#36674F",
                  }}
                >
                  {showUrchin ? (
                    <Piece kind="urchin" size={cell - 10} />
                  ) : marked ? (
                    <Piece kind="flag" size={cell - 10} />
                  ) : revealed ? (
                    s.board[i] === 0 ? (
                      <Piece kind="pearl" size={cell - 14} />
                    ) : (
                      <NumberText color={s.board[i] === 1 ? C.blue : s.board[i] === 2 ? C.teal : C.error}>
                        {s.board[i]}
                      </NumberText>
                    )
                  ) : (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#D1E7C8" }} />
                  )}
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
      <Copy style={{ fontSize: 14, textAlign: "center" }}>Numbers count sea urchins in all touching spaces.</Copy>
    </View>
  );
}
/** Shared-engine teaching positions never replace the family's saved board. */
export function demoPosition(game: BoardId, step: number): Position {
  const engine = engines[game];
  let s = engine.create(4);
  const moves =
    game === "coconut-drop"
      ? [0, 6, 1, 6, 2, 5, 3]
      : game === "fishing-nets"
        ? [0, 3, 12, 13]
        : game === "shell-pits"
          ? [2]
          : game === "hidden-canoes"
            ? [14]
            : [12];
  const baseline = game === "coconut-drop" ? 6 : game === "fishing-nets" ? 3 : 0;
  for (const m of moves.slice(0, baseline + step)) s = engine.move(s, m);
  return s;
}
