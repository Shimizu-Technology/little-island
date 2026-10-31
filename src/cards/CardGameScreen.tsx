import { BadgeResultCard } from '../badges/ResultCard';
import { Companion } from "../islander/Companion";
import { resultEvent } from "../islander/reactions";
import type { RoundPractice } from "../practice/useRoundPractice";
import { Text } from "../components/Text";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useStore } from "../state/Store";
import { PlayerNames, Scoreboard } from "../components/Match";
import { newMatch, Seat } from "../games/match";
import { GuidanceKey, QUALITY_GUIDANCE } from "../explore/guidance";
import Svg, { Circle, Path, Polygon } from "react-native-svg";
import { Button, C, Copy, GameHeader, Heading, Label, PressableScale, Sheet, font, ToggleRow } from "../components/ui";
import {
  Card,
  cardPublicView, goFishAdvice,
  CardAction,
  CardSession,
  SUITS,
  Suit,
  cardAction,
  cardName,
  computerCardTurn,
  createCardSession,
  legalCardPlays,
  rank,
  rankName,
  suit,
  suitName,
  cardRound,
  cardRanks,
  cardPace,
  CardPace,
  CardRound,
  cardEventText,
  newCardIds,
  setCardPace,
  points, cardMatch, cardStarter, cardMatchResult, cardMatchPoints, rematchCards,
} from "./engine";

const colors: Record<Suit, string> = { shell: "#A44E37", leaf: "#246858", sun: "#916500", wave: "#386C9A" };
export function SuitMark({ kind, size = 30 }: { kind: Suit; size?: number }) {
  const color = colors[kind];
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      {kind === "shell" && (
        <Path d="M8 32 L3 18 C0 10 7 4 13 8 C14 0 26 0 27 8 C35 4 42 12 37 20 L31 32Z" fill={color} />
      )}
      {kind === "leaf" && (
        <Path d="M6 34 Q0 3 34 6 Q37 37 6 34 M8 32 L29 11" fill={color} stroke="#FCFAF4" strokeWidth="2" />
      )}
      {kind === "sun" && (
        <>
          <Polygon
            points="20,1 25,10 35,5 30,15 39,20 30,25 35,35 25,30 20,39 15,30 5,35 10,25 1,20 10,15 5,5 15,10"
            fill={color}
          />
          <Circle cx="20" cy="20" r="9" fill="#FCFAF4" />
        </>
      )}
      {kind === "wave" && (
        <Path d="M2 16 Q10 3 19 16 T38 16 M2 26 Q10 13 19 26 T38 26" fill="none" stroke={color} strokeWidth="5" />
      )}
    </Svg>
  );
}
function CardFace({
  card,
  selected,
  fresh,
  disabled,
  onPress,
}: {
  card: Card;
  selected?: boolean;
  fresh?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole={onPress ? "button" : "image"}
      accessibilityLabel={`${cardName(card)}${fresh ? ", new card" : ""}`}
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={[
        s.card,
        { borderColor: fresh ? "#A44E37" : selected ? C.teal : C.line, borderWidth: selected || fresh ? 3 : 1 },
        disabled && { borderStyle: "dashed" },
      ]}
    >
      <Text style={[s.rank, { color: colors[suit(card)] }]}>
        {({ 1: "A", 11: "J", 12: "Q", 13: "K" } as Record<number, string>)[rank(card)] ?? rank(card)}
      </Text>
      <SuitMark kind={suit(card)} />
      <Text style={s.suit}>{fresh ? "NEW" : suit(card)}</Text>
    </PressableScale>
  );
}
export type CardGameScreenProps = {
  roundPractice?: RoundPractice;
  beforeNewRound?: (run: () => void) => void;
  state: CardSession;
  onChange: (next: CardSession, previous: CardSession) => void;
  width: number;
  active: boolean;
  sound: boolean;
  onFeedback?: () => void;
  onSpeakInstruction?: (key: GuidanceKey) => void;
  onStopInstruction?: () => void;
  onBack?: () => void;
  onToggleSound?: () => void;
};
export function CardGameScreen(props: CardGameScreenProps) {
  return <CardGameRound key={`${props.state.id}:${props.state.turn}:${props.active || props.roundPractice?.pending}`} {...props} />;
}
function CardGameRound({
  state,
  onChange,
  width,
  active,
  sound,
  onFeedback,
  onSpeakInstruction,
  onStopInstruction,
  onBack, onToggleSound, beforeNewRound, roundPractice,
}: CardGameScreenProps) {
  const store = useStore();
  const newRound = beforeNewRound ?? ((run: () => void) => run());
  const match = cardMatch(state);
  const [names, setNames] = useState<[string, string]>(match.names);
  const [starter, setStarter] = useState<Seat>(cardStarter(state));
  const [alternate, setAlternate] = useState(match.alternate);
  const [scoring, setScoring] = useState(false);
  const latest = useRef(state);
  React.useLayoutEffect(() => {
    latest.current = state;
  }, [state]);
  const [reveal, setReveal] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active" || AppState.currentState === null);
  const [help, setHelp] = useState(false),
    [setup, setSetup] = useState(false),
    [history, setHistory] = useState(false);
  const [mode, setMode] = useState(state.options.mode),
    [round, setRound] = useState<CardRound>(cardRound(state)),
    [pace, setPace] = useState<CardPace>(cardPace(state));
  const [advice, setAdvice] = useState(false);
  const [wild, setWild] = useState<Card | null>(null);
  const playing = active && foreground && !help && !setup;
  const cpu = state.options.mode === "solo" && state.turn === 1 && !state.result;
  const owner: 0 | 1 = state.options.mode === "solo" ? 0 : state.turn;
  const visible = playing && (state.options.mode === "solo" || reveal);
  const canAct = visible && !cpu && !state.result;
  const stop = useRef(onStopInstruction);
  React.useLayoutEffect(() => {
    stop.current = onStopInstruction;
  }, [onStopInstruction]);
  useEffect(() => {
    const conceal = () => {
      setReveal(false);
      setWild(null);
      stop.current?.();
    };
    const subscription = AppState.addEventListener("change", (value) => {
      setForeground(value === "active");
      if (value !== "active") conceal();
    });
    const suspend = () => {
      setForeground(false);
      conceal();
    };
    const focus = () => setForeground(Platform.OS === "web" ? !document.hidden : AppState.currentState === "active");
    const blur = Platform.OS === "android" ? AppState.addEventListener("blur", suspend) : null;
    const focused = Platform.OS === "android" ? AppState.addEventListener("focus", focus) : null;
    const webVisibility = () => {
      setForeground(!document.hidden);
      conceal();
    };
    if (Platform.OS === "web") {
      window.addEventListener("blur", suspend);
      window.addEventListener("focus", focus);
      document.addEventListener("visibilitychange", webVisibility);
    }
    return () => {
      subscription.remove();
      blur?.remove();
      focused?.remove();
      stop.current?.();
      if (Platform.OS === "web") {
        window.removeEventListener("blur", suspend);
        window.removeEventListener("focus", focus);
        document.removeEventListener("visibilitychange", webVisibility);
      }
    };
  }, []);
  const commit = (next: CardSession, previous: CardSession) => {
    if (next === previous) return;
    latest.current = next;
    if (next.turn !== previous.turn || next.id !== previous.id) {
      setReveal(false);
      setWild(null);
    }
    if (sound) onFeedback?.();
    onChange(next, previous);
  };
  const act = (action: CardAction) => {
    if (canAct) {
      const previous = latest.current;
      commit(cardAction(previous, action, state.turn, state.revision), previous);
    }
  };
  const computerStep = () => {
    const previous = latest.current;
    if (
      playing &&
      previous.options.mode === "solo" &&
      previous.turn === 1 &&
      !previous.result &&
      previous.revision === state.revision
    )
      commit(computerCardTurn(previous), previous);
  };
  useEffect(() => {
    if (!playing || !cpu || cardPace(state) !== "steady") return;
    const timer = setTimeout(computerStep, 1600);
    return () => clearTimeout(timer);
    // A single committed revision owns each turn. Interruption cancels it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.id, state.revision, state.pace, cpu, playing]);
  const name = (n: number) => match.names[n];
  const plays = state.game === "crazy-eights" ? legalCardPlays(state) : [];
  const fresh = newCardIds(state, owner);
  const result = state.result;
  const event = state.events?.at(-1);
  const transcript = `cards-${state.game}` as GuidanceKey;
  const title = result
    ? result.winner === "tie"
      ? "A tie!"
      : `${name(result.winner)} ${name(result.winner) === "You" ? "win" : "wins"}!`
    : cpu
      ? `${name(1)}’s turn`
      : state.options.mode === "solo"
        ? "Your turn"
        : `${name(state.turn)}’s turn`;
  const legacyMessage = state.message
    .replace(/Player 1's/g, () => `${name(0)}’s`)
    .replace(/Player 1/g, () => name(0))
    .replace(/Player 2/g, () => name(1));
  const closeHelp = () => {
    setHelp(false);
    onStopInstruction?.();
  };
  const openHelp = () => {
    setReveal(false);
    setWild(null);
    setHelp(true);
  };
  return (
    <View style={s.root}>
      {onBack && <GameHeader title={state.game === "go-fish" ? "Go Fish" : "Crazy Eights"} onBack={onBack}
        sound={onToggleSound ? { on: sound, toggle: onToggleSound } : undefined} onHelp={openHelp} />}
      <Scoreboard solo={state.options.mode === "solo"} match={match} result={cardMatchResult(state)} active={result ? null : state.turn} />
      {state.game === "crazy-eights" && <Copy style={s.small}>Match points · {name(0)} {cardMatchPoints(state)[0]} · {name(1)} {cardMatchPoints(state)[1]}</Copy>}
      <View accessibilityLiveRegion="polite" style={s.notice}>
        <Heading style={{ fontSize: 22 }}>{title}</Heading>
        <Copy style={s.small}>
          {result
            ? state.game === "go-fish"
              ? `${cardRanks(state)} books found. ${result.scores[0]} – ${result.scores[1]}.`
              : `${result.reason === "blocked" ? "No moves remain. Lower hand total wins." : "An empty hand wins."} Points: ${result.scores[0]} – ${result.scores[1]}.`
            : event
              ? cardEventText(event, visible ? owner : null, state.options.mode, match.names)
              : legacyMessage}
        </Copy>
      </View>
      {result && <BadgeResultCard round={state.id}/>}
      {result && <View style={{ gap: 10 }}>
        <View style={{ alignItems: "center" }}><Companion event={resultEvent(cardMatchResult(state), state.options.mode === "solo")}/></View>
        <Button onPress={() => { const previous = latest.current; if (previous.id === state.id && previous.result) newRound(() => commit(rematchCards(previous), previous)); }}>Play again</Button>
        {state.game === "crazy-eights" && <>
          <Button quiet onPress={() => setScoring(!scoring)}>{scoring ? "Hide scoring" : "Show scoring"}</Button>
          {scoring && <View style={s.notice}>
            {([0, 1] as const).filter((n) => result.reason === "blocked" || n !== result.winner).map((n) => <View key={n} style={{ gap: 4 }}>
              <Heading style={{ fontSize: 18 }}>{name(n)}’s remaining hand</Heading>
              {state.hands[n].map((c) => <Copy key={c} style={s.small}>{cardName(c)} · {points(c)} points</Copy>)}
              <Copy style={s.small}>Hand total: {state.hands[n].reduce((sum, c) => sum + points(c), 0)} points.</Copy>
            </View>)}
            <Copy style={s.small}>{result.winner === "tie" ? "Equal hand totals: no points awarded." : `${name(result.winner)} earns ${result.scores[result.winner]} points${result.reason === "blocked" ? " (the difference between hand totals)" : " from the other hand"}.`}</Copy>
          </View>}
        </>}
      </View>}
      <View style={s.table}>
        {state.game === "crazy-eights" ? (
          <>
            <CardFace card={state.discard.at(-1)!} />
            <View style={{ flex: 1, minWidth: 120, gap: 5 }}>
              <Label>Match this card</Label>
              <Heading style={{ fontSize: 20 }}>
                {suitName(state.activeSuit)} or {rankName(rank(state.discard.at(-1)!))}
              </Heading>
              <Copy style={s.small}>Eight = choose any suit</Copy>
              <Copy style={s.small}>
                {state.stock.length} in draw pile · {name(1 - owner)}: {state.hands[1 - owner].length} cards
              </Copy>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, gap: 4 }}>
            <View style={s.tableRow}>
              <Label>Four of a rank = one book</Label>
              <Text style={s.score}>
                {state.books[0].length} : {state.books[1].length}
              </Text>
            </View>
            <Copy style={s.small}>
              {name(0)} / {name(1)} · {state.stock.length} in pond · {state.hands[1 - owner].length} opponent cards
            </Copy>
            <Copy style={s.small}>
              {cardRound(state) === "quick" ? "Quick · A–8 · 8 books" : "Full · A–K · 13 books"}
            </Copy>
          </View>
        )}
      </View>
      {!result && !visible && (
        <View style={s.cover}>
          <Heading style={{ fontSize: 23 }}>Cards are hidden</Heading>
          <Copy>
            {state.options.mode === "together"
              ? `Pass to ${name(owner)}. Everyone else, look away.`
              : "Return to the game to see your hand."}
          </Copy>
          {playing && <Button onPress={() => setReveal(true)}>I’m {name(owner)} · show my cards</Button>}
        </View>
      )}
      {!result && visible && (
        <View style={{ gap: 8 }}>
          <View style={s.tableRow}>
            <Heading style={{ fontSize: 21 }}>
              {state.options.mode === "solo" ? "Your" : `${name(owner)}’s`} hand · {state.hands[owner].length}
            </Heading>
            {state.options.mode === "together" && (
              <Button
                compact
                quiet
                onPress={() => {
                  setReveal(false);
                  setWild(null);
                }}
              >
                Hide
              </Button>
            )}
          </View>
          <Copy style={s.small}>
            {cpu
              ? "Keep your hand in view. Read the turn story, then let the computer play."
              : state.game === "go-fish"
                ? "Tap a card to ask for that rank."
                : "Tap an outlined matching card. Tap an eight to choose a suit."}
          </Copy>
          {state.game === "go-fish" && !cpu && <><Button quiet compact onPress={() => setAdvice(v => !v)}>{advice ? "Hide strategy advice" : "Strategy advice"}</Button>{advice && <View accessibilityLiveRegion="polite"><Copy>{goFishAdvice(cardPublicView(state))}</Copy></View>}</>}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            accessibilityLabel="Your cards. Swipe to see the whole hand."
            style={{ maxWidth: Math.min(850, width) }}
            contentContainerStyle={{ gap: 8, paddingVertical: 5, paddingHorizontal: 3 }}
          >
            {state.hands[owner]
              .slice()
              .sort((a, b) => rank(a) - rank(b) || a - b)
              .map((card) => (
                <CardFace
                  key={card}
                  card={card}
                  fresh={fresh.includes(card)}
                  selected={!cpu && (state.game === "go-fish" || plays.includes(card))}
                  disabled={!canAct || (state.game === "crazy-eights" && !plays.includes(card))}
                  onPress={() => {
                    if (state.game === "go-fish") act({ type: "ask", rank: rank(card) });
                    else if (rank(card) === 8) setWild(card);
                    else act({ type: "play", card });
                  }}
                />
              ))}
          </ScrollView>
          {state.game === "crazy-eights" && canAct && (
            <View style={s.wrap}>
              {state.drawn === null && !plays.length && (state.stock.length || state.discard.length > 1) ? (
                <Button onPress={() => act({ type: "draw" })}>Draw one card</Button>
              ) : null}
              {state.drawn !== null || (!plays.length && !state.stock.length && state.discard.length === 1) ? (
                <Button onPress={() => act({ type: "pass" })}>Finish my turn</Button>
              ) : null}
            </View>
          )}
        </View>
      )}
      {cpu && playing && (
        <Button onPress={computerStep}>
          {cardPace(state) === "step" ? "Let the computer play" : "Computer plays soon · play now"}
        </Button>
      )}
      {!!state.books.flat().length && (
        <View style={s.bookShelf}>
          {([0, 1] as const).map((n) => (
            <View key={n} style={{ gap: 4 }}>
              <Label>{name(n)} books</Label>
              <View style={s.wrap}>
                {state.books[n].length ? (
                  state.books[n].map((r) => (
                    <View key={r} style={s.book}>
                      <Text style={s.score}>{rankName(r)}</Text>
                      <Text style={s.small}>×4</Text>
                    </View>
                  ))
                ) : (
                  <Copy style={s.small}>None yet</Copy>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={s.wrap}>
        {!onBack && <Button compact quiet onPress={openHelp}>How to play</Button>}
        <Button compact quiet onPress={() => setHistory(!history)}>
          {history ? "Hide" : "Turn"} story
        </Button>
        <Button
          compact
          quiet
          onPress={() => {
            setReveal(false);
            setWild(null);
            setMode(state.options.mode);
            setRound(cardRound(state));
            setPace(cardPace(state));
            setNames(match.names);
            setStarter(cardStarter(state));
            setAlternate(match.alternate);
            setSetup(true);
          }}
        >
          {result ? "New match & options" : "Round options"}
        </Button>
      </View>
      {history && (
        <View style={s.notice}>
          <Label>Last four moves · private draws only for their owner</Label>
          {state.events?.length ? (
            state.events
              .slice()
              .reverse()
              .map((e) => (
                <Copy key={e.revision} style={s.small}>
                  {cardEventText(e, visible ? owner : null, state.options.mode, match.names)}
                </Copy>
              ))
          ) : (
            <Copy style={s.small}>Your next move starts the story.</Copy>
          )}
        </View>
      )}
      <Sheet visible={wild !== null && canAct} title="Choose the next suit" onClose={() => setWild(null)}>
        <Copy>An eight is wild. Choose what your partner must match.</Copy>
        <View style={s.wrap}>
          {SUITS.map((kind) => (
            <Button
              key={kind}
              quiet
              onPress={() => {
                if (wild !== null) act({ type: "play", card: wild, suit: kind });
                setWild(null);
              }}
            >
              {suitName(kind)}
            </Button>
          ))}
        </View>
      </Sheet>
      <Sheet
        visible={help}
        title={state.game === "go-fish" ? "Go Fish · watch, ask, collect" : "Crazy Eights · match, draw, finish"}
        onClose={closeHelp}
      >
        <Copy>{QUALITY_GUIDANCE[transcript]}</Copy>
        {onSpeakInstruction && (
          <Button disabled={!sound} onPress={() => onSpeakInstruction(transcript)}>
            Listen to the instructions
          </Button>
        )}
        {onStopInstruction && (
          <Button quiet onPress={onStopInstruction}>
            Stop reading
          </Button>
        )}
        {state.game === "go-fish" ? (
          <>
            <View style={s.tableRow}>
              {[5, 18, 31, 44].map((card) => (
                <CardFace key={card} card={card} />
              ))}
            </View>
            <Heading style={{ fontSize: 21 }}>Four sixes make a book.</Heading>
            <Copy>
              Ask for any rank in your hand. Receive matching cards? Ask again. If the other player has none, draw one.
              If it is the rank you asked for, ask again. Otherwise your turn ends. An empty hand refills while the pond
              has cards. When the pond is empty, an empty-handed player waits. Most books wins after every rank is
              collected.
            </Copy>
          </>
        ) : (
          <>
            <Copy>
              Example: on a six of shells, play any six, any shell, or an eight. You cannot draw while holding a
              playable card. After drawing, only that new card can be played; you may instead finish the turn. There are
              no skip, stacking or draw-two cards.
            </Copy>
            <Copy>
              First empty hand wins. The winner receives the other hand’s points. If stock runs out, used cards shuffle except the top. If both are
              blocked, the lower total wins the difference; equal totals tie.
            </Copy>
            <Copy>{"Eights: 50 points\nPicture cards: 10 points\nAces: 1 point\nNumber cards: their number"}</Copy>
          </>
        )}
        <Copy>
          Quick: 32 cards, ranks A–8, five cards each. Full: 52 cards, ranks A–K, seven each. The same rules apply to both
          players. Computer choices use only its own cards and public information.
        </Copy>
        <Copy>
          Step pace waits for your Let the computer play button. Steady pace takes one computer action about
          every 1.6 seconds. Turn story keeps the last four actions. Private draws are concealed during handoff. All
          progress saves on this device.
        </Copy>
      </Sheet>
      <Sheet visible={setup} title={roundPractice?.pending ? "A little practice, then play" : "Round options"} onClose={() => roundPractice?.pending ? roundPractice.cancel() : setSetup(false)} footer={roundPractice?.pending ? undefined :
        <Button onPress={() => newRound(() => {
          const previous = latest.current;
          const freshMatch = newMatch(names.map((n, i) => n.trim() || (mode === "solo" ? ["You", "Computer"][i] : `Player ${i + 1}`)), alternate);
          store.rememberPlayers(freshMatch.names.filter((n) => n !== "Computer" && n !== "You"));
          commit(createCardSession(state.game, { ...state.options, mode, computerFirst: starter === 1 }, undefined, undefined,
            { round, pace, match: freshMatch, starter }), previous);
          setSetup(false);
        })}>Deal {round === "quick" ? "five" : "seven"} cards each · new match</Button>
      }>
        {roundPractice?.pending ? roundPractice.content : <>
        <Heading style={{ fontSize: 21 }}>Who is playing?</Heading>
        <View style={s.wrap}>
          <Button quiet selected={mode === "solo"} onPress={() => { setMode("solo"); setNames([names[0] === "Player 1" ? "You" : names[0], names[1] === "Player 2" ? "Computer" : names[1]]); }}>
            Play computer
          </Button>
          <Button quiet selected={mode === "together"} onPress={() => { setMode("together"); setNames([names[0] === "You" ? "" : names[0], names[1] === "Computer" ? "" : names[1]]); }}>
            Two players
          </Button>
        </View>
        <PlayerNames names={names} onChange={setNames} remembered={store.save.players} labels={mode === "solo" ? ["Your name (optional)", "Computer name (optional)"] : undefined} />
        <Heading style={{ fontSize: 21 }}>Who starts this match?</Heading>
        <View style={s.wrap}>{([0, 1] as const).map((seat) => <Button key={seat} quiet selected={starter === seat} onPress={() => setStarter(seat)}>{names[seat] || (mode === "solo" ? ["You", "Computer"][seat] : `Player ${seat + 1}`)}</Button>)}</View>
        <ToggleRow label="Take turns starting" detail="Swap who goes first after each round" value={alternate} onChange={setAlternate} />
        <Copy style={s.small}>Dealing here starts a new match with zero wins and points. Play again keeps your tally.</Copy>
        <Heading style={{ fontSize: 21 }}>How much time?</Heading>
        <View style={s.wrap}>
          <Button quiet selected={round === "quick"} onPress={() => setRound("quick")}>
            Quick · 32 cards
          </Button>
          <Button quiet selected={round === "full"} onPress={() => setRound("full")}>
            Full · 52 cards
          </Button>
        </View>
        <Copy>
          Quick uses A–8 and 5 cards each; Full uses A–K and 7 each. Choosing either replaces this saved round when you deal.
        </Copy>
        <Heading style={{ fontSize: 21 }}>Computer pace</Heading>
        <View style={s.wrap}>
          <Button quiet selected={pace === "step"} onPress={() => setPace("step")}>
            I choose when
          </Button>
          <Button quiet selected={pace === "steady"} onPress={() => setPace("steady")}>
            Steady
          </Button>
        </View>
        <Button
          quiet
          onPress={() => {
            const previous = latest.current;
            commit(setCardPace(previous, pace), previous);
            setSetup(false);
          }}
        >
          Keep hand · apply pace
        </Button>
        </>}
      </Sheet>
      {!setup && roundPractice?.panel}
    </View>
  );
}
const s = StyleSheet.create({
  root: { width: "100%", maxWidth: 850, alignSelf: "center", gap: 10 },
  notice: { backgroundColor: "#E7EFE3", padding: 12, borderRadius: 18, gap: 6 },
  table: {
    backgroundColor: "#F1ECD9",
    padding: 12,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  tableRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  small: { fontSize: 14, lineHeight: 21, color: C.ink },
  score: { fontSize: 20, fontWeight: "800", color: C.ink },
  card: {
    width: 68,
    minHeight: 96,
    borderRadius: 12,
    backgroundColor: C.paper,
    padding: 7,
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  rank: { fontFamily: font, fontWeight: "800", fontSize: 22 },
  suit: { fontSize: 11, color: C.ink },
  bookShelf: { padding: 10, backgroundColor: "#F5F0DF", borderRadius: 16, gap: 8 },
  book: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#D5D8C8",
    padding: 6,
    borderRadius: 9,
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  cover: { backgroundColor: "#F0E8D5", padding: 16, borderRadius: 18, gap: 10 },
});
