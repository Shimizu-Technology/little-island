import { BadgeResultCard } from '../badges/ResultCard';
import { useActiveIslanderLook } from "../islander/active";
import { Companion, IslanderPortrait } from "../islander/Companion";
import { classicEvent } from "../islander/reactions";
import { PlayerNames } from "../components/Match";
import { newMatch, Seat } from "../games/match";
import { Mark, replayTic } from "../games/tic";
import { createMemory, replayMemory } from "../games/memory";
import { SaveStatus } from "../components/SaveStatus";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, ScrollView, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams, useIsFocused } from "expo-router";
import {
  GameId,
  GameState,
  Options,
  createGame,
  difficultyLabel,
  gameIds,
  games,
  isFinished,
} from "../games";
import { defaultOptions } from "../games/types";
import { replayCheckers, positionKey } from "../games/checkers";
import {
  createWord,
  customWord,
  guessLetter,
  replayWord,
  wordHint,
  wordRules,
  wordStatus,
  WORDS,
} from "../games/words";
import { useStore } from "../state/Store";
import { Button, C, Chip, Copy, Heading, GameHeader, Sheet, styles, ToggleRow } from "../components/ui";
import { useSounds } from "../components/Audio";
import { useRoundPractice } from "../practice/useRoundPractice";
import { Recovery } from "../components/Recovery";
import {
  CheckersBoard,
  MemoryBoard,
  MazeBoard,
  NumbersBoard,
  TicBoard,
  WordBoard,
} from "../screens/GameBoards";
export default function Play() {
  const params = useLocalSearchParams<{ game?: string }>(),
    id = params.game as GameId;
  if (!gameIds.includes(id)) return <Redirect href="/" />;
  return <Game key={id} id={id} />;
}
function Game({ id }: { id: GameId }) {
  const look = useActiveIslanderLook();
  const insets = useSafeAreaInsets(),
    focused = useIsFocused();
  const { width, height } = useWindowDimensions(),
    store = useStore(),
    s = store.save.sessions[id],
    g = games[id];
  const landscape = width >= 900 && width > height;
  const [names, setNames] = useState<[string, string]>(
    s && "match" in s && s.match ? s.match.names : ["", ""]
  );
  const [starter, setStarter] = useState<Seat>(0),
    [xSeat, setXSeat] = useState<Seat>(0),
    [alternate, setAlternate] = useState(true),
    [human, setHuman] = useState<Mark>("X");
  const [memoryPack, setMemoryPack] = useState<"pictures" | "chamoru">(s?.game === "memory" ? s.pack ?? "pictures" : "pictures");
  const [showSecret, setShowSecret] = useState(false),
    [clue, setClue] = useState("");
  const [setup, setSetup] = useState(false),
    [help, setHelp] = useState(false),
    [options, setOptions] = useState<Options>(
      s?.options ?? {
        ...defaultOptions,
        ...(id === "checkers" ? { checkersRules: "friendly" as const } : {}),
      }
    ),
    [category, setCategory] = useState(s?.game === "word-rescue" ? (s.pack ?? "All") : "All"),
    [secret, setSecret] = useState(""),
    [error, setError] = useState(""),
    [active, setActive] = useState(AppState.currentState === "active");
  const practice = useRoundPractice(id, s);
  const sound = useSounds(store.save.settings.sound && focused && !practice.pending),
    finished = s ? isFinished(s) : false,
    previousRound = useRef({ id: s?.id, epoch: store.epoch, finished });
  const lostWord = s?.game === "word-rescue" && wordStatus(s) === "lost";
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => setActive(state === "active"));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (s?.id === previousRound.current.id && store.epoch === previousRound.current.epoch && finished && !previousRound.current.finished) sound(lostWord ? "tap" : "win");
    previousRound.current = { id: s?.id, epoch: store.epoch, finished };
  }, [s?.id, store.epoch, finished, sound, lostWord]);
  const update = store.update;
  const commit = useCallback((next: GameState) => update(id, next, s), [id, s, update]);
  function start() {
    let next: GameState;
    let remembered: string[] | null = null;
    if (id === "word-rescue") {
      if (options.mode === "together") {
        const custom = customWord(options, secret, clue);
        if (!custom) {
          setError("Use one word with 2–12 letters, A to Z.");
          return;
        }
        next = custom;
      } else next = createWord(options, category, s?.game === "word-rescue" ? s.seen : []);
    } else if (id === "memory") next = createMemory(options, starter, memoryPack);
    else next = createGame(id, options);
    if (next.game === "numbers" && s?.game === "numbers" && s.options.difficulty === options.difficulty && s.bestRemaining !== undefined) next = { ...next, bestRemaining: s.bestRemaining };
    if (next.game === "tic-tac-toe" || next.game === "memory" || next.game === "checkers") {
      const family = options.mode === "together";
      const match = newMatch(family ? names : ["You", "Island friend"], alternate);
      if (family) remembered = match.names;
      next = { ...next, match, starter: family ? starter : 0 };
      if (next.game === "tic-tac-toe") {
        const assignedX = family ? xSeat : human === "X" ? 0 : 1;
        const firstSeat = family ? starter : options.computerFirst ? 1 : 0;
        next = {
          ...next,
          human,
          xSeat: assignedX,
          starter: firstSeat,
          first: firstSeat === assignedX ? "X" : "O",
        };
      }
      if (next.game === "memory") next = { ...next, player: next.starter ?? 0 };
    }
    practice.request(() => {
      if (remembered) store.rememberPlayers(remembered);
      store.update(id, next, s);
      setSetup(false);
      setSecret("");
      setClue("");
      setShowSecret(false);
      setError("");
    });
  }
  function newRound() {
    if (s?.game === "memory") setMemoryPack(s.pack ?? "pictures");
    setOptions(
      s?.options ?? {
        ...defaultOptions,
        ...(id === "checkers" ? { checkersRules: "friendly" as const } : {}),
      }
    );
    setSecret("");
    setClue("");
    setShowSecret(false);
    setError("");
    setSetup(true);
  }
  function replay() {
    if (!s || !finished) return;
    if (s.game === "word-rescue" && s.custom) {
      newRound();
      return;
    }
    let next =
      s.game === "word-rescue"
        ? replayWord(s)!
        : s.game === "tic-tac-toe"
          ? replayTic(s)
          : s.game === "memory"
            ? replayMemory(s)
            : s.game === "checkers"
              ? replayCheckers(s)
              : createGame(id, s.options);
    if (next.game === "numbers" && s.game === "numbers" && s.bestRemaining !== undefined) next = { ...next, bestRemaining: s.bestRemaining };
    practice.request(() => store.update(id, next, s));
  }
  const boardProps = {
    // 32 page padding + 24 for the tinted board panel's inner padding.
    width: Math.min(
      width - insets.left - insets.right - 56,
      landscape ? Math.min(width * 0.56 - 32, height - 150) : 720
    ),
    sound,
    help: store.save.settings.help,
    active: active && focused && !setup && !help && !practice.pending,
  };
  if (!store.ready)
    return (
      <SafeAreaView style={styles.page}>
        <Copy>Opening your game…</Copy>
      </SafeAreaView>
    );
  if (store.recovery)
    return (
      <SafeAreaView style={styles.page}>
        <Recovery />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { maxWidth: 1280, paddingHorizontal: 16 }]}
      >
        <GameHeader
          title={g.name}
          onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          sound={{
            on: store.save.settings.sound,
            toggle: () => store.settings({ sound: !store.save.settings.sound }),
          }}
          onHelp={() => setHelp(true)}
        />
        {s && (
          <Copy style={{ fontSize: 12, marginBottom: 8 }}>
            {s.game === "word-rescue"
              ? s.custom
                ? ""
                : `${{ easy: "Short words", medium: "Longer words", hard: "Big words" }[s.options.difficulty]} · `
              : `${(s.game === "tic-tac-toe" || s.game === "checkers") && s.options.mode === "together" ? "" : `${difficultyLabel[s.options.difficulty]} · `}`}
            {s.options.mode === "together" ? g.together : g.solo}
            {s.game === "word-rescue" &&
              ` · ${wordRules(s) === "challenge" ? "Six-guess Challenge" : "Practice"}`}
            {s.game === "numbers" &&
              s.options.difficulty === "hard" &&
              s.maxNumber === undefined &&
              " · Earlier round: numbers 1–9"}
            {id === "checkers" &&
              (s.game === "checkers" && s.lesson !== null
                ? " · Classic practice lesson"
                : ` · ${s.options.checkersRules === "friendly" ? "Friendly · jumps optional" : "Classic · must jump"}`)}
          </Copy>
        )}
        <SaveStatus />
        {s && s.options.mode === "solo" && (s.game === "memory" || s.game === "checkers") && <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}><IslanderPortrait look={look}/><Copy>You</Copy></View>}
        <View style={{ backgroundColor: g.surface, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 12 }}>
          {s?.game === "tic-tac-toe" ? (
            <TicBoard key={s.id} {...boardProps} state={s} commit={commit} />
          ) : s?.game === "word-rescue" ? (
            <WordBoard
              {...boardProps}
              state={s}
              commit={commit}
              guess={(letter) =>
                store.act(id, s.id, (current) =>
                  current.game === "word-rescue" ? guessLetter(current, letter) : current
                )
              }
              reveal={() =>
                store.act(id, s.id, (current) =>
                  current.game === "word-rescue" ? wordHint(current) : current
                )
              }
            />
          ) : s?.game === "memory" ? (
            <MemoryBoard key={s.id} {...boardProps} state={s} commit={commit} />
          ) : s?.game === "checkers" ? (
            <CheckersBoard
              key={`${s.id}:${s.history.length}:${positionKey(s.position.board, s.position.turn)}`}
              {...boardProps}
              state={s}
              commit={commit}
            />
          ) : s?.game === "maze" ? (
            <MazeBoard key={`${s.id}:${s.path.join()}`} {...boardProps} state={s} commit={commit} />
          ) : s?.game === "numbers" ? (
            <NumbersBoard {...boardProps} state={s} commit={commit} />
          ) : null}
        </View>
        {s?.game === "word-rescue" && store.save.wordRecords && (
          <Copy style={{ textAlign: "center", fontSize: 13, marginTop: 20 }}>
            Challenge record: {store.save.wordRecords.wins} won · {store.save.wordRecords.losses} lost ·{" "}
            {store.save.wordRecords.assistedWins} assisted wins
            {store.save.wordRecords.bestWrong !== null
              ? ` · Best: ${store.save.wordRecords.bestWrong} wrong guesses without a hint`
              : ""}
          </Copy>
        )}
        {s && (
          <View
            style={{
              alignItems: "center",
              gap: 10,
              marginTop: 14,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: C.line,
            }}
          >
            {finished && <BadgeResultCard round={s.id}/>}
            {finished && <Companion event={classicEvent(s)} active={focused && active && !setup && !help}/> }
            {finished && (
              <Button onPress={replay}>
                {s.game === "word-rescue" && s.custom ? "Choose a new family word" : "Play again"}
              </Button>
            )}
            {/* Kept small and quiet so it's never the obvious tap mid-game; Play again is the main action. */}
            <Button compact quiet onPress={newRound}>
              New round & options
            </Button>
            <Copy style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>
              Your current round saves on this device.
            </Copy>
          </View>
        )}
      </ScrollView>
      <Sheet
        visible={setup || !s}
        onClose={() => practice.pending ? practice.cancel() : (s ? setSetup(false) : router.canGoBack() ? router.back() : router.replace("/"))}
        title={practice.pending ? "A little practice, then play" : s ? "A fresh little round" : `Let’s play ${g.name}`}
        footer={practice.pending ? undefined : <Button onPress={start}>{s ? "Start a new round" : "Start playing"}</Button>}
      >
        {practice.pending ? practice.content : <>
        <Copy>
          {s && !finished
            ? "Starting a new round replaces this game’s current round. Your other games stay saved."
            : g.description}
        </Copy>
        {id !== "maze" && id !== "numbers" && (
          <>
            <Heading style={{ fontSize: 18 }}>How shall we play?</Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              <Chip
                selected={options.mode === "solo"}
                onPress={() => setOptions({ ...options, mode: "solo" })}
              >
                {g.solo}
              </Chip>
              <Chip
                selected={options.mode === "together"}
                onPress={() => setOptions({ ...options, mode: "together" })}
              >
                {g.together}
              </Chip>
            </View>
          </>
        )}
        {!(options.mode === "together" && ["word-rescue", "tic-tac-toe", "checkers"].includes(id)) && (
          <>
            <Heading style={{ fontSize: 18 }}>
              {id === "word-rescue" ? "Word length" : "Choose your pace"}
            </Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {(["easy", "medium", "hard"] as const).map((d) => (
                <Chip
                  key={d}
                  selected={options.difficulty === d}
                  onPress={() => setOptions({ ...options, difficulty: d })}
                >
                  {id === "word-rescue"
                    ? { easy: "Short words", medium: "Longer words", hard: "Big words" }[d]
                    : difficultyLabel[d]}
                </Chip>
              ))}
            </View>
          </>
        )}
        {id === "word-rescue" && (
          <>
            <Heading style={{ fontSize: 18 }}>Choose your rules</Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              <Chip
                selected={options.wordRules !== "practice"}
                onPress={() => setOptions({ ...options, wordRules: "challenge" })}
              >
                Challenge
              </Chip>
              <Chip
                selected={options.wordRules === "practice"}
                onPress={() => setOptions({ ...options, wordRules: "practice" })}
              >
                Practice
              </Chip>
            </View>
            <Copy>
              {options.wordRules === "practice"
                ? "Unlimited attempts and letter hints. Practice rounds do not change your Challenge record."
                : "Find the word before six wrong letter guesses. One optional hint marks the result assisted."}
            </Copy>
          </>
        )}
        {id === "checkers" && (
          <>
            <Heading style={{ fontSize: 18 }}>Choose your rules</Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              <Chip
                selected={options.checkersRules === "friendly"}
                onPress={() => setOptions({ ...options, checkersRules: "friendly" })}
              >
                Friendly
              </Chip>
              <Chip
                selected={options.checkersRules !== "friendly"}
                onPress={() => setOptions({ ...options, checkersRules: "classic" })}
              >
                Classic
              </Chip>
            </View>
            <Copy>
              {options.checkersRules === "friendly"
                ? "Jumps are optional. Choose a jump or move another piece. Once you start a jump chain, finish it with the same piece."
                : "Standard American checkers: take a jump whenever one is available, and finish the whole jump chain."}
            </Copy>
            <Copy style={{ fontSize: 13 }}>
              The computer follows the same rules. Changing rules starts a new round.
            </Copy>
          </>
        )}
        {["tic-tac-toe", "memory", "checkers"].includes(id) && options.mode === "together" && (
          <>
            <PlayerNames names={names} onChange={setNames} remembered={store.save.players} />
            {id === "tic-tac-toe" && (
              <>
                <Heading style={{ fontSize: 18 }}>Who plays X?</Heading>
                <View style={[styles.row, { flexWrap: "wrap" }]}>
                  {([0, 1] as const).map((seat) => (
                    <Chip key={seat} selected={xSeat === seat} onPress={() => setXSeat(seat)}>
                      {names[seat] || `Player ${seat + 1}`} · X
                    </Chip>
                  ))}
                </View>
              </>
            )}
            <Heading style={{ fontSize: 18 }}>
              {id === "checkers" ? "Who plays Red and starts?" : "Who starts this round?"}
            </Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {([0, 1] as const).map((seat) => (
                <Chip key={seat} selected={starter === seat} onPress={() => setStarter(seat)}>
                  {names[seat] || `Player ${seat + 1}`}
                </Chip>
              ))}
            </View>
            <ToggleRow
              label="Take turns starting"
              detail={id === "checkers" ? "Swap colours after each round" : "Swap who goes first after each round"}
              value={alternate}
              onChange={setAlternate}
            />
          </>
        )}
        {id === "tic-tac-toe" && options.mode === "solo" && (
          <>
            <Heading style={{ fontSize: 18 }}>Your shape</Heading>
            <View style={styles.row}>
              {(["X", "O"] as const).map((mark) => (
                <Chip key={mark} selected={human === mark} onPress={() => setHuman(mark)}>
                  {mark}
                </Chip>
              ))}
            </View>
            <Heading style={{ fontSize: 18 }}>Who starts?</Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              <Chip
                selected={!options.computerFirst}
                onPress={() => setOptions({ ...options, computerFirst: false })}
              >
                I’ll start
              </Chip>
              <Chip
                selected={options.computerFirst}
                onPress={() => setOptions({ ...options, computerFirst: true })}
              >
                Island friend starts
              </Chip>
            </View>
          </>
        )}
        {id === "word-rescue" &&
          (options.mode === "together" ? (
            <>
              <Copy>
                A grown-up chooses a secret word, then passes the device. The word stays hidden while typing.
              </Copy>
              <TextInput
                accessibilityLabel="Secret family word"
                placeholder="One secret word"
                value={secret}
                onChangeText={setSecret}
                // Real secure entry keeps the word out of screen-reader and copy semantics while hidden.
                // A one-time-code content type stops iOS offering its Passwords bar for this field.
                secureTextEntry={!showSecret}
                textContentType={showSecret ? "none" : "oneTimeCode"}
                autoComplete="off"
                returnKeyType="go"
                onSubmitEditing={start}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
                style={styles.input}
              />
              <Button
                quiet
                compact
                icon={showSecret ? "eye-off" : "eye"}
                onPress={() => setShowSecret(!showSecret)}
              >
                {showSecret ? "Hide word" : "Show word"}
              </Button>
              <TextInput
                accessibilityLabel="Optional family clue"
                placeholder="A clue (optional)"
                value={clue}
                onChangeText={setClue}
                maxLength={80}
                autoComplete="off"
                textContentType="none"
                returnKeyType="go"
                onSubmitEditing={start}
                style={styles.input}
              />
            </>
          ) : (
            <>
              <Heading style={{ fontSize: 18 }}>Pick a word pack</Heading>
              <View style={[styles.row, { flexWrap: "wrap" }]}>
                {["All", ...new Set(WORDS.map((w) => w[1]))].map((c) => (
                  <Chip key={c} selected={category === c} onPress={() => setCategory(c)}>
                    {c}
                  </Chip>
                ))}
              </View>
            </>
          ))}
        {id === "memory" && (
          <>
          <Heading style={{ fontSize: 18 }}>Cards</Heading>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            <Chip selected={memoryPack === "pictures"} onPress={() => setMemoryPack("pictures")}>Pictures</Chip>
            <Chip selected={memoryPack === "chamoru"} onPress={() => setMemoryPack("chamoru")}>CHamoru words</Chip>
          </View>
          {memoryPack === "chamoru" && <Copy>Match each picture with its CHamoru word. Small English words help you compare. CHamoru words are text only.</Copy>}
          <Copy>
            {options.difficulty === "easy" ? "Six" : options.difficulty === "medium" ? "Eight" : "Twelve"}{" "}
            {memoryPack === "chamoru" ? "picture and word pairs." : "picture pairs."}{" "}
            {options.mode === "solo"
              ? "Practice with a peek whenever you need one."
              : "Two-player match: no peeks. Most pairs wins; equal pairs is a tie."}
          </Copy>
          </>
        )}
        {id === "numbers" && (
          <Copy>
            {options.difficulty === "easy"
              ? "Gentle: one die and numbers 1–6. Roll again whenever no combination fits."
              : options.difficulty === "medium"
                ? "Growing: two dice and numbers 1–9."
                : "Challenge: two dice and numbers 1–12. Plan which totals to save."}{" "}
            You can use a combination hint whenever you like.
          </Copy>
        )}
        {!!error && <Copy style={{ color: "#9C432D" }}>{error}</Copy>}
        </>}
      </Sheet>
      <Sheet visible={help} onClose={() => setHelp(false)} title={`How to play ${g.name}`}>
        <Copy>{g.help}</Copy>
        <Button onPress={() => sound(`instructions-${id}`)} disabled={!store.save.settings.sound}>
          Listen to the instructions
        </Button>
        {!store.save.settings.sound && <Copy>Turn sound on to hear the instructions.</Copy>}
        {s?.game === "word-rescue" && (
          <>
            <Heading style={{ fontSize: 18 }}>
              This round: {wordRules(s) === "practice" ? "Practice" : "Challenge"}
            </Heading>
            <Copy>
              {wordRules(s) === "practice"
                ? "Unlimited attempts and letter hints. Practice does not change your Challenge record."
                : "Six wrong letters end the round. One optional letter hint marks the result assisted."}
            </Copy>
            <Button
              quiet
              onPress={() => {
                setHelp(false);
                newRound();
              }}
            >
              Choose rules for a fresh round
            </Button>
          </>
        )}
        {id === "checkers" && (
          <Copy>
            The four little lessons are below the board. “Back to my game” restores your full round. Your
            board keeps the same direction for both players.
          </Copy>
        )}
      </Sheet>
      {!setup && !!s && practice.panel}
    </SafeAreaView>
  );
}
