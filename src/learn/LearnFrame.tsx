import { BadgeResultCard } from '../badges/ResultCard';
import { isMathGame, type MathRound } from "./games/shell-math/round";
import { Companion, LearningCompanion, PhoneLearningCompanion, useCompanionReaction } from "../islander/Companion";
import { LearnerChip } from "../personalization/LearnerChip";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AppState, ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useIsFocused } from "expo-router";
import { useStore } from "../state/Store";
import { useSoundControls } from "../components/Audio";
import { SaveStatus } from "../components/SaveStatus";
import { Button, C, Chip, Copy, GameHeader, Heading, Sheet, ToggleRow, styles } from "../components/ui";
import { PlayerNames, Scoreboard } from "../components/Match";
import type { Seat } from "../games/match";
import { engines } from "./engines";
import { GrowthBoard } from "./growth/Board";
import { growthProgress, growthQuestions } from "./growth/engine";
import type { GrowthState } from "./growth/types";
import { LevelPath } from "./LevelPath";
import { levelOf, levelTitle, optionsAtLevel, levelStage, type LearningLevel } from "./levels";
import { activeLearner, readyForNext } from "./learners";
import { views } from "./views";
import { Celebrate } from "./Celebrate";
import { IslandBackdrop, RoundProgress, subjectTheme } from "./LearnChrome";
import { LearnArt } from "./LearnArt";
import { feel } from "../components/feel";
import { outcomeOf, replaySession, startSession } from "./session";
import type { Language, LearnId, LearnMode, LearnOptions, LearnSession, Pace } from "./types";

export const modeLabel: Record<LearnMode, string> = {
  solo: "On my own",
  together: "With a grown-up",
  versus: "Take turns · keep score",
};
export const paceLabel: Record<Pace, string> = { easy: "Gentle", medium: "Growing", hard: "Challenge" };
const languageLabel: Record<Language, string> = { en: "English", ch: "CHamoru" };

/**
 * The shared frame for every learning game: compact header, setup (mode, names, who starts,
 * pace, language), help with spoken instructions, family score, Play again and saving.
 * Each game supplies only its pure engine and its Board.
 */
export function LearnFrame({ id }: { id: LearnId }) {
  const store = useStore(),
    focused = useIsFocused(),
    insets = useSafeAreaInsets(),
    { width, height } = useWindowDimensions();
  const engine = engines[id],
    view = views[id];
  const saved = store.save.learn?.[id];
  const scroll = useRef<ScrollView | null>(null);
  const growthState = saved?.options.stage && !engine.ownLevels ? saved.state as GrowthState : undefined;
  const growthStep = saved && growthState ? growthProgress(growthState, growthQuestions(id, saved.options, growthState)).index : engine.ownLevels && saved ? (saved.state as { index?: number }).index : undefined;
  useLayoutEffect(() => {
    if (growthStep !== undefined) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [growthStep, saved?.id]);
  const learner = activeLearner(store.save.learning);
  const learningSkills = learner.id === "family" ? store.save.skills : learner.skills;
  const epoch = store.epoch;
  const acceptedRound = useRef(saved);
  useLayoutEffect(() => { acceptedRound.current = saved; }, [saved]);
  const roundHelped = useRef(false);
  useLayoutEffect(() => { roundHelped.current = saved?.levelHelped ?? false; }, [saved?.id, saved?.levelHelped]);
  const expected = useRef<{ id: string | null; revision?: number }>({ id: saved?.id ?? null, revision: saved?.revision });
  useLayoutEffect(() => { expected.current = { id: saved?.id ?? null, revision: saved?.revision }; }, [epoch, saved?.id, saved?.revision]);
  const remembered = store.save.players ?? [];
  const [setup, setSetup] = useState(false),
    [help, setHelp] = useState(false),
    [options, setOptions] = useState<LearnOptions>(
      (saved && (saved.learner ?? "family") === learner.id ? saved.options : learner.choices[id]) ?? { mode: engine.modes[0], pace: "easy", ...(engine.languages ? { language: engine.languages[0] } : {}) }
    ),
    [names, setNames] = useState<[string, string]>(
      saved?.names && !saved.names.every((n, i) => n === `Player ${i + 1}`) ? saved.names : ["", ""]
    ),
    [starter, setStarter] = useState<Seat>(0),
    [alternate, setAlternate] = useState(saved?.match?.alternate ?? true),
    [appActive, setAppActive] = useState(AppState.currentState === "active" || AppState.currentState == null);
  const identity = `${learner.id}:${epoch}`;
  const previousIdentity = useRef(identity);
  useLayoutEffect(() => {
    if (previousIdentity.current === identity) return;
    previousIdentity.current = identity;
    // Keep the options/help sheet open, but use this learner's own learning choices.
    setOptions((saved && (saved.learner ?? "family") === learner.id ? saved.options : learner.choices[id]) ?? { mode: engine.modes[0], pace: "easy", ...(engine.languages ? { language: engine.languages[0] } : {}) });
  }, [identity, saved, learner, id, engine]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => setAppActive(state === "active"));
    return () => sub.remove();
  }, []);
  const soundOn = store.save.settings.sound && (store.save.settings.narration ?? true);
  const { play: sound, stop: stopSound } = useSoundControls(store.save.settings.sound && focused);
  const result = saved ? outcomeOf(saved) : null,
    finished = result !== null,
    notWon = saved && result === "done" && engine.notWon ? engine.notWon(saved.state, saved.options) : null,
    wasFinished = useRef(finished);
  useLayoutEffect(() => {
    if (finished) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [finished, saved?.id]);
  // Celebrations: a small burst on right answers, a big one when the round is won or completed.
  // A round the island friend or tide won ends calmly; the board says who got there first.
  const [burst, setBurst] = useState({ n: 0, big: false });
  useEffect(() => {
    if (finished && !wasFinished.current && !notWon) {
      sound("win");
      setBurst((b) => ({ n: b.n + 1, big: true }));
    }
    wasFinished.current = finished;
  }, [finished, notWon, sound]);

  // First-move coaching: shown the first time a child opens this game, and again from Help.
  const [replayCoach, setReplayCoach] = useState(false);
  const coachActive = !!saved && !finished && (replayCoach || !(store.save.coached ?? []).includes(id));
  const { markCoached } = store;
  const coachDone = useCallback(() => {
    setReplayCoach(false);
    markCoached(id);
  }, [markCoached, id, setReplayCoach]);
  const cheerLine = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const boardActive = appActive && focused && !setup && !help,
    savedId = saved?.id;
  useEffect(() => {
    if (!boardActive) stopSound();
  }, [boardActive, stopSound]);
  // A falling object can retain a callback after mute, Help or a round change. Invalidate
  // that callback too, rather than only cancelling speech it had already scheduled.
  const audioSettings = store.save.settings;
  const feedbackContext = useMemo(() => ({ boardActive, soundOn, savedId, audioSettings }), [boardActive, soundOn, savedId, audioSettings]);
  const liveFeedback = useRef<object | null>(feedbackContext);
  useLayoutEffect(() => {
    liveFeedback.current = feedbackContext;
    return () => {
      liveFeedback.current = null;
      clearTimeout(cheerLine.current);
    };
  }, [feedbackContext]);
  const { event: companionEvent, react: reactCompanion } = useCompanionReaction(`${learner.id}:${saved?.id ?? "setup"}`, boardActive);
  const cheer = useCallback(
    (kind: "right" | "big" = "right", say?: string) => {
      if (!boardActive || liveFeedback.current !== feedbackContext) return;
      reactCompanion("correct");
      setBurst((b) => ({ n: b.n + 1, big: kind === "big" }));
      sound(kind === "big" ? "win" : "match");
      if (kind === "big") feel("success");
      clearTimeout(cheerLine.current);
      if (say) cheerLine.current = setTimeout(() => {
        if (liveFeedback.current === feedbackContext) sound(say, true);
      }, kind === "big" ? 900 : 550);
    },
    [sound, boardActive, feedbackContext, reactCompanion]
  );
  // A newer sound, a new round, sound off, Help or leaving the screen drops a pending cheer line.
  const boardSound = useCallback(
    (key: string, automatic = false) => {
      if (!boardActive || liveFeedback.current !== feedbackContext) return;
      clearTimeout(cheerLine.current);
      sound(key, automatic);
    },
    [sound, boardActive, feedbackContext]
  );
  // Say the game's goal once when a fresh round opens, so a non-reader knows what to do.
  const introduced = useRef<string | null>(null);
  useEffect(() => {
    if (!saved || !engine.introAudio || !soundOn || !boardActive || (saved.options.stage && !engine.ownLevels)) return;
    if (saved.revision !== 0 || introduced.current === saved.id) return;
    introduced.current = saved.id;
    const timer = setTimeout(() => sound(engine.introAudio!, true), 450);
    return () => clearTimeout(timer);
  }, [saved, engine.introAudio, engine.ownLevels, soundOn, boardActive, sound]);

  const { learnUpdate, practiceOwned } = store;
  const save = useCallback(
    (next: LearnSession) => {
      if (next.id === expected.current.id && roundHelped.current) next = { ...next, levelHelped: true };
      const accepted = learnUpdate(id, next, { ...expected.current, epoch });
      if (accepted) { expected.current = { id: next.id, revision: next.revision }; acceptedRound.current = next; }
      return accepted;
    },
    [learnUpdate, id, epoch]
  );
  const assistance = useCallback(() => {
    if (!saved || expected.current.id !== saved.id || !appActive || !focused || roundHelped.current) return;
    roundHelped.current = true;
    const current = acceptedRound.current ?? saved;
    save({ ...current, levelHelped: true, revision: Math.max(current.revision, expected.current.revision ?? 0) + 1 });
  }, [saved, appActive, focused, save]);
  const practice = useCallback((skill: string, correct: boolean) => {
    if (!saved || !boardActive) return;
    reactCompanion(correct ? "correct" : "incorrect");
    practiceOwned(id, { id: saved.id, revision: saved.revision, epoch }, skill, correct);
    if (!correct) assistance();
  }, [saved, boardActive, practiceOwned, id, epoch, assistance, reactCompanion]);
  const update = useCallback(
    (state: unknown) => {
      if (!saved || expected.current.id !== saved.id || !boardActive || store.epoch !== epoch) return;
      const revision = Math.max(saved.revision, expected.current.revision ?? 0) + 1;
      if (save({ ...saved, state, revision })) {
        if (saved.options.stage && !engine.ownLevels) {
          const next = state as GrowthState;
          if (next.history.at(-1)?.type === "answer" && next.history !== (saved.state as GrowthState).history) {
            const progress = growthProgress(next, growthQuestions(id, saved.options, next));
            reactCompanion(progress.solved ? "correct" : "incorrect");
          }
        } else if (isMathGame(id) && (state as MathRound).wrong !== null && !(state as MathRound).solved) reactCompanion("incorrect");
      }
    },
    [saved, save, boardActive, store.epoch, epoch, id, reactCompanion, engine.ownLevels]
  );

  function start() {
    const next = startSession(id, { options, names, starter: options.mode === "solo" ? 0 : starter, alternate }, learningSkills);
    next.learner = learner.id;
    if (options.mode !== "solo") store.rememberPlayers(names);
    if (save(next)) { stopSound(); setBurst({ n: 0, big: false }); setSetup(false); }
  }
  function replay() {
    if (!saved || !finished) return;
    // A different learner starts with their own remembered choices, never the other child's level.
    const next = (saved.learner ?? "family") === learner.id
      ? replaySession(saved, learningSkills, undefined, learner.id)
      : startSession(id, { options: learner.choices[id] ?? { mode: engine.modes[0], pace: "easy", ...(engine.languages ? { language: engine.languages[0] } : {}) } }, learningSkills);
    next.learner = learner.id;
    if (save(next)) { stopSound(); setBurst({ n: 0, big: false }); }
  }
  function openSetup() {
    if (saved) {
      setOptions((saved.learner ?? "family") === learner.id ? saved.options : learner.choices[id] ?? { mode: engine.modes[0], pace: "easy", ...(engine.languages ? { language: engine.languages[0] } : {}) });
      setAlternate(saved.match?.alternate ?? true);
      setStarter(saved.starter ?? 0);
    }
    setSetup(true);
  }
  const [stay, setStay] = useState<string | null>(null);
  function chooseLevel(level: LearningLevel, base = options) {
    stopSound();
    sound(`learning-level-${level}`);
    setOptions(optionsAtLevel(base, level));
  }
  const canSuggest = !!saved && finished && saved.options.mode === "solo" && (saved.learner ?? "family") === learner.id && levelOf(saved.options) < 5 && stay !== saved.id && readyForNext(learner, id, levelStage(saved.options));
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const twoPlayer = options.mode !== "solo";
  const turn = saved && engine.turn && saved.options.mode !== "solo" && !finished ? engine.turn(saved.state, saved.options) : null;
  const boardWidth = Math.min(width - insets.left - insets.right - 56, 900);
  const Board = saved?.options.stage && !engine.ownLevels ? GrowthBoard : view.Board;
  const island = id === "hafa-adai" ? "reading" : engine.island;
  const theme = id === "hafa-adai" ? { sky: "#FFE4D9", land: "#F5BCA6", accent: "#A44E3A", ink: "#65382D" } : subjectTheme[island];
  const cheerText = companionEvent === "correct" ? "You got it!" : companionEvent === "incorrect" ? "Try again!" : companionEvent === "entry" ? "Let's play!" : null;
  const modeText = saved ? (engine.modeLabels?.[saved.options.mode] ?? modeLabel[saved.options.mode]) +
    (!saved.options.stage && engine.mathControls ? ` · ${saved.options.mathOperation === "mixed" ? "Add & subtract" : saved.options.mathOperation === "subtract" ? "Subtract" : "Add"}` : "") +
    (saved.options.language && engine.languages && engine.languages.length > 1 ? ` · ${languageLabel[saved.options.language]}` : "") : "";

  const header = <View style={{ gap: 4 }}>
        <LearnerChip compact/>
        <GameHeader
          title={id === "hafa-adai" && width < 600 ? "Håfa Adai" : engine.name}
          onBack={back}
          sound={{ on: store.save.settings.sound, toggle: () => store.settings({ sound: !store.save.settings.sound }) }}
          onHelp={() => setHelp(true)}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <view.Art size={width < 600 ? 36 : 48} />
          <Heading style={{ fontSize: width < 600 ? 19 : 25, flex: 1, minWidth: 0, color: theme.ink }}>{levelTitle(id, levelOf(saved?.options ?? options))}</Heading>
          {width < 600 && saved && !finished && <PhoneLearningCompanion event={companionEvent} active={boardActive}/>}
        </View>
        {width < 600 && saved && <Copy style={{ fontSize: 12, color: theme.ink, backgroundColor: theme.sky, alignSelf: "flex-start", paddingHorizontal: 4 }}>{modeText}</Copy>}
        {width < 600 && cheerText && saved && !finished && <View accessibilityLiveRegion="polite" style={{ alignSelf: "flex-end", backgroundColor: C.paper, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5 }}><Copy style={{ color: theme.ink, fontWeight: "900" }}>{cheerText}</Copy></View>}

  </View>;

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.sky }]}>
      <IslandBackdrop island={island} colors={theme}/>
      {width < 600 && <View style={{ paddingHorizontal: 16 }}>{header}</View>}
      <ScrollView key={saved?.id ?? "setup"} ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { maxWidth: 1280, paddingHorizontal: 16 }]}>
        {width >= 600 && header}
        {width >= 600 && saved && (
          <Copy style={{ fontSize: 12, marginBottom: 8 }}>
            {(engine.modeLabels?.[saved.options.mode] ?? modeLabel[saved.options.mode]) +
              (!saved.options.stage && engine.mathControls ? ` · ${saved.options.mathOperation === "mixed" ? "Add & subtract" : saved.options.mathOperation === "subtract" ? "Subtract" : "Add"}` : "") +
              (saved.options.language && engine.languages && engine.languages.length > 1 ? ` · ${languageLabel[saved.options.language]}` : "")}
          </Copy>
        )}
        {saved && <RoundProgress session={saved} island={island} colors={theme} finished={finished}/>}
        <SaveStatus />
        {saved?.match && <Scoreboard match={saved.match} result={result === "done" ? null : result} active={turn} />}
        {saved && !finished && (
          <LearningCompanion visible={!finished} event={finished ? (notWon ? "loss" : result === "draw" ? "draw" : "complete") : companionEvent} desk={engine.island === "reading" || engine.island === "numbers"} active={boardActive} cheer={cheerText ? <View accessibilityLiveRegion="polite" style={{ backgroundColor: C.paper, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 2, borderColor: theme.accent }}><Copy style={{ color: theme.ink, fontWeight: "900" }}>{cheerText}</Copy></View> : undefined}>
          <View style={{ backgroundColor: "#FFFEFA", borderRadius: 28, borderWidth: 2, borderColor: theme.accent, padding: width < 600 ? 12 : 22, shadowColor: theme.ink, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 7 }, shadowRadius: 0, elevation: 5 }}>
            <Celebrate burst={burst.n} big={burst.big} />
            <Board
              key={saved.id}
              session={saved}
              update={update}
              practice={practice}
              notePractice={store.notePractice}
              assistance={assistance}
              skills={learningSkills ?? {}}
              sound={boardSound}
              stopSound={stopSound}
              soundOn={soundOn}
              width={boardWidth - (width >= 768 && height >= 600 && store.save.settings.learningIslander !== false ? 88 : 0)}
              height={height - insets.top - insets.bottom}
              active={boardActive}
              coach={{ active: coachActive && boardActive, done: coachDone }}
              cheer={cheer}
            />
          </View>
          </LearningCompanion>
        )}
        {saved && (
          <View style={{ alignItems: "center", gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.line }}>
            {finished && (
              <View
                accessibilityLiveRegion="polite"
                style={{ alignItems: "center", justifyContent: "center", gap: 14, padding: 20, borderRadius: 28, backgroundColor: theme.sky, alignSelf: "stretch", minHeight: Math.max(430, height - insets.top - insets.bottom - 190), borderWidth: 3, borderColor: theme.accent }}
              >
                <View pointerEvents="none" style={{ position: "absolute", top: 10, left: 0, right: 0, alignItems: "center" }}><Celebrate burst={burst.n} big /></View>
                {!notWon && <Heading style={{ color: theme.accent, fontSize: 38, textAlign: "center" }}>★  ★  ★</Heading>}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  {store.save.settings.learningIslander !== false && <Companion event={notWon ? "loss" : result === "draw" ? "draw" : "complete"} active={boardActive} size={166}/>}
                  {engine.ownLevels ? <view.Art size={86} /> : <LearnArt island={engine.island} size={86} />}
                </View>
                <Heading style={{ fontSize: 26, textAlign: "center" }}>
                  {result === 0 || result === 1
                    ? `${saved.match?.names[result] ?? saved.names?.[result] ?? "You"} won this round!`
                    : result === "draw"
                      ? "A tie! Great playing."
                      : (notWon ?? "You did it!")}
                </Heading>
                <Copy style={{ color: theme.ink, fontSize: 17, fontWeight: "800", textAlign: "center" }}>{notWon ? "Ready to try the island again?" : "Your stars are shining. Ready for another adventure?"}</Copy>
                {canSuggest && <View style={{ alignSelf: "stretch", gap: 10 }}>
                  <Heading style={{ fontSize: 22, textAlign: "center" }}>Try Level {levelOf(saved.options) + 1}?</Heading>
                  <Copy style={{ textAlign: "center" }}>You worked this level out on your own in rounds on two different days. You can stay and play here, too.</Copy>
                  <Button quiet onPress={() => { chooseLevel((levelOf(saved.options) + 1) as LearningLevel, saved.options); setSetup(true); }}>Try Level {levelOf(saved.options) + 1}?</Button>
                  <Button quiet onPress={() => { stopSound(); setStay(saved.id); }}>Stay here</Button>
                  <Button quiet compact icon="sound-on" disabled={!soundOn} onPress={() => sound(`learning-try-level-${levelOf(saved.options) + 1}`)}>Hear the invitation</Button>
                </View>}
                <Button icon="right" onPress={replay} style={{ minWidth: 220, minHeight: 62, backgroundColor: theme.accent, borderColor: theme.accent }}>
                  Keep going
                </Button>
              </View>
            )}
            {finished && <BadgeResultCard round={saved.id}/>}
            {(saved.learner ?? "family") !== learner.id && <Copy style={{ textAlign: "center" }}>This saved round belongs to {store.save.learning?.people.find(p => p.id === (saved.learner ?? "family"))?.name ?? "Family practice"}. New rounds use {learner.name}.</Copy>}
            {/* Options are for grown-ups and changing modes; kept small so it's never the obvious tap mid-game. */}
            <Button compact quiet onPress={openSetup}>
              New round & options
            </Button>
            <Copy style={{ fontSize: 12, marginTop: 4, textAlign: "center" }}>Your round saves on this device.</Copy>
          </View>
        )}
      </ScrollView>
      <Sheet
        visible={setup || !saved}
        onClose={() => (saved ? setSetup(false) : back())}
        title={saved ? "A fresh round" : `Let’s play ${engine.name}`}
        footer={<Button onPress={start} style={{ minHeight: 62, borderRadius: 20, backgroundColor: theme.accent, borderColor: theme.accent }}>Play this level</Button>}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: theme.sky, padding: 12, borderRadius: 22 }}><view.Art size={72}/><View style={{ flex: 1 }}><Heading style={{ fontSize: 21, color: theme.ink }}>{engine.name}</Heading><Copy style={{ color: theme.ink, fontSize: 14 }}>Pick a stepping stone, then play.</Copy></View></View>
        <LearnerChip compact/>
        <Copy>{saved && !finished ? "Starting a new round replaces this round. Your other games stay saved." : options.stage && !engine.ownLevels ? "Choose a skill to explore. Pictures and help stay available at every level." : engine.description}</Copy>
        <LevelPath game={id} level={levelOf(options)} onChoose={chooseLevel} />
        {engine.modes.length > 1 && (
          <>
            <Heading style={{ fontSize: 18 }}>How shall we play?</Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {engine.modes.map((mode) => (
                <Chip key={mode} selected={options.mode === mode} onPress={() => setOptions({ ...options, mode })}>
                  {engine.modeLabels?.[mode] ?? modeLabel[mode]}
                </Chip>
              ))}
            </View>
          </>
        )}
        {twoPlayer && (
          <>
            <PlayerNames names={names} onChange={setNames} remembered={remembered} labels={["First player", "Second player"]} />
            <Heading style={{ fontSize: 18 }}>Who goes first?</Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {([0, 1] as const).map((seat) => (
                <Chip key={seat} selected={starter === seat} onPress={() => setStarter(seat)}>
                  {names[seat].trim() || `Player ${seat + 1}`}
                </Chip>
              ))}
            </View>
            {options.mode === "versus" && (
              <ToggleRow label="Take turns starting" detail="Swap who goes first after each round" value={alternate} onChange={setAlternate} />
            )}
          </>
        )}
        {!options.stage && engine.mathControls && (
          <>
            <Heading style={{ fontSize: 18 }}>What shall we practise?</Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {(["add", "subtract", "mixed"] as const).map((operation) => (
                <Chip key={operation} selected={(options.mathOperation ?? "add") === operation} onPress={() => setOptions({ ...options, mathOperation: operation })}>
                  {operation === "add" ? "Add" : operation === "subtract" ? "Subtract" : "Add & subtract"}
                </Chip>
              ))}
            </View>
          </>
        )}
        {!options.stage && engine.languages && engine.languages.length > 1 && (
          <>
            <Heading style={{ fontSize: 18 }}>Words in</Heading>
            <View style={[styles.row, { flexWrap: "wrap" }]}>
              {engine.languages.map((language) => (
                <Chip key={language} selected={options.language === language} onPress={() => setOptions({ ...options, language })}>
                  {languageLabel[language]}
                </Chip>
              ))}
            </View>
          </>
        )}
      </Sheet>
      <Sheet visible={help} onClose={() => { stopSound(); setHelp(false); }} title={`How to play ${engine.name}`}>
        <Copy>{saved?.options.stage && !engine.ownLevels ? "Read or hear the question, then choose an answer or put the pieces in order. Show me explains the idea and counts as helped practice. Take your time, then tap Next idea. Pictures and demonstrations stay available at every stage." : engine.help}</Copy>
        {!(saved?.options.stage && !engine.ownLevels) && engine.helpAudio && (
          <>
            <Button icon="sound-on" onPress={() => sound(engine.helpAudio!)} disabled={!soundOn}>
              Hear a quick guide
            </Button>
            {!soundOn && <Copy>Turn sound on to hear the instructions.</Copy>}
          </>
        )}
        {saved && !finished && (
          <Button
            icon="help"
            onPress={() => {
              stopSound();
              setHelp(false);
              assistance();
              setReplayCoach(true);
            }}
          >
            Show me how
          </Button>
        )}
        <Button
          quiet
          onPress={() => {
            stopSound();
            setHelp(false);
            openSetup();
          }}
        >
          Choose a fresh round
        </Button>
      </Sheet>
    </SafeAreaView>
  );
}
