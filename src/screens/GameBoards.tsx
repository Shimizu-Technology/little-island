import { WordPicture } from "../learn/games/hafa-adai/pictures";
import { Text } from "../components/Text";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { GameState } from "../games";
import {
  TicState,
  ticChoice,
  ticMove,
  ticOutcome,
  ticTurn,
  ticUndo,
  ticHintReason,
  ticResult,
  ticXSeat,
  lines,
} from "../games/tic";
import { WordState, wordTiles, wordRules, wordStatus, wrongLetters } from "../games/words";
import { HangmanFigure } from "../components/HangmanFigure";
import { MemoryState, chamoruCard, closeMismatch, flipCard, memoryDone, memoryResult, memoryUndo } from "../games/memory";
import {
  checkersResultSeat,
  CheckersState,
  CheckersMove,
  checkersChoice,
  checkersRules,
  checkersLesson,
  checkersMoves,
  checkersMove,
  checkersUndo,
  finishCheckersLessons,
  LESSONS,
  row,
  col,
} from "../games/checkers";
import { MazeState, directions, mazeDone, mazeMove, mazeRoute } from "../games/maze";
import {
  NumbersState,
  numberAdvice,
  remainingTotal,
  needsPracticeRoll,
  closeNumbers,
  numberChoices,
  numberLimit,
  numberTarget,
  numbersStatus,
  rollNumbers,
  selectNumber,
  undoNumbers,
} from "../games/numbers";
import { Button, C, Controls, Copy, Status, font, PressableScale, IconButton } from "../components/ui";
import { Scoreboard } from "../components/Match";
import { newMatch } from "../games/match";
import { Icon } from "../components/Icon";
import { feel } from "../components/feel";
import { easeOut, nativeDriver, useReducedMotion } from "../components/motion";
import { Symbol, TicMark } from "../components/Art";
export type Sound = (key: string) => void;
type Props<S extends GameState> = {
  state: S;
  commit: (next: S) => void;
  width: number;
  sound: Sound;
  help: boolean;
  active: boolean;
};
const coords = (i: number) => `${String.fromCharCode(65 + col(i))}${8 - row(i)}`;
function Cell({
  label,
  onPress,
  children,
  style,
  disabled = false,
  selected = false,
}: {
  label: string;
  onPress: () => void;
  children?: React.ReactNode;
  style?: object;
  disabled?: boolean;
  selected?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={(event) => {
        // A pointer-selected cell may disable itself before the browser emits blur.
        // Clear that pointer focus first; keyboard activation keeps its focus ring.
        if (Platform.OS === "web" && (event.nativeEvent as unknown as { detail?: number }).detail) {
          (event.currentTarget as unknown as { blur?: () => void }).blur?.();
        }
        onPress();
      }}
      style={[S.cell, style]}
    >
      {children}
    </PressableScale>
  );
}
function BoardArea({ children }: { children: React.ReactNode }) {
  return <View style={{ alignItems: "center", gap: 10 }}>{children}</View>;
}
/** Physical board stays left in wide landscape; decisions stay within easy reach on the right. */
function BoardLayout({ children, clueFirst = false }: { children: React.ReactNode; clueFirst?: boolean }) {
  const { width, height } = useWindowDimensions(),
    wide = width >= 900 && width > height;
  const items = React.Children.toArray(children),
    board = items.filter((item) => React.isValidElement(item) && item.type === BoardArea),
    rest = items.filter((item) => !board.includes(item));
  const scores: React.ReactNode[] = [];
  const landscapeBoard = board.map((item) => {
    const area = item as React.ReactElement<{ children: React.ReactNode }>;
    const pieces = React.Children.toArray(area.props.children);
    scores.push(...pieces.filter((piece) => React.isValidElement(piece) && piece.type === Scoreboard));
    return React.cloneElement(
      area,
      {},
      pieces.filter((piece) => !(React.isValidElement(piece) && piece.type === Scoreboard))
    );
  });
  return wide ? (
    <View style={{ flexDirection: "row", gap: 24, paddingHorizontal: 12, alignItems: "flex-start" }}>
      <View style={{ flex: 1.35, minWidth: 0 }}>{landscapeBoard}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        {scores}
        {rest}
      </View>
    </View>
  ) : (
    <View style={{ gap: 4 }}>
      {clueFirst && rest[0]}
      {board}
      {clueFirst ? rest.slice(1) : rest}
    </View>
  );
}
function MarkEntrance({ mark, size }: { mark: "X" | "O"; size: number }) {
  const reduced = useReducedMotion(),
    [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: reduced ? 0 : 150,
      easing: easeOut,
      useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [value, reduced]);
  return (
    <Animated.View
      style={{
        opacity: value,
        transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
      }}
    >
      <TicMark mark={mark} size={size} />
    </Animated.View>
  );
}
function WinningLine({ cells, size, cell }: { cells: number[]; size: number; cell: number }) {
  const reduced = useReducedMotion(),
    [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: reduced ? 0 : 250,
      easing: easeOut,
      useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [value, reduced]);
  const a = cells[0],
    b = cells[2],
    x = 13 + (a % 3) * (cell + 8) + cell / 2,
    y = 13 + Math.floor(a / 3) * (cell + 8) + cell / 2;
  const dx = ((b % 3) - (a % 3)) * (cell + 8),
    dy = (Math.floor(b / 3) - Math.floor(a / 3)) * (cell + 8),
    length = Math.hypot(dx, dy),
    angle = Math.atan2(dy, dx);
  return (
    <View pointerEvents="none" style={{ position: "absolute", width: size, height: size, left: 0, top: 0 }}>
      <Animated.View
        style={{
          position: "absolute",
          left: x + dx / 2 - length / 2,
          top: y + dy / 2 - 3,
          width: length,
          height: 6,
          borderRadius: 3,
          backgroundColor: C.teal,
          opacity: value,
          transform: [{ rotate: `${angle}rad` }, { scaleX: value }],
        }}
      />
    </View>
  );
}
function MemoryFace({ open, children }: { open: boolean; children: React.ReactNode }) {
  const reduced = useReducedMotion(),
    [value] = useState(() => new Animated.Value(open ? 1 : 0));
  useEffect(() => {
    const animation = Animated.timing(value, {
      toValue: open ? 1 : 0,
      duration: reduced ? 0 : 200,
      easing: easeOut,
      useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [open, reduced, value]);
  return (
    <Animated.View
      style={{
        transform: reduced
          ? []
          : [
              { perspective: 700 },
              {
                rotateY: value.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ["0deg", "90deg", "0deg"],
                }),
              },
            ],
      }}
    >
      {children}
    </Animated.View>
  );
}
function LetterKey({
  letter,
  used,
  correct,
  done,
  onPress,
  size,
  fontScale,
}: {
  letter: string;
  used: boolean;
  correct: boolean;
  done: boolean;
  onPress: () => void;
  size: number;
  fontScale: number;
}) {
  const reduced = useReducedMotion(),
    [shake] = useState(() => new Animated.Value(0));
  const previous = useRef(used);
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    if (used && !previous.current && !correct && !reduced) {
      animation = Animated.sequence(
        [2, -3, 2, 0].map((toValue) =>
          Animated.timing(shake, { toValue, duration: 45, useNativeDriver: nativeDriver })
        )
      );
      animation.start();
    }
    previous.current = used;
    return () => animation?.stop();
  }, [used, correct, reduced, shake]);
  return (
    <Animated.View style={{ transform: [{ translateX: shake }] }}>
      <Cell
        label={`Letter ${letter}${used ? (correct ? ", found in word" : ", already tried") : ""}`}
        disabled={used || done}
        onPress={onPress}
        style={{
          width: size,
          height: Math.max(44, 19 * fontScale + 16),
          borderWidth: 1,
          borderColor: used ? "transparent" : C.line,
          borderRadius: 12,
          backgroundColor: correct ? C.success : used ? "#EEEDE6" : C.paper,
        }}
      >
        <Text
          style={{
            fontFamily: font,
            fontSize: 19,
            fontWeight: "800",
            color: used && !correct ? C.muted : C.ink,
          }}
        >
          {letter}
        </Text>
      </Cell>
    </Animated.View>
  );
}
export function TicBoard({ state: s, commit, width, sound, active }: Props<TicState>) {
  const outcome = ticOutcome(s.board),
    turn = ticTurn(s.board, s.first),
    computer = s.options.mode === "solo" && turn !== s.human && !outcome;
  // A hint belongs to the position it was asked for; any move or undo makes it stale.
  const [asked, setAsked] = useState<{ square: number | null; at: number } | null>(null);
  const hint = asked && asked.at === s.history.length ? asked.square : null;
  useEffect(() => {
    if (!computer || !active) return;
    const timer = setTimeout(() => {
      const index = ticChoice(s);
      if (index !== null) commit(ticMove(s, index));
    }, 400);
    return () => clearTimeout(timer);
  }, [s, computer, commit, active]);
  const winning =
    lines.find(([a, b, c]) => s.board[a] && s.board[a] === s.board[b] && s.board[a] === s.board[c]) ?? [];
  const { height } = useWindowDimensions();
  // Fit short windows, but never below a comfortable touch size; the page scrolls instead.
  const size = Math.max(Math.min(width, 560, height - 290), Math.min(width, 264));
  const cellSize = (size - 26 - 16) / 3;
  const title =
    outcome === "draw"
      ? "A good draw!"
      : outcome
        ? s.options.mode === "solo"
          ? outcome === s.human
            ? "You made a line!"
            : "Your island friend made a line!"
          : `${(s.match?.names ?? ["Player 1", "Player 2"])[outcome === "X" ? ticXSeat(s) : ticXSeat(s) === 0 ? 1 : 0]} made a line!`
        : computer
          ? "Your island friend is thinking…"
          : s.options.mode === "solo"
            ? `Your turn · ${s.human}`
            : `${(s.match?.names ?? ["Player 1", "Player 2"])[turn === "X" ? ticXSeat(s) : ticXSeat(s) === 0 ? 1 : 0]}’s turn · ${turn}`;
  return (
    <BoardLayout>
      <Status
        title={title}
        detail={
          outcome
            ? "Try another round, or choose a different game."
            : "Make three in a row, across, down, or diagonally."
        }
        success={!!outcome}
      />
      <BoardArea>
        <Scoreboard solo={s.options.mode === "solo"}
          match={s.match ?? newMatch(s.options.mode === "solo" ? ["You", "Island friend"] : undefined)}
          result={ticResult(s)}
          active={outcome ? null : turn === "X" ? ticXSeat(s) : ticXSeat(s) === 0 ? 1 : 0}
          marks={
            ticXSeat(s) === 0
              ? [<TicMark key="X" mark="X" size={24} />, <TicMark key="O" mark="O" size={24} />]
              : [<TicMark key="O" mark="O" size={24} />, <TicMark key="X" mark="X" size={24} />]
          }
        />
        <View style={[S.tic, { width: size, height: size }]}>
          {s.board.map((mark, i) => (
            <Cell
              key={i}
              label={`Square ${i + 1}, ${mark ?? "empty"}${hint === i ? ", suggested move" : ""}${winning.includes(i) ? ", winning line" : ""}`}
              disabled={!!mark || computer || !!outcome}
              onPress={() => {
                commit(ticMove(s, i));
                sound("tap");
              }}
              style={{
                width: cellSize,
                height: cellSize,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: winning.includes(i) ? "#91B488" : "#F2F0E8",
                backgroundColor: winning.includes(i) ? "#D8E9CD" : hint === i ? "#FBE7B3" : C.paper,
              }}
            >
              {mark ? (
                <MarkEntrance key={`${i}:${mark}`} mark={mark} size={cellSize * 0.62} />
              ) : hint === i ? (
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: C.teal }} />
              ) : null}
            </Cell>
          ))}
          {winning.length > 0 && (
            <WinningLine key={winning.join()} cells={winning} size={size} cell={cellSize} />
          )}
        </View>
      </BoardArea>
      <Controls>
        {!outcome && (
          <Button quiet onPress={() => setAsked({ square: ticChoice(s, () => 0.5, true), at: s.history.length })} disabled={computer}>
            Show a hint
          </Button>
        )}
        <Button
          quiet
          onPress={() => commit(ticUndo(s))}
          disabled={
            !s.history.length ||
            (s.options.mode === "solo" && s.human !== (s.first ?? "X") && s.history.length < 2)
          }
        >
          Undo my turn
        </Button>
      </Controls>
      {hint !== null && !outcome && !computer && (
        <Copy style={{ textAlign: "center", fontSize: 13, marginTop: 10 }}>{ticHintReason(s, hint)}</Copy>
      )}
    </BoardLayout>
  );
}
export function WordBoard({
  state: s,
  width,
  sound,
  guess,
  reveal,
}: Props<WordState> & { guess: (letter: string) => void; reveal: () => void }) {
  const { fontScale } = useWindowDimensions();
  const status = wordStatus(s),
    done = status !== "playing",
    won = status === "won",
    lost = status === "lost";
  const challenge = wordRules(s) === "challenge",
    mistakes = wrongLetters(s),
    remaining = 6 - mistakes.length;
  const letters = [...new Set(s.word)],
    found = letters.filter((l) => s.guessed.includes(l)).length;
  const tiles = wordTiles(s.word.length, width, fontScale);
  const keySize = Math.max(44, 19 * fontScale + 16);
  const hintAvailable = !done && (!challenge || s.hints === 0);
  return (
    <BoardLayout clueFirst>
      <Status
        title={won ? "You solved the word!" : lost ? "No guesses left" : s.category}
        detail={
          won
            ? `${s.word}. ${s.hints ? "Solved with a hint. " : ""}${s.clue}`
            : lost
              ? `The word was ${s.word}. ${s.clue} Try a fresh round when you’re ready.`
              : s.clue
        }
        success={won}
      />
      <BoardArea>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={challenge ? "Wrong guesses" : "Letters found in practice"}
          accessibilityValue={
            challenge
              ? {
                  min: 0,
                  max: 6,
                  now: mistakes.length,
                  text: `${mistakes.length} of 6 wrong guesses. ${remaining} left.`,
                }
              : {
                  min: 0,
                  max: letters.length,
                  now: found,
                  text: `${found} of ${letters.length} different letters found`,
                }
          }
          style={{
            flexDirection: "row",
            alignSelf: "center",
            alignItems: "center",
            gap: 14,
            marginBottom: 4,
            paddingHorizontal: 16,
            paddingVertical: 4,
            borderRadius: 22,
            backgroundColor: "#F5EFE3",
            maxWidth: "100%",
          }}
        >
          <HangmanFigure mistakes={challenge ? mistakes.length : 0} won={won} />
          <View style={{ flexShrink: 1 }}>
            <Text style={{ fontFamily: font, fontSize: 17, fontWeight: "700", color: C.ink }}>
              {challenge
                ? won
                  ? "Word found!"
                  : lost
                    ? "Round finished"
                    : `${remaining} ${remaining === 1 ? "guess" : "guesses"} left`
                : won
                  ? "Word found!"
                  : "Practice · keep guessing"}
            </Text>
            <Copy style={{ fontSize: 13, lineHeight: 20, marginTop: 4 }}>
              {found} of {letters.length} different letters found
            </Copy>
            <Copy style={{ fontSize: 12, lineHeight: 18 }}>
              {challenge ? "Challenge · six wrong guesses" : "Practice · unlimited attempts"}
            </Copy>
            {challenge && (
              <View accessible={false} style={{ flexDirection: "row", gap: 5, marginTop: 10 }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: i < mistakes.length ? C.coral : C.paper,
                      borderColor: i < mistakes.length ? C.coral : "#B7BAAF",
                      borderWidth: 1,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
        <View style={{ gap: tiles.gap, marginBottom: 8 }}>
          {tiles.sizes.map((count, r) => (
            <View key={r} style={{ flexDirection: "row", justifyContent: "center", gap: tiles.gap }}>
              {[...s.word]
                .slice(
                  tiles.sizes.slice(0, r).reduce((a, b) => a + b, 0),
                  tiles.sizes.slice(0, r).reduce((a, b) => a + b, 0) + count
                )
                .map((letter, c) => {
                  const i = tiles.sizes.slice(0, r).reduce((a, b) => a + b, 0) + c,
                    guessed = s.guessed.includes(letter),
                    visible = guessed || lost;
                  return (
                    <View
                      key={i}
                      accessible
                      accessibilityLabel={`Letter ${i + 1} of ${s.word.length}: ${guessed ? letter : lost ? `${letter}, revealed answer` : "not found"}`}
                      style={{
                        width: tiles.tile,
                        height: tiles.tile * 1.12,
                        borderRadius: 8,
                        borderBottomWidth: 3,
                        borderColor: guessed ? C.teal : lost ? C.coral : C.line,
                        backgroundColor: C.paper,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {visible && (
                        <Text
                          accessible={false}
                          style={{
                            textAlign: "center",
                            fontSize: (tiles.tile * 0.55) / fontScale,
                            fontWeight: "800",
                            color: guessed ? C.ink : C.coral,
                          }}
                        >
                          {letter}
                        </Text>
                      )}
                    </View>
                  );
                })}
            </View>
          ))}
        </View>
        <View
          accessibilityLabel="Choose a letter"
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 5,
            width: Math.min(width, 540),
          }}
        >
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
            <LetterKey
              key={letter}
              letter={letter}
              used={s.guessed.includes(letter)}
              correct={s.guessed.includes(letter) && s.word.includes(letter)}
              done={done}
              size={keySize}
              fontScale={fontScale}
              onPress={() => {
                guess(letter);
                sound(s.word.includes(letter) ? "match" : "tap");
                if (!s.word.includes(letter)) feel("warning");
              }}
            />
          ))}
        </View>
      </BoardArea>
      {mistakes.length > 0 && (
        <Copy style={{ textAlign: "center", fontSize: 13, marginTop: 12 }}>
          Wrong letters: {mistakes.join(" · ")}
        </Copy>
      )}
      {lost && (
        <Copy style={{ textAlign: "center", fontSize: 13, marginTop: 8 }}>
          The coral letters show the answer you had not found.
        </Copy>
      )}
      <Controls>
        {!done && !s.custom && (
          <Button quiet onPress={() => sound(`clue-${s.word.toLowerCase()}`)}>
            Hear the clue
          </Button>
        )}
        {!done && (
          <Button
            quiet
            disabled={!hintAvailable}
            onPress={() => {
              reveal();
              sound("match");
            }}
          >
            {challenge ? (s.hints ? "Hint used" : "Reveal a letter · 1 hint") : "Reveal a letter"}
          </Button>
        )}
        {done && !s.custom && (
          <Button quiet onPress={() => sound(s.word.toLowerCase())}>
            Hear the word
          </Button>
        )}
      </Controls>
      {!done && (
        <Copy style={{ textAlign: "center", fontSize: 13, marginTop: 14 }}>
          {challenge
            ? s.hints
              ? "This round used a hint. Assisted wins have their own record."
              : "Find every letter before your six wrong guesses run out."
            : "Take your time. Every letter is a chance to discover."}
        </Copy>
      )}
    </BoardLayout>
  );
}
export function MemoryBoard({ state: s, commit, width, sound }: Props<MemoryState>) {
  const { fontScale } = useWindowDimensions();
  const [peek, setPeek] = useState(false);
  const [grownUpOptions, setGrownUpOptions] = useState(false);
  const [showEnglish, setShowEnglish] = useState(true);
  useEffect(() => {
    // Picture-only rounds retain their existing brief peek. Reading has no deadline.
    if (!peek || s.pack === "chamoru") return;
    const timer = setTimeout(() => setPeek(false), 1800);
    return () => clearTimeout(timer);
  }, [peek, s.pack]);
  const done = memoryDone(s),
    columns = s.pack === "chamoru" ? (fontScale > 1.3 ? 2 : width >= 600 ? 6 : 4) : width >= 460 ? 6 : 4,
    gap = 9,
    cardSize = Math.min(s.pack === "chamoru" && fontScale > 1.3 ? 140 : 88, (width - gap * (columns - 1)) / columns);
  const names = s.match?.names ?? ["Player 1", "Player 2"];
  const mismatch = s.open.length === 2;
  return (
    <BoardLayout>
      {s.pack === "chamoru" && <><Copy style={{ textAlign: "center", fontSize: 13 }}>Match a picture with its CHamoru word. Read at your own pace. English hints start on.</Copy><Button quiet compact onPress={() => sound("hafa-adai-memory")}>Hear the card directions</Button></>}
      {s.pack === "chamoru" && <>
        <Button quiet compact onPress={() => setGrownUpOptions(!grownUpOptions)}>Grown-up reading options</Button>
        {grownUpOptions && <Button quiet compact label={showEnglish ? "Hide English translations" : "Show English translations"}
          onPress={() => setShowEnglish(!showEnglish)}>{showEnglish ? "Hide English translations" : "Show English translations"}</Button>}
        {grownUpOptions && <Copy style={{ textAlign: "center", fontSize: 13 }}>For this visit: hide English when the words feel familiar. You can show it again any time.</Copy>}
      </>}
      <Status
        title={
          done
            ? s.options.mode === "together"
              ? s.scores[0] === s.scores[1]
                ? "It’s a tie!"
                : `${names[s.scores[0] > s.scores[1] ? 0 : 1]} wins!`
              : "Every picture found its pair!"
            : s.options.mode === "together"
              ? `${names[s.player]}’s turn`
              : "Find two that belong together"
        }
        detail={
          done
            ? `${s.turns} turns of noticing and remembering.${s.options.mode === "together" ? ` ${names[0]}: ${s.scores[0]} pairs. ${names[1]}: ${s.scores[1]} pairs.` : ""}`
            : s.options.mode === "together"
              ? `Pairs · ${names[0]}: ${s.scores[0]}   ${names[1]}: ${s.scores[1]}`
              : `${s.matched.length / 2} of ${s.cards.length / 2} pairs found`
        }
        success={done}
      />
      <BoardArea>
        {peek && s.pack === "chamoru" && <><Copy style={{ textAlign: "center" }}>Reading peek · scroll and look as long as you like.</Copy><Button onPress={() => setPeek(false)}>Hide cards and play</Button></>}
        {s.options.mode === "together" && (
          <Scoreboard
            match={s.match ?? newMatch()}
            result={memoryResult(s)}
            active={done ? null : s.player}
          />
        )}
        <View
          style={{
            width: columns * cardSize + gap * (columns - 1),
            flexDirection: "row",
            flexWrap: "wrap",
            gap,
            alignSelf: "center",
          }}
        >
          {s.cards.map((symbol, i) => {
            const matched = s.matched.includes(i),
              open = matched || s.open.includes(i) || peek;
            const ch = s.pack === "chamoru" ? chamoruCard(symbol) : null;
            const faceLabel = ch ? (ch.face === "picture" ? `picture of ${ch.word.english}` : `${ch.word.term}${showEnglish ? `, ${ch.word.english}` : ""}`) : symbol;
            return (
              <Cell
                key={i}
                label={`Card ${i + 1}, ${open ? faceLabel : "face down"}${matched ? ", matched" : ""}`}
                disabled={matched || s.open.includes(i) || mismatch || peek}
                onPress={() => {
                  const next = flipCard(s, i);
                  commit(next);
                  sound(next.matched.length > s.matched.length ? "match" : "tap");
                }}
                style={{
                  width: cardSize,
                  height: cardSize * (s.pack === "chamoru" ? 1.35 : 1.06),
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: matched ? "#BED3B7" : open ? "#D5CBDD" : "#74719B",
                  backgroundColor: open ? (matched ? "#E6F0DD" : C.paper) : "#817BA6",
                }}
              >
                <MemoryFace open={open}>
                  {open ? (
                    ch ? ch.face === "picture" ? <WordPicture word={ch.word} size={cardSize * 0.8} /> : <View style={{ padding: 4, gap: 3 }}><Text style={{ fontSize: 14, lineHeight: 17, fontWeight: "700", color: C.ink, textAlign: "center" }}>{ch.word.term}</Text>{showEnglish && <Text style={{ fontSize: 10, lineHeight: 12, color: C.muted, textAlign: "center" }}>{ch.word.english.split(" / ")[0]}</Text>}</View> : <Symbol name={symbol} size={cardSize * 0.68} />
                  ) : (
                    <Text style={{ color: "#FFF8DE", fontSize: 29, fontWeight: "700" }}>?</Text>
                  )}
                </MemoryFace>
              </Cell>
            );
          })}
        </View>
      </BoardArea>
      <Controls>
        {peek ? <Button onPress={() => setPeek(false)}>Hide cards and play</Button> : mismatch ? (
          <Button onPress={() => commit(closeMismatch(s))}>Turn them over</Button>
        ) : s.options.mode === "solo" ? (
          <Button quiet disabled={done || peek || s.open.length > 0} onPress={() => setPeek(true)}>
            Take a little peek
          </Button>
        ) : null}
        <Button quiet disabled={peek || !s.history?.length} onPress={() => commit(memoryUndo(s))}>
          Undo my turn
        </Button>
      </Controls>
      <Copy style={{ textAlign: "center", fontSize: 13, marginTop: 14 }}>
        {mismatch
          ? "Look as long as you like. Turn them over when you’re ready."
          : "A match earns another turn. No rush."}
      </Copy>
    </BoardLayout>
  );
}
/** Scoreboard mark that matches the board's own pieces. */
function Piece({ red = false }: { red?: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: red ? "#F0BE97" : "#86B1C2",
        backgroundColor: red ? "#A64F37" : "#315D79",
      }}
    />
  );
}
export function CheckersBoard({ state: s, commit, width, sound, help, active }: Props<CheckersState>) {
  const [from, setFrom] = useState<number | null>(null),
    [path, setPath] = useState<number[]>([]),
    [hint, setHint] = useState<CheckersMove | null>(null);
  const rules = checkersRules(s);
  const moves = useMemo(() => checkersMoves(s.position, rules), [s.position, rules]),
    lesson = s.lesson === null ? null : LESSONS[s.lesson];
  const computer =
    s.lesson === null && s.options.mode === "solo" && s.position.turn === -1 && !s.position.outcome;
  useEffect(() => {
    if (!computer || !active) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void checkersChoice(s, () => cancelled).then((move) => {
        if (move && !cancelled) commit(checkersMove(s, move));
      });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [s, computer, commit, active]);
  const candidates = moves.filter((m) => m.from === from && path.every((v, i) => m.path[i] === v));
  const destinations = candidates.map((m) => m.path[path.length]);
  const locked = path.length > 0,
    displayBoard = [...s.position.board];
  if (from !== null && path.length) {
    const route = candidates[0];
    displayBoard[from] = 0;
    if (route) route.captured.slice(0, path.length).forEach((i) => (displayBoard[i] = 0));
    displayBoard[path[path.length - 1]] = s.position.board[from];
  }
  const size = Math.min(width + 24, 560),
    cellSize = (size - 16) / 8,
    outcome = s.position.outcome;
  const lessonComplete = s.lesson !== null && s.history.length > 0;
  function select(i: number) {
    if (computer || outcome || lessonComplete) return;
    if (destinations.includes(i) && from !== null) {
      const nextPath = [...path, i],
        complete = candidates.find(
          (m) => m.path.length === nextPath.length && m.path.every((v, j) => v === nextPath[j])
        );
      if (complete) {
        commit(checkersMove(s, complete));
        sound(complete.captured.length ? "match" : "tap");
      } else {
        setPath(nextPath);
        sound("tap");
      }
      return;
    }
    if (!locked && moves.some((m) => m.from === i)) {
      setFrom(i);
      setPath([]);
      setHint(null);
    }
  }
  const title = lesson
    ? lessonComplete
      ? "You’ve got it!"
      : lesson.title
    : outcome === "draw"
      ? "A well-played draw!"
      : outcome
        ? `${outcome === "red" ? "Red" : "Blue"} wins this round!`
        : computer
          ? "Your island friend is thinking…"
          : `${s.position.turn === 1 ? "Red" : "Blue"} to move`;
  return (
    <BoardLayout>
      <Status
        title={title}
        detail={
          lesson
            ? lesson.text
            : outcome
              ? "Play again whenever you like."
              : locked
                ? "Keep jumping with this same piece."
                : moves.some((m) => m.captured.length)
                  ? rules === "friendly"
                    ? "A jump is available. You can jump or choose another move."
                    : "A jump is available. Classic rules: take a jump."
                  : "Tap a piece, then tap its next square."
        }
        success={!!outcome || lessonComplete}
      />
      <BoardArea>
        {s.options.mode === "together" && s.lesson === null && (
          <Scoreboard
            match={s.match ?? newMatch()}
            result={checkersResultSeat(s)}
            active={
              outcome ? null : s.position.turn === 1 ? (s.starter ?? 0) : (s.starter ?? 0) === 0 ? 1 : 0
            }
            marks={
              (s.starter ?? 0) === 0
                ? [<Piece key="r" red />, <Piece key="b" />]
                : [<Piece key="b" />, <Piece key="r" red />]
            }
          />
        )}
        <View
          style={{
            alignSelf: "center",
            width: size,
            marginHorizontal: -12,
            borderRadius: 20,
            overflow: "hidden",
            borderWidth: 2,
            borderColor: "#466859",
            backgroundColor: "#547565",
            padding: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              width: size - 16,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {Array.from({ length: 64 }, (_, rendered) => {
              const i = s.options.mode === "solo" ? 63 - rendered : rendered,
                piece = displayBoard[i];
              const dark = (row(i) + col(i)) % 2 === 1,
                canMove = moves.some((m) => m.from === i),
                destination = destinations.includes(i),
                suggested = hint && (i === hint.from || hint.path.includes(i));
              return (
                <Cell
                  key={i}
                  label={`${coords(i)}, ${piece ? `${piece > 0 ? "red" : "blue"} ${Math.abs(piece) === 2 ? "king" : "piece"}` : "empty"}${destination ? ", legal destination" : ""}${canMove ? ", can move" : ""}`}
                  disabled={!dark || computer || !!outcome || lessonComplete}
                  selected={from === i}
                  onPress={() => select(i)}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: suggested
                      ? "#E9CB7D"
                      : destination
                        ? "#C9DBA1"
                        : dark
                          ? "#A7C3B0"
                          : "#F3E8D1",
                    borderWidth: from === i ? 3 : 0,
                    borderColor: C.gold,
                  }}
                >
                  {piece ? (
                    <View
                      style={{
                        width: cellSize * 0.75,
                        height: cellSize * 0.75,
                        borderRadius: cellSize,
                        borderWidth: Math.max(2, cellSize * 0.055),
                        borderColor: piece > 0 ? "#F0BE97" : "#86B1C2",
                        backgroundColor: piece > 0 ? "#A64F37" : "#315D79",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {Math.abs(piece) === 2 ? (
                        <Text style={{ fontSize: cellSize * 0.38, fontWeight: "900", color: "#FFF6DB" }}>
                          K
                        </Text>
                      ) : (
                        <View
                          style={{
                            width: cellSize * 0.37,
                            height: cellSize * 0.37,
                            borderRadius: cellSize,
                            borderWidth: 1.5,
                            borderColor: "#F0DFC3",
                          }}
                        />
                      )}
                    </View>
                  ) : destination ? (
                    <View style={{ width: 12, height: 12, borderRadius: 8, backgroundColor: C.teal }} />
                  ) : null}
                  {help && canMove && from === null && !computer && !outcome && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        width: 11,
                        height: 11,
                        borderRadius: 6,
                        backgroundColor: C.ink,
                        borderWidth: 1,
                        borderColor: C.paper,
                      }}
                    />
                  )}
                </Cell>
              );
            })}
          </View>
        </View>
      </BoardArea>
      <Controls>
        {locked ? (
          <Button
            quiet
            onPress={() => {
              setPath([]);
              setFrom(null);
            }}
          >
            Start this turn over
          </Button>
        ) : (
          <>
            <Button
              quiet
              disabled={computer || !!outcome || lessonComplete}
              onPress={() => {
                const m = [...moves].sort((a, b) => b.captured.length - a.captured.length)[0];
                if (m) {
                  setHint(m);
                  setFrom(m.from);
                }
              }}
            >
              Show a hint
            </Button>
            <Button quiet disabled={!s.history.length} onPress={() => commit(checkersUndo(s))}>
              Undo my turn
            </Button>
          </>
        )}
      </Controls>
      {hint && !computer && !outcome && (
        <Copy style={{ textAlign: "center", fontSize: 13, marginTop: 10 }}>
          {hint.captured.length
            ? `Jump from ${coords(hint.from)} to ${coords(hint.path[0])} to capture. Finish each jump in the chain.`
            : `Move from ${coords(hint.from)} to ${coords(hint.path[0])}. Ordinary pieces travel diagonally toward the far row to become kings.`}
        </Copy>
      )}
      {lesson ? (
        <Controls>
          <Button
            onPress={() =>
              commit(s.lesson! < 3 ? checkersLesson(s, s.lesson! + 1) : finishCheckersLessons(s))
            }
            disabled={!lessonComplete}
          >
            {s.lesson! < 3 ? "Next little lesson" : "Finish lessons"}
          </Button>
          <Button quiet onPress={() => commit(finishCheckersLessons(s))}>
            Back to my game
          </Button>
        </Controls>
      ) : (
        <Controls>
          <Button quiet onPress={() => commit(checkersLesson(s, 0))}>
            Learn checkers · 4 little lessons
          </Button>
        </Controls>
      )}
      <Copy style={{ textAlign: "center", fontSize: 13, marginTop: 12 }}>
        Kings have a K.{" "}
        {s.options.mode === "solo"
          ? "Your red pieces start at the bottom and move up."
          : "Red starts at the top and moves down."}{" "}
        A jump chain saves when the whole turn is complete.
      </Copy>
    </BoardLayout>
  );
}
export function MazeBoard({ state: s, commit, width, sound }: Props<MazeState>) {
  const [hint, setHint] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const done = mazeDone(s),
    current = s.path[s.path.length - 1],
    cellSize = Math.floor(Math.min(width, 470) / s.size),
    size = cellSize * s.size;
  function move(i: number, directional = false) {
    const next = mazeMove(s, i);
    const adjacent = Math.abs(Math.floor(i / s.size) - Math.floor(current / s.size)) + Math.abs(i % s.size - current % s.size) === 1;
    setBlocked(next === s && !done && (directional || adjacent));
    if (next !== s) {
      setHint(null);
      commit(next);
      sound("tap");
    }
  }
  return (
    <BoardLayout>
      <Status
        title={done ? "You found your island!" : "Where will your path go?"}
        detail={
          done ? "A whole little adventure, one step at a time." : blocked ? "A wall is here. Try another opening; your path is safe." : "Find your way from the boat to the flag."
        }
        success={done}
      />
      <BoardArea>
        <View style={{ alignSelf: "center", width: size, backgroundColor: C.paper }}>
          {Array.from({ length: s.size }, (_, r) => (
            <View key={r} style={{ width: size, height: cellSize, flexDirection: "row" }}>
              {s.walls.slice(r * s.size, (r + 1) * s.size).map((wall, c) => {
                const i = r * s.size + c;
                const here = current === i,
                  visited = s.path.includes(i);
                return (
                  <Cell
                    key={i}
                    label={`Maze row ${Math.floor(i / s.size) + 1}, column ${(i % s.size) + 1}${here ? ", you are here" : ""}${i === s.walls.length - 1 ? ", finish flag" : ""}`}
                    disabled={done}
                    onPress={() => move(i)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      borderTopWidth: wall & 1 ? 2 : 0,
                      borderRightWidth: wall & 2 ? 2 : 0,
                      borderBottomWidth: wall & 4 ? 2 : 0,
                      borderLeftWidth: wall & 8 ? 2 : 0,
                      borderColor: C.teal,
                      backgroundColor: hint === i ? "#F4D88D" : visited ? "#E9F0DB" : C.paper,
                    }}
                  >
                    {here ? (
                      <Symbol name="boat" size={cellSize * 0.8} />
                    ) : i === s.walls.length - 1 ? (
                      <Icon name="flag" size={cellSize * 0.6} color={C.coral} />
                    ) : visited ? (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#95B7A0" }} />
                    ) : null}
                  </Cell>
                );
              })}
            </View>
          ))}
        </View>
      </BoardArea>
      <View style={{ alignItems: "center", marginTop: 12, gap: 8 }}>
        <IconButton
          icon="up"
          size={48}
          disabled={done}
          label="Move up"
          onPress={() => move(current - s.size, true)}
        />
        <View style={{ flexDirection: "row", gap: 9 }}>
          {[3, 2, 1].map((d) => (
            <IconButton
              key={d}
              icon={d === 3 ? "left" : d === 2 ? "down" : "right"}
              size={48}
              disabled={done}
              label={`Move ${directions[d].name.toLowerCase()}`}
              onPress={() => move(current + directions[d].dr * s.size + directions[d].dc, true)}
            />
          ))}
        </View>
      </View>
      <Controls>
        <Button quiet disabled={done} onPress={() => setHint(mazeRoute(s)[1] ?? null)}>
          Show the next step
        </Button>
        <Button
          quiet
          disabled={s.path.length < 2}
          onPress={() => commit({ ...s, path: s.path.slice(0, -1) })}
        >
          Go back a step
        </Button>
      </Controls>
    </BoardLayout>
  );
}
function Die({ value, size = 72 }: { value: number; size?: number }) {
  const dots: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  return (
    <View
      accessibilityLabel={`Die showing ${value}`}
      style={{
        width: size,
        height: size,
        backgroundColor: C.paper,
        borderWidth: 2,
        borderColor: C.line,
        borderRadius: 18,
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 12,
      }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <View
          key={i}
          style={{ width: "33.33%", height: "33.33%", alignItems: "center", justifyContent: "center" }}
        >
          {dots[value]?.includes(i) && (
            <View
              style={{ width: size * 0.105, height: size * 0.105, borderRadius: 10, backgroundColor: C.teal }}
            />
          )}
        </View>
      ))}
    </View>
  );
}
export function NumbersBoard({ state: s, commit, width, sound }: Props<NumbersState>) {
  const [compare, setCompare] = useState(false);
  const { fontScale } = useWindowDimensions();
  const status = numbersStatus(s),
    target = numberTarget(s),
    sum = s.selected.reduce((a, b) => a + b, 0),
    max = numberLimit(s);
  return (
    <BoardLayout>
      <Status
        title={
          status === "won"
            ? "Your island is clear!"
            : status === "stuck"
              ? "That’s this round!"
              : needsPracticeRoll(s)
                ? "Try a new roll"
                : s.dice.length
                ? `Can you make ${target}?`
                : "Ready to roll?"
        }
        detail={
          status === "won"
            ? "You found a combination for every number."
            : status === "stuck"
              ? `No open numbers can make ${target}. Undo or try a fresh round.`
              : "Close one number or a group that adds up to your roll."
        }
        success={status === "won"}
      />
      <BoardArea>
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginVertical: 12 }}>
          {s.dice.length ? (
            s.dice.map((d, i) => <Die key={i} value={d} size={56} />)
          ) : (
            <View style={{ alignItems: "center", height: 56, justifyContent: "center" }}>
              <Copy>Your dice are waiting.</Copy>
            </View>
          )}
        </View>
        <View
          style={{
            alignSelf: "center",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 9,
            maxWidth: Math.min(width, 420),
            marginTop: 18,
          }}
        >
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
            const available = s.available.includes(n),
              selected = s.selected.includes(n);
            return (
              <Cell
                key={n}
                label={`Number ${n}, ${!available ? "closed" : selected ? "selected" : "open"}`}
                disabled={!available || !s.dice.length || status !== "playing"}
                selected={selected}
                onPress={() => commit(selectNumber(s, n))}
                style={{
                  width: Math.min(96, (width - 30) / 3),
                  height: Math.max(max > 9 ? 60 : 72, 38 * fontScale + 12),
                  borderRadius: 17,
                  borderWidth: 2,
                  borderColor: selected ? C.teal : available ? C.line : "transparent",
                  backgroundColor: selected ? "#D7E8D5" : available ? C.paper : "#E8EBE2",
                }}
              >
                <Text style={{ fontSize: 31, fontWeight: "800", color: available ? C.ink : "#7A897E" }}>
                  {available ? n : "✓"}
                </Text>
              </Cell>
            );
          })}
        </View>
      </BoardArea>
      <Copy style={{ textAlign: "center" }}>Remaining total: {remainingTotal(s)} · Personal best: {Math.min(s.bestRemaining ?? remainingTotal(s), remainingTotal(s))} (lower is better)</Copy>
      {compare && !!s.dice.length && <View accessibilityLiveRegion="polite" style={{ gap: 8 }}><Copy>{numberAdvice(s).text}</Copy>{numberAdvice(s).choices.map(choice => <Button quiet key={choice.join()} onPress={() => commit({ ...s, selected: choice })}>Choose {choice.join(" + ")}</Button>)}</View>}
      {s.gentlePractice && <Copy>Keep small numbers for flexible combinations. If no combination fits, roll again and keep practicing.</Copy>}
      {needsPracticeRoll(s) && <Copy>No open numbers make {target}. Try a new roll; your closed numbers stay closed.</Copy>}
      {s.dice.length > 0 && status === "playing" && !needsPracticeRoll(s) && (
        <Copy style={{ textAlign: "center", marginTop: 18, color: C.ink }}>
          {s.selected.length ? `${s.selected.join(" + ")} = ${sum}` : "Tap numbers to build your total."}
        </Copy>
      )}
      <Controls>
        {(!s.dice.length || needsPracticeRoll(s)) && status === "playing" ? (
          <Button
            onPress={() => {
              commit(rollNumbers(s));
              sound("tap");
            }}
          >
            Roll {max === 6 ? "the die" : "the dice"}
          </Button>
        ) : status === "playing" ? (
          <Button
            disabled={sum !== target || !s.selected.length}
            onPress={() => {
              commit(closeNumbers(s));
              sound("match");
            }}
          >
            Close these numbers
          </Button>
        ) : null}
        <Button
          quiet
          disabled={!s.dice.length || status !== "playing" || needsPracticeRoll(s)}
          onPress={() => {
            const choice = numberChoices(s.available, target)[0];
            if (choice) commit({ ...s, selected: choice });
          }}
        >
          Show a combination
        </Button>
        <Button quiet disabled={!s.dice.length || status !== "playing" || needsPracticeRoll(s)} onPress={() => setCompare(v => !v)}>{compare ? "Hide choices" : "Compare combinations"}</Button>
        <Button quiet disabled={!s.history.length} onPress={() => commit(undoNumbers(s))}>
          Undo my turn
        </Button>
      </Controls>
    </BoardLayout>
  );
}
const S = StyleSheet.create({
  cell: { alignItems: "center", justifyContent: "center" },
  tic: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: "#E7E9DC",
    borderWidth: 1,
    borderColor: "#D7DCCD",
    padding: 12,
    borderRadius: 28,
  },
});
